module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: '#1a2b4c',
        saffron: '#f4a300',
        onecard: {
          obsidian: '#111111',
          sheet: '#FFFFFF',
          border: '#F0F0F0',
          primary: '#000000',
          secondary: '#71717A',
          accent: '#0077FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
