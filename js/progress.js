// progress.js - enhanced role-based analytics
(async function() {
  const user = mockApi.getCurrentUser();
  if (!user) return;

  const isAdmin = user.role === 'admin';
  const grid = document.getElementById('progressGrid');
  if (!grid) return;

  if (isAdmin) {
    // ---------- ADMIN ANALYTICS ----------
    const stats = await mockApi.getPlatformStats();
    const categoryDist = await mockApi.getCategoryDistribution();
    const activeUsers = await mockApi.getDailyActiveUsers();

    grid.innerHTML = `
      <div class="col-span-full">
        <h2 class="text-2xl font-bold mb-6">📊 Platform Analytics</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"><i class="fas fa-users text-3xl mb-2"></i><p class="text-sm opacity-90">Total Users</p><p class="text-3xl font-bold">${stats.totalUsers}</p></div>
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"><i class="fas fa-book-open text-3xl mb-2"></i><p class="text-sm opacity-90">Total Courses</p><p class="text-3xl font-bold">${stats.totalCourses}</p></div>
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"><i class="fas fa-graduation-cap text-3xl mb-2"></i><p class="text-sm opacity-90">Total Completions</p><p class="text-3xl font-bold">${stats.totalCompletions}</p></div>
          <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg"><i class="fas fa-chart-line text-3xl mb-2"></i><p class="text-sm opacity-90">Avg. Completion Rate</p><p class="text-3xl font-bold">${stats.totalEnrollments ? Math.round((stats.totalCompletions/stats.totalEnrollments)*100) : 0}%</p></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl shadow p-5"><h3 class="font-bold mb-4">🏆 Most Popular Courses</h3><ul id="popularList" class="space-y-3"></ul></div>
          <div class="bg-white rounded-2xl shadow p-5"><h3 class="font-bold mb-4">📈 Weekly Active Users</h3><canvas id="activeUsersChart" height="200"></canvas></div>
          <div class="bg-white rounded-2xl shadow p-5"><h3 class="font-bold mb-4">📂 Course Categories</h3><canvas id="categoryDistChart" height="200"></canvas></div>
          <div class="bg-white rounded-2xl shadow p-5"><h3 class="font-bold mb-4">🚀 Quick Actions</h3><p class="text-gray-600">Manage courses, view logs, or export data.</p><div class="mt-4 flex gap-3"><button onclick="location.href='/admin.html'" class="bg-[#2563EB] text-white px-4 py-2 rounded-lg">Go to Course Manager</button></div></div>
        </div>
      </div>
    `;
    // Populate popular courses list
    const popularList = document.getElementById('popularList');
    stats.popularCourses.forEach(c => {
      const li = document.createElement('li');
      li.className = 'flex justify-between items-center border-b pb-2';
      li.innerHTML = `<span>${c.title}</span><span class="font-semibold">${c.count} completions</span>`;
      popularList.appendChild(li);
    });
    // Line chart: daily active users
    const ctxLine = document.getElementById('activeUsersChart').getContext('2d');
    new Chart(ctxLine, {
      type: 'line',
      data: { labels: activeUsers.days, datasets: [{ label: 'Active Users', data: activeUsers.counts, borderColor: '#2563EB', tension: 0.3, fill: true, backgroundColor: 'rgba(37,99,235,0.1)' }] },
      options: { responsive: true, maintainAspectRatio: true }
    });
    // Doughnut chart: category distribution
    const ctxDoughnut = document.getElementById('categoryDistChart').getContext('2d');
    new Chart(ctxDoughnut, {
      type: 'doughnut',
      data: { labels: Object.keys(categoryDist), datasets: [{ data: Object.values(categoryDist), backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'] }] }
    });
  } else {
    // ---------- USER ANALYTICS (Enhanced) ----------
    const userId = user.id;
    const allCourses = await mockApi.getCourses();
    const enrollments = await mockApi.getUserProgress(userId);
    const completed = enrollments.filter(e => e.status === 'completed');
    const enrolledTotal = enrollments.length;
    const completionRate = enrolledTotal ? (completed.length/enrolledTotal)*100 : 0;
    const avgRating = completed.filter(c=>c.rating).reduce((a,b)=>a+(b.rating||0),0)/(completed.filter(c=>c.rating).length||1);
    // Calculate total study hours (mock: each completed course = estimatedHours)
    const totalHours = completed.reduce((acc,comp)=> { const crs = allCourses.find(c=>c.id===comp.courseId); return acc + (crs?.estimatedHours||5); },0);
    // Mock weekly activity (past 7 days, random but realistic)
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const weeklyHours = days.map(() => Math.floor(Math.random() * 4) + (Math.random() > 0.7 ? 2 : 0));
    // Category progress (detailed)
    const categories = [...new Set(allCourses.map(c=>c.category))];
    const categoryProgress = categories.map(cat => {
      const totalInCat = allCourses.filter(c=>c.category===cat).length;
      const completedInCat = completed.filter(comp => {
        const crs = allCourses.find(c=>c.id===comp.courseId);
        return crs?.category === cat;
      }).length;
      return totalInCat ? (completedInCat/totalInCat)*100 : 0;
    });
    // Learning streak (mock: days since last activity)
    const lastActivity = completed.length ? new Date(completed[completed.length-1].completedAt) : new Date();
    const streakDays = Math.floor(Math.random() * 15) + 1; // mock

    grid.innerHTML = `
      <div class="col-span-full">
        <h2 class="text-2xl font-bold mb-6">📚 Your Learning Journey</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg"><i class="fas fa-fire text-3xl mb-2"></i><p class="text-sm opacity-90">Current Streak</p><p class="text-3xl font-bold">${streakDays} days</p></div>
          <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"><i class="fas fa-clock text-3xl mb-2"></i><p class="text-sm opacity-90">Study Time</p><p class="text-3xl font-bold">${totalHours}h</p></div>
          <div class="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg"><i class="fas fa-star text-3xl mb-2"></i><p class="text-sm opacity-90">Avg Rating Given</p><p class="text-3xl font-bold">${avgRating.toFixed(1)}</p></div>
          <div class="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg"><i class="fas fa-chalkboard-user text-3xl mb-2"></i><p class="text-sm opacity-90">Completed</p><p class="text-3xl font-bold">${completed.length}/${enrolledTotal}</p></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl shadow p-5"><h3 class="font-bold mb-4">📊 Completion by Category</h3><canvas id="categoryProgressChart" height="200"></canvas></div>
          <div class="bg-white rounded-2xl shadow p-5"><h3 class="font-bold mb-4">⏱️ Weekly Activity (hours)</h3><canvas id="weeklyActivityChart" height="200"></canvas></div>
          <div class="bg-white rounded-2xl shadow p-5 col-span-full lg:col-span-2"><h3 class="font-bold mb-4">🎓 Recent Achievements</h3><div id="recentAchievements" class="flex flex-wrap gap-3"></div></div>
        </div>
      </div>
    `;
    // Category progress bar chart
    const ctxCat = document.getElementById('categoryProgressChart').getContext('2d');
    new Chart(ctxCat, {
      type: 'bar',
      data: { labels: categories, datasets: [{ label: '% Completed', data: categoryProgress, backgroundColor: '#2563EB', borderRadius: 8 }] },
      options: { responsive: true, maintainAspectRatio: true, scales: { y: { max: 100, beginAtZero: true } } }
    });
    // Weekly activity line chart
    const ctxWeekly = document.getElementById('weeklyActivityChart').getContext('2d');
    new Chart(ctxWeekly, {
      type: 'line',
      data: { labels: days, datasets: [{ label: 'Hours Spent', data: weeklyHours, borderColor: '#F59E0B', fill: true, backgroundColor: 'rgba(245,158,11,0.1)' }] },
      options: { responsive: true }
    });
    // Recent achievements (mock badges)
    const achievements = ['🏆 First Course Completed', '⚡ 5-Day Streak', '📚 Explorer (3 categories)', '⭐ First Rating Given'];
    const container = document.getElementById('recentAchievements');
    achievements.forEach(ach => {
      const badge = document.createElement('div');
      badge.className = 'bg-gray-100 px-4 py-2 rounded-full text-sm font-medium text-gray-700 flex items-center gap-2';
      badge.innerHTML = `<i class="fas fa-award text-yellow-500"></i> ${ach}`;
      container.appendChild(badge);
    });
  }
})();