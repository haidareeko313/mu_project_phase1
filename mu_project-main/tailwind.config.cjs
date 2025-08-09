/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './resources/views/**/*.blade.php',
    './resources/js/**/*.jsx',
    './resources/js/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        'mu-blue': '#1e2c55',
        'mu-gold': '#f2c744',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
