console.log("[v0] encuestas.js cargado correctamente")

let currentEncuestaId = null
let preguntaCounter = 0
let editPreguntaCounter = 0
const MAX_PREGUNTAS = 20
let currentUser = null

// Load surveys
async function loadEncuestas() {
  const container = document.getElementById("encuestasContainer")

  // Get current user first
  const user = await getCurrentUser()
  console.log("[v0] Current user in loadEncuestas:", user)

  fetch("api/encuestas.php", {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((encuestas) => {
      if (encuestas.length === 0) {
        container.innerHTML = '<p class="loading">No hay encuestas disponibles</p>'
        return
      }

      container.innerHTML = encuestas
        .map((encuesta) => {
          const userId = user ? Number.parseInt(user.id) : null
          const creadorId = Number.parseInt(encuesta.creador_id)
          const isCreator = userId && userId === creadorId
          const showActions = isCreator && user.rol === "profesor"

          console.log(
            "[v0] Encuesta:",
            encuesta.id,
            "Creator ID:",
            creadorId,
            "Current user ID:",
            userId,
            "Is creator:",
            isCreator,
            "User role:",
            user?.rol,
            "Show actions:",
            showActions,
          )

          return `
                <div class="encuesta-card">
                    <h3>${encuesta.titulo}</h3>
                    <p>${encuesta.descripcion || "Participa en esta encuesta sobre el ODS 6"}</p>
                    <div class="tema-meta" style="margin-bottom: 1rem;">
                        Por ${encuesta.nombre} ${encuesta.apellido}
                        <span class="rol-badge ${encuesta.rol}">${encuesta.rol === "profesor" ? "👨‍🏫 Profesor" : "👨‍🎓 Estudiante"}</span>
                    </div>
                    <div style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 1rem;">
                        📝 ${encuesta.num_preguntas || 0} preguntas
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <button class="btn-primary" onclick="openTomarEncuestaModal(${encuesta.id})" style="width: 100%;">
                            Responder Cuestionario
                        </button>
                        ${
                          showActions
                            ? `
                            <div style="display: flex; gap: 0.75rem;">
                                <button class="btn-eliminar" onclick="deleteEncuesta(${encuesta.id})">
                                    Eliminar
                                </button>
                                <button class="btn-editar" onclick="openEditEncuestaModal(${encuesta.id})">
                                    Editar
                                </button>
                            </div>
                        `
                            : ""
                        }
                    </div>
                </div>
            `
        })
        .join("")
    })
    .catch((error) => {
      container.innerHTML = '<p class="loading">Error al cargar encuestas</p>'
      console.error("Error cargando encuestas:", error)
    })
}

// Open modal to create new survey (professors only)
function openNewEncuestaModal() {
  console.log("[v0] openNewEncuestaModal llamada")

  fetch("api/check-auth.php", {
    credentials: "include",
  })
    .then((response) => {
      console.log("[v0] Respuesta de auth recibida")
      return response.json()
    })
    .then((data) => {
      console.log("[v0] Datos de auth:", data)

      if (data.authenticated) {
        if (data.usuario.rol === "profesor") {
          console.log("[v0] Usuario es profesor, abriendo modal")
          const modal = document.getElementById("newEncuestaModal")

          // Reset form and counter
          preguntaCounter = 0
          document.getElementById("preguntasContainer").innerHTML = ""
          document.getElementById("newEncuestaForm").reset()

          const errorDiv = document.getElementById("encuestaError")
          if (errorDiv) {
            errorDiv.classList.remove("active")
          }

          // Add first question by default
          addPregunta()

          modal.classList.add("active")
          console.log("[v0] Modal abierto")
        } else {
          console.log("[v0] Usuario no es profesor")
          alert("Solo los profesores pueden crear encuestas")
        }
      } else {
        console.log("[v0] Usuario no autenticado")
        alert("Debes iniciar sesión para crear encuestas")
        window.location.href = "login.html"
      }
    })
    .catch((error) => {
      console.error("[v0] Error verificando autenticación:", error)
      alert("Debes iniciar sesión para crear encuestas")
      window.location.href = "login.html"
    })
}

function closeNewEncuestaModal() {
  const modal = document.getElementById("newEncuestaModal")
  modal.classList.remove("active")
  document.getElementById("newEncuestaForm").reset()
  document.getElementById("preguntasContainer").innerHTML = ""
  preguntaCounter = 0
  const errorDiv = document.getElementById("encuestaError")
  if (errorDiv) {
    errorDiv.classList.remove("active")
  }
}

function addPregunta() {
  const currentPreguntas = document.querySelectorAll(".pregunta-item").length

  if (currentPreguntas >= MAX_PREGUNTAS) {
    alert(`Solo puedes agregar hasta ${MAX_PREGUNTAS} preguntas`)
    return
  }

  preguntaCounter++
  const container = document.getElementById("preguntasContainer")

  const preguntaDiv = document.createElement("div")
  preguntaDiv.className = "pregunta-item"
  preguntaDiv.id = `pregunta-${preguntaCounter}`
  preguntaDiv.style.cssText = "background: var(--gray-light); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;"

  preguntaDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h5 style="color: var(--dark-blue); margin: 0;">Pregunta ${preguntaCounter}</h5>
            <button type="button" class="btn-secondary" onclick="removePregunta(${preguntaCounter})" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Eliminar</button>
        </div>
        <div class="form-group">
            <label>Pregunta</label>
            <input type="text" class="pregunta-texto" required>
        </div>
        <div class="form-group">
            <label>Opción A</label>
            <input type="text" class="opcion-a" required>
        </div>
        <div class="form-group">
            <label>Opción B</label>
            <input type="text" class="opcion-b" required>
        </div>
        <div class="form-group">
            <label>Opción C</label>
            <input type="text" class="opcion-c" required>
        </div>
        <div class="form-group">
            <label>Opción D</label>
            <input type="text" class="opcion-d" required>
        </div>
        <div class="form-group">
            <label>Respuesta Correcta</label>
            <select class="respuesta-correcta" required>
                <option value="">Selecciona la respuesta correcta</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
            </select>
        </div>
    `

  container.appendChild(preguntaDiv)
  updateAddQuestionButton()
}

function updateAddQuestionButton() {
  const currentPreguntas = document.querySelectorAll(".pregunta-item").length
  const remaining = MAX_PREGUNTAS - currentPreguntas
  const addButton = document.querySelector('button[onclick="addPregunta()"]')
  if (addButton) {
    if (remaining > 0) {
      addButton.textContent = `+ Agregar Pregunta (${remaining} restantes)`
      addButton.disabled = false
      addButton.style.opacity = "1"
    } else {
      addButton.textContent = "Máximo de preguntas alcanzado"
      addButton.disabled = true
      addButton.style.opacity = "0.5"
    }
  }
}

function removePregunta(id) {
  const preguntaDiv = document.getElementById(`pregunta-${id}`)
  if (preguntaDiv) {
    preguntaDiv.remove()
    updateAddQuestionButton()
  }
}

function handleNewEncuesta(event) {
  event.preventDefault()

  const titulo = document.getElementById("tituloEncuesta").value.trim()
  const descripcion = document.getElementById("descripcionEncuesta").value.trim()
  const errorDiv = document.getElementById("encuestaError")

  // Collect all questions
  const preguntasItems = document.querySelectorAll(".pregunta-item")
  const preguntas = []

  preguntasItems.forEach((item) => {
    const pregunta = {
      pregunta: item.querySelector(".pregunta-texto").value.trim(),
      opcion_a: item.querySelector(".opcion-a").value.trim(),
      opcion_b: item.querySelector(".opcion-b").value.trim(),
      opcion_c: item.querySelector(".opcion-c").value.trim(),
      opcion_d: item.querySelector(".opcion-d").value.trim(),
      respuesta_correcta: item.querySelector(".respuesta-correcta").value,
    }

    if (
      pregunta.pregunta &&
      pregunta.opcion_a &&
      pregunta.opcion_b &&
      pregunta.opcion_c &&
      pregunta.opcion_d &&
      pregunta.respuesta_correcta
    ) {
      preguntas.push(pregunta)
    }
  })

  if (preguntas.length === 0) {
    errorDiv.textContent = "Debes agregar al menos una pregunta completa"
    errorDiv.classList.add("active")
    return
  }

  const payload = {
    action: "crear",
    titulo,
    descripcion,
    preguntas,
  }

  fetch("api/encuestas.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        closeNewEncuestaModal()
        loadEncuestas()
        alert("Cuestionario creado exitosamente")
      } else {
        errorDiv.textContent = data.error || "Error al crear encuesta"
        errorDiv.classList.add("active")
      }
    })
    .catch((error) => {
      console.error("Error creando encuesta:", error)
      errorDiv.textContent = "Error de conexión. Verifica tu sesión."
      errorDiv.classList.add("active")
    })
}

function openTomarEncuestaModal(encuestaId) {
  currentEncuestaId = encuestaId

  fetch(`api/encuestas.php?encuesta_id=${encuestaId}`, {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error)
        return
      }

      const encuesta = data.encuesta
      document.getElementById("encuestaModalTitle").textContent = encuesta.titulo

      document.getElementById("encuestaModalContent").innerHTML = `
                <div class="tema-meta" style="margin-bottom: 1rem;">
                    Por ${encuesta.nombre} ${encuesta.apellido}
                    <span class="rol-badge ${encuesta.rol}">${encuesta.rol === "profesor" ? "👨‍🏫 Profesor" : "👨‍🎓 Estudiante"}</span>
                </div>
                ${encuesta.descripcion ? `<p style="color: var(--text-dark); margin-bottom: 1.5rem;">${encuesta.descripcion}</p>` : ""}
                <div style="background: var(--light-blue); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <strong>📝 Total de preguntas:</strong> ${data.preguntas.length}
                </div>
            `

      // Display questions
      const preguntasContainer = document.getElementById("preguntasEncuestaContainer")
      preguntasContainer.innerHTML = data.preguntas
        .map(
          (pregunta, index) => `
                <div style="background: var(--gray-light); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <h4 style="color: var(--dark-blue); margin-bottom: 1rem;">${index + 1}. ${pregunta.pregunta}</h4>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <label style="display: flex; align-items: center; cursor: pointer; padding: 0.75rem; background: var(--white); border-radius: 6px; border: 2px solid var(--gray-border); transition: all 0.2s;">
                            <input type="radio" name="pregunta_${pregunta.id}" value="A" required style="margin-right: 0.75rem;">
                            <span>A) ${pregunta.opcion_a}</span>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer; padding: 0.75rem; background: var(--white); border-radius: 6px; border: 2px solid var(--gray-border); transition: all 0.2s;">
                            <input type="radio" name="pregunta_${pregunta.id}" value="B" required style="margin-right: 0.75rem;">
                            <span>B) ${pregunta.opcion_b}</span>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer; padding: 0.75rem; background: var(--white); border-radius: 6px; border: 2px solid var(--gray-border); transition: all 0.2s;">
                            <input type="radio" name="pregunta_${pregunta.id}" value="C" required style="margin-right: 0.75rem;">
                            <span>C) ${pregunta.opcion_c}</span>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer; padding: 0.75rem; background: var(--white); border-radius: 6px; border: 2px solid var(--gray-border); transition: all 0.2s;">
                            <input type="radio" name="pregunta_${pregunta.id}" value="D" required style="margin-right: 0.75rem;">
                            <span>D) ${pregunta.opcion_d}</span>
                        </label>
                    </div>
                </div>
            `,
        )
        .join("")

      const modal = document.getElementById("tomarEncuestaModal")
      modal.classList.add("active")
    })
    .catch((error) => {
      console.error("Error cargando encuesta:", error)
      alert("Error al cargar la encuesta")
    })
}

function closeTomarEncuestaModal() {
  const modal = document.getElementById("tomarEncuestaModal")
  modal.classList.remove("active")
  currentEncuestaId = null
  document.getElementById("responderEncuestaForm").reset()
  document.getElementById("respuestaEncuestaError").classList.remove("active")
}

function handleResponderEncuesta(event) {
  event.preventDefault()

  const errorDiv = document.getElementById("respuestaEncuestaError")
  const formData = new FormData(event.target)
  const respuestas = {}

  // Collect all answers
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("pregunta_")) {
      const preguntaId = key.replace("pregunta_", "")
      respuestas[preguntaId] = value
    }
  }

  fetch("api/encuestas.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      action: "responder",
      encuesta_id: currentEncuestaId,
      respuestas: respuestas,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        closeTomarEncuestaModal()
        showResultado(data)
      } else {
        errorDiv.textContent = data.error || "Error al enviar respuestas"
        errorDiv.classList.add("active")
      }
    })
    .catch((error) => {
      console.error("Error enviando respuestas:", error)
      errorDiv.textContent = "Error de conexión. Verifica tu sesión."
      errorDiv.classList.add("active")
    })
}

function showResultado(data) {
  const modal = document.getElementById("resultadoEncuestaModal")
  const content = document.getElementById("resultadoContent")

  const calificacion = data.calificacion
  const obtieneCertificado = calificacion >= 90
  let emoji = "🎉"
  let mensaje = "¡Excelente trabajo!"
  let color = "var(--primary-green)"

  if (calificacion < 60) {
    emoji = "📚"
    mensaje = "Sigue estudiando"
    color = "#e74c3c"
  } else if (calificacion < 80) {
    emoji = "👍"
    mensaje = "¡Buen trabajo!"
    color = "#f39c12"
  } else if (calificacion < 90) {
    emoji = "🌟"
    mensaje = "¡Muy bien!"
    color = "#3498db"
  }

  let certificadoHTML = ""
  if (obtieneCertificado && data.usuario) {
    certificadoHTML = `
            <div style="margin-top: 2rem; padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
                <h3 style="color: white; margin-bottom: 1rem;">🏆 ¡Felicitaciones!</h3>
                <p style="margin-bottom: 1rem;">Has obtenido más del 90% de respuestas correctas.</p>
                <button class="btn-primary" onclick="descargarCertificado(${data.encuesta_id}, '${data.usuario.nombre}', '${data.usuario.email}', ${calificacion})" 
                    style="background: white; color: var(--primary-blue); width: 100%;">
                    📜 Descargar Certificado
                </button>
            </div>
        `
  }

  content.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 1rem;">${emoji}</div>
        <h2 style="color: ${color}; margin-bottom: 1rem;">${mensaje}</h2>
        <div style="font-size: 3rem; font-weight: bold; color: var(--dark-blue); margin-bottom: 1rem;">
            ${calificacion.toFixed(1)}%
        </div>
        <p style="color: var(--text-dark); font-size: 1.2rem;">
            Respondiste correctamente ${data.correctas} de ${data.total} preguntas
        </p>
        ${certificadoHTML}
    `

  modal.classList.add("active")
}

