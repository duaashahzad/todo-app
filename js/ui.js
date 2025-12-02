// ----- UI Rendering Functions -----

function render() {
  listEl.innerHTML = "";

  let visibleTodos = todos;
  
  // Apply search filter if active
  if (typeof searchQuery !== "undefined" && searchQuery) {
    visibleTodos = visibleTodos.filter(t => 
      t.text.toLowerCase().includes(searchQuery) ||
      (t.category && t.category.toLowerCase().includes(searchQuery))
    );
  }
  
  // Apply status filter
  if (currentFilter === CONFIG.FILTERS.ACTIVE) {
    visibleTodos = visibleTodos.filter((t) => !t.completed);
  } else if (currentFilter === CONFIG.FILTERS.COMPLETED) {
    visibleTodos = visibleTodos.filter((t) => t.completed);
  } else if (currentFilter === CONFIG.FILTERS.PRIORITY) {
    visibleTodos = visibleTodos.filter((t) => !t.completed && calculatePriority(t) >= 7);
  } else if (currentFilter === CONFIG.FILTERS.DATE) {
    // Date filter is handled by renderFilteredTodos, so don't filter here
    return; // This shouldn't be reached, but just in case
  }

  if (visibleTodos.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✨</div>
        <div class="empty-state-text">No todos yet. Add one above!</div>
      </div>
    `;
    updateCount();
    return;
  }

  // Sort todos: incomplete with due dates first, then by due date, then by creation date
  visibleTodos.sort((a, b) => {
    if (!a.completed && b.completed) return -1;
    if (a.completed && !b.completed) return 1;
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate) {
      // Combine date and time for accurate sorting
      const aDate = parseDateLocal(a.dueDate);
      const bDate = parseDateLocal(b.dueDate);
      if (a.dueTime) {
        const [hours, minutes] = a.dueTime.split(':');
        aDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        aDate.setHours(23, 59, 59, 999);
      }
      if (b.dueTime) {
        const [hours, minutes] = b.dueTime.split(':');
        bDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        bDate.setHours(23, 59, 59, 999);
      }
      return aDate - bDate;
    }
    return b.createdAt - a.createdAt;
  });

  visibleTodos.forEach((todo) => {
    listEl.appendChild(createTodoElement(todo));
  });

  updateCount();
  renderCalendar();
}

function createTodoElement(todo) {
  const li = document.createElement("li");
  li.className = "todo-item";
  if (todo.completed) {
    li.classList.add("completed-item");
  }
  
  // Add priority class
  const priority = calculatePriority(todo);
  if (priority >= 7) {
    li.classList.add("high-priority");
  } else if (priority >= 4) {
    li.classList.add("medium-priority");
  } else if (priority > 0) {
    li.classList.add("low-priority");
  }
  
  // Add selected class in bulk mode
  if (typeof isBulkMode !== "undefined" && isBulkMode && typeof selectedTodoIds !== "undefined" && selectedTodoIds.has(todo.id)) {
    li.classList.add("selected");
  }
  
  li.dataset.id = todo.id;
  li.draggable = true; // Enable drag and drop
  li.setAttribute("role", "listitem");

  const main = document.createElement("div");
  main.className = "todo-main";
  
  // Bulk selection checkbox
  if (typeof isBulkMode !== "undefined" && isBulkMode) {
    const bulkCheckbox = document.createElement("input");
    bulkCheckbox.type = "checkbox";
    bulkCheckbox.className = "bulk-checkbox";
    bulkCheckbox.dataset.id = todo.id;
    bulkCheckbox.checked = typeof selectedTodoIds !== "undefined" && selectedTodoIds.has(todo.id);
    bulkCheckbox.addEventListener("change", (e) => {
      if (typeof toggleTodoSelection === "function") {
        toggleTodoSelection(todo.id);
      }
    });
    main.appendChild(bulkCheckbox);
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.className = "todo-checkbox";

  const content = document.createElement("div");
  content.className = "todo-content";

  const textSpan = document.createElement("span");
  textSpan.className = "todo-text";
  textSpan.textContent = todo.text;
  if (todo.completed) {
    textSpan.classList.add("completed");
  }

  const meta = document.createElement("div");
  meta.className = "todo-meta";

  const dateSpan = document.createElement("span");
  dateSpan.className = "todo-date";
  dateSpan.textContent = `Created: ${formatDate(todo.createdAt)}`;

  meta.appendChild(dateSpan);

  // Add due date if exists
  if (todo.dueDate) {
    const dueDateSpan = document.createElement("span");
    dueDateSpan.className = "todo-due-date";
    
    // Parse date in local timezone
    const dueDate = parseDateLocal(todo.dueDate);
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Set time if provided
    let dueDateTime = new Date(dueDate);
    if (todo.dueTime) {
      const [hours, minutes] = todo.dueTime.split(':');
      dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      // If no time, consider it due at end of day
      dueDateTime.setHours(23, 59, 59, 999);
    }
    
    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);
    
    // Format display text
    let displayText = "";
    if (todo.dueTime) {
      displayText = formatDateShort(dueDateTime.toISOString(), true);
    } else {
      displayText = formatDateShort(todo.dueDate);
    }
    
    // Check if overdue (only if past the due date/time)
    if (dueDateTime < now && !todo.completed) {
      dueDateSpan.classList.add("overdue");
      dueDateSpan.textContent = `⚠️ Overdue: ${displayText}`;
    } else if (dueDateOnly.getTime() === today.getTime() && !todo.completed) {
      if (todo.dueTime) {
        dueDateSpan.textContent = `📅 Due today at ${formatTime(todo.dueTime)}: ${formatDateShort(todo.dueDate)}`;
      } else {
        dueDateSpan.textContent = `📅 Due today: ${displayText}`;
      }
    } else {
      if (todo.dueTime) {
        dueDateSpan.textContent = `📅 Due: ${displayText}`;
      } else {
        dueDateSpan.textContent = `📅 Due: ${displayText}`;
      }
    }
    meta.appendChild(dueDateSpan);
  }

  content.appendChild(textSpan);
  content.appendChild(meta);

  main.appendChild(checkbox);
  main.appendChild(content);

  const actions = document.createElement("div");
  actions.className = "todo-actions";

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.className = "edit-btn";

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "delete-btn";

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(main);
  li.appendChild(actions);

  return li;
}

function renderFilteredTodos(filteredTodos) {
  listEl.innerHTML = "";
  
  if (filteredTodos.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-text">No todos for this date</div>
      </div>
    `;
    updateCount();
    return;
  }
  
  // Sort filtered todos
  filteredTodos.sort((a, b) => {
    if (!a.completed && b.completed) return -1;
    if (a.completed && !b.completed) return 1;
    if (a.dueDate && b.dueDate) {
      const aDate = parseDateLocal(a.dueDate);
      const bDate = parseDateLocal(b.dueDate);
      if (a.dueTime) {
        const [hours, minutes] = a.dueTime.split(':');
        aDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        aDate.setHours(23, 59, 59, 999);
      }
      if (b.dueTime) {
        const [hours, minutes] = b.dueTime.split(':');
        bDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        bDate.setHours(23, 59, 59, 999);
      }
      return aDate - bDate;
    }
    return b.createdAt - a.createdAt;
  });
  
  filteredTodos.forEach(todo => {
    listEl.appendChild(createTodoElement(todo));
  });
  
  updateCount();
}

