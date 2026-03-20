import React from 'react';

export default function PageTitle({ title }) {
  return (
    // Replaced font-display with font-['Space_Grotesk']
    <h2 className="hidden md:block text-2xl font-['Space_Grotesk'] font-black italic uppercase mb-6 text-white tracking-tight">
      {title}
    </h2>
  );
}