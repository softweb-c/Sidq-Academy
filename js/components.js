// reusable components, toast, skeletons, stars

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `px-5 py-3 rounded-xl shadow-lg text-white flex items-center gap-2 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} transition-all duration-300`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function renderStars(ratingValue, onRate) {
  const container = document.createElement('div');
  container.className = 'flex gap-1 my-2';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('i');
    star.className = `fas fa-star cursor-pointer transition ${ratingValue >= i ? 'text-yellow-400' : 'text-gray-300'} text-sm`;
    star.addEventListener('click', (e) => { e.stopPropagation(); onRate(i); });
    container.appendChild(star);
  }
  return container;
}

function createCourseCard(course, userEnrollment, userId, onRefreshCard) {
  const isEnrolled = !!userEnrollment;
  const isCompleted = userEnrollment?.status === 'completed';
  const userRating = userEnrollment?.rating || 0;
  // Mock completion percentage for enrolled but not completed (simulate based on random or lessons visited)
  let progressPercent = 0;
  if (isEnrolled && !isCompleted) {
    const storedProgress = localStorage.getItem(`progress_${userId}_${course.id}`);
    progressPercent = storedProgress ? parseInt(storedProgress) : Math.floor(Math.random() * 80) + 10;
    localStorage.setItem(`progress_${userId}_${course.id}`, progressPercent);
  } else if (isCompleted) {
    progressPercent = 100;
  }

  const card = document.createElement('div');
  card.className = 'course-card relative w-[280px] flex-shrink-0 bg-white rounded-2xl shadow-md hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden group';
  card.innerHTML = `
    <div class="relative h-36 overflow-hidden">
      <img src="${course.imageUrl}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt="${course.title}">
      <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">${course.difficulty}</div>
      ${isEnrolled ? `<div class="absolute bottom-2 left-2 right-2 bg-white/90 rounded-full h-1.5 overflow-hidden"><div class="bg-[#2563EB] h-full rounded-full" style="width: ${progressPercent}%"></div></div>` : ''}
    </div>
    <div class="p-4">
      <div class="flex justify-between items-start mb-1">
        <h3 class="font-bold text-gray-800 text-lg truncate">${course.title}</h3>
        <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">${course.category}</span>
      </div>
      <div class="flex items-center justify-between mt-3">
        <div class="rating-stars flex gap-1"></div>
        <div class="flex gap-2">
          ${!isCompleted ? `<button class="action-btn text-xs bg-[#2563EB] text-white px-3 py-1.5 rounded-full shadow hover:bg-blue-700 transition">${!isEnrolled ? 'Start' : 'Continue'}</button>` : `<button disabled class="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full"><i class="fas fa-check-circle"></i> Completed</button>`}
          ${isEnrolled && !isCompleted ? `<button class="complete-btn text-xs border border-green-500 text-green-600 px-3 py-1.5 rounded-full hover:bg-green-50 transition">Complete</button>` : ''}
        </div>
      </div>
      ${isEnrolled && !isCompleted ? `<div class="mt-2 text-right text-xs text-gray-500">${progressPercent}% complete</div>` : ''}
    </div>
  `;

  const ratingDiv = card.querySelector('.rating-stars');
  const starWidget = renderStars(userRating, async (value) => {
    try {
      await mockApi.rateCourse(userId, course.id, value);
      showToast(`⭐ Rated ${value} stars`, 'success');
      onRefreshCard();
    } catch (e) {
      showToast(e.message, 'error');
    }
  });
  ratingDiv.appendChild(starWidget);

  // Action button (Start/Continue)
  const actionBtn = card.querySelector('.action-btn');
  if (actionBtn) {
    actionBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const courseId = course.id;
      if (!isEnrolled) {
        try {
          await mockApi.enrolCourse(userId, courseId);
          showToast(`Enrolled in ${course.title}! Redirecting...`, 'success');
          sessionStorage.setItem('pendingCourseId', courseId);
          setTimeout(() => { window.location.href = `/course.html?id=${courseId}`; }, 300);
        } catch (err) { showToast(err.message, 'error'); }
      } else {
        window.location.href = `/course.html?id=${courseId}`;
      }
    });
  }

  const completeBtn = card.querySelector('.complete-btn');
  if (completeBtn) {
    completeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await mockApi.completeCourse(userId, course.id);
        showToast(`✅ Completed ${course.title}`, 'success');
        onRefreshCard();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }
  return card;
}

