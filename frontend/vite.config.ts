import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'; // Cần import module 'path'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Sử dụng path.resolve để ánh xạ @/ tới ./src
      "@": path.resolve(__dirname, "./src"),
    },
  }
})
