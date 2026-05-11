import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Nome do repositório no GitHub Pages
  base: '/Barbearia_Agendamento/',
})
