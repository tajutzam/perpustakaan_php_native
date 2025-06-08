<?php
require_once '../../config/db.php';
require_once '../../models/Borrowing.php';

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

if (!$input || !isset($input['member_id']) || !isset($input['book_id'])) {
    jsonResponse(['success' => false, 'message' => 'Data tidak lengkap']);
}

$data = [
    'member_id' => (int) $input['member_id'],
    'book_id' => (int) $input['book_id'],
    'officer_id' => $_SESSION['user_id'],
    'borrow_date' => date('Y-m-d'),
    'due_date' => date('Y-m-d', strtotime('+14 days')) // 2 weeks loan period
];

$borrowing = new Borrowing();
$result = $borrowing->create($data);

jsonResponse($result);
?>