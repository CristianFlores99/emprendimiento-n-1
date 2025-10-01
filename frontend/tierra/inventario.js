// =======================
// Datos iniciales
// =======================
let productos = JSON.parse(localStorage.getItem("productos")) || [];
let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
let historial = JSON.parse(localStorage.getItem("historial")) || [];
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];

// =======================
// Referencias DOM
// =======================
const btnGestion = document.getElementById("btnGestion");
const btnControl = document.getElementById("btnControl");
const btnBusqueda = document.getElementById("btnBusqueda");
const btnReportes = document.getElementById("btnReportes");
const btnLogistica = document.getElementById("btnLogistica");
const btnHistorial = document.getElementById("btnHistorial");
const btnVentas = document.getElementById("btnVentas");
const btnExportar = document.getElementById("btnExportar");

const seccionGestion = document.getElementById("gestionProductos");
const seccionStock = document.getElementById("controlStock");
const seccionBusqueda = document.getElementById("busqueda");
const seccionReportes = document.getElementById("reportes");
const seccionLogistica = document.getElementById("logistica");
const seccionHistorial = document.getElementById("historial");
const seccionVentas = document.getElementById("ventas");
const seccionExportar = document.getElementById("exportar");

// =======================
// Guardar en localStorage
// =======================
function guardarDatos() {
    localStorage.setItem("productos", JSON.stringify(productos));
    localStorage.setItem("movimientos", JSON.stringify(movimientos));
    localStorage.setItem("historial", JSON.stringify(historial));
    localStorage.setItem("ventas", JSON.stringify(ventas));
}

// =======================
// Mostrar sección
// =======================
function mostrarSeccion(seccion) {
    const secciones = [seccionGestion, seccionStock, seccionBusqueda, seccionReportes, seccionLogistica, seccionHistorial, seccionVentas, seccionExportar];
    secciones.forEach(sec => sec.style.display = 'none');
    seccion.style.display = 'block';
}

// =======================
// Eventos de menú
// =======================
btnGestion.addEventListener("click", () => { mostrarSeccion(seccionGestion); mostrarTablaProductos(); });
btnControl.addEventListener("click", () => { mostrarSeccion(seccionStock); mostrarTablaStock(); });
btnBusqueda.addEventListener("click", () => { mostrarSeccion(seccionBusqueda); filtrarProductos(); });
btnReportes.addEventListener("click", () => { mostrarSeccion(seccionReportes); mostrarReportes(); });
btnLogistica.addEventListener("click", () => { mostrarSeccion(seccionLogistica); actualizarProductosLogistica(); mostrarTablaMovimientos(); });
btnHistorial.addEventListener("click", () => { mostrarSeccion(seccionHistorial); mostrarHistorial(); });
btnVentas.addEventListener("click", () => { mostrarSeccion(seccionVentas); actualizarProductosVentas(); mostrarTablaVentas(); });
btnExportar.addEventListener("click", () => { mostrarSeccion(seccionExportar); });

// =======================
// Gestión de productos
// =======================
const formProducto = document.getElementById("formProducto");
formProducto.addEventListener("submit", agregarProducto);

function agregarProducto(e) {
    e.preventDefault();
    const producto = {
        codigo: document.getElementById("codigo").value,
        nombre: document.getElementById("nombre").value,
        tipo: document.getElementById("tipo").value,
        peso: parseFloat(document.getElementById("peso").value),
        precio: parseFloat(document.getElementById("precio").value),
        costo: parseFloat(document.getElementById("costo").value),
        proveedor: document.getElementById("proveedor").value,
        stock: 0
    };
    productos.push(producto);
    historial.push({
        fecha: new Date().toLocaleString(),
        producto: producto.nombre,
        accion: "Producto agregado",
        detalle: `Código: ${producto.codigo}`
    });
    guardarDatos();
    formProducto.reset();
    mostrarTablaProductos();
}

