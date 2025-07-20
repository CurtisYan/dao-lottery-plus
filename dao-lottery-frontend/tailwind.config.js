/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#8B5CF6",
        secondary: "#06B6D4", 
        accent: "#EC4899",
        background: "#0F0F23",
        surface: "#1A1B3A",
        glass: "rgba(139, 92, 246, 0.1)",
        'neon-purple': "#8B5CF6",
        'neon-cyan': "#06B6D4",
        'neon-pink': "#EC4899",
        'dark-bg': "#0F0F23",
        'dark-surface': "#1A1B3A",
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan-line 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { 
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
            filter: 'brightness(1)'
          },
          '100%': { 
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.3)',
            filter: 'brightness(1.1)'
          }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'pulse-glow': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 35px rgba(139, 92, 246, 0.8), 0 0 50px rgba(139, 92, 246, 0.3)'
          }
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        }
      },
      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #EC4899 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0F0F23 0%, #1A1B3A 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      fontFamily: {
        'cyber': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
} 