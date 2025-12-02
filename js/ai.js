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
  currentFilter = CONFIG.FILTERS.ALL;
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
  currentFilter = CONFIG.FILTERS.PRIORITY;
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

