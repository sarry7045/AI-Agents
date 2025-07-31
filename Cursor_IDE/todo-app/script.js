document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');

  // Load todos from localStorage
  let todos = JSON.parse(localStorage.getItem('todos')) || [];
  renderTodos();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = input.value.trim();
    if (text !== '') {
      todos.push({ text, completed: false });
      localStorage.setItem('todos', JSON.stringify(todos));
      input.value = '';
      renderTodos();
    }
  });

  function renderTodos() {
    list.innerHTML = '';
    todos.forEach(function (todo, idx) {
      const li = document.createElement('li');
      if (todo.completed) li.classList.add('completed');
      const span = document.createElement('span');
      span.textContent = todo.text;
      span.addEventListener('click', function () {
        todos[idx].completed = !todos[idx].completed;
        localStorage.setItem('todos', JSON.stringify(todos));
        renderTodos();
      });
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '✕';
      deleteBtn.className = 'delete-button';
      deleteBtn.addEventListener('click', function () {
        todos.splice(idx, 1);
        localStorage.setItem('todos', JSON.stringify(todos));
        renderTodos();
      });
      li.appendChild(span);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  }
});