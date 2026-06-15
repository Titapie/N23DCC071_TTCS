// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [
        react({
            // Thêm các tùy chọn này nếu cần
            include: ['**/*.jsx', '**/*.js', '**/*.tsx', '**/*.ts']
        })
    ],
    optimizeDeps: {
        include: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities']
    }
})