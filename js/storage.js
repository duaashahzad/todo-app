// ----- Storage Management -----

function loadTodos() {
  const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
  if (saved) {
    try {
      todos = JSON.parse(saved);
      // Ensure all todos have createdAt for backward compatibility
      todos = todos.map(todo => ({
        ...todo,
        createdAt: todo.createdAt || Date.now(),
        dueDate: todo.dueDate || null,
        dueTime: todo.dueTime || null
      }));
    } catch (e) {
      console.error("Error parsing todos from localStorage", e);
      todos = [];
    }
  }
}

function saveTodos() {
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(todos));
  if (typeof updateAIInsights === 'function') {
    updateAIInsights();
  }
}

