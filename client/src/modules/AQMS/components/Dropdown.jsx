import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Dropdown = ({ label, icon, options, align = 'left', isMulti = false, defaultSelected }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { t } = useLanguage();
  const [selected, setSelected] = useState(
    defaultSelected || (isMulti ? [options[0], options[1]] : options[0])
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (isMulti) {
      setSelected((prev) => 
        prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
      );
    } else {
      setSelected(option);
      setOpen(false);
    }
  };

  const displayValue = isMulti 
    ? (selected.length > 0 ? selected.join(', ') : t('dropdown.none')) 
    : selected;

  return (
    <div ref={dropdownRef} className={`dropdown ${open ? 'active' : ''}`}>
      <div className="filter-btn" onClick={() => setOpen(!open)}>
        {icon}
        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayValue}
        </span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div className={`dropdown-menu ${align === 'right' ? 'dropdown-menu-right' : ''}`}>
        <div className="dropdown-header">{label}</div>
        <div className="dropdown-list">
          {options.map((opt) => {
            const isSelected = isMulti ? selected.includes(opt) : selected === opt;
            
            return (
              <div
                key={opt}
                className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(opt)}
                style={{ justifyContent: isMulti ? 'flex-start' : 'space-between', gap: isMulti ? '10px' : '0' }}
              >
                {isMulti && (
                  isSelected ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#3ebfb6" stroke="#3ebfb6" strokeWidth="2" style={{ borderRadius: '4px' }}>
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <polyline points="7 12 11 16 18 7" stroke="white" strokeWidth="3" fill="none" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="transparent" stroke="#cbd5e1" strokeWidth="2" style={{ borderRadius: '4px' }}>
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                    </svg>
                  )
                )}
                {opt}
                {!isMulti && isSelected && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3ebfb6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dropdown;
