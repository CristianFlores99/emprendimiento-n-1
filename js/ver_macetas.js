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
// Abrir modal para agregar
btnAgregarMaceta?.addEventListener("click", abrirModal)

function abrirModal() {
  formAgregarMaceta.style.display = 'flex'
  tabla.style.display = 'table'
  searchInput.parentElement.style.display = 'block'
  agregarMacetaForm.reset()
  agregarMacetaForm.onsubmit = agregarNuevaMaceta
}

// Cancelar modal
btnCancelarAgregar?.addEventListener("click", cerrarModal)

function cerrarModal() {
  formAgregarMaceta.style.display = 'none'
  agregarMacetaForm.reset()
  tabla.style.display = 'table'
  searchInput.parentElement.style.display = 'block'
  agregarMacetaForm.onsubmit = agregarNuevaMaceta
}

// ------------------- GUARDAR MACETA -------------------
async function agregarNuevaMaceta(e) {
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
}

// ------------------- BOTONES -------------------
btnVerInventario?.addEventListener("click", () => {
  zonaPrincipal.style.display = "block"
  cargarMacetas()
})

btnRecargar?.addEventListener('click', cargarMacetas)

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
          id_maceta,
          numero,
          descripcion,
          modelo,
          altura_cm,
          ancho_cm,
          largo_cm,
          precio_venta
        )
      `)

    if (error) throw error

    macetasData = data
    mostrarTabla(macetasData)
  } catch (err) {
    console.error('Error al cargar macetas:', err)
    tabla.innerHTML = `<tr><td colspan="8" style="color:red;">Error al cargar datos.</td></tr>`
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
      <th>Acciones</th>
    </tr>
  `

  if (!data || data.length === 0) {
    html += `<tr><td colspan="8">No hay registros.</td></tr>`
  } else {
    for (const item of data) {
      html += `
        <tr data-id="${item.id_maceta_color}">
          <td>${item.maceta?.numero ?? '-'}</td>
          <td>${item.maceta?.descripcion ?? '-'}</td>
          <td>${item.maceta?.modelo ?? '-'}</td>
          <td>${item.color ?? '-'}</td>
          <td>${item.stock ?? 0}</td>
          <td>$${item.maceta?.precio_venta?.toFixed(2) ?? '-'}</td>
          <td>${item.estado ?? '-'}</td>
          <td>
            <button class="btnEditar" data-id="${item.id_maceta_color}">✏️ Editar</button>
          </td>
        </tr>
      `
    }
  }

  tabla.innerHTML = html

  // Asignar eventos a los botones editar
  const botonesEditar = document.querySelectorAll('.btnEditar')
  botonesEditar.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id
      abrirEditarMaceta(id)
    })
  })
}

// ------------------- EDITAR MACETA -------------------
function abrirEditarMaceta(id) {
  const maceta = macetasData.find(m => m.id_maceta_color == id)
  if (!maceta) return

  formAgregarMaceta.style.display = 'flex'
  tabla.style.display = 'none'
  searchInput.parentElement.style.display = 'none'

  document.getElementById("descripcion").value = maceta.maceta?.descripcion ?? ''
  document.getElementById("numero").value = maceta.maceta?.numero ?? ''
  document.getElementById("modelo").value = maceta.maceta?.modelo ?? ''
  document.getElementById("altura").value = maceta.maceta?.altura_cm ?? ''
  document.getElementById("ancho").value = maceta.maceta?.ancho_cm ?? ''
  document.getElementById("largo").value = maceta.maceta?.largo_cm ?? ''
  document.getElementById("precio_venta").value = maceta.maceta?.precio_venta ?? ''

  agregarMacetaForm.onsubmit = async (e) => {
    e.preventDefault()
    await actualizarMaceta(maceta.maceta.id_maceta)
  }
}

async function actualizarMaceta(id) {
  const datosActualizados = {
    descripcion: document.getElementById("descripcion").value.trim(),
    numero: parseInt(document.getElementById("numero").value),
    modelo: document.getElementById("modelo").value.trim(),
    altura_cm: parseFloat(document.getElementById("altura").value),
    ancho_cm: parseFloat(document.getElementById("ancho").value),
    largo_cm: parseFloat(document.getElementById("largo").value),
    precio_venta: parseFloat(document.getElementById("precio_venta").value)
  }

  try {
    const { error } = await supabase
      .from("maceta")
      .update(datosActualizados)
      .eq("id_maceta", id)

    if (error) throw error

    mostrarMensaje("Maceta actualizada correctamente ✅", "success")
    cerrarModal()
    cargarMacetas()
  } catch (err) {
    console.error("Error al actualizar maceta:", err)
    mostrarMensaje("Error al actualizar la maceta ❌", "error")
  }
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
//////////////////////////
// 📦 Referencias DOM Color
const btnAgregarColor = document.getElementById("btnAgregarColor")
const formAgregarColor = document.getElementById("formAgregarColor")
const agregarColorForm = document.getElementById("agregarColorForm")
const btnCancelarAgregarColor = document.getElementById("btnCancelarAgregarColor")
const selectMaceta = document.getElementById("selectMaceta")

// 🔹 Abrir modal Agregar Color
btnAgregarColor?.addEventListener("click", async () => {
  formAgregarColor.style.display = "flex"
  formAgregarMaceta.style.display = "none"
  tabla.style.display = "none"
  searchInput.parentElement.style.display = "none"

  // Cargar macetas en el select
  selectMaceta.innerHTML = '<option value="">Seleccioná una maceta</option>'
  try {
    const { data: macetas, error } = await supabase
      .from("maceta")
      .select("id_maceta, descripcion, numero, modelo")

    if (error) throw error

    macetas.forEach(m => {
      const option = document.createElement("option")
      option.value = m.id_maceta
      option.textContent = `${m.descripcion} (#${m.numero}) - ${m.modelo}`
      selectMaceta.appendChild(option)
    })
  } catch (err) {
    console.error("Error al cargar macetas para el select:", err)
    mostrarMensaje("Error al cargar macetas.", "error")
  }
})

// 🔹 Cerrar modal Agregar Color
btnCancelarAgregarColor?.addEventListener("click", () => {
  formAgregarColor.style.display = "none"
  agregarColorForm.reset()
  tabla.style.display = "table"
  searchInput.parentElement.style.display = "block"
})

// 🔹 Guardar nuevo color
agregarColorForm?.addEventListener("submit", async (e) => {
  e.preventDefault()

  const id_maceta = parseInt(selectMaceta.value)
  const color = document.getElementById("color").value.trim()
  const stock = parseInt(document.getElementById("stock").value)

  if (!id_maceta || !color) {
    mostrarMensaje("Seleccioná una maceta e ingresá un color.", "error")
    return
  }

  try {
    const { data, error } = await supabase
      .from("maceta_color")
      .insert([{ id_maceta, color, stock, estado: "activo" }])

    if (error) throw error

    mostrarMensaje("Color agregado correctamente ✅", "success")
    agregarColorForm.reset()
    formAgregarColor.style.display = "none"

    // Mostrar tabla otra vez
    tabla.style.display = "table"
    searchInput.parentElement.style.display = "block"

    cargarMacetas()
  } catch (err) {
    console.error("Error al agregar color:", err)
    mostrarMensaje("Error al agregar el color ❌", "error")
  }
})
