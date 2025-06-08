<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistem Peminjaman Buku - Perpustakaan</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>

<body>
    <div id="app">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>📚 Perpustakaan Digital</h1>
                    <p>Sistem Peminjaman Buku Online</p>
                </div>

                <div class="auth-tabs">
                    <button class="tab-btn active" data-tab="login">Masuk</button>
                    <button class="tab-btn" data-tab="register">Daftar</button>
                </div>

                <!-- Login Form -->
                <div id="login-form" class="auth-form active">
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="loginEmail">Email</label>
                            <input type="email" id="loginEmail" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Password</label>
                            <input type="password" id="loginPassword" name="password" required>
                        </div>
                        <div class="form-group">
                            <label for="userType">Masuk sebagai</label>
                            <select id="userType" name="userType" required>
                                <option value="member">Member</option>
                                <option value="officer">Petugas</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Masuk</button>
                    </form>
                </div>

                <!-- Register Form -->
                <div id="register-form" class="auth-form">
                    <form id="registerForm">
                        <div class="form-group">
                            <label for="registerName">Nama Lengkap</label>
                            <input type="text" id="registerName" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="registerEmail">Email</label>
                            <input type="email" id="registerEmail" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="registerPassword">Password</label>
                            <input type="password" id="registerPassword" name="password" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="registerPhone">Nomor Telepon</label>
                            <input type="tel" id="registerPhone" name="phone" required>
                        </div>
                        <div class="form-group">
                            <label for="registerAddress">Alamat</label>
                            <textarea id="registerAddress" name="address" rows="3" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Daftar</button>
                    </form>
                </div>

                <div class="demo-info">
                    <h3>Demo Account</h3>
                    <p><strong>Petugas:</strong> admin@perpus.com | password</p>
                </div>
            </div>
        </div>
    </div>

    <script src="assets/js/auth.js"></script>
</body>

</html>