
const DRIVE_PAGE_PERMISSIONS = {
  dashboard:"view_overview",
  employees:"manage_employees",
  inventory:"view_inventory",
  production:"view_production",
  purchases:"view_purchases",
  sales:"view_sales",
  cash:"view_cash",
  commissions:"view_commissions",
  journal:"view_journal",
  settings:"manage_settings"
};

function driveCanOpenPage(pageName) {
  if (!window.DRIVE_AUTH_LOGGED_IN) return true;
  const permission = DRIVE_PAGE_PERMISSIONS[pageName];
  if (!permission || typeof hasCurrentPermission !== "function") return true;
  return hasCurrentPermission(permission);
}

const pages = {
  dashboard: "Übersicht",
  employees: "Mitarbeiter",
  inventory: "Lager",
  production: "Produktion",
  purchases: "Einkauf",
  sales: "Verkauf",
  cash: "Kasse",
  commissions: "Provisionen",
  journal: "Journal",
  settings: "Einstellungen"
};

const sidebar = document.getElementById("sidebar");
const pageTitle = document.getElementById("pageTitle");
const menuButton = document.getElementById("menuButton");

function showPage(pageName) {
  if (!driveCanOpenPage(pageName)) {
    const fallback = ["dashboard","employees","inventory","production","purchases","sales","cash","commissions","journal","settings"]
      .find(name => driveCanOpenPage(name));
    if (fallback && fallback !== pageName) return showPage(fallback);
    return;
  }

  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));

  const targetPage = document.getElementById(pageName);
  const targetNav = document.querySelector(`[data-page="${pageName}"]`);

  if (targetPage) targetPage.classList.add("active");
  if (targetNav) targetNav.classList.add("active");

  pageTitle.textContent = pages[pageName] || "D.R.I.V.E.";
  sidebar.classList.remove("open");
  window.location.hash = pageName === "dashboard" ? "" : pageName;
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.go));
});

menuButton.addEventListener("click", () => sidebar.classList.toggle("open"));

document.addEventListener("click", event => {
  if (window.innerWidth <= 850 && sidebar.classList.contains("open")) {
    if (!sidebar.contains(event.target) && event.target !== menuButton) {
      sidebar.classList.remove("open");
    }
  }
});

const dateElement = document.getElementById("currentDate");
dateElement.textContent = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric"
}).format(new Date());

const initialPage = window.location.hash.replace("#", "");
if (initialPage && pages[initialPage]) showPage(initialPage);


/* =========================================================
   MODALE EINGABEMASKEN – v0.3.1
   ========================================================= */
function openDriveModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeDriveModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (!document.querySelector(".drive-modal.open")) {
    document.body.classList.remove("modal-open");
  }
}

document.querySelectorAll("[data-close-modal]").forEach(button => {
  button.addEventListener("click", () => closeDriveModal(button.dataset.closeModal));
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".drive-modal.open").forEach(modal => closeDriveModal(modal.id));
  }
});

/* =========================================================
   MITARBEITER – v0.2
   Lokale Test-Speicherung im Browser.
   Wird später durch Supabase ersetzt.
   ========================================================= */

const EMPLOYEE_STORAGE_KEY = "drive_employees_v02";

const employeeTableBody = document.getElementById("employeeTableBody");
const employeeEmptyState = document.getElementById("employeeEmptyState");
const employeeForm = document.getElementById("employeeForm");
const employeeId = document.getElementById("employeeId");
const employeeFirstName = document.getElementById("employeeFirstName");
const employeeLastName = document.getElementById("employeeLastName");
const employeeStartDate = document.getElementById("employeeStartDate");
const employeeRoleSelect = document.getElementById("employeeRoleSelect");
const employeeTempPin = document.getElementById("employeeTempPin");
const employeeNote = document.getElementById("employeeNote");
const employeeSearch = document.getElementById("employeeSearch");
const employeeStatusFilter = document.getElementById("employeeStatusFilter");
const employeeCancelButton = document.getElementById("employeeCancelButton");
const newEmployeeButton = document.getElementById("newEmployeeButton");
const employeeFormMode = document.getElementById("employeeFormMode");
const employeeFormTitle = document.getElementById("employeeFormTitle");
const employeeActiveCount = document.getElementById("employeeActiveCount");
const employeeInactiveCount = document.getElementById("employeeInactiveCount");
const employeeTotalCount = document.getElementById("employeeTotalCount");

