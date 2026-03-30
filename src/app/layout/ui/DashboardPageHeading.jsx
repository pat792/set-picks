import React from 'react';

export default function DashboardPageHeading({ title, tone = 'default' }) {
  const isWarRoom = tone === 'warRoom';

  return (
    <h2
      className={`hidden md:block font-display text-display-page md:text-display-page-lg font-bold mb-6 mt-1 tracking-tight ${
        isWarRoom ? 'uppercase text-red-500' : 'text-white'
      }`}
    >
      {title}
    </h2>
  );
}

