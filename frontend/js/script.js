/* --- Simple hash router and small SPA --- */
const routes = {
  '/': renderDashboard,
  '/productos': renderProductos,
  '/proveedores': renderProveedores,
  '/clientes': renderClientes,
  '/config': renderConfig
};

// LocalStorage demo data
const LS_KEY = 'spa_panel_demo_v1';
const defaultState = {
  productos: [
    { id: 1, nombre: 'Maceta cerámica', precio: 1200, stock: 8 },
    { id: 2, nombre: 'Tierra para suculentas 5L', precio: 650, stock: 30 }
  ],
  proveedores: [
    { id: 1, nombre: 'Vivero Flores', telefono: '123456789' }
  ],
  clientes: []
};

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY));
    return s || defaultState;
  } catch (e) {
    return defaultState;
  }
}
function saveState(s) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}
let state = loadState();

// --- Utils ---
function $(sel, root = document) { return root.querySelector(sel); }
function createEl(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const k in props) {
    if (k.startsWith('on') && typeof props[k] === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), props[k]);
    } else {
      el.setAttribute(k, props[k]);
    }
  }
  children.flat().forEach(c => {
    if (typeof c === 'string') el.appendChild(document.createTextNode(c));
    else if (c) el.appendChild(c);
  });
  return el;
}

// --- Routing ---
function setActiveNav(path) {
  document.querySelectorAll('#nav a').forEach(a =>
    a.classList.toggle('active', a.getAttribute('data-route') === path)
  );
}

function navigate() {
  const hash = location.hash.replace('#', '') || '/';
  const fn = routes[hash] || renderNotFound;
  setActiveNav(hash);
  $('#pageTitle').textContent = hash === '/' ? 'Dashboard' : hash.replace('/', '').charAt(0).toUpperCase() + hash.replace('/', '').slice(1);
  fn();
}

window.addEventListener('hashchange', navigate);
window.addEventListener('load', () => { setupUI(); navigate(); });

// --- Top-level UI ---
function setupUI() {
  const menuToggle = $('#menuToggle');
  if (menuToggle) menuToggle.style.display = 'none';

  $('#addBtn').addEventListener('click', () => {
    const path = location.hash.replace('#', '') || '/';
    if (path === '/productos') openProductoModal();
    else if (path === '/proveedores') openProveedorModal();
    else alert('El botón Nuevo funciona en las secciones Productos y Proveedores.');
  });

  // Responsive menu
  function check() {
    if (window.innerWidth <= 800) {
      $('#menuToggle').style.display = 'inline-block';
      $('#menuToggle').addEventListener('click', () =>
        document.getElementById('sidebar').classList.toggle('open')
      );
    }
  }
  check();
  window.addEventListener('resize', check);
}

/* --------- VIEWS ---------- */
function renderDashboard() {
  const v = createEl('div', {},
    createEl('div', { class: 'grid' },
      createEl('div', { class: 'card' },
        createEl('h3', {}, 'Resumen rápido'),
        createEl('div', { class: 'small' }, `Productos: ${state.productos.length}`)
      ),
      createEl('div', { class: 'card' },
        createEl('h3', {}, 'Inventario total'),
        createEl('div', { class: 'small' }, `${state.productos.reduce((a, b) => a + b.stock, 0)} items en stock`)
      )
    ),
    createEl('div', { style: 'margin-top:12px' },
      createEl('div', { class: 'card' },
        createEl('h3', {}, 'Últimos productos'),
        renderProductosTable(5)
      )
    )
  );
  $('#view').innerHTML = '';
  $('#view').appendChild(v);
}

/* --------- Productos ---------- */
function renderProductos() {
  const v = createEl('div', {},
    createEl('div', { class: 'card' },
      createEl('h3', {}, 'Productos'),
      renderProductosTable()
    )
  );
  $('#view').innerHTML = '';
  $('#view').appendChild(v);
}

