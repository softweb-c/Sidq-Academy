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
    if (!['/login.html','/register.html'].some(p => location.pathname.endsWith(p))) window.location.href = '/login.html';
  }
  const profileBtn = document.getElementById('profileBtn');
  const dropdown = document.getElementById('dropdownMenu');
  if (profileBtn && dropdown) profileBtn.addEventListener('click', () => dropdown.classList.toggle('hidden'));
  const logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', () => { mockApi.logout(); showToast('Logged out'); setTimeout(()=> location.href='/login.html',500); });
  // login page handlers
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => { e.preventDefault();
      try { const user = await mockApi.login(loginEmail.value, loginPassword.value); mockApi.setCurrentUser(user); showToast('Welcome back!'); location.href='/index.html'; } catch(err){ showToast(err.message,'error'); }
    });
    document.getElementById('demoAdminBtn')?.addEventListener('click', async () => { const u = await mockApi.login('admin@sidq.com','admin123'); mockApi.setCurrentUser(u); location.href='/index.html'; });
    document.getElementById('demoUserBtn')?.addEventListener('click', async () => { const u = await mockApi.login('user@sidq.com','user123'); mockApi.setCurrentUser(u); location.href='/index.html'; });
  }
  const regForm = document.getElementById('registerForm');
  if (regForm) regForm.addEventListener('submit', async (e) => { e.preventDefault(); try { const u = await mockApi.register(regEmail.value, regPassword.value); mockApi.setCurrentUser(u); showToast('Registered!'); location.href='/index.html'; } catch(err){ showToast(err.message,'error'); } });
  // Glassmorphic navbar on scroll
const navbar = document.getElementById('mainNavbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  });
  // Trigger once to set initial state
  if (window.scrollY > 20) navbar.classList.add('navbar-scrolled');
}
});
 