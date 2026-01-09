import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ========================================
        // NUTANIX BRAND COLORS
        // ========================================
        
        // PRIMARY COLORS (Dominant)
        // Iris Purple - Main accent color
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7855fa', // Iris Purple
          600: '#6d4de6',
          700: '#5b3fd1',
          800: '#4c34b3',
          900: '#3d2a91',
        },
        
        // Charcoal Gray - Text & Dark elements
        charcoal: {
          DEFAULT: '#131313',
          50: '#f7f7f7',
          100: '#e3e3e3',
          200: '#c8c8c8',
          300: '#a4a4a4',
          400: '#818181',
          500: '#666666',
          600: '#515151',
          700: '#434343',
          800: '#383838',
          900: '#131313',
        },
        
        // SECONDARY COLORS (Highlights only)
        // Use sparingly as accents
        secondary: {
          cyan: '#1fdde9',    // Bright cyan
          lime: '#92dd23',    // Bright lime green
          coral: '#ff9178',   // Soft coral/salmon
        },
        
        // Chart colors - Mix of primary + secondary for variety
        chart: {
          purple: '#7855fa',  // Primary - Iris
          cyan: '#1fdde9',    // Secondary
          lime: '#92dd23',    // Secondary
          coral: '#ff9178',   // Secondary
          charcoal: '#131313', // Primary
          // Additional shades for more options
          purpleLight: '#a78bfa',
          cyanDark: '#0cb8c4',
          limeDark: '#6fb31a',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
