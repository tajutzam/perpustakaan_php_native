<?php
require_once '../../config/db.php';

startSession();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

session_destroy();
jsonResponse(['success' => true, 'message' => 'Logout berhasil']);
?>