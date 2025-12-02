// ----- State -----
let todos = [];
let currentFilter = CONFIG.FILTERS.ALL; // "all" | "active" | "completed" | "priority" | "date"
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
    if (currentFilter !== CONFIG.FILTERS.DATE) {
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
if (typeof initTheme === "function") initTheme();
if (typeof initFeatures === "function") initFeatures();
if (typeof initDragAndDrop === "function") initDragAndDrop();
render();
updateAIInsights();

