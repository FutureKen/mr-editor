import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/mr-editor/',
  plugins: [
    react({
      // Use Babel integration for broader compatibility, including JSX in .js files
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ],
      },
    }),
    tailwindcss()
  ],
})