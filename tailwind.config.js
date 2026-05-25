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
        sans: ['Inter', 'var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        nvmixBg: '#050505',
        panelBg: '#0e1015',
        panelBorder: 'rgba(255, 255, 255, 0.08)',
        neonCyan: '#06b6d4',
        neonGreen: '#10b981',
        textMuted: '#94a3b8',
        nvmix: {
          bg: '#050505',
          surface: 'var(--bg-surface)',
          card: 'var(--bg-card)',
          border: 'var(--border-primary)',
          borderHover: 'var(--border-hover)',
          text: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          primary: 'var(--color-primary)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
          purple: 'var(--color-purple)',
        }
      },
      boxShadow: {
        premium: 'var(--shadow-premium)',
        card: 'var(--shadow-card)',
        'glow-primary': '0 0 25px rgba(59, 130, 246, 0.25), 0 0 10px rgba(59, 130, 246, 0.1)',
        'glow-success': '0 0 25px rgba(16, 185, 129, 0.25), 0 0 10px rgba(16, 185, 129, 0.1)',
        'glow-warning': '0 0 25px rgba(245, 158, 11, 0.25), 0 0 10px rgba(245, 158, 11, 0.1)',
        'glow-purple': '0 0 25px rgba(129, 140, 248, 0.25), 0 0 10px rgba(129, 140, 248, 0.1)',
        'glow-error': '0 0 25px rgba(239, 68, 68, 0.25), 0 0 10px rgba(239, 68, 68, 0.1)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.25)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.15)',
      },
      transitionTimingFunction: {
        'premium-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
}
