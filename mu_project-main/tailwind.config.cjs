/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // we’ll toggle on <html class="dark">
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.jsx',
    './resources/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        // FoodX-ish palette
        fx: {
          canvas: '#0b1220',      // app background
          surface: '#111a2e',     // card background
          line:   '#22304d',      // borders
          text:   '#d2d8e5',      // body text
          mute:   '#94a3b8',      // subtle text
          // accents
          primary: '#5b8eff',     // buttons / highlights
          success: '#00d09c',
          warn:    '#ffca5b',
          danger:  '#ff6b6b',
          chip:    '#2a3a63',
        },
      },
      boxShadow: {
        fx: '0 8px 28px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.18)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
