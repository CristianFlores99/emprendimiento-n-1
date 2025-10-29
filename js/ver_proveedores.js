import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

const tabla = document.querySelector("#tablaProveedores tbody");
const modal = document.getElementById("modalProveedor");
const form = document.getElementById("formProveedor");
const buscador = document.getElementById("buscadorProveedores");
const btnVolver = document.getElementById("btnVolver");
const btnAgregar = document.getElementById("btnAgregarProveedor");

let listaProveedores = [];

function normalizar(str){
  if(!str) return '';
  return str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}

async function cargarProveedores(){
  const { data, error } = await supabase.from("proveedor").select("*").order("nombre");
  if(error){ console.error(error); return; }
  listaProveedores = data || [];
  renderTabla(listaProveedores);
}

function renderTabla(datos){
  tabla.innerHTML = "";
  datos.forEach(p=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nombre}</td>
      <td>${p.email || ""}</td>
      <td>${p.telefono || ""}</td>
      <td>${p.direccion || ""}</td>
      <td>${p.estado}</td>
      <td>
        <button class="btn-editar" data-id="${p.id_proveedor}">✏️ Editar</button>
        <button class="btn-eliminar" data-id="${p.id_proveedor}">🗑️ Eliminar</button>
      </td>
    `;
    tabla.appendChild(tr);
  });
  document.querySelectorAll(".btn-editar").forEach(btn=>btn.addEventListener("click", ()=> editarProveedor(btn.dataset.id)));
  document.querySelectorAll(".btn-eliminar").forEach(btn=>btn.addEventListener("click", ()=> eliminarProveedor(btn.dataset.id)));
}

function abrirModal(){
  form.reset();
  modal.querySelector("h2").textContent = "Agregar Proveedor";
  modal.classList.remove("oculto");
}
function cerrarModal(){ modal.classList.add("oculto"); }

document.querySelector(".cerrar").addEventListener("click", cerrarModal);
btnAgregar.addEventListener("click", abrirModal);
btnVolver.addEventListener("click", ()=> window.location.href="index.html");

function editarProveedor(id){
  const prov = listaProveedores.find(p=>p.id_proveedor==id);
  if(!prov) return;
  form.id_proveedor.value = prov.id_proveedor;
  form.nombre.value = prov.nombre;
  form.email.value = prov.email;
  form.telefono.value = prov.telefono;
  form.direccion.value = prov.direccion;
  form.estado.value = prov.estado;
  modal.querySelector("h2").textContent = "Editar Proveedor";
  modal.classList.remove("oculto");
}

form.addEventListener("submit", async e=>{
  e.preventDefault();
  const obj = {
    nombre: form.nombre.value,
    email: form.email.value,
    telefono: form.telefono.value,
    direccion: form.direccion.value,
    estado: form.estado.value
  };
  if(form.id_proveedor.value){
    await supabase.from("proveedor").update(obj).eq("id_proveedor", form.id_proveedor.value);
  } else {
    await supabase.from("proveedor").insert([obj]);
  }
  cerrarModal();
  cargarProveedores();
});

async function eliminarProveedor(id){
  if(confirm("¿Seguro que deseas eliminar este proveedor?")){
    await supabase.from("proveedor").delete().eq("id_proveedor", id);
    cargarProveedores();
  }
}

buscador.addEventListener("input", ()=>{
  const query = normalizar(buscador.value.trim());
  const filtrados = listaProveedores.filter(p=>{
    return normalizar(p.nombre).includes(query) ||
           normalizar(p.email).includes(query) ||
           normalizar(p.telefono).includes(query) ||
           normalizar(p.direccion).includes(query) ||
           normalizar(p.estado).includes(query);
  });
  renderTabla(filtrados);
});

cargarProveedores();
