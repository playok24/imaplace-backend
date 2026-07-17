const API = '';
let token = localStorage.getItem('token');
let state = { stats: null, users: [], businesses: [], subscriptions: [], touristPoints: [], tab: 'stats' };

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
      <button class="${state.tab === 'touristPoints' ? 'active' : ''}" onclick="switchTab('touristPoints')">Puntos Turísticos</button>
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
    await loadTab('stats');
    render();
  } catch (e) {
    document.getElementById('login-error').textContent = e.message;
  }
}

function logout() {
  token = null;
  state = { stats: null, users: [], businesses: [], subscriptions: [], touristPoints: [], tab: 'stats' };
  localStorage.removeItem('token');
  render();
}

async function loadTab(tab) {
  try {
    if (tab === 'stats') state.stats = await api('/api/admin/stats');
    else if (tab === 'users') state.users = await api('/api/admin/users');
    else if (tab === 'businesses') state.businesses = await api('/api/admin/businesses');
    else if (tab === 'touristPoints') state.touristPoints = await api('/api/admin/tourist-points');
    else if (tab === 'subscriptions') state.subscriptions = await api('/api/admin/subscriptions');
  } catch (e) { showToast(e.message, 'error'); }
}

function switchTab(tab) {
  state.tab = tab;
  render();
  loadTab(tab).then(() => renderContent());
}

function renderContent() {
  const el = document.getElementById('content');
  if (!el) return;
  if (state.tab === 'stats') renderStats(el);
  else if (state.tab === 'users') renderUsers(el);
  else if (state.tab === 'businesses') renderBusinesses(el);
  else if (state.tab === 'touristPoints') renderTouristPoints(el);
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
      <div class="stat-card"><div class="value">${state.stats.totalTouristPoints}</div><div class="label">Puntos turísticos</div></div>
      <div class="stat-card"><div class="value">${state.stats.activeTouristPoints}</div><div class="label">Puntos activos</div></div>
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
  if (!state.businesses) { el.innerHTML = '<div class="loading">Cargando...</div>'; return; }
  el.innerHTML = `
    <div style="margin-bottom:12px"><button class="btn btn-primary" onclick="showCreateBiz()">+ Nuevo comercio</button></div>
    ${state.businesses.length === 0 ? '<div class="empty">No hay comercios todavía. Creá uno nuevo.</div>' : `
    <table>
      <thead><tr><th>Nombre</th><th>Categoría</th><th>Dueño</th><th>Prioridad</th><th>Suscripción</th><th>Estado</th><th>Acción</th></tr></thead>
      <tbody>
        ${state.businesses.map(b => `
          <tr>
            <td>${esc(b.name)}</td>
            <td>${esc(b.category)}</td>
            <td>${esc(b.owner_name)}</td>
            <td>${renderPrioritySelect('biz', b.id, b.priority ?? 5)}</td>
            <td><span class="status-badge ${b.subscription_status || 'inactive'}">${b.subscription_status || 'inactiva'}</span></td>
            <td><span class="status-badge ${b.is_active ? 'active' : 'inactive'}">${b.is_active ? 'Activo' : 'Inactivo'}</span></td>
            <td><button class="btn ${b.is_active ? 'btn-danger' : 'btn-success'}" onclick="toggleBiz('${b.id}', ${b.is_active})">${b.is_active ? 'Desactivar' : 'Activar'}</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>`}
  `;
}

function renderTouristPoints(el) {
  if (!state.touristPoints) { el.innerHTML = '<div class="loading">Cargando...</div>'; return; }
  el.innerHTML = `
    <div style="margin-bottom:12px"><button class="btn btn-primary" onclick="showCreateTouristPoint()">+ Nuevo punto turístico</button></div>
    ${state.touristPoints.length === 0 ? '<div class="empty">No hay puntos turísticos todavía. Creá uno nuevo.</div>' : `
    <table>
      <thead><tr><th>Nombre</th><th>Categoría</th><th>Importancia</th><th>Prioridad</th><th>Gratis</th><th>Estado</th><th>Acción</th></tr></thead>
      <tbody>
        ${state.touristPoints.map(p => `
          <tr>
            <td>${esc(p.name)}</td>
            <td>${esc(p.category)}</td>
            <td><span class="status-badge ${p.importance}">${p.importance}</span></td>
            <td>${renderPrioritySelect('tp', p.id, p.priority ?? 5)}</td>
            <td>${p.is_free ? 'Sí' : 'No'}</td>
            <td><span class="status-badge ${p.is_active ? 'active' : 'inactive'}">${p.is_active ? 'Activo' : 'Inactivo'}</span></td>
            <td>
              <button class="btn ${p.is_active ? 'btn-danger' : 'btn-success'}" onclick="toggleTouristPoint('${p.id}', ${p.is_active})" style="margin-right:4px">${p.is_active ? 'Desactivar' : 'Activar'}</button>
              <button class="btn btn-outline" onclick="deleteTouristPoint('${p.id}')">Eliminar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`}
  `;
}

function renderPrioritySelect(type, id, current) {
  let opts = '';
  for (let i = 1; i <= 5; i++) {
    const sel = i === current ? 'selected' : '';
    const label = i === 1 ? '1 (arriba)' : `${i}`;
    opts += `<option value="${i}" ${sel}>${label}</option>`;
  }
  const bg = {1:'#C62828',2:'#E65100',3:'#1565C0',4:'#6A1B9A',5:'#888'}[current] || '#888';
  return `<select class="priority-select" style="background:${bg};color:white" onchange="updatePriority('${type}','${id}',this.value)">
    ${opts}
  </select>`;
}

async function updatePriority(type, id, value) {
  const priority = parseInt(value);
  if (type === 'biz') {
    try { await api(`/api/admin/businesses/${id}/priority`, { method: 'PATCH', body: JSON.stringify({ priority }) }); showToast('Prioridad actualizada'); } catch (e) { showToast(e.message, 'error'); }
  } else {
    try { await api(`/api/admin/tourist-points/${id}/priority`, { method: 'PATCH', body: JSON.stringify({ priority }) }); showToast('Prioridad actualizada'); } catch (e) { showToast(e.message, 'error'); }
  }
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
  try { await api(`/api/admin/users/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ is_active: !isActive }) }); showToast('Usuario actualizado'); state.users = await api('/api/admin/users'); renderContent(); } catch (e) { showToast(e.message, 'error'); }
}

async function toggleBiz(id, isActive) {
  try { await api(`/api/admin/businesses/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ is_active: !isActive }) }); showToast('Comercio actualizado'); state.businesses = await api('/api/admin/businesses'); renderContent(); } catch (e) { showToast(e.message, 'error'); }
}

