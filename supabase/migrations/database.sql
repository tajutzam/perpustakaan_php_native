-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 08, 2025 at 02:47 AM
-- Server version: 8.0.30
-- PHP Version: 8.2.21

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `perpustakaan_peminjaman`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_create_borrowing` (IN `p_member_id` INT, IN `p_book_id` INT, IN `p_officer_id` INT, IN `p_borrow_date` DATE, IN `p_due_date` DATE, OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(255))   BEGIN
    DECLARE v_blacklisted BOOLEAN;
    DECLARE v_deposit INT;
    DECLARE v_stock INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Terjadi kesalahan saat memproses peminjaman';
    END;

    main_block: BEGIN  -- <== Label block untuk LEAVE
        -- Cek status member
        SELECT is_blacklisted, deposit INTO v_blacklisted, v_deposit
        FROM members WHERE id = p_member_id;

        IF v_blacklisted THEN
            SET p_success = FALSE;
            SET p_message = 'Member sedang dalam blacklist';
            LEAVE main_block;
        END IF;

        IF v_deposit < 50000 THEN
            SET p_success = FALSE;
            SET p_message = 'Deposit tidak mencukupi (minimal Rp 50.000)';
            LEAVE main_block;
        END IF;

        -- Cek stok buku
        SELECT available_stock INTO v_stock
        FROM books WHERE id = p_book_id;

        IF v_stock IS NULL OR v_stock <= 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Buku tidak tersedia';
            LEAVE main_block;
        END IF;

        -- Mulai transaksi
        START TRANSACTION;

        -- Catat peminjaman
        INSERT INTO borrowings (member_id, book_id, officer_id, borrow_date, due_date)
        VALUES (p_member_id, p_book_id, p_officer_id, p_borrow_date, p_due_date);

        -- Kurangi stok buku
        UPDATE books SET available_stock = available_stock - 1 WHERE id = p_book_id;

        -- Kurangi deposit member
        UPDATE members SET deposit = deposit - 50000 WHERE id = p_member_id;

        -- Catat transaksi
        INSERT INTO transactions (member_id, type, amount, description)
        VALUES (p_member_id, 'deposit', -50000, 'Peminjaman buku');

        COMMIT;

        SET p_success = TRUE;
        SET p_message = 'Peminjaman berhasil dicatat';
    END main_block;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_active_borrowings` ()   BEGIN
    SELECT br.*, 
           b.title, 
           b.author, 
           m.name AS member_name, 
           m.member_code
    FROM borrowings br
    JOIN books b ON br.book_id = b.id
    JOIN members m ON br.member_id = m.id
    WHERE br.status = 'borrowed'
    ORDER BY br.borrow_date DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_all_books` (IN `in_search` VARCHAR(255), IN `in_category` VARCHAR(100))   BEGIN
    SELECT *
    FROM books
    WHERE
        (in_search IS NULL OR in_search = '' OR 
         title LIKE CONCAT('%', in_search, '%') OR
         author LIKE CONCAT('%', in_search, '%') OR
         isbn LIKE CONCAT('%', in_search, '%'))
      AND
        (in_category IS NULL OR in_category = '' OR category = in_category)
    ORDER BY title ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_available_books` ()   BEGIN
    SELECT *
    FROM books
    WHERE available_stock > 0
    ORDER BY title ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_book_by_id` (IN `in_id` INT)   BEGIN
    SELECT *
    FROM books
    WHERE id = in_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_book_categories` ()   BEGIN
    SELECT DISTINCT category
    FROM books
    WHERE category IS NOT NULL
    ORDER BY category ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_member_borrowings` (IN `member_id_param` INT)   BEGIN
    SELECT br.*, 
           b.title, 
           b.author
    FROM borrowings br
    JOIN books b ON br.book_id = b.id
    WHERE br.member_id = member_id_param
    ORDER BY br.borrow_date DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_top_books` (IN `in_limit` INT)   BEGIN
    SELECT b.*, COUNT(br.id) AS borrow_count
    FROM books b
    LEFT JOIN borrowings br ON b.id = br.book_id
    GROUP BY b.id
    ORDER BY borrow_count DESC, b.title ASC
    LIMIT in_limit;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_user_by_id` (IN `p_id` INT)   BEGIN
    SELECT * FROM users WHERE id = p_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_login` (IN `input_email` VARCHAR(255))   BEGIN
    SELECT * FROM members WHERE email = input_email;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_login_officer` (IN `input_email` VARCHAR(255))   BEGIN
    SELECT * FROM officers WHERE email = input_email;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_register_member` (IN `p_member_code` VARCHAR(20), IN `p_name` VARCHAR(100), IN `p_email` VARCHAR(255), IN `p_password` TEXT, IN `p_phone` VARCHAR(20), IN `p_address` TEXT)   BEGIN
    INSERT INTO members (member_code, name, email, password, phone, address)
    VALUES (p_member_code, p_name, p_email, p_password, p_phone, p_address);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_return_book` (IN `p_borrowing_id` INT, IN `p_condition` VARCHAR(20), IN `p_officer_id` INT)   BEGIN
    DECLARE v_member_id INT;
    DECLARE v_book_id INT;
    DECLARE v_due_date DATE;
    DECLARE v_return_date DATE;
    DECLARE v_deposit INT;
    DECLARE v_days_late INT;
    DECLARE v_fine INT DEFAULT 0;
    DECLARE v_deposit_return INT;

    -- Ambil data peminjaman
    SELECT br.member_id, br.book_id, br.due_date, m.deposit
    INTO v_member_id, v_book_id, v_due_date, v_deposit
    FROM borrowings br
    JOIN members m ON br.member_id = m.id
    WHERE br.id = p_borrowing_id AND br.status = 'borrowed';

    SET v_return_date = CURDATE();

    -- Hitung denda keterlambatan
    IF v_return_date > v_due_date THEN
        SET v_days_late = DATEDIFF(v_return_date, v_due_date);
        SET v_fine = v_fine + (v_days_late * 5000);
    END IF;

    -- Tambah denda jika buku rusak
    IF p_condition = 'damaged' THEN
        SET v_fine = v_fine + 25000;
        UPDATE members SET is_blacklisted = TRUE WHERE id = v_member_id;
    END IF;

    -- Update peminjaman
    UPDATE borrowings
    SET return_date = v_return_date,
        book_condition = p_condition,
        fine_amount = v_fine,
        status = 'returned'
    WHERE id = p_borrowing_id;

    -- Update stok buku
    UPDATE books SET available_stock = available_stock + 1 WHERE id = v_book_id;

    -- Hitung pengembalian deposit
    SET v_deposit_return = 50000 - v_fine;

    -- Refund jika ada deposit yang tersisa
    IF v_deposit_return > 0 THEN
        UPDATE members SET deposit = deposit + v_deposit_return WHERE id = v_member_id;

        INSERT INTO transactions (member_id, type, amount, description)
        VALUES (v_member_id, 'refund', v_deposit_return, 'Pengembalian deposit');
    END IF;

    -- Catat denda jika ada
    IF v_fine > 0 THEN
        INSERT INTO transactions (member_id, type, amount, description)
        VALUES (v_member_id, 'fine', v_fine, 'Denda keterlambatan/kerusakan');
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_update_book_stock` (IN `in_book_id` INT, IN `in_change` INT)   BEGIN
    UPDATE books
    SET available_stock = available_stock + in_change
    WHERE id = in_book_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_update_deposit` (IN `p_member_id` INT, IN `p_amount` DECIMAL(15,2))   BEGIN
    UPDATE members 
    SET deposit = deposit + p_amount 
    WHERE id = p_member_id;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) NOT NULL,
  `isbn` varchar(20) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `available_stock` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `title`, `author`, `isbn`, `category`, `stock`, `available_stock`, `created_at`, `updated_at`) VALUES
(1, 'Pemrograman Web dengan PHP', 'Ahmad Santoso', '978-123-456-001', 'Teknologi', 5, 5, '2025-06-07 11:26:18', '2025-06-07 11:26:18'),
(2, 'Basis Data Fundamental', 'Maria Dewi', '978-123-456-002', 'Teknologi', 3, 3, '2025-06-07 11:26:18', '2025-06-07 11:52:08'),
(3, 'Algoritma dan Struktur Data', 'Budi Hartono', '978-123-456-003', 'Teknologi', 4, 4, '2025-06-07 11:26:18', '2025-06-08 01:26:00'),
(4, 'Jaringan Komputer', 'Siti Rahayu', '978-123-456-004', 'Teknologi', 2, 2, '2025-06-07 11:26:18', '2025-06-08 01:31:24'),
(5, 'Sistem Operasi', 'Andi Wijaya', '978-123-456-005', 'Teknologi', 3, 3, '2025-06-07 11:26:18', '2025-06-07 11:26:18'),
(6, 'Machine Learning Basics', 'Dr. Indra', '978-123-456-006', 'Teknologi', 2, 2, '2025-06-07 11:26:18', '2025-06-07 11:26:18'),
(7, 'Web Design Modern', 'Lisa Chen', '978-123-456-007', 'Teknologi', 4, 4, '2025-06-07 11:26:18', '2025-06-07 11:26:18'),
(8, 'Cyber Security', 'John Smith', '978-123-456-008', 'Teknologi', 3, 3, '2025-06-07 11:26:18', '2025-06-07 11:26:18'),
(9, 'Data Science', 'Sarah Brown', '978-123-456-009', 'Teknologi', 2, 2, '2025-06-07 11:26:18', '2025-06-07 11:49:42'),
(10, 'Mobile Development', 'Kevin Lee', '978-123-456-010', 'Teknologi', 5, 5, '2025-06-07 11:26:18', '2025-06-07 11:26:18');

-- --------------------------------------------------------

--
-- Table structure for table `borrowings`
--

CREATE TABLE `borrowings` (
  `id` int NOT NULL,
  `member_id` int NOT NULL,
  `book_id` int NOT NULL,
  `officer_id` int NOT NULL,
  `borrow_date` date NOT NULL,
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `book_condition` enum('good','damaged') DEFAULT 'good',
  `fine_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('borrowed','returned','overdue') DEFAULT 'borrowed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `borrowings`
