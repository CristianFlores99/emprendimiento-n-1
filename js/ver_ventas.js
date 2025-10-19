import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

// Elementos
const btnVolver = document.getElementById("btnVolver");
const btnAgregarVenta = document.getElementById("btnAgregarVenta");
const modal = document.getElementById("modalVenta");
const cerrar = modal.querySelector(".cerrar");
const form = document.getElementById("formVenta");
const tablaVentas = document.querySelector("#tablaVentas tbody");
const buscador = document.getElementById("buscador");

const tipo_producto = document.getElementById("tipo_producto");
const selectProducto = document.getElementById("selectProducto");
const cantidadProducto = document.getElementById("cantidadProducto");
const btnAgregarProducto = document.getElementById("btnAgregarProducto");
const tablaTemporal = document.querySelector("#tablaTemporal tbody");
const totalVentaSpan = document.getElementById("totalVenta");

let listaVentas = [];
let ventaTemporal = [];
let productosDisponibles = { planta: [], maceta: [], tierra: [] };

// ---------------- Funciones ----------------
btnVolver.addEventListener("click", ()=> window.location.href="index.html");
btnAgregarVenta.addEventListener("click", ()=>{
  form.reset();
  ventaTemporal=[];
  actualizarTablaTemporal();
  modal.classList.remove("oculto");
  modal.querySelector("h2").textContent = "Agregar Venta";
});

// Cerrar modal
cerrar.addEventListener("click", ()=> modal.classList.add("oculto"));

// ---------------- Productos ----------------
async function cargarProductos() {
  const { data: plantas } = await supabase.from("plantas").select("*");
  const { data: macetas } = await supabase.from("maceta").select("*");
  const { data: tierras } = await supabase.from("tierras").select("*");
  productosDisponibles = { planta: plantas, maceta: macetas, tierra: tierras };
  actualizarSelect();
}

function actualizarSelect() {
  const tipo = tipo_producto.value;
  selectProducto.innerHTML = "";
  productosDisponibles[tipo].forEach(p=>{
    const opt = document.createElement("option");
    opt.value = p.id_planta || p.id_maceta || p.id_tierra;
    opt.textContent = p.nombre_comercial || p.descripcion;
    opt.dataset.precio = p.precio_venta || 0;
    selectProducto.appendChild(opt);
  });
}

tipo_producto.addEventListener("change", actualizarSelect);

// ---------------- Productos Temporales ----------------
btnAgregarProducto.addEventListener("click", ()=>{
  const tipo = tipo_producto.value;
  const id_origen = parseInt(selectProducto.value);
  const nombre = selectProducto.options[selectProducto.selectedIndex].textContent;
  const precio_unitario = parseFloat(selectProducto.options[selectProducto.selectedIndex].dataset.precio);
  const cantidad = parseInt(cantidadProducto.value);
  const subtotal = precio_unitario * cantidad;

  ventaTemporal.push({ tipo_producto: tipo, id_origen, nombre, precio_unitario, cantidad, subtotal });
  actualizarTablaTemporal();
});

