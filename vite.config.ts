import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        istanbul({
            include: 'resources/js/**/*',
            exclude: ['node_modules', 'tests/', 'vendor/'],
            extension: ['.js', '.ts', '.tsx'],
            requireEnv: false,
            forceBuildInstrument: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
