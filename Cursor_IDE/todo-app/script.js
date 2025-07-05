// Get elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

// Load todos from localStorage
let todos = JSON.parse(localStorage.getItem('todos')) || [];

function renderTodos() {
  todoList.innerHTML = '';
  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    if (todo.completed) li.classList.add('completed');

    const span = document.createElement('span');
    span.textContent = todo.text;
    span.style.cursor = 'pointer';
    span.onclick = () => toggleTodo(idx);
    li.appendChild(span);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'delete-btn';
    delBtn.onclick = () => deleteTodo(idx);
    li.appendChild(delBtn);

    todoList.appendChild(li);
  });
}

function addTodo(e) {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (text) {
    todos.push({ text, completed: false });
    todoInput.value = '';
    saveTodos();
    renderTodos();
  }
}

function toggleTodo(idx) {
  todos[idx].completed = !todos[idx].completed;
  saveTodos();
  renderTodos();
}

function deleteTodo(idx) {
  todos.splice(idx, 1);
  saveTodos();
  renderTodos();
}

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

todoForm.addEventListener('submit', addTodo);

renderTodos();