function renderProductosTable(limit) {
  const tbl = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Nombre</th><th>Precio</th><th>Stock</th><th></th></tr>';
  tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  const items = state.productos.slice().reverse();
  if (limit) items.splice(limit);
  items.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.nombre}</td><td>$ ${p.precio}</td><td>${p.stock}</td><td style="text-align:right"></td>`;
    const btns = createEl('div', {},
      createEl('button', { class: 'btn ghost', onClick: () => openProductoModal(p) }, 'Editar'),
      createEl('button', { class: 'btn', onClick: () => deleteProducto(p.id) }, 'Eliminar')
    );
    tr.querySelector('td:last-child').appendChild(btns);
    tbody.appendChild(tr);
  });

  tbl.appendChild(tbody);
  return tbl;
}

function openProductoModal(product) {
  const isEdit = !!product;
  const root = $('#modalRoot'); root.style.display = 'block'; root.innerHTML = '';
  const modal = createEl('div', { class: 'modal-backdrop' },
    createEl('div', { class: 'modal' },
      createEl('h3', {}, isEdit ? 'Editar producto' : 'Nuevo producto'),
      createEl('div', { class: 'field' }, createEl('label', {}, 'Nombre'), createEl('input', { id: 'p_nombre', value: product ? product.nombre : '' })),
      createEl('div', { class: 'field' }, createEl('label', {}, 'Precio'), createEl('input', { id: 'p_precio', type: 'number', value: product ? product.precio : 0 })),
      createEl('div', { class: 'field' }, createEl('label', {}, 'Stock'), createEl('input', { id: 'p_stock', type: 'number', value: product ? product.stock : 0 })),
      createEl('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin-top:8px' },
        createEl('button', { class: 'btn ghost', onClick: closeModal }, 'Cancelar'),
        createEl('button', { class: 'btn', onClick: () => { saveProducto(isEdit ? product.id : null); } }, isEdit ? 'Guardar' : 'Crear')
      )
    )
  );
  root.appendChild(modal);
}

function closeModal() { const root = $('#modalRoot'); root.style.display = 'none'; root.innerHTML = ''; }

function saveProducto(id) {
  const nombre = $('#p_nombre').value.trim();
  const precio = Number($('#p_precio').value) || 0;
  const stock = Number($('#p_stock').value) || 0;
  if (!nombre) { alert('Nombre requerido'); return; }
  if (id) { state.productos = state.productos.map(p => p.id === id ? { ...p, nombre, precio, stock } : p); }
  else { const nid = state.productos.reduce((a, b) => Math.max(a, b.id), 0) + 1; state.productos.push({ id: nid, nombre, precio, stock }); }
  saveState(state); closeModal(); renderProductos();
}

function deleteProducto(id) {
  if (!confirm('Eliminar producto?')) return;
  state.productos = state.productos.filter(p => p.id !== id);
  saveState(state); renderProductos();
}

/* --------- Proveedores ---------- */
function renderProveedores() {
  const v = createEl('div', {},
    createEl('div', { class: 'card' },
      createEl('h3', {}, 'Proveedores'),
      renderProveedoresTable()
    )
  );
  $('#view').innerHTML = '';
  $('#view').appendChild(v);
}

function renderProveedoresTable() {
  const tbl = document.createElement('table');
  tbl.innerHTML = `<thead><tr><th>Nombre</th><th>Teléfono</th><th></th></tr></thead>`;
  const tbody = document.createElement('tbody');
  state.proveedores.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.nombre}</td><td>${p.telefono}</td><td style="text-align:right"></td>`;
    const btns = createEl('div', {},
      createEl('button', { class: 'btn ghost', onClick: () => openProveedorModal(p) }, 'Editar'),
      createEl('button', { class: 'btn', onClick: () => deleteProveedor(p.id) }, 'Eliminar')
    );
    tr.querySelector('td:last-child').appendChild(btns);
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  return tbl;
}

function openProveedorModal(prov) {
  const isEdit = !!prov;
  const root = $('#modalRoot'); root.style.display = 'block'; root.innerHTML = '';
  const modal = createEl('div', { class: 'modal-backdrop' },
    createEl('div', { class: 'modal' },
      createEl('h3', {}, isEdit ? 'Editar proveedor' : 'Nuevo proveedor'),
      createEl('div', { class: 'field' }, createEl('label', {}, 'Nombre'), createEl('input', { id: 'prov_nombre', value: prov ? prov.nombre : '' })),
      createEl('div', { class: 'field' }, createEl('label', {}, 'Teléfono'), createEl('input', { id: 'prov_telefono', value: prov ? prov.telefono : '' })),
      createEl('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin-top:8px' },
        createEl('button', { class: 'btn ghost', onClick: closeModal }, 'Cancelar'),
        createEl('button', { class: 'btn', onClick: () => { saveProveedor(isEdit ? prov.id : null); } }, isEdit ? 'Guardar' : 'Crear')
      )
    )
  );
  root.appendChild(modal);
}

function saveProveedor(id) {
  const nombre = $('#prov_nombre').value.trim();
  const telefono = $('#prov_telefono').value.trim();
  if (!nombre) { alert('Nombre requerido'); return; }
  if (id) { state.proveedores = state.proveedores.map(p => p.id === id ? { ...p, nombre, telefono } : p); }
  else { const nid = state.proveedores.reduce((a, b) => Math.max(a, b.id), 0) + 1; state.proveedores.push({ id: nid, nombre, telefono }); }
  saveState(state); closeModal(); renderProveedores();
}

function deleteProveedor(id) {
  if (!confirm('Eliminar proveedor?')) return;
  state.proveedores = state.proveedores.filter(p => p.id !== id);
  saveState(state); renderProveedores();
}

/* --------- Clientes ---------- */
function renderClientes() {
  const v = createEl('div', {},
    createEl('div', { class: 'card' },
      createEl('h3', {}, 'Clientes (vacío)'),
      createEl('div', { class: 'small' }, 'Aquí podrás listar clientes y sus pedidos.')
    )
  );
  $('#view').innerHTML = '';
  $('#view').appendChild(v);
}

/* --------- Config ---------- */
function renderConfig() {
  const v = createEl('div', {},
    createEl('div', { class: 'card' },
      createEl('h3', {}, 'Configuración'),
      createEl('div', { class: 'small' }, 'Opciones básicas de la aplicación (demo).'),
      createEl('div', { style: 'margin-top:10px' },
        createEl('button', { class: 'btn ghost', onClick: () => {
          if (confirm('Restablecer datos demo?')) { localStorage.removeItem(LS_KEY); state = loadState(); navigate(); }
        } }, 'Restablecer datos')
      )
    )
  );
  $('#view').innerHTML = '';
  $('#view').appendChild(v);
}

/* --------- Not Found ---------- */
function renderNotFound() {
  $('#view').innerHTML = '<div class="card"><h3>404</h3><p>Ruta no encontrada</p></div>';
}
