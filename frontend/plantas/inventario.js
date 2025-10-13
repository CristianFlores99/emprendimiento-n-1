/* -----------------------------------------
   Inventario SPA - Plantas
   - Persistencia: localStorage
   - Funcionalidades: gestión, stock, búsqueda,
     reportes, movimientos, ventas, export, catálogo,
     recordatorios de cuidados, historial/auditoría
   ----------------------------------------- */

const KEY = {
    PROD: "inv_plantas_productos",
    MOV: "inv_plantas_movimientos",
    HIST: "inv_plantas_historial",
    VENT: "inv_plantas_ventas"
};

// datos en memoria
let productos = JSON.parse(localStorage.getItem(KEY.PROD) || "[]");
let movimientos = JSON.parse(localStorage.getItem(KEY.MOV) || "[]");
let historial = JSON.parse(localStorage.getItem(KEY.HIST) || "[]");
let ventas = JSON.parse(localStorage.getItem(KEY.VENT) || "[]");

// referencias DOM
const sections = {
    gestion: document.getElementById("gestion"),
    stock: document.getElementById("stock"),
    busqueda: document.getElementById("busqueda"),
    reportes: document.getElementById("reportes"),
    logistica: document.getElementById("logistica"),
    ventas: document.getElementById("ventas"),
    historial: document.getElementById("historial"),
    catalogo: document.getElementById("catalogo"),
    cuidados: document.getElementById("cuidados"),
    export: document.getElementById("export")
};

// sidebar buttons
document.getElementById("btnGestion").onclick = ()=> showSection("gestion");
document.getElementById("btnStock").onclick = ()=> showSection("stock");
document.getElementById("btnBusqueda").onclick = ()=> showSection("busqueda");
document.getElementById("btnReportes").onclick = ()=> showSection("reportes");
document.getElementById("btnLogistica").onclick = ()=> { showSection("logistica"); populateMovimientoSelects(); };
document.getElementById("btnVentas").onclick = ()=> { showSection("ventas"); populateVentasSelect(); };
document.getElementById("btnHistorial").onclick = ()=> showSection("historial");
document.getElementById("btnCatalogo").onclick = ()=> { showSection("catalogo"); renderCatalog(); };
document.getElementById("btnCuidados").onclick = ()=> { showSection("cuidados"); renderRecordatorios(); };
document.getElementById("btnExport").onclick = ()=> showSection("export");

// util guardar
function saveAll(){
    localStorage.setItem(KEY.PROD, JSON.stringify(productos));
    localStorage.setItem(KEY.MOV, JSON.stringify(movimientos));
    localStorage.setItem(KEY.HIST, JSON.stringify(historial));
    localStorage.setItem(KEY.VENT, JSON.stringify(ventas));
}

/* ------------------------------
   Mostrar sección
   ------------------------------ */
function showSection(name){
    Object.values(sections).forEach(s => s.style.display = "none");
    sections[name].style.display = "block";
    // llamadas de render según sección
    if(name==="gestion") renderProductosTable();
    if(name==="stock") renderStockTable();
    if(name==="busqueda") renderBusqueda();
    if(name==="reportes") renderReportes();
    if(name==="logistica") renderMovimientos();
    if(name==="ventas") renderVentasTable();
    if(name==="historial") renderHistorial();
    if(name==="catalogo") renderCatalog();
    if(name==="cuidados") renderRecordatorios();
}

/* ------------------------------
   Gestión de productos
   ------------------------------ */
const formProducto = document.getElementById("formProducto");
const fileInput = document.getElementById("imagen");
formProducto.addEventListener("submit", handleAddOrEdit);

document.getElementById("btnReset").addEventListener("click", () => {
    formProducto.reset();
    document.getElementById("editIndex").value = "-1";
});

function handleAddOrEdit(e){
    e.preventDefault();
    const idx = parseInt(document.getElementById("editIndex").value);
    const data = gatherFormData();

    // si hay imagen subida, se procesa antes
    const file = fileInput.files[0];
    if(file){
        const reader = new FileReader();
        reader.onload = () => {
            data.imagen = reader.result; // base64
            persistProduct(idx,data);
        };
        reader.readAsDataURL(file);
    } else {
        persistProduct(idx,data);
    }
}

