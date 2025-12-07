import React from 'react';

export default function SelectField({ label, value, onChange, children, ...props }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <select
        className="modern-input"
        value={value}
        onChange={onChange}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}