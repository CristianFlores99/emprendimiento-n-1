let macetas = [];
let editando = false;

const tablaBody = document.querySelector("#tablaMacetas tbody");
const formContainer = document.getElementById("formContainer");
const macetaForm = document.getElementById("macetaForm");
const btnAgregar = document.getElementById("btnAgregar");
const btnInventario = document.getElementById("btnInventario");
const cancelarBtn = document.getElementById("cancelarBtn");
const formTitle = document.getElementById("formTitle");
const macetaId = document.getElementById("macetaId");
const tablaMacetas = document.getElementById("tablaMacetas");
const buscadorContainer = document.getElementById("buscadorContainer");
const buscador = document.getElementById("buscador");

// --- Cargar inventario desde JSON ---
async function cargarInventario() {
  try {
    const response = await fetch('inventario.json');
    if (!response.ok) throw new Error('No se pudo cargar inventario.json');
    macetas = await response.json();
    mostrarMacetas();
  } catch (err) {
    console.error(err);
    alert('Error al cargar inventario desde JSON');
  }
}

// --- Botón "Ver Inventario" ---
btnInventario.addEventListener("click", () => {
  formContainer.classList.add("hidden");
  tablaMacetas.classList.remove("hidden");
  buscadorContainer.classList.remove("hidden");
  mostrarMacetas();
});

// --- Botón "Agregar Maceta" ---
btnAgregar.addEventListener("click", () => {
  formContainer.classList.remove("hidden");
  tablaMacetas.classList.add("hidden");
  buscadorContainer.classList.add("hidden");
  formTitle.textContent = "Agregar Maceta";
  macetaForm.reset();
  editando = false;
});

// --- Cancelar formulario ---
cancelarBtn.addEventListener("click", () => {
  formContainer.classList.add("hidden");
  tablaMacetas.classList.remove("hidden");
  buscadorContainer.classList.remove("hidden");
});

// --- Guardar maceta en memoria (solo temporal) ---
macetaForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const nuevaMaceta = {
    id: editando ? parseInt(macetaId.value) : Date.now(),
    numero: document.getElementById("numero").value,
    marca: document.getElementById("marca").value,
    material: document.getElementById("material").value,
    modelo: document.getElementById("modelo").value,
    color: document.getElementById("color").value,
    stock: document.getElementById("stock").value,
    precio: document.getElementById("precio").value
  };

  if (editando) {
    macetas = macetas.map(m => m.id === nuevaMaceta.id ? nuevaMaceta : m);
  } else {
    macetas.push(nuevaMaceta);
  }

  mostrarMacetas();
  macetaForm.reset();
  formContainer.classList.add("hidden");
  tablaMacetas.classList.remove("hidden");
  buscadorContainer.classList.remove("hidden");
  editando = false;
});

// --- Filtrar según buscador ---
buscador.addEventListener("input", () => {
  const texto = buscador.value.toLowerCase();
  mostrarMacetas(texto);
});

// --- Mostrar inventario ---
function mostrarMacetas(filtro = "") {
  tablaBody.innerHTML = "";

  const filtradas = macetas.filter(maceta => {
    return Object.values(maceta).some(valor =>
      String(valor).toLowerCase().includes(filtro)
    );
  });

  if (filtradas.length === 0) {
    const fila = document.createElement("tr");
    fila.innerHTML = `<td colspan="8">📦 No hay macetas en el inventario</td>`;
    tablaBody.appendChild(fila);
    return;
  }

  filtradas.forEach(maceta => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${maceta.numero}</td>
      <td>${maceta.marca}</td>
      <td>${maceta.material}</td>
      <td>${maceta.modelo}</td>
      <td>${maceta.color}</td>
      <td>${maceta.stock}</td>
      <td>$${maceta.precio}</td>
      <td>
        <button class="edit">✏️ Editar</button>
        <button class="delete">🗑️ Eliminar</button>
      </td>
    `;

    // Editar
    fila.querySelector(".edit").addEventListener("click", () => {
      formContainer.classList.remove("hidden");
      tablaMacetas.classList.add("hidden");
      buscadorContainer.classList.add("hidden");
      formTitle.textContent = "Editar Maceta";
      editando = true;

      macetaId.value = maceta.id;
      document.getElementById("numero").value = maceta.numero;
      document.getElementById("marca").value = maceta.marca;
      document.getElementById("material").value = maceta.material;
      document.getElementById("modelo").value = maceta.modelo;
      document.getElementById("color").value = maceta.color;
      document.getElementById("stock").value = maceta.stock;
      document.getElementById("precio").value = maceta.precio;
    });

    // Eliminar (solo memoria)
    fila.querySelector(".delete").addEventListener("click", () => {
      if (confirm("¿Seguro que quieres eliminar esta maceta?")) {
        macetas = macetas.filter(m => m.id !== maceta.id);
        mostrarMacetas(buscador.value.toLowerCase());
      }
    });

    tablaBody.appendChild(fila);
  });
}

// --- Inicializar ---
cargarInventario();
