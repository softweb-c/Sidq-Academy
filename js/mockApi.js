// mockApi.js – with manual image mapping per course (Option 2)
const STORAGE_KEYS = {
  USERS: 'app_users',
  COURSES: 'app_courses',
  USER_COURSES: 'app_user_courses'
};

function seedInitialData() {
  // Users
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const users = [
  { id: 'u1', name: 'Admin User', email: 'admin@sidq.com', password: 'admin123', role: 'admin' },
  { id: 'u2', name: 'Regular User', email: 'user@sidq.com', password: 'user123', role: 'user' }
];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
  
  // Courses (15 realistic)
  if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
    const courses = [];
    const titles = [
      'React Mastery', 'Python for Data', 'UI/UX Fundamentals', 'Node.js Backend',
      'Machine Learning A-Z', 'Figma to Code', 'SQL Database Design', 'Cloud Computing Intro',
      'JavaScript Deep Dive', 'Data Visualization', 'Responsive Design', 'AI Basics',
      'Cybersecurity', 'DevOps Pipeline', 'Mobile Flutter'
    ];
    
    // ---------- MANUAL IMAGE MAPPING (edit these filenames as you like) ----------
    // Map each course ID (c1..c15) to the exact image filename in /assets/course-images/
    const imageMapping = {
      c1: 'c1.jpg',
      c2: 'c2.jpg',
      c3: 'c3.jpg',
      c4: 'c4.jpg',
      c5: 'c5.jpg',
      c6: 'c3.jpg',
      c7: 'c13.jpg',
      c8: 'c9.jpg',
      c9: 'c6.jpg',
      c10: 'c7.jpg',
      c11: 'c8.jpg',
      c12: 'c10.jpg',
      c13: 'c11.jpg',
      c14: 'c12.jpg',
      c15: 'c8.jpg'
    };
    // ----------------------------------------------------------------------------
    
    for (let i = 0; i < 15; i++) {
      const courseId = `c${i+1}`;
      const imageFile = imageMapping[courseId] || 'default.jpg'; // fallback
      
      courses.push({
        id: courseId,
        title: titles[i],
        description: `Learn ${titles[i]} step by step.`,
        category: ['Web Dev', 'Data Science', 'Design'][i % 3],
        difficulty: ['Beginner', 'Intermediate', 'Advanced'][i % 3],
        imageUrl: `/assets/course-images/${imageFile}`,
        featured: i === 0,
        estimatedHours: 5 + (i % 15)
      });
    }
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  }
  
  // User enrollments (demo for user@sidq.com)
  if (!localStorage.getItem(STORAGE_KEYS.USER_COURSES)) {
    const enrollments = [];
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const userObj = users.find(u => u.email === 'user@sidq.com');
    if (userObj) {
      enrollments.push({ userId: userObj.id, courseId: 'c1', status: 'completed', rating: 5, completedAt: new Date().toISOString() });
      enrollments.push({ userId: userObj.id, courseId: 'c2', status: 'enrolled', rating: null, completedAt: null });
      enrollments.push({ userId: userObj.id, courseId: 'c3', status: 'completed', rating: 4, completedAt: new Date(Date.now() - 86400000).toISOString() });
      enrollments.push({ userId: userObj.id, courseId: 'c4', status: 'enrolled', rating: null, completedAt: null });
    }
    localStorage.setItem(STORAGE_KEYS.USER_COURSES, JSON.stringify(enrollments));
  }
}
seedInitialData();

