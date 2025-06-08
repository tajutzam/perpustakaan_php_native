<?php
require_once '../../config/db.php';

startSession();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

// Check if user is logged in as officer
if (!isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'officers') {
    jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
}

$search = isset($_GET['search']) ? validateInput($_GET['search']) : '';

if (empty($search)) {
    jsonResponse(['success' => false, 'message' => 'Parameter pencarian harus diisi']);
}

$database = new Database();
$conn = $database->connect();

$query = "SELECT id, member_code, name, email, deposit, is_blacklisted 
          FROM members 
          WHERE name LIKE :search OR member_code LIKE :search OR email LIKE :search
          ORDER BY name ASC";

$stmt = $conn->prepare($query);
$searchParam = "%{$search}%";
$stmt->bindParam(':search', $searchParam);
$stmt->execute();

$members = $stmt->fetchAll();

jsonResponse(['success' => true, 'data' => $members]);
?>