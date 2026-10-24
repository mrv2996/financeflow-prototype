import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'], theme: { extend: { colors: { ink: '#17211f', forest: '#183e36', mint: '#e2f2e9', canvas: '#f6f8f6' }, boxShadow: { soft: '0 8px 30px rgba(23, 33, 31, .055)' } } }, plugins: [] } satisfies Config;
