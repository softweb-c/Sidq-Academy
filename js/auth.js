// Auth logic: login/register, demo, navbar updates
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = mockApi.getCurrentUser();
  if (currentUser) {
    const emailSpan = document.getElementById('userEmailDisplay');
    if (emailSpan) emailSpan.innerText = currentUser.email.split('@')[0];
    const dropdownEmail = document.getElementById('dropdownUserEmail');
    if (dropdownEmail) dropdownEmail.innerText = currentUser.email;
    const adminLink = document.getElementById('adminNavLink');
    if (adminLink && currentUser.role === 'admin') adminLink.classList.remove('hidden');
  } else if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
    if (!['/login.html', '/register.html'].some(p => location.pathname.endsWith(p))) {
      window.location.href = '/login.html';
      return;
    }
  }

  // Profile dropdown
  const profileBtn = document.getElementById('profileBtn');
  const dropdown = document.getElementById('dropdownMenu');
  if (profileBtn && dropdown) {
    profileBtn.addEventListener('click', () => dropdown.classList.toggle('hidden'));
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }

  // Logout
  const logout = document.getElementById('logoutBtn');
  if (logout) {
    logout.addEventListener('click', () => {
      mockApi.logout();
      if (typeof showToast === 'function') showToast('Logged out', 'success');
      setTimeout(() => location.href = '/login.html', 500);
    });
  }

  // ---------- LOGIN PAGE ----------
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      if (!email || !password) {
        if (typeof showToast === 'function') showToast('Please enter email and password', 'error');
        return;
      }
      try {
        const user = await mockApi.login(email, password);
        mockApi.setCurrentUser(user);
        if (typeof showToast === 'function') showToast('Welcome back!', 'success');
        // Role‑based redirect
        if (user.role === 'admin') {
          location.href = '/admin.html';
        } else {
          location.href = '/index.html';
        }
      } catch (err) {
        if (typeof showToast === 'function') showToast(err.message, 'error');
        if (passwordInput) passwordInput.value = '';
      }
    });

    // Demo buttons
    const demoAdmin = document.getElementById('demoAdminBtn');
    const demoUser = document.getElementById('demoUserBtn');
    if (demoAdmin) {
      demoAdmin.addEventListener('click', async () => {
        const u = await mockApi.login('admin@sidq.com', 'admin123');
        mockApi.setCurrentUser(u);
        location.href = '/admin.html';
      });
    }
    if (demoUser) {
      demoUser.addEventListener('click', async () => {
        const u = await mockApi.login('user@sidq.com', 'user123');
        mockApi.setCurrentUser(u);
        location.href = '/index.html';
      });
    }
  }

 // ---------- REGISTER PAGE ----------
const regForm = document.getElementById('registerForm');
if (regForm) {
  const regName = document.getElementById('regName');
  const regEmail = document.getElementById('regEmail');
  const regPassword = document.getElementById('regPassword');

  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = regName ? regName.value.trim() : '';
    const email = regEmail ? regEmail.value.trim() : '';
    const password = regPassword ? regPassword.value : '';

    if (!name || !email || !password) {
      if (typeof showToast === 'function') showToast('Please fill all fields', 'error');
      return;
    }
    if (password.length < 4) {
      if (typeof showToast === 'function') showToast('Password must be at least 4 characters', 'error');
      return;
    }
    try {
      const u = await mockApi.register(name, email, password);
      mockApi.setCurrentUser(u);
      if (typeof showToast === 'function') showToast('Registered! You are now logged in.', 'success');
      location.href = '/index.html'; // new users are always 'user' role
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message, 'error');
    }
  });
}

  // ---------- GLASSMORPHIC NAVBAR ON SCROLL ----------
  const navbar = document.getElementById('mainNavbar');
  if (navbar) {
    function updateNavbar() {
      if (window.scrollY > 20) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    }
    window.addEventListener('scroll', updateNavbar);
    updateNavbar(); // set initial state
  }
});