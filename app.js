// ----- State -----
let todos = [];
let currentFilter = "all"; // "all" | "active" | "completed"
let currentCalendarDate = new Date();

// DOM elements
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const dueDateInput = document.getElementById("todo-due-date");
const dueTimeInput = document.getElementById("todo-due-time");
const listEl = document.getElementById("todo-list");
const filterButtons = document.querySelectorAll(".filter-button");
const activeCountEl = document.getElementById("active-count");
const completedCountEl = document.getElementById("completed-count");
const totalCountEl = document.getElementById("total-count");
const calendarToggle = document.getElementById("calendar-toggle");
const calendarContainer = document.getElementById("calendar-container");
const calendarGrid = document.getElementById("calendar-grid");
const calendarMonthYear = document.getElementById("calendar-month-year");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const aiToggle = document.getElementById("ai-toggle");
const aiInsightsPanel = document.getElementById("ai-insights-panel");
const closeAi = document.getElementById("close-ai");
const aiAnalytics = document.getElementById("ai-analytics");
const aiSuggestions = document.getElementById("ai-suggestions");
const aiQuickActions = document.getElementById("ai-quick-actions");
const overdueCountEl = document.getElementById("overdue-count");
const priorityFilter = document.getElementById("priority-filter");

// ----- Load from localStorage on startup -----
function loadTodos() {
  const saved = localStorage.getItem("todos");
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
  localStorage.setItem("todos", JSON.stringify(todos));
  updateAIInsights();
}

