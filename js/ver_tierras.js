import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------- Elementos ----------------
const tablaTierras = document.querySelector("#tablaTierras tbody");
const modalTierra = document.getElementById("modalTierra");
const formTierra = document.getElementById("formTierra");
const buscador = document.getElementById("buscadorTierras");
const btnVolver = document.getElementById("btnVolver");
const btnAgregar = document.getElementById("btnAgregarTierra");

let listaTierras = [];

// ---------------- Funciones ----------------
function normalizar(str){
  if(!str) return '';
  return str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}

async function cargarTierras(){
  const { data, error } = await supabase.from("tierras").select("*").order("nombre");
  if(error){ console.error(error); return; }
  listaTierras = data || [];
  renderTabla(listaTierras);
}

function renderTabla(datos){
  tablaTierras.innerHTML = "";
  datos.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.nombre}</td>
      <td>${t.tipo}</td>
      <td>${t.contenido_dm3}</td>
      <td>${t.peso_kg}</td>
      <td>$${t.precio_venta}</td>
      <td>${t.stock}</td>
      <td>${t.estado}</td>
      <td>
        <button class="btn-editar" data-id="${t.id_tierra}">✏️ Editar</button>
        <button class="btn-eliminar" data-id="${t.id_tierra}">🗑️ Eliminar</button>
      </td>
    `;
    tablaTierras.appendChild(tr);
  });

  document.querySelectorAll(".btn-editar").forEach(btn => btn.addEventListener("click", ()=> editarTierra(btn.dataset.id)));
  document.querySelectorAll(".btn-eliminar").forEach(btn => btn.addEventListener("click", ()=> eliminarTierra(btn.dataset.id)));
}

// ---------------- Modal ----------------
function abrirModal(){
  formTierra.reset();
  modalTierra.querySelector("h2").textContent = "Agregar Tierra";
  modalTierra.classList.remove("oculto");
}
function cerrarModal(){ modalTierra.classList.add("oculto"); }

document.querySelector(".cerrar").addEventListener("click", cerrarModal);
btnAgregar.addEventListener("click", abrirModal);
btnVolver.addEventListener("click", ()=> window.location.href="index.html");

// ---------------- Agregar/Editar ----------------
async function editarTierra(id){
  const tierra = listaTierras.find(t=> t.id_tierra==id);
  if(!tierra) return;
  formTierra.id_tierra.value = tierra.id_tierra;
  formTierra.nombre.value = tierra.nombre;
  formTierra.tipo.value = tierra.tipo;
  formTierra.contenido_dm3.value = tierra.contenido_dm3;
  formTierra.peso_kg.value = tierra.peso_kg;
  formTierra.precio_venta.value = tierra.precio_venta;
  formTierra.stock.value = tierra.stock;
  formTierra.estado.value = tierra.estado;
  formTierra.descripcion.value = tierra.descripcion;
  modalTierra.querySelector("h2").textContent = "Editar Tierra";
  modalTierra.classList.remove("oculto");
}

formTierra.addEventListener("submit", async e=>{
  e.preventDefault();
  const obj = {
    nombre: formTierra.nombre.value,
    tipo: formTierra.tipo.value,
    contenido_dm3: parseFloat(formTierra.contenido_dm3.value),
    peso_kg: parseFloat(formTierra.peso_kg.value),
    precio_venta: parseFloat(formTierra.precio_venta.value),
    stock: parseInt(formTierra.stock.value),
    estado: formTierra.estado.value,
    descripcion: formTierra.descripcion.value
  };
  if(formTierra.id_tierra.value){
    await supabase.from("tierras").update(obj).eq("id_tierra", formTierra.id_tierra.value);
  } else {
    await supabase.from("tierras").insert([obj]);
  }
  cerrarModal();
  cargarTierras();
});

// ---------------- Eliminar ----------------
async function eliminarTierra(id){
  if(confirm("¿Seguro que deseas eliminar esta tierra?")){
    await supabase.from("tierras").delete().eq("id_tierra", id);
    cargarTierras();
  }
}

// ---------------- Buscador ----------------
buscador.addEventListener("input", ()=>{
  const query = normalizar(buscador.value.trim());
  const filtradas = listaTierras.filter(t=>{
    return normalizar(t.nombre).includes(query) ||
           normalizar(t.tipo).includes(query) ||
           normalizar(t.contenido_dm3).includes(query) ||
           normalizar(t.peso_kg).includes(query) ||
           normalizar(t.precio_venta).includes(query) ||
           normalizar(t.stock).includes(query) ||
           normalizar(t.estado).includes(query) ||
           normalizar(t.descripcion).includes(query);
  });
  renderTabla(filtradas);
});

// ---------------- Inicializar ----------------
cargarTierras();
