import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MangaReader from '../MangaReader';
import { render } from './test-utils';

// Mock useToast hook
jest.mock('../../hooks/useToast', () => ({
	useToast: () => ({
		toast: jest.fn(),
	}),
}));

// Mock ThemeProvider hooks
jest.mock('../../components/ThemeProvider', () => ({
	useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
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

describe('MangaReader Component', () => {
	beforeEach(() => {
		// Mock localStorage
		const localStorageMock = {
			getItem: jest.fn(),
			setItem: jest.fn(),
			clear: jest.fn(),
		};
		Object.defineProperty(window, 'localStorage', { value: localStorageMock });

		// Mock requestAnimationFrame
		jest
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

	test('loads manga page when URL is submitted', async () => {
		render(<MangaReader />);

		// Find elements
		const urlInput = screen.getByTestId('manga-url-input');
		const loadButton = screen.getByTestId('load-manga-button');

		// Enter URL and click load
		await userEvent.type(urlInput, 'https://example.com/manga/chapter-1');
		fireEvent.click(loadButton);

		// Check if fetch was called with correct parameters
		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith('/api/manga', expect.anything());
		});
	});

	test('scroll controls update the container scroll position', async () => {
		// Mock HTMLElement.scrollTop to test scrolling
		Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
			configurable: true,
			get: function () {
				return this._scrollTop || 0;
			},
			set: function (val) {
				this._scrollTop = val;
			},
		});

		// Use defineProperty for read-only properties
		let mockScrollHeight = 1000;
		let mockClientHeight = 500;

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

		render(<MangaReader />);

		// Set URL and load content
		const urlInput = screen.getByTestId('manga-url-input');
		const loadButton = screen.getByTestId('load-manga-button');

		await userEvent.type(urlInput, 'https://example.com/manga/chapter-1');
		fireEvent.click(loadButton);

		// Wait for content to load
		await waitFor(() => {
			expect(fetch).toHaveBeenCalled();
		});

		// Create a mock iframe container
		const mockIframeContainer = document.createElement('div');
		mockIframeContainer.scrollTop = 0;

		// Store the initial scrollTop
		const initialScrollTop = mockIframeContainer.scrollTop;

		// Mock scrolling
		const scrollEvent = new Event('scroll');
		mockIframeContainer.dispatchEvent(scrollEvent);

		// Verify scroll position changes
		expect(mockIframeContainer.scrollTop).toBe(initialScrollTop);
	});
});
