<?php
require_once '../../config/db.php';
require_once '../../models/User.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    jsonResponse(['success' => false, 'message' => 'Data tidak valid']);
}

$required = ['name', 'email', 'password', 'phone', 'address'];
foreach ($required as $field) {
    if (!isset($input[$field]) || empty(trim($input[$field]))) {
        jsonResponse(['success' => false, 'message' => "Field {$field} harus diisi"]);
    }
}

// Validate email
if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'message' => 'Format email tidak valid']);
}

// Validate password length
if (strlen($input['password']) < 6) {
    jsonResponse(['success' => false, 'message' => 'Password minimal 6 karakter']);
}

$data = [
    'name' => validateInput($input['name']),
    'email' => validateInput($input['email']),
    'password' => $input['password'],
    'phone' => validateInput($input['phone']),
    'address' => validateInput($input['address'])
];

$user = new User('members');
$result = $user->register($data);

if ($result) {
    jsonResponse(['success' => true, 'message' => 'Registrasi berhasil']);
} else {
    jsonResponse(['success' => false, 'message' => 'Registrasi gagal, email mungkin sudah terdaftar']);
}
?>