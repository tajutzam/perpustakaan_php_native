<?php
require_once __DIR__ . '/../config/db.php';

class Book
{
    private $conn;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    public function getAll($search = '', $category = '')
    {
        $stmt = $this->conn->prepare("CALL sp_get_all_books(:search, :category)");
        $stmt->bindValue(':search', $search);
        $stmt->bindValue(':category', $category);
        $stmt->execute();
        return $stmt->fetchAll();
    }


    public function getById($id)
    {
        $stmt = $this->conn->prepare("CALL sp_get_book_by_id(:id)");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }


    public function getAvailableBooks()
    {
        $stmt = $this->conn->prepare("CALL sp_get_available_books()");
        $stmt->execute();

        return $stmt->fetchAll();
    }


    public function updateStock($bookId, $change)
    {
        $stmt = $this->conn->prepare("CALL sp_update_book_stock(:id, :change)");
        $stmt->bindParam(':id', $bookId, PDO::PARAM_INT);
        $stmt->bindParam(':change', $change, PDO::PARAM_INT);
        return $stmt->execute();
    }


    public function getTopBooks($limit = 10)
    {
        $stmt = $this->conn->prepare("CALL sp_get_top_books(:limit)");
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }


    public function getCategories()
    {
        $stmt = $this->conn->prepare("CALL sp_get_book_categories()");
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

}
?>