class AuthManager {
  constructor() {
    this.apiBase = "api";
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAuthStatus();
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Form submissions
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleLogin(e.target);
    });

    document.getElementById("registerForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleRegister(e.target);
    });
  }

  switchTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

    // Update form visibility
    document.querySelectorAll(".auth-form").forEach((form) => {
      form.classList.remove("active");
    });
    document.getElementById(`${tabName}-form`).classList.add("active");
  }

  async handleLogin(form) {
    const formData = new FormData(form);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
      userType: formData.get("userType"),
    };


    try {
      const response = await fetch(`${this.apiBase}/auth/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      console.log(result)

      if (result.success) {
        this.showAlert("Login berhasil! Mengalihkan...", "success");

        // Store user data
        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("userType", result.user_type);

        // Redirect based on user type
        setTimeout(() => {
          if (result.user_type === "officers") {
            window.location.href = "officer/dashboard.php";
          } else {
            window.location.href = "member/dashboard.php";
          }
        }, 1000);
      } else {
        this.showAlert(result.message, "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showAlert("Terjadi kesalahan sistem", "error");
    }
  }

  async handleRegister(form) {
    const formData = new FormData(form);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      phone: formData.get("phone"),
      address: formData.get("address"),
    };

    // Client-side validation
    if (data.password.length < 6) {
      this.showAlert("Password minimal 6 karakter", "error");
      return;
    }

    if (!this.isValidEmail(data.email)) {
      this.showAlert("Format email tidak valid", "error");
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/auth/register.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        this.showAlert("Registrasi berhasil! Silakan login.", "success");

        // Switch to login tab
        setTimeout(() => {
          this.switchTab("login");
          form.reset();
        }, 1500);
      } else {
        this.showAlert(result.message, "error");
      }
    } catch (error) {
      console.error("Register error:", error);
      this.showAlert("Terjadi kesalahan sistem", "error");
    }
  }

  checkAuthStatus() {
    const user = localStorage.getItem("user");
    const userType = localStorage.getItem("userType");

    if (user && userType) {
      // User is already logged in, redirect to dashboard
      if (userType === "officers") {
        window.location.href = "officer/dashboard.php";
      } else {
        window.location.href = "member/dashboard.php";
      }
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showAlert(message, type) {
    // Remove existing alerts
    const existingAlert = document.querySelector(".alert");
    if (existingAlert) {
      existingAlert.remove();
    }

    // Create new alert
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // Insert alert at the top of the auth card
    const authCard = document.querySelector(".auth-card");
    authCard.insertBefore(alert, authCard.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new AuthManager();
});

// Global logout function
function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("userType");
  window.location.href = "../index.php";
}
