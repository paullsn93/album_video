/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3A5A40',
        'bg-cream': '#F9F8F6',
        accent: '#A44A3F',
        'text-dark': '#1B1B1B',
        'text-mute': '#666666',
        'tag-bg': '#EAEFDE',
      },
      fontFamily: {
        serif: ['Noto Serif TC', 'serif'],
        sans: ['Noto Sans TC', 'sans-serif'],
      },
      borderRadius: {
        'global': '12px',
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(58, 90, 64, 0.06)',
        'glass': '0 8px 24px rgba(58, 90, 64, 0.1)',
      }
    },
  },
  plugins: [],
}

