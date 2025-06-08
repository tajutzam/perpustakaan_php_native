<?php
require_once __DIR__.'/../../config/db.php';
require_once __DIR__.'/../../models/Borrowing.php';

startSession();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
}

$borrowing = new Borrowing();

if ($_SESSION['user_type'] === 'officers') {
    // Officers can see all active borrowings
    $borrowings = $borrowing->getActiveBorrowings();
} else {
    // Members can only see their own borrowings
    $borrowings = $borrowing->getMemberBorrowings($_SESSION['user_id']);
}

jsonResponse(['success' => true, 'data' => $borrowings]);
?>