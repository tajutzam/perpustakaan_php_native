<?php
require_once '../../config/db.php';
require_once '../../models/Book.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$search = isset($_GET['search']) ? validateInput($_GET['search']) : '';
$category = isset($_GET['category']) ? validateInput($_GET['category']) : '';
$available_only = isset($_GET['available_only']) ? $_GET['available_only'] === 'true' : false;

$book = new Book();

if ($available_only) {
    $books = $book->getAvailableBooks();
} else {
    $books = $book->getAll($search, $category);
}

jsonResponse(['success' => true, 'data' => $books]);
?>