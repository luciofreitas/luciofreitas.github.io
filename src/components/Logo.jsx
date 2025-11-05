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
            src="/images/logo-garagem-smart.svg" 
            alt="Logo Garagem Smart" 
            className="logo-image"
          />
      </div>
    </div>
  );
};

export default Logo;
