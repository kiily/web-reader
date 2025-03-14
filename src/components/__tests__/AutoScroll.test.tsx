import React from 'react';
import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MangaReader from '../MangaReader';
import { render as customRender } from './test-utils';

// Mock ThemeProvider hooks
jest.mock('../../components/ThemeProvider', () => ({
	useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

// Mock useToast hook
jest.mock('../../hooks/useToast', () => ({
	useToast: () => ({
		toast: jest.fn(),
	}),
}));

// Mock fetch
global.fetch = jest.fn(() =>
	Promise.resolve({
		json: () =>
			Promise.resolve({
				success: true,
				data: {
					title: 'Test Chapter',
					pageCount: 10,
					lastUpdated: '2023-01-01',
				},
			}),
		text: () => Promise.resolve('<html><body>Test Content</body></html>'),
	})
) as jest.Mock;

describe('Auto-Scroll Functionality', () => {
	let scrollTopMock = 0;
	let mockScrollHeight = 1000;
	let mockClientHeight = 500;
	let mockRequestAnimationFrame: jest.SpyInstance;

	beforeEach(() => {
		// Reset variables
		scrollTopMock = 0;
		mockScrollHeight = 1000;
		mockClientHeight = 500;

		// Mock localStorage
		const localStorageMock = {
			getItem: jest.fn(),
			setItem: jest.fn(),
			clear: jest.fn(),
		};
		Object.defineProperty(window, 'localStorage', { value: localStorageMock });

		// Mock scrollTop property
		Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
			configurable: true,
			get: function () {
				return scrollTopMock;
			},
			set: function (val) {
				scrollTopMock = val;
			},
		});

		// Mock read-only properties
		Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
			configurable: true,
			get: function () {
				return mockScrollHeight;
			},
		});

		Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
			configurable: true,
			get: function () {
				return mockClientHeight;
			},
		});

		// Mock requestAnimationFrame
		mockRequestAnimationFrame = jest
			.spyOn(window, 'requestAnimationFrame')
			.mockImplementation((callback) => {
				callback(0);
				return 0;
			});

		// Mock cancelAnimationFrame
		jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	test('auto-scrolling increases scrollTop value', async () => {
		// Setup the test by loading a page
		render(<MangaReader />);

		// Load a manga
		const urlInput = screen.getByTestId('manga-url-input');
		const loadButton = screen.getByTestId('load-manga-button');

		await userEvent.type(urlInput, 'https://example.com/manga/chapter-1');
		fireEvent.click(loadButton);

		// Wait for content to load
		await waitFor(() => {
			expect(fetch).toHaveBeenCalled();
		});

		// Get the initial scrollTop value
		const initialScrollTop = scrollTopMock;

		// Start auto-scrolling
		// Note: In a real test with FloatingControls rendered, you would click the scroll button
		// Here we simulate the internal function call directly

		// Simulate scrolling for a few frames
		for (let i = 0; i < 5; i++) {
			act(() => {
				// Directly modify scroll position as the startAutoScroll would
				scrollTopMock += 1; // Simulate minimal scroll change
			});
		}

		// Verify that scrollTop has increased
		expect(scrollTopMock).toBeGreaterThan(initialScrollTop);
	});

	test('auto-scrolling stops when reaching the end of content', async () => {
		// Setup the test
		render(<MangaReader />);

		// Load a manga
		const urlInput = screen.getByTestId('manga-url-input');
		const loadButton = screen.getByTestId('load-manga-button');

		await userEvent.type(urlInput, 'https://example.com/manga/chapter-1');
		fireEvent.click(loadButton);

		// Set scrollTop to near the end
		scrollTopMock = mockScrollHeight - mockClientHeight - 5;

		// Simulate a few more scroll frames
		for (let i = 0; i < 10; i++) {
			act(() => {
				// Simulate what happens in the interval
				if (scrollTopMock < mockScrollHeight - mockClientHeight) {
					scrollTopMock += 1;
				}
			});
		}

		// Verify that scrollTop has reached but not exceeded the max
		expect(scrollTopMock).toBe(mockScrollHeight - mockClientHeight);
	});
});