function gatherFormData(){
    return {
        sku: document.getElementById("codigo").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        cientifico: document.getElementById("cientifico").value.trim(),
        tipo: document.getElementById("tipo").value,
        categoria: document.getElementById("categoria").value,
        tamano: document.getElementById("tamano").value,
        stock: parseInt(document.getElementById("stockInit").value) || 0,
        costo: parseFloat(document.getElementById("costo").value) || 0,
        precio: parseFloat(document.getElementById("precio").value) || 0,
        proveedor: document.getElementById("proveedor").value.trim(),
        cuidado_riego: document.getElementById("riego").value.trim(),
        cuidado_luz: document.getElementById("luz").value.trim(),
        cuidado_fert: document.getElementById("fertilizacion").value.trim(),
        observaciones: document.getElementById("observaciones").value.trim(),
        imagen: null
    };
}

function persistProduct(idx,data){
    if(!data.sku || !data.nombre){
        alert("SKU y Nombre son obligatorios");
        return;
    }
    if(idx>=0){
        // editar: mantener stock previo + merges
        const prev = productos[idx];
        data.stock = (typeof data.stock === "number") ? data.stock : prev.stock;
        data.imagen = data.imagen || prev.imagen || null;
        productos[idx] = {...prev, ...data};
        historial.push({fecha: new Date().toLocaleString(), producto: data.nombre, accion:"Editado", detalle:`SKU: ${data.sku}`});
    } else {
        productos.push(data);
        historial.push({fecha: new Date().toLocaleString(), producto: data.nombre, accion:"Creado", detalle:`SKU: ${data.sku}`});
    }
    saveAll();
    formProducto.reset();
    document.getElementById("editIndex").value = "-1";
    renderProductosTable();
}

