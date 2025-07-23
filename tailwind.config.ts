import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				game: {
					'hole-dark': 'hsl(var(--hole-dark))',
					'hole-light': 'hsl(var(--hole-light))',
					'grass-primary': 'hsl(var(--grass-primary))',
					'grass-secondary': 'hsl(var(--grass-secondary))',
					'sky-start': 'hsl(var(--sky-start))',
					'sky-end': 'hsl(var(--sky-end))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-sky': 'var(--gradient-sky)',
				'gradient-grass': 'var(--gradient-grass)',
				'gradient-hole': 'var(--gradient-hole)',
				'gradient-gold': 'var(--gradient-gold)'
			},
			boxShadow: {
				'hole': 'var(--shadow-hole)',
				'mole': 'var(--shadow-mole)',
				'card-game': 'var(--shadow-card)',
				'glow-hit': 'var(--glow-hit)'
			},
			transitionTimingFunction: {
				'bounce': 'var(--transition-bounce)',
				'smooth': 'var(--transition-smooth)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'mole-pop': {
					'0%': { transform: 'translateY(100%) scale(0.8)', opacity: '0' },
					'20%': { transform: 'translateY(60%) scale(0.9)', opacity: '0.5' },
					'100%': { transform: 'translateY(0%) scale(1)', opacity: '1' }
				},
				'mole-hide': {
					'0%': { transform: 'translateY(0%) scale(1)', opacity: '1' },
					'80%': { transform: 'translateY(60%) scale(0.9)', opacity: '0.5' },
					'100%': { transform: 'translateY(100%) scale(0.8)', opacity: '0' }
				},
				'hit-effect': {
					'0%': { transform: 'scale(1)', opacity: '1' },
					'50%': { transform: 'scale(1.3)', opacity: '0.8' },
					'100%': { transform: 'scale(1.6)', opacity: '0' }
				},
				'score-popup': {
					'0%': { transform: 'translateY(0) scale(0.5)', opacity: '0' },
					'50%': { transform: 'translateY(-20px) scale(1.2)', opacity: '1' },
					'100%': { transform: 'translateY(-40px) scale(1)', opacity: '0' }
				},
				'board-scale': {
					'0%': { transform: 'scale(0.7)' },
					'100%': { transform: 'scale(1.3)' }
				},
				'bounce-in': {
					'0%': { transform: 'scale(0.3)', opacity: '0' },
					'50%': { transform: 'scale(1.05)' },
					'70%': { transform: 'scale(0.9)' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'wiggle': {
					'0%, 100%': { transform: 'rotate(-3deg)' },
					'50%': { transform: 'rotate(3deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'mole-pop': 'mole-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'mole-hide': 'mole-hide 0.2s ease-in',
				'hit-effect': 'hit-effect 0.4s ease-out',
				'score-popup': 'score-popup 0.8s ease-out',
				'board-scale': 'board-scale 60s linear',
				'bounce-in': 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'wiggle': 'wiggle 0.5s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