// =======================
// Tabla de productos
// =======================
function mostrarTablaProductos() {
    const tbody = document.querySelector("#tablaProductos tbody");
    tbody.innerHTML = "";
    productos.forEach((p, index) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${p.codigo}</td>
            <td>${p.nombre}</td>
            <td>${p.tipo}</td>
            <td>${p.peso}</td>
            <td>${p.precio}</td>
            <td>${p.costo}</td>
            <td>${p.proveedor}</td>
            <td class="${p.stock<5?'low-stock':''}">${p.stock}</td>
            <td>
                <button onclick="editarProducto(${index})">Editar</button>
                <button onclick="eliminarProducto(${index})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function editarProducto(index) {
    const p = productos[index];
    const codigo = prompt("Código", p.codigo) || p.codigo;
    const nombre = prompt("Nombre", p.nombre) || p.nombre;
    const tipo = prompt("Tipo", p.tipo) || p.tipo;
    const peso = parseFloat(prompt("Peso", p.peso)) || p.peso;
    const precio = parseFloat(prompt("Precio", p.precio)) || p.precio;
    const costo = parseFloat(prompt("Costo", p.costo)) || p.costo;
    const proveedor = prompt("Proveedor", p.proveedor) || p.proveedor;

    productos[index] = { ...p, codigo, nombre, tipo, peso, precio, costo, proveedor };
    historial.push({
        fecha: new Date().toLocaleString(),
        producto: p.nombre,
        accion: "Producto editado",
        detalle: `Código anterior: ${p.codigo}`
    });
    guardarDatos();
    mostrarTablaProductos();
}

function eliminarProducto(index) {
    const p = productos[index];
    if(confirm("¿Deseas eliminar este producto?")) {
        productos.splice(index,1);
        historial.push({
            fecha: new Date().toLocaleString(),
            producto: p.nombre,
            accion: "Producto eliminado",
            detalle: `Código: ${p.codigo}`
        });
        guardarDatos();
        mostrarTablaProductos();
    }
}

// =======================
// Control de Stock
// =======================
function mostrarTablaStock() {
    const tbody = document.querySelector("#tablaStock tbody");
    tbody.innerHTML = "";
    productos.forEach((p, index) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${p.codigo}</td>
            <td>${p.nombre}</td>
            <td class="${p.stock<5?'low-stock':''}">${p.stock}</td>
            <td>
                <button onclick="modificarStock(${index}, 1)">+1</button>
                <button onclick="modificarStock(${index}, -1)">-1</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function modificarStock(index, cantidad) {
    const p = productos[index];
    p.stock += cantidad;
    if(p.stock < 0) p.stock = 0;
    historial.push({
        fecha: new Date().toLocaleString(),
        producto: p.nombre,
        accion: "Stock modificado",
        detalle: `Cambio: ${cantidad}`
    });
    guardarDatos();
    mostrarTablaStock();
}

// =======================
// Búsqueda y filtrado
// =======================
const busquedaInput = document.getElementById("busquedaInput");
busquedaInput.addEventListener("input", filtrarProductos);

function filtrarProductos() {
    const term = busquedaInput.value.toLowerCase();
    const divResultados = document.getElementById("resultadoBusqueda");
    divResultados.innerHTML = "";

    const resultados = productos.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.tipo.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term)
    );

    resultados.forEach(p => {
        const card = document.createElement("div");
        card.className = "tarjeta-producto";
        card.innerHTML = `
            <h3>${p.nombre}</h3>
            <p><strong>Código:</strong> ${p.codigo}</p>
            <p><strong>Tipo:</strong> ${p.tipo}</p>
            <p><strong>Stock:</strong> <span class="${p.stock<5?'low-stock':''}">${p.stock}</span></p>
            <p><strong>Precio:</strong> $${p.precio}</p>
        `;
        divResultados.appendChild(card);
    });
}

// =======================
// Reportes y análisis
// =======================
function mostrarReportes() {
    const stockTotalElem = document.getElementById("stockTotal");
    const productosMaxStockElem = document.getElementById("productosMaxStock");
    const margenProductosElem = document.getElementById("margenProductos");

    const stockTotal = productos.reduce((sum,p)=>sum+p.stock,0);
    stockTotalElem.textContent = `Stock total: ${stockTotal} bolsas`;

    const maxStock = Math.max(...productos.map(p=>p.stock));
    const topProductos = productos.filter(p=>p.stock===maxStock).map(p=>p.nombre).join(", ");
    productosMaxStockElem.textContent = `Productos con más stock: ${topProductos || "Ninguno"}`;

    margenProductosElem.innerHTML = "";
    productos.forEach(p=>{
        const li = document.createElement("li");
        const margen = p.precio - p.costo;
        li.textContent = `${p.nombre}: $${margen} por bolsa`;
        margenProductosElem.appendChild(li);
    });
}

// =======================
// Logística
// =======================
const formMovimiento = document.getElementById("formMovimiento");
formMovimiento.addEventListener("submit", registrarMovimiento);

function actualizarProductosLogistica() {
    const select = document.getElementById("productoMovimiento");
    select.innerHTML = '<option value="">Seleccionar producto</option>';
    productos.forEach((p,index)=>{
        const option = document.createElement("option");
        option.value = index;
        option.textContent = p.nombre;
        select.appendChild(option);
    });
}

function registrarMovimiento(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById("productoMovimiento").value);
    const tipo = document.getElementById("tipoMovimiento").value;
    const cantidad = parseInt(document.getElementById("cantidadMovimiento").value);

    if(isNaN(index) || isNaN(cantidad) || cantidad <= 0) return;

    const p = productos[index];
    if(tipo==="entrada") p.stock += cantidad;
    else if(tipo==="salida") p.stock -= cantidad;
    if(p.stock<0) p.stock=0;

    movimientos.push({fecha: new Date().toLocaleString(), producto: p.nombre, tipo, cantidad});
    historial.push({fecha: new Date().toLocaleString(), producto: p.nombre, accion: `Movimiento ${tipo}`, detalle: `Cantidad: ${cantidad}`});
    guardarDatos();
    mostrarTablaStock();
    mostrarTablaMovimientos();
    formMovimiento.reset();
}

