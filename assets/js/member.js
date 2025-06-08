class MemberDashboard {
    constructor() {
        this.apiBase = '../api';
        this.user = JSON.parse(localStorage.getItem('user'));
        this.userType = localStorage.getItem('userType');
        this.selectedBook = null;
        this.books = [];
        this.categories = [];
        
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.updateUserInfo();
        this.loadInitialData();
    }

    checkAuth() {
        if (!this.user || this.userType !== 'members') {
            window.location.href = '../index.php';
            return;
        }
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Search and filter
        document.getElementById('searchBooks').addEventListener('input', 
            this.debounce(() => this.filterBooks(), 300)
        );
        
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterBooks();
        });

        // Modal events
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('bookModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    updateUserInfo() {
        document.getElementById('memberInfo').textContent = 
            `${this.user.name} | Deposit: Rp ${this.formatMoney(this.user.deposit)}`;
    }

    async loadInitialData() {
        await Promise.all([
            this.loadBooks(),
            this.loadCategories(),
            this.loadMyBorrowings(),
            this.loadFavoriteBooks()
        ]);
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load data if needed
        if (tabName === 'my-borrowings') {
            this.loadMyBorrowings();
        } else if (tabName === 'favorites') {
            this.loadFavoriteBooks();
        }
    }

    async loadBooks() {
        try {
            const response = await fetch(`${this.apiBase}/books/list.php?available_only=true`);
            const result = await response.json();

            if (result.success) {
                this.books = result.data;
                this.renderBooks(this.books);
            } else {
                this.showAlert('Gagal memuat daftar buku', 'error');
            }
        } catch (error) {
            console.error('Error loading books:', error);
            this.showAlert('Terjadi kesalahan saat memuat data', 'error');
        }
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBase}/books/categories.php`);
            const result = await response.json();

            if (result.success) {
                this.categories = result.data;
                this.renderCategories();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadMyBorrowings() {
        try {
            const response = await fetch(`${this.apiBase}/borrowings/active.php`);
            const result = await response.json();

            if (result.success) {
                this.renderMyBorrowings(result.data);
            } else {
                this.showAlert('Gagal memuat data peminjaman', 'error');
            }
        } catch (error) {
            console.error('Error loading borrowings:', error);
            this.showAlert('Terjadi kesalahan saat memuat data peminjaman', 'error');
        }
    }

    async loadFavoriteBooks() {
        try {
            const response = await fetch(`${this.apiBase}/books/top10.php`);
            const result = await response.json();

            if (result.success) {
                this.renderFavoriteBooks(result.data);
            } else {
                this.showAlert('Gagal memuat buku favorit', 'error');
            }
        } catch (error) {
            console.error('Error loading favorite books:', error);
            this.showAlert('Terjadi kesalahan saat memuat buku favorit', 'error');
        }
    }

    renderBooks(books) {
        const container = document.getElementById('booksGrid');
        
        if (books.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <p>Tidak ada buku yang tersedia saat ini</p>
                </div>
            `;
            return;
        }

        container.innerHTML = books.map(book => `
            <div class="book-card">
                <h4>${this.escapeHtml(book.title)}</h4>
                <p class="author">oleh ${this.escapeHtml(book.author)}</p>
                <div class="book-meta">
                    <span class="book-category">${this.escapeHtml(book.category || 'Umum')}</span>
                    <span class="stock-info">Stok: ${book.available_stock}</span>
                </div>
                <div class="book-actions">
                    <button class="btn btn-primary" onclick="memberDashboard.showBookDetail(${book.id})">
                        Lihat Detail
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderCategories() {
        const select = document.getElementById('categoryFilter');
        select.innerHTML = '<option value="">Semua Kategori</option>' +
            this.categories.map(category => 
                `<option value="${this.escapeHtml(category)}">${this.escapeHtml(category)}</option>`
            ).join('');
    }

    renderMyBorrowings(borrowings) {
        const container = document.getElementById('myBorrowingsTable');
        
        if (borrowings.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <p>Belum ada riwayat peminjaman</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Judul Buku</th>
                        <th>Penulis</th>
                        <th>Tanggal Pinjam</th>
                        <th>Tanggal Kembali</th>
                        <th>Status</th>
                        <th>Denda</th>
                    </tr>
                </thead>
                <tbody>
                    ${borrowings.map(borrowing => `
                        <tr>
                            <td>${this.escapeHtml(borrowing.title)}</td>
                            <td>${this.escapeHtml(borrowing.author)}</td>
                            <td>${this.formatDate(borrowing.borrow_date)}</td>
                            <td>${this.formatDate(borrowing.due_date)}</td>
                            <td>
                                <span class="status-badge status-${borrowing.status}">
                                    ${this.getStatusText(borrowing.status)}
                                </span>
                            </td>
                            <td>Rp ${this.formatMoney(borrowing.fine_amount || 0)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderFavoriteBooks(books) {
        const container = document.getElementById('favoritesGrid');
        
        if (books.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <p>Belum ada data buku favorit</p>
                </div>
            `;
            return;
        }

        container.innerHTML = books.map((book, index) => `
            <div class="book-card">
                <div class="rank-badge">#${index + 1}</div>
                <h4>${this.escapeHtml(book.title)}</h4>
                <p class="author">oleh ${this.escapeHtml(book.author)}</p>
                <div class="book-meta">
                    <span class="book-category">${this.escapeHtml(book.category || 'Umum')}</span>
                    <span class="borrow-count">Dipinjam: ${book.borrow_count || 0}x</span>
                </div>
            </div>
        `).join('');
    }

    filterBooks() {
        const search = document.getElementById('searchBooks').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;

        let filteredBooks = this.books;

        if (search) {
            filteredBooks = filteredBooks.filter(book => 
                book.title.toLowerCase().includes(search) ||
                book.author.toLowerCase().includes(search) ||
                (book.isbn && book.isbn.toLowerCase().includes(search))
            );
        }

        if (category) {
            filteredBooks = filteredBooks.filter(book => book.category === category);
        }

        this.renderBooks(filteredBooks);
    }

    showBookDetail(bookId) {
        const book = this.books.find(b => b.id == bookId);
        if (!book) return;

        const modalContent = document.getElementById('bookModalContent');
        modalContent.innerHTML = `
            <h3>${this.escapeHtml(book.title)}</h3>
            <div class="book-detail">
                <p><strong>Penulis:</strong> ${this.escapeHtml(book.author)}</p>
                <p><strong>ISBN:</strong> ${this.escapeHtml(book.isbn || '-')}</p>
                <p><strong>Kategori:</strong> ${this.escapeHtml(book.category || 'Umum')}</p>
                <p><strong>Stok Tersedia:</strong> ${book.available_stock}</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="memberDashboard.closeModal()">Tutup</button>
                </div>
            </div>
        `;

        document.getElementById('bookModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('bookModal').style.display = 'none';
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    formatMoney(amount) {
        return new Intl.NumberFormat('id-ID').format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID');
    }

    getStatusText(status) {
        const statusMap = {
            'borrowed': 'Dipinjam',
            'returned': 'Dikembalikan',
            'overdue': 'Terlambat'
        };
        return statusMap[status] || status;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    showAlert(message, type) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Insert alert at the top of the container
        const container = document.querySelector('.container');
        container.insertBefore(alert, container.firstChild);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.memberDashboard = new MemberDashboard();
});

// Global logout function
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    window.location.href = '../index.php';
}