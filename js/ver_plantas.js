import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 🔗 Conexión Supabase
const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

// 🌿 Referencias
const tabla = document.querySelector("#tablaPlantas tbody");
const modal = document.getElementById("modalForm");
const cerrarModal = document.querySelector(".cerrar");
const btnAgregar = document.getElementById("btnAgregar");
const form = document.getElementById("formPlanta");
const modalTitulo = document.getElementById("modalTitulo");

let editando = false; // estado del formulario

// --- Abrir Modal ---
btnAgregar.addEventListener("click", () => {
  form.reset();
  form.id_planta.value = "";
  editando = false;
  modalTitulo.textContent = "Agregar Planta";
  modal.classList.remove("oculto");
});

// --- Cerrar Modal ---
cerrarModal.addEventListener("click", () => modal.classList.add("oculto"));

// 🌿 Guardamos temporalmente las plantas en memoria
let listaPlantas = [];

// Reemplazamos la función cargarPlantas
async function cargarPlantas() {
  const { data, error } = await supabase.from("plantas").select("*").order("nombre_comercial", { ascending: true });
  if (error) {
    console.error("Error al cargar:", error);
    return;
  }
  listaPlantas = data;
  renderTabla(listaPlantas);
}

// --- Render Tabla ---
function renderTabla(plantas) {
  tabla.innerHTML = "";
  plantas.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nombre_comercial}</td>
      <td>${p.tipo}</td>
      <td>${p.tamaño}</td>
      <td>${p.variedad}</td>
      <td>$${p.precio_costo}</td>
      <td>$${p.precio_venta}</td>
      <td>${p.stock}</td>
      <td>${p.estado}</td>
      <td>
        <button class="btn-editar" data-id="${p.id_planta}">✏️ Editar</button>
      </td>
    `;
    tabla.appendChild(tr);
  });

  // Asignar eventos editar
  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => editarPlanta(btn.dataset.id));
  });
}

// --- Editar Planta ---
async function editarPlanta(id) {
  const { data, error } = await supabase.from("plantas").select("*").eq("id_planta", id).single();
  if (error) {
    console.error("Error al obtener planta:", error);
    return;
  }

  // Cargar datos al formulario
  form.id_planta.value = data.id_planta;
  form.nombre_comercial.value = data.nombre_comercial;
  form.tipo.value = data.tipo;
  form.tamaño.value = data.tamaño;
  form.variedad.value = data.variedad;
  form.precio_costo.value = data.precio_costo;
  form.precio_venta.value = data.precio_venta;
  form.stock.value = data.stock;
  form.estado.value = data.estado;

  editando = true;
  modalTitulo.textContent = "Editar Planta";
  modal.classList.remove("oculto");
}

// --- Guardar / Actualizar Planta ---
form.addEventListener("submit", async e => {
  e.preventDefault();

  const planta = {
    nombre_comercial: form.nombre_comercial.value,
    tipo: form.tipo.value,
    tamaño: form.tamaño.value,
    variedad: form.variedad.value,
    precio_costo: parseFloat(form.precio_costo.value),
    precio_venta: parseFloat(form.precio_venta.value),
    stock: parseInt(form.stock.value),
    estado: form.estado.value
  };

  if (editando) {
    const id = form.id_planta.value;
    const { error } = await supabase.from("plantas").update(planta).eq("id_planta", id);
    if (error) {
      alert("❌ Error al actualizar planta");
      console.error(error);
    } else {
      alert("✅ Planta actualizada");
      modal.classList.add("oculto");
      cargarPlantas();
    }
  } else {
    const { error } = await supabase.from("plantas").insert([planta]);
    if (error) {
      alert("❌ Error al guardar planta");
      console.error(error);
    } else {
      alert("✅ Planta agregada");
      modal.classList.add("oculto");
      cargarPlantas();
    }
  }

  form.reset();
});

// 🔍 Filtro de búsqueda normalizado
const inputBuscar = document.getElementById("inputBuscar");

inputBuscar.addEventListener("input", e => {
  const valor = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtradas = listaPlantas.filter(p => {
    return (
      p.nombre_comercial.toLowerCase().includes(valor) ||
      p.tipo.toLowerCase().includes(valor) ||
      p.variedad.toLowerCase().includes(valor) ||
      p.estado.toLowerCase().includes(valor)
    );
  });
  renderTabla(filtradas);
});

const btnVolver = document.getElementById("btnVolver");

btnVolver.addEventListener("click", () => {
  // Si tu index.html está en la misma carpeta:
  window.location.href = "index.html";
});

// --- Inicializar ---
cargarPlantas();