const mockApi = {
  login: (email, password) => new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        resolve({ id: user.id, name: user.name, email: user.email, role: user.role });
      } else {
        reject(new Error('Invalid email or password'));
      }
    }, 300);
  }),
  register: (name, email, password) => new Promise((resolve, reject) => {
  setTimeout(() => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    if (users.find(u => u.email === email)) {
      reject(new Error('Email already exists'));
      return;
    }
    const newUser = { id: 'u' + Date.now(), name, email, password, role: 'user' };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    resolve({ id: newUser.id, name: newUser.name, email: newUser.email, role: 'user' });
  }, 300);
}),
  getCurrentUser: () => JSON.parse(localStorage.getItem('currentUser')),
  setCurrentUser: (user) => localStorage.setItem('currentUser', JSON.stringify(user)),
  logout: () => localStorage.removeItem('currentUser'),
  getCourses: () => new Promise(resolve => setTimeout(() => resolve(JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES))), 200)),
  getUserProgress: (userId) => new Promise(resolve => {
    const uc = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_COURSES)).filter(e => e.userId === userId);
    resolve(uc);
  }),
  enrolCourse: (userId, courseId) => new Promise((resolve, reject) => {
    let enrollments = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_COURSES));
    if (enrollments.find(e => e.userId === userId && e.courseId === courseId)) return reject(new Error('Already enrolled'));
    enrollments.push({ userId, courseId, status: 'enrolled', rating: null, completedAt: null });
    localStorage.setItem(STORAGE_KEYS.USER_COURSES, JSON.stringify(enrollments));
    resolve({ success: true });
  }),
  completeCourse: (userId, courseId) => new Promise((resolve, reject) => {
    let enrollments = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_COURSES));
    const idx = enrollments.findIndex(e => e.userId === userId && e.courseId === courseId);
    if (idx === -1) reject(new Error('Not enrolled'));
    else if (enrollments[idx].status === 'completed') reject(new Error('Already completed'));
    else {
      enrollments[idx].status = 'completed';
      enrollments[idx].completedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.USER_COURSES, JSON.stringify(enrollments));
      resolve({ success: true });
    }
  }),
  rateCourse: (userId, courseId, rating) => new Promise((resolve, reject) => {
    let enrollments = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_COURSES));
    const idx = enrollments.findIndex(e => e.userId === userId && e.courseId === courseId);
    if (idx === -1) reject(new Error('Enroll first'));
    else {
      enrollments[idx].rating = rating;
      localStorage.setItem(STORAGE_KEYS.USER_COURSES, JSON.stringify(enrollments));
      resolve({ success: true });
    }
  }),
  adminCreateCourse: (courseData) => new Promise(resolve => {
    const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES));
    const newCourse = { id: `c${Date.now()}`, ...courseData };
    courses.push(newCourse);
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    resolve(newCourse);
  }),
  adminUpdateCourse: (courseId, updates) => new Promise(resolve => {
    let courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES));
    const idx = courses.findIndex(c => c.id === courseId);
    courses[idx] = { ...courses[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    resolve(courses[idx]);
  }),
  adminDeleteCourse: (courseId) => new Promise(resolve => {
    let courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES));
    courses = courses.filter(c => c.id !== courseId);
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    resolve();
  }),
  getPlatformStats: () => new Promise(resolve => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES));
    const enrollments = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_COURSES));
    const totalUsers = users.length;
    const totalCourses = courses.length;
    const totalEnrollments = enrollments.length;
    const totalCompletions = enrollments.filter(e => e.status === 'completed').length;
    const courseCompletionCount = {};
    enrollments.forEach(e => {
      if (e.status === 'completed') {
        courseCompletionCount[e.courseId] = (courseCompletionCount[e.courseId] || 0) + 1;
      }
    });
    const popularCourses = Object.entries(courseCompletionCount)
      .map(([courseId, count]) => ({ courseId, count, title: courses.find(c => c.id === courseId)?.title || 'Unknown' }))
      .sort((a,b) => b.count - a.count)
      .slice(0,5);
    resolve({ totalUsers, totalCourses, totalEnrollments, totalCompletions, popularCourses });
  }),
  getCategoryDistribution: () => new Promise(resolve => {
    const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES));
    const distribution = {};
    courses.forEach(c => { distribution[c.category] = (distribution[c.category] || 0) + 1; });
    resolve(distribution);
  }),
  getDailyActiveUsers: () => new Promise(resolve => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = days.map(() => Math.floor(Math.random() * 50) + 10);
    resolve({ days, counts });
  })
};
window.mockApi = mockApi;