function descargarCertificado(encuestaId, nombre, email, calificacion) {
  // Create certificate HTML
  const certificadoHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado - AquaData</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Georgia', serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 2rem;
        }
        .certificate {
            background: white;
            width: 100%;
            max-width: 800px;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            border: 10px solid #f8f9fa;
            position: relative;
        }
        .certificate::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 3px solid #667eea;
            border-radius: 10px;
            pointer-events: none;
        }
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .logo {
            font-size: 3rem;
            color: #0088CC;
            margin-bottom: 0.5rem;
        }
        .title {
            font-size: 2.5rem;
            color: #1a3a52;
            margin-bottom: 0.5rem;
            font-weight: bold;
        }
        .subtitle {
            font-size: 1.2rem;
            color: #7f8c8d;
            font-style: italic;
        }
        .content {
            text-align: center;
            margin: 3rem 0;
        }
        .certify-text {
            font-size: 1.1rem;
            color: #2c3e50;
            margin-bottom: 2rem;
        }
        .recipient-name {
            font-size: 2.5rem;
            color: #667eea;
            font-weight: bold;
            margin: 2rem 0;
            padding: 1rem;
            border-bottom: 3px solid #667eea;
            display: inline-block;
        }
        .achievement {
            font-size: 1.2rem;
            color: #2c3e50;
            margin: 2rem 0;
            line-height: 1.8;
        }
        .score {
            font-size: 3rem;
            color: #2ecc71;
            font-weight: bold;
            margin: 1rem 0;
        }
        .footer {
            margin-top: 3rem;
            display: flex;
            justify-content: space-around;
            align-items: center;
        }
        .signature {
            text-align: center;
        }
        .signature-line {
            width: 200px;
            border-top: 2px solid #2c3e50;
            margin: 0 auto 0.5rem;
        }
        .signature-text {
            font-size: 0.9rem;
            color: #7f8c8d;
        }
        .date {
            text-align: center;
            margin-top: 2rem;
            color: #7f8c8d;
            font-size: 0.9rem;
        }
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 6rem;
            color: rgba(102, 126, 234, 0.05);
            font-weight: bold;
            pointer-events: none;
            z-index: 0;
        }
        @media print {
            body { background: white; }
            .certificate { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="watermark">AQUADATA</div>
        <div class="header">
            <div class="logo">💧</div>
            <h1 class="title">AquaData</h1>
            <p class="subtitle">Certificado de Excelencia</p>
        </div>
        
        <div class="content">
            <p class="certify-text">Se certifica que</p>
            
            <div class="recipient-name">${nombre}</div>
            
            <p class="achievement">
                Ha completado exitosamente el cuestionario sobre<br>
                <strong>ODS 6: Agua Limpia y Saneamiento</strong><br>
                demostrando un excelente conocimiento del tema
            </p>
            
            <div class="score">${calificacion.toFixed(1)}%</div>
            <p style="color: #7f8c8d; font-size: 1rem;">Calificación Obtenida</p>
        </div>
        
        <div class="footer">
            <div class="signature">
                <div class="signature-line"></div>
                <p class="signature-text">Coordinador AquaData</p>
            </div>
            <div class="signature">
                <div class="signature-line"></div>
                <p class="signature-text">Director Académico</p>
            </div>
        </div>
        
        <div class="date">
            Emitido el ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}<br>
            Email: ${email}
        </div>
    </div>
</body>
</html>
    `

  // Create a blob and download
  const blob = new Blob([certificadoHTML], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `Certificado_AquaData_${nombre.replace(/\s+/g, "_")}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  alert("Certificado descargado. Abre el archivo HTML en tu navegador para verlo o imprimirlo.")
}

