// ----- Drag and Drop Reordering -----

let draggedElement = null;
let draggedIndex = -1;

function initDragAndDrop() {
  // Make todos sortable via drag and drop
  listEl.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("todo-item") || e.target.closest(".todo-item")) {
      const todoItem = e.target.closest(".todo-item");
      draggedElement = todoItem;
      draggedIndex = Array.from(listEl.children).indexOf(todoItem);
      todoItem.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", todoItem.innerHTML);
    }
  });

  listEl.addEventListener("dragend", (e) => {
    if (draggedElement) {
      draggedElement.classList.remove("dragging");
      draggedElement = null;
      draggedIndex = -1;
    }
  });

  listEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    const todoItem = e.target.closest(".todo-item");
    if (todoItem && todoItem !== draggedElement) {
      const afterElement = getDragAfterElement(listEl, e.clientY);
      if (afterElement == null) {
        listEl.appendChild(draggedElement);
      } else {
        listEl.insertBefore(draggedElement, afterElement);
      }
    }
  });

  listEl.addEventListener("drop", (e) => {
    e.preventDefault();
    if (draggedElement) {
      const newIndex = Array.from(listEl.children).indexOf(draggedElement);
      if (newIndex !== draggedIndex && draggedIndex !== -1) {
        // Reorder todos array
        const todoId = draggedElement.dataset.id;
        const todo = todos.find(t => t.id === todoId);
        if (todo) {
          todos = todos.filter(t => t.id !== todoId);
          todos.splice(newIndex, 0, todo);
          saveTodos();
          showNotification("✅ Todos reordered!");
        }
      }
      draggedElement.classList.remove("dragging");
      draggedElement = null;
      draggedIndex = -1;
    }
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".todo-item:not(.dragging)")];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

