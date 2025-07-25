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
				"gradient-sky": "linear-gradient(135deg, hsl(280 78% 15%), hsl(280 45% 25%))", /* Deep purple gradient */
				"gradient-grass": "linear-gradient(135deg, hsl(328 100% 54%), hsl(16 100% 50%))", /* Hot pink to electric orange */
				"gradient-hole": "radial-gradient(circle at 30% 30%, hsl(280 78% 20%), hsl(280 78% 10%))", /* Purple hole depth */
				"gradient-gold": "linear-gradient(135deg, hsl(180 100% 50%), hsl(180 100% 70%))", /* Cyan gradient */
				"gradient-neon": "linear-gradient(135deg, hsl(328 100% 54%), hsl(180 100% 50%))", /* Pink to cyan neon */
			},
			boxShadow: {
				"card-game": "0 8px 32px -8px hsl(328 100% 54% / 0.4), 0 0 0 1px hsl(280 45% 30%)",
				"hole": "inset 0 4px 12px hsl(280 78% 5%), 0 2px 8px hsl(280 78% 5% / 0.8)",
				"mole": "0 4px 16px hsl(328 100% 54% / 0.8), 0 2px 8px hsl(328 100% 54% / 0.6)",
				"hit-effect": "0 0 20px hsl(16 100% 50%), 0 0 40px hsl(16 100% 50% / 0.5)",
				"particle": "0 0 12px hsl(180 100% 50%), 0 0 24px hsl(180 100% 50% / 0.7)",
				"neon-pink": "0 0 30px hsl(328 100% 54%), 0 0 60px hsl(328 100% 54% / 0.5)",
				"neon-cyan": "0 0 30px hsl(180 100% 50%), 0 0 60px hsl(180 100% 50% / 0.5)",
				"neon-orange": "0 0 30px hsl(16 100% 50%), 0 0 60px hsl(16 100% 50% / 0.5)",
			},
			transitionTimingFunction: {
				"bounce-custom": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
				"elastic": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0", opacity: "0" },
					to: { height: "var(--radix-accordion-content-height)", opacity: "1" }
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
					to: { height: "0", opacity: "0" }
				},
				"fade-in": {
					"0%": { opacity: "0", transform: "translateY(10px)" },
					"100%": { opacity: "1", transform: "translateY(0)" }
				},
				"fade-out": {
					"0%": { opacity: "1", transform: "translateY(0)" },
					"100%": { opacity: "0", transform: "translateY(10px)" }
				},
				"scale-in": {
					"0%": { transform: "scale(0.8)", opacity: "0" },
					"100%": { transform: "scale(1)", opacity: "1" }
				},
				"scale-out": {
					"0%": { transform: "scale(1)", opacity: "1" },
					"100%": { transform: "scale(0.8)", opacity: "0" }
				},
				"slide-up": {
					"0%": { transform: "translateY(0)" },
					"100%": { transform: "translateY(-40px)", opacity: "0" }
				},
				"wiggle": {
					"0%, 100%": { transform: "rotate(-3deg)" },
					"50%": { transform: "rotate(3deg)" }
				},
				"wiggle-anticipation": {
					"0%": { transform: "scale(1) rotate(0deg)" },
					"25%": { transform: "scale(0.95) rotate(-2deg)" },
					"50%": { transform: "scale(1.05) rotate(2deg)" },
					"75%": { transform: "scale(0.98) rotate(-1deg)" },
					"100%": { transform: "scale(1) rotate(0deg)" }
				},
				"particle-burst": {
					"0%": { 
						transform: "scale(0) rotate(0deg)",
						opacity: "1"
					},
					"50%": {
						transform: "scale(1.2) rotate(180deg)",
						opacity: "0.8"
					},
					"100%": {
						transform: "scale(0.5) rotate(360deg)",
						opacity: "0"
					}
				},
				"sparkle": {
					"0%": { 
						transform: "scale(0) rotate(0deg)",
						opacity: "1"
					},
					"50%": {
						transform: "scale(1) rotate(180deg)",
						opacity: "1"
					},
					"100%": {
						transform: "scale(0) rotate(360deg)",
						opacity: "0"
					}
				},
				"hole-depth": {
					"0%": { transform: "scale(1)" },
					"50%": { transform: "scale(0.95)" },
					"100%": { transform: "scale(1)" }
				},
				"mole-pop": {
					"0%": { transform: "translateY(100%) scale(0.8)", opacity: "0" },
					"20%": { transform: "translateY(60%) scale(0.9)", opacity: "0.5" },
					"100%": { transform: "translateY(0%) scale(1)", opacity: "1" }
				},
				"hit-effect": {
					"0%": { transform: "scale(1)", opacity: "1" },
					"50%": { transform: "scale(1.3)", opacity: "0.8" },
					"100%": { transform: "scale(1.6)", opacity: "0" }
				},
				"score-popup": {
					"0%": { transform: "translateY(0) scale(0.5)", opacity: "0" },
					"50%": { transform: "translateY(-20px) scale(1.2)", opacity: "1" },
					"100%": { transform: "translateY(-40px) scale(1)", opacity: "0" }
				},
				"bounce-in": {
					"0%": { transform: "scale(0.3)", opacity: "0" },
					"50%": { transform: "scale(1.05)" },
					"70%": { transform: "scale(0.9)" },
					"100%": { transform: "scale(1)", opacity: "1" }
				}
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"fade-in": "fade-in 0.3s ease-out",
				"fade-out": "fade-out 0.3s ease-out",
				"scale-in": "scale-in 0.2s ease-out",
				"scale-out": "scale-out 0.2s ease-out",
				"slide-in-right": "slide-in-right 0.3s ease-out",
				"slide-out-right": "slide-out-right 0.3s ease-out",
				"mole-pop": "scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), wiggle-anticipation 0.2s ease-out",
				"mole-anticipation": "wiggle-anticipation 0.4s ease-out",
				"hit-effect": "scale-in 0.2s ease-out, fade-out 0.4s ease-out 0.1s",
				"score-popup": "fade-in 0.2s ease-out, slide-up 0.8s ease-out",
				"bounce-in": "scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
				"wiggle": "wiggle 0.5s ease-in-out infinite",
				"particle-burst": "particle-burst 0.6s ease-out forwards",
				"sparkle": "sparkle 0.8s ease-out forwards",
				"hole-depth": "hole-depth 0.3s ease-out",
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
