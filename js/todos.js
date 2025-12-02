// ----- Todo CRUD Operations -----

function addTodo(text, dueDate = null, dueTime = null) {
  if (!text.trim()) return;
  const category = categorizeTask(text);
  const newTodo = {
    id: Date.now().toString(),
    text: text.trim(),
    completed: false,
    createdAt: Date.now(),
    dueDate: dueDate || null,
    dueTime: dueTime || null,
    category: category,
    priority: calculatePriority({ text, dueDate, dueTime, completed: false })
  };
  todos.push(newTodo);
  saveTodos();
  render();
}

function toggleTodo(id) {
  todos = todos.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  render();
}

function enterEditMode(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  
  const li = document.querySelector(`.todo-item[data-id="${id}"]`);
  if (!li || li.classList.contains("editing")) return;
  
  li.classList.add("editing");
  
  const content = li.querySelector(".todo-content");
  const textSpan = content.querySelector(".todo-text");
  const meta = content.querySelector(".todo-meta");
  const actions = li.querySelector(".todo-actions");
  
  // Store original values
  const originalText = todo.text;
  const originalDate = todo.dueDate || "";
  const originalTime = todo.dueTime || "";
  
  // Create edit form
  const editForm = document.createElement("div");
  editForm.className = "edit-form";
  
  // Text input
  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.className = "edit-text-input";
  textInput.value = originalText;
  textInput.placeholder = "Task description";
  
  // Date and time inputs container
  const dateTimeContainer = document.createElement("div");
  dateTimeContainer.className = "edit-datetime-container";
  
  // Date input
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "edit-date-input";
  dateInput.value = originalDate;
  
  // Time input
  const timeInput = document.createElement("input");
  timeInput.type = "time";
  timeInput.className = "edit-time-input";
  timeInput.value = originalTime;
  
  // Remove date/time checkbox
  const removeDateTimeLabel = document.createElement("label");
  removeDateTimeLabel.className = "remove-datetime-label";
  const removeDateTimeCheckbox = document.createElement("input");
  removeDateTimeCheckbox.type = "checkbox";
  removeDateTimeCheckbox.className = "remove-datetime-checkbox";
  removeDateTimeLabel.appendChild(removeDateTimeCheckbox);
  removeDateTimeLabel.appendChild(document.createTextNode(" Remove due date"));
  
  dateTimeContainer.appendChild(dateInput);
  dateTimeContainer.appendChild(timeInput);
  dateTimeContainer.appendChild(removeDateTimeLabel);
  
  // Action buttons
  const editActions = document.createElement("div");
  editActions.className = "edit-actions";
  
  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "save-btn";
  saveBtn.textContent = "Save";
  
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "cancel-btn";
  cancelBtn.textContent = "Cancel";
  
  editActions.appendChild(saveBtn);
  editActions.appendChild(cancelBtn);
  
  editForm.appendChild(textInput);
  editForm.appendChild(dateTimeContainer);
  editForm.appendChild(editActions);
  
  // Replace content with edit form
  content.style.display = "none";
  actions.style.display = "none";
  content.parentNode.insertBefore(editForm, content);
  
  // Focus text input
  textInput.focus();
  textInput.select();
  
  // Save handler
  const handleSave = () => {
    const newText = textInput.value.trim();
    if (!newText) {
      alert("Task description cannot be empty!");
      return;
    }
    
    todo.text = newText;
    
    if (removeDateTimeCheckbox.checked) {
      todo.dueDate = null;
      todo.dueTime = null;
    } else {
      const newDate = dateInput.value || null;
      const newTime = timeInput.value || null;
      todo.dueDate = newDate;
      todo.dueTime = newTime;
    }
    
    saveTodos();
    render();
  };
  
  // Cancel handler
  const handleCancel = () => {
    render();
  };
  
  // Event listeners
  saveBtn.addEventListener("click", handleSave);
  cancelBtn.addEventListener("click", handleCancel);
  
  // Enter key to save, Escape to cancel
  textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  });
  
  dateInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  });
  
  timeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  });
}

// Legacy function name for compatibility
function editTodo(id) {
  enterEditMode(id);
}

