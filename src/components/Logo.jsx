import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Logo.css';

const Logo = ({ className = '', on-click, ...props }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (on-click) {
      on-click();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="menu-login-logo">
      <div 
        className={`logo-container ${className}`}
        on-click={handleClick}
        {...props}
      >
        <img 
          src="./logo.png" 
          alt="Logo Peça Fácil" 
          className="logo-image"
        />
        <div className="logo-text-container">
          <h1 className="logo-title">Peça Fácil</h1>
          <p className="logo-subtitle">Compatibilidade e Economia</p>
        </div>
      </div>
    </div>
  );
};

export default Logo;
