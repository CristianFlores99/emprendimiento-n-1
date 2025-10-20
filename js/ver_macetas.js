import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ovfsffckhzelgbgohakv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZnNmZmNraHplbGdiZ29oYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTA0MjYsImV4cCI6MjA3NjIyNjQyNn0.hDiIhAHAr04Uo9todWdk0QUaqD3RYj5kMkITavzPiHc';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {

  // ---------------- Secciones ----------------
  const sectionMacetas = document.getElementById("sectionMacetas");
  const sectionInventario = document.getElementById("sectionInventario");

  // ---------------- Botones ----------------
  const btnVerMacetas = document.getElementById("btnVerMacetas");
  const btnVerInventario = document.getElementById("btnVerInventario");
  document.getElementById("btnVolver").addEventListener("click", () => window.location.href = "index.html");

  btnVerMacetas.addEventListener("click", () => {
    sectionMacetas.classList.remove("oculto");
    sectionInventario.classList.add("oculto");
    btnVerMacetas.classList.add("active");
    btnVerInventario.classList.remove("active");
  });

  btnVerInventario.addEventListener("click", () => {
    sectionMacetas.classList.add("oculto");
    sectionInventario.classList.remove("oculto");
    btnVerInventario.classList.add("active");
    btnVerMacetas.classList.remove("active");
  });

  // ---------------- Modales ----------------
  const modalMaceta = document.getElementById("modalMaceta");
  const modalColor = document.getElementById("modalColor");
  const formMaceta = document.getElementById("formMaceta");
  const formColor = document.getElementById("formColor");

  document.getElementById("btnAgregarMaceta").addEventListener("click", () => abrirModal(modalMaceta, "Agregar Maceta", formMaceta));
  document.getElementById("btnAgregarColor").addEventListener("click", () => abrirModal(modalColor, "Agregar Color", formColor));

  function abrirModal(modal, titulo, form){
    if(titulo.includes("Agregar")){
      const hidden = form.querySelector("input[type=hidden]");
      if(hidden) hidden.value = "";
    }
    modal.querySelector("h2").textContent = titulo;
    modal.classList.remove("oculto");
  }

  document.querySelectorAll(".cerrar").forEach(span => 
    span.addEventListener("click", () => span.closest(".modal").classList.add("oculto"))
  );

  // ---------------- Tablas ----------------
  const tablaMacetas = document.querySelector("#tablaMacetas tbody");
  const tablaInventario = document.querySelector("#tablaInventario tbody");

  let listaMacetas = [];
  let listaColores = [];

  function normalizar(str){
    if(!str) return '';
    return str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  }

  // ---------------- Cargar Macetas ----------------
  async function cargarMacetas() {
    const { data, error } = await supabase.from("maceta").select("*").order("numero");
    if(error){ console.error(error); return; }
    listaMacetas = data || [];
    renderTablaMacetas(listaMacetas);
    renderSelectMacetas();
  }

  function renderTablaMacetas(datos){
    tablaMacetas.innerHTML = "";
    datos.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.numero}</td>
        <td>${m.descripcion}</td>
        <td>${m.modelo}</td>
        <td>${m.altura_cm}</td>
        <td>${m.ancho_cm}</td>
        <td>${m.largo_cm}</td>
        <td>$${m.precio_venta}</td>
        <td>
          <button class="btn-editar" data-id="${m.id_maceta}">✏️ Editar</button>
          <button class="btn-eliminar" data-id="${m.id_maceta}">🗑️ Eliminar</button>
        </td>
      `;
      tablaMacetas.appendChild(tr);
    });

    document.querySelectorAll("#tablaMacetas .btn-editar").forEach(btn => btn.addEventListener("click", () => editarMacetaLocal(btn.dataset.id)));
    document.querySelectorAll("#tablaMacetas .btn-eliminar").forEach(btn => btn.addEventListener("click", () => eliminarMaceta(btn.dataset.id)));
  }

  // ---------------- Cargar Inventario ----------------
  async function cargarColores() {
    const { data, error } = await supabase.from("maceta_color")
      .select("*, maceta(numero, descripcion, modelo, precio_venta)")
      .order("id_maceta");
    if(error){ console.error(error); return; }
    listaColores = data || [];
    renderTablaColores(listaColores);
  }

  function renderTablaColores(datos){
    tablaInventario.innerHTML = "";
    datos.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.maceta.numero}</td>
        <td>${c.maceta.descripcion}</td>
        <td>${c.maceta.modelo}</td>
        <td>${c.color}</td>
        <td>${c.stock}</td>
        <td>$${c.maceta.precio_venta}</td>
        <td>${c.estado}</td>
        <td>
          <button class="btn-editar" data-id="${c.id_maceta_color}">✏️ Editar</button>
          <button class="btn-eliminar" data-id="${c.id_maceta_color}">🗑️ Eliminar</button>
        </td>
      `;
      tablaInventario.appendChild(tr);
    });

    document.querySelectorAll("#tablaInventario .btn-editar").forEach(btn => btn.addEventListener("click", () => editarColorLocal(btn.dataset.id)));
    document.querySelectorAll("#tablaInventario .btn-eliminar").forEach(btn => btn.addEventListener("click", () => eliminarColor(btn.dataset.id)));
  }

  // ---------------- Select Macetas ----------------
  function renderSelectMacetas(){
    const select = document.getElementById("selectMaceta");
    select.innerHTML = "";
    listaMacetas.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id_maceta;
      opt.textContent = `${m.numero} - ${m.descripcion}`;
      select.appendChild(opt);
    });
  }

  // ---------------- Editar ----------------
  function editarMacetaLocal(id){
    const maceta = listaMacetas.find(m => m.id_maceta == id);
    if(!maceta) return;

    const f = formMaceta;
    f.id_maceta.value = maceta.id_maceta;
    f.numero.value = maceta.numero;
    f.descripcion.value = maceta.descripcion;
    f.modelo.value = maceta.modelo;
    f.altura_cm.value = maceta.altura_cm;
    f.ancho_cm.value = maceta.ancho_cm;
    f.largo_cm.value = maceta.largo_cm;
    f.precio_venta.value = maceta.precio_venta;

    abrirModal(modalMaceta, "Editar Maceta", f);
  }

  function editarColorLocal(id){
    const color = listaColores.find(c => c.id_maceta_color == id);
    if(!color) return;

    const f = formColor;
    f.id_maceta_color.value = color.id_maceta_color;
    f.selectMaceta.value = color.id_maceta;
    f.color.value = color.color;
    f.stock.value = color.stock;
    f.estadoColor.value = color.estado;

    abrirModal(modalColor, "Editar Color", f);
  }

  // ---------------- Eliminar ----------------
  async function eliminarMaceta(id){
    if(!confirm("¿Desea eliminar esta maceta?")) return;
    await supabase.from("maceta").delete().eq("id_maceta", id);
    cargarMacetas();
  }

  async function eliminarColor(id){
    if(!confirm("¿Desea eliminar este color?")) return;
    await supabase.from("maceta_color").delete().eq("id_maceta_color", id);
    cargarColores();
  }

  // ---------------- Guardar ----------------
  formMaceta.addEventListener("submit", async e=>{
    e.preventDefault();
    const f = formMaceta;
    const obj = {
      numero: f.numero.value,
      descripcion: f.descripcion.value,
      modelo: f.modelo.value,
      altura_cm: parseFloat(f.altura_cm.value),
      ancho_cm: parseFloat(f.ancho_cm.value),
      largo_cm: parseFloat(f.largo_cm.value),
      precio_venta: parseFloat(f.precio_venta.value)
    };
    if(f.id_maceta.value){
      await supabase.from("maceta").update(obj).eq("id_maceta", f.id_maceta.value);
    } else {
      await supabase.from("maceta").insert([obj]);
    }
    f.reset();
    modalMaceta.classList.add("oculto");
    cargarMacetas();
  });

  formColor.addEventListener("submit", async e=>{
    e.preventDefault();
    const f = formColor;
    const obj = {
      id_maceta: f.selectMaceta.value,
      color: f.color.value,
      stock: parseInt(f.stock.value),
      estado: f.estadoColor.value
    };
    if(f.id_maceta_color.value){
      await supabase.from("maceta_color").update(obj).eq("id_maceta_color", f.id_maceta_color.value);
    } else {
      await supabase.from("maceta_color").insert([obj]);
    }
    f.reset();
    modalColor.classList.add("oculto");
    cargarColores();
  });

  // ---------------- Buscadores ----------------
  document.getElementById("buscadorMacetas").addEventListener("input", ()=>{
    const query = normalizar(document.getElementById("buscadorMacetas").value.trim());
    renderTablaMacetas(listaMacetas.filter(m =>
      normalizar(m.numero).includes(query) ||
      normalizar(m.descripcion).includes(query) ||
      normalizar(m.modelo).includes(query) ||
      normalizar(m.altura_cm).includes(query) ||
      normalizar(m.ancho_cm).includes(query) ||
      normalizar(m.largo_cm).includes(query) ||
      normalizar(m.precio_venta).includes(query)
    ));
  });

  document.getElementById("buscadorInventario").addEventListener("input", ()=>{
    const query = normalizar(document.getElementById("buscadorInventario").value.trim());
    renderTablaColores(listaColores.filter(c =>
      normalizar(c.maceta.numero).includes(query) ||
      normalizar(c.maceta.descripcion).includes(query) ||
      normalizar(c.maceta.modelo).includes(query) ||
      normalizar(c.color).includes(query) ||
      normalizar(c.stock).includes(query) ||
      normalizar(c.maceta.precio_venta).includes(query) ||
      normalizar(c.estado).includes(query)
    ));
  });

  // ---------------- Inicializar ----------------
  cargarMacetas();
  cargarColores();

});

