'use client';

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>('dark');

	// Load theme from localStorage or use system preference on first load
	useEffect(() => {
		const storedTheme = localStorage.getItem('theme') as Theme | null;
		if (storedTheme) {
			setTheme(storedTheme);
		} else {
			// Check system preference
			const systemPrefersDark = window.matchMedia(
				'(prefers-color-scheme: dark)'
			).matches;
			setTheme(systemPrefersDark ? 'dark' : 'light');
		}
	}, []);

	// Update HTML class and localStorage when theme changes
	useEffect(() => {
		const htmlElement = document.documentElement;

		// Add transitioning class for smooth transitions
		htmlElement.classList.add('transitioning');

		if (theme === 'dark') {
			htmlElement.classList.add('dark');
		} else {
			htmlElement.classList.remove('dark');
		}

		localStorage.setItem('theme', theme);

		// Remove transitioning class after transition completes
		const transitionTimeout = setTimeout(() => {
			htmlElement.classList.remove('transitioning');
		}, 200);

		return () => clearTimeout(transitionTimeout);
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}
