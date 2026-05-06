// admin.js: table management & modal
(async () => {
  const user = mockApi.getCurrentUser();
  if (!user || user.role !== 'admin') { showToast('Admin access only', 'error'); setTimeout(()=> location.href='/index.html',1000); return; }
  function renderTable() {
    const courses = JSON.parse(localStorage.getItem('app_courses'));
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = '';
    courses.forEach(course => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="px-6 py-3">${course.title}</td><td>${course.category}</td><td>${course.difficulty}</td><td class="flex gap-2"><button class="editBtn text-blue-600" data-id="${course.id}"><i class="fas fa-edit"></i></button><button class="deleteBtn text-red-500" data-id="${course.id}"><i class="fas fa-trash"></i></button></td>`;
      tbody.appendChild(tr);
    });
    document.querySelectorAll('.editBtn').forEach(btn => btn.addEventListener('click', async (e) => { const id = btn.dataset.id; const course = courses.find(c=>c.id===id); document.getElementById('editCourseId').value = id; document.getElementById('courseTitle').value = course.title; document.getElementById('courseDesc').value = course.description; document.getElementById('courseCategory').value = course.category; document.getElementById('courseDifficulty').value = course.difficulty; document.getElementById('courseImageUrl').value = course.imageUrl; document.getElementById('modalTitle').innerText='Edit Course'; document.getElementById('courseModal').classList.remove('hidden'); }));
    document.querySelectorAll('.deleteBtn').forEach(btn => btn.addEventListener('click', async () => { await mockApi.adminDeleteCourse(btn.dataset.id); showToast('Deleted'); renderTable(); }));
  }
  renderTable();
  document.getElementById('openAddModalBtn').addEventListener('click',()=>{ document.getElementById('editCourseId').value=''; document.getElementById('courseTitle').value=''; document.getElementById('courseDesc').value=''; document.getElementById('courseCategory').value='Web Dev'; document.getElementById('courseDifficulty').value='Beginner'; document.getElementById('courseImageUrl').value='https://picsum.photos/300/180'; document.getElementById('modalTitle').innerText='Add Course'; document.getElementById('courseModal').classList.remove('hidden'); });
  document.getElementById('closeModalBtn').addEventListener('click',()=>document.getElementById('courseModal').classList.add('hidden'));
  document.getElementById('saveCourseBtn').addEventListener('click',async ()=>{
    const id = document.getElementById('editCourseId').value;
    const data = { title:document.getElementById('courseTitle').value, description:document.getElementById('courseDesc').value, category:document.getElementById('courseCategory').value, difficulty:document.getElementById('courseDifficulty').value, imageUrl:document.getElementById('courseImageUrl').value };
    if(id) await mockApi.adminUpdateCourse(id, data); else await mockApi.adminCreateCourse(data);
    showToast(id?'Updated':'Created'); document.getElementById('courseModal').classList.add('hidden'); renderTable();
  });
})();