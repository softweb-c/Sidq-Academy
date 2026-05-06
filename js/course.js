// course.js – load course, lessons, handle completion
(async function() {
  const user = mockApi.getCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  // Get course ID from URL or sessionStorage
let courseId = new URLSearchParams(window.location.search).get('id');
if (!courseId) {
  // Try sessionStorage (set by dashboard before redirect)
  courseId = sessionStorage.getItem('pendingCourseId');
  if (courseId) {
    console.log('Retrieved course ID from sessionStorage:', courseId);
    sessionStorage.removeItem('pendingCourseId');
  }
}

if (!courseId) {
  console.error('No course ID found');
  showToast('Invalid course link. Redirecting to dashboard.', 'error');
  setTimeout(() => {
    window.location.href = '/index.html';
  }, 1500);
  return;
}

  console.log('Loading course ID:', courseId);

  const allCourses = await mockApi.getCourses();
  const course = allCourses.find(c => c.id === courseId);
  if (!course) {
    showToast('Course not found. Redirecting...', 'error');
    setTimeout(() => window.location.href = '/index.html', 1500);
    return;
  }

  // Get user progress for this course
  const userProgress = await mockApi.getUserProgress(user.id);
  let enrollment = userProgress.find(p => p.courseId === courseId);
  const isCompleted = enrollment?.status === 'completed';
  let isEnrolled = !!enrollment;

  // If not enrolled, automatically enroll
  if (!isEnrolled) {
    try {
      await mockApi.enrolCourse(user.id, courseId);
      showToast('You have been enrolled. Enjoy learning!', 'success');
      isEnrolled = true;
      // Refresh user progress to get updated enrollment
      const updatedProgress = await mockApi.getUserProgress(user.id);
      enrollment = updatedProgress.find(p => p.courseId === courseId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Update UI
  document.getElementById('courseTitle').innerText = course.title;
  document.getElementById('courseDescription').innerText = course.description;
  document.getElementById('courseCategory').innerText = course.category;
  document.getElementById('courseDifficulty').innerHTML = `<i class="fas fa-signal"></i> ${course.difficulty}`;
  const imgEl = document.getElementById('courseImage');
  imgEl.src = course.imageUrl;
  imgEl.onerror = () => { imgEl.src = 'https://picsum.photos/800/300'; };

  // Mock lessons (5 lessons per course)
  const lessons = [
    { title: 'Introduction & Setup', type: 'video', duration: '12 min', content: 'Watch the intro video and set up your environment.' },
    { title: 'Core Concepts', type: 'text', duration: '25 min', content: 'Read through the fundamental principles and best practices.' },
    { title: 'Hands‑on Project', type: 'interactive', duration: '45 min', content: 'Follow along with the step‑by‑step project guide.' },
    { title: 'Advanced Techniques', type: 'video', duration: '18 min', content: 'Deep dive into advanced features and optimizations.' },
    { title: 'Final Assessment', type: 'quiz', duration: '30 min', content: 'Test your knowledge with a short quiz.' }
  ];

  // Simulate progress (if completed, show 100%, else 0)
  let progressPercent = isCompleted ? 100 : 0;
  const circumference = 2 * Math.PI * 28; // ~175.9
  function updateProgressUI() {
    const offset = circumference - (progressPercent / 100) * circumference;
    const circle = document.getElementById('progressCircle');
    if (circle) circle.style.strokeDashoffset = offset;
    const percentSpan = document.getElementById('progressPercent');
    if (percentSpan) percentSpan.innerText = `${progressPercent}%`;
  }
  updateProgressUI();

  // Render lessons
  const container = document.getElementById('lessonsContainer');
  if (container) {
    lessons.forEach((lesson, idx) => {
      const lessonDiv = document.createElement('div');
      lessonDiv.className = 'flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition';
      const icon = lesson.type === 'video' ? 'fa-video' : (lesson.type === 'text' ? 'fa-file-alt' : 'fa-puzzle-piece');
      lessonDiv.innerHTML = `
        <i class="fas ${icon} text-blue-500 mt-1"></i>
        <div class="flex-1">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold">${lesson.title}</h3>
            <span class="text-xs text-gray-400">${lesson.duration}</span>
          </div>
          <p class="text-sm text-gray-600 mt-1">${lesson.content}</p>
          <button class="mock-lesson-btn text-xs text-blue-600 mt-2 underline">Mark this lesson as read</button>
        </div>
      `;
      const mockBtn = lessonDiv.querySelector('.mock-lesson-btn');
      mockBtn.addEventListener('click', () => {
        showToast(`📘 "${lesson.title}" marked complete (demo)`, 'success');
        mockBtn.disabled = true;
        mockBtn.innerText = '✓ Completed';
        mockBtn.classList.remove('text-blue-600', 'underline');
        mockBtn.classList.add('text-green-600', 'no-underline');
      });
      container.appendChild(lessonDiv);
    });
  }

  // Handle "Mark Complete" button
  const completeBtn = document.getElementById('completeCourseBtn');
  if (completeBtn) {
    if (isCompleted) {
      completeBtn.disabled = true;
      completeBtn.innerText = '✓ Completed';
      completeBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
      completeBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
    } else {
      completeBtn.addEventListener('click', async () => {
        try {
          await mockApi.completeCourse(user.id, courseId);
          showToast('🎉 Congratulations! Course completed.', 'success');
          completeBtn.disabled = true;
          completeBtn.innerText = '✓ Completed';
          completeBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
          completeBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
          progressPercent = 100;
          updateProgressUI();
          setTimeout(() => { window.location.href = '/index.html'; }, 2000);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  }
})();