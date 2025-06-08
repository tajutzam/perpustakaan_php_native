<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../models/User.php';

startSession();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['email']) || !isset($input['password']) || !isset($input['userType'])) {
    jsonResponse(['success' => false, 'message' => 'Data tidak lengkap']);
}

$email = validateInput($input['email']);
$password = $input['password'];
$userType = $input['userType'] === 'officer' ? 'officers' : 'members';

if (empty($email) || empty($password)) {
    jsonResponse(['success' => false, 'message' => 'Email dan password harus diisi']);
}

$user = new User($userType);
$result = $user->login($email, $password);

if ($result) {
    $_SESSION['user_id'] = $result['id'];
    $_SESSION['user_type'] = $userType;
    $_SESSION['user_data'] = $result;

    jsonResponse([
        'success' => true,
        'message' => 'Login berhasil',
        'user' => $result,
        'user_type' => $userType
    ]);
} else {
    jsonResponse(['success' => false, 'message' => 'Email atau password salah']);
}
?>