import React from 'react';

export const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 ${className}`}>
      {children}
    </div>
  );
};