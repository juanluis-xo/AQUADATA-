<?php
session_start();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
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

if (!isset($data['nombre']) || !isset($data['apellido']) || !isset($data['email']) || !isset($data['password']) || !isset($data['rol'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Todos los campos son requeridos']);
    exit();
}

$nombre = trim($data['nombre']);
$apellido = trim($data['apellido']);
$email = trim($data['email']);
$password = password_hash($data['password'], PASSWORD_DEFAULT);
$rol = $data['rol'];

if (!in_array($rol, ['estudiante', 'profesor'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Rol inválido']);
    exit();
}

try {
    $conn = getConnection();
    
    // Verificar si el email ya existe
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'El email ya está registrado']);
        $stmt->close();
        $conn->close();
        exit();
    }
    
    $stmt->close();
    
    // Insertar nuevo usuario
    $stmt = $conn->prepare("INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $nombre, $apellido, $email, $password, $rol);
    
    if ($stmt->execute()) {
        $usuario_id = $stmt->insert_id;
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario registrado exitosamente',
            'usuario' => [
                'id' => $usuario_id,
                'nombre' => $nombre,
                'apellido' => $apellido,
                'email' => $email,
                'rol' => $rol
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al registrar usuario: ' . $stmt->error]);
    }
    
    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
}
?>


