const GRAPHQL_URL = "https://app.nhost.io/orgs/krgieivyovrdgxrqlzwx/projects/wnbnfdxurjqmpyrwlrsb/database/browser/default"
const TOKEN = "TU_TOKEN_PUBLICO"

async function cargarInventario() {
  const query = `
    query {
      producto {
        id_producto
        tipo
        stock
        fecha_creacion
        precio
      }
    }
  `

  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TOKEN}`
    },
    body: JSON.stringify({ query })
  })

  const data = await res.json()
  const productos = data.data.producto

  const tbody = document.querySelector("#tabla-inventario tbody")
  tbody.innerHTML = productos.map(p => `
    <tr>
      <td>${p.id_producto}</td>
      <td>${p.tipo}</td>
      <td>${p.stock}</td>
      <td>${new Date(p.fecha_creacion).toLocaleDateString()}</td>
      <td>$${p.precio}</td>
    </tr>
  `).join("")
}

cargarInventario()
