// Login
function handleLogin(event) {
  event.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const errorDiv = document.getElementById("loginError")

  fetch("api/login.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        localStorage.setItem("aquadata_user", JSON.stringify(data.usuario))
        window.location.href = "aula-virtual.html"
      } else {
        errorDiv.textContent = data.error || "Error al iniciar sesión"
        errorDiv.classList.add("active")
      }
    })
    .catch((error) => {
      console.error("[v0] Error en login:", error)
      errorDiv.textContent = "Error de conexión. Verifica que el servidor PHP esté corriendo."
      errorDiv.classList.add("active")
    })
}

// Registro
function handleRegister(event) {
  event.preventDefault()

  const nombre = document.getElementById("nombre").value
  const apellido = document.getElementById("apellido").value
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const rol = document.getElementById("rol").value
  const errorDiv = document.getElementById("registerError")

  fetch("api/register.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nombre, apellido, email, password, rol }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Redirigir a login después del registro exitoso
        alert("Registro exitoso. Por favor inicia sesión.")
        window.location.href = "login.html"
      } else {
        errorDiv.textContent = data.error || "Error al registrarse"
        errorDiv.classList.add("active")
      }
    })
    .catch((error) => {
      console.error("[v0] Error en registro:", error)
      errorDiv.textContent = "Error de conexión. Verifica que el servidor PHP esté corriendo."
      errorDiv.classList.add("active")
    })
}