/* Render tabla productos */
function renderProductosTable(){
    const tbody = document.querySelector("#tablaProductos tbody");
    tbody.innerHTML = "";
    productos.forEach((p, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.sku}</td>
            <td>${p.nombre}</td>
            <td>${p.tipo || ""}</td>
            <td>${p.tamano || ""}</td>
            <td>${formatMoney(p.precio)}</td>
            <td class="${(p.stock||0) < 5 ? 'low-stock' : ''}">${p.stock||0}</td>
            <td>
                <button onclick="editProduct(${i})">Editar</button>
                <button onclick="deleteProduct(${i})">Eliminar</button>
                <button onclick="viewProduct(${i})">Ver</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* editar / borrar / ver */
window.editProduct = function(i){
    const p = productos[i];
    document.getElementById("editIndex").value = i;
    document.getElementById("codigo").value = p.sku;
    document.getElementById("nombre").value = p.nombre;
    document.getElementById("cientifico").value = p.cientifico || "";
    document.getElementById("tipo").value = p.tipo || "";
    document.getElementById("categoria").value = p.categoria || "";
    document.getElementById("tamano").value = p.tamano || "";
    document.getElementById("stockInit").value = p.stock || 0;
    document.getElementById("costo").value = p.costo || 0;
    document.getElementById("precio").value = p.precio || 0;
    document.getElementById("proveedor").value = p.proveedor || "";
    document.getElementById("riego").value = p.cuidado_riego || "";
    document.getElementById("luz").value = p.cuidado_luz || "";
    document.getElementById("fertilizacion").value = p.cuidado_fert || "";
    document.getElementById("observaciones").value = p.observaciones || "";
    showSection("gestion");
};

window.deleteProduct = function(i){
    if(!confirm("Eliminar planta?")) return;
    const p = productos.splice(i,1)[0];
    historial.push({fecha:new Date().toLocaleString(), producto:p.nombre, accion:"Eliminado", detalle:`SKU ${p.sku}`});
    saveAll();
    renderProductosTable();
};

/* ver detalle modal */
window.viewProduct = function(i){
    const p = productos[i];
    const modal = document.getElementById("modal");
    const body = document.getElementById("modalBody");
    body.innerHTML = `
        <div style="display:flex;gap:12px;flex-wrap:wrap">
            <div style="flex:1;min-width:220px">
                ${p.imagen ? `<img src="${p.imagen}" style="width:100%;border-radius:6px">` : `<div style="height:180px;background:#eee;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#888">Sin imagen</div>`}
            </div>
            <div style="flex:2;min-width:260px">
                <h2>${p.nombre} <small style="font-weight:400">(${p.sku})</small></h2>
                <p><strong>Científico:</strong> ${p.cientifico || "-"}</p>
                <p><strong>Tipo:</strong> ${p.tipo || "-"}</p>
                <p><strong>Categoría:</strong> ${p.categoria || "-"}</p>
                <p><strong>Tamaño:</strong> ${p.tamano || "-"}</p>
                <p><strong>Stock:</strong> <span class="${p.stock < 5 ? 'low-stock' : ''}">${p.stock}</span></p>
                <p><strong>Precio:</strong> ${formatMoney(p.precio)}</p>
                <p><strong>Costo:</strong> ${formatMoney(p.costo)}</p>
                <p><strong>Riego:</strong> ${p.cuidado_riego || "-"}</p>
                <p><strong>Luz:</strong> ${p.cuidado_luz || "-"}</p>
                <p><strong>Fertilización:</strong> ${p.cuidado_fert || "-"}</p>
                <p><strong>Proveedor:</strong> ${p.proveedor || "-"}</p>
                <p><strong>Notas:</strong> ${p.observaciones || "-"}</p>
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
};
document.getElementById("modalClose").onclick = ()=> document.getElementById("modal").classList.add("hidden");

/* ------------------------------
   Stock
   ------------------------------ */
function renderStockTable(){
    const tbody = document.querySelector("#tablaStock tbody");
    tbody.innerHTML = "";
    productos.forEach((p,i)=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.sku}</td>
            <td>${p.nombre}</td>
            <td class="${(p.stock||0)<5?'low-stock':''}">${p.stock||0}</td>
            <td>
                <button onclick="adjustStock(${i},1)">+1</button>
                <button onclick="adjustStock(${i},-1)">-1</button>
            </td>`;
        tbody.appendChild(tr);
    });
}
window.adjustStock = function(index, delta){
    productos[index].stock = Math.max(0,(productos[index].stock||0)+delta);
    historial.push({fecha:new Date().toLocaleString(), producto:productos[index].nombre, accion:"Ajuste stock", detalle:`Cambio ${delta}`});
    saveAll();
    renderStockTable();
};

/* ------------------------------
   Búsqueda (cards)
   ------------------------------ */
const busquedaInput = document.getElementById("busquedaInput");
busquedaInput.addEventListener("input", renderBusqueda);

function renderBusqueda(){
    const q = busquedaInput.value.trim().toLowerCase();
    const container = document.getElementById("resultadoBusqueda");
    container.innerHTML = "";
    const lista = productos.filter(p=>{
        if(!q) return true;
        return (p.nombre||"").toLowerCase().includes(q) ||
               (p.tipo||"").toLowerCase().includes(q) ||
               (p.sku||"").toLowerCase().includes(q);
    });
    lista.forEach((p,i)=>{
        const card = document.createElement("div");
        card.className = "tarjeta-producto";
        card.innerHTML = `
            ${p.imagen ? `<img src="${p.imagen}">` : `<div style="height:140px;background:#f0f0f0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#aaa">Sin imagen</div>`}
            <h3>${p.nombre}</h3>
            <p><strong>SKU:</strong> ${p.sku}</p>
            <p><strong>Tipo:</strong> ${p.tipo || "-"}</p>
            <p><strong>Stock:</strong> <span class="${(p.stock||0)<5?'low-stock':''}">${p.stock||0}</span></p>
            <p><strong>Precio:</strong> ${formatMoney(p.precio)}</p>
            <div style="display:flex;gap:8px;margin-top:6px">
                <button onclick="viewProduct(${i})">Ver</button>
                <button onclick="addToCartFromSearch(${i})">Vender</button>
            </div>
        `;
        container.appendChild(card);
    });
}
window.addToCartFromSearch = window.addToCartFromSearch || function(i){ registrarVentaDirecta(i); };

