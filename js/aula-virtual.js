// Cargar noticias
function loadNoticias() {
  const container = document.getElementById("noticiasContainer")

  fetch("api/noticias.php")
    .then((response) => response.json())
    .then((noticias) => {
      if (noticias.length === 0) {
        container.innerHTML = '<p class="loading">No hay noticias disponibles</p>'
        return
      }

      container.innerHTML = noticias
        .map(
          (noticia) => `
                <div class="noticia-card">
                    <h3>${noticia.titulo}</h3>
                    <div class="noticia-meta">
                        Por ${noticia.nombre} ${noticia.apellido} • ${formatDate(noticia.fecha_publicacion)}
                    </div>
                    <p>${noticia.contenido}</p>
                </div>
            `,
        )
        .join("")
    })
    .catch((error) => {
      container.innerHTML = '<p class="loading">Error al cargar noticias</p>'
      console.error("Error cargando noticias:", error)
    })
}

function checkProfesorPermissions() {
  fetch("api/check-auth.php")
    .then((response) => response.json())
    .then((data) => {
      if (data.authenticated && data.usuario.rol === "profesor") {
        document.getElementById("btnNuevaNoticia").style.display = "block"
      }
    })
    .catch((error) => {
      console.error("Error verificando permisos:", error)
    })
}

function openNewNoticiaModal() {
  const modal = document.getElementById("newNoticiaModal")
  modal.classList.add("active")
}

function closeNewNoticiaModal() {
  const modal = document.getElementById("newNoticiaModal")
  modal.classList.remove("active")
  document.getElementById("newNoticiaForm").reset()
  const errorDiv = document.getElementById("noticiaError")
  if (errorDiv) {
    errorDiv.classList.remove("active")
  }
}

function handleNewNoticia(event) {
  event.preventDefault()

  const titulo = document.getElementById("tituloNoticia").value
  const contenido = document.getElementById("contenidoNoticia").value
  const errorDiv = document.getElementById("noticiaError")

  fetch("api/noticias.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ titulo, contenido }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        closeNewNoticiaModal()
        loadNoticias()
        alert("Noticia publicada exitosamente")
      } else {
        errorDiv.textContent = data.error || "Error al publicar noticia"
        errorDiv.classList.add("active")
      }
    })
    .catch((error) => {
      console.error("Error publicando noticia:", error)
      errorDiv.textContent = "Error de conexión. Verifica tu sesión."
      errorDiv.classList.add("active")
    })
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

document.addEventListener("DOMContentLoaded", () => {
  loadNoticias()
  checkProfesorPermissions()
})
