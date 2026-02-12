/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Dark theme colors - professional DAW aesthetic
        background: {
          DEFAULT: '#0d0d0f',
          secondary: '#141417',
          tertiary: '#1c1c21',
          elevated: '#222228',
        },
        foreground: {
          DEFAULT: '#e8e8ed',
          secondary: '#9d9daa',
          muted: '#5c5c6b',
        },
        accent: {
          DEFAULT: '#00e87b',
          secondary: '#00c968',
          muted: '#00582e',
          dim: '#0a3d22',
        },
        border: {
          DEFAULT: '#2a2a32',
          secondary: '#383842',
          hover: '#4a4a56',
        },
        // Audio-specific colors
        audio: {
          kick: '#ef4444',
          snare: '#22c55e',
          hihat: '#3b82f6',
          pad: '#c084fc',
          bass: '#eab308',
        },
        // Status colors
        success: '#00e87b',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // Responsive spacing scale
        'xs': '0.25rem',    // 4px
        'sm': '0.5rem',     // 8px
        'md': '1rem',       // 16px
        'lg': '1.5rem',     // 24px
        'xl': '2rem',       // 32px
        '2xl': '3rem',      // 48px
        '3xl': '4rem',      // 64px
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