function actualizarTablaTemporal() {
  tablaTemporal.innerHTML="";
  let total=0;
  ventaTemporal.forEach((p,index)=>{
    total+=p.subtotal;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.tipo_producto}</td>
      <td>${p.nombre}</td>
      <td>$${p.precio_unitario}</td>
      <td>${p.cantidad}</td>
      <td>$${p.subtotal}</td>
      <td><button data-index="${index}">Eliminar</button></td>
    `;
    tablaTemporal.appendChild(tr);
  });
  totalVentaSpan.textContent = total;
  // Eventos eliminar
  tablaTemporal.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      ventaTemporal.splice(btn.dataset.index,1);
      actualizarTablaTemporal();
    });
  });
}

// ---------------- Guardar Venta ----------------
form.addEventListener("submit", async e=>{
  e.preventDefault();
  if(ventaTemporal.length===0){ alert("Agregá al menos un producto"); return; }

  const obj = {
    fecha: new Date().toISOString(),
    id_cliente: form.cliente.value,
    total: ventaTemporal.reduce((acc,p)=>acc+p.subtotal,0),
    forma_pago: form.forma_pago.value,
    observaciones: form.observaciones.value
  };

  let id_venta;
  if(form.id_venta.value){
    // Actualizar venta
    id_venta = parseInt(form.id_venta.value);
    await supabase.from("venta").update(obj).eq("id_venta", id_venta);
    // Borrar detalle anterior
    await supabase.from("venta_detalle").delete().eq("id_venta", id_venta);
  } else {
    // Insertar nueva venta
    const { data, error } = await supabase.from("venta").insert([obj]).select().single();
    if(error) return console.error(error);
    id_venta = data.id_venta;
  }

  // Insertar detalle
  const detalles = ventaTemporal.map(p=>({...p,id_venta}));
  await supabase.from("venta_detalle").insert(detalles);

  modal.classList.add("oculto");
  cargarVentas();
});

// ---------------- Cargar Ventas ----------------
async function cargarVentas() {
  const { data, error } = await supabase.from("venta").select("*, venta_detalle(*)").order("fecha",{ascending:false});
  if(error) return console.error(error);
  listaVentas = data;
  renderTabla(listaVentas);
}

function renderTabla(datos){
  tablaVentas.innerHTML="";
  datos.forEach(v=>{
    const productosTexto = v.venta_detalle.map(p=>`${p.tipo_producto}: ${p.nombre} (${p.cantidad})`).join(", ");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(v.fecha).toLocaleString()}</td>
      <td>${v.id_cliente}</td>
      <td>${productosTexto}</td>
      <td>$${v.total}</td>
      <td>${v.forma_pago}</td>
      <td>${v.observaciones || ""}</td>
      <td>
        <button class="btn-editar" data-id="${v.id_venta}">✏️ Editar</button>
        <button class="btn-eliminar" data-id="${v.id_venta}">🗑️ Eliminar</button>
      </td>
    `;
    tablaVentas.appendChild(tr);
  });

  // Eventos editar
  document.querySelectorAll(".btn-editar").forEach(btn=>{
    btn.addEventListener("click", ()=> editarVenta(parseInt(btn.dataset.id)));
  });
  // Eventos eliminar
  document.querySelectorAll(".btn-eliminar").forEach(btn=>{
    btn.addEventListener("click", ()=> eliminarVenta(parseInt(btn.dataset.id)));
  });
}

// ---------------- Editar Venta ----------------
async function editarVenta(id){
  const v = listaVentas.find(v=>v.id_venta===id);
  if(!v) return;
  form.id_venta.value = v.id_venta;
  form.cliente.value = v.id_cliente;
  form.forma_pago.value = v.forma_pago;
  form.observaciones.value = v.observaciones;
  ventaTemporal = v.venta_detalle.map(p=>({
    tipo_producto: p.tipo_producto,
    id_origen: p.id_origen,
    nombre: p.nombre,
    precio_unitario: p.precio_unitario,
    cantidad: p.cantidad,
    subtotal: p.subtotal
  }));
  actualizarTablaTemporal();
  modal.querySelector("h2").textContent = "Editar Venta";
  modal.classList.remove("oculto");
}

// ---------------- Eliminar Venta ----------------
async function eliminarVenta(id){
  if(confirm("¿Desea eliminar esta venta?")){
    await supabase.from("venta_detalle").delete().eq("id_venta", id);
    await supabase.from("venta").delete().eq("id_venta", id);
    cargarVentas();
  }
}

// ---------------- Buscador normalizado ----------------
function normalizar(str){ return str?.toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase() || ""; }
buscador.addEventListener("input", ()=>{
  const q = normalizar(buscador.value.trim());
  const filtrados = listaVentas.filter(v=>{
    return normalizar(v.id_cliente).includes(q) ||
           normalizar(v.forma_pago).includes(q) ||
           normalizar(v.observaciones).includes(q) ||
           (v.venta_detalle?.some(p=> normalizar(p.nombre).includes(q)));
  });
  renderTabla(filtrados);
});

// ---------------- Inicializar ----------------
cargarProductos();
cargarVentas();