function updateCount() {
  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;
  const overdueCount = todos.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const dueDate = parseDateLocal(t.dueDate);
    if (t.dueTime) {
      const [hours, minutes] = t.dueTime.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      // If no time, consider it overdue only if date has passed (end of day)
      dueDate.setHours(23, 59, 59, 999);
    }
    return dueDate < new Date();
  }).length;
  
  activeCountEl.textContent = activeCount;
  completedCountEl.textContent = completedCount;
  totalCountEl.textContent = todos.length;
  if (overdueCountEl) overdueCountEl.textContent = overdueCount;
}

function showAIConfirmation(parsed) {
  const hint = document.getElementById("ai-hint");
  if (hint) {
    const originalText = hint.textContent;
    let message = "✨ AI parsed: ";
    if (parsed.date) message += `Date: ${formatDateShort(parsed.date)} `;
    if (parsed.time) message += `Time: ${formatTime(parsed.time)}`;
    hint.textContent = message;
    hint.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    hint.style.color = "white";
    hint.style.padding = "8px 12px";
    hint.style.borderRadius = "8px";
    setTimeout(() => {
      hint.textContent = originalText;
      hint.style.background = "";
      hint.style.color = "";
      hint.style.padding = "";
      hint.style.borderRadius = "";
    }, 3000);
  }
}