--

INSERT INTO `borrowings` (`id`, `member_id`, `book_id`, `officer_id`, `borrow_date`, `due_date`, `return_date`, `book_condition`, `fine_amount`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 3, 1, '2025-06-07', '2025-06-21', '2025-06-07', 'good', '0.00', 'returned', '2025-06-07 11:35:07', '2025-06-07 11:36:09'),
(2, 2, 9, 1, '2025-06-07', '2025-06-21', '2025-06-07', 'damaged', '25000.00', 'returned', '2025-06-07 11:40:17', '2025-06-07 11:49:42'),
(3, 3, 2, 1, '2025-06-07', '2025-06-21', '2025-06-07', 'damaged', '25000.00', 'returned', '2025-06-07 11:51:57', '2025-06-07 11:52:08'),
(4, 4, 3, 1, '2025-06-08', '2025-06-22', '2025-06-08', 'good', '0.00', 'returned', '2025-06-08 01:24:49', '2025-06-08 01:26:00'),
(5, 4, 4, 1, '2025-06-08', '2025-06-22', '2025-06-08', 'damaged', '25000.00', 'returned', '2025-06-08 01:31:15', '2025-06-08 01:31:24');

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `id` int NOT NULL,
  `member_code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `deposit` decimal(10,2) DEFAULT '100000.00',
  `is_blacklisted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`id`, `member_code`, `name`, `email`, `password`, `phone`, `address`, `deposit`, `is_blacklisted`, `created_at`, `updated_at`) VALUES
