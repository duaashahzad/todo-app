// ----- Utility Functions -----

// Helper function to parse date string in local timezone (not UTC)
function parseDateLocal(dateString) {
  // dateString is in format YYYY-MM-DD
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
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

