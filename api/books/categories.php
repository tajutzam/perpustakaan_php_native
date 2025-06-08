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

$book = new Book();
$categories = $book->getCategories();

jsonResponse(['success' => true, 'data' => $categories]);
?>