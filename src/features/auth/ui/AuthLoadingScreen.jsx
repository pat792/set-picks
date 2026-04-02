import React from 'react';

/** Full-screen placeholder while Firebase auth (and profile fetch) resolves for protected areas. */
export default function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center font-bold">
      Loading...
    </div>
  );
}
