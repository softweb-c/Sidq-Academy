// main.js: home dashboard with recommendation rows
(async function initHome() {
  const user = mockApi.getCurrentUser();
  if (!user) return;
  const userId = user.id;
  const allCourses = await mockApi.getCourses();
  const userEnrollments = await mockApi.getUserProgress(userId);
  const completedIds = userEnrollments.filter(e => e.status === 'completed').map(e => e.courseId);
  const enrolledIds = userEnrollments.map(e => e.courseId);

  // Featured course
  const featured = allCourses.find(c => c.featured === true);
  // ----- Hero Section (Redesigned) -----
const heroDiv = document.getElementById('heroSection');
if (heroDiv && featured) {
  heroDiv.innerHTML = `
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] shadow-2xl mb-12">
      <!-- ...background shapes... -->
      <div class="relative flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8">
        <div class="flex-1 text-white">
          <span class="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold backdrop-blur-sm mb-4">🌟 Featured Course</span>
          <h1 class="text-4xl md:text-5xl font-bold mb-4 leading-tight">${featured.title}</h1>
          <p class="text-white/80 text-lg mb-6 max-w-2xl">${featured.description}</p>
          <div class="flex flex-wrap gap-4 items-center">
            <button id="heroStartBtn" class="group bg-white text-[#2563EB] px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
              <i class="fas fa-play"></i> Start Learning
              <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </button>
            <div class="flex gap-4 text-sm">
              <div class="flex items-center gap-1"><i class="fas fa-chart-line"></i> <span>15+ Courses</span></div>
              <div class="flex items-center gap-1"><i class="fas fa-users"></i> <span>500+ Students</span></div>
            </div>
          </div>
        </div>
        <div class="flex-1 flex justify-center">
          <div class="relative w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/20">
            <div id="heroLottie" style="width: 80%; height: 80%;"></div>
            <div class="absolute -bottom-3 -right-3 bg-yellow-400 text-[#1E3A8A] rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold shadow-lg">⭐</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Load Lottie hero animation
  const heroLottieContainer = document.getElementById('heroLottie');
  if (heroLottieContainer) {
    lottie.loadAnimation({
      container: heroLottieContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/assets/hero-animation.json' // change to your file
    });
  }

  // Attach hero button event listener (as before)
  const heroBtn = document.getElementById('heroStartBtn');
    if (heroBtn) {
      heroBtn.addEventListener('click', async () => {
        const courseId = featured.id;
        if (!courseId) {
          showToast('Course ID missing – cannot start', 'error');
          return;
        }
        // Store in sessionStorage as fallback for course.html
        sessionStorage.setItem('pendingCourseId', courseId);
        const isEnrolled = enrolledIds.includes(courseId);
        if (!isEnrolled) {
          try {
            await mockApi.enrolCourse(userId, courseId);
            showToast(`Enrolled in ${featured.title}! Redirecting...`, 'success');
          } catch (err) {
            showToast(err.message, 'error');
            return;
          }
        }
        // Redirect to the course page with the ID in the URL
        window.location.href = `/course.html?id=${courseId}`;
      });
    }
  }

  let lastCompletedName = 'a Course';
  if (completedIds.length > 0) {
    const lastCourse = allCourses.find(c => c.id === completedIds[completedIds.length-1]);
    if (lastCourse) lastCompletedName = lastCourse.title;
  }

  const rowsDef = [
    { title: '📖 Continue Learning', filter: c => enrolledIds.includes(c.id) && !completedIds.includes(c.id) },
    { 
      title: '🎯 Recommended for You', 
      filter: c => {
        if (enrolledIds.includes(c.id)) return false;
        if (completedIds.length > 0) {
          const lastCompletedCourse = allCourses.find(crs => crs.id === completedIds[completedIds.length-1]);
          const preferredCategory = lastCompletedCourse?.category || 'Web Dev';
          return c.category === preferredCategory || Math.random() > 0.7;
        }
        return c.difficulty === 'Beginner' || c.category === 'Web Dev';
      }
    },
    { 
      title: '⭐ New & Trending', 
      filter: c => { 
        if (completedIds.length === 0 || enrolledIds.includes(c.id)) return false;
        const lastCat = allCourses.find(crs => crs.id === completedIds[completedIds.length-1])?.category;
        return c.category === lastCat;
      }
    },
    { title: '🔥 Popular Courses', filter: c => true },
    { title: '🌱 Beginner Friendly', filter: c => c.difficulty === 'Beginner' && !enrolledIds.includes(c.id) }
  ];

  const container = document.getElementById('dashboardRows');
  container.innerHTML = '';

  for (const row of rowsDef) {
    let filtered = allCourses.filter(row.filter);
    if (row.title === '🔥 Popular Courses') {
      filtered = [...allCourses].sort((a, b) => {
        const countA = userEnrollments.filter(e => e.courseId === a.id && e.status === 'completed').length;
        const countB = userEnrollments.filter(e => e.courseId === b.id && e.status === 'completed').length;
        return countB - countA;
      }).slice(0, 10);
    }
    // Limit all rows to 12 courses
    filtered = filtered.slice(0, 12);

    const rowDiv = document.createElement('div');
    rowDiv.className = 'mb-8';
    rowDiv.innerHTML = `
      <div class="flex justify-between items-baseline mb-3">
        <h2 class="text-xl font-bold text-gray-800">${row.title}</h2>
        <span class="text-xs text-gray-400">→ swipe</span>
      </div>
      <div class="flex overflow-x-auto scrollbar-hide gap-5 pb-4" id="row-${Date.now()}-${row.title.replace(/\s/g, '')}"></div>
    `;
    const scrollDiv = rowDiv.querySelector('.overflow-x-auto');
    for (let course of filtered) {
      const enrollment = await getUserEnrollment(userId, course.id);
      const card = createCourseCard(course, enrollment, userId, () => location.reload());
      scrollDiv.appendChild(card);
    }
    container.appendChild(rowDiv);
  }
})();
// Load Lottie animation for preloader
const loaderContainer = document.getElementById('lottieLoader');
if (loaderContainer) {
  const animation = lottie.loadAnimation({
    container: loaderContainer,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: '/assets/preloader.json'  // 👈 replace with your actual file path
  });
}

// Preloader with minimum display time (2.5 seconds)
let preloaderHidden = false;
const MIN_DISPLAY_MS = 2000; // Change to 2000 for 2 seconds or 3000 for 3 seconds
const preloaderStartTime = Date.now();

function hidePreloader() {
  if (preloaderHidden) return;
  const elapsed = Date.now() - preloaderStartTime;
  const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
  setTimeout(() => {
    const loader = document.getElementById('globalLoader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader?.remove(), 500);
    }
    preloaderHidden = true;
  }, remaining);
}

// Hide preloader when the page is fully loaded, but respect minimum time
window.addEventListener('load', hidePreloader);

// Scroll to top button
const scrollBtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) scrollBtn.classList.remove('hidden');
  else scrollBtn.classList.add('hidden');
});
scrollBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));