-- ============================================================
-- D.R.I.V.E. v1.2 – Mitarbeiter-Anmeldung
-- Im Supabase SQL Editor komplett ausführen.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.employee_credentials (
  employee_id text primary key references public.employees(id) on delete cascade,
  password_hash text not null,
  must_change boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_sessions (
  token uuid primary key default gen_random_uuid(),
  employee_id text not null references public.employees(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists employee_sessions_employee_idx
  on public.employee_sessions(employee_id);

create index if not exists employee_sessions_expiry_idx
  on public.employee_sessions(expires_at);

alter table public.employee_credentials enable row level security;
alter table public.employee_sessions enable row level security;

-- Keine direkten anon-Policies für Passwort-/Sessiontabellen.
revoke all on public.employee_credentials from anon, authenticated;
revoke all on public.employee_sessions from anon, authenticated;

-- ------------------------------------------------------------
-- Helfer: besitzt Mitarbeiter eine Berechtigung?
-- ------------------------------------------------------------
create or replace function public.drive_employee_has_permission(
  p_employee_id text,
  p_permission text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((r.permissions ->> p_permission)::boolean, false)
  from public.employee_roles er
  join public.roles r on r.id = er.role_id
  join public.employees e on e.id = er.employee_id
  where er.employee_id = p_employee_id
    and e.active = true
  limit 1;
$$;

-- ------------------------------------------------------------
-- Status / einmalige Ersteinrichtung
-- ------------------------------------------------------------
create or replace function public.drive_auth_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has boolean;
  v_candidates jsonb;
begin
  select exists(select 1 from public.employee_credentials) into v_has;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'name', trim(e.first_name || ' ' || e.last_name)
  ) order by e.last_name, e.first_name), '[]'::jsonb)
  into v_candidates
  from public.employees e
  join public.employee_roles er on er.employee_id = e.id
  join public.roles r on r.id = er.role_id
  where e.active = true
    and r.locked = true;

  return jsonb_build_object(
    'has_credentials', v_has,
    'setup_candidates', v_candidates
  );
end;
$$;

create or replace function public.drive_initial_owner_setup(
  p_employee_id text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed boolean;
  v_token uuid;
begin
  if length(coalesce(p_password,'')) < 4 then
    raise exception 'Mindestens 4 Zeichen verwenden.';
  end if;

  if exists(select 1 from public.employee_credentials) then
    raise exception 'Die Ersteinrichtung wurde bereits abgeschlossen.';
  end if;

  select exists(
    select 1
    from public.employees e
    join public.employee_roles er on er.employee_id = e.id
    join public.roles r on r.id = er.role_id
    where e.id = p_employee_id
      and e.active = true
      and r.locked = true
  ) into v_allowed;

  if not v_allowed then
    raise exception 'Nur ein aktiver Geschäftsinhaber kann die Ersteinrichtung abschließen.';
  end if;

  insert into public.employee_credentials(employee_id,password_hash,must_change,updated_at)
  values (p_employee_id, crypt(p_password, gen_salt('bf', 10)), false, now());

  delete from public.employee_sessions where expires_at <= now();

  insert into public.employee_sessions(employee_id)
  values (p_employee_id)
  returning token into v_token;

  return jsonb_build_object('ok',true,'token',v_token);
end;
$$;

-- ------------------------------------------------------------
-- Login
-- ------------------------------------------------------------
create or replace function public.drive_login(
  p_employee_id text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cred public.employee_credentials%rowtype;
  v_employee public.employees%rowtype;
  v_token uuid;
begin
  select * into v_employee
  from public.employees
  where id = p_employee_id
    and active = true;

  if not found then
    raise exception 'Mitarbeiter nicht gefunden oder nicht aktiv.';
  end if;

  select * into v_cred
  from public.employee_credentials
  where employee_id = p_employee_id;

  if not found then
    raise exception 'Für diesen Mitarbeiter wurde noch keine vorläufige PIN eingerichtet.';
  end if;

  if crypt(p_password, v_cred.password_hash) <> v_cred.password_hash then
    raise exception 'PIN oder Passwort ist falsch.';
  end if;

  delete from public.employee_sessions where expires_at <= now();

  insert into public.employee_sessions(employee_id)
  values (p_employee_id)
  returning token into v_token;

  return jsonb_build_object(
    'ok', true,
    'token', v_token,
    'employee_id', p_employee_id,
    'must_change', v_cred.must_change
  );
end;
$$;

-- ------------------------------------------------------------
-- Session-Kontext
-- ------------------------------------------------------------
create or replace function public.drive_session_context(
  p_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id text;
  v_employee public.employees%rowtype;
  v_role_id text;
  v_role_name text;
  v_permissions jsonb;
  v_must_change boolean;
begin
  select s.employee_id into v_employee_id
  from public.employee_sessions s
  where s.token = p_token
    and s.expires_at > now();

  if not found then
    raise exception 'Sitzung ist abgelaufen. Bitte neu anmelden.';
  end if;

  select * into v_employee
  from public.employees
  where id = v_employee_id
    and active = true;

  if not found then
    raise exception 'Mitarbeiter ist nicht mehr aktiv.';
  end if;

  select er.role_id, r.name, r.permissions
  into v_role_id, v_role_name, v_permissions
  from public.employee_roles er
  join public.roles r on r.id = er.role_id
  where er.employee_id = v_employee_id
  limit 1;

  select c.must_change into v_must_change
  from public.employee_credentials c
  where c.employee_id = v_employee_id;

  return jsonb_build_object(
    'employee_id', v_employee_id,
    'employee_name', trim(v_employee.first_name || ' ' || v_employee.last_name),
    'role_id', v_role_id,
    'role_name', coalesce(v_role_name,''),
    'permissions', coalesce(v_permissions,'{}'::jsonb),
    'must_change', coalesce(v_must_change,false)
  );
end;
$$;

-- ------------------------------------------------------------
-- Eigene PIN / eigenes Passwort ändern
-- ------------------------------------------------------------
create or replace function public.drive_change_password(
  p_token uuid,
  p_old_password text,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id text;
  v_cred public.employee_credentials%rowtype;
begin
  if length(coalesce(p_new_password,'')) < 4 then
    raise exception 'Mindestens 4 Zeichen verwenden.';
  end if;

  select employee_id into v_employee_id
  from public.employee_sessions
  where token = p_token
    and expires_at > now();

  if not found then
    raise exception 'Sitzung ist abgelaufen. Bitte neu anmelden.';
  end if;

  select * into v_cred
  from public.employee_credentials
  where employee_id = v_employee_id;

  if not found then
    raise exception 'Anmeldedaten nicht gefunden.';
  end if;

  -- Bei erster Änderung muss die alte vorläufige PIN bestätigt werden.
  if v_cred.must_change then
    if p_old_password is null
       or crypt(p_old_password, v_cred.password_hash) <> v_cred.password_hash then
      raise exception 'Die vorläufige PIN konnte nicht bestätigt werden.';
    end if;
  end if;

  update public.employee_credentials
  set password_hash = crypt(p_new_password, gen_salt('bf', 10)),
      must_change = false,
      updated_at = now()
  where employee_id = v_employee_id;

  return jsonb_build_object('ok',true);
end;
$$;

-- ------------------------------------------------------------
-- Geschäftsführung: vorläufige PIN setzen / zurücksetzen
-- ------------------------------------------------------------
create or replace function public.drive_set_temp_pin(
  p_token uuid,
  p_employee_id text,
  p_temp_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller text;
begin
  if length(coalesce(p_temp_pin,'')) < 4 then
    raise exception 'Die vorläufige PIN muss mindestens 4 Zeichen haben.';
  end if;

  select employee_id into v_caller
  from public.employee_sessions
  where token = p_token
    and expires_at > now();

  if not found then
    raise exception 'Sitzung ist abgelaufen. Bitte neu anmelden.';
  end if;

  if not public.drive_employee_has_permission(v_caller, 'manage_employees') then
    raise exception 'Keine Berechtigung zum Verwalten von Mitarbeitern.';
  end if;

  if not exists(
    select 1 from public.employees
    where id = p_employee_id
      and active = true
  ) then
    raise exception 'Mitarbeiter nicht gefunden oder nicht aktiv.';
  end if;

  insert into public.employee_credentials(employee_id,password_hash,must_change,updated_at)
  values (
    p_employee_id,
    crypt(p_temp_pin, gen_salt('bf',10)),
    true,
    now()
  )
  on conflict (employee_id) do update
  set password_hash = excluded.password_hash,
      must_change = true,
      updated_at = now();

  delete from public.employee_sessions
  where employee_id = p_employee_id;

  return jsonb_build_object('ok',true);
end;
$$;

-- ------------------------------------------------------------
-- Logout
-- ------------------------------------------------------------
create or replace function public.drive_logout(
  p_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.employee_sessions where token = p_token;
  return jsonb_build_object('ok',true);
end;
$$;

-- ------------------------------------------------------------
-- Direkten Zugriff sperren, nur RPCs freigeben
-- ------------------------------------------------------------
revoke all on function public.drive_employee_has_permission(text,text) from public;
revoke all on function public.drive_auth_status() from public;
revoke all on function public.drive_initial_owner_setup(text,text) from public;
revoke all on function public.drive_login(text,text) from public;
revoke all on function public.drive_session_context(uuid) from public;
revoke all on function public.drive_change_password(uuid,text,text) from public;
revoke all on function public.drive_set_temp_pin(uuid,text,text) from public;
revoke all on function public.drive_logout(uuid) from public;

grant execute on function public.drive_auth_status() to anon, authenticated;
grant execute on function public.drive_initial_owner_setup(text,text) to anon, authenticated;
grant execute on function public.drive_login(text,text) to anon, authenticated;
grant execute on function public.drive_session_context(uuid) to anon, authenticated;
grant execute on function public.drive_change_password(uuid,text,text) to anon, authenticated;
grant execute on function public.drive_set_temp_pin(uuid,text,text) to anon, authenticated;
grant execute on function public.drive_logout(uuid) to anon, authenticated;

-- Interner Helfer bleibt nur über SECURITY DEFINER-Funktionen nutzbar.
grant execute on function public.drive_employee_has_permission(text,text) to postgres;
