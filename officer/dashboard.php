<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Petugas - Perpustakaan</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div id="app">
        <nav class="navbar">
            <div class="nav-brand">
                <h2>🏢 Dashboard Petugas</h2>
            </div>
            <div class="nav-menu">
                <span id="officerInfo"></span>
                <button class="btn btn-secondary" onclick="logout()">Keluar</button>
            </div>
        </nav>

        <div class="container">
            <div class="dashboard-tabs">
                <button class="tab-btn active" data-tab="borrowings">Peminjaman Aktif</button>
                <button class="tab-btn" data-tab="new-borrow">Peminjaman Baru</button>
                <button class="tab-btn" data-tab="reports">Laporan</button>
            </div>

            <!-- Active Borrowings Tab -->
            <div id="borrowings-tab" class="tab-content active">
                <div class="page-header">
                    <h3>Peminjaman Aktif</h3>
                    <button class="btn btn-primary" onclick="officerDashboard.refreshBorrowings()">🔄 Refresh</button>
                </div>
                <div id="activeBorrowingsTable" class="table-container">
                    <!-- Active borrowings will be loaded here -->
                </div>
            </div>

            <!-- New Borrowing Tab -->
            <div id="new-borrow-tab" class="tab-content">
                <div class="page-header">
                    <h3>Peminjaman Baru</h3>
                </div>

                <div class="borrow-form-container">
                    <div class="form-section">
                        <h4>Cari Member</h4>
                        <div class="search-box">
                            <input type="text" id="searchMember" placeholder="Cari nama, kode member, atau email...">
                        </div>
                        <div id="memberSearchResults" class="search-results">
                            <!-- Member search results will appear here -->
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Pilih Buku</h4>
                        <div class="search-box">
                            <input type="text" id="searchBooksForBorrow" placeholder="Cari buku yang tersedia...">
                        </div>
                        <div id="bookSearchResults" class="search-results">
                            <!-- Book search results will appear here -->
                        </div>
                    </div>

                    <div class="form-section">
                        <button id="processBorrowBtn" class="btn btn-primary" disabled>Proses Peminjaman</button>
                    </div>
                </div>
            </div>

            <!-- Reports Tab -->
            <div id="reports-tab" class="tab-content">
                <div class="page-header">
                    <h3>Laporan Buku Favorit</h3>
                    <p>10 buku dengan peminjaman terbanyak</p>
                </div>
                <div id="reportsTable" class="table-container">
                    <!-- Reports will be loaded here -->
                </div>
            </div>
        </div>
    </div>

    <!-- Return Book Modal -->
    <div id="returnModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <div id="returnModalContent">
                <h3>Pengembalian Buku</h3>
                <form id="returnForm">
                    <input type="hidden" id="returnBorrowingId">
                    <div class="form-group">
                        <label>Kondisi Buku:</label>
                        <div class="radio-group">
                            <label>
                                <input type="radio" name="condition" value="good" checked>
                                Baik (tidak ada kerusakan)
                            </label>
                            <label>
                                <input type="radio" name="condition" value="damaged">
                                Rusak (ada kerusakan)
                            </label>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeReturnModal()">Batal</button>
                        <button type="submit" class="btn btn-primary">Proses Pengembalian</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="../assets/js/officer.js"></script>
</body>
</html>