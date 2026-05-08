// main.js: home dashboard with recommendation rows
(async function initHome() {
  const user = mockApi.getCurrentUser();
  if (!user) return;
  const userId = user.id;
  const allCourses = await mockApi.getCourses();
  const userEnrollments = await mockApi.getUserProgress(userId);
  const completedIds = userEnrollments.filter(e => e.status === 'completed').map(e => e.courseId);
  const enrolledIds = userEnrollments.map(e => e.courseId);

  // ----- Hero Banner with integrated greeting (no separate welcome card) -----
  const featured = allCourses.find(c => c.featured === true);
  const heroDiv = document.getElementById('heroSection');
  if (heroDiv && featured && user && user.name) {
    // Use the new renderFeaturedHero that includes the greeting inside the banner
    heroDiv.innerHTML = renderFeaturedHero(user.name, featured);
    // Attach hero button event listener
    const heroBtn = document.getElementById('heroStartBtn');
    if (heroBtn) {
      heroBtn.addEventListener('click', async () => {
        const courseId = featured.id;
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
        window.location.href = `/course.html?id=${courseId}`;
      });
    }
    // Load Lottie if available (optional)
    const heroLottie = document.getElementById('heroLottie');
    if (heroLottie && typeof lottie !== 'undefined') {
      lottie.loadAnimation({
        container: heroLottie,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/assets/hero-animation.json'
      });
    }
  }

  // ----- Recommendation Rows -----
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
  if (container) container.innerHTML = '';

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
    container?.appendChild(rowDiv);
  }
})();

// ----- Preloader with Lottie (optional) -----
const loaderContainer = document.getElementById('lottieLoader');
if (loaderContainer && typeof lottie !== 'undefined') {
  lottie.loadAnimation({
    container: loaderContainer,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: '/assets/preloader.json'  // replace with your actual file path
  });
}

// Preloader minimum display time (2 seconds)
let preloaderHidden = false;
const MIN_DISPLAY_MS = 2000;
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
window.addEventListener('load', hidePreloader);

// Scroll to top button
const scrollBtn = document.getElementById('scrollTopBtn');
if (scrollBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) scrollBtn.classList.remove('hidden');
    else scrollBtn.classList.add('hidden');
  });
  scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}