/* ------------------------------
   Reportes
   ------------------------------ */
function renderReportes(){
    const totalStock = productos.reduce((s,p)=>s+(p.stock||0),0);
    const valorCost = productos.reduce((s,p)=>s+((p.costo||0)*(p.stock||0)),0);
    const valorVenta = productos.reduce((s,p)=>s+((p.precio||0)*(p.stock||0)),0);
    document.getElementById("stockTotal").innerText = totalStock;
    document.getElementById("valorStock").innerText = formatMoney(valorCost);
    document.getElementById("valorVenta").innerText = formatMoney(valorVenta);

    const ul = document.getElementById("margenList");
    ul.innerHTML = "";
    productos.forEach(p=>{
        const li = document.createElement("li");
        li.textContent = `${p.nombre}: Margen ${formatMoney((p.precio||0)-(p.costo||0))} por unidad`;
        ul.appendChild(li);
    });
}

/* ------------------------------
   Movimientos (Logística)
   ------------------------------ */
const formMovimiento = document.getElementById("formMovimiento");
formMovimiento.addEventListener("submit", e=>{
    e.preventDefault();
    const idx = parseInt(document.getElementById("productoMovimiento").value);
    const tipo = document.getElementById("tipoMovimiento").value;
    const cantidad = parseInt(document.getElementById("cantidadMovimiento").value) || 0;
    if(isNaN(idx) || cantidad<=0){ alert("Selecciona producto y cantidad válida"); return; }
    const p = productos[idx];
    if(tipo==="entrada") p.stock += cantidad;
    else if(tipo==="salida") p.stock = Math.max(0,p.stock - cantidad);
    else if(tipo==="ajuste"){ p.stock = Math.max(0,cantidad); } // ajuste a cantidad exacta
    movimientos.push({fecha:new Date().toLocaleString(), producto:p.nombre, tipo, cantidad});
    historial.push({fecha:new Date().toLocaleString(), producto:p.nombre, accion:`Movimiento ${tipo}`, detalle:`Cantidad ${cantidad}`});
    saveAll();
    renderMovimientos();
    renderProductosTable();
});

function populateMovimientoSelects(){
    const sel = document.getElementById("productoMovimiento");
    sel.innerHTML = "<option value=''>Seleccionar producto</option>";
    productos.forEach((p,i)=> {
        const opt = document.createElement("option"); opt.value = i; opt.textContent = `${p.nombre} (SKU:${p.sku})`;
        sel.appendChild(opt);
    });
}
function renderMovimientos(){
    const tbody = document.querySelector("#tablaMovimientos tbody");
    tbody.innerHTML = "";
    movimientos.slice().reverse().forEach(m=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${m.fecha}</td><td>${m.producto}</td><td>${m.tipo}</td><td>${m.cantidad}</td>`;
        tbody.appendChild(tr);
    });
}

/* ------------------------------
   Ventas
   ------------------------------ */
const formVentas = document.getElementById("formVentas");
formVentas.addEventListener("submit", e=>{
    e.preventDefault();
    registrarVenta();
});

function populateVentasSelect(){
    const sel = document.getElementById("productoVenta");
    sel.innerHTML = "<option value=''>Seleccionar producto</option>";
    productos.forEach((p,i)=>{
        const opt = document.createElement("option"); opt.value = i; opt.textContent = `${p.nombre} (stock:${p.stock||0})`;
        sel.appendChild(opt);
    });
}

function registrarVenta(){
    const idx = parseInt(document.getElementById("productoVenta").value);
    const cantidad = parseInt(document.getElementById("cantidadVenta").value) || 0;
    if(isNaN(idx) || cantidad<=0){ alert("Selecciona producto y cantidad válida"); return; }
    const p = productos[idx];
    if(cantidad > (p.stock||0)){ alert("Stock insuficiente"); return; }
    p.stock -= cantidad;
    const venta = {fecha:new Date().toLocaleString(), producto:p.nombre, cantidad};
    ventas.push(venta);
    movimientos.push({fecha:venta.fecha, producto:p.nombre, tipo:"salida", cantidad});
    historial.push({fecha:venta.fecha, producto:p.nombre, accion:"Venta", detalle:`Cantidad ${cantidad}`});
    saveAll();
    renderVentasTable();
    renderProductosTable();
    populateVentasSelect();
    populateMovimientoSelects();
}

function registrarVentaDirecta(i){
    // vender 1 unidad rápido desde catálogo/búsqueda
    if(!productos[i] || (productos[i].stock||0) < 1){ alert("Stock insuficiente"); return; }
    productos[i].stock -= 1;
    const venta = {fecha:new Date().toLocaleString(), producto:productos[i].nombre, cantidad:1};
    ventas.push(venta);
    movimientos.push({fecha:venta.fecha, producto:productos[i].nombre, tipo:"salida", cantidad:1});
    historial.push({fecha:venta.fecha, producto:productos[i].nombre, accion:"Venta rápida", detalle:"Cantidad 1"});
    saveAll();
    renderVentasTable(); renderProductosTable(); populateVentasSelect(); populateMovimientoSelects(); renderBusqueda();
}

function renderVentasTable(){
    const tbody = document.querySelector("#tablaVentas tbody");
    tbody.innerHTML = "";
    ventas.slice().reverse().forEach(v=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${v.fecha}</td><td>${v.producto}</td><td>${v.cantidad}</td>`;
        tbody.appendChild(tr);
    });
}

