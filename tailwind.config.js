/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
        mono: ['var(--font-fira-code)', 'monospace'],
      },
      colors: {
        nemix: {
          bg: '#050507',
          card: 'rgba(13, 13, 17, 0.75)',
          border: 'rgba(255, 255, 255, 0.08)',
          primary: '#3b82f6',
          success: '#10b981',
          purple: '#7c6af7',
        }
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(59, 130, 246, 0.15)',
        'glow-purple': '0 0 25px rgba(124, 106, 247, 0.2)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.15)',
        'glass-inner': 'inset 0 1px 1px rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
