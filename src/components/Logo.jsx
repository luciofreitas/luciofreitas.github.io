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
            src="/logo.png" 
            alt="Logo Peça Fácil" 
            className="logo-image"
          />
        <div className="logo-text-container">
          <h1 className="logo-title">Auto Mestre</h1>
          <p className="logo-subtitle">Confiança, Tecnologia e Domínio Automotivo</p>
        </div>
      </div>
    </div>
  );
};

export default Logo;
