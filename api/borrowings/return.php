<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../models/Borrowing.php';

startSession();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

// Check if user is logged in as officer
if (!isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'officers') {
    jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['borrowing_id']) || !isset($input['condition'])) {
    jsonResponse(['success' => false, 'message' => 'Data tidak lengkap']);
}

$borrowingId = (int) $input['borrowing_id'];
$condition = in_array($input['condition'], ['good', 'damaged']) ? $input['condition'] : 'good';
$officerId = $_SESSION['user_id'];

$borrowing = new Borrowing();
$result = $borrowing->returnBook($borrowingId, $condition, $officerId);

jsonResponse($result);
?>