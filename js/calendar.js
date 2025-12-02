// ----- Calendar Functions -----

let selectedDate = null;

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
  currentFilter = CONFIG.FILTERS.DATE;
  filterButtons.forEach(b => b.classList.remove("active"));
  
  // Show filtered todos
  renderFilteredTodos(filtered);
}