(1, 'MBR001', 'John Doe', 'john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '081234567890', 'Jl. Merdeka No. 1', '150000.00', 0, '2025-06-07 11:26:19', '2025-06-07 11:26:19'),
(2, 'MBR2510', 'zam', 'zam@gmail.com', '$2y$10$WH947HN7lRQinZw9HJTw.egb3djowZ8KV5hXD5ViwFevZrLuqcj5.', '08512312312', 'banyuwangi', '75000.00', 1, '2025-06-07 11:32:55', '2025-06-07 11:49:42'),
(3, 'MBR2915', 'ya', 'ya@gmail.com', '$2y$10$DMD2pbIugPVWbwIXdL.fPu/EJoQytBeCM8b//h.6h5DAy0qzKt3y2', '123123123', 'banyuangi', '75000.00', 1, '2025-06-07 11:51:25', '2025-06-07 11:52:08'),
(4, 'MBR3359', 'y', 'z@gmail.com', '$2y$10$V9o/q4pwpe0nzBHG4gr5r.9qmSGil4id57YmAvXwfCXs3ZgwzDWbe', 'password', 'asdasd', '75000.00', 1, '2025-06-08 01:23:53', '2025-06-08 01:31:24');

-- --------------------------------------------------------

--
-- Table structure for table `officers`
--

CREATE TABLE `officers` (
  `id` int NOT NULL,
  `officer_code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `officers`
--

INSERT INTO `officers` (`id`, `officer_code`, `name`, `email`, `password`, `position`, `created_at`, `updated_at`) VALUES
(1, 'OFF001', 'Admin Perpustakaan', 'admin@perpus.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kepala Perpustakaan', '2025-06-07 11:26:19', '2025-06-07 11:26:19');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int NOT NULL,
  `member_id` int NOT NULL,
  `type` enum('deposit','fine','refund') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `member_id`, `type`, `amount`, `description`, `created_at`) VALUES
(1, 2, 'deposit', '-50000.00', 'Peminjaman buku', '2025-06-07 11:35:07'),
(2, 2, 'refund', '50000.00', 'Pengembalian deposit', '2025-06-07 11:36:09'),
(3, 2, 'deposit', '-50000.00', 'Peminjaman buku', '2025-06-07 11:40:17'),
(8, 2, 'refund', '25000.00', 'Pengembalian deposit', '2025-06-07 11:49:42'),
(9, 2, 'fine', '25000.00', 'Denda keterlambatan/kerusakan', '2025-06-07 11:49:42'),
(10, 3, 'deposit', '-50000.00', 'Peminjaman buku', '2025-06-07 11:51:57'),
(11, 3, 'refund', '25000.00', 'Pengembalian deposit', '2025-06-07 11:52:08'),
(12, 3, 'fine', '25000.00', 'Denda keterlambatan/kerusakan', '2025-06-07 11:52:08'),
(13, 4, 'deposit', '-50000.00', 'Peminjaman buku', '2025-06-08 01:24:49'),
(14, 4, 'refund', '50000.00', 'Pengembalian deposit', '2025-06-08 01:26:00'),
(15, 4, 'deposit', '-50000.00', 'Peminjaman buku', '2025-06-08 01:31:15'),
(16, 4, 'refund', '25000.00', 'Pengembalian deposit', '2025-06-08 01:31:24'),
(17, 4, 'fine', '25000.00', 'Denda keterlambatan/kerusakan', '2025-06-08 01:31:24');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `isbn` (`isbn`);

--
-- Indexes for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `member_id` (`member_id`),
  ADD KEY `book_id` (`book_id`),
  ADD KEY `officer_id` (`officer_id`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `member_code` (`member_code`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `officers`
--
ALTER TABLE `officers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `officer_code` (`officer_code`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `member_id` (`member_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `borrowings`
--
ALTER TABLE `borrowings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `members`
--
ALTER TABLE `members`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `officers`
--
ALTER TABLE `officers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD CONSTRAINT `borrowings_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  ADD CONSTRAINT `borrowings_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`),
  ADD CONSTRAINT `borrowings_ibfk_3` FOREIGN KEY (`officer_id`) REFERENCES `officers` (`id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
