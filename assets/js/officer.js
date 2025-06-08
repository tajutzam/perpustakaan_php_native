class OfficerDashboard {
    constructor() {
        this.apiBase = '../api';
        this.user = JSON.parse(localStorage.getItem('user'));
        this.userType = localStorage.getItem('userType');
        this.selectedMember = null;
        this.selectedBook = null;
        this.activeBorrowings = [];
        
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.updateUserInfo();
        this.loadInitialData();
    }

    checkAuth() {
        if (!this.user || this.userType !== 'officers') {
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

        // Search events
        document.getElementById('searchMember').addEventListener('input', 
            this.debounce(() => this.searchMembers(), 300)
        );
        
        document.getElementById('searchBooksForBorrow').addEventListener('input', 
            this.debounce(() => this.searchBooksForBorrow(), 300)
        );

        // Borrow process
        document.getElementById('processBorrowBtn').addEventListener('click', () => {
            this.processBorrowing();
        });

        // Return form
        document.getElementById('returnForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processReturn();
        });

        // Modal events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    updateUserInfo() {
        document.getElementById('officerInfo').textContent = 
            `${this.user.name} | ${this.user.position || 'Petugas'}`;
    }

    async loadInitialData() {
        await this.loadActiveBorrowings();
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

        // Load data based on tab
        if (tabName === 'borrowings') {
            this.loadActiveBorrowings();
        } else if (tabName === 'reports') {
            this.loadReports();
        } else if (tabName === 'new-borrow') {
            this.resetBorrowForm();
        }
    }

    async loadActiveBorrowings() {
        try {
            const response = await fetch(`${this.apiBase}/borrowings/active.php`);
            const result = await response.json();

            if (result.success) {
                this.activeBorrowings = result.data;
                this.renderActiveBorrowings(result.data);
            } else {
                this.showAlert('Gagal memuat data peminjaman aktif', 'error');
            }
        } catch (error) {
            console.error('Error loading active borrowings:', error);
            this.showAlert('Terjadi kesalahan saat memuat data', 'error');
        }
    }

    async loadReports() {
        try {
            const response = await fetch(`${this.apiBase}/books/top10.php`);
            const result = await response.json();

            if (result.success) {
                this.renderReports(result.data);
            } else {
                this.showAlert('Gagal memuat laporan', 'error');
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            this.showAlert('Terjadi kesalahan saat memuat laporan', 'error');
        }
    }

    renderActiveBorrowings(borrowings) {
        const container = document.getElementById('activeBorrowingsTable');
        
        if (borrowings.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <p>Tidak ada peminjaman aktif saat ini</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Buku</th>
                        <th>Tanggal Pinjam</th>
                        <th>Tanggal Kembali</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${borrowings.map(borrowing => `
                        <tr>
                            <td>
                                <div class="member-info">
                                    <div class="member-name">${this.escapeHtml(borrowing.member_name)}</div>
                                    <div class="member-code">${this.escapeHtml(borrowing.member_code)}</div>
                                </div>
                            </td>
                            <td>
                                <div class="book-info">
                                    <div class="book-title">${this.escapeHtml(borrowing.title)}</div>
                                    <div class="book-author">oleh ${this.escapeHtml(borrowing.author)}</div>
                                </div>
                            </td>
                            <td>${this.formatDate(borrowing.borrow_date)}</td>
                            <td>${this.formatDate(borrowing.due_date)}</td>
                            <td>
                                <span class="status-badge status-${borrowing.status}">
                                    ${this.getStatusText(borrowing.status)}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-secondary" onclick="officerDashboard.showReturnModal(${borrowing.id})">
                                    Kembalikan
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderReports(books) {
        const container = document.getElementById('reportsTable');
        
        if (books.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <p>Belum ada data laporan</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Ranking</th>
                        <th>Judul Buku</th>
                        <th>Penulis</th>
                        <th>Kategori</th>
                        <th>Jumlah Peminjaman</th>
                    </tr>
                </thead>
                <tbody>
                    ${books.map((book, index) => `
                        <tr>
                            <td><strong>#${index + 1}</strong></td>
                            <td>${this.escapeHtml(book.title)}</td>
                            <td>${this.escapeHtml(book.author)}</td>
                            <td>${this.escapeHtml(book.category || 'Umum')}</td>
                            <td><strong>${book.borrow_count || 0}x</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async searchMembers() {
        const search = document.getElementById('searchMember').value.trim();
        const container = document.getElementById('memberSearchResults');

        if (search.length < 2) {
            container.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/members/search.php?search=${encodeURIComponent(search)}`);
            const result = await response.json();

            if (result.success) {
                this.renderMemberSearchResults(result.data);
            } else {
                container.innerHTML = '<div class="no-data"><p>Tidak ada member ditemukan</p></div>';
            }
        } catch (error) {
            console.error('Error searching members:', error);
            container.innerHTML = '<div class="no-data"><p>Terjadi kesalahan saat mencari</p></div>';
        }
    }

    async searchBooksForBorrow() {
        const search = document.getElementById('searchBooksForBorrow').value.trim();
        const container = document.getElementById('bookSearchResults');

        if (search.length < 2) {
            container.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/books/list.php?available_only=true&search=${encodeURIComponent(search)}`);
            const result = await response.json();

            if (result.success) {
                this.renderBookSearchResults(result.data);
            } else {
                container.innerHTML = '<div class="no-data"><p>Tidak ada buku ditemukan</p></div>';
            }
        } catch (error) {
            console.error('Error searching books:', error);
            container.innerHTML = '<div class="no-data"><p>Terjadi kesalahan saat mencari</p></div>';
        }
    }

    renderMemberSearchResults(members) {
        const container = document.getElementById('memberSearchResults');
        
        container.innerHTML = members.map(member => `
            <div class="search-result-item ${member.is_blacklisted ? 'blacklisted-item' : ''}" 
                 onclick="officerDashboard.selectMember(${member.id}, '${this.escapeHtml(member.name)}', '${this.escapeHtml(member.member_code)}', ${member.deposit}, ${member.is_blacklisted})">
                <div class="member-info">
                    <div class="member-details">
                        <div class="member-name">${this.escapeHtml(member.name)}</div>
                        <div class="member-code">${this.escapeHtml(member.member_code)} | ${this.escapeHtml(member.email)}</div>
                    </div>
                    <div class="deposit-info">
                        <div>Deposit: Rp ${this.formatMoney(member.deposit)}</div>
                        ${member.is_blacklisted ? '<div class="blacklisted">BLACKLISTED</div>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderBookSearchResults(books) {
        const container = document.getElementById('bookSearchResults');
        
        container.innerHTML = books.map(book => `
            <div class="search-result-item" 
                 onclick="officerDashboard.selectBook(${book.id}, '${this.escapeHtml(book.title)}', '${this.escapeHtml(book.author)}', ${book.available_stock})">
                <div class="book-info">
                    <div class="book-details">
                        <div class="book-title">${this.escapeHtml(book.title)}</div>
                        <div class="book-author">oleh ${this.escapeHtml(book.author)}</div>
                    </div>
                    <div class="stock-status">
                        <div>Stok: ${book.available_stock}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    selectMember(id, name, code, deposit, isBlacklisted) {
        if (isBlacklisted) {
            this.showAlert('Member ini sedang dalam blacklist', 'error');
            return;
        }

        if (deposit < 50000) {
            this.showAlert('Deposit member tidak mencukupi (minimal Rp 50.000)', 'error');
            return;
        }

        this.selectedMember = { id, name, code, deposit };
        
        // Update UI
        document.querySelectorAll('#memberSearchResults .search-result-item').forEach(item => {
            item.classList.remove('selected');
        });
        event.target.closest('.search-result-item').classList.add('selected');

        this.updateBorrowButton();
    }

    selectBook(id, title, author, stock) {
        if (stock <= 0) {
            this.showAlert('Buku tidak tersedia', 'error');
            return;
        }

        this.selectedBook = { id, title, author, stock };
        
        // Update UI
        document.querySelectorAll('#bookSearchResults .search-result-item').forEach(item => {
            item.classList.remove('selected');
        });
        event.target.closest('.search-result-item').classList.add('selected');

        this.updateBorrowButton();
    }

    updateBorrowButton() {
        const btn = document.getElementById('processBorrowBtn');
        btn.disabled = !this.selectedMember || !this.selectedBook;
        
        if (this.selectedMember && this.selectedBook) {
            btn.textContent = `Pinjamkan "${this.selectedBook.title}" ke ${this.selectedMember.name}`;
        } else {
            btn.textContent = 'Proses Peminjaman';
        }
    }

    async processBorrowing() {
        if (!this.selectedMember || !this.selectedBook) {
            this.showAlert('Pilih member dan buku terlebih dahulu', 'error');
            return;
        }

        const data = {
            member_id: this.selectedMember.id,
            book_id: this.selectedBook.id
        };

        try {
            const response = await fetch(`${this.apiBase}/borrowings/create.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('Peminjaman berhasil dicatat', 'success');
                this.resetBorrowForm();
                
                // Refresh active borrowings if we're on that tab
                if (document.querySelector('[data-tab="borrowings"]').classList.contains('active')) {
                    this.loadActiveBorrowings();
                }
            } else {
                this.showAlert(result.message, 'error');
            }
        } catch (error) {
            console.error('Error processing borrowing:', error);
            this.showAlert('Terjadi kesalahan saat memproses peminjaman', 'error');
        }
    }

    showReturnModal(borrowingId) {
        const borrowing = this.activeBorrowings.find(b => b.id == borrowingId);
        if (!borrowing) return;

        document.getElementById('returnBorrowingId').value = borrowingId;
        document.getElementById('returnModal').style.display = 'block';
    }

    async processReturn() {
        const borrowingId = document.getElementById('returnBorrowingId').value;
        const condition = document.querySelector('input[name="condition"]:checked').value;

        const data = {
            borrowing_id: parseInt(borrowingId),
            condition: condition
        };

        try {
            const response = await fetch(`${this.apiBase}/borrowings/return.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                let message = 'Pengembalian berhasil dicatat';
                if (result.fine > 0) {
                    message += `\nDenda: Rp ${this.formatMoney(result.fine)}`;
                }
                if (result.deposit_return > 0) {
                    message += `\nDeposit dikembalikan: Rp ${this.formatMoney(result.deposit_return)}`;
                }

                this.showAlert(message, 'success');
                this.closeModals();
                this.loadActiveBorrowings();
            } else {
                this.showAlert(result.message, 'error');
            }
        } catch (error) {
            console.error('Error processing return:', error);
            this.showAlert('Terjadi kesalahan saat memproses pengembalian', 'error');
        }
    }

    resetBorrowForm() {
        this.selectedMember = null;
        this.selectedBook = null;
        
        document.getElementById('searchMember').value = '';
        document.getElementById('searchBooksForBorrow').value = '';
        document.getElementById('memberSearchResults').innerHTML = '';
        document.getElementById('bookSearchResults').innerHTML = '';
        
        this.updateBorrowButton();
    }

    closeModals() {
        document.getElementById('returnModal').style.display = 'none';
    }

    refreshBorrowings() {
        this.loadActiveBorrowings();
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
    window.officerDashboard = new OfficerDashboard();
});




// Global functions
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    window.location.href = '../index.php';
}

function closeReturnModal() {
    document.getElementById('returnModal').style.display = 'none';
}