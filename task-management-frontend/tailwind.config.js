/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            keyframes: {
                'fade-in': {
                    '0%': { 
                        opacity: '0', 
                        transform: 'translateY(-10px)' 
                    },
                    '100%': { 
                        opacity: '1', 
                        transform: 'translateY(0)' 
                    }
                },
                'slide-down': {
                    '0%': { 
                        opacity: '0', 
                        maxHeight: '0', 
                        transform: 'translateY(-20px)' 
                    },
                    '100%': { 
                        opacity: '1', 
                        maxHeight: '1000px', 
                        transform: 'translateY(0)' 
                    }
                },
                'slide-up': {
                    '0%': { 
                        opacity: '0', 
                        transform: 'translateY(20px)' 
                    },
                    '100%': { 
                        opacity: '1', 
                        transform: 'translateY(0)' 
                    }
                },
                'scale-in': {
                    '0%': { 
                        opacity: '0', 
                        transform: 'scale(0.95)' 
                    },
                    '100%': { 
                        opacity: '1', 
                        transform: 'scale(1)' 
                    }
                },
                'bounce-subtle': {
                    '0%, 100%': { 
                        transform: 'translateY(0)' 
                    },
                    '50%': { 
                        transform: 'translateY(-5px)' 
                    }
                },
                'shimmer': {
                    '0%': { 
                        backgroundPosition: '-1000px 0' 
                    },
                    '100%': { 
                        backgroundPosition: '1000px 0' 
                    }
                }
            },
            animation: {
                'fade-in': 'fade-in 0.5s ease-out',
                'fade-in-fast': 'fade-in 0.3s ease-out',
                'fade-in-slow': 'fade-in 0.7s ease-out',
                'slide-down': 'slide-down 0.3s ease-out',
                'slide-up': 'slide-up 0.3s ease-out',
                'scale-in': 'scale-in 0.2s ease-out',
                'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite'
            }
        },
    },
    plugins: [],
}