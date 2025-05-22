/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // NEPOUŽÍVÁME extend, pokud chceme úplně nahradit výchozí stack
    fontFamily: {
      // Definujeme celý stack pro 'sans', Roboto je první (tedy výchozí)
      sans: [
        'Roboto',
        'ui-sans-serif', // Běžný fallback pro systémové UI fonty
        'system-ui',
        '-apple-system', // Pro Apple systémy
        'BlinkMacSystemFont',
        '"Segoe UI"', // Pro Windows
        '"Helvetica Neue"',
        'Arial',
        '"Noto Sans"',
        'sans-serif', // Obecný sans-serif fallback
        '"Apple Color Emoji"', // Pro emoji
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
      // Můžete zde definovat i 'serif' nebo 'mono', pokud chcete
      // mono: [...]
    },
    extend: {
      // Zde můžete rozšiřovat *jiné* části theme, pokud potřebujete
      // např. barvy, spacing atd.
      // fontFamily sem už nepatří, pokud přepisujete celý stack výše
    },
  },
  plugins: [],
};
