const API = '';
let token = localStorage.getItem('token');
let state = { stats: null, users: [], businesses: [], subscriptions: [], tab: 'stats' };

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
  if (res.status === 401) { logout(); return null; }
  if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(err.error); }
  return res.json();
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function render() {
  if (!token) return renderLogin();
  document.getElementById('app').innerHTML = `
    <div class="header">
      <h1>Maps Interactive</h1>
      <div class="user-info">
        <span>${state.user?.name || 'Admin'}</span>
        <button onclick="logout()">Cerrar sesión</button>
      </div>
    </div>
    <div class="tabs">
      <button class="${state.tab === 'stats' ? 'active' : ''}" onclick="switchTab('stats')">Dashboard</button>
      <button class="${state.tab === 'users' ? 'active' : ''}" onclick="switchTab('users')">Usuarios</button>
      <button class="${state.tab === 'businesses' ? 'active' : ''}" onclick="switchTab('businesses')">Comercios</button>
      <button class="${state.tab === 'subscriptions' ? 'active' : ''}" onclick="switchTab('subscriptions')">Suscripciones</button>
    </div>
    <div id="content"></div>
  `;
  renderContent();
}

function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-box">
      <h1>Maps Interactive</h1>
      <p>Panel de administración</p>
      <input type="email" id="email" placeholder="Email" value="admin@test.com" />
      <input type="password" id="password" placeholder="Contraseña" />
      <button onclick="login()">Ingresar</button>
      <div id="login-error" class="error"></div>
    </div>
  `;
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    token = data.accessToken;
    state.user = data.user;
    localStorage.setItem('token', token);
    await loadData();
    render();
  } catch (e) {
    document.getElementById('login-error').textContent = e.message;
  }
}

function logout() {
  token = null;
  state = { stats: null, users: [], businesses: [], subscriptions: [], tab: 'stats' };
  localStorage.removeItem('token');
  render();
}

async function loadData() {
  try {
    const [stats, users, businesses, subscriptions] = await Promise.all([
      api('/api/admin/stats'),
      api('/api/admin/users'),
      api('/api/admin/businesses'),
      api('/api/admin/subscriptions'),
    ]);
    state.stats = stats;
    state.users = users;
    state.businesses = businesses;
    state.subscriptions = subscriptions;
  } catch (e) { showToast(e.message, 'error'); }
}

function switchTab(tab) {
  state.tab = tab;
  render();
}

function renderContent() {
  const el = document.getElementById('content');
  if (!el) return;
  if (state.tab === 'stats') renderStats(el);
  else if (state.tab === 'users') renderUsers(el);
  else if (state.tab === 'businesses') renderBusinesses(el);
  else if (state.tab === 'subscriptions') renderSubscriptions(el);
}

function renderStats(el) {
  if (!state.stats) { el.innerHTML = '<div class="loading">Cargando...</div>'; return; }
  el.innerHTML = `
    <div class="stats">
      <div class="stat-card"><div class="value">${state.stats.totalUsers}</div><div class="label">Usuarios</div></div>
      <div class="stat-card"><div class="value">${state.stats.totalBusinesses}</div><div class="label">Comercios</div></div>
      <div class="stat-card"><div class="value">${state.stats.activeSubscriptions}</div><div class="label">Suscripciones activas</div></div>
      <div class="stat-card"><div class="value">${state.stats.activeBusinesses}</div><div class="label">Comercios activos</div></div>
    </div>
  `;
}

function renderUsers(el) {
  if (!state.users.length) { el.innerHTML = '<div class="loading">Cargando...</div>'; return; }
  el.innerHTML = `
    <table>
      <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acción</th></tr></thead>
      <tbody>
        ${state.users.map(u => `
          <tr>
            <td>${esc(u.name)}</td>
            <td>${esc(u.email)}</td>
            <td><span class="status-badge ${u.role}">${u.role}</span></td>
            <td><span class="status-badge ${u.is_active ? 'active' : 'inactive'}">${u.is_active ? 'Activo' : 'Inactivo'}</span></td>
            <td><button class="btn ${u.is_active ? 'btn-danger' : 'btn-success'}" onclick="toggleUser('${u.id}', ${u.is_active})">${u.is_active ? 'Desactivar' : 'Activar'}</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderBusinesses(el) {
  if (!state.businesses.length) { el.innerHTML = '<div class="loading">Cargando...</div>'; return; }
  el.innerHTML = `
    <div style="margin-bottom:12px"><button class="btn btn-primary" onclick="showCreateBiz()">+ Nuevo comercio</button></div>
    <table>
      <thead><tr><th>Nombre</th><th>Categoría</th><th>Dueño</th><th>Suscripción</th><th>Estado</th><th>Acción</th></tr></thead>
      <tbody>
        ${state.businesses.map(b => `
          <tr>
            <td>${esc(b.name)}</td>
            <td>${esc(b.category)}</td>
            <td>${esc(b.owner_name)}</td>
            <td><span class="status-badge ${b.subscription_status || 'inactive'}">${b.subscription_status || 'inactiva'}</span></td>
            <td><span class="status-badge ${b.is_active ? 'active' : 'inactive'}">${b.is_active ? 'Activo' : 'Inactivo'}</span></td>
            <td><button class="btn ${b.is_active ? 'btn-danger' : 'btn-success'}" onclick="toggleBiz('${b.id}', ${b.is_active})">${b.is_active ? 'Desactivar' : 'Activar'}</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderSubscriptions(el) {
  if (!state.subscriptions.length) { el.innerHTML = '<div class="empty">No hay suscripciones</div>'; return; }
  el.innerHTML = `
    <table>
      <thead><tr><th>Comercio</th><th>Dueño</th><th>Email</th><th>Estado</th><th>MP ID</th><th>Creada</th></tr></thead>
      <tbody>
        ${state.subscriptions.map(s => `
          <tr>
            <td>${esc(s.business_name)}</td>
            <td>${esc(s.owner_name)}</td>
            <td>${esc(s.owner_email)}</td>
            <td><span class="status-badge ${s.status}">${s.status}</span></td>
            <td style="font-size:12px;color:#999">${s.mp_preapproval_id || '-'}</td>
            <td>${new Date(s.created_at).toLocaleDateString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function toggleUser(id, isActive) {
  try { await api(`/api/admin/users/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ is_active: !isActive }) }); showToast('Usuario actualizado'); await loadData(); renderContent(); } catch (e) { showToast(e.message, 'error'); }
}

