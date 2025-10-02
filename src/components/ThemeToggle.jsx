import React, { useEffect, useState } from 'react';
import '../styles/ThemeToggle.css';

const ThemeToggle = () => {
  // Inicializa tema: localStorage > preferência do sistema > light (padrão)
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Respeita preferência do sistema
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Aplica tema ao document e salva no localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Atualiza meta theme-color para mobile (cor da barra de status)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0f172a' : '#2b6cb0');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
      title={isDark ? 'Modo Claro (Dia)' : 'Modo Escuro (Noite)'}
    >
      <div className={`traffic-light ${isDark ? 'dark' : 'light'}`}>
        <div className="light-container">
          <div className={`light red ${isDark ? 'active' : ''}`}></div>
          <div className={`light green ${!isDark ? 'active' : ''}`}></div>
        </div>
      </div>
      <span className="theme-label">
        {isDark ? 'Noite' : 'Dia'}
      </span>
    </button>
  );
};

export default ThemeToggle;
