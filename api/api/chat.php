<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$apiKey = 'sk-86c3360f12f7457587accc7a104d9ce2';
$data = json_decode(file_get_contents('php://input'), true);
$message = $data['message'] ?? '';

if (empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Mensaje vacío']);
    exit;
}

$payload = [
    'model' => 'deepseek-chat',
    'messages' => [
        [
            'role' => 'system',
            'content' => 'Eres un asistente especializado en el ODS 6 (Agua limpia y saneamiento). Proporciona información útil sobre gestión del agua, saneamiento, conservación, y datos relevantes sobre el Objetivo de Desarrollo Sostenible 6. Responde en el mismo idioma del usuario.'
        ],
        [
            'role' => 'user',
            'content' => $message
        ]
    ],
    'max_tokens' => 1000,
    'temperature' => 0.7
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.deepseek.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en la API de DeepSeek']);
    exit;
}

echo $response;
?>