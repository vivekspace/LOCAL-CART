import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  
  // Add these configurations:
  server: {
    port: 5173, // Match your frontend dev port
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your Express server
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
      target: 'ws://localhost:5000',
      ws: true
    }
    }
  },
  build: {
    outDir: '../server/public', // Adjust if using different build location
    emptyOutDir: true,
    sourcemap: true // Recommended for debugging
  },
  optimizeDeps: {
    include: ['react-router-dom'] // Ensure smooth routing
  }
});