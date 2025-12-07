import React from 'react';

export default function InputField({
  label,
  value,
  onChange,
  type = 'text',
  ...props
}) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <input
        className="modern-input"
        type={type}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
}