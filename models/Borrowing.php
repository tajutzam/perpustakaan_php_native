<?php
require_once __DIR__ . '/../config/db.php';

class Borrowing
{
    private $conn;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    public function create($data)
    {
        try {
            // Panggil Stored Procedure
            $stmt = $this->conn->prepare("
            CALL sp_create_borrowing(
                :member_id,
                :book_id,
                :officer_id,
                :borrow_date,
                :due_date,
                @p_success,
                @p_message
            )
        ");

            // Bind parameter
            $stmt->bindParam(':member_id', $data['member_id'], PDO::PARAM_INT);
            $stmt->bindParam(':book_id', $data['book_id'], PDO::PARAM_INT);
            $stmt->bindParam(':officer_id', $data['officer_id'], PDO::PARAM_INT);
            $stmt->bindParam(':borrow_date', $data['borrow_date']);
            $stmt->bindParam(':due_date', $data['due_date']);
            $stmt->execute();

            // Ambil output dari parameter OUT
            $select = $this->conn->query("SELECT @p_success AS success, @p_message AS message");
            $result = $select->fetch(PDO::FETCH_ASSOC);

            return [
                'success' => (bool) $result['success'],
                'message' => $result['message']
            ];

        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ];
        }
    }


    public function returnBook($borrowingId, $condition, $officerId)
    {
        try {
            $this->conn->beginTransaction();

            $stmt = $this->conn->prepare("CALL sp_return_book(:borrowing_id, :condition, :officer_id)");
            $stmt->bindParam(':borrowing_id', $borrowingId);
            $stmt->bindParam(':condition', $condition);
            $stmt->bindParam(':officer_id', $officerId);
            $stmt->execute();

            $this->conn->commit();
            return [
                'success' => true,
                'message' => 'Pengembalian berhasil diproses melalui SP'
            ];

        } catch (Exception $e) {
            $this->conn->rollback();
            return [
                'success' => false,
                'message' => 'Terjadi kesalahan saat menjalankan SP: ' . $e->getMessage()
            ];
        }
    }


    public function getActiveBorrowings()
    {
        $stmt = $this->conn->prepare("CALL sp_get_active_borrowings()");
        $stmt->execute();
        return $stmt->fetchAll();
    }


    public function getMemberBorrowings($memberId)
    {
        $stmt = $this->conn->prepare("CALL sp_get_member_borrowings(:member_id)");
        $stmt->bindParam(':member_id', $memberId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

}
?>