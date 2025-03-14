import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Mock the ThemeContext
export const ThemeContext = React.createContext({
	theme: 'light',
	setTheme: () => {},
});

// Mock the ThemeProvider component
export const MockThemeProvider = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeContext.Provider value={{ theme: 'light', setTheme: () => {} }}>
			{children}
		</ThemeContext.Provider>
	);
};

// Mock the useToast hook
jest.mock('../hooks/useToast', () => ({
	useToast: () => ({
		toast: jest.fn(),
	}),
}));

// Custom render that includes providers
const customRender = (
	ui: ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>
) => {
	return render(ui, {
		wrapper: ({ children }) => (
			<MockThemeProvider>{children}</MockThemeProvider>
		),
		...options,
	});
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override render method
export { customRender as render };
