let currentTemaId = null

// Cargar temas del foro
function loadTemas() {
  const container = document.getElementById("temasContainer")

  fetch("api/foro.php")
    .then((response) => response.json())
    .then((temas) => {
      if (temas.length === 0) {
        container.innerHTML = '<p class="loading">No hay temas disponibles. ¡Sé el primero en crear uno!</p>'
        return
      }

      container.innerHTML = temas
        .map(
          (tema) => `
                <div class="tema-card" onclick="openTemaModal(${tema.id})">
                    <div class="tema-header">
                        <div>
                            <h3>${tema.titulo}</h3>
                            <div class="tema-meta">
                                Por ${tema.nombre} ${tema.apellido} 
                                <span class="rol-badge ${tema.rol}">${tema.rol === "profesor" ? "👨‍🏫 Profesor" : "👨‍🎓 Estudiante"}</span>
                                • ${formatDate(tema.fecha_creacion)}
                            </div>
                        </div>
                        <div class="tema-stats">
                            <span>💬 ${tema.num_respuestas} respuestas</span>
                        </div>
                    </div>
                    <p>${tema.descripcion}</p>
                    ${tema.fecha_limite ? `<div class="tema-meta">📅 Fecha límite: ${formatDate(tema.fecha_limite)}</div>` : ""}
                </div>
            `,
        )
        .join("")
    })
    .catch((error) => {
      container.innerHTML = '<p class="loading">Error al cargar temas. Verifica tu conexión.</p>'
      console.error("Error cargando temas:", error)
    })
}

function openTemaModal(temaId) {
  currentTemaId = temaId
  const modal = document.getElementById("temaModal")

  // Cargar detalles del tema
  fetch(`api/foro.php?tema_id=${temaId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error)
        return
      }

      const tema = data.tema
      document.getElementById("temaModalTitle").textContent = tema.titulo
      document.getElementById("temaModalContent").innerHTML = `
        <div class="tema-meta" style="margin-bottom: 1rem;">
          Por ${tema.nombre} ${tema.apellido} 
          <span class="rol-badge ${tema.rol}">${tema.rol === "profesor" ? "👨‍🏫 Profesor" : "👨‍🎓 Estudiante"}</span>
          • ${formatDate(tema.fecha_creacion)}
        </div>
        <p style="color: var(--text-dark); line-height: 1.8;">${tema.descripcion}</p>
        ${tema.fecha_limite ? `<div class="tema-meta" style="margin-top: 1rem;">📅 Fecha límite: ${formatDate(tema.fecha_limite)}</div>` : ""}
      `

      // Cargar respuestas
      loadRespuestas(data.respuestas)

      modal.classList.add("active")
    })
    .catch((error) => {
      console.error("Error cargando tema:", error)
      alert("Error al cargar el tema")
    })
}

function loadRespuestas(respuestas) {
  const container = document.getElementById("respuestasContainer")

  if (respuestas.length === 0) {
    container.innerHTML =
      '<p style="color: var(--text-light); text-align: center; padding: 2rem;">No hay respuestas aún. ¡Sé el primero en responder!</p>'
    return
  }

  container.innerHTML = respuestas
    .map(
      (respuesta) => `
    <div style="background: var(--gray-light); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
      <div class="tema-meta" style="margin-bottom: 0.5rem;">
        ${respuesta.nombre} ${respuesta.apellido}
        <span class="rol-badge ${respuesta.rol}">${respuesta.rol === "profesor" ? "👨‍🏫 Profesor" : "👨‍🎓 Estudiante"}</span>
        • ${formatDate(respuesta.fecha_creacion)}
      </div>
      <p style="color: var(--text-dark); line-height: 1.6;">${respuesta.contenido}</p>
    </div>
  `,
    )
    .join("")
}

function closeTemaModal() {
  const modal = document.getElementById("temaModal")
  modal.classList.remove("active")
  currentTemaId = null
  document.getElementById("respuestaForm").reset()
  document.getElementById("respuestaError").classList.remove("active")
}

function handleNuevaRespuesta(event) {
  event.preventDefault()

  const contenido = document.getElementById("respuestaTexto").value.trim()
  const errorDiv = document.getElementById("respuestaError")

  if (!contenido) {
    errorDiv.textContent = "Por favor escribe una respuesta"
    errorDiv.classList.add("active")
    return
  }

  fetch("api/foro.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "respuesta",
      tema_id: currentTemaId,
      contenido: contenido,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        document.getElementById("respuestaTexto").value = ""
        errorDiv.classList.remove("active")
        // Recargar el tema para mostrar la nueva respuesta
        openTemaModal(currentTemaId)
        loadTemas() // Actualizar contador de respuestas
      } else {
        errorDiv.textContent = data.error || "Error al enviar respuesta"
        errorDiv.classList.add("active")
      }
    })
    .catch((error) => {
      console.error("Error enviando respuesta:", error)
      errorDiv.textContent = "Error de conexión. Verifica tu sesión."
      errorDiv.classList.add("active")
    })
}

function openNewTopicModal() {
  fetch("api/check-auth.php")
    .then((response) => response.json())
    .then((data) => {
      if (data.authenticated) {
        const modal = document.getElementById("newTopicModal")
        modal.classList.add("active")
      } else {
        alert("Debes iniciar sesión para crear un tema")
        window.location.href = "login.html"
      }
    })
    .catch((error) => {
      console.error("Error verificando autenticación:", error)
      alert("Debes iniciar sesión para crear un tema")
      window.location.href = "login.html"
    })
}

function closeNewTopicModal() {
  const modal = document.getElementById("newTopicModal")
  modal.classList.remove("active")
  document.getElementById("newTopicForm").reset()
  const errorDiv = document.getElementById("topicError")
  if (errorDiv) {
    errorDiv.classList.remove("active")
  }
}

function handleNewTopic(event) {
  event.preventDefault()

  const titulo = document.getElementById("tituloTema").value
  const descripcion = document.getElementById("descripcionTema").value
  const fecha_limite = document.getElementById("fechaLimite").value || null
  const errorDiv = document.getElementById("topicError")

  fetch("api/foro.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "tema",
      titulo,
      descripcion,
      fecha_limite,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        closeNewTopicModal()
        loadTemas()
        alert("Tema creado exitosamente")
      } else {
        errorDiv.textContent = data.error || "Error al crear tema"
        errorDiv.classList.add("active")
      }
    })
    .catch((error) => {
      console.error("Error creando tema:", error)
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
  loadTemas()
})
