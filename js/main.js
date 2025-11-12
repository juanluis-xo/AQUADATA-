// Verificar autenticación
function checkAuth() {
  const loginButton = document.getElementById("loginButton")
  const userMenu = document.getElementById("userMenu")
  const userName = document.getElementById("userName")
  const userButton = document.getElementById("userButton")

  if (loginButton && !loginButton.textContent.trim()) {
    loginButton.textContent = "Login"
  }

  if (!loginButton) return

  const cachedUser = localStorage.getItem("aquadata_user")
  if (cachedUser) {
    try {
      const userData = JSON.parse(cachedUser)

      loginButton.style.display = "none"
      if (userMenu) {
        userMenu.style.display = "block"
        userMenu.classList.add("loaded")
        if (userName) userName.textContent = userData.nombre

        if (userButton) {
          userButton.onclick = (e) => {
            e.stopPropagation()
            const userDropdown = document.getElementById("userDropdown")
            if (userDropdown) {
              userDropdown.classList.toggle("active")
            }
          }
        }
      }
    } catch (e) {
      console.error("[v0] Error parsing cached user:", e)
      localStorage.removeItem("aquadata_user")
      loginButton.textContent = "Login"
      loginButton.style.display = "block"
    }
  } else {
    loginButton.textContent = "Login"
    loginButton.style.display = "block"
    loginButton.classList.add("loaded")
  }

  fetch("api/check-auth.php")
    .then((response) => response.json())
    .then((data) => {
      if (data.authenticated) {
        localStorage.setItem("aquadata_user", JSON.stringify(data.usuario))

        loginButton.style.display = "none"
        if (userMenu) {
          userMenu.style.display = "block"
          userMenu.classList.add("loaded")
          if (userName) userName.textContent = data.usuario.nombre

          if (userButton) {
            userButton.onclick = (e) => {
              e.stopPropagation()
              const userDropdown = document.getElementById("userDropdown")
              if (userDropdown) {
                userDropdown.classList.toggle("active")
              }
            }
          }
        }
      } else {
        localStorage.removeItem("aquadata_user")

        loginButton.textContent = "Login"
        loginButton.style.display = "block"
        loginButton.classList.add("loaded")
        if (userMenu) userMenu.style.display = "none"
      }
    })
    .catch((error) => {
      console.error("[v0] Error verificando autenticación:", error)
      if (!cachedUser) {
        loginButton.textContent = "Login"
        loginButton.style.display = "block"
        loginButton.classList.add("loaded")
        if (userMenu) userMenu.style.display = "none"
      }
    })

  document.addEventListener("click", (event) => {
    const userDropdown = document.getElementById("userDropdown")

    if (userDropdown && userMenu && !userMenu.contains(event.target)) {
      userDropdown.classList.remove("active")
    }
  })
}

// Cerrar sesión
function handleLogout() {
  localStorage.removeItem("aquadata_user")

  fetch("api/logout.php")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = "index.html"
      }
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error)
      window.location.href = "index.html"
    })
}

// Chat con IA
function openChat() {
  const modal = document.getElementById("chatModal")
  modal.classList.add("active")
}

function closeChat() {
  const modal = document.getElementById("chatModal")
  modal.classList.remove("active")
}

function sendMessage() {
  const input = document.getElementById("chatInput")
  const message = input.value.trim()

  if (!message) return

  const messagesContainer = document.getElementById("chatMessages")

  // Agregar mensaje del usuario
  const userMessage = document.createElement("div")
  userMessage.className = "chat-message user-message"
  userMessage.innerHTML = `<p>${message}</p>`
  messagesContainer.appendChild(userMessage)

  input.value = ""

  // Simular respuesta de IA
  setTimeout(() => {
    const botMessage = document.createElement("div")
    botMessage.className = "chat-message bot-message"
    botMessage.innerHTML = `<p>${generateAIResponse(message)}</p>`
    messagesContainer.appendChild(botMessage)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }, 1000)

  messagesContainer.scrollTop = messagesContainer.scrollHeight
}

function handleChatKeyPress(event) {
  if (event.key === "Enter") {
    sendMessage()
  }
}

function generateAIResponse(message) {
  const lowerMessage = message.toLowerCase()

  const responses = {
    agua: "El agua es un recurso vital para la vida. El ODS 6 busca garantizar su disponibilidad y gestión sostenible para todos. Actualmente, 2.200 millones de personas carecen de acceso a agua potable segura.",
    saneamiento:
      "El saneamiento adecuado es fundamental para la salud pública y la dignidad humana. 4.200 millones de personas carecen de servicios de saneamiento gestionados de forma segura.",
    ods: "El Objetivo de Desarrollo Sostenible 6 se centra en garantizar la disponibilidad de agua y saneamiento para todos. Incluye metas sobre acceso universal, calidad del agua, uso eficiente y protección de ecosistemas.",
    contaminacion:
      "El 80% de las aguas residuales se vierten sin tratamiento. Reducir la contaminación del agua es crucial para proteger ecosistemas y la salud humana.",
    conservar:
      "Puedes conservar agua cerrando grifos, reparando fugas, usando electrodomésticos eficientes y recolectando agua de lluvia. Cada acción cuenta.",
    crisis:
      "La crisis mundial del agua afecta a miles de millones. El cambio climático, la contaminación y el uso insostenible agravan el problema. Todos debemos actuar.",
    default:
      "Gracias por tu pregunta sobre el ODS 6. Puedo ayudarte con información sobre agua limpia, saneamiento, conservación y la crisis mundial del agua. ¿Qué te gustaría saber?",
  }

  for (const key in responses) {
    if (lowerMessage.includes(key)) {
      return responses[key]
    }
  }

  return responses.default
}

// Funciones para cerrar modales
function closeNewTopicModal() {
  const modal = document.getElementById("newTopicModal")
  modal.classList.remove("active")
}

function closeTemaModal() {
  const modal = document.getElementById("temaModal")
  modal.classList.remove("active")
}

function closeNewNoticiaModal() {
  const modal = document.getElementById("newNoticiaModal")
  modal.classList.remove("active")
}

function initHamburgerMenu() {
  const hamburger = document.getElementById("hamburger")
  const navMenu = document.getElementById("navMenu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active")
      navMenu.classList.toggle("active")
    })

    // Cerrar menú al hacer clic en un enlace
    const navLinks = navMenu.querySelectorAll("a")
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active")
        navMenu.classList.remove("active")
      })
    })

    // Cerrar menú al hacer clic fuera
    document.addEventListener("click", (e) => {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove("active")
        navMenu.classList.remove("active")
      }
    })
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  initHamburgerMenu() // Inicializar menú hamburguesa
})

// Cerrar modal al hacer clic fuera
window.onclick = (event) => {
  const chatModal = document.getElementById("chatModal")
  const newTopicModal = document.getElementById("newTopicModal")
  const temaModal = document.getElementById("temaModal")
  const newNoticiaModal = document.getElementById("newNoticiaModal")

  if (event.target === chatModal) {
    closeChat()
  }

  if (event.target === newTopicModal) {
    closeNewTopicModal()
  }

  if (event.target === temaModal) {
    closeTemaModal()
  }

  if (event.target === newNoticiaModal) {
    closeNewNoticiaModal()
  }
}








