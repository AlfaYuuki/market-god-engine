export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#33d6ff',
        'neon-green': '#4cff94',
        'neon-purple': '#a66bff',
        terminal: '#07080f',
        panel: '#11131e'
      },
      boxShadow: {
        glow: '0 0 25px rgba(51,214,255,0.28), 0 0 50px rgba(76,255,148,0.16)'
      }
    }
  },
  plugins: []
};