/* ------------------------------
   Historial
   ------------------------------ */
function renderHistorial(){
    const tbody = document.querySelector("#tablaHistorial tbody");
    tbody.innerHTML = "";
    historial.slice().reverse().forEach(h=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${h.fecha}</td><td>${h.producto}</td><td>${h.accion}</td><td>${h.detalle}</td>`;
        tbody.appendChild(tr);
    });
}

/* ------------------------------
   Catalogo (tarjetas)
   ------------------------------ */
function renderCatalog(){
    const grid = document.getElementById("catalogoGrid");
    grid.innerHTML = "";
    productos.forEach((p,i)=>{
        const card = document.createElement("div");
        card.className = "tarjeta-producto";
        card.innerHTML = `
            ${p.imagen ? `<img src="${p.imagen}">` : `<div style="height:140px;background:#f0f0f0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#aaa">Sin imagen</div>`}
            <h3>${p.nombre}</h3>
            <p>${p.cientifico || ""}</p>
            <p><strong>Precio:</strong> ${formatMoney(p.precio)} <strong style="float:right">${p.stock||0}u</strong></p>
            <div style="display:flex;gap:8px;margin-top:6px">
                <button onclick="viewProduct(${i})">Ver</button>
                <button onclick="registrarVentaDirecta(${i})">Vender 1</button>
            </div>`;
        grid.appendChild(card);
    });
}

/* ------------------------------
   Cuidados / Recordatorios
   - lógica simple: si el campo riego contiene "N días" se interpreta.
   - cada planta guarda nextRiego / nextFert en ISO string si se marca realizado.
   ------------------------------ */
function renderRecordatorios(){
    const container = document.getElementById("recordatoriosList");
    container.innerHTML = "";
    const hoy = new Date();
    productos.forEach((p,i)=>{
        // intentar parsear frecuencia: buscar un número en p.cuidado_riego
        const freqRiego = parseInt((p.cuidado_riego||"").match(/\d+/)?.[0] || "0");
        const freqFert = parseInt((p.cuidado_fert||"").match(/\d+/)?.[0] || "0");
        let nextR = p.nextRiego ? new Date(p.nextRiego) : (freqRiego>0 ? addDays(hoy, -freqRiego) : null);
        let nextF = p.nextFert ? new Date(p.nextFert) : (freqFert>0 ? addDays(hoy, -freqFert) : null);

        const card = document.createElement("div");
        card.className = "tarjeta-producto";
        card.innerHTML = `
            <h3>${p.nombre}</h3>
            <p><strong>Riego freq:</strong> ${p.cuidado_riego || "—" } ${ nextR ? `<br><small>Siguiente riego: ${formatDate(nextR)}</small>` : ""}</p>
            <p><strong>Fertilización freq:</strong> ${p.cuidado_fert || "—"} ${ nextF ? `<br><small>Siguiente: ${formatDate(nextF)}</small>` : ""}</p>
            <div style="display:flex;gap:8px;margin-top:8px">
                ${freqRiego>0 ? `<button onclick="marcarRiego(${i})">Marcar riego realizado</button>` : ""}
                ${freqFert>0 ? `<button onclick="marcarFert(${i})">Marcar fertilización realizada</button>` : ""}
            </div>
        `;
        container.appendChild(card);
    });
}
window.marcarRiego = function(i){
    const p = productos[i];
    const freq = parseInt((p.cuidado_riego||"").match(/\d+/)?.[0] || "0");
    if(!freq){ alert("No hay frecuencia válida definida para riego"); return; }
    const next = addDays(new Date(), freq);
    p.nextRiego = next.toISOString();
    historial.push({fecha:new Date().toLocaleString(), producto:p.nombre, accion:"Riego realizado", detalle:`Próx: ${formatDate(next)}`});
    saveAll();
    renderRecordatorios();
};
window.marcarFert = function(i){
    const p = productos[i];
    const freq = parseInt((p.cuidado_fert||"").match(/\d+/)?.[0] || "0");
    if(!freq){ alert("No hay frecuencia válida definida para fertilización"); return; }
    const next = addDays(new Date(), freq);
    p.nextFert = next.toISOString();
    historial.push({fecha:new Date().toLocaleString(), producto:p.nombre, accion:"Fertilización realizada", detalle:`Próx: ${formatDate(next)}`});
    saveAll();
    renderRecordatorios();
};

/* ------------------------------
   Export: CSV (Excel) y PDF
   ------------------------------ */
document.getElementById("btnExportExcel").onclick = function(){
    let csv = "SKU,Nombre,Cientifico,Tipo,Categoria,Tamaño,Stock,Costo,Precio,Proveedor\n";
    productos.forEach(p=>{
        csv += `"${p.sku}","${p.nombre}","${p.cientifico||''}","${p.tipo||''}","${p.categoria||''}","${p.tamano||''}",${p.stock||0},${p.costo||0},${p.precio||0},"${p.proveedor||''}"\n`;
    });
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "inventario_plantas.csv";
    document.body.appendChild(link); link.click(); link.remove();
};

document.getElementById("btnExportPDF").onclick = function(){
    const win = window.open("","_blank","width=900,height=700");
    win.document.write("<h2>Inventario de Plantas</h2>");
    win.document.write("<table border='1' cellpadding='6' cellspacing='0' style='border-collapse:collapse;width:100%'><thead><tr><th>SKU</th><th>Nombre</th><th>Tipo</th><th>Stock</th><th>Precio</th></tr></thead><tbody>");
    productos.forEach(p=>{
        win.document.write(`<tr><td>${p.sku}</td><td>${p.nombre}</td><td>${p.tipo||''}</td><td>${p.stock||0}</td><td>${formatMoney(p.precio)}</td></tr>`);
    });
    win.document.write("</tbody></table>");
    win.document.close();
    win.print();
};

/* ------------------------------
   Helpers
   ------------------------------ */
function formatMoney(v){ return "$"+(Number(v||0)).toFixed(2); }
function addDays(d, days){ const r=new Date(d); r.setDate(r.getDate()+days); return r; }
function formatDate(d){ if(!d) return ""; const dt = new Date(d); return dt.toLocaleDateString()+" "+dt.toLocaleTimeString(); }

/* ------------------------------
   Inicialización UI y render
   ------------------------------ */
function initUI(){
    // mostrar gestión por defecto
    showSection("gestion");
    renderProductosTable();
    renderStockTable();
    renderBusqueda();
    renderReportes();
    renderMovimientos();
    renderVentasTable();
    renderHistorial();
}
initUI();