async function toggleBiz(id, isActive) {
  try { await api(`/api/admin/businesses/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ is_active: !isActive }) }); showToast('Comercio actualizado'); await loadData(); renderContent(); } catch (e) { showToast(e.message, 'error'); }
}

function showCreateBiz() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'biz-modal';
  overlay.innerHTML = `
    <div class="modal">
      <h2>Nuevo comercio</h2>
      <input id="biz-name" placeholder="Nombre *" />
      <input id="biz-category" placeholder="Categoría *" />
      <div class="form-row">
        <input id="biz-lat" placeholder="Latitud *" type="number" step="any" />
        <input id="biz-lng" placeholder="Longitud *" type="number" step="any" />
      </div>
      <input id="biz-address" placeholder="Dirección" />
      <input id="biz-phone" placeholder="Teléfono" />
      <input id="biz-website" placeholder="Sitio web" />
      <select id="biz-owner">
        <option value="">Seleccionar dueño *</option>
        ${state.users.map(u => `<option value="${u.id}">${esc(u.name)} (${u.email}) - ${u.role}</option>`).join('')}
      </select>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="document.getElementById('biz-modal').remove()">Cancelar</button>
        <button class="btn btn-primary" onclick="createBiz()">Crear comercio</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function createBiz() {
  const name = document.getElementById('biz-name').value;
  const category = document.getElementById('biz-category').value;
  const latitude = parseFloat(document.getElementById('biz-lat').value);
  const longitude = parseFloat(document.getElementById('biz-lng').value);
  const address = document.getElementById('biz-address').value;
  const phone = document.getElementById('biz-phone').value;
  const website = document.getElementById('biz-website').value;
  const owner_id = document.getElementById('biz-owner').value;
  if (!name || !category || !latitude || !longitude || !owner_id) { showToast('Completá los campos requeridos (*)', 'error'); return; }
  try {
    await api('/api/admin/businesses', { method: 'POST', body: JSON.stringify({ name, category, latitude, longitude, address: address || undefined, phone: phone || undefined, website: website || undefined, owner_id }) });
    showToast('Comercio creado');
    document.getElementById('biz-modal').remove();
    await loadData();
    renderContent();
  } catch (e) { showToast(e.message, 'error'); }
}

function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

if (token) { api('/api/auth/me').then(u => { state.user = u; loadData().then(render); }).catch(() => { token = null; localStorage.removeItem('token'); render(); }); } else { render(); }
