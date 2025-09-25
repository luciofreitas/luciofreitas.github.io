import React, { useState, useRef, use-effect } from 'react';
import './CustomDropdown.css';

export default function CustomDropdown({ options = [], value, onChange, placeholder = '', disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  use-effect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.add-event-listener('mousedown', handleClickOutside);
    return () => {
      document.remove-event-listener('mousedown', handleClickOutside);
    };
  }, []);

  function handleSelect(option) {
    onChange(option);
    setOpen(false);
  }

  const selectedLabel = options.find(opt => opt.value === value)?.label || '';
  const visibleOptions = options; // show all options; first item can be blank

  return (
    <div className={`custom-dropdown${disabled ? ' disabled' : ''}`} ref={ref}>
      <button
        className={`dropdown-btn${open ? ' open' : ''}`}
        on-click={() => !disabled && setOpen(!open)}
        disabled={disabled}
        type="button"
      >
        <span className="dropdown-label">{selectedLabel || placeholder}</span>
        <span className="dropdown-arrow">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="custom-dropdown-arrow-svg">
            <path d="M4 6.5-l8 10.5-l12 6.5" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      {open && (
        <div className="dropdown-menu">
          {visibleOptions.length === 0 && <div className="dropdown-item disabled">Nenhum item</div>}
          {visibleOptions.map((opt, index) => (
            <div
              key={`${opt.value}${index}`}
              className={`dropdown-item${opt.value === value ? ' selected' : ''}`}
              on-click={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