async function renderRow(title, courses, userId, containerId, refreshCallback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const rowDiv = document.createElement('div');
  rowDiv.className = 'mb-8';
  rowDiv.innerHTML = `<div class="flex justify-between items-baseline mb-3"><h2 class="text-xl font-bold text-gray-800">${title}</h2><span class="text-xs text-gray-400">scroll →</span></div><div class="flex overflow-x-auto scrollbar-hide gap-5 pb-4"></div>`;
  const scrollDiv = rowDiv.querySelector('.overflow-x-auto');
  for (let course of courses) {
    const enrollment = userId ? await getUserEnrollment(userId, course.id) : null;
    const card = createCourseCard(course, enrollment, userId, refreshCallback);
    scrollDiv.appendChild(card);
  }
  container.appendChild(rowDiv);
}

async function getUserEnrollment(userId, courseId) {
  const enrolls = await mockApi.getUserProgress(userId);
  return enrolls.find(e => e.courseId === courseId);
}

// ------------------------------------------------------------
// NEW: Standalone welcome card (no course)
// ------------------------------------------------------------
function renderWelcomeCard(userName) {
  const hour = new Date().getHours();
  let greeting = '';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  return `
    <div class="bg-white rounded-2xl shadow-md p-5 mb-6 border-l-4 border-[#2563EB]">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p class="text-sm text-gray-500">${greeting},</p>
          <h2 class="text-2xl md:text-3xl font-bold text-gray-800">${userName} 👋</h2>
          <p class="text-sm text-gray-500 mt-1">Ready to continue your learning journey?</p>
        </div>
        <div class="bg-[#2563EB]/10 rounded-full p-3">
          <i class="fas fa-graduation-cap text-2xl text-[#2563EB]"></i>
        </div>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------
// NEW: Featured course hero banner (blue gradient, no greeting)
// ------------------------------------------------------------
// Renders the featured course hero banner with a subtle greeting at the top
function renderFeaturedHero(userName, course) {
  if (!course) return '';
  const hour = new Date().getHours();
  let greeting = '';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  return `
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] shadow-2xl">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div class="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl -ml-20 -mb-20"></div>
      <div class="relative p-6 pb-4">
        <!-- Greeting line – subtle, no extra margin -->
        <div class="flex justify-between items-center mb-2">
          <p class="text-white/70 text-sm font-light tracking-wide">${greeting}, <span class="font-semibold text-white">${userName}</span> 👋</p>
          <div class="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white/80">
            <i class="fas fa-graduation-cap mr-1"></i> Learner
          </div>
        </div>
      </div>
      <div class="flex flex-col md:flex-row items-center justify-between px-6 pb-8 md:px-10 md:pb-10 gap-6">
        <div class="flex-1 text-white">
          <span class="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold backdrop-blur-sm mb-3">🌟 Featured Course</span>
          <h1 class="text-3xl md:text-4xl font-bold mb-2">${course.title}</h1>
          <p class="text-white/80 text-base mb-4">${course.description}</p>
          <button id="heroStartBtn" class="group bg-white text-[#2563EB] px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
            <i class="fas fa-play"></i> Start Learning
            <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>
        <div class="flex-1 flex justify-center">
          <div class="relative w-40 h-40 md:w-52 md:h-52 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/20">
            <div id="heroLottie" style="width: 80%; height: 80%;"></div>
            <div class="absolute -bottom-3 -right-3 bg-yellow-400 text-[#1E3A8A] rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold shadow-lg">⭐</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Export functions to global window object
window.createCourseCard = createCourseCard;
window.renderRow = renderRow;
window.showToast = showToast;
window.getUserEnrollment = getUserEnrollment;
window.renderWelcomeCard = renderWelcomeCard;
window.renderFeaturedHero = renderFeaturedHero;