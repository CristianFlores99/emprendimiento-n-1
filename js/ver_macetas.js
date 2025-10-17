import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
// 🔗 Configuración de conexión a Supabase
const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

// 📦 Referencias al DOM
const tabla = document.getElementById('tablaMacetas')
const searchInput = document.getElementById('searchInput')
const btnRecargar = document.getElementById('btnRecargar')
const btnVerInventario = document.getElementById("btnVerInventario")
const btnAgregarMaceta = document.getElementById("btnAgregarMaceta")
const btnCancelarAgregar = document.getElementById("btnCancelarAgregar")
const agregarMacetaForm = document.getElementById("agregarMacetaForm")
const formAgregarMaceta = document.getElementById("formAgregarMaceta")
const zonaPrincipal = document.getElementById("zonaPrincipal")

// 🟢 Mensajes
let divMensaje = document.getElementById("mensaje")
if (!divMensaje) {
  divMensaje = document.createElement("div")
  divMensaje.id = "mensaje"
  divMensaje.style.margin = "8px 0"
  zonaPrincipal.prepend(divMensaje)
}

function mostrarMensaje(texto, tipo = "success") {
  divMensaje.textContent = texto
  divMensaje.style.color = tipo === "success" ? "#10b981" : "#ef4444"
  setTimeout(() => divMensaje.textContent = "", 4000)
}

// 🌟 Datos en memoria
let macetasData = []

// ------------------- MODAL -------------------
// Abrir modal
btnAgregarMaceta?.addEventListener("click", () => {
  formAgregarMaceta.style.display = "flex"
})

// Cerrar modal
document.getElementById("btnCancelarAgregar")?.addEventListener("click", () => {
  formAgregarMaceta.style.display = "none"
  agregarMacetaForm.reset()
})

// ------------------- BOTONES -------------------
btnVerInventario?.addEventListener("click", () => {
  zonaPrincipal.style.display = "block"
  cargarMacetas()
})

btnRecargar?.addEventListener('click', cargarMacetas)

btnAgregarMaceta?.addEventListener("click", () => {
  abrirModal()
})

// ------------------- GUARDAR MACETA -------------------
agregarMacetaForm?.addEventListener("submit", async (e) => {
  e.preventDefault()

  const nuevaMaceta = {
    descripcion: document.getElementById("descripcion").value.trim(),
    numero: parseInt(document.getElementById("numero").value),
    modelo: document.getElementById("modelo").value.trim(),
    altura_cm: parseFloat(document.getElementById("altura").value),
    ancho_cm: parseFloat(document.getElementById("ancho").value),
    largo_cm: parseFloat(document.getElementById("largo").value),
    precio_venta: parseFloat(document.getElementById("precio_venta").value)
  }

  if (!nuevaMaceta.descripcion || !nuevaMaceta.modelo || isNaN(nuevaMaceta.numero)) {
    mostrarMensaje("Completá todos los campos obligatorios.", "error")
    return
  }

  try {
    const { data, error } = await supabase
      .from("maceta")
      .insert([nuevaMaceta])

    if (error) throw error

    mostrarMensaje("Maceta agregada correctamente ✅", "success")
    cerrarModal()
    cargarMacetas()

  } catch (err) {
    console.error("Error al agregar maceta:", err)
    mostrarMensaje("Error al agregar la maceta ❌", "error")
  }
})

// ------------------- CARGAR MACETAS -------------------
async function cargarMacetas() {
  try {
    const { data, error } = await supabase
      .from('maceta_color')
      .select(`
        id_maceta_color,
        color,
        stock,
        estado,
        maceta: id_maceta (
          numero,
          descripcion,
          modelo,
          precio_venta
        )
      `)

    if (error) throw error

    macetasData = data
    mostrarTabla(macetasData)

  } catch (err) {
    console.error('Error al cargar macetas:', err)
    tabla.innerHTML = `<tr><td colspan="7" style="color:red;">Error al cargar datos.</td></tr>`
  }
}

// ------------------- MOSTRAR TABLA -------------------
function mostrarTabla(data) {
  let html = `
    <tr>
      <th>Número</th>
      <th>Descripción</th>
      <th>Modelo</th>
      <th>Color</th>
      <th>Stock</th>
      <th>Precio Venta</th>
      <th>Estado</th>
    </tr>
  `

  if (!data || data.length === 0) {
    html += `<tr><td colspan="7">No hay registros.</td></tr>`
  } else {
    for (const item of data) {
      html += `
        <tr>
          <td>${item.maceta?.numero ?? '-'}</td>
          <td>${item.maceta?.descripcion ?? '-'}</td>
          <td>${item.maceta?.modelo ?? '-'}</td>
          <td>${item.color ?? '-'}</td>
          <td>${item.stock ?? 0}</td>
          <td>$${item.maceta?.precio_venta?.toFixed(2) ?? '-'}</td>
          <td>${item.estado ?? '-'}</td>
        </tr>
      `
    }
  }

  tabla.innerHTML = html
}

// ------------------- FILTRADO -------------------
searchInput?.addEventListener('input', (e) => {
  const searchText = e.target.value.toLowerCase()
  const filtered = macetasData.filter(item => {
    return (
      (item.maceta?.numero?.toString().toLowerCase().includes(searchText)) ||
      (item.maceta?.descripcion?.toLowerCase().includes(searchText)) ||
      (item.maceta?.modelo?.toLowerCase().includes(searchText)) ||
      (item.color?.toLowerCase().includes(searchText)) ||
      (item.stock?.toString().includes(searchText)) ||
      (item.maceta?.precio_venta?.toString().includes(searchText)) ||
      (item.estado?.toLowerCase().includes(searchText))
    )
  })
  mostrarTabla(filtered)
})

// ------------------- INICIO -------------------
cargarMacetas()
