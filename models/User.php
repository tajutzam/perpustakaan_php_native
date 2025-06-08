<?php
require_once __DIR__ . '/../config/db.php';

class User
{
    private $conn;
    private $table;

    public function __construct($userType = 'members')
    {
        $database = new Database();
        $this->conn = $database->connect();
        $this->table = $userType; // 'members' or 'officers'
    }

    public function login($email, $password)
    {


        if ($this->table == 'members') {
            $stmt = $this->conn->prepare("CALL sp_login(:email)");
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch();
                if (password_verify($password, $user['password'])) {
                    unset($user['password']);
                    return $user;
                }
            }
        } else {
            $stmt = $this->conn->prepare("CALL sp_login_officer(:email)");
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch();
                if (password_verify($password, $user['password'])) {
                    unset($user['password']);
                    return $user;
                }
            }
        }


        return false;
    }


    public function register($data)
    {
        if ($this->table !== 'members') {
            return false; // Hanya untuk registrasi member
        }

        $checkQuery = "SELECT id FROM members WHERE email = :email";
        $stmt = $this->conn->prepare($checkQuery);
        $stmt->bindParam(':email', $data['email']);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            return false; // Email sudah terpakai
        }

        // Generate kode member
        $memberCode = 'MBR' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

        // Panggil Stored Procedure
        $stmt = $this->conn->prepare("CALL sp_register_member(:member_code, :name, :email, :password, :phone, :address)");
        $stmt->bindParam(':member_code', $memberCode);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':phone', $data['phone']);
        $stmt->bindParam(':address', $data['address']);

        return $stmt->execute();
    }


    public function getById($id)
    {
        $stmt = $this->conn->prepare("CALL sp_get_user_by_id(:id)");
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        $user = $stmt->fetch();

        if ($user) {
            unset($user['password']);
            return $user;
        }

        return false;
    }


    public function updateDeposit($memberId, $amount)
    {
        $stmt = $this->conn->prepare("CALL sp_update_deposit(:member_id, :amount)");
        $stmt->bindParam(':member_id', $memberId);
        $stmt->bindParam(':amount', $amount);
        return $stmt->execute();
    }

}
?>