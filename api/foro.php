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
    if (isset($_GET['tema_id'])) {
        $tema_id = intval($_GET['tema_id']);
        
        try {
            $conn = getConnection();
            
            // Obtener tema
            $stmt = $conn->prepare("SELECT t.*, u.nombre, u.apellido, u.rol 
                                   FROM temas_foro t 
                                   JOIN usuarios u ON t.autor_id = u.id 
                                   WHERE t.id = ? AND t.activo = TRUE");
            $stmt->bind_param("i", $tema_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $tema = $result->fetch_assoc();
            
            if (!$tema) {
                echo json_encode(['error' => 'Tema no encontrado']);
                exit();
            }
            
            $stmt = $conn->prepare("SELECT r.*, u.nombre, u.apellido, u.rol 
                                   FROM respuestas_foro r 
                                   JOIN usuarios u ON r.autor_id = u.id 
                                   WHERE r.tema_id = ? 
                                   ORDER BY r.fecha_creacion ASC");
            $stmt->bind_param("i", $tema_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $respuestas = [];
            while ($row = $result->fetch_assoc()) {
                $respuestas[] = $row;
            }
            
            echo json_encode([
                'tema' => $tema,
                'respuestas' => $respuestas
            ]);
            
            $stmt->close();
            $conn->close();
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al cargar tema: ' . $e->getMessage()]);
        }
    } else {
        // Listar todos los temas
        try {
            $conn = getConnection();
            
            $sql = "SELECT t.*, u.nombre, u.apellido, u.rol,
                    (SELECT COUNT(*) FROM respuestas_foro WHERE tema_id = t.id) as num_respuestas
                    FROM temas_foro t 
                    JOIN usuarios u ON t.autor_id = u.id 
                    WHERE t.activo = TRUE
                    ORDER BY t.fecha_creacion DESC";
            
            $result = $conn->query($sql);
            $temas = [];
            
            while ($row = $result->fetch_assoc()) {
                $temas[] = $row;
            }
            
            echo json_encode($temas);
            $conn->close();
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al cargar temas: ' . $e->getMessage()]);
        }
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Debes iniciar sesión']);
        exit();
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $action = isset($data['action']) ? $data['action'] : 'tema';
    
    if ($action === 'respuesta') {
        // Crear respuesta
        if (!isset($data['tema_id']) || !isset($data['contenido'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Tema ID y contenido son requeridos']);
            exit();
        }
        
        $tema_id = intval($data['tema_id']);
        $contenido = trim($data['contenido']);
        $autor_id = $_SESSION['usuario_id'];
        
        try {
            $conn = getConnection();
            
            $stmt = $conn->prepare("INSERT INTO respuestas_foro (tema_id, autor_id, contenido) VALUES (?, ?, ?)");
            $stmt->bind_param("iis", $tema_id, $autor_id, $contenido);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al crear respuesta: ' . $stmt->error]);
            }
            
            $stmt->close();
            $conn->close();
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
        }
    } else {
        // Crear tema
        if (!isset($data['titulo']) || !isset($data['descripcion'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Título y descripción son requeridos']);
            exit();
        }
        
        $titulo = trim($data['titulo']);
        $descripcion = trim($data['descripcion']);
        $fecha_limite = isset($data['fecha_limite']) && !empty($data['fecha_limite']) ? $data['fecha_limite'] : null;
        $autor_id = $_SESSION['usuario_id'];
        
        try {
            $conn = getConnection();
            
            $stmt = $conn->prepare("INSERT INTO temas_foro (titulo, descripcion, autor_id, fecha_limite) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssis", $titulo, $descripcion, $autor_id, $fecha_limite);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al crear tema: ' . $stmt->error]);
            }
            
            $stmt->close();
            $conn->close();
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
        }
    }
}
?>