function mostrarTablaMovimientos() {
    const tbody = document.querySelector("#tablaMovimientos tbody");
    tbody.innerHTML="";
    movimientos.forEach(m=>{
        const fila=document.createElement("tr");
        fila.innerHTML=`
            <td>${m.fecha}</td>
            <td>${m.producto}</td>
            <td>${m.tipo}</td>
            <td>${m.cantidad}</td>
        `;
        tbody.appendChild(fila);
    });
}

// =======================
// Historial / Auditoría
// =======================
function mostrarHistorial() {
    const tbody = document.querySelector("#tablaHistorial tbody");
    tbody.innerHTML="";
    historial.forEach(h=>{
        const fila=document.createElement("tr");
        fila.innerHTML=`
            <td>${h.fecha}</td>
            <td>${h.producto}</td>
            <td>${h.accion}</td>
            <td>${h.detalle}</td>
        `;
        tbody.appendChild(fila);
    });
}

// =======================
// Ventas / Pedidos
// =======================
const formVentas = document.getElementById("formVentas");
formVentas.addEventListener("submit", registrarVenta);

function actualizarProductosVentas() {
    const select = document.getElementById("productoVenta");
    select.innerHTML = '<option value="">Seleccionar producto</option>';
    productos.forEach((p,index)=>{
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${p.nombre} (Stock: ${p.stock})`;
        select.appendChild(option);
    });
}

function registrarVenta(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById("productoVenta").value);
    const cantidad = parseInt(document.getElementById("cantidadVenta").value);
    if(isNaN(index) || isNaN(cantidad) || cantidad<=0) return;

    const p = productos[index];
    if(cantidad>p.stock){
        alert("No hay suficiente stock");
        return;
    }

    p.stock -= cantidad;
    const venta = {fecha: new Date().toLocaleString(), producto: p.nombre, cantidad};
    ventas.push(venta);
    movimientos.push({fecha: venta.fecha, producto: p.nombre, tipo:"salida", cantidad});
    historial.push({fecha: venta.fecha, producto: p.nombre, accion:"Venta registrada", detalle:`Cantidad: ${cantidad}`});
    guardarDatos();
    mostrarTablaStock();
    mostrarTablaVentas();
    actualizarProductosVentas();
    formVentas.reset();
}

function mostrarTablaVentas() {
    const tbody = document.querySelector("#tablaVentas tbody");
    tbody.innerHTML="";
    ventas.forEach(v=>{
        const fila=document.createElement("tr");
        fila.innerHTML=`
            <td>${v.fecha}</td>
            <td>${v.producto}</td>
            <td>${v.cantidad}</td>
        `;
        tbody.appendChild(fila);
    });
}

// =======================
// Exportar Inventario
// =======================
document.getElementById("btnExportExcel").addEventListener("click", ()=>{
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Código,Nombre,Tipo,Peso,Precio,Costo,Proveedor,Stock\n";
    productos.forEach(p=>{
        csvContent += `${p.codigo},${p.nombre},${p.tipo},${p.peso},${p.precio},${p.costo},${p.proveedor},${p.stock}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href",encodedUri);
    link.setAttribute("download","inventario.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

document.getElementById("btnExportPDF").addEventListener("click", ()=>{
    const win = window.open("", "", "width=900,height=700");
    win.document.write("<h1>Inventario de Productos</h1>");
    win.document.write("<table border='1' cellspacing='0' cellpadding='5'><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Peso</th><th>Precio</th><th>Costo</th><th>Proveedor</th><th>Stock</th></tr>");
    productos.forEach(p=>{
        win.document.write(`<tr>
            <td>${p.codigo}</td>
            <td>${p.nombre}</td>
            <td>${p.tipo}</td>
            <td>${p.peso}</td>
            <td>${p.precio}</td>
            <td>${p.costo}</td>
            <td>${p.proveedor}</td>
            <td>${p.stock}</td>
        </tr>`);
    });
    win.document.write("</table>");
    win.print();
});

// =======================
// Inicialización
// =======================
mostrarTablaProductos();
mostrarTablaStock();
filtrarProductos();
mostrarReportes();
mostrarTablaMovimientos();
mostrarHistorial();
mostrarTablaVentas();
