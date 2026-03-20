import React from 'react';

export default function PageTitle({ title }) {
  return (
    <h2 className="hidden md:block text-2xl font-['Space_Grotesk'] font-black italic uppercase mb-6 text-red-500 tracking-tight">
      {title}
    </h2>
  );
}