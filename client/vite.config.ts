import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
        server: {
            port: 3000,
            allowedHosts: ['197e-110-54-206-119.ngrok-free.app']
        },

        define: {
            // expose the non-VITE_ prefixed key into the client bundle
            'import.meta.env.VITE_GOOGLE_MAP_API_KEY': JSON.stringify(env.GOOGLE_MAP_API_KEY),
        },

        resolve: {
            dedupe: ['react', 'react-dom'],
        },

        build: {
            sourcemap: false,
        },
    }
})