function closeResultadoModal() {
  const modal = document.getElementById("resultadoEncuestaModal")
  modal.classList.remove("active")
}

// Open modal to edit survey
function openEditEncuestaModal(encuestaId) {
  fetch(`api/encuestas.php?encuesta_id=${encuestaId}`, {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error)
        return
      }

      const encuesta = data.encuesta
      const preguntas = data.preguntas

      // Populate form
      document.getElementById("editEncuestaId").value = encuesta.id
      document.getElementById("editTituloEncuesta").value = encuesta.titulo
      document.getElementById("editDescripcionEncuesta").value = encuesta.descripcion || ""

      // Reset and populate questions
      editPreguntaCounter = 0
      const container = document.getElementById("editPreguntasContainer")
      container.innerHTML = ""

      preguntas.forEach((pregunta) => {
        addEditPregunta(pregunta)
      })

      const modal = document.getElementById("editEncuestaModal")
      modal.classList.add("active")
    })
    .catch((error) => {
      console.error("Error cargando encuesta:", error)
      alert("Error al cargar la encuesta")
    })
}

function closeEditEncuestaModal() {
  const modal = document.getElementById("editEncuestaModal")
  modal.classList.remove("active")
  document.getElementById("editEncuestaForm").reset()
  document.getElementById("editPreguntasContainer").innerHTML = ""
  editPreguntaCounter = 0
  const errorDiv = document.getElementById("editEncuestaError")
  if (errorDiv) {
    errorDiv.classList.remove("active")
  }
}

