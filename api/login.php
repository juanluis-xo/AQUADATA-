<?php
session_start();

error_log("[v0] login.php - Session ID: " . session_id());

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
error_log("[v0] login.php - Data recibida: " . print_r($data, true));

if (!isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email y contraseña son requeridos']);
    exit();
}

$email = trim($data['email']);
$password = $data['password'];

try {
    $conn = getConnection();
    
    $stmt = $conn->prepare("SELECT id, nombre, apellido, email, password, rol FROM usuarios WHERE email = ? AND activo = TRUE");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    error_log("[v0] login.php - Usuarios encontrados: " . $result->num_rows);
    
    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        $stmt->close();
        $conn->close();
        exit();
    }
    
    $usuario = $result->fetch_assoc();
    
    if (password_verify($password, $usuario['password'])) {
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['nombre'] = $usuario['nombre'];
        $_SESSION['apellido'] = $usuario['apellido'];
        $_SESSION['rol'] = $usuario['rol'];
        
        error_log("[v0] login.php - Login exitoso para usuario: " . $usuario['id']);
        error_log("[v0] login.php - Session después de login: " . print_r($_SESSION, true));
        
        echo json_encode([
            'success' => true,
            'usuario' => [
                'id' => $usuario['id'],
                'nombre' => $usuario['nombre'],
                'apellido' => $usuario['apellido'],
                'email' => $usuario['email'],
                'rol' => $usuario['rol']
            ]
        ]);
    } else {
        error_log("[v0] login.php - Password incorrecto");
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
    }
    
    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    error_log("[v0] login.php - Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
}
?>
