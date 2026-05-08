// admin.js: table management, modal, and admin stats
(async () => {
  const user = mockApi.getCurrentUser();
  if (!user || user.role !== 'admin') {
    if (typeof showToast === 'function') showToast('Admin access only', 'error');
    setTimeout(() => location.href = '/index.html', 1000);
    return;
  }

  // ----- Welcome Greeting (white card, separate from hero) -----
  const welcomeDiv = document.getElementById('welcomeSection');
  if (welcomeDiv && user && user.name) {
    welcomeDiv.innerHTML = renderWelcomeCard(user.name);
  }

  // ----- Load and display admin stats (top row) -----
  async function loadAdminStats() {
    try {
      const stats = await mockApi.getPlatformStats();
      const courses = await mockApi.getCourses();
      const categories = [...new Set(courses.map(c => c.category))];
      let topCategory = categories[0] || 'N/A';
      if (categories.length > 1) {
        topCategory = categories.reduce((a, b) =>
          courses.filter(c => c.category === a).length > courses.filter(c => c.category === b).length ? a : b
        );
      }
      const statsContainer = document.getElementById('adminStatsGrid');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="bg-white rounded-xl shadow p-4 border-l-4 border-[#2563EB]">
            <p class="text-sm text-gray-500">Total Courses</p>
            <p class="text-2xl font-bold">${stats.totalCourses}</p>
          </div>
          <div class="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
            <p class="text-sm text-gray-500">Total Users</p>
            <p class="text-2xl font-bold">${stats.totalUsers}</p>
          </div>
          <div class="bg-white rounded-xl shadow p-4 border-l-4 border-orange-500">
            <p class="text-sm text-gray-500">Completions (All)</p>
            <p class="text-2xl font-bold">${stats.totalCompletions}</p>
          </div>
          <div class="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
            <p class="text-sm text-gray-500">Top Category</p>
            <p class="text-2xl font-bold truncate">${topCategory}</p>
          </div>
        `;
      }
    } catch (err) {
      console.warn('Could not load admin stats', err);
    }
  }

  // ----- Render courses table -----
  function renderTable() {
    const courses = JSON.parse(localStorage.getItem('app_courses'));
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    courses.forEach(course => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="px-6 py-3">${course.title}</td>
        <td class="px-6 py-3">${course.category}</td>
        <td class="px-6 py-3">${course.difficulty}</td>
        <td class="px-6 py-3 flex gap-2">
          <button class="editBtn text-blue-600" data-id="${course.id}"><i class="fas fa-edit"></i></button>
          <button class="deleteBtn text-red-500" data-id="${course.id}"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.editBtn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const courses = JSON.parse(localStorage.getItem('app_courses'));
        const course = courses.find(c => c.id === id);
        if (!course) return;
        document.getElementById('editCourseId').value = id;
        document.getElementById('courseTitle').value = course.title;
        document.getElementById('courseDesc').value = course.description;
        document.getElementById('courseCategory').value = course.category;
        document.getElementById('courseDifficulty').value = course.difficulty;
        document.getElementById('courseImageUrl').value = course.imageUrl;
        document.getElementById('modalTitle').innerText = 'Edit Course';
        document.getElementById('courseModal').classList.remove('hidden');
      });
    });

    document.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Delete this course? This action cannot be undone.')) {
          await mockApi.adminDeleteCourse(btn.dataset.id);
          if (typeof showToast === 'function') showToast('Course deleted', 'success');
          renderTable();
          loadAdminStats();
        }
      });
    });
  }

  // ----- Modal handlers -----
  const openModalBtn = document.getElementById('openAddModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const saveCourseBtn = document.getElementById('saveCourseBtn');
  const modal = document.getElementById('courseModal');

  if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
      document.getElementById('editCourseId').value = '';
      document.getElementById('courseTitle').value = '';
      document.getElementById('courseDesc').value = '';
      document.getElementById('courseCategory').value = 'Web Dev';
      document.getElementById('courseDifficulty').value = 'Beginner';
      document.getElementById('courseImageUrl').value = '/assets/course-images/default.jpg';
      document.getElementById('modalTitle').innerText = 'Add Course';
      modal.classList.remove('hidden');
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (saveCourseBtn) {
    saveCourseBtn.addEventListener('click', async () => {
      const id = document.getElementById('editCourseId').value;
      const data = {
        title: document.getElementById('courseTitle').value,
        description: document.getElementById('courseDesc').value,
        category: document.getElementById('courseCategory').value,
        difficulty: document.getElementById('courseDifficulty').value,
        imageUrl: document.getElementById('courseImageUrl').value
      };
      if (id) {
        await mockApi.adminUpdateCourse(id, data);
        if (typeof showToast === 'function') showToast('Course updated', 'success');
      } else {
        await mockApi.adminCreateCourse(data);
        if (typeof showToast === 'function') showToast('Course created', 'success');
      }
      modal.classList.add('hidden');
      renderTable();
      loadAdminStats();
    });
  }

  // ----- Initial load -----
  await loadAdminStats();
  renderTable();
})();