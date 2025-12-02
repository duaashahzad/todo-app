// ----- Dark Mode / Theme Management -----

let isDarkMode = false;

function initTheme() {
  // Load theme preference
  const savedTheme = localStorage.getItem("theme");
  isDarkMode = savedTheme === "dark";
  
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
  }
  
  updateThemeToggle();
  
  // Theme toggle button
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      toggleTheme();
    });
  }
}

function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);
  localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  updateThemeToggle();
}

function updateThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.textContent = isDarkMode ? "☀️" : "🌙";
    themeToggle.title = isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode";
  }
}