function addEditPregunta(preguntaData = null) {
  const currentPreguntas = document.querySelectorAll("#editPreguntasContainer .pregunta-item").length

  if (currentPreguntas >= MAX_PREGUNTAS) {
    alert(`Solo puedes agregar hasta ${MAX_PREGUNTAS} preguntas`)
    return
  }

  editPreguntaCounter++
  const container = document.getElementById("editPreguntasContainer")

  const preguntaDiv = document.createElement("div")
  preguntaDiv.className = "pregunta-item"
  preguntaDiv.id = `edit-pregunta-${editPreguntaCounter}`
  preguntaDiv.style.cssText = "background: var(--gray-light); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;"

  // Store original question ID if editing
  const preguntaId = preguntaData ? preguntaData.id : ""

  preguntaDiv.innerHTML = `
        <input type="hidden" class="pregunta-id" value="${preguntaId}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h5 style="color: var(--dark-blue); margin: 0;">Pregunta ${editPreguntaCounter}</h5>
            <button type="button" class="btn-secondary" onclick="removeEditPregunta(${editPreguntaCounter})" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Eliminar</button>
        </div>
        <div class="form-group">
            <label>Pregunta</label>
            <input type="text" class="pregunta-texto" required value="${preguntaData ? preguntaData.pregunta : ""}">
        </div>
        <div class="form-group">
            <label>Opción A</label>
            <input type="text" class="opcion-a" required value="${preguntaData ? preguntaData.opcion_a : ""}">
        </div>
        <div class="form-group">
            <label>Opción B</label>
            <input type="text" class="opcion-b" required value="${preguntaData ? preguntaData.opcion_b : ""}">
        </div>
        <div class="form-group">
            <label>Opción C</label>
            <input type="text" class="opcion-c" required value="${preguntaData ? preguntaData.opcion_c : ""}">
        </div>
        <div class="form-group">
            <label>Opción D</label>
            <input type="text" class="opcion-d" required value="${preguntaData ? preguntaData.opcion_d : ""}">
        </div>
        <div class="form-group">
            <label>Respuesta Correcta</label>
            <select class="respuesta-correcta" required>
                <option value="">Selecciona la respuesta correcta</option>
                <option value="A" ${preguntaData && preguntaData.respuesta_correcta === "A" ? "selected" : ""}>A</option>
                <option value="B" ${preguntaData && preguntaData.respuesta_correcta === "B" ? "selected" : ""}>B</option>
                <option value="C" ${preguntaData && preguntaData.respuesta_correcta === "C" ? "selected" : ""}>C</option>
                <option value="D" ${preguntaData && preguntaData.respuesta_correcta === "D" ? "selected" : ""}>D</option>
            </select>
        </div>
    `

  container.appendChild(preguntaDiv)
  updateEditAddQuestionButton()
}

