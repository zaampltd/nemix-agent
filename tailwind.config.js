/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        space: ['var(--font-space)', 'sans-serif'],
        mono: ['var(--font-fira-code)', 'monospace'],
      },
      colors: {
        md: {
          primary: 'var(--md-primary)',
          'on-primary': 'var(--md-on-primary)',
          'primary-container': 'var(--md-primary-container)',
          'on-primary-cont': 'var(--md-on-primary-cont)',
          secondary: 'var(--md-secondary)',
          'secondary-cont': 'var(--md-secondary-cont)',
          surface: 'var(--md-surface)',
          'surface-1': 'var(--md-surface-1)',
          'surface-2': 'var(--md-surface-2)',
          'surface-3': 'var(--md-surface-3)',
          'surface-variant': 'var(--md-surface-variant)',
          'on-surface': 'var(--md-on-surface)',
          'on-surface-var': 'var(--md-on-surface-var)',
          outline: 'var(--md-outline)',
          'outline-var': 'var(--md-outline-var)',
          success: 'var(--md-success)',
          'success-cont': 'var(--md-success-cont)',
          error: 'var(--md-error)',
          'error-cont': 'var(--md-error-cont)',
          warning: 'var(--md-warning)',
          'warning-cont': 'var(--md-warning-cont)',
        }
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(91, 91, 214, 0.15)',
        'glow-success': '0 0 20px rgba(109, 217, 154, 0.15)',
        'glow-error': '0 0 20px rgba(255, 180, 171, 0.15)',
      }
    },
  },
  plugins: [],
}
