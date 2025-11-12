<?php
session_start();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $conn = getConnection();
        
        $sql = "SELECT n.*, u.nombre, u.apellido 
                FROM noticias n 
                JOIN usuarios u ON n.autor_id = u.id 
                ORDER BY n.fecha_publicacion DESC";
        
        $result = $conn->query($sql);
        $noticias = [];
        
        while ($row = $result->fetch_assoc()) {
            $noticias[] = $row;
        }
        
        echo json_encode($noticias);
        $conn->close();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al cargar noticias: ' . $e->getMessage()]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Debes iniciar sesión']);
        exit();
    }
    
    // Verificar que el usuario sea profesor
    $conn = getConnection();
    $stmt = $conn->prepare("SELECT rol FROM usuarios WHERE id = ?");
    $stmt->bind_param("i", $_SESSION['usuario_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $usuario = $result->fetch_assoc();
    
    if (!$usuario || $usuario['rol'] !== 'profesor') {
        http_response_code(403);
        echo json_encode(['error' => 'Solo los profesores pueden publicar noticias']);
        exit();
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['titulo']) || !isset($data['contenido'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Título y contenido son requeridos']);
        exit();
    }
    
    $titulo = trim($data['titulo']);
    $contenido = trim($data['contenido']);
    $autor_id = $_SESSION['usuario_id'];
    
    try {
        $stmt = $conn->prepare("INSERT INTO noticias (titulo, contenido, autor_id) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $titulo, $contenido, $autor_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Error al publicar noticia: ' . $stmt->error]);
        }
        
        $stmt->close();
        $conn->close();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
    }
}
?>

