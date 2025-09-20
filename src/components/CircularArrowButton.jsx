import React from 'react';
import './CircularArrowButton.css';

const CircularArrowButton = ({ onClick, className = '', size = 'medium' }) => {
  return (
    <button 
      className={`circular-arrow-button ${size} ${className}`}
      onClick={onClick}
      type="button"
      aria-label="Comece agora - É grátis"
    >
      <svg 
        className="circular-button-arrow" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M5 12h14m-7-7l7 7-7 7" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default CircularArrowButton;