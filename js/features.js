// ----- Advanced Features: Search, Bulk Actions, Export/Import -----

let searchQuery = "";
let isBulkMode = false;
let selectedTodoIds = new Set();

// ----- Search Functionality -----
function initSearch() {
  const searchInput = document.getElementById("search-input");
  const searchContainer = document.getElementById("search-container");
  const searchToggle = document.getElementById("search-toggle");
  const closeSearch = document.getElementById("close-search");

  if (!searchInput || !searchContainer) return;

  // Toggle search
  if (searchToggle) {
    searchToggle.addEventListener("click", () => {
      const isVisible = searchContainer.style.display !== "none";
      searchContainer.style.display = isVisible ? "none" : "block";
      if (!isVisible) {
        searchInput.focus();
      }
    });
  }

  if (closeSearch) {
    closeSearch.addEventListener("click", () => {
      searchContainer.style.display = "none";
      searchInput.value = "";
      searchQuery = "";
      render();
    });
  }

  // Search input handler
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    render();
  });

  // Keyboard shortcut: / to focus search
  document.addEventListener("keydown", (e) => {
    // Only if not typing in an input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "/") {
      e.preventDefault();
      searchContainer.style.display = "block";
      searchInput.focus();
    }
  });
}

// ----- Bulk Selection Mode -----
function initBulkActions() {
  const bulkSelectBtn = document.getElementById("bulk-select-btn");
  const bulkActions = document.getElementById("bulk-actions");
  const bulkComplete = document.getElementById("bulk-complete");
  const bulkDelete = document.getElementById("bulk-delete");
  const bulkCancel = document.getElementById("bulk-cancel");
  const selectedCount = document.getElementById("selected-count");

  if (!bulkSelectBtn || !bulkActions) return;

  // Toggle bulk mode
  bulkSelectBtn.addEventListener("click", () => {
    isBulkMode = !isBulkMode;
    selectedTodoIds.clear();
    if (isBulkMode) {
      bulkActions.style.display = "flex";
      bulkSelectBtn.classList.add("active");
    } else {
      bulkActions.style.display = "none";
      bulkSelectBtn.classList.remove("active");
      // Remove all checkboxes
      document.querySelectorAll(".bulk-checkbox").forEach(cb => cb.remove());
    }
    render();
  });

  // Bulk complete
  if (bulkComplete) {
    bulkComplete.addEventListener("click", () => {
      if (selectedTodoIds.size === 0) return;
      todos = todos.map(t => 
        selectedTodoIds.has(t.id) ? { ...t, completed: true } : t
      );
      selectedTodoIds.clear();
      saveTodos();
      render();
    });
  }

  // Bulk delete
  if (bulkDelete) {
    bulkDelete.addEventListener("click", () => {
      if (selectedTodoIds.size === 0) return;
      if (confirm(`Delete ${selectedTodoIds.size} selected todo(s)?`)) {
        todos = todos.filter(t => !selectedTodoIds.has(t.id));
        selectedTodoIds.clear();
        saveTodos();
        render();
      }
    });
  }

  // Cancel bulk mode
  if (bulkCancel) {
    bulkCancel.addEventListener("click", () => {
      isBulkMode = false;
      selectedTodoIds.clear();
      bulkActions.style.display = "none";
      bulkSelectBtn.classList.remove("active");
      document.querySelectorAll(".bulk-checkbox").forEach(cb => cb.remove());
      render();
    });
  }

  // Update selected count
  function updateSelectedCount() {
    if (selectedCount) {
      selectedCount.textContent = `${selectedTodoIds.size} selected`;
    }
  }

  // Keyboard shortcut: Ctrl+B for bulk mode
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "b") {
      e.preventDefault();
      bulkSelectBtn.click();
    }
  });

  // Expose update function
  window.updateSelectedCount = updateSelectedCount;
}

// Toggle todo selection in bulk mode
function toggleTodoSelection(id) {
  if (!isBulkMode) return;
  if (selectedTodoIds.has(id)) {
    selectedTodoIds.delete(id);
  } else {
    selectedTodoIds.add(id);
  }
  if (window.updateSelectedCount) updateSelectedCount();
  // Update checkbox state
  const checkbox = document.querySelector(`.bulk-checkbox[data-id="${id}"]`);
  if (checkbox) {
    checkbox.checked = selectedTodoIds.has(id);
  }
}

// ----- Export/Import Functionality -----
function initExportImport() {
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");
  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = ".json";
  importInput.style.display = "none";

  // Export todos
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dataStr = JSON.stringify(todos, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `todos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show notification
      showNotification("✅ Todos exported successfully!");
    });
  }

  // Import todos
  if (importBtn) {
    importBtn.addEventListener("click", () => {
      importInput.click();
    });

    importInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedTodos = JSON.parse(event.target.result);
          if (Array.isArray(importedTodos)) {
            if (confirm(`Import ${importedTodos.length} todos? This will add them to your current list.`)) {
              // Merge with existing todos (avoid duplicates by ID)
              const existingIds = new Set(todos.map(t => t.id));
              const newTodos = importedTodos.filter(t => !existingIds.has(t.id));
              todos = [...todos, ...newTodos];
              saveTodos();
              render();
              showNotification(`✅ Imported ${newTodos.length} new todos!`);
            }
          } else {
            throw new Error("Invalid format");
          }
        } catch (error) {
          alert("Error importing file. Please make sure it's a valid JSON file.");
          console.error("Import error:", error);
        }
      };
      reader.readAsText(file);
    });
  }

  document.body.appendChild(importInput);
}

// ----- Keyboard Shortcuts -----
function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Don't trigger if typing in input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      // Allow Escape to clear search
      if (e.key === "Escape" && e.target.id === "search-input") {
        e.target.value = "";
        searchQuery = "";
        document.getElementById("search-container").style.display = "none";
        render();
      }
      return;
    }

    // Keyboard shortcuts
    switch(e.key) {
      case "n":
      case "N":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          input.focus();
        }
        break;
      case "Escape":
        // Close modals/panels
        if (aiInsightsPanel && aiInsightsPanel.style.display !== "none") {
          aiInsightsPanel.style.display = "none";
        }
        if (calendarContainer && calendarContainer.style.display !== "none") {
          calendarContainer.style.display = "none";
        }
        break;
      case "a":
      case "A":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // Select all in bulk mode
          if (isBulkMode) {
            const visibleTodos = getVisibleTodos();
            visibleTodos.forEach(t => selectedTodoIds.add(t.id));
            if (window.updateSelectedCount) updateSelectedCount();
            render();
          }
        }
        break;
    }
  });
}

// Helper function to get visible todos (for search/filter)
function getVisibleTodos() {
  let visibleTodos = todos;
  
  // Apply search filter
  if (searchQuery) {
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
  }
  
  return visibleTodos;
}

// Notification system
function showNotification(message, duration = 3000) {
  // Remove existing notification
  const existing = document.querySelector(".notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// Initialize all features
function initFeatures() {
  initSearch();
  initBulkActions();
  initExportImport();
  initKeyboardShortcuts();
  
  // Show keyboard shortcuts hint
  setTimeout(() => {
    if (todos.length > 0) {
      const hint = document.getElementById("ai-hint");
      if (hint) {
        const originalText = hint.textContent;
        hint.textContent = "💡 Keyboard shortcuts: / = Search, Ctrl+B = Bulk select, Ctrl+N = New task";
        setTimeout(() => {
          hint.textContent = originalText;
        }, 5000);
      }
    }
  }, 2000);
}

