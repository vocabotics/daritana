export function fixPermissions() {
  // Clear the old incomplete permissions
  localStorage.removeItem('permissions-storage');
  
  // Disabled reload to prevent infinite loop
  // window.location.reload();
  console.log('Permissions fixed - please refresh manually if needed');
}

// Add to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).fixPermissions = fixPermissions;
  
  // Disabled auto-fix to prevent reload loops
  // const stored = localStorage.getItem('permissions-storage');
  // if (stored) {
  //   try {
  //     const parsed = JSON.parse(stored);
  //     if (parsed.state && parsed.state.groups && parsed.state.groups.length < 6) {
  //       console.log('Detected incomplete permissions, fixing...');
  //       localStorage.removeItem('permissions-storage');
  //     }
  //   } catch (e) {
  //     console.error('Failed to parse stored permissions:', e);
  //   }
  // }
}