<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../models/Book.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$book = new Book();
$topBooks = $book->getTopBooks(10);

jsonResponse(['success' => true, 'data' => $topBooks]);
?>