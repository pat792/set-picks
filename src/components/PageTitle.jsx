import React from 'react';

export default function PageTitle({ title }) {
  return (
    <h2 className="hidden md:block text-2xl font-display font-black italic uppercase mb-6 text-white tracking-tight">
      {title}
    </h2>
  );
}