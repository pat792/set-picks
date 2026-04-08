import React from 'react';

/** Full-screen placeholder while Firebase auth (and profile fetch) resolves for protected areas. */
export default function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent font-bold text-white">
      Loading...
    </div>
  );
}