function loadEmployees() {
  try {
    const saved = localStorage.getItem(EMPLOYEE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

let employees = loadEmployees();

function saveEmployees() {
  localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(employees));
}

function makeId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `emp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })} %`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function loadRolesForEmployeeUi() {
  try {
    const saved = localStorage.getItem("drive_roles_v010");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function loadEmployeeRolesForEmployeeUi() {
  try {
    const saved = localStorage.getItem("drive_employee_roles_v010");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function getEmployeeRoleNameForUi(employeeId) {
  const uiRoles = loadRolesForEmployeeUi();
  const uiAssignments = loadEmployeeRolesForEmployeeUi();
  const role = uiRoles.find(item => item.id === uiAssignments[employeeId]);
  return role ? role.name : "Keine Rolle";
}

function refreshEmployeeRoleOptions(selectedRoleId = "") {
  if (!employeeRoleSelect) return;

  const uiRoles = loadRolesForEmployeeUi();
  employeeRoleSelect.innerHTML =
    `<option value="">Keine Rolle</option>` +
    uiRoles.map(role => `<option value="${role.id}">${escapeHtml(role.name)}</option>`).join("");

  if (selectedRoleId && uiRoles.some(role => role.id === selectedRoleId)) {
    employeeRoleSelect.value = selectedRoleId;
  } else {
    employeeRoleSelect.value = "";
  }
}

function renderEmployees() {
  const query = employeeSearch.value.trim().toLowerCase();
  const filter = employeeStatusFilter.value;

  const filtered = employees
    .filter(employee => employee.active)
    .filter(employee => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      return fullName.includes(query);
    })
    .sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB, "de");
    });

  employeeTableBody.innerHTML = filtered.map(employee => `
    <tr>
      <td>
        <div class="employee-name">
          <strong>${escapeHtml(employee.firstName)} ${escapeHtml(employee.lastName)}</strong>
          ${employee.note ? `<small>${escapeHtml(employee.note)}</small>` : ""}
        </div>
      </td>
      <td>
        <span class="status-badge">Aktiv</span>
      </td>
      <td>${formatDate(employee.startDate)}</td>
      <td>${escapeHtml(getEmployeeRoleNameForUi(employee.id))}</td>
      <td>
        <div class="table-actions">
          <button class="mini-button" data-edit-employee="${employee.id}">Bearbeiten</button>
          <button class="mini-button danger" data-terminate-employee="${employee.id}">
            Kündigen
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  employeeEmptyState.classList.toggle("hidden", filtered.length > 0);

  employeeActiveCount.textContent = employees.filter(employee => employee.active).length;
  employeeInactiveCount.textContent = employees.filter(employee => !employee.active).length;
  employeeTotalCount.textContent = employees.length;

  document.querySelectorAll("[data-edit-employee]").forEach(button => {
    button.addEventListener("click", () => editEmployee(button.dataset.editEmployee));
  });

  document.querySelectorAll("[data-terminate-employee]").forEach(button => {
    button.addEventListener("click", () => terminateEmployee(button.dataset.terminateEmployee));
  });
}

function resetEmployeeForm() {
  employeeForm.reset();
  employeeId.value = "";
  employeeRoleSelect.innerHTML = `<option value="">Keine Rolle</option>`;
  employeeRoleSelect.value = "";
  employeeTempPin.value = "";
  employeeTempPin.required = true;
  employeeStartDate.value = new Date().toISOString().slice(0, 10);
  employeeFormMode.textContent = "Neue Personalakte";
  employeeFormTitle.textContent = "Mitarbeiter anlegen";
}

function editEmployee(id) {
  const employee = employees.find(item => item.id === id);
  if (!employee) return;
  openDriveModal("employeeModal");

  employeeId.value = employee.id;
  employeeFirstName.value = employee.firstName;
  employeeLastName.value = employee.lastName;
  employeeStartDate.value = employee.startDate;
  const employeeRoleAssignments = loadEmployeeRolesForEmployeeUi();
  refreshEmployeeRoleOptions(employeeRoleAssignments[employee.id] || "");
  employeeNote.value = employee.note || "";
  employeeTempPin.value = "";
  employeeTempPin.required = false;
  employeeFormMode.textContent = "Personalakte bearbeiten";
  employeeFormTitle.textContent = `${employee.firstName} ${employee.lastName}`;

  if (window.innerWidth < 1050) {
    document.querySelector(".employee-form-panel").scrollIntoView({ behavior: "smooth" });
  }
}

function terminateEmployee(id) {
  const employee = employees.find(item => item.id === id);
  if (!employee || !employee.active) return;

  const confirmed = window.confirm(
    `${employee.firstName} ${employee.lastName} wirklich kündigen? Die Person verschwindet danach aus allen aktiven Listen und Auswahlfeldern.`
  );
  if (!confirmed) return;

  employee.active = false;
  employee.terminatedAt = new Date().toISOString();
  employee.updatedAt = employee.terminatedAt;

  saveEmployees();

  /* Rollenzuweisung entfernen, damit die Person auch in den Einstellungen nicht mehr auftaucht. */
  const assignments = loadEmployeeRolesForEmployeeUi();
  delete assignments[id];
  localStorage.setItem("drive_employee_roles_v010", JSON.stringify(assignments));

  if (typeof employeeRoles !== "undefined") {
    delete employeeRoles[id];
    if (typeof saveEmployeeRoles === "function") saveEmployeeRoles();
  }

  renderEmployees();
  if (typeof renderSettingsAll === "function") renderSettingsAll();
  if (typeof refreshProductionSelectors === "function") refreshProductionSelectors();
  if (typeof refreshPurchaseSelectors === "function") refreshPurchaseSelectors();
  if (typeof refreshSaleSelectors === "function") refreshSaleSelectors();

  if (employeeId.value === id) resetEmployeeForm();
}

employeeForm.addEventListener("submit", async event => {
  event.preventDefault();

  const firstName = employeeFirstName.value.trim();
  const lastName = employeeLastName.value.trim();

  if (!firstName || !lastName) return;

  const requestedTempPin = employeeTempPin.value.trim();
  const existingId = employeeId.value;

  if (!existingId && requestedTempPin.length < 4) {
    window.alert("Für einen neuen Mitarbeiter bitte eine vorläufige PIN mit mindestens 4 Zeichen vergeben.");
    employeeTempPin.focus();
    return;
  }
  const data = {
    firstName,
    lastName,
    startDate: employeeStartDate.value,
    note: employeeNote.value.trim()
  };

  if (existingId) {
    const employee = employees.find(item => item.id === existingId);
    if (employee) {
      Object.assign(employee, data, { updatedAt: new Date().toISOString() });
    }
  } else {
    employees.push({
      id: makeId(),
      ...data,
      commissionRate: 0,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  saveEmployees();

  const savedEmployee = existingId
    ? employees.find(item => item.id === existingId)
    : employees[employees.length - 1];

  if (savedEmployee) {
    const assignments = loadEmployeeRolesForEmployeeUi();
    if (employeeRoleSelect.value) assignments[savedEmployee.id] = employeeRoleSelect.value;
    else delete assignments[savedEmployee.id];

    localStorage.setItem("drive_employee_roles_v010", JSON.stringify(assignments));

    // Die Einstellungsverwaltung ist zu diesem Zeitpunkt beim Klick bereits initialisiert.
    if (typeof employeeRoles !== "undefined") {
      Object.keys(employeeRoles).forEach(key => delete employeeRoles[key]);
      Object.assign(employeeRoles, assignments);
      if (typeof saveEmployeeRoles === "function") saveEmployeeRoles();
    }
    if (typeof renderSettingsAll === "function") renderSettingsAll();

    if (requestedTempPin) {
      try {
        if (typeof DRIVE_SB !== "undefined" && DRIVE_SB.ready) {
          await DRIVE_SB.syncQueue;
        }
        if (typeof driveSetEmployeeTempPin !== "function") {
          throw new Error("Anmeldefunktion ist noch nicht bereit.");
        }
        await driveSetEmployeeTempPin(savedEmployee.id, requestedTempPin);
      } catch (error) {
        console.error("Vorläufige PIN", error);
        window.alert("Der Mitarbeiter wurde gespeichert, aber die vorläufige PIN konnte nicht gesetzt werden: " + error.message);
      }
    }
  }

  resetEmployeeForm();
  renderEmployees();
  closeDriveModal("employeeModal");
});

employeeSearch.addEventListener("input", renderEmployees);
employeeStatusFilter.addEventListener("change", renderEmployees);
employeeCancelButton.addEventListener("click", () => {
  resetEmployeeForm();
  closeDriveModal("employeeModal");
});
newEmployeeButton.addEventListener("click", () => {
  resetEmployeeForm();
  refreshEmployeeRoleOptions();
  openDriveModal("employeeModal");
  employeeFirstName.focus();
});

resetEmployeeForm();
renderEmployees();


/* =========================================================
   LAGER & STAMMDATEN – v0.3
   Dynamisch erweiterbar, lokale Test-Speicherung.
   Später werden dieselben Strukturen an Supabase angebunden.
   ========================================================= */

const DRIVE_INVENTORY_KEY = "drive_inventory_v03";

const defaultInventoryData = {
  materials: [
    {id:"mat_tabak",name:"Tabak",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:0.20},stock:0,minStock:0,active:true},
    {id:"mat_papier",name:"Zigarettenpapier",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"resource",amount:3,itemId:"mat_holz"},stock:0,minStock:0,active:true},
    {id:"mat_filter",name:"Filter",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:0.75},stock:0,minStock:0,active:true},
    {id:"mat_baumwolle",name:"Baumwolle",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:0.20},stock:0,minStock:0,active:true},
    {id:"mat_minze",name:"Wilde Minze",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:0.20},stock:0,minStock:0,active:true},
    {id:"mat_brombeere",name:"Brombeere",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:0.40},stock:0,minStock:0,active:true},
    {id:"mat_himbeere",name:"Himbeere",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:0.40},stock:0,minStock:0,active:true},
    {id:"mat_schokolade",name:"Schokolade",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:0.40},stock:0,minStock:0,active:true},
    {id:"mat_whisky",name:"Whisky",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:5.50},stock:0,minStock:0,active:true},
    {id:"mat_honig",name:"Honig",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:0.60},stock:0,minStock:0,active:true},
    {id:"mat_stock",name:"Stock",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:0.20},stock:0,minStock:0,active:true},
    {id:"mat_holz",name:"Holz",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:0.50},stock:0,minStock:0,active:true},
    {id:"mat_rundholz",name:"Rundholz",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:2.00},stock:0,minStock:0,active:true},
    {id:"mat_eisen",name:"Eisenbarren",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:0.70},stock:0,minStock:0,active:true},
    {id:"mat_kohle",name:"Kohle",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:0.05},stock:0,minStock:0,active:true},
    {id:"mat_schwefel",name:"Schwefel",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:1.40},stock:0,minStock:0,active:true},
    {id:"mat_schwarzpulver",name:"Schwarzpulver",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:1.40},stock:0,minStock:0,active:true},
    {id:"mat_horn",name:"Gabelbockhorn",category:"Rohstoff",unit:"Stück",purchaseCost:{type:"money",amount:2.00},stock:0,minStock:0,active:true}
  ],
  products: [
    {id:"prd_tabakblatt",name:"Tabakblatt",category:"Zigaretten",salePrice:1.04,purchasePrice:0.80,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_tabak",amount:4}]},
    {id:"prd_zigarette",name:"Zigarette",category:"Zigaretten",salePrice:3.71,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_tabak",amount:2},{itemId:"mat_papier",amount:1},{itemId:"mat_filter",amount:1}]},
    {id:"prd_minzezigarette",name:"Minzezigarette",category:"Zigaretten",salePrice:4.23,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_tabak",amount:2},{itemId:"mat_papier",amount:1},{itemId:"mat_filter",amount:1},{itemId:"mat_minze",amount:2}]},
    {id:"prd_beerenzigarette",name:"Beerenzigarette",category:"Zigaretten",salePrice:6.31,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_tabak",amount:2},{itemId:"mat_papier",amount:1},{itemId:"mat_filter",amount:1},{itemId:"mat_brombeere",amount:2},{itemId:"mat_himbeere",amount:2}]},
    {id:"prd_zigarillo",name:"Zigarillo",category:"Zigarren",salePrice:8.32,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_tabak",amount:8},{itemId:"prd_tabakblatt",amount:6}]},
    {id:"prd_schoko_zigarillo",name:"Schoko-Zigarillo",category:"Zigarren",salePrice:9.36,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_tabak",amount:8},{itemId:"prd_tabakblatt",amount:6},{itemId:"mat_schokolade",amount:2}]},
    {id:"prd_zigarre",name:"Zigarre",category:"Zigarren",salePrice:8.84,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_tabak",amount:10},{itemId:"prd_tabakblatt",amount:6}]},
    {id:"prd_kubanische",name:"Kubanische Zigarre",category:"Zigarren",salePrice:11.44,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_tabak",amount:12},{itemId:"prd_tabakblatt",amount:8}]},
    {id:"prd_whisky",name:"Whisky-Pfeifentabak",category:"Pfeifentabak",salePrice:8.71,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_tabak",amount:2},{itemId:"mat_whisky",amount:1},{itemId:"mat_honig",amount:1}]},
    {id:"prd_honig",name:"Honig-Pfeifentabak",category:"Pfeifentabak",salePrice:3.12,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_tabak",amount:3},{itemId:"mat_honig",amount:3}]},
    {id:"prd_minze",name:"Minze-Pfeifentabak",category:"Pfeifentabak",salePrice:1.56,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_tabak",amount:3},{itemId:"mat_minze",amount:3}]},
    {id:"prd_pfeife",name:"Pfeife",category:"Pfeifen",salePrice:6.37,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_stock",amount:6},{itemId:"mat_rundholz",amount:1},{itemId:"mat_eisen",amount:1}]},
    {id:"prd_edle_pfeife",name:"Edle Pfeife",category:"Pfeifen",salePrice:11.57,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_stock",amount:6},{itemId:"mat_rundholz",amount:1},{itemId:"mat_eisen",amount:2},{itemId:"mat_horn",amount:2}]},
    {id:"prd_streichhoelzer",name:"Streichhölzer",category:"Anzünder",salePrice:7.02,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_stock",amount:6},{itemId:"mat_schwefel",amount:3}]},
    {id:"prd_feuerzeug",name:"Feuerzeug",category:"Anzünder",salePrice:10.01,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_eisen",amount:2},{itemId:"mat_schwefel",amount:3},{itemId:"mat_schwarzpulver",amount:1}]},
    {id:"prd_edles_feuerzeug",name:"Edles Feuerzeug",category:"Anzünder",salePrice:15.21,purchasePrice:0,stock:0,minStock:0,active:true,recipe:[{itemId:"mat_eisen",amount:4},{itemId:"mat_schwefel",amount:3},{itemId:"mat_schwarzpulver",amount:1},{itemId:"mat_horn",amount:1}]}
  ],
  adjustments: []
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadInventoryData() {
  try {
    const saved = localStorage.getItem(DRIVE_INVENTORY_KEY);
    return saved ? JSON.parse(saved) : deepClone(defaultInventoryData);
  } catch {
    return deepClone(defaultInventoryData);
  }
}

let inventoryData = loadInventoryData();
let recipeDraft = [];

function saveInventoryData() {
  localStorage.setItem(DRIVE_INVENTORY_KEY, JSON.stringify(inventoryData));
}

function makeInventoryId(prefix) {
  if (window.crypto && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getAllInventoryItems() {
  return [
    ...inventoryData.materials.map(item => ({...item, type:"material"})),
    ...inventoryData.products.map(item => ({...item, type:"product", unit:"Stück"}))
  ];
}

function getInventoryItem(id) {
  return getAllInventoryItems().find(item => item.id === id);
}

function moneyShort(value) {
  return `$ ${Number(value || 0).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function numberShort(value) {
  return Number(value || 0).toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function purchaseCostText(material) {
  const cost = material.purchaseCost || {type:"none"};
  if (cost.type === "money") return moneyShort(cost.amount);
  if (cost.type === "resource") {
    const item = getInventoryItem(cost.itemId);
    return `${numberShort(cost.amount)} × ${item ? item.name : "Artikel"}`;
  }
  return "—";
}

const inventoryTabs = document.querySelectorAll(".inventory-tab");
const inventoryPanels = document.querySelectorAll(".inventory-tab-panel");

function showInventoryTab(tabName) {
  inventoryTabs.forEach(tab => tab.classList.toggle("active", tab.dataset.inventoryTab === tabName));
  inventoryPanels.forEach(panel => panel.classList.toggle("active", panel.id === `inventory-${tabName}`));
}

inventoryTabs.forEach(tab => {
  tab.addEventListener("click", () => showInventoryTab(tab.dataset.inventoryTab));
});

const materialTableBody = document.getElementById("materialTableBody");
const materialSearch = document.getElementById("materialSearch");
const materialStatusFilter = document.getElementById("materialStatusFilter");
const materialCount = document.getElementById("materialCount");
const materialEmptyState = document.getElementById("materialEmptyState");

const materialForm = document.getElementById("materialForm");
const materialId = document.getElementById("materialId");
const materialName = document.getElementById("materialName");
const materialCategory = document.getElementById("materialCategory");
const materialUnit = document.getElementById("materialUnit");
const materialCostType = document.getElementById("materialCostType");
const materialPurchasePrice = document.getElementById("materialPurchasePrice");
const materialResourceCostAmount = document.getElementById("materialResourceCostAmount");
const materialResourceCostItem = document.getElementById("materialResourceCostItem");
const materialStock = document.getElementById("materialStock");
const materialMinStock = document.getElementById("materialMinStock");
const materialMoneyCostFields = document.getElementById("materialMoneyCostFields");
const materialResourceCostFields = document.getElementById("materialResourceCostFields");
const materialFormMode = document.getElementById("materialFormMode");
const materialFormTitle = document.getElementById("materialFormTitle");

function refreshMaterialCostFields() {
  materialMoneyCostFields.classList.toggle("hidden", materialCostType.value !== "money");
  materialResourceCostFields.classList.toggle("hidden", materialCostType.value !== "resource");
}

function refreshInventorySelects() {
  const all = getAllInventoryItems().filter(item => item.active);
  const options = all.map(item => `<option value="${item.id}">${escapeHtml(item.name)} (${item.type === "material" ? "Rohstoff" : "Produkt"})</option>`).join("");

  materialResourceCostItem.innerHTML = options;
  document.getElementById("recipeIngredient").innerHTML = options;
  document.getElementById("adjustmentItem").innerHTML = options;
}

function renderMaterials() {
  const query = materialSearch.value.trim().toLowerCase();
  const status = materialStatusFilter.value;
  const filtered = inventoryData.materials
    .filter(item => item.name.toLowerCase().includes(query))
    .filter(item => status === "all" || (status === "active" ? item.active : !item.active))
    .sort((a,b) => a.name.localeCompare(b.name, "de"));

  materialTableBody.innerHTML = filtered.map(item => `
    <tr>
      <td><div class="employee-name"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category || "Rohstoff")}</small></div></td>
      <td>${escapeHtml(item.unit || "Stück")}</td>
      <td>${purchaseCostText(item)}</td>
      <td>${numberShort(item.stock)} ${escapeHtml(item.unit || "")}</td>
      <td>${numberShort(item.minStock)} ${escapeHtml(item.unit || "")}</td>
      <td><div class="table-actions">
        <button class="mini-button" data-edit-material="${item.id}">Bearbeiten</button>
        <button class="mini-button ${item.active ? "danger" : ""}" data-toggle-material="${item.id}">${item.active ? "Deaktivieren" : "Aktivieren"}</button>
      </div></td>
    </tr>
  `).join("");

  materialCount.textContent = inventoryData.materials.length;
  materialEmptyState.classList.toggle("hidden", filtered.length > 0);

  document.querySelectorAll("[data-edit-material]").forEach(button => {
    button.addEventListener("click", () => editMaterial(button.dataset.editMaterial));
  });
  document.querySelectorAll("[data-toggle-material]").forEach(button => {
    button.addEventListener("click", () => toggleMaterial(button.dataset.toggleMaterial));
  });
}

function resetMaterialForm() {
  materialForm.reset();
  materialId.value = "";
  materialCategory.value = "Rohstoff";
  materialUnit.value = "Stück";
  materialCostType.value = "money";
  materialPurchasePrice.value = "0";
  materialResourceCostAmount.value = "1";
  materialStock.value = "0";
  materialMinStock.value = "0";
  materialFormMode.textContent = "Neuer Rohstoff";
  materialFormTitle.textContent = "Rohstoff anlegen";
  refreshMaterialCostFields();
}

function editMaterial(id) {
  const item = inventoryData.materials.find(x => x.id === id);
  if (!item) return;
  openDriveModal("materialModal");
  showInventoryTab("materials");
  materialId.value = item.id;
  materialName.value = item.name;
  materialCategory.value = item.category || "Rohstoff";
  materialUnit.value = item.unit || "Stück";
  materialCostType.value = item.purchaseCost?.type || "none";
  materialPurchasePrice.value = item.purchaseCost?.type === "money" ? item.purchaseCost.amount : 0;
  materialResourceCostAmount.value = item.purchaseCost?.type === "resource" ? item.purchaseCost.amount : 1;
  refreshInventorySelects();
  if (item.purchaseCost?.type === "resource") materialResourceCostItem.value = item.purchaseCost.itemId || "";
  materialStock.value = item.stock || 0;
  materialMinStock.value = item.minStock || 0;
  materialFormMode.textContent = "Rohstoff bearbeiten";
  materialFormTitle.textContent = item.name;
  refreshMaterialCostFields();
}

function toggleMaterial(id) {
  const item = inventoryData.materials.find(x => x.id === id);
  if (!item) return;
  item.active = !item.active;
  saveInventoryData();
  renderAllInventory();
}

materialCostType.addEventListener("change", refreshMaterialCostFields);
materialSearch.addEventListener("input", renderMaterials);
materialStatusFilter.addEventListener("change", renderMaterials);
document.getElementById("materialCancelButton").addEventListener("click", () => {
  resetMaterialForm();
  closeDriveModal("materialModal");
});
document.getElementById("newMaterialButton").addEventListener("click", () => {
  showInventoryTab("materials");
  resetMaterialForm();
  openDriveModal("materialModal");
  materialName.focus();
});

materialForm.addEventListener("submit", event => {
  event.preventDefault();

  let purchaseCost = {type:"none"};
  if (materialCostType.value === "money") {
    purchaseCost = {type:"money", amount:Number(materialPurchasePrice.value || 0)};
  } else if (materialCostType.value === "resource") {
    purchaseCost = {
      type:"resource",
      amount:Number(materialResourceCostAmount.value || 0),
      itemId:materialResourceCostItem.value
    };
  }

  const payload = {
    name: materialName.value.trim(),
    category: materialCategory.value.trim() || "Rohstoff",
    unit: materialUnit.value,
    purchaseCost,
    stock: Number(materialStock.value || 0),
    minStock: Number(materialMinStock.value || 0)
  };

  if (!payload.name) return;

  const existing = inventoryData.materials.find(item => item.id === materialId.value);
  if (existing) {
    Object.assign(existing, payload);
  } else {
    inventoryData.materials.push({
      id: makeInventoryId("mat"),
      ...payload,
      active: true
    });
  }

  saveInventoryData();
  resetMaterialForm();
  renderAllInventory();
  closeDriveModal("materialModal");
});

const productCardList = document.getElementById("productCardList");
const productSearch = document.getElementById("productSearch");
const productStatusFilter = document.getElementById("productStatusFilter");
const productCount = document.getElementById("productCount");
const productEmptyState = document.getElementById("productEmptyState");

const productForm = document.getElementById("productForm");
const productId = document.getElementById("productId");
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productSalePrice = document.getElementById("productSalePrice");
const productPurchasePrice = document.getElementById("productPurchasePrice");
const productStock = document.getElementById("productStock");
const productMinStock = document.getElementById("productMinStock");
const productFormMode = document.getElementById("productFormMode");
const productFormTitle = document.getElementById("productFormTitle");
const recipeIngredient = document.getElementById("recipeIngredient");
const recipeAmount = document.getElementById("recipeAmount");
const recipeDraftList = document.getElementById("recipeDraftList");

function recipeText(recipe) {
  if (!recipe || !recipe.length) return `<span class="recipe-chip">Kein Rezept hinterlegt</span>`;
  return recipe.map(entry => {
    const ingredient = getInventoryItem(entry.itemId);
    return `<span class="recipe-chip">${numberShort(entry.amount)} × ${escapeHtml(ingredient ? ingredient.name : "Unbekannt")}</span>`;
  }).join("");
}

function renderProducts() {
  const query = productSearch.value.trim().toLowerCase();
  const status = productStatusFilter.value;

  const filtered = inventoryData.products
    .filter(item => item.name.toLowerCase().includes(query))
    .filter(item => status === "all" || (status === "active" ? item.active : !item.active))
    .sort((a,b) => a.name.localeCompare(b.name, "de"));

  productCardList.innerHTML = filtered.map(item => `
    <article class="product-card">
      <div class="product-card-top">
        <div>
          <h4>${escapeHtml(item.name)}</h4>
          <small>${escapeHtml(item.category || "Sonstiges")} · ${item.active ? "Aktiv" : "Deaktiviert"}</small>
        </div>
        <div class="table-actions">
          <button class="mini-button" data-edit-product="${item.id}">Bearbeiten</button>
          <button class="mini-button ${item.active ? "danger" : ""}" data-toggle-product="${item.id}">${item.active ? "Deaktivieren" : "Aktivieren"}</button>
        </div>
      </div>
      <div class="product-prices">
        <strong>Verkauf: ${moneyShort(item.salePrice)}</strong>
        ${Number(item.purchasePrice || 0) > 0 ? `<span>Einkauf: ${moneyShort(item.purchasePrice)}</span>` : ""}
        <span>Bestand: ${numberShort(item.stock)} Stück</span>
      </div>
      <div class="recipe-list">${recipeText(item.recipe)}</div>
    </article>
  `).join("");

  productCount.textContent = inventoryData.products.length;
  productEmptyState.classList.toggle("hidden", filtered.length > 0);

  document.querySelectorAll("[data-edit-product]").forEach(button => {
    button.addEventListener("click", () => editProduct(button.dataset.editProduct));
  });
  document.querySelectorAll("[data-toggle-product]").forEach(button => {
    button.addEventListener("click", () => toggleProduct(button.dataset.toggleProduct));
  });
}

function renderRecipeDraft() {
  recipeDraftList.innerHTML = recipeDraft.map((entry, index) => {
    const item = getInventoryItem(entry.itemId);
    return `
      <div class="recipe-draft-row">
        <span>${escapeHtml(item ? item.name : "Unbekannt")}</span>
        <strong>${numberShort(entry.amount)} ×</strong>
        <button type="button" data-remove-recipe="${index}">Entfernen</button>
      </div>
    `;
  }).join("");

  document.querySelectorAll("[data-remove-recipe]").forEach(button => {
    button.addEventListener("click", () => {
      recipeDraft.splice(Number(button.dataset.removeRecipe), 1);
      renderRecipeDraft();
    });
  });
}

function resetProductForm() {
  productForm.reset();
  productId.value = "";
  productCategory.value = "Zigaretten";
  productSalePrice.value = "0";
  productPurchasePrice.value = "0";
  productStock.value = "0";
  productMinStock.value = "0";
  recipeAmount.value = "1";
  recipeDraft = [];
  renderRecipeDraft();
  productFormMode.textContent = "Neues Produkt";
  productFormTitle.textContent = "Produkt anlegen";
  refreshInventorySelects();
}

function editProduct(id) {
  const item = inventoryData.products.find(x => x.id === id);
  if (!item) return;
  openDriveModal("productModal");
  showInventoryTab("products");
  productId.value = item.id;
  productName.value = item.name;
  productCategory.value = item.category || "Sonstiges";
  productSalePrice.value = item.salePrice || 0;
  productPurchasePrice.value = item.purchasePrice || 0;
  productStock.value = item.stock || 0;
  productMinStock.value = item.minStock || 0;
  recipeDraft = deepClone(item.recipe || []);
  renderRecipeDraft();
  productFormMode.textContent = "Produkt bearbeiten";
  productFormTitle.textContent = item.name;
}

function toggleProduct(id) {
  const item = inventoryData.products.find(x => x.id === id);
  if (!item) return;
  item.active = !item.active;
  saveInventoryData();
  renderAllInventory();
}

document.getElementById("addRecipeIngredientButton").addEventListener("click", () => {
  const itemId = recipeIngredient.value;
  const amount = Number(recipeAmount.value || 0);
  if (!itemId || amount <= 0) return;

  const existing = recipeDraft.find(entry => entry.itemId === itemId);
  if (existing) existing.amount += amount;
  else recipeDraft.push({itemId, amount});

  recipeAmount.value = "1";
  renderRecipeDraft();
});

productSearch.addEventListener("input", renderProducts);
productStatusFilter.addEventListener("change", renderProducts);
document.getElementById("productCancelButton").addEventListener("click", () => {
  resetProductForm();
  closeDriveModal("productModal");
});
document.getElementById("newProductButton").addEventListener("click", () => {
  showInventoryTab("products");
  resetProductForm();
  openDriveModal("productModal");
  productName.focus();
});

productForm.addEventListener("submit", event => {
  event.preventDefault();

  const payload = {
    name: productName.value.trim(),
    category: productCategory.value,
    salePrice: Number(productSalePrice.value || 0),
    purchasePrice: Number(productPurchasePrice.value || 0),
    stock: Number(productStock.value || 0),
    minStock: Number(productMinStock.value || 0),
    recipe: deepClone(recipeDraft)
  };

  if (!payload.name) return;

  const existing = inventoryData.products.find(item => item.id === productId.value);
  if (existing) {
    Object.assign(existing, payload);
  } else {
    inventoryData.products.push({
      id: makeInventoryId("prd"),
      ...payload,
      active: true
    });
  }

  saveInventoryData();
  resetProductForm();
  renderAllInventory();
  closeDriveModal("productModal");
});

const stockTableBody = document.getElementById("stockTableBody");
const stockSearch = document.getElementById("stockSearch");
const stockTypeFilter = document.getElementById("stockTypeFilter");

function renderStock() {
  const query = stockSearch.value.trim().toLowerCase();
  const type = stockTypeFilter.value;

  const items = getAllInventoryItems()
    .filter(item => item.active)
    .filter(item => item.name.toLowerCase().includes(query))
    .filter(item => type === "all" || item.type === type)
    .sort((a,b) => a.name.localeCompare(b.name, "de"));

  stockTableBody.innerHTML = items.map(item => {
    const isLow = Number(item.stock || 0) <= Number(item.minStock || 0) && Number(item.minStock || 0) > 0;
    return `
      <tr>
        <td><strong>${escapeHtml(item.name)}</strong></td>
        <td>${item.type === "material" ? "Rohstoff" : "Produkt"}</td>
        <td>${numberShort(item.stock)} ${escapeHtml(item.unit || "Stück")}</td>
        <td>${numberShort(item.minStock)} ${escapeHtml(item.unit || "Stück")}</td>
        <td><span class="stock-status ${isLow ? "low" : "ok"}">${isLow ? "Nachbestellen" : "Bestand OK"}</span></td>
        <td><button class="mini-button" data-adjust-stock="${item.id}">Korrigieren</button></td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll("[data-adjust-stock]").forEach(button => {
    button.addEventListener("click", () => {
      showInventoryTab("adjustments");
      refreshInventorySelects();
      document.getElementById("adjustmentItem").value = button.dataset.adjustStock;
      const item = getInventoryItem(button.dataset.adjustStock);
      document.getElementById("adjustmentNewStock").value = item ? item.stock : 0;
      document.getElementById("adjustmentReason").focus();
    });
  });
}

stockSearch.addEventListener("input", renderStock);
stockTypeFilter.addEventListener("change", renderStock);

const adjustmentForm = document.getElementById("adjustmentForm");
const adjustmentItem = document.getElementById("adjustmentItem");
const adjustmentNewStock = document.getElementById("adjustmentNewStock");
const adjustmentReason = document.getElementById("adjustmentReason");
const adjustmentHistory = document.getElementById("adjustmentHistory");
const adjustmentEmptyState = document.getElementById("adjustmentEmptyState");

function setItemStock(id, newStock) {
  let item = inventoryData.materials.find(x => x.id === id);
  if (item) {
    item.stock = newStock;
    return;
  }
  item = inventoryData.products.find(x => x.id === id);
  if (item) item.stock = newStock;
}

function renderAdjustments() {
  const entries = [...inventoryData.adjustments].reverse();
  adjustmentHistory.innerHTML = entries.map(entry => {
    const item = getInventoryItem(entry.itemId);
    const diff = Number(entry.newStock) - Number(entry.oldStock);
    const diffClass = diff < 0 ? "negative" : "positive";
    const sign = diff > 0 ? "+" : "";
    return `
      <div class="adjustment-entry">
        <div>
          <strong>${new Intl.DateTimeFormat("de-DE", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(entry.createdAt))}</strong>
          <small>${escapeHtml(entry.reason)}</small>
        </div>
        <div>
          <strong>${escapeHtml(item ? item.name : entry.itemName || "Artikel")}</strong>
          <small>${numberShort(entry.oldStock)} → ${numberShort(entry.newStock)}</small>
        </div>
        <div class="adjustment-diff ${diffClass}">${sign}${numberShort(diff)}</div>
      </div>
    `;
  }).join("");

  adjustmentEmptyState.classList.toggle("hidden", entries.length > 0);
}

adjustmentForm.addEventListener("submit", event => {
  event.preventDefault();

  const item = getInventoryItem(adjustmentItem.value);
  if (!item) return;

  const oldStock = Number(item.stock || 0);
  const newStock = Number(adjustmentNewStock.value || 0);
  const reason = adjustmentReason.value.trim();
  if (!reason) return;

  inventoryData.adjustments.push({
    id: makeInventoryId("adj"),
    itemId: item.id,
    itemName: item.name,
    oldStock,
    newStock,
    reason,
    createdAt: new Date().toISOString()
  });

  setItemStock(item.id, newStock);
  saveInventoryData();
  adjustmentForm.reset();
  renderAllInventory();
  showInventoryTab("adjustments");
});

function renderAllInventory() {
  refreshInventorySelects();
  renderMaterials();
  renderProducts();
  renderStock();
  renderAdjustments();
}

resetMaterialForm();
resetProductForm();
renderAllInventory();


/* =========================================================
   PRODUKTION – v0.4
   ========================================================= */

const DRIVE_PRODUCTION_KEY = "drive_productions_v04";
const DRIVE_COMMISSION_LEDGER_KEY = "drive_commission_ledger_v04";

function loadJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

let productions = loadJsonStorage(DRIVE_PRODUCTION_KEY, []);
let commissionLedger = loadJsonStorage(DRIVE_COMMISSION_LEDGER_KEY, []);

function saveProductions() {
  localStorage.setItem(DRIVE_PRODUCTION_KEY, JSON.stringify(productions));
}

function saveCommissionLedger() {
  localStorage.setItem(DRIVE_COMMISSION_LEDGER_KEY, JSON.stringify(commissionLedger));
}

const productionModal = document.getElementById("productionModal");
const productionForm = document.getElementById("productionForm");
const productionEmployee = document.getElementById("productionEmployee");
const productionProduct = document.getElementById("productionProduct");
const productionQuantity = document.getElementById("productionQuantity");
const productionUnitPrice = document.getElementById("productionUnitPrice");
const productionTotalValue = document.getElementById("productionTotalValue");
const productionProfitValue = document.getElementById("productionProfitValue");
const productionCommissionValue = document.getElementById("productionCommissionValue");
const productionIngredientCheck = document.getElementById("productionIngredientCheck");
const productionWarning = document.getElementById("productionWarning");
const productionSubmitButton = document.getElementById("productionSubmitButton");
const productionHistoryBody = document.getElementById("productionHistoryBody");
const productionEmptyState = document.getElementById("productionEmptyState");
const productionSearch = document.getElementById("productionSearch");
const productionEmployeeFilter = document.getElementById("productionEmployeeFilter");

function getActiveEmployees() {
  return employees.filter(employee => employee.active);
}

function refreshProductionSelectors() {
  const activeEmployees = getActiveEmployees();
  productionEmployee.innerHTML = activeEmployees.length
    ? activeEmployees.map(employee => `<option value="${employee.id}">${escapeHtml(employee.firstName)} ${escapeHtml(employee.lastName)}</option>`).join("")
    : `<option value="">Keine aktiven Mitarbeiter vorhanden</option>`;

  const activeProducts = inventoryData.products.filter(product => product.active);
  productionProduct.innerHTML = activeProducts.length
    ? activeProducts.map(product => `<option value="${product.id}">${escapeHtml(product.name)}</option>`).join("")
    : `<option value="">Keine aktiven Produkte vorhanden</option>`;

  productionEmployeeFilter.innerHTML =
    `<option value="all">Alle Mitarbeiter</option>` +
    employees.map(employee => `<option value="${employee.id}">${escapeHtml(employee.firstName)} ${escapeHtml(employee.lastName)}</option>`).join("");
}

function getEmployeeById(id) {
  return employees.find(employee => employee.id === id);
}

function getProductById(id) {
  return inventoryData.products.find(product => product.id === id);
}

function getStoredItemReference(id) {
  const material = inventoryData.materials.find(item => item.id === id);
  if (material) return {item: material, type: "material", unit: material.unit || "Stück"};

  const product = inventoryData.products.find(item => item.id === id);
  if (product) return {item: product, type: "product", unit: "Stück"};

  return null;
}

function calculateProductionPreview() {
  const product = getProductById(productionProduct.value);
  const employee = getEmployeeById(productionEmployee.value);
  const quantity = Math.max(0, Number(productionQuantity.value || 0));

  const unitPrice = Number(product?.salePrice || 0);
  const totalValue = unitPrice * quantity;
  const profitValue = totalValue * 0.10;
  const commissionRate = Number(employee?.commissionRate || 0);
  const commissionValue = profitValue * (commissionRate / 100);

  productionUnitPrice.textContent = moneyShort(unitPrice);
  productionTotalValue.textContent = moneyShort(totalValue);
  productionProfitValue.textContent = moneyShort(profitValue);
  productionCommissionValue.textContent = moneyShort(commissionValue);

  const recipe = product?.recipe || [];
  let hasMissing = false;
  const missingNames = [];

  if (!recipe.length) {
    productionIngredientCheck.innerHTML = `<div class="empty-state">Für dieses Produkt ist kein Rezept hinterlegt.</div>`;
    productionWarning.textContent = "Dieses Produkt kann erst produziert werden, wenn ein Rezept hinterlegt wurde.";
    productionWarning.classList.remove("hidden");
    productionSubmitButton.disabled = true;
    return;
  }

  productionIngredientCheck.innerHTML = recipe.map(entry => {
    const reference = getStoredItemReference(entry.itemId);
    const ingredient = reference?.item;
    const required = Number(entry.amount || 0) * quantity;
    const available = Number(ingredient?.stock || 0);
    const sufficient = available >= required;

    if (!sufficient) {
      hasMissing = true;
      missingNames.push(ingredient?.name || "Unbekannter Artikel");
    }

    return `
      <div class="ingredient-check-row">
        <div>
          <strong>${escapeHtml(ingredient?.name || "Unbekannter Artikel")}</strong>
          <span class="need">Benötigt: ${numberShort(required)} ${escapeHtml(reference?.unit || "")}</span>
        </div>
        <span>Vorhanden: <strong>${numberShort(available)} ${escapeHtml(reference?.unit || "")}</strong></span>
        <span class="ingredient-check-status ${sufficient ? "" : "missing"}">${sufficient ? "Ausreichend" : "Fehlt"}</span>
      </div>
    `;
  }).join("");

  if (!employee) {
    productionWarning.textContent = "Bitte zuerst einen aktiven Mitarbeiter anlegen.";
    productionWarning.classList.remove("hidden");
    productionSubmitButton.disabled = true;
    return;
  }

  if (!product) {
    productionWarning.textContent = "Bitte zuerst ein aktives Produkt anlegen.";
    productionWarning.classList.remove("hidden");
    productionSubmitButton.disabled = true;
    return;
  }

  if (quantity <= 0) {
    productionWarning.textContent = "Die Produktionsmenge muss größer als 0 sein.";
    productionWarning.classList.remove("hidden");
    productionSubmitButton.disabled = true;
    return;
  }

  if (hasMissing) {
    productionWarning.textContent = `Produktion nicht möglich. Nicht ausreichend vorhanden: ${missingNames.join(", ")}.`;
    productionWarning.classList.remove("hidden");
    productionSubmitButton.disabled = true;
  } else {
    productionWarning.classList.add("hidden");
    productionWarning.textContent = "";
    productionSubmitButton.disabled = false;
  }
}

function resetProductionForm() {
  productionForm.reset();
  productionQuantity.value = "1";
  refreshProductionSelectors();
  calculateProductionPreview();
}

document.getElementById("newProductionButton").addEventListener("click", () => {
  refreshProductionSelectors();
  resetProductionForm();
  openDriveModal("productionModal");
  calculateProductionPreview();
});

document.getElementById("productionCancelButton").addEventListener("click", () => {
  closeDriveModal("productionModal");
});

productionEmployee.addEventListener("change", calculateProductionPreview);
productionProduct.addEventListener("change", calculateProductionPreview);
productionQuantity.addEventListener("input", calculateProductionPreview);

productionForm.addEventListener("submit", event => {
  event.preventDefault();

  const employee = getEmployeeById(productionEmployee.value);
  const product = getProductById(productionProduct.value);
  const quantity = Math.floor(Number(productionQuantity.value || 0));

  if (!employee || !product || quantity <= 0) return;
  if (!product.recipe || !product.recipe.length) return;

  const ingredientSnapshot = [];
  let canProduce = true;

  product.recipe.forEach(entry => {
    const reference = getStoredItemReference(entry.itemId);
    if (!reference) {
      canProduce = false;
      return;
    }

    const required = Number(entry.amount || 0) * quantity;
    if (Number(reference.item.stock || 0) < required) {
      canProduce = false;
    }

    ingredientSnapshot.push({
      itemId: reference.item.id,
      itemName: reference.item.name,
      amountPerUnit: Number(entry.amount || 0),
      amountUsed: required,
      oldStock: Number(reference.item.stock || 0)
    });
  });

  if (!canProduce) {
    calculateProductionPreview();
    return;
  }

  ingredientSnapshot.forEach(entry => {
    const reference = getStoredItemReference(entry.itemId);
    reference.item.stock = Number(reference.item.stock || 0) - entry.amountUsed;
    entry.newStock = reference.item.stock;
  });

  const oldProductStock = Number(product.stock || 0);
  product.stock = oldProductStock + quantity;

  const unitPrice = Number(product.salePrice || 0);
  const totalValue = unitPrice * quantity;
  const profitValue = totalValue * 0.10;
  const commissionRate = Number(employee.commissionRate || 0);
  const commissionValue = profitValue * (commissionRate / 100);

  const productionEntry = {
    id: makeInventoryId("prod"),
    createdAt: new Date().toISOString(),
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice,
    totalValue,
    productionProfit: profitValue,
    commissionRate,
    commissionValue,
    ingredients: ingredientSnapshot,
    productOldStock: oldProductStock,
    productNewStock: product.stock
  };

  productions.push(productionEntry);

  if (commissionValue > 0) {
    commissionLedger.push({
      id: makeInventoryId("com"),
      createdAt: productionEntry.createdAt,
      type: "production",
      employeeId: employee.id,
      employeeName: productionEntry.employeeName,
      productionId: productionEntry.id,
      amount: commissionValue,
      status: "open"
    });
  }

  saveProductions();
  saveCommissionLedger();
  saveInventoryData();

  renderAllInventory();
  renderProductionHistory();
  renderProductionMetrics();
  closeDriveModal("productionModal");
});

function isTodayIso(iso) {
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
}

function renderProductionMetrics() {
  const todays = productions.filter(entry => isTodayIso(entry.createdAt));
  const count = todays.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
  const value = todays.reduce((sum, entry) => sum + Number(entry.totalValue || 0), 0);
  const profit = todays.reduce((sum, entry) => sum + Number(entry.productionProfit || 0), 0);
  const commission = todays.reduce((sum, entry) => sum + Number(entry.commissionValue || 0), 0);

  document.getElementById("productionTodayCount").textContent = numberShort(count);
  document.getElementById("productionTodayValue").textContent = moneyShort(value);
  document.getElementById("productionTodayProfit").textContent = moneyShort(profit);
  document.getElementById("productionTodayCommission").textContent = moneyShort(commission);
}

function renderProductionHistory() {
  const query = productionSearch.value.trim().toLowerCase();
  const employeeFilter = productionEmployeeFilter.value;

  const filtered = [...productions]
    .reverse()
    .filter(entry => {
      const searchText = `${entry.employeeName} ${entry.productName}`.toLowerCase();
      const matchesQuery = searchText.includes(query);
      const matchesEmployee = employeeFilter === "all" || entry.employeeId === employeeFilter;
      return matchesQuery && matchesEmployee;
    });

  productionHistoryBody.innerHTML = filtered.map(entry => `
    <tr>
      <td>
        ${new Intl.DateTimeFormat("de-DE", {
          day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"
        }).format(new Date(entry.createdAt))}
      </td>
      <td>${escapeHtml(entry.employeeName)}</td>
      <td>
        <strong>${escapeHtml(entry.productName)}</strong>
        <small>${entry.ingredients.map(i => `${numberShort(i.amountUsed)} × ${escapeHtml(i.itemName)}`).join(" · ")}</small>
      </td>
      <td>${numberShort(entry.quantity)}</td>
      <td>${moneyShort(entry.totalValue)}</td>
      <td>${moneyShort(entry.productionProfit)}</td>
      <td>${moneyShort(entry.commissionValue)} <small>${numberShort(entry.commissionRate)} %</small></td>
    </tr>
  `).join("");

  productionEmptyState.classList.toggle("hidden", filtered.length > 0);
}

productionSearch.addEventListener("input", renderProductionHistory);
productionEmployeeFilter.addEventListener("change", renderProductionHistory);

refreshProductionSelectors();
renderProductionHistory();
renderProductionMetrics();



/* =========================================================
   LIEFERANTEN – v0.5.1
   ========================================================= */

const DRIVE_SUPPLIERS_KEY = "drive_suppliers_v051";

function loadSuppliers() {
  try {
    const saved = localStorage.getItem(DRIVE_SUPPLIERS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

let suppliers = loadSuppliers();

function saveSuppliers() {
  localStorage.setItem(DRIVE_SUPPLIERS_KEY, JSON.stringify(suppliers));
}

const supplierForm = document.getElementById("supplierForm");
const supplierId = document.getElementById("supplierId");
const supplierName = document.getElementById("supplierName");
const supplierContact = document.getElementById("supplierContact");
const supplierTelegram = document.getElementById("supplierTelegram");
const supplierNote = document.getElementById("supplierNote");
const supplierSearch = document.getElementById("supplierSearch");
const supplierStatusFilter = document.getElementById("supplierStatusFilter");
const supplierTableBody = document.getElementById("supplierTableBody");
const supplierEmptyState = document.getElementById("supplierEmptyState");
const supplierFormMode = document.getElementById("supplierFormMode");
const supplierFormTitle = document.getElementById("supplierFormTitle");

function refreshSupplierSelect(selectedId = "") {
  const select = document.getElementById("purchaseSupplier");
  if (!select) return;

  const activeSuppliers = suppliers
    .filter(supplier => supplier.active)
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  select.innerHTML = activeSuppliers.length
    ? activeSuppliers.map(supplier => `
        <option value="${supplier.id}">
          ${escapeHtml(supplier.name)}${supplier.contact ? ` – ${escapeHtml(supplier.contact)}` : ""}
        </option>
      `).join("")
    : `<option value="">Noch keinen Lieferanten angelegt</option>`;

  if (selectedId && activeSuppliers.some(supplier => supplier.id === selectedId)) {
    select.value = selectedId;
  }
}

function renderSuppliers() {
  const query = supplierSearch.value.trim().toLowerCase();
  const status = supplierStatusFilter.value;

  const filtered = suppliers
    .filter(supplier => {
      const text = `${supplier.name} ${supplier.contact || ""} ${supplier.telegram || ""}`.toLowerCase();
      return text.includes(query);
    })
    .filter(supplier =>
      status === "all" ||
      (status === "active" && supplier.active) ||
      (status === "inactive" && !supplier.active)
    )
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  supplierTableBody.innerHTML = filtered.map(supplier => `
    <tr>
      <td>
        <div class="employee-name">
          <strong>${escapeHtml(supplier.name)}</strong>
          ${supplier.note ? `<small>${escapeHtml(supplier.note)}</small>` : ""}
        </div>
      </td>
      <td>${supplier.contact ? escapeHtml(supplier.contact) : "—"}</td>
      <td>${supplier.telegram ? escapeHtml(supplier.telegram) : "—"}</td>
      <td>
        <span class="status-badge ${supplier.active ? "" : "inactive"}">
          ${supplier.active ? "Aktiv" : "Deaktiviert"}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="mini-button" data-edit-supplier="${supplier.id}">Bearbeiten</button>
          <button class="mini-button ${supplier.active ? "danger" : ""}" data-toggle-supplier="${supplier.id}">
            ${supplier.active ? "Deaktivieren" : "Aktivieren"}
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  supplierEmptyState.classList.toggle("hidden", filtered.length > 0);

  document.querySelectorAll("[data-edit-supplier]").forEach(button => {
    button.addEventListener("click", () => editSupplier(button.dataset.editSupplier));
  });

  document.querySelectorAll("[data-toggle-supplier]").forEach(button => {
    button.addEventListener("click", () => toggleSupplier(button.dataset.toggleSupplier));
  });

  refreshSupplierSelect();
}

function resetSupplierForm() {
  supplierForm.reset();
  supplierId.value = "";
  supplierFormMode.textContent = "Neuer Lieferant";
  supplierFormTitle.textContent = "Lieferant anlegen";
}

function editSupplier(id) {
  const supplier = suppliers.find(item => item.id === id);
  if (!supplier) return;

  supplierId.value = supplier.id;
  supplierName.value = supplier.name;
  supplierContact.value = supplier.contact || "";
  supplierTelegram.value = supplier.telegram || "";
  supplierNote.value = supplier.note || "";
  supplierFormMode.textContent = "Lieferant bearbeiten";
  supplierFormTitle.textContent = supplier.name;
}

function toggleSupplier(id) {
  const supplier = suppliers.find(item => item.id === id);
  if (!supplier) return;

  supplier.active = !supplier.active;
  supplier.updatedAt = new Date().toISOString();
  saveSuppliers();
  renderSuppliers();

  if (supplierId.value === id && !supplier.active) resetSupplierForm();
}

supplierForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = supplierName.value.trim();
  if (!name) return;

  const payload = {
    name,
    contact: supplierContact.value.trim(),
    telegram: supplierTelegram.value.trim(),
    note: supplierNote.value.trim()
  };

  let savedSupplierId = supplierId.value;

  if (savedSupplierId) {
    const supplier = suppliers.find(item => item.id === savedSupplierId);
    if (supplier) {
      Object.assign(supplier, payload, {updatedAt: new Date().toISOString()});
    }
  } else {
    savedSupplierId = makeInventoryId("sup");
    suppliers.push({
      id: savedSupplierId,
      ...payload,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  saveSuppliers();
  resetSupplierForm();
  renderSuppliers();
  refreshSupplierSelect(savedSupplierId);
});

supplierSearch.addEventListener("input", renderSuppliers);
supplierStatusFilter.addEventListener("change", renderSuppliers);
document.getElementById("supplierCancelButton").addEventListener("click", resetSupplierForm);

document.getElementById("manageSuppliersButton").addEventListener("click", () => {
  resetSupplierForm();
  renderSuppliers();
  openDriveModal("supplierModal");
});

document.getElementById("quickAddSupplierButton").addEventListener("click", () => {
  resetSupplierForm();
  renderSuppliers();
  openDriveModal("supplierModal");
  supplierName.focus();
});

renderSuppliers();

/* =========================================================
   EINKAUF – v0.5
   ========================================================= */

const DRIVE_PURCHASE_KEY = "drive_purchases_v05";
const DRIVE_CASH_KEY = "drive_cash_v05";

let purchases = loadJsonStorage(DRIVE_PURCHASE_KEY, []);
let cashData = loadJsonStorage(DRIVE_CASH_KEY, {
  openingBalance: 0,
  movements: []
});

function savePurchases() {
  localStorage.setItem(DRIVE_PURCHASE_KEY, JSON.stringify(purchases));
}

function saveCashData() {
  localStorage.setItem(DRIVE_CASH_KEY, JSON.stringify(cashData));
}

const purchaseForm = document.getElementById("purchaseForm");
const purchaseEmployee = document.getElementById("purchaseEmployee");
const purchaseSupplier = document.getElementById("purchaseSupplier");
const purchaseItem = document.getElementById("purchaseItem");
const purchaseQuantity = document.getElementById("purchaseQuantity");
const purchaseUnitPrice = document.getElementById("purchaseUnitPrice");
const purchasePaymentStatus = document.getElementById("purchasePaymentStatus");
const purchaseDueDateLabel = document.getElementById("purchaseDueDateLabel");
const purchaseDueDate = document.getElementById("purchaseDueDate");
const purchaseNote = document.getElementById("purchaseNote");
const purchaseMoneyFields = document.getElementById("purchaseMoneyFields");
const purchaseResourceFields = document.getElementById("purchaseResourceFields");
const purchaseResourceDescription = document.getElementById("purchaseResourceDescription");
const purchaseStockBefore = document.getElementById("purchaseStockBefore");
const purchaseStockAfter = document.getElementById("purchaseStockAfter");
const purchaseTotalCost = document.getElementById("purchaseTotalCost");
const purchaseCashImpact = document.getElementById("purchaseCashImpact");
const purchaseWarning = document.getElementById("purchaseWarning");
const purchaseSubmitButton = document.getElementById("purchaseSubmitButton");
const purchaseHistoryBody = document.getElementById("purchaseHistoryBody");
const purchaseEmptyState = document.getElementById("purchaseEmptyState");
const purchaseSearch = document.getElementById("purchaseSearch");
const purchaseStatusFilter = document.getElementById("purchaseStatusFilter");

function getPurchasableItems() {
  return [
    ...inventoryData.materials
      .filter(item => item.active)
      .map(item => ({...item, type:"material", unit:item.unit || "Stück"})),
    ...inventoryData.products
      .filter(item => item.active)
      .map(item => ({...item, type:"product", unit:"Stück", purchaseCost:{
        type:"money",
        amount:Number(item.purchasePrice || 0)
      }}))
  ];
}

function getPurchasableItem(id) {
  return getPurchasableItems().find(item => item.id === id);
}

function refreshPurchaseSelectors() {
  const activeEmployees = getActiveEmployees();
  purchaseEmployee.innerHTML = activeEmployees.length
    ? activeEmployees.map(employee => `<option value="${employee.id}">${escapeHtml(employee.firstName)} ${escapeHtml(employee.lastName)}</option>`).join("")
    : `<option value="">Keine aktiven Mitarbeiter vorhanden</option>`;

  const items = getPurchasableItems();
  purchaseItem.innerHTML = items.length
    ? items.map(item => `<option value="${item.id}">${escapeHtml(item.name)} (${item.type === "material" ? "Rohstoff" : "Produkt"})</option>`).join("")
    : `<option value="">Keine Artikel vorhanden</option>`;
}

function setStoredStock(id, value) {
  const material = inventoryData.materials.find(item => item.id === id);
  if (material) {
    material.stock = value;
    return;
  }
  const product = inventoryData.products.find(item => item.id === id);
  if (product) product.stock = value;
}

function purchaseStatusText(status) {
  if (status === "paid") return "Bezahlt";
  if (status === "invoice") return "Rechnung";
  return "Offen";
}

function refreshPurchaseDueDate() {
  const showDueDate = purchasePaymentStatus.value !== "paid";
  purchaseDueDateLabel.classList.toggle("hidden", !showDueDate);
}

function calculatePurchasePreview() {
  const item = getPurchasableItem(purchaseItem.value);
  const quantity = Math.max(0, Number(purchaseQuantity.value || 0));

  purchaseWarning.classList.add("hidden");
  purchaseWarning.textContent = "";
  purchaseSubmitButton.disabled = false;

  if (!item) {
    purchaseSubmitButton.disabled = true;
    return;
  }

  const before = Number(item.stock || 0);
  const after = before + quantity;
  purchaseStockBefore.textContent = `${numberShort(before)} ${escapeHtml(item.unit || "")}`;
  purchaseStockAfter.textContent = `${numberShort(after)} ${escapeHtml(item.unit || "")}`;

  const cost = item.purchaseCost || {type:"money", amount:0};

  if (cost.type === "resource") {
    purchaseMoneyFields.classList.add("hidden");
    purchaseResourceFields.classList.remove("hidden");

    const resource = getInventoryItem(cost.itemId);
    const requiredResource = Number(cost.amount || 0) * quantity;
    const availableResource = Number(resource?.stock || 0);

    purchaseResourceDescription.textContent =
      `${numberShort(requiredResource)} × ${resource?.name || "Lagerartikel"}`;

    purchaseTotalCost.textContent =
      `${numberShort(requiredResource)} × ${resource?.name || "Artikel"}`;
    purchaseCashImpact.textContent = "$ 0,00";

    if (!resource || availableResource < requiredResource) {
      purchaseWarning.textContent =
        `Nicht genügend ${resource?.name || "Lagerbestand"} vorhanden. Benötigt: ${numberShort(requiredResource)}, vorhanden: ${numberShort(availableResource)}.`;
      purchaseWarning.classList.remove("hidden");
      purchaseSubmitButton.disabled = true;
    }
  } else {
    purchaseMoneyFields.classList.remove("hidden");
    purchaseResourceFields.classList.add("hidden");

    if (document.activeElement !== purchaseUnitPrice || purchaseUnitPrice.dataset.manual !== "true") {
      purchaseUnitPrice.value = Number(cost.amount || 0).toFixed(2);
    }

    const unitPrice = Number(purchaseUnitPrice.value || 0);
    const total = unitPrice * quantity;
    const cashImpact = purchasePaymentStatus.value === "paid" ? -total : 0;

    purchaseTotalCost.textContent = moneyShort(total);
    purchaseCashImpact.textContent = cashImpact === 0 ? "$ 0,00" : `−${moneyShort(Math.abs(cashImpact))}`;
    refreshPurchaseDueDate();
  }

  if (!getEmployeeById(purchaseEmployee.value)) {
    purchaseWarning.textContent = "Bitte zuerst einen aktiven Mitarbeiter anlegen.";
    purchaseWarning.classList.remove("hidden");
    purchaseSubmitButton.disabled = true;
  }

  if (!suppliers.find(supplier => supplier.id === purchaseSupplier.value && supplier.active)) {
    purchaseWarning.textContent = "Bitte zuerst einen aktiven Lieferanten anlegen.";
    purchaseWarning.classList.remove("hidden");
    purchaseSubmitButton.disabled = true;
  }

  if (quantity <= 0) {
    purchaseWarning.textContent = "Die Einkaufsmenge muss größer als 0 sein.";
    purchaseWarning.classList.remove("hidden");
    purchaseSubmitButton.disabled = true;
  }
}

function resetPurchaseForm() {
  purchaseForm.reset();
  refreshPurchaseSelectors();
  refreshSupplierSelect();
  purchaseQuantity.value = "1";
  purchaseUnitPrice.dataset.manual = "false";
  purchasePaymentStatus.value = "paid";
  purchaseDueDate.value = "";
  calculatePurchasePreview();
}

document.getElementById("newPurchaseButton").addEventListener("click", () => {
  resetPurchaseForm();
  openDriveModal("purchaseModal");
  calculatePurchasePreview();
});

document.getElementById("purchaseCancelButton").addEventListener("click", () => {
  closeDriveModal("purchaseModal");
});

purchaseEmployee.addEventListener("change", calculatePurchasePreview);
purchaseItem.addEventListener("change", () => {
  purchaseUnitPrice.dataset.manual = "false";
  calculatePurchasePreview();
});
purchaseQuantity.addEventListener("input", calculatePurchasePreview);
purchasePaymentStatus.addEventListener("change", calculatePurchasePreview);
purchaseUnitPrice.addEventListener("input", () => {
  purchaseUnitPrice.dataset.manual = "true";
  calculatePurchasePreview();
});

purchaseForm.addEventListener("submit", event => {
  event.preventDefault();

  const employee = getEmployeeById(purchaseEmployee.value);
  const item = getPurchasableItem(purchaseItem.value);
  const quantity = Number(purchaseQuantity.value || 0);
  const supplier = suppliers.find(entry => entry.id === purchaseSupplier.value);

  if (!employee || !item || quantity <= 0 || !supplier) return;

  const cost = item.purchaseCost || {type:"money", amount:0};
  const oldStock = Number(item.stock || 0);
  const newStock = oldStock + quantity;

  let entry = {
    id: makeInventoryId("pur"),
    createdAt: new Date().toISOString(),
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    supplierId: supplier.id,
    supplier: supplier.name,
    supplierContact: supplier.contact || "",
    supplierTelegram: supplier.telegram || "",
    itemId: item.id,
    itemName: item.name,
    itemType: item.type,
    unit: item.unit || "Stück",
    quantity,
    oldStock,
    newStock,
    note: purchaseNote.value.trim(),
    paymentType: cost.type === "resource" ? "resource" : "money"
  };

  if (cost.type === "resource") {
    const resource = getInventoryItem(cost.itemId);
    const resourceAmount = Number(cost.amount || 0) * quantity;

    if (!resource || Number(resource.stock || 0) < resourceAmount) {
      calculatePurchasePreview();
      return;
    }

    const resourceOldStock = Number(resource.stock || 0);
    resource.stock = resourceOldStock - resourceAmount;

    entry = {
      ...entry,
      paymentStatus: "paid",
      totalCost: 0,
      resourcePayment: {
        itemId: resource.id,
        itemName: resource.name,
        amount: resourceAmount,
        oldStock: resourceOldStock,
        newStock: resource.stock
      }
    };
  } else {
    const unitPrice = Number(purchaseUnitPrice.value || 0);
    const totalCost = unitPrice * quantity;
    const paymentStatus = purchasePaymentStatus.value;

    entry = {
      ...entry,
      unitPrice,
      totalCost,
      paymentStatus,
      dueDate: paymentStatus === "paid" ? "" : purchaseDueDate.value
    };

    if (paymentStatus === "paid" && totalCost > 0) {
      cashData.movements.push({
        id: makeInventoryId("cash"),
        createdAt: entry.createdAt,
        type: "purchase",
        direction: "out",
        amount: totalCost,
        referenceId: entry.id,
        description: `Einkauf ${item.name} bei ${typeof supplier === "object" ? supplier.name : supplier}`
      });
    }
  }

  setStoredStock(item.id, newStock);
  purchases.push(entry);

  saveInventoryData();
  savePurchases();
  saveCashData();

  renderAllInventory();
  renderPurchaseHistory();
  renderPurchaseMetrics();
  closeDriveModal("purchaseModal");
});

function markPurchasePaid(id) {
  const entry = purchases.find(item => item.id === id);
  if (!entry || entry.paymentType !== "money" || entry.paymentStatus === "paid") return;

  const confirmed = window.confirm(
    `Zahlung über ${moneyShort(entry.totalCost)} für "${entry.itemName}" jetzt als bezahlt markieren?`
  );
  if (!confirmed) return;

  entry.paymentStatus = "paid";
  entry.paidAt = new Date().toISOString();

  cashData.movements.push({
    id: makeInventoryId("cash"),
    createdAt: entry.paidAt,
    type: "purchase",
    direction: "out",
    amount: Number(entry.totalCost || 0),
    referenceId: entry.id,
    description: `Nachträgliche Zahlung: Einkauf ${entry.itemName} bei ${typeof entry.supplier === "object" ? entry.supplier.name : entry.supplier}`
  });

  savePurchases();
  saveCashData();
  renderPurchaseHistory();
  renderPurchaseMetrics();
}

function renderPurchaseMetrics() {
  const todays = purchases.filter(entry => isTodayIso(entry.createdAt));
  const paidToday = cashData.movements
    .filter(movement => movement.type === "purchase" && isTodayIso(movement.createdAt))
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);

  const openMoneyEntries = purchases.filter(entry =>
    entry.paymentType === "money" && entry.paymentStatus !== "paid"
  );

  const openValue = openMoneyEntries.reduce((sum, entry) => sum + Number(entry.totalCost || 0), 0);

  document.getElementById("purchaseTodayCount").textContent = numberShort(todays.length);
  document.getElementById("purchaseTodayPaid").textContent = moneyShort(paidToday);
  document.getElementById("purchaseOpenValue").textContent = moneyShort(openValue);
  document.getElementById("purchaseOpenCount").textContent = numberShort(openMoneyEntries.length);
}

function renderPurchaseHistory() {
  const query = purchaseSearch.value.trim().toLowerCase();
  const statusFilter = purchaseStatusFilter.value;

  const filtered = [...purchases]
    .reverse()
    .filter(entry => {
      const text = `${entry.employeeName} ${entry.supplier} ${entry.supplierContact || ""} ${entry.supplierTelegram || ""} ${entry.itemName}`.toLowerCase();
      const matchesSearch = text.includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        entry.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });

  purchaseHistoryBody.innerHTML = filtered.map(entry => {
    const isResource = entry.paymentType === "resource";
    const costText = isResource
      ? `${numberShort(entry.resourcePayment?.amount || 0)} × ${escapeHtml(entry.resourcePayment?.itemName || "Artikel")}`
      : moneyShort(entry.totalCost || 0);

    return `
      <tr>
        <td>${new Intl.DateTimeFormat("de-DE", {
          day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"
        }).format(new Date(entry.createdAt))}</td>
        <td>${escapeHtml(entry.employeeName)}</td>
        <td>${escapeHtml(entry.supplier)}</td>
        <td>
          <strong>${escapeHtml(entry.itemName)}</strong>
          ${entry.note ? `<small>${escapeHtml(entry.note)}</small>` : ""}
        </td>
        <td>${numberShort(entry.quantity)} ${escapeHtml(entry.unit || "")}</td>
        <td>${costText}</td>
        <td>
          <span class="payment-badge ${entry.paymentStatus}">
            ${isResource ? "Sachzahlung" : purchaseStatusText(entry.paymentStatus)}
          </span>
          ${entry.dueDate && entry.paymentStatus !== "paid" ? `<small>Fällig: ${formatDate(entry.dueDate)}</small>` : ""}
        </td>
        <td>
          ${!isResource && entry.paymentStatus !== "paid"
            ? `<button class="mini-button" data-pay-purchase="${entry.id}">Als bezahlt markieren</button>`
            : "—"}
        </td>
      </tr>
    `;
  }).join("");

  purchaseEmptyState.classList.toggle("hidden", filtered.length > 0);

  document.querySelectorAll("[data-pay-purchase]").forEach(button => {
    button.addEventListener("click", () => markPurchasePaid(button.dataset.payPurchase));
  });
}

purchaseSearch.addEventListener("input", renderPurchaseHistory);
purchaseStatusFilter.addEventListener("change", renderPurchaseHistory);

refreshPurchaseSelectors();
renderPurchaseHistory();
renderPurchaseMetrics();



/* =========================================================
   KUNDEN – v0.10.2
   ========================================================= */

const DRIVE_CUSTOMERS_KEY = "drive_customers_v0102";
let customers = loadJsonStorage(DRIVE_CUSTOMERS_KEY, []);

function saveCustomers() {
  localStorage.setItem(DRIVE_CUSTOMERS_KEY, JSON.stringify(customers));
}

const customerForm = document.getElementById("customerForm");
const customerId = document.getElementById("customerId");
const customerName = document.getElementById("customerName");
const customerContact = document.getElementById("customerContact");
const customerTelegram = document.getElementById("customerTelegram");
const customerNote = document.getElementById("customerNote");
const customerSearch = document.getElementById("customerSearch");
const customerStatusFilter = document.getElementById("customerStatusFilter");
const customerTableBody = document.getElementById("customerTableBody");
const customerEmptyState = document.getElementById("customerEmptyState");

function refreshCustomerSelect(selectedId = "") {
  const select = document.getElementById("saleCustomer");
  if (!select) return;

  const active = customers
    .filter(customer => customer.active)
    .sort((a,b) => a.name.localeCompare(b.name, "de"));

  select.innerHTML =
    `<option value="">Kein Kunde / Laufkundschaft</option>` +
    active.map(customer => `<option value="${customer.id}">${escapeHtml(customer.name)}</option>`).join("");

  if (selectedId && active.some(customer => customer.id === selectedId)) {
    select.value = selectedId;
  }
}

function renderCustomers() {
  const query = customerSearch.value.trim().toLowerCase();
  const status = customerStatusFilter.value;

  const filtered = customers
    .filter(customer => `${customer.name} ${customer.contact || ""} ${customer.telegram || ""}`.toLowerCase().includes(query))
    .filter(customer => status === "all" || (status === "active" ? customer.active : !customer.active))
    .sort((a,b) => a.name.localeCompare(b.name, "de"));

  customerTableBody.innerHTML = filtered.map(customer => `
    <tr>
      <td>
        <div class="employee-name">
          <strong>${escapeHtml(customer.name)}</strong>
          ${customer.note ? `<small>${escapeHtml(customer.note)}</small>` : ""}
        </div>
      </td>
      <td>${customer.contact ? escapeHtml(customer.contact) : "—"}</td>
      <td>${customer.telegram ? escapeHtml(customer.telegram) : "—"}</td>
      <td><span class="status-badge ${customer.active ? "" : "inactive"}">${customer.active ? "Aktiv" : "Deaktiviert"}</span></td>
      <td>
        <div class="table-actions">
          <button class="mini-button" data-edit-customer="${customer.id}">Bearbeiten</button>
          <button class="mini-button ${customer.active ? "danger" : ""}" data-toggle-customer="${customer.id}">
            ${customer.active ? "Deaktivieren" : "Aktivieren"}
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  customerEmptyState.classList.toggle("hidden", filtered.length > 0);

  document.querySelectorAll("[data-edit-customer]").forEach(button => {
    button.addEventListener("click", () => editCustomer(button.dataset.editCustomer));
  });

  document.querySelectorAll("[data-toggle-customer]").forEach(button => {
    button.addEventListener("click", () => toggleCustomer(button.dataset.toggleCustomer));
  });

  refreshCustomerSelect();
}

function resetCustomerForm() {
  customerForm.reset();
  customerId.value = "";
  document.getElementById("customerFormMode").textContent = "Neuer Kunde";
  document.getElementById("customerFormTitle").textContent = "Kunde anlegen";
}

function editCustomer(id) {
  const customer = customers.find(item => item.id === id);
  if (!customer) return;

  customerId.value = customer.id;
  customerName.value = customer.name;
  customerContact.value = customer.contact || "";
  customerTelegram.value = customer.telegram || "";
  customerNote.value = customer.note || "";
  document.getElementById("customerFormMode").textContent = "Kunde bearbeiten";
  document.getElementById("customerFormTitle").textContent = customer.name;
}

function toggleCustomer(id) {
  const customer = customers.find(item => item.id === id);
  if (!customer) return;

  customer.active = !customer.active;
  customer.updatedAt = new Date().toISOString();
  saveCustomers();
  renderCustomers();
}

customerForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = customerName.value.trim();
  if (!name) return;

  const payload = {
    name,
    contact: customerContact.value.trim(),
    telegram: customerTelegram.value.trim(),
    note: customerNote.value.trim()
  };

  let savedId = customerId.value;

  if (savedId) {
    const customer = customers.find(item => item.id === savedId);
    if (customer) Object.assign(customer, payload, {updatedAt:new Date().toISOString()});
  } else {
    savedId = makeInventoryId("cus");
    customers.push({
      id:savedId,
      ...payload,
      active:true,
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    });
  }

  saveCustomers();
  resetCustomerForm();
  renderCustomers();
  refreshCustomerSelect(savedId);
});

customerSearch.addEventListener("input", renderCustomers);
customerStatusFilter.addEventListener("change", renderCustomers);
document.getElementById("customerCancelButton").addEventListener("click", resetCustomerForm);

document.getElementById("manageCustomersButton").addEventListener("click", () => {
  resetCustomerForm();
  renderCustomers();
  openDriveModal("customerModal");
});

document.getElementById("quickAddCustomerButton").addEventListener("click", () => {
  resetCustomerForm();
  renderCustomers();
  openDriveModal("customerModal");
  customerName.focus();
});

renderCustomers();

/* =========================================================
   VERKAUF – v0.6
   ========================================================= */

const DRIVE_SALES_KEY = "drive_sales_v06";
let sales = loadJsonStorage(DRIVE_SALES_KEY, []);

function saveSales() {
  localStorage.setItem(DRIVE_SALES_KEY, JSON.stringify(sales));
}

const saleForm = document.getElementById("saleForm");
const saleEmployee = document.getElementById("saleEmployee");
const saleCustomer = document.getElementById("saleCustomer");
const saleProduct = document.getElementById("saleProduct");
const saleQuantity = document.getElementById("saleQuantity");
const saleUnitPrice = document.getElementById("saleUnitPrice");
const salePaymentStatus = document.getElementById("salePaymentStatus");
const saleDueDateLabel = document.getElementById("saleDueDateLabel");
const saleDueDate = document.getElementById("saleDueDate");
const saleNote = document.getElementById("saleNote");
const saleStockBefore = document.getElementById("saleStockBefore");
const saleStockAfter = document.getElementById("saleStockAfter");
const saleTotalRevenue = document.getElementById("saleTotalRevenue");
const saleCashImpact = document.getElementById("saleCashImpact");
const saleWarning = document.getElementById("saleWarning");
const saleSubmitButton = document.getElementById("saleSubmitButton");
const saleHistoryBody = document.getElementById("saleHistoryBody");
const saleEmptyState = document.getElementById("saleEmptyState");
const saleSearch = document.getElementById("saleSearch");
const saleStatusFilter = document.getElementById("saleStatusFilter");

function refreshSaleSelectors() {
  const activeEmployees = employees.filter(employee => employee.active);
  saleEmployee.innerHTML = activeEmployees.length
    ? activeEmployees.map(employee => `<option value="${employee.id}">${escapeHtml(employee.firstName)} ${escapeHtml(employee.lastName)}</option>`).join("")
    : `<option value="">Keine aktiven Mitarbeiter</option>`;

  const products = inventoryData.products
    .filter(product => product.active)
    .sort((a,b) => a.name.localeCompare(b.name, "de"));

  saleProduct.innerHTML = products.length
    ? products.map(product => `<option value="${product.id}">${escapeHtml(product.name)} · Bestand ${numberShort(product.stock)}</option>`).join("")
    : `<option value="">Keine aktiven Produkte</option>`;

  refreshCustomerSelect();
  updateSalePrice();
  updateSalePreview();
}

function getSaleProduct() {
  return inventoryData.products.find(product => product.id === saleProduct.value);
}

function updateSalePrice() {
  const product = getSaleProduct();
  if (product) saleUnitPrice.value = Number(product.salePrice || 0).toFixed(2);
}

function updateSalePreview() {
  const product = getSaleProduct();
  const quantity = Math.max(0, Number(saleQuantity.value || 0));
  const unitPrice = Math.max(0, Number(saleUnitPrice.value || 0));
  const total = quantity * unitPrice;
  const before = product ? Number(product.stock || 0) : 0;
  const after = before - quantity;

  saleStockBefore.textContent = product ? `${numberShort(before)} Stück` : "—";
  saleStockAfter.textContent = product ? `${numberShort(after)} Stück` : "—";
  saleTotalRevenue.textContent = moneyShort(total);
  saleCashImpact.textContent = salePaymentStatus.value === "paid" ? `+ ${moneyShort(total)}` : moneyShort(0);

  saleDueDateLabel.classList.toggle("hidden", salePaymentStatus.value === "paid");
  saleWarning.classList.add("hidden");
  saleSubmitButton.disabled = false;

  if (!employees.find(employee => employee.id === saleEmployee.value && employee.active)) {
    saleWarning.textContent = "Bitte zuerst einen aktiven Mitarbeiter anlegen.";
    saleWarning.classList.remove("hidden");
    saleSubmitButton.disabled = true;
  } else if (!product) {
    saleWarning.textContent = "Bitte zuerst ein aktives Produkt anlegen.";
    saleWarning.classList.remove("hidden");
    saleSubmitButton.disabled = true;
  } else if (quantity <= 0) {
    saleWarning.textContent = "Die Verkaufsmenge muss größer als 0 sein.";
    saleWarning.classList.remove("hidden");
    saleSubmitButton.disabled = true;
  } else if (after < 0) {
    saleWarning.textContent = `Nicht genügend Bestand. Verfügbar: ${numberShort(before)} Stück.`;
    saleWarning.classList.remove("hidden");
    saleSubmitButton.disabled = true;
  }
}

function resetSaleForm() {
  saleForm.reset();
  saleQuantity.value = "1";
  salePaymentStatus.value = "paid";
  refreshSaleSelectors();
}

function renderSaleMetrics() {
  const todays = sales.filter(entry => isTodayIso(entry.createdAt));
  const paidToday = todays.filter(entry => entry.paymentStatus === "paid");
  const open = sales.filter(entry => entry.paymentStatus !== "paid");

  document.getElementById("salesTodayCount").textContent = numberShort(todays.length);
  document.getElementById("salesTodayRevenue").textContent = moneyShort(
    paidToday.reduce((sum, entry) => sum + Number(entry.totalRevenue || 0), 0)
  );
  document.getElementById("salesOpenReceivables").textContent = moneyShort(
    open.reduce((sum, entry) => sum + Number(entry.totalRevenue || 0), 0)
  );
  document.getElementById("salesTodayUnits").textContent = numberShort(
    todays.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0)
  );
}

function saleStatusLabel(status) {
  if (status === "paid") return "Bezahlt";
  if (status === "invoice") return "Rechnung";
  return "Offen";
}

function renderSalesHistory() {
  const query = saleSearch.value.trim().toLowerCase();
  const status = saleStatusFilter.value;

  const filtered = [...sales].reverse().filter(entry => {
    const text = `${entry.employeeName} ${entry.customer || ""} ${entry.productName}`.toLowerCase();
    return text.includes(query) && (status === "all" || entry.paymentStatus === status);
  });

  saleHistoryBody.innerHTML = filtered.map(entry => `
    <tr>
      <td>${new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(entry.createdAt))}</td>
      <td>${escapeHtml(entry.employeeName)}</td>
      <td>${entry.customer ? escapeHtml(entry.customer) : "—"}</td>
      <td><strong>${escapeHtml(entry.productName)}</strong></td>
      <td>${numberShort(entry.quantity)} Stück</td>
      <td>${moneyShort(entry.totalRevenue)}</td>
      <td><span class="status-badge ${entry.paymentStatus === "paid" ? "" : "inactive"}">${saleStatusLabel(entry.paymentStatus)}</span></td>
      <td>${entry.paymentStatus === "paid" ? "—" : `<button class="mini-button" data-pay-sale="${entry.id}">Als bezahlt markieren</button>`}</td>
    </tr>
  `).join("");

  saleEmptyState.classList.toggle("hidden", filtered.length > 0);

  document.querySelectorAll("[data-pay-sale]").forEach(button => {
    button.addEventListener("click", () => markSalePaid(button.dataset.paySale));
  });
}

function markSalePaid(id) {
  const entry = sales.find(sale => sale.id === id);
  if (!entry || entry.paymentStatus === "paid") return;

  entry.paymentStatus = "paid";
  entry.paidAt = new Date().toISOString();

  cashData.movements.push({
    id: makeInventoryId("cash"),
    type: "sale",
    direction: "in",
    amount: Number(entry.totalRevenue || 0),
    referenceId: entry.id,
    description: `Verkauf: ${entry.productName}`,
    createdAt: entry.paidAt
  });

  saveSales();
  saveCashData();
  renderSalesHistory();
  renderSaleMetrics();
}

document.getElementById("newSaleButton").addEventListener("click", () => {
  resetSaleForm();
  openDriveModal("saleModal");
});

saleProduct.addEventListener("change", () => {
  updateSalePrice();
  updateSalePreview();
});
saleQuantity.addEventListener("input", updateSalePreview);
saleUnitPrice.addEventListener("input", updateSalePreview);
salePaymentStatus.addEventListener("change", updateSalePreview);
saleEmployee.addEventListener("change", updateSalePreview);
saleSearch.addEventListener("input", renderSalesHistory);
saleStatusFilter.addEventListener("change", renderSalesHistory);

saleForm.addEventListener("submit", event => {
  event.preventDefault();

  const employee = employees.find(entry => entry.id === saleEmployee.value && entry.active);
  const product = getSaleProduct();
  const quantity = Number(saleQuantity.value || 0);
  const unitPrice = Number(saleUnitPrice.value || 0);
  const totalRevenue = quantity * unitPrice;

  if (!employee || !product || quantity <= 0 || Number(product.stock || 0) < quantity) return;

  const createdAt = new Date().toISOString();
  const selectedCustomer = customers.find(customer => customer.id === saleCustomer.value);

  const entry = {
    id: makeInventoryId("sale"),
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    customerId: selectedCustomer ? selectedCustomer.id : "",
    customer: selectedCustomer ? selectedCustomer.name : "",
    customerContact: selectedCustomer ? (selectedCustomer.contact || "") : "",
    customerTelegram: selectedCustomer ? (selectedCustomer.telegram || "") : "",
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice,
    totalRevenue,
    paymentStatus: salePaymentStatus.value,
    dueDate: salePaymentStatus.value === "paid" ? "" : saleDueDate.value,
    note: saleNote.value.trim(),
    createdAt
  };

  product.stock = Number(product.stock || 0) - quantity;
  sales.push(entry);

  if (entry.paymentStatus === "paid") {
    cashData.movements.push({
      id: makeInventoryId("cash"),
      type: "sale",
      direction: "in",
      amount: totalRevenue,
      referenceId: entry.id,
      description: `Verkauf: ${product.name}`,
      createdAt
    });
  }

  saveInventoryData();
  saveSales();
  saveCashData();
  renderStock();
  renderProducts();
  renderSalesHistory();
  renderSaleMetrics();
  closeDriveModal("saleModal");
});

refreshSaleSelectors();
renderSalesHistory();
renderSaleMetrics();



/* =========================================================
   KASSE – v0.7
   ========================================================= */

const cashCurrentBalance = document.getElementById("cashCurrentBalance");
const cashTodayIncome = document.getElementById("cashTodayIncome");
const cashTodayExpenses = document.getElementById("cashTodayExpenses");
const cashTodayMovements = document.getElementById("cashTodayMovements");
const cashHistoryBody = document.getElementById("cashHistoryBody");
const cashEmptyState = document.getElementById("cashEmptyState");
const cashSearch = document.getElementById("cashSearch");
const cashTypeFilter = document.getElementById("cashTypeFilter");

const cashMovementForm = document.getElementById("cashMovementForm");
const cashMovementDirection = document.getElementById("cashMovementDirection");
const cashMovementAmount = document.getElementById("cashMovementAmount");
const cashMovementDescription = document.getElementById("cashMovementDescription");
const cashMovementNote = document.getElementById("cashMovementNote");
const cashMovementBefore = document.getElementById("cashMovementBefore");
const cashMovementAfter = document.getElementById("cashMovementAfter");

const openingBalanceForm = document.getElementById("openingBalanceForm");
const openingBalanceAmount = document.getElementById("openingBalanceAmount");

function calculateCashBalance() {
  return Number(cashData.openingBalance || 0) +
    cashData.movements.reduce((sum, movement) => {
      const amount = Number(movement.amount || 0);
      return sum + (movement.direction === "in" ? amount : -amount);
    }, 0);
}

function renderCashMetrics() {
  const todays = cashData.movements.filter(movement => isTodayIso(movement.createdAt));
  const income = todays
    .filter(movement => movement.direction === "in")
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const expenses = todays
    .filter(movement => movement.direction === "out")
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);

  cashCurrentBalance.textContent = moneyShort(calculateCashBalance());
  cashTodayIncome.textContent = moneyShort(income);
  cashTodayExpenses.textContent = moneyShort(expenses);
  cashTodayMovements.textContent = numberShort(todays.length);
}

function cashMovementTypeLabel(movement) {
  if (movement.type === "sale") return "Verkauf";
  if (movement.type === "purchase") return "Einkauf";
  if (movement.type === "manual") return "Manuell";
  return "Buchung";
}

function getCashRowsWithRunningBalance() {
  const sorted = [...cashData.movements].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  let running = Number(cashData.openingBalance || 0);

  return sorted.map(movement => {
    const amount = Number(movement.amount || 0);
    running += movement.direction === "in" ? amount : -amount;
    return {...movement, balanceAfter: running};
  });
}

function renderCashHistory() {
  const query = cashSearch.value.trim().toLowerCase();
  const filter = cashTypeFilter.value;

  const rows = getCashRowsWithRunningBalance()
    .reverse()
    .filter(movement => {
      const text = `${movement.description || ""} ${cashMovementTypeLabel(movement)}`.toLowerCase();
      return text.includes(query) && (filter === "all" || movement.direction === filter);
    });

  cashHistoryBody.innerHTML = rows.map(movement => `
    <tr>
      <td>${new Intl.DateTimeFormat("de-DE", {
        day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit"
      }).format(new Date(movement.createdAt))}</td>
      <td>${cashMovementTypeLabel(movement)}</td>
      <td>
        <strong>${escapeHtml(movement.description || "Kassenbewegung")}</strong>
        ${movement.note ? `<small>${escapeHtml(movement.note)}</small>` : ""}
      </td>
      <td>${movement.direction === "in" ? moneyShort(movement.amount) : "—"}</td>
      <td>${movement.direction === "out" ? moneyShort(movement.amount) : "—"}</td>
      <td><strong>${moneyShort(movement.balanceAfter)}</strong></td>
    </tr>
  `).join("");

  cashEmptyState.classList.toggle("hidden", rows.length > 0);
}

function renderCashAll() {
  renderCashMetrics();
  renderCashHistory();
}

function updateCashMovementPreview() {
  const before = calculateCashBalance();
  const amount = Math.max(0, Number(cashMovementAmount.value || 0));
  const after = before + (cashMovementDirection.value === "in" ? amount : -amount);

  cashMovementBefore.textContent = moneyShort(before);
  cashMovementAfter.textContent = moneyShort(after);
}

document.getElementById("newCashMovementButton").addEventListener("click", () => {
  cashMovementForm.reset();
  cashMovementDirection.value = "in";
  updateCashMovementPreview();
  openDriveModal("cashMovementModal");
});

document.getElementById("setOpeningBalanceButton").addEventListener("click", () => {
  openingBalanceAmount.value = Number(cashData.openingBalance || 0).toFixed(2);
  openDriveModal("openingBalanceModal");
});

cashMovementDirection.addEventListener("change", updateCashMovementPreview);
cashMovementAmount.addEventListener("input", updateCashMovementPreview);
cashSearch.addEventListener("input", renderCashHistory);
cashTypeFilter.addEventListener("change", renderCashHistory);

cashMovementForm.addEventListener("submit", event => {
  event.preventDefault();

  const amount = Number(cashMovementAmount.value || 0);
  const description = cashMovementDescription.value.trim();
  if (amount <= 0 || !description) return;

  cashData.movements.push({
    id: makeInventoryId("cash"),
    createdAt: new Date().toISOString(),
    type: "manual",
    direction: cashMovementDirection.value,
    amount,
    description,
    note: cashMovementNote.value.trim()
  });

  saveCashData();
  renderCashAll();
  closeDriveModal("cashMovementModal");
});

openingBalanceForm.addEventListener("submit", event => {
  event.preventDefault();

  cashData.openingBalance = Math.max(0, Number(openingBalanceAmount.value || 0));
  cashData.openingBalanceUpdatedAt = new Date().toISOString();

  saveCashData();
  renderCashAll();
  closeDriveModal("openingBalanceModal");
});

renderCashAll();


/* =========================================================
   ÜBERSICHT – v0.7.1
   Echte Live-Daten statt Demo-Werte.
   ========================================================= */

function getOpenPurchaseValue() {
  return purchases
    .filter(entry => entry.paymentType === "money" && entry.paymentStatus !== "paid")
    .reduce((sum, entry) => sum + Number(entry.totalCost || 0), 0);
}

function getOpenSalesValue() {
  return sales
    .filter(entry => entry.paymentStatus !== "paid")
    .reduce((sum, entry) => sum + Number(entry.totalRevenue || 0), 0);
}

function getOpenCommissionValue() {
  return commissionLedger
    .filter(entry => entry.status === "open")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

function getTodayCashSummary() {
  const todays = cashData.movements.filter(movement => isTodayIso(movement.createdAt));
  const income = todays
    .filter(movement => movement.direction === "in")
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const expenses = todays
    .filter(movement => movement.direction === "out")
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);

  return {income, expenses};
}

function renderDashboardProduction() {
  const todays = productions.filter(entry => isTodayIso(entry.createdAt));
  const total = todays.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);

  const totalElement = document.getElementById("dashboardProductionToday");
  if (totalElement) totalElement.textContent = numberShort(total);

  const breakdown = document.getElementById("dashboardProductionBreakdown");
  if (!breakdown) return;

  const grouped = new Map();
  todays.forEach(entry => {
    const current = grouped.get(entry.productName) || 0;
    grouped.set(entry.productName, current + Number(entry.quantity || 0));
  });

  const top = [...grouped.entries()]
    .sort((a,b) => b[1] - a[1])
    .slice(0, 3);

  breakdown.innerHTML = top.length
    ? top.map(([name, qty]) => `
        <div class="ledger-row">
          <span>${escapeHtml(name)}</span>
          <strong>${numberShort(qty)} Stück</strong>
        </div>
      `).join("")
    : `<div class="empty-state">Heute noch keine Produktion.</div>`;
}

function renderDashboardWarnings() {
  const container = document.getElementById("dashboardInventoryWarnings");
  if (!container) return;

  const warnings = getAllInventoryItems()
    .filter(item => item.active)
    .filter(item => Number(item.minStock || 0) > 0 && Number(item.stock || 0) <= Number(item.minStock || 0))
    .sort((a,b) => {
      const ratioA = Number(a.stock || 0) / Number(a.minStock || 1);
      const ratioB = Number(b.stock || 0) / Number(b.minStock || 1);
      return ratioA - ratioB;
    })
    .slice(0, 5);

  container.innerHTML = warnings.length
    ? warnings.map(item => {
        const isCritical = Number(item.stock || 0) <= Number(item.minStock || 0) * 0.5;
        return `
          <div class="ledger-row warning ${isCritical ? "critical" : ""}">
            <span>
              <strong>${escapeHtml(item.name)}</strong>
              <small>${isCritical ? "Kritischer Bestand" : "Mindestbestand unterschritten"}</small>
            </span>
            <b>${numberShort(item.stock)} ${escapeHtml(item.unit || "Stück")}</b>
          </div>
        `;
      }).join("")
    : `<div class="empty-state">Keine Lagerwarnungen.</div>`;
}


function renderDashboardRecentJournal() {
  const container = document.getElementById("dashboardRecentJournal");
  if (!container) return;

  const entries = (typeof buildJournalEntries === "function")
    ? buildJournalEntries().slice(0, 3)
    : [];

  container.innerHTML = entries.length
    ? entries.map(entry => `
        <div class="journal-row">
          <time>${new Intl.DateTimeFormat("de-DE", {
            hour:"2-digit", minute:"2-digit"
          }).format(new Date(entry.createdAt))}</time>
          <span>
            <strong>${escapeHtml(entry.title)}</strong>
            <small>${escapeHtml(entry.description || "")}</small>
          </span>
        </div>
      `).join("")
    : `<div class="empty-state">Noch keine Einträge vorhanden.</div>`;
}

function renderDashboardLive() {
  const cash = document.getElementById("dashboardCashBalance");
  const cashToday = document.getElementById("dashboardCashToday");
  const receivables = document.getElementById("dashboardReceivables");
  const payables = document.getElementById("dashboardPayables");
  const commissions = document.getElementById("dashboardCommissions");

  const todayCash = getTodayCashSummary();

  if (cash) cash.textContent = moneyShort(calculateCashBalance());
  if (cashToday) cashToday.textContent = `Heute +${moneyShort(todayCash.income)} / −${moneyShort(todayCash.expenses)}`;
  if (receivables) receivables.textContent = moneyShort(getOpenSalesValue());
  if (payables) payables.textContent = moneyShort(getOpenPurchaseValue());
  if (commissions) commissions.textContent = moneyShort(getOpenCommissionValue());

  renderDashboardProduction();
  renderDashboardWarnings();
  renderDashboardRecentJournal();
}

/* Dashboard bei jeder relevanten Änderung neu zeichnen */
const _originalRenderAllInventory = renderAllInventory;
renderAllInventory = function() {
  _originalRenderAllInventory();
  renderDashboardLive();
};

const _originalRenderPurchaseMetrics = renderPurchaseMetrics;
renderPurchaseMetrics = function() {
  _originalRenderPurchaseMetrics();
  renderDashboardLive();
};

const _originalRenderSaleMetrics = renderSaleMetrics;
renderSaleMetrics = function() {
  _originalRenderSaleMetrics();
  renderDashboardLive();
};

const _originalRenderProductionMetrics = renderProductionMetrics;
renderProductionMetrics = function() {
  _originalRenderProductionMetrics();
  renderDashboardLive();
};

const _originalRenderCashAll = renderCashAll;
renderCashAll = function() {
  _originalRenderCashAll();
  renderDashboardLive();
};

renderDashboardLive();



/* =========================================================
   PROVISIONEN – v0.8
   ========================================================= */

const DRIVE_COMMISSION_RATES_KEY = "drive_commission_rates_v08";
let commissionRates = loadJsonStorage(DRIVE_COMMISSION_RATES_KEY, {});

function saveCommissionRates() {
  localStorage.setItem(DRIVE_COMMISSION_RATES_KEY, JSON.stringify(commissionRates));
}

function getEmployeeCommissionRate(employeeId) {
  return Math.max(0, Number(commissionRates[employeeId] || 0));
}

function syncCommissionsFromSales() {
  let changed = false;

  sales.forEach(sale => {
    if (commissionLedger.some(entry => entry.saleId === sale.id)) return;

    const rate = getEmployeeCommissionRate(sale.employeeId);
    if (rate <= 0) return;

    const amount = Number(sale.totalRevenue || 0) * rate / 100;
    commissionLedger.push({
      id: makeInventoryId("commission"),
      saleId: sale.id,
      employeeId: sale.employeeId,
      employeeName: sale.employeeName,
      saleRevenue: Number(sale.totalRevenue || 0),
      rate,
      amount,
      status: "open",
      createdAt: sale.createdAt || new Date().toISOString(),
      paidAt: ""
    });
    changed = true;
  });

  if (changed) saveCommissionLedger();
}

function renderCommissionMetrics() {
  const open = commissionLedger.filter(entry => entry.status === "open");
  const todayEarned = commissionLedger.filter(entry => isTodayIso(entry.createdAt));
  const todayPaid = commissionLedger.filter(entry => entry.paidAt && isTodayIso(entry.paidAt));

  document.getElementById("commissionOpenTotal").textContent = moneyShort(
    open.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
  );
  document.getElementById("commissionTodayEarned").textContent = moneyShort(
    todayEarned.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
  );
  document.getElementById("commissionTodayPaid").textContent = moneyShort(
    todayPaid.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
  );
  document.getElementById("commissionOpenCount").textContent = numberShort(open.length);
}

function renderCommissionEmployees() {
  const body = document.getElementById("commissionEmployeeBody");
  const empty = document.getElementById("commissionEmployeeEmpty");

  const rows = employees
    .filter(employee => employee.active || commissionLedger.some(entry => entry.employeeId === employee.id))
    .map(employee => {
      const employeeSales = sales.filter(sale => sale.employeeId === employee.id);
      const entries = commissionLedger.filter(entry => entry.employeeId === employee.id);
      const open = entries.filter(entry => entry.status === "open")
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const paid = entries.filter(entry => entry.status === "paid")
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const revenue = employeeSales.reduce((sum, sale) => sum + Number(sale.totalRevenue || 0), 0);

      return {employee, open, paid, revenue};
    });

  body.innerHTML = rows.map(row => `
    <tr>
      <td><strong>${escapeHtml(row.employee.firstName)} ${escapeHtml(row.employee.lastName)}</strong></td>
      <td>${numberShort(getEmployeeCommissionRate(row.employee.id))} %</td>
      <td>${moneyShort(row.revenue)}</td>
      <td>${moneyShort(row.open)}</td>
      <td>${moneyShort(row.paid)}</td>
      <td>${row.open > 0 ? `<button class="mini-button" data-pay-commission-employee="${row.employee.id}">Offene auszahlen</button>` : "—"}</td>
    </tr>
  `).join("");

  empty.classList.toggle("hidden", rows.length > 0);

  document.querySelectorAll("[data-pay-commission-employee]").forEach(button => {
    button.addEventListener("click", () => payEmployeeCommissions(button.dataset.payCommissionEmployee));
  });
}

function renderCommissionHistory() {
  const body = document.getElementById("commissionHistoryBody");
  const empty = document.getElementById("commissionHistoryEmpty");
  const query = document.getElementById("commissionSearch").value.trim().toLowerCase();
  const status = document.getElementById("commissionStatusFilter").value;

  const filtered = [...commissionLedger].reverse().filter(entry => {
    const text = `${entry.employeeName || ""} ${entry.saleId || ""}`.toLowerCase();
    return text.includes(query) && (status === "all" || entry.status === status);
  });

  body.innerHTML = filtered.map(entry => `
    <tr>
      <td>${new Intl.DateTimeFormat("de-DE", {
        day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit"
      }).format(new Date(entry.createdAt))}</td>
      <td>${escapeHtml(entry.employeeName || "—")}</td>
      <td>${escapeHtml(entry.saleId || "—")}</td>
      <td>${moneyShort(entry.saleRevenue)}</td>
      <td>${numberShort(entry.rate)} %</td>
      <td><strong>${moneyShort(entry.amount)}</strong></td>
      <td><span class="status-badge ${entry.status === "paid" ? "" : "inactive"}">${entry.status === "paid" ? "Ausgezahlt" : "Offen"}</span></td>
    </tr>
  `).join("");

  empty.classList.toggle("hidden", filtered.length > 0);
}

function renderCommissionRatesForm() {
  const list = document.getElementById("commissionRatesList");
  const activeEmployees = employees.filter(employee => employee.active);

  list.innerHTML = activeEmployees.length
    ? activeEmployees.map(employee => `
        <label class="commission-rate-row">
          <span>${escapeHtml(employee.firstName)} ${escapeHtml(employee.lastName)}</span>
          <span class="commission-rate-input">
            <input type="number" min="0" max="100" step="0.1"
              data-commission-rate="${employee.id}"
              value="${getEmployeeCommissionRate(employee.id)}">
            <b>%</b>
          </span>
        </label>
      `).join("")
    : `<div class="empty-state">Keine aktiven Mitarbeiter vorhanden.</div>`;
}

function renderCommissionsAll() {
  syncCommissionsFromSales();
  renderCommissionMetrics();
  renderCommissionEmployees();
  renderCommissionHistory();
  if (typeof renderDashboardLive === "function") renderDashboardLive();
}

function payEmployeeCommissions(employeeId) {
  const openEntries = commissionLedger.filter(entry =>
    entry.employeeId === employeeId && entry.status === "open"
  );
  if (!openEntries.length) return;

  const amount = openEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const employeeName = openEntries[0].employeeName || "Mitarbeiter";
  const paidAt = new Date().toISOString();

  openEntries.forEach(entry => {
    entry.status = "paid";
    entry.paidAt = paidAt;
  });

  cashData.movements.push({
    id: makeInventoryId("cash"),
    type: "manual",
    direction: "out",
    amount,
    referenceId: `commission-${employeeId}-${Date.now()}`,
    description: `Provisionsauszahlung: ${employeeName}`,
    createdAt: paidAt
  });

  saveCommissionLedger();
  saveCashData();
  if (typeof renderCashAll === "function") renderCashAll();
  renderCommissionsAll();
}

document.getElementById("commissionRatesButton").addEventListener("click", () => {
  renderCommissionRatesForm();
  openDriveModal("commissionRatesModal");
});

document.getElementById("commissionRecalculateButton").addEventListener("click", () => {
  syncCommissionsFromSales();
  renderCommissionsAll();
});

document.getElementById("commissionRatesForm").addEventListener("submit", event => {
  event.preventDefault();

  document.querySelectorAll("[data-commission-rate]").forEach(input => {
    commissionRates[input.dataset.commissionRate] = Math.max(0, Number(input.value || 0));
  });

  saveCommissionRates();
  closeDriveModal("commissionRatesModal");
  renderCommissionsAll();
});

document.getElementById("commissionSearch").addEventListener("input", renderCommissionHistory);
document.getElementById("commissionStatusFilter").addEventListener("change", renderCommissionHistory);

/* Neue Verkäufe sofort in die Provisionen übernehmen. */
const _v08RenderSaleMetrics = renderSaleMetrics;
renderSaleMetrics = function() {
  _v08RenderSaleMetrics();
  if (document.getElementById("commissionOpenTotal")) renderCommissionsAll();
};

renderCommissionsAll();



/* =========================================================
   JOURNAL – v0.9
   ========================================================= */

const journalTimeline = document.getElementById("journalTimeline");
const journalEmptyState = document.getElementById("journalEmptyState");
const journalSearch = document.getElementById("journalSearch");
const journalTypeFilter = document.getElementById("journalTypeFilter");

function journalTypeLabel(type) {
  if (type === "purchase") return "Einkauf";
  if (type === "sale") return "Verkauf";
  if (type === "production") return "Produktion";
  if (type === "cash") return "Kasse";
  if (type === "inventory") return "Lager";
  if (type === "commission") return "Provisionen";
  return "Vorgang";
}

function buildJournalEntries() {
  const entries = [];

  purchases.forEach(entry => {
    entries.push({
      id: `purchase-${entry.id}`,
      type: "purchase",
      createdAt: entry.createdAt,
      title: `Einkauf: ${entry.itemName}`,
      description: `${numberShort(entry.quantity)} ${entry.unit || ""} bei ${typeof entry.supplier === "object" ? entry.supplier.name : entry.supplier || "Lieferant"}`,
      amount: entry.paymentType === "money" ? Number(entry.totalCost || 0) : null,
      direction: entry.paymentStatus === "paid" && entry.paymentType === "money" ? "out" : "",
      employeeName: entry.employeeName || ""
    });
  });

  sales.forEach(entry => {
    entries.push({
      id: `sale-${entry.id}`,
      type: "sale",
      createdAt: entry.createdAt,
      title: `Verkauf: ${entry.productName}`,
      description: `${numberShort(entry.quantity)} Stück${entry.customer ? ` an ${entry.customer}` : ""}`,
      amount: Number(entry.totalRevenue || 0),
      direction: entry.paymentStatus === "paid" ? "in" : "",
      employeeName: entry.employeeName || ""
    });
  });

  productions.forEach(entry => {
    entries.push({
      id: `production-${entry.id}`,
      type: "production",
      createdAt: entry.createdAt,
      title: `Produktion: ${entry.productName}`,
      description: `${numberShort(entry.quantity)} Stück hergestellt`,
      amount: Number(entry.totalValue || 0),
      direction: "",
      employeeName: entry.employeeName || ""
    });
  });

  cashData.movements.forEach(entry => {
    if (entry.type === "purchase" || entry.type === "sale") return;
    entries.push({
      id: `cash-${entry.id}`,
      type: "cash",
      createdAt: entry.createdAt,
      title: entry.direction === "in" ? "Kasseneinnahme" : "Kassenausgabe",
      description: entry.description || "Manuelle Kassenbewegung",
      amount: Number(entry.amount || 0),
      direction: entry.direction || "",
      employeeName: ""
    });
  });

  inventoryData.adjustments.forEach(entry => {
    const diff = Number(entry.newStock || 0) - Number(entry.oldStock || 0);
    entries.push({
      id: `inventory-${entry.id}`,
      type: "inventory",
      createdAt: entry.createdAt,
      title: `Lagerkorrektur: ${entry.itemName || "Artikel"}`,
      description: `${numberShort(entry.oldStock)} → ${numberShort(entry.newStock)} (${diff >= 0 ? "+" : ""}${numberShort(diff)}) · ${entry.reason || ""}`,
      amount: null,
      direction: "",
      employeeName: ""
    });
  });

  commissionLedger.forEach(entry => {
    if (entry.status !== "paid" || !entry.paidAt) return;
    entries.push({
      id: `commission-${entry.id}`,
      type: "commission",
      createdAt: entry.paidAt,
      title: `Provision ausgezahlt`,
      description: `${entry.employeeName || "Mitarbeiter"} · ${moneyShort(entry.amount || 0)}`,
      amount: Number(entry.amount || 0),
      direction: "out",
      employeeName: entry.employeeName || ""
    });
  });

  return entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function renderJournalMetrics(entries = buildJournalEntries()) {
  const todays = entries.filter(entry => isTodayIso(entry.createdAt));

  document.getElementById("journalTodayCount").textContent = numberShort(todays.length);
  document.getElementById("journalTodayPurchases").textContent = numberShort(
    todays.filter(entry => entry.type === "purchase").length
  );
  document.getElementById("journalTodaySales").textContent = numberShort(
    todays.filter(entry => entry.type === "sale").length
  );
  document.getElementById("journalTodayProductions").textContent = numberShort(
    todays.filter(entry => entry.type === "production").length
  );
}

function renderJournal() {
  const all = buildJournalEntries();
  renderJournalMetrics(all);

  const query = journalSearch.value.trim().toLowerCase();
  const filter = journalTypeFilter.value;

  const filtered = all.filter(entry => {
    const text = `${entry.title} ${entry.description} ${entry.employeeName || ""}`.toLowerCase();
    return text.includes(query) && (filter === "all" || entry.type === filter);
  });

  journalTimeline.innerHTML = filtered.map(entry => `
    <article class="journal-entry-card">
      <div class="journal-entry-time">
        <strong>${new Intl.DateTimeFormat("de-DE", {
          day:"2-digit", month:"2-digit", year:"numeric"
        }).format(new Date(entry.createdAt))}</strong>
        <small>${new Intl.DateTimeFormat("de-DE", {
          hour:"2-digit", minute:"2-digit"
        }).format(new Date(entry.createdAt))}</small>
      </div>

      <div class="journal-entry-main">
        <div class="journal-entry-head">
          <span class="journal-type-badge">${journalTypeLabel(entry.type)}</span>
          ${entry.employeeName ? `<small>${escapeHtml(entry.employeeName)}</small>` : ""}
        </div>
        <h4>${escapeHtml(entry.title)}</h4>
        <p>${escapeHtml(entry.description)}</p>
      </div>

      <div class="journal-entry-amount ${entry.direction === "out" ? "negative" : entry.direction === "in" ? "positive" : ""}">
        ${entry.amount === null ? "" : `${entry.direction === "out" ? "−" : entry.direction === "in" ? "+" : ""}${moneyShort(entry.amount)}`}
      </div>
    </article>
  `).join("");

  journalEmptyState.classList.toggle("hidden", filtered.length > 0);
}

document.getElementById("journalRefreshButton").addEventListener("click", renderJournal);
document.getElementById("journalTodayButton").addEventListener("click", () => {
  journalSearch.value = "";
  journalTypeFilter.value = "all";
  const all = buildJournalEntries().filter(entry => isTodayIso(entry.createdAt));
  renderJournalMetrics(all);

  journalTimeline.innerHTML = all.map(entry => `
    <article class="journal-entry-card">
      <div class="journal-entry-time">
        <strong>${new Intl.DateTimeFormat("de-DE", {day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(entry.createdAt))}</strong>
        <small>${new Intl.DateTimeFormat("de-DE", {hour:"2-digit",minute:"2-digit"}).format(new Date(entry.createdAt))}</small>
      </div>
      <div class="journal-entry-main">
        <div class="journal-entry-head">
          <span class="journal-type-badge">${journalTypeLabel(entry.type)}</span>
          ${entry.employeeName ? `<small>${escapeHtml(entry.employeeName)}</small>` : ""}
        </div>
        <h4>${escapeHtml(entry.title)}</h4>
        <p>${escapeHtml(entry.description)}</p>
      </div>
      <div class="journal-entry-amount ${entry.direction === "out" ? "negative" : entry.direction === "in" ? "positive" : ""}">
        ${entry.amount === null ? "" : `${entry.direction === "out" ? "−" : entry.direction === "in" ? "+" : ""}${moneyShort(entry.amount)}`}
      </div>
    </article>
  `).join("");

  journalEmptyState.classList.toggle("hidden", all.length > 0);
});

journalSearch.addEventListener("input", renderJournal);
journalTypeFilter.addEventListener("change", renderJournal);

renderJournal();



/* =========================================================
   EINSTELLUNGEN – v0.10
   Rollen- und Rechteverwaltung
   ========================================================= */

const DRIVE_ROLES_KEY = "drive_roles_v010";
const DRIVE_EMPLOYEE_ROLES_KEY = "drive_employee_roles_v010";

const permissionDefinitions = [
  {id:"view_overview", label:"Übersicht sehen", group:"Allgemein"},
  {id:"manage_employees", label:"Mitarbeiter anlegen und bearbeiten", group:"Mitarbeiter"},
  {id:"view_inventory", label:"Lager sehen", group:"Lager"},
  {id:"manage_materials", label:"Rohstoffe hinzufügen und bearbeiten", group:"Lager"},
  {id:"manage_products", label:"Produkte und Rezepturen hinzufügen und bearbeiten", group:"Lager"},
  {id:"adjust_inventory", label:"Lagerbestände korrigieren", group:"Lager"},
  {id:"view_production", label:"Produktion sehen", group:"Produktion"},
  {id:"record_production", label:"Produktion erfassen", group:"Produktion"},
  {id:"view_purchases", label:"Einkauf sehen", group:"Einkauf"},
  {id:"record_purchases", label:"Einkäufe erfassen", group:"Einkauf"},
  {id:"manage_suppliers", label:"Lieferanten verwalten", group:"Einkauf"},
  {id:"view_sales", label:"Verkauf sehen", group:"Verkauf"},
  {id:"record_sales", label:"Verkäufe erfassen", group:"Verkauf"},
  {id:"manage_customers", label:"Kunden verwalten", group:"Verkauf"},
  {id:"view_cash", label:"Kasse sehen", group:"Kasse"},
  {id:"manage_cash", label:"Kassenstart und manuelle Buchungen verwalten", group:"Kasse"},
  {id:"view_commissions", label:"Provisionen sehen", group:"Provisionen"},
  {id:"manage_commissions", label:"Provisionssätze und Auszahlungen verwalten", group:"Provisionen"},
  {id:"view_journal", label:"Journal sehen", group:"Journal"},
  {id:"manage_settings", label:"Einstellungen und Rollen verwalten", group:"System"}
];

function defaultOwnerRole() {
  const permissions = {};
  permissionDefinitions.forEach(item => permissions[item.id] = true);
  return {
    id:"role_owner",
    name:"Geschäftsinhaber",
    description:"Vollzugriff auf alle Bereiche von D.R.I.V.E.",
    locked:true,
    permissions
  };
}

let roles = loadJsonStorage(DRIVE_ROLES_KEY, []);
if (!roles.length) {
  roles = [defaultOwnerRole()];
  localStorage.setItem(DRIVE_ROLES_KEY, JSON.stringify(roles));
} else {
  let ownerPermissionsUpdated = false;
  roles.forEach(role => {
    if (!role.locked) return;
    role.permissions = role.permissions || {};
    permissionDefinitions.forEach(permission => {
      if (!role.permissions[permission.id]) {
        role.permissions[permission.id] = true;
        ownerPermissionsUpdated = true;
      }
    });
  });
  if (ownerPermissionsUpdated) {
    localStorage.setItem(DRIVE_ROLES_KEY, JSON.stringify(roles));
  }
}

let employeeRoles = loadJsonStorage(DRIVE_EMPLOYEE_ROLES_KEY, {});

function saveRoles() {
  localStorage.setItem(DRIVE_ROLES_KEY, JSON.stringify(roles));
}

function saveEmployeeRoles() {
  localStorage.setItem(DRIVE_EMPLOYEE_ROLES_KEY, JSON.stringify(employeeRoles));
}

function getRole(id) {
  return roles.find(role => role.id === id);
}

function rolePermissionCount(role) {
  return permissionDefinitions.filter(item => role.permissions && role.permissions[item.id]).length;
}

function renderSettingsMetrics() {
  const activeEmployees = employees.filter(employee => employee.active);
  const assigned = activeEmployees.filter(employee => employeeRoles[employee.id] && getRole(employeeRoles[employee.id])).length;
  document.getElementById("settingsRoleCount").textContent = numberShort(roles.length);
  document.getElementById("settingsEmployeeCount").textContent = numberShort(activeEmployees.length);
  document.getElementById("settingsAssignedCount").textContent = numberShort(assigned);
  document.getElementById("settingsUnassignedCount").textContent = numberShort(Math.max(0, activeEmployees.length - assigned));
}

function renderRoleCards() {
  const list = document.getElementById("roleCardList");
  const empty = document.getElementById("roleEmptyState");

  list.innerHTML = roles.map(role => `
    <article class="role-card">
      <div class="role-card-main">
        <div>
          <div class="overline">${role.locked ? "Systemrolle" : "Eigene Rolle"}</div>
          <h4>${escapeHtml(role.name)}</h4>
          <p>${escapeHtml(role.description || "Keine Beschreibung")}</p>
        </div>
        <div class="role-card-count">
          <strong>${rolePermissionCount(role)}</strong>
          <small>von ${permissionDefinitions.length} Rechten</small>
        </div>
      </div>
      <div class="role-card-actions">
        <button class="mini-button" data-edit-role="${role.id}">Bearbeiten</button>
        ${role.locked ? "" : `<button class="mini-button danger" data-delete-role="${role.id}">Löschen</button>`}
      </div>
    </article>
  `).join("");

  empty.classList.toggle("hidden", roles.length > 0);

  document.querySelectorAll("[data-edit-role]").forEach(button => {
    button.addEventListener("click", () => openRoleEditor(button.dataset.editRole));
  });

  document.querySelectorAll("[data-delete-role]").forEach(button => {
    button.addEventListener("click", () => deleteRole(button.dataset.deleteRole));
  });
}

function renderEmployeeRoles() {
  const body = document.getElementById("employeeRoleBody");
  const empty = document.getElementById("employeeRoleEmpty");

  body.innerHTML = employees.filter(employee => employee.active).map(employee => `
    <tr>
      <td><strong>${escapeHtml(employee.firstName)} ${escapeHtml(employee.lastName)}</strong></td>
      <td><span class="status-badge ${employee.active ? "" : "inactive"}">${employee.active ? "Aktiv" : "Inaktiv"}</span></td>
      <td>
        <select class="employee-role-select" data-employee-role="${employee.id}">
          <option value="">Keine Rolle</option>
          ${roles.map(role => `<option value="${role.id}" ${employeeRoles[employee.id] === role.id ? "selected" : ""}>${escapeHtml(role.name)}</option>`).join("")}
        </select>
      </td>
    </tr>
  `).join("");

  empty.classList.toggle("hidden", employees.filter(employee => employee.active).length > 0);

  document.querySelectorAll("[data-employee-role]").forEach(select => {
    select.addEventListener("change", () => {
      if (select.value) employeeRoles[select.dataset.employeeRole] = select.value;
      else delete employeeRoles[select.dataset.employeeRole];
      saveEmployeeRoles();
      renderSettingsMetrics();
      applyCurrentUserPermissions();
    });
  });
}

function renderPermissionList(role = null) {
  const container = document.getElementById("permissionList");
  const groups = [...new Set(permissionDefinitions.map(item => item.group))];

  container.innerHTML = groups.map(group => `
    <section class="permission-group">
      <h5>${escapeHtml(group)}</h5>
      ${permissionDefinitions.filter(item => item.group === group).map(item => {
        const checked = role ? Boolean(role.permissions && role.permissions[item.id]) : false;
        return `
          <label class="permission-row">
            <span>${escapeHtml(item.label)}</span>
            <span class="permission-switch">
              <input type="checkbox" data-permission="${item.id}" ${checked ? "checked" : ""}>
              <i></i>
            </span>
          </label>
        `;
      }).join("")}
    </section>
  `).join("");
}

function resetRoleForm() {
  document.getElementById("roleForm").reset();
  document.getElementById("roleId").value = "";
  document.getElementById("roleFormMode").textContent = "Neue Rolle";
  document.getElementById("roleModalTitle").textContent = "Rolle anlegen";
  renderPermissionList();
}

function openRoleEditor(id) {
  const role = getRole(id);
  if (!role) return;

  document.getElementById("roleId").value = role.id;
  document.getElementById("roleName").value = role.name;
  document.getElementById("roleDescription").value = role.description || "";
  document.getElementById("roleFormMode").textContent = "Rolle bearbeiten";
  document.getElementById("roleModalTitle").textContent = role.name;
  renderPermissionList(role);
  openDriveModal("roleModal");
}

function deleteRole(id) {
  const role = getRole(id);
  if (!role || role.locked) return;

  roles = roles.filter(item => item.id !== id);
  Object.keys(employeeRoles).forEach(employeeId => {
    if (employeeRoles[employeeId] === id) delete employeeRoles[employeeId];
  });

  saveRoles();
  saveEmployeeRoles();
  renderSettingsAll();
}

function renderSettingsAll() {
  renderSettingsMetrics();
  renderRoleCards();
  renderEmployeeRoles();
  renderEmployees();
}

document.getElementById("newRoleButton").addEventListener("click", () => {
  resetRoleForm();
  openDriveModal("roleModal");
});

document.getElementById("roleToggleAllButton").addEventListener("click", () => {
  const boxes = [...document.querySelectorAll("[data-permission]")];
  const allOn = boxes.every(box => box.checked);
  boxes.forEach(box => box.checked = !allOn);
  document.getElementById("roleToggleAllButton").textContent = allOn ? "Alle einschalten" : "Alle ausschalten";
});

document.getElementById("roleForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = document.getElementById("roleId").value;
  const existing = id ? getRole(id) : null;
  const permissions = {};
  document.querySelectorAll("[data-permission]").forEach(box => {
    permissions[box.dataset.permission] = box.checked;
  });

  const now = new Date().toISOString();
  const role = {
    id: existing ? existing.id : makeInventoryId("role"),
    name: document.getElementById("roleName").value.trim(),
    description: document.getElementById("roleDescription").value.trim(),
    locked: existing ? Boolean(existing.locked) : false,
    permissions,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  if (!role.name) return;

  if (existing) {
    const index = roles.findIndex(item => item.id === existing.id);
    roles[index] = role;
  } else {
    roles.push(role);
  }

  saveRoles();
  closeDriveModal("roleModal");
  renderSettingsAll();
  applyCurrentUserPermissions();
});

/*
  Lokaler Prototyp:
  Solange noch kein echtes Login existiert, wird kein Mitarbeiter automatisch
  als angemeldeter Benutzer angenommen. Deshalb werden vorhandene Bereiche
  nicht versehentlich gesperrt. Sobald später ein Login/Benutzerkontext
  vorhanden ist, kann dessen Mitarbeiter-ID hier gesetzt werden.
*/
let currentEmployeeId = null;

function hasCurrentPermission(permissionId) {
  if (!currentEmployeeId) return true;
  const roleId = employeeRoles[currentEmployeeId];
  const role = getRole(roleId);
  return Boolean(role && role.permissions && role.permissions[permissionId]);
}

function applyCurrentUserPermissions() {
  const rules = [
    ["[data-page='dashboard']", "view_overview"],
    ["[data-page='employees']", "manage_employees"],
    ["[data-page='inventory']", "view_inventory"],
    ["[data-page='production']", "view_production"],
    ["[data-page='purchases']", "view_purchases"],
    ["[data-page='sales']", "view_sales"],
    ["[data-page='cash']", "view_cash"],
    ["[data-page='commissions']", "view_commissions"],
    ["[data-page='journal']", "view_journal"],
    ["[data-page='settings']", "manage_settings"]
  ];

  rules.forEach(([selector, permission]) => {
    document.querySelectorAll(selector).forEach(element => {
      element.classList.toggle("permission-hidden", !hasCurrentPermission(permission));
    });
  });

  const actionRules = [
    ["#newEmployeeButton", "manage_employees"],
    ["#newMaterialButton", "manage_materials"],
    ["#newProductButton", "manage_products"],
    ["#newProductionButton", "record_production"],
    ["#newPurchaseButton", "record_purchases"],
    ["#manageSuppliersButton", "manage_suppliers"],
    ["#manageCustomersButton", "manage_customers"],
    ["#newSaleButton", "record_sales"],
    ["#newCashMovementButton", "manage_cash"],
    ["#setOpeningBalanceButton", "manage_cash"],
    ["#commissionRatesButton", "manage_commissions"],
    ["#commissionRecalculateButton", "manage_commissions"]
  ];

  actionRules.forEach(([selector, permission]) => {
    const element = document.querySelector(selector);
    if (element) element.classList.toggle("permission-hidden", !hasCurrentPermission(permission));
  });
}

renderSettingsAll();
applyCurrentUserPermissions();



/* =========================================================
   SUPABASE – v1.1
   Zentrale Datenspeicherung ohne zusätzlichen App-Login.
   Der Publishable Key ist für Browser-Clients vorgesehen.
   ========================================================= */

const DRIVE_SB = {
  url: String(window.DRIVE_CONFIG?.supabase?.url || "").replace(/\/+$/, ""),
  key: String(
    window.DRIVE_CONFIG?.supabase?.publishableKey ||
    window.DRIVE_CONFIG?.supabase?.anonKey ||
    ""
  ),
  ready: false,
  applyingRemote: false,
  syncing: false,
  syncQueue: Promise.resolve(),
  lastPullAt: 0
};

function setSupabaseStatus(text, state = "") {
  const element = document.getElementById("supabaseSyncStatus");
  if (!element) return;
  element.textContent = text;
  element.dataset.state = state;
}

function sbHeaders(extra = {}) {
  return {
    "apikey": DRIVE_SB.key,
    "Content-Type": "application/json",
    ...extra
  };
}

async function sbRequest(table, options = {}) {
  const {
    method = "GET",
    query = "select=*",
    body,
    prefer = ""
  } = options;

  if (!DRIVE_SB.url || !DRIVE_SB.key) {
    throw new Error("Supabase-Konfiguration fehlt.");
  }

  const suffix = query ? `?${query}` : "";
  const response = await fetch(`${DRIVE_SB.url}/rest/v1/${table}${suffix}`, {
    method,
    headers: sbHeaders(prefer ? {"Prefer": prefer} : {}),
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${table}: ${response.status} ${message}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function sbGet(table) {
  return await sbRequest(table, {query:"select=*"});
}

async function sbUpsert(table, rows, conflictColumn = "id") {
  if (!rows.length) return;
  await sbRequest(table, {
    method:"POST",
    query:`on_conflict=${encodeURIComponent(conflictColumn)}`,
    body:rows,
    prefer:"resolution=merge-duplicates,return=minimal"
  });
}

async function sbDeleteMissing(table, localIds, conflictColumn = "id") {
  const remote = await sbRequest(table, {query:`select=${encodeURIComponent(conflictColumn)}`}) || [];
  const keep = new Set(localIds.map(String));

  for (const row of remote) {
    const value = row[conflictColumn];
    if (keep.has(String(value))) continue;
    await sbRequest(table, {
      method:"DELETE",
      query:`${encodeURIComponent(conflictColumn)}=eq.${encodeURIComponent(value)}`
    });
  }
}

async function sbReplace(table, rows, conflictColumn = "id") {
  await sbUpsert(table, rows, conflictColumn);
  await sbDeleteMissing(table, rows.map(row => row[conflictColumn]), conflictColumn);
}

/* ---------- Umwandlung App -> Supabase ---------- */

function employeeToRow(x) {
  return {
    id:x.id, first_name:x.firstName || "", last_name:x.lastName || "",
    start_date:x.startDate || null, commission_rate:Number(x.commissionRate || 0),
    note:x.note || "", active:x.active !== false,
    terminated_at:x.terminatedAt || null,
    created_at:x.createdAt || undefined, updated_at:x.updatedAt || undefined
  };
}

function materialToRow(x) {
  return {
    id:x.id, name:x.name || "", category:x.category || "Rohstoff",
    unit:x.unit || "Stück", purchase_cost:x.purchaseCost || {type:"money",amount:0},
    stock:Number(x.stock || 0), min_stock:Number(x.minStock || 0),
    active:x.active !== false, created_at:x.createdAt || undefined,
    updated_at:x.updatedAt || undefined
  };
}

function productToRow(x) {
  return {
    id:x.id, name:x.name || "", category:x.category || "Produkt",
    sale_price:Number(x.salePrice || 0), purchase_price:Number(x.purchasePrice || 0),
    stock:Number(x.stock || 0), min_stock:Number(x.minStock || 0),
    recipe:Array.isArray(x.recipe) ? x.recipe : [], active:x.active !== false,
    created_at:x.createdAt || undefined, updated_at:x.updatedAt || undefined
  };
}

function adjustmentToRow(x) {
  return {
    id:x.id, item_id:x.itemId || "", item_name:x.itemName || "",
    old_stock:Number(x.oldStock || 0), new_stock:Number(x.newStock || 0),
    reason:x.reason || "", created_at:x.createdAt || undefined
  };
}

function productionToRow(x) {
  return {
    id:x.id, employee_id:x.employeeId || null, employee_name:x.employeeName || "",
    product_id:x.productId || null, product_name:x.productName || "",
    quantity:Number(x.quantity || 0), unit_price:Number(x.unitPrice || 0),
    total_value:Number(x.totalValue || 0), production_profit:Number(x.productionProfit || 0),
    commission_rate:Number(x.commissionRate || 0),
    commission_value:Number(x.commissionValue || 0),
    ingredients:Array.isArray(x.ingredients) ? x.ingredients : [],
    product_old_stock:Number(x.productOldStock || 0),
    product_new_stock:Number(x.productNewStock || 0),
    created_at:x.createdAt || undefined
  };
}

function supplierToRow(x) {
  return {
    id:x.id, name:x.name || "", contact:x.contact || "", telegram:x.telegram || "",
    note:x.note || "", active:x.active !== false,
    created_at:x.createdAt || undefined, updated_at:x.updatedAt || undefined
  };
}

function purchaseToRow(x) {
  return {
    id:x.id, employee_id:x.employeeId || null, employee_name:x.employeeName || "",
    supplier_id:x.supplierId || null,
    supplier_name:typeof x.supplier === "object" ? (x.supplier?.name || "") : (x.supplier || x.supplierName || ""),
    supplier_contact:x.supplierContact || "", supplier_telegram:x.supplierTelegram || "",
    item_id:x.itemId || null, item_name:x.itemName || "", item_type:x.itemType || "",
    unit:x.unit || "Stück", quantity:Number(x.quantity || 0),
    old_stock:Number(x.oldStock || 0), new_stock:Number(x.newStock || 0),
    note:x.note || "", payment_type:x.paymentType || "money",
    payment_status:x.paymentStatus || "paid",
    unit_price:x.unitPrice === undefined ? null : Number(x.unitPrice || 0),
    total_cost:Number(x.totalCost || 0), due_date:x.dueDate || null,
    paid_at:x.paidAt || null, resource_payment:x.resourcePayment || null,
    created_at:x.createdAt || undefined
  };
}

function customerToRow(x) {
  return {
    id:x.id, name:x.name || "", contact:x.contact || "", telegram:x.telegram || "",
    note:x.note || "", active:x.active !== false,
    created_at:x.createdAt || undefined, updated_at:x.updatedAt || undefined
  };
}

function saleToRow(x) {
  return {
    id:x.id, employee_id:x.employeeId || null, employee_name:x.employeeName || "",
    customer_id:x.customerId || null, customer_name:x.customer || x.customerName || "",
    customer_contact:x.customerContact || "", customer_telegram:x.customerTelegram || "",
    product_id:x.productId || null, product_name:x.productName || "",
    quantity:Number(x.quantity || 0), unit_price:Number(x.unitPrice || 0),
    total_revenue:Number(x.totalRevenue || 0),
    payment_status:x.paymentStatus || "paid", due_date:x.dueDate || null,
    note:x.note || "", paid_at:x.paidAt || null, created_at:x.createdAt || undefined
  };
}

function cashMovementToRow(x) {
  return {
    id:x.id, type:x.type || "manual", direction:x.direction,
    amount:Number(x.amount || 0), reference_id:x.referenceId || null,
    description:x.description || "", note:x.note || "",
    created_at:x.createdAt || undefined
  };
}

function commissionToRow(x) {
  return {
    id:x.id, type:x.type || (x.productionId ? "production" : "sale"),
    employee_id:x.employeeId || null, employee_name:x.employeeName || "",
    sale_id:x.saleId || null, production_id:x.productionId || null,
    sale_revenue:x.saleRevenue === undefined ? null : Number(x.saleRevenue || 0),
    rate:x.rate === undefined ? (x.commissionRate === undefined ? null : Number(x.commissionRate || 0)) : Number(x.rate || 0),
    amount:Number(x.amount || 0), status:x.status || "open",
    paid_at:x.paidAt || null, created_at:x.createdAt || undefined
  };
}

function roleToRow(x) {
  return {
    id:x.id, name:x.name || "", description:x.description || "",
    locked:Boolean(x.locked), permissions:x.permissions || {},
    created_at:x.createdAt || undefined, updated_at:x.updatedAt || undefined
  };
}

/* ---------- Umwandlung Supabase -> App ---------- */

function employeeFromRow(x) {
  return {
    id:x.id, firstName:x.first_name, lastName:x.last_name,
    startDate:x.start_date || "", commissionRate:Number(x.commission_rate || 0),
    note:x.note || "", active:x.active !== false,
    terminatedAt:x.terminated_at || "", createdAt:x.created_at, updatedAt:x.updated_at
  };
}

function materialFromRow(x) {
  return {
    id:x.id, name:x.name, category:x.category, unit:x.unit,
    purchaseCost:x.purchase_cost || {type:"money",amount:0},
    stock:Number(x.stock || 0), minStock:Number(x.min_stock || 0),
    active:x.active !== false, createdAt:x.created_at, updatedAt:x.updated_at
  };
}

function productFromRow(x) {
  return {
    id:x.id, name:x.name, category:x.category,
    salePrice:Number(x.sale_price || 0), purchasePrice:Number(x.purchase_price || 0),
    stock:Number(x.stock || 0), minStock:Number(x.min_stock || 0),
    recipe:Array.isArray(x.recipe) ? x.recipe : [], active:x.active !== false,
    createdAt:x.created_at, updatedAt:x.updated_at
  };
}

function adjustmentFromRow(x) {
  return {
    id:x.id, itemId:x.item_id, itemName:x.item_name,
    oldStock:Number(x.old_stock || 0), newStock:Number(x.new_stock || 0),
    reason:x.reason || "", createdAt:x.created_at
  };
}

function productionFromRow(x) {
  return {
    id:x.id, employeeId:x.employee_id || "", employeeName:x.employee_name || "",
    productId:x.product_id || "", productName:x.product_name || "",
    quantity:Number(x.quantity || 0), unitPrice:Number(x.unit_price || 0),
    totalValue:Number(x.total_value || 0), productionProfit:Number(x.production_profit || 0),
    commissionRate:Number(x.commission_rate || 0), commissionValue:Number(x.commission_value || 0),
    ingredients:Array.isArray(x.ingredients) ? x.ingredients : [],
    productOldStock:Number(x.product_old_stock || 0),
    productNewStock:Number(x.product_new_stock || 0),
    createdAt:x.created_at
  };
}

function supplierFromRow(x) {
  return {
    id:x.id, name:x.name, contact:x.contact || "", telegram:x.telegram || "",
    note:x.note || "", active:x.active !== false,
    createdAt:x.created_at, updatedAt:x.updated_at
  };
}

function purchaseFromRow(x) {
  return {
    id:x.id, employeeId:x.employee_id || "", employeeName:x.employee_name || "",
    supplierId:x.supplier_id || "", supplier:x.supplier_name || "",
    supplierContact:x.supplier_contact || "", supplierTelegram:x.supplier_telegram || "",
    itemId:x.item_id || "", itemName:x.item_name || "", itemType:x.item_type || "",
    unit:x.unit || "Stück", quantity:Number(x.quantity || 0),
    oldStock:Number(x.old_stock || 0), newStock:Number(x.new_stock || 0),
    note:x.note || "", paymentType:x.payment_type || "money",
    paymentStatus:x.payment_status || "paid",
    unitPrice:x.unit_price === null ? undefined : Number(x.unit_price || 0),
    totalCost:Number(x.total_cost || 0), dueDate:x.due_date || "",
    paidAt:x.paid_at || "", resourcePayment:x.resource_payment || null,
    createdAt:x.created_at
  };
}

function customerFromRow(x) {
  return {
    id:x.id, name:x.name, contact:x.contact || "", telegram:x.telegram || "",
    note:x.note || "", active:x.active !== false,
    createdAt:x.created_at, updatedAt:x.updated_at
  };
}

function saleFromRow(x) {
  return {
    id:x.id, employeeId:x.employee_id || "", employeeName:x.employee_name || "",
    customerId:x.customer_id || "", customer:x.customer_name || "",
    customerContact:x.customer_contact || "", customerTelegram:x.customer_telegram || "",
    productId:x.product_id || "", productName:x.product_name || "",
    quantity:Number(x.quantity || 0), unitPrice:Number(x.unit_price || 0),
    totalRevenue:Number(x.total_revenue || 0), paymentStatus:x.payment_status || "paid",
    dueDate:x.due_date || "", note:x.note || "", paidAt:x.paid_at || "",
    createdAt:x.created_at
  };
}

function cashMovementFromRow(x) {
  return {
    id:x.id, type:x.type, direction:x.direction, amount:Number(x.amount || 0),
    referenceId:x.reference_id || "", description:x.description || "",
    note:x.note || "", createdAt:x.created_at
  };
}

function commissionFromRow(x) {
  return {
    id:x.id, type:x.type || "", employeeId:x.employee_id || "",
    employeeName:x.employee_name || "", saleId:x.sale_id || "",
    productionId:x.production_id || "",
    saleRevenue:x.sale_revenue === null ? undefined : Number(x.sale_revenue || 0),
    rate:x.rate === null ? undefined : Number(x.rate || 0),
    amount:Number(x.amount || 0), status:x.status || "open",
    paidAt:x.paid_at || "", createdAt:x.created_at
  };
}

function roleFromRow(x) {
  return {
    id:x.id, name:x.name, description:x.description || "",
    locked:Boolean(x.locked), permissions:x.permissions || {},
    createdAt:x.created_at, updatedAt:x.updated_at
  };
}

/* ---------- Lokale Daten -> Datenbank ---------- */

async function syncEmployeesToSupabase() {
  await sbReplace("employees", employees.map(employeeToRow));
}

async function syncInventoryToSupabase() {
  await sbReplace("materials", inventoryData.materials.map(materialToRow));
  await sbReplace("products", inventoryData.products.map(productToRow));
  await sbReplace("inventory_adjustments", inventoryData.adjustments.map(adjustmentToRow));
}

async function syncProductionsToSupabase() {
  await sbReplace("productions", productions.map(productionToRow));
}

async function syncCommissionLedgerToSupabase() {
  await sbReplace("commission_ledger", commissionLedger.map(commissionToRow));
}

async function syncSuppliersToSupabase() {
  await sbReplace("suppliers", suppliers.map(supplierToRow));
}

async function syncPurchasesToSupabase() {
  await sbReplace("purchases", purchases.map(purchaseToRow));
}

async function syncCashToSupabase() {
  await sbUpsert("cash_settings", [{
    id:1,
    opening_balance:Number(cashData.openingBalance || 0),
    opening_balance_updated_at:cashData.openingBalanceUpdatedAt || null,
    updated_at:new Date().toISOString()
  }]);
  await sbReplace("cash_movements", cashData.movements.map(cashMovementToRow));
}

async function syncCustomersToSupabase() {
  await sbReplace("customers", customers.map(customerToRow));
}

async function syncSalesToSupabase() {
  await sbReplace("sales", sales.map(saleToRow));
}

async function syncCommissionRatesToSupabase() {
  const rows = Object.entries(commissionRates).map(([employeeId, rate]) => ({
    employee_id:employeeId,
    rate:Number(rate || 0),
    updated_at:new Date().toISOString()
  }));
  await sbReplace("commission_rates", rows, "employee_id");
}

async function syncRolesToSupabase() {
  await sbReplace("roles", roles.map(roleToRow));
}

async function syncEmployeeRolesToSupabase() {
  const rows = Object.entries(employeeRoles).map(([employeeId, roleId]) => ({
    employee_id:employeeId,
    role_id:roleId,
    updated_at:new Date().toISOString()
  }));
  await sbReplace("employee_roles", rows, "employee_id");
}

function queueSupabaseSync(label, work) {
  if (!DRIVE_SB.ready || DRIVE_SB.applyingRemote) return;

  DRIVE_SB.syncQueue = DRIVE_SB.syncQueue
    .then(async () => {
      DRIVE_SB.syncing = true;
      setSupabaseStatus("Speichert …", "working");
      await work();
      setSupabaseStatus("Supabase verbunden", "ok");
    })
    .catch(error => {
      console.error(`Supabase-Sync (${label})`, error);
      setSupabaseStatus("Datenbankfehler", "error");
    })
    .finally(() => {
      DRIVE_SB.syncing = false;
    });
}

/* Bestehende Speicherfunktionen erweitern, ohne die UI-Logik umzubauen. */

const driveLocalSaveEmployees = saveEmployees;
saveEmployees = function() {
  driveLocalSaveEmployees();
  queueSupabaseSync("employees", syncEmployeesToSupabase);
};

const driveLocalSaveInventoryData = saveInventoryData;
saveInventoryData = function() {
  driveLocalSaveInventoryData();
  queueSupabaseSync("inventory", syncInventoryToSupabase);
};

const driveLocalSaveProductions = saveProductions;
saveProductions = function() {
  driveLocalSaveProductions();
  queueSupabaseSync("productions", syncProductionsToSupabase);
};

const driveLocalSaveCommissionLedger = saveCommissionLedger;
saveCommissionLedger = function() {
  driveLocalSaveCommissionLedger();
  queueSupabaseSync("commission_ledger", syncCommissionLedgerToSupabase);
};

const driveLocalSaveSuppliers = saveSuppliers;
saveSuppliers = function() {
  driveLocalSaveSuppliers();
  queueSupabaseSync("suppliers", syncSuppliersToSupabase);
};

const driveLocalSavePurchases = savePurchases;
savePurchases = function() {
  driveLocalSavePurchases();
  queueSupabaseSync("purchases", syncPurchasesToSupabase);
};

const driveLocalSaveCashData = saveCashData;
saveCashData = function() {
  driveLocalSaveCashData();
  queueSupabaseSync("cash", syncCashToSupabase);
};

const driveLocalSaveCustomers = saveCustomers;
saveCustomers = function() {
  driveLocalSaveCustomers();
  queueSupabaseSync("customers", syncCustomersToSupabase);
};

const driveLocalSaveSales = saveSales;
saveSales = function() {
  driveLocalSaveSales();
  queueSupabaseSync("sales", syncSalesToSupabase);
};

const driveLocalSaveCommissionRates = saveCommissionRates;
saveCommissionRates = function() {
  driveLocalSaveCommissionRates();
  queueSupabaseSync("commission_rates", syncCommissionRatesToSupabase);
};

const driveLocalSaveRoles = saveRoles;
saveRoles = function() {
  driveLocalSaveRoles();
  queueSupabaseSync("roles", syncRolesToSupabase);
};

const driveLocalSaveEmployeeRoles = saveEmployeeRoles;
saveEmployeeRoles = function() {
  driveLocalSaveEmployeeRoles();
  queueSupabaseSync("employee_roles", syncEmployeeRolesToSupabase);
};

/* ---------- Datenbank -> lokale App ---------- */

function storeRemoteLocally() {
  localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(employees));
  localStorage.setItem(DRIVE_INVENTORY_KEY, JSON.stringify(inventoryData));
  localStorage.setItem(DRIVE_PRODUCTION_KEY, JSON.stringify(productions));
  localStorage.setItem(DRIVE_COMMISSION_LEDGER_KEY, JSON.stringify(commissionLedger));
  localStorage.setItem(DRIVE_SUPPLIERS_KEY, JSON.stringify(suppliers));
  localStorage.setItem(DRIVE_PURCHASE_KEY, JSON.stringify(purchases));
  localStorage.setItem(DRIVE_CASH_KEY, JSON.stringify(cashData));
  localStorage.setItem(DRIVE_CUSTOMERS_KEY, JSON.stringify(customers));
  localStorage.setItem(DRIVE_SALES_KEY, JSON.stringify(sales));
  localStorage.setItem(DRIVE_COMMISSION_RATES_KEY, JSON.stringify(commissionRates));
  localStorage.setItem(DRIVE_ROLES_KEY, JSON.stringify(roles));
  localStorage.setItem(DRIVE_EMPLOYEE_ROLES_KEY, JSON.stringify(employeeRoles));
}

function rerenderAfterRemoteLoad() {
  renderEmployees();
  renderAllInventory();
  refreshProductionSelectors();
  renderProductionHistory();
  renderProductionMetrics();
  renderSuppliers();
  refreshPurchaseSelectors();
  refreshSupplierSelect();
  renderPurchaseHistory();
  renderPurchaseMetrics();
  renderCustomers();
  refreshSaleSelectors();
  renderSalesHistory();
  renderSaleMetrics();
  renderCashAll();
  renderCommissionsAll();
  renderSettingsAll();
  renderJournal();
  renderDashboardLive();
}

async function readAllSupabaseData() {
  const [
    employeeRows, materialRows, productRows, adjustmentRows,
    productionRows, supplierRows, purchaseRows, customerRows,
    saleRows, cashSettingRows, cashMovementRows, commissionRows,
    commissionRateRows, roleRows, employeeRoleRows
  ] = await Promise.all([
    sbGet("employees"), sbGet("materials"), sbGet("products"), sbGet("inventory_adjustments"),
    sbGet("productions"), sbGet("suppliers"), sbGet("purchases"), sbGet("customers"),
    sbGet("sales"), sbGet("cash_settings"), sbGet("cash_movements"), sbGet("commission_ledger"),
    sbGet("commission_rates"), sbGet("roles"), sbGet("employee_roles")
  ]);

  return {
    employeeRows:employeeRows || [],
    materialRows:materialRows || [],
    productRows:productRows || [],
    adjustmentRows:adjustmentRows || [],
    productionRows:productionRows || [],
    supplierRows:supplierRows || [],
    purchaseRows:purchaseRows || [],
    customerRows:customerRows || [],
    saleRows:saleRows || [],
    cashSettingRows:cashSettingRows || [],
    cashMovementRows:cashMovementRows || [],
    commissionRows:commissionRows || [],
    commissionRateRows:commissionRateRows || [],
    roleRows:roleRows || [],
    employeeRoleRows:employeeRoleRows || []
  };
}

async function bootstrapSupabaseFromLocal(remote) {
  /* Nur wenn eine Tabelle noch leer ist, werden die vorhandenen lokalen Daten
     einmalig als Startbestand hochgeladen. Danach ist Supabase maßgeblich. */

  if (!remote.employeeRows.length && employees.length) await syncEmployeesToSupabase();
  if (!remote.materialRows.length && inventoryData.materials.length) {
    await sbReplace("materials", inventoryData.materials.map(materialToRow));
  }
  if (!remote.productRows.length && inventoryData.products.length) {
    await sbReplace("products", inventoryData.products.map(productToRow));
  }
  if (!remote.adjustmentRows.length && inventoryData.adjustments.length) {
    await sbReplace("inventory_adjustments", inventoryData.adjustments.map(adjustmentToRow));
  }
  if (!remote.productionRows.length && productions.length) await syncProductionsToSupabase();
  if (!remote.supplierRows.length && suppliers.length) await syncSuppliersToSupabase();
  if (!remote.purchaseRows.length && purchases.length) await syncPurchasesToSupabase();
  if (!remote.customerRows.length && customers.length) await syncCustomersToSupabase();
  if (!remote.saleRows.length && sales.length) await syncSalesToSupabase();
  if (!remote.cashMovementRows.length && cashData.movements.length) {
    await syncCashToSupabase();
  } else if (
    remote.cashSettingRows.length &&
    Number(remote.cashSettingRows[0].opening_balance || 0) === 0 &&
    Number(cashData.openingBalance || 0) !== 0
  ) {
    await syncCashToSupabase();
  }
  if (!remote.commissionRows.length && commissionLedger.length) await syncCommissionLedgerToSupabase();
  if (!remote.commissionRateRows.length && Object.keys(commissionRates).length) await syncCommissionRatesToSupabase();

  /* SQL legt bereits Geschäftsinhaber an. Lokale zusätzliche Rollen trotzdem übernehmen. */
  const remoteRoleIds = new Set(remote.roleRows.map(row => row.id));
  const missingLocalRoles = roles.filter(role => !remoteRoleIds.has(role.id));
  if (missingLocalRoles.length) await sbUpsert("roles", missingLocalRoles.map(roleToRow));

  if (!remote.employeeRoleRows.length && Object.keys(employeeRoles).length) {
    await syncEmployeeRolesToSupabase();
  }
}

async function applySupabaseData(remote) {
  DRIVE_SB.applyingRemote = true;
  try {
    employees = remote.employeeRows.map(employeeFromRow);
    inventoryData = {
      materials:remote.materialRows.map(materialFromRow),
      products:remote.productRows.map(productFromRow),
      adjustments:remote.adjustmentRows.map(adjustmentFromRow)
    };
    productions = remote.productionRows.map(productionFromRow);
    suppliers = remote.supplierRows.map(supplierFromRow);
    purchases = remote.purchaseRows.map(purchaseFromRow);
    customers = remote.customerRows.map(customerFromRow);
    sales = remote.saleRows.map(saleFromRow);

    const setting = remote.cashSettingRows.find(row => Number(row.id) === 1) || remote.cashSettingRows[0];
    cashData = {
      openingBalance:Number(setting?.opening_balance || 0),
      openingBalanceUpdatedAt:setting?.opening_balance_updated_at || "",
      movements:remote.cashMovementRows.map(cashMovementFromRow)
    };

    commissionLedger = remote.commissionRows.map(commissionFromRow);

    commissionRates = {};
    remote.commissionRateRows.forEach(row => {
      commissionRates[row.employee_id] = Number(row.rate || 0);
    });

    roles = remote.roleRows.map(roleFromRow);

    employeeRoles = {};
    remote.employeeRoleRows.forEach(row => {
      employeeRoles[row.employee_id] = row.role_id;
    });

    storeRemoteLocally();
    rerenderAfterRemoteLoad();
  } finally {
    DRIVE_SB.applyingRemote = false;
  }
}

async function pullSupabaseData({force = false} = {}) {
  if (!DRIVE_SB.ready || DRIVE_SB.syncing || DRIVE_SB.applyingRemote) return;
  if (!force && Date.now() - DRIVE_SB.lastPullAt < 5000) return;

  try {
    const remote = await readAllSupabaseData();
    DRIVE_SB.lastPullAt = Date.now();
    await applySupabaseData(remote);
    setSupabaseStatus("Supabase verbunden", "ok");
  } catch (error) {
    console.error("Supabase laden", error);
    setSupabaseStatus("Datenbankfehler", "error");
  }
}

async function initializeDriveSupabase() {
  if (!DRIVE_SB.url || !DRIVE_SB.key) {
    setSupabaseStatus("Nur lokal", "error");
    return;
  }

  setSupabaseStatus("Datenbank verbindet …", "working");

  try {
    let remote = await readAllSupabaseData();
    await bootstrapSupabaseFromLocal(remote);

    /* Nach eventueller Erstübernahme erneut lesen. */
    remote = await readAllSupabaseData();

    DRIVE_SB.ready = true;
    await applySupabaseData(remote);
    DRIVE_SB.lastPullAt = Date.now();
    setSupabaseStatus("Supabase verbunden", "ok");

    /* Gemeinsame Daten automatisch nachladen.
       Zusätzlich erfolgt ein Sofort-Refresh, wenn das Browserfenster wieder aktiv wird. */
    window.setInterval(() => pullSupabaseData(), 10000);
    window.addEventListener("focus", () => pullSupabaseData({force:true}));
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) pullSupabaseData({force:true});
    });
  } catch (error) {
    console.error("D.R.I.V.E. Supabase Initialisierung", error);
    setSupabaseStatus("Datenbankfehler – lokale Daten aktiv", "error");
  }
}

initializeDriveSupabase();



/* =========================================================
   MOBILE TABLE LABELS – v1.1
   ========================================================= */
function applyMobileTableLabels(root = document) {
  root.querySelectorAll(".employee-table").forEach(table => {
    const labels = Array.from(table.querySelectorAll("thead th"))
      .map(th => th.textContent.trim());

    table.querySelectorAll("tbody tr").forEach(row => {
      Array.from(row.children).forEach((cell, index) => {
        if (cell.tagName !== "TD") return;
        cell.dataset.label = labels[index] || "";
      });
    });
  });
}

applyMobileTableLabels();

const driveMobileTableObserver = new MutationObserver(mutations => {
  let needsRefresh = false;
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      needsRefresh = true;
      break;
    }
  }
  if (needsRefresh) applyMobileTableLabels();
});

driveMobileTableObserver.observe(document.getElementById("appContent") || document.body, {
  childList:true,
  subtree:true
});



/* =========================================================
   MITARBEITER-ANMELDUNG – v1.2
   ========================================================= */

const DRIVE_AUTH_SESSION_KEY = "drive_auth_session_v12";
let driveAuthSessionToken = localStorage.getItem(DRIVE_AUTH_SESSION_KEY) || "";
let drivePendingOldPassword = "";
let drivePendingEmployeeId = "";

const authScreen = document.getElementById("authScreen");
const loginForm = document.getElementById("loginForm");
const loginEmployee = document.getElementById("loginEmployee");
const loginPassword = document.getElementById("loginPassword");
const passwordChangeForm = document.getElementById("passwordChangeForm");
const newPassword = document.getElementById("newPassword");
const newPasswordRepeat = document.getElementById("newPasswordRepeat");
const initialSetupForm = document.getElementById("initialSetupForm");
const setupEmployee = document.getElementById("setupEmployee");
const setupPassword = document.getElementById("setupPassword");
const setupPasswordRepeat = document.getElementById("setupPasswordRepeat");
const authMessage = document.getElementById("authMessage");
const authTitle = document.getElementById("authTitle");
const authIntro = document.getElementById("authIntro");
const currentUserLabel = document.getElementById("currentUserLabel");
const logoutButton = document.getElementById("logoutButton");

function authSetMessage(message = "", state = "") {
  authMessage.textContent = message;
  authMessage.dataset.state = state;
}

function authShowForm(mode) {
  loginForm.classList.toggle("hidden", mode !== "login");
  passwordChangeForm.classList.toggle("hidden", mode !== "change");
  initialSetupForm.classList.toggle("hidden", mode !== "setup");
}

async function driveRpc(functionName, payload = {}) {
  if (!DRIVE_SB.url || !DRIVE_SB.key) throw new Error("Supabase ist nicht verbunden.");

  const response = await fetch(`${DRIVE_SB.url}/rest/v1/rpc/${functionName}`, {
    method:"POST",
    headers:{
      "apikey":DRIVE_SB.key,
      "Content-Type":"application/json"
    },
    body:JSON.stringify(payload)
  });

  const text = await response.text();
  if (!response.ok) {
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.details || text;
    } catch {}
    throw new Error(message || `RPC ${functionName} fehlgeschlagen.`);
  }

  return text ? JSON.parse(text) : null;
}

function populateLoginEmployees() {
  const active = employees
    .filter(employee => employee.active)
    .sort((a,b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "de"));

  loginEmployee.innerHTML =
    `<option value="">Mitarbeiter wählen …</option>` +
    active.map(employee =>
      `<option value="${employee.id}">${escapeHtml(employee.firstName)} ${escapeHtml(employee.lastName)}</option>`
    ).join("");
}

async function driveAuthStatus() {
  return await driveRpc("drive_auth_status", {});
}

async function driveSessionContext(token) {
  return await driveRpc("drive_session_context", {p_token:token});
}

function driveApplyLoggedInContext(context) {
  const employee = employees.find(item => item.id === context.employee_id);
  if (!employee) throw new Error("Der angemeldete Mitarbeiter wurde nicht gefunden.");

  currentEmployeeId = employee.id;
  window.DRIVE_AUTH_CURRENT_EMPLOYEE_ID = employee.id;
  window.DRIVE_AUTH_LOGGED_IN = true;

  currentUserLabel.textContent = `${employee.firstName} ${employee.lastName}`;
  logoutButton.classList.remove("hidden");
  document.body.classList.remove("auth-locked");
  authScreen.classList.add("hidden");

  applyCurrentUserPermissions();

  const currentPage = window.location.hash.replace("#", "") || "dashboard";
  if (!driveCanOpenPage(currentPage)) showPage(currentPage);
}

async function driveRestoreSession() {
  if (!driveAuthSessionToken) return false;

  try {
    const context = await driveSessionContext(driveAuthSessionToken);
    if (!context || !context.employee_id) return false;

    if (context.must_change) {
      drivePendingEmployeeId = context.employee_id;
      authTitle.textContent = "Passwort ändern";
      authIntro.textContent = "Die vorläufige PIN muss zuerst durch ein eigenes Passwort bzw. eine eigene PIN ersetzt werden.";
      authShowForm("change");
      return true;
    }

    driveApplyLoggedInContext(context);
    return true;
  } catch (error) {
    console.warn("Session konnte nicht wiederhergestellt werden", error);
    localStorage.removeItem(DRIVE_AUTH_SESSION_KEY);
    driveAuthSessionToken = "";
    return false;
  }
}

async function driveSetEmployeeTempPin(employeeId, pin) {
  if (!driveAuthSessionToken) throw new Error("Bitte zuerst anmelden.");

  const result = await driveRpc("drive_set_temp_pin", {
    p_token:driveAuthSessionToken,
    p_employee_id:employeeId,
    p_temp_pin:pin
  });

  if (!result || result.ok !== true) {
    throw new Error(result?.message || "PIN konnte nicht gespeichert werden.");
  }
  return result;
}

async function driveInitialSetup(employeeId, password) {
  const result = await driveRpc("drive_initial_owner_setup", {
    p_employee_id:employeeId,
    p_password:password
  });

  if (!result || !result.token) {
    throw new Error(result?.message || "Ersteinrichtung fehlgeschlagen.");
  }

  driveAuthSessionToken = result.token;
  localStorage.setItem(DRIVE_AUTH_SESSION_KEY, driveAuthSessionToken);
  return result;
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  authSetMessage("Anmeldung wird geprüft …", "working");

  try {
    const employeeId = loginEmployee.value;
    const password = loginPassword.value;

    const result = await driveRpc("drive_login", {
      p_employee_id:employeeId,
      p_password:password
    });

    if (!result || !result.token) {
      throw new Error(result?.message || "Anmeldung nicht möglich.");
    }

    driveAuthSessionToken = result.token;
    localStorage.setItem(DRIVE_AUTH_SESSION_KEY, driveAuthSessionToken);

    if (result.must_change) {
      drivePendingOldPassword = password;
      drivePendingEmployeeId = employeeId;
      loginPassword.value = "";
      authTitle.textContent = "Passwort ändern";
      authIntro.textContent = "Die vorläufige PIN wurde akzeptiert. Jetzt bitte ein eigenes Passwort bzw. eine eigene PIN festlegen.";
      authShowForm("change");
      authSetMessage("");
      newPassword.focus();
      return;
    }

    const context = await driveSessionContext(driveAuthSessionToken);
    driveApplyLoggedInContext(context);
  } catch (error) {
    authSetMessage(error.message || "Anmeldung fehlgeschlagen.", "error");
  }
});

passwordChangeForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (newPassword.value !== newPasswordRepeat.value) {
    authSetMessage("Die beiden Eingaben stimmen nicht überein.", "error");
    return;
  }

  if (newPassword.value.length < 4) {
    authSetMessage("Mindestens 4 Zeichen verwenden.", "error");
    return;
  }

  authSetMessage("Neues Passwort wird gespeichert …", "working");

  try {
    const result = await driveRpc("drive_change_password", {
      p_token:driveAuthSessionToken,
      p_old_password:drivePendingOldPassword || null,
      p_new_password:newPassword.value
    });

    if (!result || result.ok !== true) {
      throw new Error(result?.message || "Passwort konnte nicht geändert werden.");
    }

    drivePendingOldPassword = "";
    newPassword.value = "";
    newPasswordRepeat.value = "";

    const context = await driveSessionContext(driveAuthSessionToken);
    driveApplyLoggedInContext(context);
  } catch (error) {
    authSetMessage(error.message || "Passwortänderung fehlgeschlagen.", "error");
  }
});

initialSetupForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (setupPassword.value !== setupPasswordRepeat.value) {
    authSetMessage("Die beiden Eingaben stimmen nicht überein.", "error");
    return;
  }

  authSetMessage("Ersteinrichtung wird gespeichert …", "working");

  try {
    await driveInitialSetup(setupEmployee.value, setupPassword.value);
    const context = await driveSessionContext(driveAuthSessionToken);
    driveApplyLoggedInContext(context);
  } catch (error) {
    authSetMessage(error.message || "Ersteinrichtung fehlgeschlagen.", "error");
  }
});

logoutButton.addEventListener("click", async () => {
  const token = driveAuthSessionToken;
  localStorage.removeItem(DRIVE_AUTH_SESSION_KEY);
  driveAuthSessionToken = "";
  window.DRIVE_AUTH_LOGGED_IN = false;
  window.DRIVE_AUTH_CURRENT_EMPLOYEE_ID = null;
  currentEmployeeId = null;

  try {
    if (token) await driveRpc("drive_logout", {p_token:token});
  } catch {}

  window.location.reload();
});

async function initializeDriveAuth() {
  /* Supabase-Initialisierung der bestehenden App abwarten. */
  const started = Date.now();
  while (!DRIVE_SB.ready && Date.now() - started < 15000) {
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  if (!DRIVE_SB.ready) {
    authSetMessage("Supabase konnte nicht verbunden werden. Anmeldung derzeit nicht möglich.", "error");
    return;
  }

  populateLoginEmployees();

  try {
    const status = await driveAuthStatus();

    if (!status.has_credentials) {
      const candidates = Array.isArray(status.setup_candidates) ? status.setup_candidates : [];
      setupEmployee.innerHTML = candidates.map(item =>
        `<option value="${item.id}">${escapeHtml(item.name)}</option>`
      ).join("");

      if (!candidates.length) {
        authSetMessage("Für die Ersteinrichtung muss ein aktiver Mitarbeiter die Rolle Geschäftsinhaber besitzen.", "error");
        return;
      }

      authTitle.textContent = "Ersteinrichtung";
      authIntro.textContent = "Einmalig den Zugang des Geschäftsinhabers festlegen.";
      authShowForm("setup");
      return;
    }

    if (await driveRestoreSession()) return;

    authTitle.textContent = "Anmelden";
    authIntro.textContent = "Mitarbeiter auswählen und persönliche PIN bzw. Passwort eingeben.";
    authShowForm("login");
    loginEmployee.focus();
  } catch (error) {
    console.error("Login-Initialisierung", error);
    authSetMessage("Anmeldedatenbank ist noch nicht eingerichtet. Bitte zuerst SUPABASE_LOGIN_v1.2.sql ausführen.", "error");
  }
}

initializeDriveAuth();

