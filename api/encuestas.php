<?php
session_start();

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['encuesta_id'])) {
        $encuesta_id = intval($_GET['encuesta_id']);
        
        try {
            $conn = getConnection();
            
            // Get quiz details
            $stmt = $conn->prepare("SELECT e.*, u.nombre, u.apellido, u.rol 
                                   FROM encuestas e 
                                   JOIN usuarios u ON e.creador_id = u.id 
                                   WHERE e.id = ? AND e.activa = TRUE");
            $stmt->bind_param("i", $encuesta_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $encuesta = $result->fetch_assoc();
            
            if (!$encuesta) {
                echo json_encode(['error' => 'Encuesta no encontrada']);
                exit();
            }
            
            // Get questions
            $stmt = $conn->prepare("SELECT * FROM preguntas_encuesta WHERE encuesta_id = ? ORDER BY orden ASC");
            $stmt->bind_param("i", $encuesta_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $preguntas = [];
            while ($row = $result->fetch_assoc()) {
                $preguntas[] = $row;
            }
            
            echo json_encode([
                'encuesta' => $encuesta,
                'preguntas' => $preguntas
            ]);
            
            $stmt->close();
            $conn->close();
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al cargar encuesta: ' . $e->getMessage()]);
        }
    } else {
        // List all active quizzes
        try {
            $conn = getConnection();
            
            $sql = "SELECT e.*, u.nombre, u.apellido, u.rol,
                    (SELECT COUNT(*) FROM respuestas_encuesta WHERE encuesta_id = e.id) as num_respuestas,
                    (SELECT COUNT(*) FROM preguntas_encuesta WHERE encuesta_id = e.id) as num_preguntas
                    FROM encuestas e 
                    JOIN usuarios u ON e.creador_id = u.id 
                    WHERE e.activa = TRUE
                    ORDER BY e.fecha_creacion DESC";
            
            $result = $conn->query($sql);
            $encuestas = [];
            
            while ($row = $result->fetch_assoc()) {
                $encuestas[] = $row;
            }
            
            echo json_encode($encuestas);
            $conn->close();
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al cargar encuestas: ' . $e->getMessage()]);
        }
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Debes iniciar sesión']);
        exit();
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $action = isset($data['action']) ? $data['action'] : 'crear';
    
    if ($action === 'responder') {
        if (!isset($data['encuesta_id']) || !isset($data['respuestas'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos']);
            exit();
        }
        
        $encuesta_id = intval($data['encuesta_id']);
        $respuestas = $data['respuestas'];
        $usuario_id = $_SESSION['usuario_id'];
        
        try {
            $conn = getConnection();
            
            // Get correct answers
            $stmt = $conn->prepare("SELECT id, respuesta_correcta FROM preguntas_encuesta WHERE encuesta_id = ?");
            $stmt->bind_param("i", $encuesta_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $preguntas_correctas = [];
            while ($row = $result->fetch_assoc()) {
                $preguntas_correctas[$row['id']] = $row['respuesta_correcta'];
            }
            
            // Calculate score
            $total_preguntas = count($preguntas_correctas);
            $respuestas_correctas = 0;
            
            foreach ($respuestas as $pregunta_id => $respuesta) {
                if (isset($preguntas_correctas[$pregunta_id]) && 
                    $preguntas_correctas[$pregunta_id] === $respuesta) {
                    $respuestas_correctas++;
                }
            }
            
            $calificacion = ($respuestas_correctas / $total_preguntas) * 100;
            
            // Save response
            $stmt = $conn->prepare("INSERT INTO respuestas_encuesta (encuesta_id, usuario_id, respuestas, calificacion) VALUES (?, ?, ?, ?)");
            $respuestas_json = json_encode($respuestas);
            $stmt->bind_param("iisd", $encuesta_id, $usuario_id, $respuestas_json, $calificacion);
            
            if ($stmt->execute()) {
                $usuario = getCurrentUser();
                
                echo json_encode([
                    'success' => true,
                    'calificacion' => round($calificacion, 2),
                    'correctas' => $respuestas_correctas,
                    'total' => $total_preguntas,
                    'encuesta_id' => $encuesta_id,
                    'usuario' => [
                        'nombre' => $usuario['nombre'] . ' ' . $usuario['apellido'],
                        'email' => $usuario['email']
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al guardar respuestas']);
            }
            
            $stmt->close();
            $conn->close();
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
        }
        
    } elseif ($action === 'editar') {
        $usuario = getCurrentUser();
        if (!$usuario || $usuario['rol'] !== 'profesor') {
            http_response_code(403);
            echo json_encode(['error' => 'Solo los profesores pueden editar encuestas']);
            exit();
        }
        
        if (!isset($data['encuesta_id']) || !isset($data['titulo']) || !isset($data['preguntas'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos']);
            exit();
        }
        
        $encuesta_id = intval($data['encuesta_id']);
        $titulo = trim($data['titulo']);
        $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : '';
        $preguntas = $data['preguntas'];
        $usuario_id = $_SESSION['usuario_id'];
        
        try {
            $conn = getConnection();
            
            // Verify ownership
            $stmt = $conn->prepare("SELECT creador_id FROM encuestas WHERE id = ?");
            $stmt->bind_param("i", $encuesta_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $encuesta = $result->fetch_assoc();
            
            if (!$encuesta || $encuesta['creador_id'] != $usuario_id) {
                http_response_code(403);
                echo json_encode(['error' => 'No tienes permiso para editar esta encuesta']);
                exit();
            }
            
            $conn->begin_transaction();
            
            // Update quiz
            $stmt = $conn->prepare("UPDATE encuestas SET titulo = ?, descripcion = ? WHERE id = ?");
            $stmt->bind_param("ssi", $titulo, $descripcion, $encuesta_id);
            
            if (!$stmt->execute()) {
                throw new Exception('Error al actualizar encuesta');
            }
            
            // Delete old questions
            $stmt = $conn->prepare("DELETE FROM preguntas_encuesta WHERE encuesta_id = ?");
            $stmt->bind_param("i", $encuesta_id);
            $stmt->execute();
            
            // Add new questions
            $stmt = $conn->prepare("INSERT INTO preguntas_encuesta (encuesta_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            
            foreach ($preguntas as $index => $pregunta) {
                $orden = $index + 1;
                $stmt->bind_param("issssssi", 
                    $encuesta_id,
                    $pregunta['pregunta'],
                    $pregunta['opcion_a'],
                    $pregunta['opcion_b'],
                    $pregunta['opcion_c'],
                    $pregunta['opcion_d'],
                    $pregunta['respuesta_correcta'],
                    $orden
                );
                
                if (!$stmt->execute()) {
                    throw new Exception('Error al actualizar pregunta');
                }
            }
            
            $conn->commit();
            echo json_encode(['success' => true]);
            
            $stmt->close();
            $conn->close();
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
        }
        
    } elseif ($action === 'eliminar') {
        $usuario = getCurrentUser();
        if (!$usuario || $usuario['rol'] !== 'profesor') {
            http_response_code(403);
            echo json_encode(['error' => 'Solo los profesores pueden eliminar encuestas']);
            exit();
        }
        
        if (!isset($data['encuesta_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de encuesta requerido']);
            exit();
        }
        
        $encuesta_id = intval($data['encuesta_id']);
        $usuario_id = $_SESSION['usuario_id'];
        
        try {
            $conn = getConnection();
            
            // Verify ownership
            $stmt = $conn->prepare("SELECT creador_id FROM encuestas WHERE id = ?");
            $stmt->bind_param("i", $encuesta_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $encuesta = $result->fetch_assoc();
            
            if (!$encuesta || $encuesta['creador_id'] != $usuario_id) {
                http_response_code(403);
                echo json_encode(['error' => 'No tienes permiso para eliminar esta encuesta']);
                exit();
            }
            
            // Soft delete by setting activa = FALSE
            $stmt = $conn->prepare("UPDATE encuestas SET activa = FALSE WHERE id = ?");
            $stmt->bind_param("i", $encuesta_id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true]);
            } else {
                throw new Exception('Error al eliminar encuesta');
            }
            
            $stmt->close();
            $conn->close();
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
        }
        
    } else {
        // Create new survey
        $usuario = getCurrentUser();
        if (!$usuario || $usuario['rol'] !== 'profesor') {
            http_response_code(403);
            echo json_encode(['error' => 'Solo los profesores pueden crear encuestas']);
            exit();
        }
        
        if (!isset($data['titulo']) || !isset($data['preguntas'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Título y preguntas son requeridos']);
            exit();
        }
        
        $titulo = trim($data['titulo']);
        $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : '';
        $preguntas = $data['preguntas'];
        $creador_id = $_SESSION['usuario_id'];
        
        if (count($preguntas) === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Debes agregar al menos una pregunta']);
            exit();
        }
        
        if (count($preguntas) > 20) {
            http_response_code(400);
            echo json_encode(['error' => 'No puedes agregar más de 20 preguntas']);
            exit();
        }
        
        try {
            $conn = getConnection();
            $conn->begin_transaction();
            
            // Create quiz
            $stmt = $conn->prepare("INSERT INTO encuestas (titulo, descripcion, creador_id) VALUES (?, ?, ?)");
            $stmt->bind_param("ssi", $titulo, $descripcion, $creador_id);
            
            if (!$stmt->execute()) {
                throw new Exception('Error al crear encuesta');
            }
            
            $encuesta_id = $stmt->insert_id;
            
            // Add questions
            $stmt = $conn->prepare("INSERT INTO preguntas_encuesta (encuesta_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            
            foreach ($preguntas as $index => $pregunta) {
                $orden = $index + 1;
                $stmt->bind_param("issssssi", 
                    $encuesta_id,
                    $pregunta['pregunta'],
                    $pregunta['opcion_a'],
                    $pregunta['opcion_b'],
                    $pregunta['opcion_c'],
                    $pregunta['opcion_d'],
                    $pregunta['respuesta_correcta'],
                    $orden
                );
                
                if (!$stmt->execute()) {
                    throw new Exception('Error al agregar pregunta');
                }
            }
            
            $conn->commit();
            echo json_encode(['success' => true, 'id' => $encuesta_id]);
            
            $stmt->close();
            $conn->close();
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
        }
    }
}
?>
