import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }) {
  // Tenta carregar do localStorage, senão usa 'light' como padrão
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme || 'light';
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
      return 'light';
    }
  });

  // Aplica a classe no HTML root quando o tema muda
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove classes antigas
    root.classList.remove('theme-light', 'theme-dark');
    
    // Adiciona classe do tema atual
    root.classList.add(`theme-${theme}`);
    
    // Salva no localStorage
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
