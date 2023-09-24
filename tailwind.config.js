module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: {
    background: '#ffffff', foreground: '#263a40', primary: { DEFAULT: '#275f55', foreground: '#ffffff' },
    input: '#9caeaa', ring: '#b67927', accent: { DEFAULT: '#edf4f1', foreground: '#263a40' },
    secondary: { DEFAULT: '#edf4f1', foreground: '#263a40' }, destructive: { DEFAULT: '#a13e36', foreground: '#ffffff' },
    muted: { foreground: '#5c6c69' }
  } } }, plugins: []
};
