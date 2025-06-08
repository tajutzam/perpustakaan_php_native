<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Member - Perpustakaan</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>

<body>
    <div id="app">
        <nav class="navbar">
            <div class="nav-brand">
                <h2>📚 Dashboard Member</h2>
            </div>
            <div class="nav-menu">
                <span id="memberInfo"></span>
                <button class="btn btn-secondary" onclick="logout()">Keluar</button>
            </div>
        </nav>

        <div class="container">
            <div class="dashboard-tabs">
                <button class="tab-btn active" data-tab="books">Daftar Buku</button>
                <button class="tab-btn" data-tab="my-borrowings">Peminjaman Saya</button>
                <button class="tab-btn" data-tab="favorites">Buku Favorit</button>
            </div>

            <!-- Books Tab -->
            <div id="books-tab" class="tab-content active">
                <div class="page-header">
                    <h3>Daftar Buku Tersedia</h3>
                </div>

                <div class="search-filters">
                    <div class="search-box">
                        <input type="text" id="searchBooks" placeholder="Cari buku, penulis, atau ISBN...">
                    </div>
                    <div class="filter-box">
                        <select id="categoryFilter">
                            <option value="">Semua Kategori</option>
                        </select>
                    </div>
                </div>

                <div id="booksGrid" class="books-grid">
                    <!-- Books will be loaded here -->
                </div>
            </div>

            <!-- My Borrowings Tab -->
            <div id="my-borrowings-tab" class="tab-content">
                <div class="page-header">
                    <h3>Riwayat Peminjaman Saya</h3>
                </div>
                <div id="myBorrowingsTable" class="table-container">
                    <!-- Borrowings will be loaded here -->
                </div>
            </div>

            <!-- Favorites Tab -->
            <div id="favorites-tab" class="tab-content">
                <div class="page-header">
                    <h3>10 Buku Favorit</h3>
                    <p>Buku-buku dengan peminjaman terbanyak</p>
                </div>
                <div id="favoritesGrid" class="books-grid">
                    <!-- Favorite books will be loaded here -->
                </div>
            </div>
        </div>
    </div>

    <!-- Book Detail Modal -->
    <div id="bookModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <div id="bookModalContent">
                <!-- Book details will be loaded here -->
            </div>
        </div>
    </div>

    <script src="../assets/js/member.js"></script>
</body>

</html>