/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        system: {
          bg: '#05060f',
          panel: '#0a0e1c',
          panel2: '#0d1226',
          line: '#1b2440',
          blue: '#00d4ff',
          violet: '#8b5cf6',
          cyan: '#22d3ee',
          xp: '#38f9d7',
          gold: '#fbbf24',
          danger: '#ff3b5c',
          text: '#dbe6ff',
          muted: '#64748b',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 212, 255, 0.25), inset 0 0 12px rgba(0, 212, 255, 0.08)',
        'glow-violet': '0 0 24px rgba(139, 92, 246, 0.35), inset 0 0 12px rgba(139, 92, 246, 0.12)',
        'glow-gold': '0 0 24px rgba(251, 191, 36, 0.35)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(0, 212, 255, 0.2)' },
          '50%': { boxShadow: '0 0 28px rgba(0, 212, 255, 0.5)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'scanline': 'scanline 3s linear infinite',
        'flicker': 'flicker 1.2s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
