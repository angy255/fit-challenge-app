// ================================
// LIVE TIME UPDATE USING MOMENT.JS
// ================================
document.addEventListener('DOMContentLoaded', () => {
  const h3 = document.getElementById('current-time');
  if (h3) {
    setInterval(() => {
      const now = moment();
      h3.textContent = 'Current time: ' + now.format('MMMM Do YYYY, h:mm:ss a');
    }, 1000);
  }

  // Initialize task planner
  if (document.getElementById('daily-schedule')) {
    initTaskPlanner();
  }
});

// ================================
// TASK PLANNER FUNCTIONALITY
// ================================

let draggedTaskElement = null;
let draggedTaskId = null;

function initTaskPlanner() {
  createTimeSlots();
  loadTasks();
  setupTaskForm();
}

// create time slots from 6am to 10pm
function createTimeSlots() {
  const schedule = document.getElementById('daily-schedule');
  
  for (let hour = 6; hour <= 22; hour++) {
    const hourStr = hour.toString().padStart(2, '0') + ':00';
    const displayTime = formatTime(hour);
    
    const slot = document.createElement('div');
    slot.className = 'time-slot';
    slot.dataset.time = hourStr;
    slot.innerHTML = `
      <div class="time-label">${displayTime}</div>
      <div class="task-drop-zone" data-time="${hourStr}"></div>
    `;
    
    schedule.appendChild(slot);
    
    // make droppable
    const dropZone = slot.querySelector('.task-drop-zone');
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDrop);
  }
}

function formatTime(hour) {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}

// load tasks from server
function loadTasks() {
  fetch('/tasks/today')
    .then(response => response.json())
    .then(tasks => {
      renderTasks(tasks);
    })
    .catch(err => console.error('Error loading tasks:', err));
}

// render tasks in appropriate locations
function renderTasks(tasks) {
  // clear existing tasks
  document.querySelectorAll('.task-drop-zone').forEach(zone => zone.innerHTML = '');
  document.getElementById('task-pool').innerHTML = '';
  
  tasks.forEach(task => {
    const taskEl = createTaskElement(task);
    
    if (task.timeSlot) {
      // place in time slot
      const zone = document.querySelector(`.task-drop-zone[data-time="${task.timeSlot}"]`);
      if (zone) zone.appendChild(taskEl);
    } else {
      // place in unscheduled pool
      document.getElementById('task-pool').appendChild(taskEl);
    }
  });
}

// create task element
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'message task-item';
  li.draggable = true;
  li.dataset.id = task._id;
  
  li.innerHTML = `
    <span class="task-text">${task.task}</span>
    <span class="delete-task"><i class="fa fa-heart-circle-xmark" aria-hidden="true"></i></span>
  `;
  
  // drag events
  li.addEventListener('dragstart', handleDragStart);
  li.addEventListener('dragend', handleDragEnd);
  
  // delete
  li.querySelector('.delete-task').addEventListener('click', () => deleteTask(task._id));
  
  return li;
}

// setup task form
function setupTaskForm() {
  const form = document.getElementById('task-form');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('task-input');
    const taskText = input.value.trim();
    
    if (!taskText) {
      alert('Please enter a task');
      return;
    }
    
    fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: taskText })
    })
    .then(response => response.json())
    .then(data => {
      input.value = '';
      loadTasks();
    })
    .catch(err => console.error('Error adding task:', err));
  });
}

// drag handlers
function handleDragStart(e) {
  draggedTaskElement = this;
  draggedTaskId = this.dataset.id;
  this.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  this.style.opacity = '1';
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  e.preventDefault();
  
  const timeSlot = this.dataset.time || null;
  
  // update task on server
  fetch(`/tasks/${draggedTaskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeSlot: timeSlot })
  })
  .then(response => response.json())
  .then(data => {
    loadTasks();
  })
  .catch(err => console.error('Error updating task:', err));
  
  return false;
}

// delete task
function deleteTask(taskId) {
  if (!confirm('Delete this task?')) return;
  
  fetch(`/tasks/${taskId}`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(data => {
    loadTasks();
  })
  .catch(err => console.error('Error deleting task:', err));
}

// make task pool droppable
document.addEventListener('DOMContentLoaded', () => {
  const taskPool = document.getElementById('task-pool');
  if (taskPool) {
    taskPool.addEventListener('dragover', handleDragOver);
    taskPool.addEventListener('drop', handleDrop);
  }
});

// had help from Claude