// ---- Map Picker ----
function initMapPicker(mapId, prefix) {
  const map = L.map(mapId, { zoomControl: true }).setView([-31.420, -64.188], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  let marker = null;

  function setCoords(lat, lng) {
    window[`${prefix}Lat`] = lat;
    window[`${prefix}Lng`] = lng;
    if (marker) { marker.setLatLng([lat, lng]); }
    else {
      marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on('dragend', () => setCoords(marker.getLatLng().lat, marker.getLatLng().lng));
    }
    map.setView([lat, lng], map.getZoom());
  }

  map.on('click', (e) => setCoords(e.latlng.lat, e.latlng.lng));

  setTimeout(() => map.invalidateSize(), 300);
  return { map, setCoords };
}

// ---- URL Resolver ----
async function resolveCoords(prefix) {
  const input = document.getElementById(`${prefix}-gmaps`);
  const url = input.value.trim();
  if (!url) { showToast('Pegá un link de Google Maps primero', 'error'); return; }
  try {
    const data = await api('/api/utils/resolve-coordinates', { method: 'POST', body: JSON.stringify({ url }) });
    window[`${prefix}Lat`] = data.latitude;
    window[`${prefix}Lng`] = data.longitude;
    const mapObj = window[`${prefix}Map`];
    if (mapObj) mapObj.setCoords(data.latitude, data.longitude);
    showToast('Ubicación resuelta');
  } catch (e) { showToast(e.message, 'error'); }
}

// ---- Photo list helper ----
function photoListHTML(prefix) {
  const photos = window[`${prefix}Photos`] || [];
  const list = photos.map((url, i) =>
    `<span style="display:inline-flex;align-items:center;gap:4px;background:#f0f0f0;padding:2px 8px;border-radius:4px;margin:2px;font-size:12px">
      <img src="${esc(url)}" style="width:24px;height:24px;object-fit:cover;border-radius:3px" onerror="this.style.display='none'" />
      ${esc(url.substring(0, 30))}...
      <button onclick="removePhoto('${prefix}',${i})" style="background:none;border:none;cursor:pointer;color:#c00;font-size:14px;padding:0">&times;</button>
    </span>`
  ).join('');
  return `<div id="${prefix}-photo-list" style="margin-bottom:8px">${list}</div>`;
}

function addPhoto(prefix) {
  const input = document.getElementById(`${prefix}-photo-input`);
  const url = input.value.trim();
  if (!url) return;
  if (!window[`${prefix}Photos`]) window[`${prefix}Photos`] = [];
  window[`${prefix}Photos`].push(url);
  input.value = '';
  document.getElementById(`${prefix}-photo-list`).outerHTML = photoListHTML(prefix);
}

function removePhoto(prefix, i) {
  window[`${prefix}Photos`].splice(i, 1);
  document.getElementById(`${prefix}-photo-list`).outerHTML = photoListHTML(prefix);
}

// ---- Business Create ----
function showCreateBiz() {
  window.bizPhotos = [];
  window.bizLat = null;
  window.bizLng = null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'biz-modal';
  overlay.innerHTML = `
    <div class="modal modal-wide">
      <h2>Nuevo comercio</h2>
      <input id="biz-name" placeholder="Nombre *" />
      <div class="form-row">
        <input id="biz-category" placeholder="Categoría *" style="flex:1" />
        <select id="biz-priority" style="width:120px">
          <option value="5">Prioridad: 5</option>
          <option value="4">Prioridad: 4</option>
          <option value="3">Prioridad: 3</option>
          <option value="2">Prioridad: 2</option>
          <option value="1">Prioridad: 1 (arriba)</option>
        </select>
      </div>
      <div class="form-row">
        <input id="biz-gmaps" placeholder="Link de Google Maps (ej: https://maps.app.goo.gl/...)" style="flex:1" />
        <button class="btn btn-primary" onclick="resolveCoords('biz')" style="white-space:nowrap">Resolver</button>
      </div>
      <div id="biz-map" class="map-picker"></div>
      <input id="biz-address" placeholder="Dirección" />
      <input id="biz-phone" placeholder="Teléfono" />
      <input id="biz-website" placeholder="Sitio web" />
      <div style="margin-bottom:8px">
        <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Fotos (URLs)</label>
        <div class="form-row">
          <input id="biz-photo-input" placeholder="https://ejemplo.com/foto.jpg" style="flex:1" />
          <button class="btn btn-primary" onclick="addPhoto('biz')" style="white-space:nowrap">Agregar</button>
        </div>
        ${photoListHTML('biz')}
      </div>
      <select id="biz-owner">
        <option value="">Sin dueño (creación manual)</option>
        ${state.users.map(u => `<option value="${u.id}">${esc(u.name)} (${u.email}) - ${u.role}</option>`).join('')}
      </select>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="cleanupMap('biz-map');document.getElementById('biz-modal').remove()">Cancelar</button>
        <button class="btn btn-primary" onclick="createBiz()">Crear comercio</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  window.bizMap = initMapPicker('biz-map', 'biz');
}

async function createBiz() {
  const name = document.getElementById('biz-name').value;
  const category = document.getElementById('biz-category').value;
  const latitude = window.bizLat;
  const longitude = window.bizLng;
  const address = document.getElementById('biz-address').value;
  const phone = document.getElementById('biz-phone').value;
  const website = document.getElementById('biz-website').value;
  const owner_id = document.getElementById('biz-owner').value;
  const priority = parseInt(document.getElementById('biz-priority').value);
  const photos = window.bizPhotos || [];
  if (!name || !category || latitude == null || longitude == null) { showToast('Completá nombre, categoría, y hacé clic en el mapa o resolvé un link de Google Maps', 'error'); return; }
  try {
    const body = { name, category, latitude, longitude, priority, photos, address: address || undefined, phone: phone || undefined, website: website || undefined };
    if (owner_id) body.owner_id = owner_id;
    await api('/api/admin/businesses', { method: 'POST', body: JSON.stringify(body) });
    showToast('Comercio creado');
    cleanupMap('biz-map');
    document.getElementById('biz-modal').remove();
    state.businesses = await api('/api/admin/businesses');
    renderContent();
  } catch (e) { showToast(e.message, 'error'); }
}

function cleanupMap(mapId) {
  const map = window.bizMap || window.tpMap;
  if (map) { if (map.map) map.map.remove(); else map.remove(); window.bizMap = null; window.tpMap = null; }
}

// ---- Tourist Point Create ----
function showCreateTouristPoint() {
  window.tpPhotos = [];
  window.tpLat = null;
  window.tpLng = null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'tp-modal';
  overlay.innerHTML = `
    <div class="modal modal-wide">
      <h2>Nuevo punto turístico</h2>
      <input id="tp-name" placeholder="Nombre *" />
      <div class="form-row">
        <input id="tp-category" placeholder="Categoría * (mirador, museo, parque, etc.)" style="flex:1" />
        <select id="tp-priority" style="width:120px">
          <option value="5">Prioridad: 5</option>
          <option value="4">Prioridad: 4</option>
          <option value="3">Prioridad: 3</option>
          <option value="2">Prioridad: 2</option>
          <option value="1">Prioridad: 1 (arriba)</option>
        </select>
      </div>
      <textarea id="tp-description" placeholder="Descripción" rows="3" style="width:100%;padding:10px 14px;margin-bottom:12px;border:1px solid #ddd;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical"></textarea>
      <div class="form-row">
        <input id="tp-gmaps" placeholder="Link de Google Maps (ej: https://maps.app.goo.gl/...)" style="flex:1" />
        <button class="btn btn-primary" onclick="resolveCoords('tp')" style="white-space:nowrap">Resolver</button>
      </div>
      <div id="tp-map" class="map-picker"></div>
      <input id="tp-address" placeholder="Dirección" />
      <input id="tp-website" placeholder="Sitio web" />
      <div class="form-row">
        <select id="tp-importance" style="flex:1">
          <option value="medium">Importancia: Media</option>
          <option value="low">Baja</option>
          <option value="high">Alta</option>
          <option value="must-see">Imperdible</option>
        </select>
        <select id="tp-season" style="flex:1">
          <option value="all">Temporada: Todas</option>
          <option value="spring">Primavera</option>
          <option value="summer">Verano</option>
          <option value="autumn">Otoño</option>
          <option value="winter">Invierno</option>
        </select>
      </div>
      <div class="form-row">
        <input id="tp-duration" placeholder="Duración (minutos)" type="number" min="0" />
        <label style="display:flex;align-items:center;gap:6px;white-space:nowrap;font-size:14px">
          <input id="tp-free" type="checkbox" checked /> Gratis
        </label>
      </div>
      <div style="margin-bottom:8px">
        <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Fotos (URLs)</label>
        <div class="form-row">
          <input id="tp-photo-input" placeholder="https://ejemplo.com/foto.jpg" style="flex:1" />
          <button class="btn btn-primary" onclick="addPhoto('tp')" style="white-space:nowrap">Agregar</button>
        </div>
        ${photoListHTML('tp')}
      </div>
      <textarea id="tp-tips" placeholder="Tips / recomendaciones" rows="2" style="width:100%;padding:10px 14px;margin-bottom:12px;border:1px solid #ddd;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical"></textarea>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="cleanupMap('tp-map');document.getElementById('tp-modal').remove()">Cancelar</button>
        <button class="btn btn-primary" onclick="createTouristPoint()">Crear punto</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  window.tpMap = initMapPicker('tp-map', 'tp');
}

async function createTouristPoint() {
  const name = document.getElementById('tp-name').value;
  const category = document.getElementById('tp-category').value;
  const description = document.getElementById('tp-description').value;
  const latitude = window.tpLat;
  const longitude = window.tpLng;
  const address = document.getElementById('tp-address').value;
  const website = document.getElementById('tp-website').value;
  const importance = document.getElementById('tp-importance').value;
  const season = document.getElementById('tp-season').value;
  const estimated_duration_minutes = parseInt(document.getElementById('tp-duration').value) || null;
  const is_free = document.getElementById('tp-free').checked;
  const tips = document.getElementById('tp-tips').value;
  const priority = parseInt(document.getElementById('tp-priority').value);
  const photos = window.tpPhotos || [];
  if (!name || !category || latitude == null || longitude == null) { showToast('Completá nombre, categoría, y hacé clic en el mapa o resolvé un link de Google Maps', 'error'); return; }
  try {
    await api('/api/admin/tourist-points', { method: 'POST', body: JSON.stringify({ name, category, description, latitude, longitude, priority, photos, address: address || undefined, website: website || undefined, importance, season, estimated_duration_minutes, is_free, tips: tips || undefined }) });
    showToast('Punto turístico creado');
    cleanupMap('tp-map');
    document.getElementById('tp-modal').remove();
    state.touristPoints = await api('/api/admin/tourist-points');
    renderContent();
  } catch (e) { showToast(e.message, 'error'); }
}

async function toggleTouristPoint(id, isActive) {
  try { await api(`/api/admin/tourist-points/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ is_active: !isActive }) }); showToast('Actualizado'); state.touristPoints = await api('/api/admin/tourist-points'); renderContent(); } catch (e) { showToast(e.message, 'error'); }
}

async function deleteTouristPoint(id) {
  if (!confirm('¿Eliminar este punto turístico?')) return;
  try { await api(`/api/admin/tourist-points/${id}`, { method: 'DELETE' }); showToast('Eliminado'); state.touristPoints = await api('/api/admin/tourist-points'); renderContent(); } catch (e) { showToast(e.message, 'error'); }
}

function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

if (token) { api('/api/auth/me').then(u => { state.user = u; loadTab('stats').then(render); }).catch(() => { token = null; localStorage.removeItem('token'); render(); }); } else { render(); }
