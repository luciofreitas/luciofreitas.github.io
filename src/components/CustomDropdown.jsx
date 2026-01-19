import React, { useState, useRef, useEffect, useMemo } from 'react';
import '../styles/CustomDropdown.css';
import { sortDropdownOptionsPtBr } from '../utils/sortUtils';

export default function CustomDropdown({
  options = [],
  value,
  onChange,
  placeholder = '',
  disabled = false,
  searchable = false,
}) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function handleSelect(option) {
    onChange(option);
    setOpen(false);
    setSearchText('');
    setActiveIndex(-1);
  }

  const visibleOptions = useMemo(() => sortDropdownOptionsPtBr(options), [options]);
  const selectedLabel = visibleOptions.find(opt => opt.value === value)?.label || '';

  const normalizeForSearch = (s) => {
    try {
      return String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
    } catch (e) {
      return String(s || '').toLowerCase();
    }
  };

  const filteredOptions = useMemo(() => {
    if (!searchable) return visibleOptions;
    const q = normalizeForSearch(searchText);
    if (!q) return visibleOptions;
    return visibleOptions.filter((opt) => {
      const label = opt && (opt.label ?? opt.value);
      return normalizeForSearch(label).includes(q);
    });
  }, [searchable, visibleOptions, searchText]);

  const closeDropdown = () => {
    setOpen(false);
    setSearchText('');
    setActiveIndex(-1);
  };

  const openDropdown = () => {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(-1);
  };

  return (
    <div className={`custom-dropdown${disabled ? ' disabled' : ''}`} ref={ref}>
      {searchable ? (
        <div
          className={`dropdown-control${open ? ' open' : ''}`}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <input
            ref={inputRef}
            className="dropdown-input"
            type="text"
            value={open ? (searchText || selectedLabel) : selectedLabel}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={(e) => {
              if (disabled) return;
              openDropdown();
              // Select all text so typing replaces the current selection
              try { requestAnimationFrame(() => e.target && e.target.select && e.target.select()); } catch (err) {}
            }}
            onChange={(e) => {
              setSearchText(e.target.value);
              if (!open) setOpen(true);
              setActiveIndex(-1);
            }}
            onKeyDown={(e) => {
              if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                openDropdown();
                e.preventDefault();
                return;
              }
              if (!open) return;
              if (e.key === 'Escape') {
                closeDropdown();
                e.preventDefault();
                return;
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((idx) => {
                  const next = Math.min((idx < 0 ? -1 : idx) + 1, filteredOptions.length - 1);
                  return next;
                });
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((idx) => {
                  const next = Math.max((idx < 0 ? filteredOptions.length : idx) - 1, 0);
                  return next;
                });
                return;
              }
              if (e.key === 'Enter') {
                if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
                  e.preventDefault();
                  handleSelect(filteredOptions[activeIndex].value);
                }
              }
            }}
            aria-autocomplete="list"
            aria-controls="custom-dropdown-listbox"
          />
          <button
            type="button"
            className="dropdown-arrow-btn"
            aria-label={open ? 'Fechar lista' : 'Abrir lista'}
            onClick={(e) => {
              e.preventDefault();
              if (disabled) return;
              setOpen((v) => {
                const next = !v;
                if (next) {
                  setSearchText('');
                  setActiveIndex(-1);
                  try { inputRef.current && inputRef.current.focus && inputRef.current.focus(); } catch (err) {}
                } else {
                  setSearchText('');
                  setActiveIndex(-1);
                }
                return next;
              });
            }}
          >
            <span className="dropdown-arrow" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="custom-dropdown-arrow-svg" aria-hidden="true">
                <path d="M4 6 L8 10 L12 6" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </span>
          </button>
        </div>
      ) : (
        <button
          className={`dropdown-btn${open ? ' open' : ''}`}
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          type="button"
        >
          <span className="dropdown-label">{selectedLabel || placeholder}</span>
          <span className="dropdown-arrow">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="custom-dropdown-arrow-svg" aria-hidden="true">
              <path d="M4 6 L8 10 L12 6" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </span>
        </button>
      )}

      {open && (
        <div className="dropdown-menu" role="listbox" id="custom-dropdown-listbox">
          {filteredOptions.length === 0 && <div className="dropdown-item disabled">Nenhum item</div>}
          {filteredOptions.map((opt, index) => (
            <div
              key={`${opt.value}${index}`}
              className={`dropdown-item${opt.value === value ? ' selected' : ''}${index === activeIndex ? ' active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                // Prevent input blur before selection
                e.preventDefault();
              }}
              onClick={() => handleSelect(opt.value)}
              role="option"
              aria-selected={opt.value === value}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
