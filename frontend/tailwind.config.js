/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                industrial: {
                    900: '#0f172a', // Slate 900
                    800: '#1e293b', // Slate 800
                    500: '#64748b', // Slate 500
                    100: '#f1f5f9', // Slate 100
                },
                alarm: {
                    DEFAULT: '#ef4444', // Red 500
                    dark: '#991b1b',    // Red 800
                },
                safe: {
                    DEFAULT: '#10b981', // Emerald 500
                    dark: '#064e3b',    // Emerald 900
                },
                warning: {
                    DEFAULT: '#f59e0b', // Amber 500
                }
            }
        },
    },
    plugins: [],
}
