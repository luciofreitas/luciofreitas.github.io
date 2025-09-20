import React from 'react';
import './GetStartedButton.css';

const GetStartedButton = ({ onClick, className = '' }) => {
  return (
    <button 
      className={`get-started-button ${className}`}
      onClick={onClick}
      type="button"
    >
      <span className="button-text">Comece agora - É grátis</span>
      <svg 
        className="button-arrow" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M5 12h14m-7-7l7 7-7 7" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default GetStartedButton;