import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Logo.css';

const Logo = ({ className = '', onClick, ...props }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="menu-login-logo">
      <div 
        className={`logo-container ${className}`}
        onClick={handleClick}
        {...props}
      >
          <img 
            src="/images/logo.png" 
            alt="Logo Garagem Smart" 
            className="logo-image"
          />
        <div className="logo-text-container">
          <h1 className="logo-title">
            <span className="logo-title-line">Garagem</span>
            <span className="logo-title-line">Smart</span>
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Logo;
