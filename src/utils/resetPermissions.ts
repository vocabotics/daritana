export function resetPermissions() {
  // Clear permissions from localStorage
  localStorage.removeItem('permissions-storage');
  
  // Reload the page to get fresh permissions
  window.location.reload();
}

// Add to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).resetPermissions = resetPermissions;
}