// ----- AI Features: Natural Language Processing -----
function parseNaturalLanguage(text) {
  const lowerText = text.toLowerCase();
  let extractedDate = null;
  let extractedTime = null;
  let cleanedText = text;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Time patterns
  const timePatterns = [
    { pattern: /(\d{1,2}):(\d{2})\s*(am|pm)/i, extract: (match) => {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = match[3].toLowerCase();
      if (ampm === 'pm' && hours !== 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }},
    { pattern: /(\d{1,2}):(\d{2})/i, extract: (match) => {
      const hours = parseInt(match[1]);
      const minutes = match[2];
      if (hours >= 0 && hours <= 23) {
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      }
      return null;
    }},
    { pattern: /at\s+(\d{1,2})\s*(am|pm)/i, extract: (match) => {
      let hours = parseInt(match[1]);
      const ampm = match[2].toLowerCase();
      if (ampm === 'pm' && hours !== 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:00`;
    }},
  ];
  
  // Date patterns
  const datePatterns = [
    { pattern: /tomorrow/i, extract: () => {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }},
    { pattern: /today/i, extract: () => today.toISOString().split('T')[0]},
    { pattern: /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, extract: (match) => {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = dayNames.indexOf(match[1].toLowerCase());
      const date = new Date(today);
      date.setDate(date.getDate() + ((targetDay - date.getDay() + 7) % 7 || 7));
      return date.toISOString().split('T')[0];
    }},
    { pattern: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, extract: (match) => {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = dayNames.indexOf(match[1].toLowerCase());
      const date = new Date(today);
      const daysUntil = (targetDay - date.getDay() + 7) % 7 || 7;
      date.setDate(date.getDate() + daysUntil);
      return date.toISOString().split('T')[0];
    }},
    { pattern: /in\s+(\d+)\s+days?/i, extract: (match) => {
      const days = parseInt(match[1]);
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    }},
    { pattern: /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i, extract: (match) => {
      const month = parseInt(match[1]) - 1;
      const day = parseInt(match[2]);
      const year = match[3] ? parseInt(match[3]) : now.getFullYear();
      if (year < 100) year += 2000;
      const date = new Date(year, month, day);
      if (date > today) {
        return date.toISOString().split('T')[0];
      }
      return null;
    }},
  ];
  
  // Extract time
  for (const { pattern, extract } of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      extractedTime = extract(match);
      if (extractedTime) {
        cleanedText = cleanedText.replace(match[0], '').trim();
        break;
      }
    }
  }
  
  // Extract date
  for (const { pattern, extract } of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      extractedDate = extract(match);
      if (extractedDate) {
        cleanedText = cleanedText.replace(match[0], '').trim();
        break;
      }
    }
  }
  
  // Clean up common words
  cleanedText = cleanedText
    .replace(/\b(at|on|tomorrow|today|next|in)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    text: cleanedText,
    date: extractedDate,
    time: extractedTime
  };
}

// ----- AI Features: Auto-Categorization -----
function categorizeTask(text) {
  const lowerText = text.toLowerCase();
  const categories = {
    'work': ['meeting', 'call', 'email', 'project', 'deadline', 'presentation', 'report', 'conference'],
    'personal': ['grocery', 'shopping', 'buy', 'pick up', 'doctor', 'dentist', 'appointment'],
    'health': ['exercise', 'gym', 'workout', 'run', 'yoga', 'meditation', 'diet'],
    'home': ['clean', 'laundry', 'cook', 'repair', 'maintenance', 'organize'],
    'social': ['party', 'dinner', 'lunch', 'coffee', 'birthday', 'event', 'celebration'],
    'finance': ['bill', 'payment', 'invoice', 'budget', 'tax', 'bank'],
    'learning': ['study', 'read', 'course', 'learn', 'practice', 'homework']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  return 'general';
}

// ----- AI Features: Smart Prioritization -----
function calculatePriority(todo) {
  let priority = 0;
  
  // Due date urgency
  if (todo.dueDate) {
    const dueDate = parseDateLocal(todo.dueDate);
    if (todo.dueTime) {
      const [hours, minutes] = todo.dueTime.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      dueDate.setHours(23, 59, 59, 999);
    }
    const now = new Date();
    const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) priority += 10; // Overdue
    else if (daysUntil === 0) priority += 8; // Due today
    else if (daysUntil === 1) priority += 6; // Due tomorrow
    else if (daysUntil <= 3) priority += 4; // Due soon
    else if (daysUntil <= 7) priority += 2; // Due this week
  }
  
  // Time urgency
  if (todo.dueTime) {
    priority += 1;
  }
  
  // Category-based priority
  const category = categorizeTask(todo.text);
  if (['work', 'finance'].includes(category)) priority += 2;
  
  // Keywords
  const urgentKeywords = ['urgent', 'asap', 'important', 'critical', 'emergency'];
  if (urgentKeywords.some(kw => todo.text.toLowerCase().includes(kw))) {
    priority += 5;
  }
  
  return priority;
}

// ----- AI Features: Analytics and Insights -----
function updateAIInsights() {
  if (!aiAnalytics || !aiSuggestions || !aiQuickActions) return;
  
  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);
  const overdueTodos = activeTodos.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = parseDateLocal(t.dueDate);
    if (t.dueTime) {
      const [hours, minutes] = t.dueTime.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      // If no time specified, consider it overdue only if the date has passed (end of day)
      dueDate.setHours(23, 59, 59, 999);
    }
    return dueDate < new Date();
  });
  
  // Analytics
  const completionRate = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0;
  const avgCompletionTime = calculateAvgCompletionTime();
  const categoryStats = getCategoryStats();
  
  aiAnalytics.innerHTML = `
    <div class="ai-stat">
      <span class="ai-stat-label">Completion Rate</span>
      <span class="ai-stat-value">${completionRate}%</span>
    </div>
    <div class="ai-stat">
      <span class="ai-stat-label">Overdue Tasks</span>
      <span class="ai-stat-value overdue-badge">${overdueTodos.length}</span>
    </div>
    <div class="ai-stat">
      <span class="ai-stat-label">Avg Completion</span>
      <span class="ai-stat-value">${avgCompletionTime}</span>
    </div>
    <div class="ai-categories">
      <strong>Top Categories:</strong>
      ${Object.entries(categoryStats).slice(0, 3).map(([cat, count]) => 
        `<span class="category-tag">${cat} (${count})</span>`
      ).join('')}
    </div>
  `;
  
  // Smart Suggestions
  const suggestions = generateSuggestions();
  aiSuggestions.innerHTML = suggestions.map(s => `
    <div class="suggestion-item">
      <span class="suggestion-icon">${s.icon}</span>
      <span class="suggestion-text">${s.text}</span>
      ${s.action ? `<button class="suggestion-action" onclick="${s.action}">${s.actionText}</button>` : ''}
    </div>
  `).join('');
  
  // Quick Actions
  const quickActions = generateQuickActions();
  aiQuickActions.innerHTML = quickActions.map(action => `
    <button class="quick-action-btn" onclick="${action.onclick}">
      ${action.icon} ${action.text}
    </button>
  `).join('');
}

function calculateAvgCompletionTime() {
  const completed = todos.filter(t => t.completed && t.dueDate);
  if (completed.length === 0) return 'N/A';
  
  let totalDays = 0;
  completed.forEach(todo => {
    const created = new Date(todo.createdAt);
    const completed = new Date();
    const days = Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
    totalDays += days;
  });
  
  const avg = Math.round(totalDays / completed.length);
  return avg === 1 ? '1 day' : `${avg} days`;
}

function getCategoryStats() {
  const stats = {};
  todos.forEach(todo => {
    const category = categorizeTask(todo.text);
    stats[category] = (stats[category] || 0) + 1;
  });
  return Object.fromEntries(
    Object.entries(stats).sort((a, b) => b[1] - a[1])
  );
}

function generateSuggestions() {
  const suggestions = [];
  const activeTodos = todos.filter(t => !t.completed);
  const overdueTodos = activeTodos.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = parseDateLocal(t.dueDate);
    if (t.dueTime) {
      const [hours, minutes] = t.dueTime.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      dueDate.setHours(23, 59, 59, 999);
    }
    return dueDate < new Date();
  });
  
  if (overdueTodos.length > 0) {
    suggestions.push({
      icon: '⚠️',
      text: `You have ${overdueTodos.length} overdue task${overdueTodos.length > 1 ? 's' : ''}. Consider rescheduling or completing them.`,
      action: 'filterOverdue()',
      actionText: 'View'
    });
  }
  
  const highPriority = activeTodos.filter(t => calculatePriority(t) >= 7);
  if (highPriority.length > 0) {
    suggestions.push({
      icon: '⭐',
      text: `${highPriority.length} high-priority task${highPriority.length > 1 ? 's' : ''} need your attention.`,
      action: 'showPriority()',
      actionText: 'View'
    });
  }
  
  const todosWithoutDate = activeTodos.filter(t => !t.dueDate);
  if (todosWithoutDate.length > 0 && overdueTodos.length === 0) {
    suggestions.push({
      icon: '📅',
      text: `${todosWithoutDate.length} task${todosWithoutDate.length > 1 ? 's' : ''} without due dates. Adding dates helps with planning.`,
    });
  }
  
  if (suggestions.length === 0) {
    suggestions.push({
      icon: '✨',
      text: 'Great job! Your tasks are well organized.',
    });
  }
  
  return suggestions;
}

function generateQuickActions() {
  return [
    {
      icon: '🗑️',
      text: 'Clear Completed',
      onclick: 'clearCompleted()'
    },
    {
      icon: '📊',
      text: 'View Priority',
      onclick: 'showPriority()'
    },
    {
      icon: '🔄',
      text: 'Sort by Priority',
      onclick: 'sortByPriority()'
    }
  ];
}

function filterOverdue() {
  currentFilter = "all";
  filterButtons.forEach(b => b.classList.remove("active"));
  render();
  const overdue = todos.filter(t => {
    if (t.completed || !t.dueDate) return false;
    const dueDate = parseDateLocal(t.dueDate);
    if (t.dueTime) {
      const [hours, minutes] = t.dueTime.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      dueDate.setHours(23, 59, 59, 999);
    }
    return dueDate < new Date();
  });
  renderFilteredTodos(overdue);
  if (aiInsightsPanel) aiInsightsPanel.style.display = "none";
}

function showPriority() {
  currentFilter = "priority";
  filterButtons.forEach(b => b.classList.remove("active"));
  priorityFilter.classList.add("active");
  render();
  if (aiInsightsPanel) aiInsightsPanel.style.display = "none";
}

function clearCompleted() {
  if (confirm("Are you sure you want to delete all completed tasks?")) {
    todos = todos.filter(t => !t.completed);
    saveTodos();
    render();
  }
}

function sortByPriority() {
  todos.sort((a, b) => {
    const aPriority = calculatePriority(a);
    const bPriority = calculatePriority(b);
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return bPriority - aPriority;
  });
  saveTodos();
  render();
}

// ----- Calendar Functions -----
function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  // Update month/year header
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  calendarMonthYear.textContent = `${monthNames[month]} ${year}`;
  
  // Clear calendar grid
  calendarGrid.innerHTML = "";
  
  // Add day headers
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayHeaders.forEach(day => {
    const header = document.createElement("div");
    header.className = "calendar-day-header";
    header.textContent = day;
    calendarGrid.appendChild(header);
  });
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  // Add previous month's days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = document.createElement("div");
    day.className = "calendar-day other-month";
    day.textContent = prevMonthDays - i;
    calendarGrid.appendChild(day);
  }
  
  // Add current month's days
  const today = new Date();
  const isToday = (date) => {
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayEl = document.createElement("div");
    dayEl.className = "calendar-day";
    dayEl.textContent = day;
    dayEl.dataset.date = date.toISOString().split('T')[0];
    
    if (isToday(date)) {
      dayEl.classList.add("today");
    }
    
    // Check if this date has todos (time doesn't matter for calendar display)
    const dateStr = date.toISOString().split('T')[0];
    const todosOnDate = todos.filter(todo => {
      if (todo.dueDate) {
        // Use parseDateLocal for consistent comparison
        const todoDate = parseDateLocal(todo.dueDate);
        const checkDate = parseDateLocal(dateStr);
        const todoDateStr = todoDate.toISOString().split('T')[0];
        const checkDateStr = checkDate.toISOString().split('T')[0];
        return todoDateStr === checkDateStr;
      }
      return false;
    });
    
    if (todosOnDate.length > 0) {
      dayEl.classList.add("has-todos");
      const badge = document.createElement("div");
      badge.className = "todo-count-badge";
      badge.textContent = todosOnDate.length;
      badge.style.pointerEvents = "none"; // Allow clicks to pass through
      dayEl.appendChild(badge);
    }
    
    // Add click handler to filter by date
    dayEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      filterByDate(dateStr);
    });
    
    // Also handle mousedown for better responsiveness
    dayEl.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });
    
    // Make sure the day element is clickable
    dayEl.style.cursor = "pointer";
    dayEl.style.position = "relative";
    
    calendarGrid.appendChild(dayEl);
  }
  
  // Fill remaining cells
  const totalCells = calendarGrid.children.length;
  const remaining = 42 - totalCells; // 6 rows * 7 days
  for (let i = 1; i <= remaining; i++) {
    const day = document.createElement("div");
    day.className = "calendar-day other-month";
    day.textContent = i;
    day.style.cursor = "default";
    day.style.pointerEvents = "none"; // Disable clicks on other month days
    calendarGrid.appendChild(day);
  }
}

let selectedDate = null;

function filterByDate(dateStr) {
  // Remove previous selection
  document.querySelectorAll('.calendar-day.selected').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Add selection to clicked date
  const clickedDay = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
  if (clickedDay) {
    clickedDay.classList.add('selected');
  }
  
  selectedDate = dateStr;
  
  // Filter todos by selected date
  const filtered = todos.filter(todo => {
    if (todo.dueDate) {
      // Use parseDateLocal for consistent date comparison
      const todoDate = parseDateLocal(todo.dueDate);
      const filterDate = parseDateLocal(dateStr);
      const todoDateStr = todoDate.toISOString().split('T')[0];
      const filterDateStr = filterDate.toISOString().split('T')[0];
      return todoDateStr === filterDateStr;
    }
    return false;
  });
  
  // Show filtered todos and update filter state
  currentFilter = "date";
  filterButtons.forEach(b => b.classList.remove("active"));
  
  // Show filtered todos
  renderFilteredTodos(filtered);
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

// ----- Render -----
function render() {
  listEl.innerHTML = "";

  let visibleTodos = todos;
  if (currentFilter === "active") {
    visibleTodos = todos.filter((t) => !t.completed);
  } else if (currentFilter === "completed") {
    visibleTodos = todos.filter((t) => t.completed);
  } else if (currentFilter === "priority") {
    visibleTodos = todos.filter((t) => !t.completed && calculatePriority(t) >= 7);
  } else if (currentFilter === "date") {
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
  
  li.dataset.id = todo.id;

  const main = document.createElement("div");
  main.className = "todo-main";

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

// Helper function to parse date string in local timezone (not UTC)
function parseDateLocal(dateString) {
  // dateString is in format YYYY-MM-DD
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
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

function formatDate(dateStringOrNumber) {
  const d = new Date(dateStringOrNumber);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDateShort(dateStringOrNumber, includeTime = false) {
  const d = new Date(dateStringOrNumber);
  const options = {
    month: "short",
    day: "numeric",
    year: "numeric"
  };
  if (includeTime) {
    options.hour = "numeric";
    options.minute = "2-digit";
  }
  return d.toLocaleDateString("en-US", options);
}

function formatTime(timeString) {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function combineDateAndTime(dateString, timeString) {
  if (!dateString) return null;
  if (!timeString) return dateString;
  return `${dateString}T${timeString}`;
}

// ----- Add new todo -----
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

// ----- Toggle complete -----
function toggleTodo(id) {
  todos = todos.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveTodos();
  render();
}

// ----- Delete todo -----
function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  render();
}

// ----- Edit todo (inline editing) -----
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

// ----- Event Listeners -----

// Form submit (Add todo with AI parsing)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputText = input.value.trim();
  if (!inputText) return;
  
  // Use AI natural language parsing
  const parsed = parseNaturalLanguage(inputText);
  
  // Use parsed date/time or form inputs (form inputs take priority)
  const dueDate = dueDateInput.value || parsed.date || null;
  const dueTime = dueTimeInput.value || parsed.time || null;
  
  // Add category and priority
  const category = categorizeTask(parsed.text);
  const newTodo = {
    id: Date.now().toString(),
    text: parsed.text,
    completed: false,
    createdAt: Date.now(),
    dueDate: dueDate,
    dueTime: dueTime,
    category: category,
    priority: calculatePriority({ text: parsed.text, dueDate, dueTime, completed: false })
  };
  
  todos.push(newTodo);
  saveTodos();
  render();
  
  input.value = "";
  dueDateInput.value = "";
  dueTimeInput.value = "";
  input.focus();
  
  // Show confirmation if AI parsed something
  if (parsed.date || parsed.time) {
    showAIConfirmation(parsed);
  }
});

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

// Calendar toggle
calendarToggle.addEventListener("click", () => {
  const isVisible = calendarContainer.style.display !== "none";
  calendarContainer.style.display = isVisible ? "none" : "block";
  if (!isVisible) {
    renderCalendar();
  }
});

// Calendar navigation
prevMonthBtn.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderCalendar();
});

// Filter buttons
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    // Clear date filter when switching to other filters
    if (currentFilter !== "date") {
      selectedDate = null;
      document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
      });
    }
    render();
  });
});

// Clicks inside the todo list (event delegation)
listEl.addEventListener("click", (e) => {
  const li = e.target.closest(".todo-item");
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains("todo-checkbox")) {
    toggleTodo(id);
  } else if (e.target.classList.contains("delete-btn")) {
    if (confirm("Are you sure you want to delete this todo?")) {
      deleteTodo(id);
    }
  } else if (e.target.classList.contains("edit-btn")) {
    editTodo(id);
  }
});

// AI Toggle
if (aiToggle) {
  aiToggle.addEventListener("click", () => {
    const isVisible = aiInsightsPanel.style.display !== "none";
    aiInsightsPanel.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
      updateAIInsights();
    }
  });
}

if (closeAi) {
  closeAi.addEventListener("click", () => {
    aiInsightsPanel.style.display = "none";
  });
}

// ----- Init -----
loadTodos();
render();
updateAIInsights();