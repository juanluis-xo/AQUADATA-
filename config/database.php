<?php
// Configuración de la base de datos para InfinityFree
define('DB_HOST', 'sql211.infinityfree.com');
define('DB_USER', 'if0_40352533');
define('DB_PASS', '5nXKsKIJepQel'); // IMPORTANTE: Reemplaza esto con tu contraseña de vPanel
define('DB_NAME', 'if0_40352533_usuarios'); // Base de datos principal con TODAS las tablas

// Crear conexión
function getConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        error_log("Error de conexión MySQL: " . $conn->connect_error);
        http_response_code(500);
        die(json_encode([
            'error' => 'Error de conexión a la base de datos',
            'details' => 'Verifica que la contraseña esté configurada en config/database.php'
        ]));
    }
    
    $conn->set_charset("utf8mb4");
    return $conn;
}

// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    return isset($_SESSION['usuario_id']);
}

// Función para obtener el usuario actual
function getCurrentUser() {
    if (!isAuthenticated()) {
        return null;
    }
    
    $conn = getConnection();
    $usuario_id = $_SESSION['usuario_id'];
    
    $stmt = $conn->prepare("SELECT id, nombre, apellido, email, rol FROM usuarios WHERE id = ?");
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $usuario = $result->fetch_assoc();
    
    $stmt->close();
    $conn->close();
    
    return $usuario;
}

// Función para requerir autenticación
function requireAuth() {
    if (!isAuthenticated()) {
        header('Location: /login.php');
        exit();
    }
}
?>