function updateEditAddQuestionButton() {
  const currentPreguntas = document.querySelectorAll("#editPreguntasContainer .pregunta-item").length
  const remaining = MAX_PREGUNTAS - currentPreguntas
  const addButton = document.querySelector('button[onclick="addEditPregunta()"]')
  if (addButton) {
    if (remaining > 0) {
      addButton.textContent = `+ Agregar Pregunta (${remaining} restantes)`
      addButton.disabled = false
      addButton.style.opacity = "1"
    } else {
      addButton.textContent = "Máximo de preguntas alcanzado"
      addButton.disabled = true
      addButton.style.opacity = "0.5"
    }
  }
}

function removeEditPregunta(id) {
  const preguntaDiv = document.getElementById(`edit-pregunta-${id}`)
  if (preguntaDiv) {
    preguntaDiv.remove()
    updateEditAddQuestionButton()
  }
}

function handleEditEncuesta(event) {
  event.preventDefault()

  const encuestaId = document.getElementById("editEncuestaId").value
  const titulo = document.getElementById("editTituloEncuesta").value.trim()
  const descripcion = document.getElementById("editDescripcionEncuesta").value.trim()
  const errorDiv = document.getElementById("editEncuestaError")

  // Collect all questions
  const preguntasItems = document.querySelectorAll("#editPreguntasContainer .pregunta-item")
  const preguntas = []

  preguntasItems.forEach((item) => {
    const pregunta = {
      id: item.querySelector(".pregunta-id").value || null,
      pregunta: item.querySelector(".pregunta-texto").value.trim(),
      opcion_a: item.querySelector(".opcion-a").value.trim(),
      opcion_b: item.querySelector(".opcion-b").value.trim(),
      opcion_c: item.querySelector(".opcion-c").value.trim(),
      opcion_d: item.querySelector(".opcion-d").value.trim(),
      respuesta_correcta: item.querySelector(".respuesta-correcta").value,
    }

    if (
      pregunta.pregunta &&
      pregunta.opcion_a &&
      pregunta.opcion_b &&
      pregunta.opcion_c &&
      pregunta.opcion_d &&
      pregunta.respuesta_correcta
    ) {
      preguntas.push(pregunta)
    }
  })

  if (preguntas.length === 0) {
    errorDiv.textContent = "Debes agregar al menos una pregunta completa"
    errorDiv.classList.add("active")
    return
  }

  const payload = {
    action: "editar",
    encuesta_id: encuestaId,
    titulo,
    descripcion,
    preguntas,
  }

  fetch("api/encuestas.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        closeEditEncuestaModal()
        loadEncuestas()
        alert("Cuestionario actualizado exitosamente")
      } else {
        errorDiv.textContent = data.error || "Error al actualizar encuesta"
        errorDiv.classList.add("active")
      }
    })
    .catch((error) => {
      console.error("Error actualizando encuesta:", error)
      errorDiv.textContent = "Error de conexión. Verifica tu sesión."
      errorDiv.classList.add("active")
    })
}

// Delete survey
function deleteEncuesta(encuestaId) {
  if (!confirm("¿Estás seguro de que deseas eliminar esta encuesta? Esta acción no se puede deshacer.")) {
    return
  }

  fetch("api/encuestas.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      action: "eliminar",
      encuesta_id: encuestaId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        loadEncuestas()
        alert("Encuesta eliminada exitosamente")
      } else {
        alert(data.error || "Error al eliminar encuesta")
      }
    })
    .catch((error) => {
      console.error("Error eliminando encuesta:", error)
      alert("Error de conexión. Verifica tu sesión.")
    })
}

// Get current user
async function getCurrentUser() {
  try {
    const response = await fetch("api/check-auth.php", {
      credentials: "include",
    })
    const data = await response.json()
    if (data.authenticated) {
      currentUser = data.usuario
      return data.usuario
    }
    return null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] DOM cargado, iniciando loadEncuestas")
  loadEncuestas()
})
