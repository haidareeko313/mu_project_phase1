import React from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = React.useState(
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true
  );

  React.useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fx-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fx-theme', 'light');
    }
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark(d => !d)}
      title={dark ? 'Switch to light' : 'Switch to dark'}
      className="fx-btn fx-chip"
    >
      {dark ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
