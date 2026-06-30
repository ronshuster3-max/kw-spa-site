let token = localStorage.getItem("kwAdminToken") || "demo-admin";

let site = null;

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body;
}

function fillBusiness() {
  const form = document.getElementById("businessForm");
  Object.entries(site.business || {}).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
}

function renderServiceEditors() {
  const container = document.getElementById("serviceEditors");
  container.innerHTML = site.services.map((service, index) => `
    <div class="service-editor" data-index="${index}">
      <label>Service name<input name="name" value="${service.name}"></label>
      <label>Duration<input name="duration" value="${service.duration}"></label>
      <label>Price<input name="price" value="${service.price}"></label>
      <label>Description<textarea name="description" rows="3">${service.description}</textarea></label>
    </div>
  `).join("");
}

function renderList(id, items, empty) {
  const list = document.getElementById(id);
  if (!items.length) {
    list.innerHTML = `<p>${empty}</p>`;
    return;
  }
  list.innerHTML = items.map(item => `
    <article class="admin-item">
      <strong>${item.name || "New item"}</strong>
      <p>${new Date(item.createdAt).toLocaleString()}</p>
      <p>${item.phone || item.email || ""}</p>
      <p>${item.service || item.message || ""}</p>
      <p>${item.note || ""}</p>
    </article>
  `).join("");
}

async function saveSite(statusElement, message) {
  await api("/api/site", { method: "PUT", body: JSON.stringify(site) });
  statusElement.textContent = message;
}

function wireAdmin() {
  const tokenInput = document.getElementById("tokenInput");
  tokenInput.value = token;
  tokenInput.addEventListener("change", async () => {
    token = tokenInput.value.trim() || "demo-admin";
    localStorage.setItem("kwAdminToken", token);
    await refreshLists();
  });

  const businessForm = document.getElementById("businessForm");
  businessForm.addEventListener("submit", async event => {
    event.preventDefault();
    const status = document.getElementById("businessStatus");
    status.textContent = "Saving...";
    site.business = { ...site.business, ...Object.fromEntries(new FormData(businessForm).entries()) };
    try {
      await saveSite(status, "Business details saved.");
    } catch (error) {
      status.textContent = error.message;
    }
  });

  document.getElementById("saveServices").addEventListener("click", async () => {
    const status = document.getElementById("serviceStatus");
    status.textContent = "Saving...";
    site.services = [...document.querySelectorAll(".service-editor")].map(editor => {
      const data = Object.fromEntries(new FormData(editor.closest("form") || document.createElement("form")).entries());
      editor.querySelectorAll("input, textarea").forEach(field => {
        data[field.name] = field.value;
      });
      return data;
    });
    try {
      await saveSite(status, "Services saved.");
    } catch (error) {
      status.textContent = error.message;
    }
  });
}

async function refreshLists() {
  renderList("bookingList", await api("/api/bookings"), "No booking requests yet.");
  renderList("leadList", await api("/api/leads"), "No contact leads yet.");
}

async function init() {
  site = await api("/api/site");
  localStorage.setItem("kwAdminToken", token);
  fillBusiness();
  renderServiceEditors();
  wireAdmin();
  await refreshLists();
}

init().catch(error => {
  document.body.insertAdjacentHTML("afterbegin", `<p class="form-status">${error.message}</p>`);
});
