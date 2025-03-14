'use client';

import React, {
	useState,
	useRef,
	useEffect,
	ChangeEvent,
	useTransition,
	useCallback,
} from 'react';
import NavBar from './NavBar';
import Newsletter from './Newsletter';
import FloatingControls from './FloatingControls';
import ControlPanel from './ControlPanel';
import HelpModal from './HelpModal';
import { useToast } from '../hooks/useToast';
import { ChapterInfo } from '../types/manga';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from './ThemeProvider';

// Get environment variables with fallbacks
const baseMangaApiUrl =
	process.env.NEXT_PUBLIC_MANGA_API_URL || 'https://api.mangadex.org';
const baseUploadApiUrl =
	process.env.NEXT_PUBLIC_UPLOAD_API_URL || 'https://uploads.mangadex.org';
const defaultPattern = process.env.NEXT_PUBLIC_DEFAULT_PATTERN || 'chapter-{n}';
const defaultScrollSpeed = parseInt(
	process.env.NEXT_PUBLIC_DEFAULT_SCROLL_SPEED || '1',
	10
);

export default function MangaReader() {
	const [url, setUrl] = useState<string>('');
	const [inputUrl, setInputUrl] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
	const [scrollSpeed, setScrollSpeed] = useState<number>(defaultScrollSpeed);
	const [nextChapterPattern, setNextChapterPattern] =
		useState<string>(defaultPattern);
	const [currentChapter, setCurrentChapter] = useState<number>(1);
	const [showHelp, setShowHelp] = useState<boolean>(false);
	const [showControls, setShowControls] = useState<boolean>(false);
	const [chapterInfo, setChapterInfo] = useState<ChapterInfo | null>(null);
	const [isPending, startTransition] = useTransition();
	const [containerHeight, setContainerHeight] = useState<number>(0);
	const [contentLoaded, setContentLoaded] = useState<boolean>(false);
	const [scrollPosition, setScrollPosition] = useState<number>(0);

	const { theme } = useTheme();
	const { toast } = useToast();
	const router = useRouter();
	const searchParams = useSearchParams();

	// Refs for DOM elements and scroll management
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const iframeContainerRef = useRef<HTMLDivElement>(null);
	const autoScrollAnimationRef = useRef<number | null>(null);
	const contentLoadedRef = useRef<boolean>(false);
	const previousScrollTopRef = useRef<number>(0);
	const noScrollChangeCountRef = useRef<number>(0);

	// Load saved URL from localStorage on mount
	useEffect(() => {
		const savedUrl = localStorage.getItem('mangaUrl');
		if (savedUrl) {
			setInputUrl(savedUrl);
			// Don't automatically load the URL to avoid unexpected network requests
		}
	}, []);

	// Update container height on window resize
	useEffect(() => {
		const updateContainerHeight = () => {
			if (iframeContainerRef.current) {
				// Calculate available height by subtracting navbar height (approximately)
				const navbarHeight = 64; // Approximate height of navbar in pixels
				const windowHeight = window.innerHeight;
				const newHeight = windowHeight - navbarHeight;
				setContainerHeight(newHeight);
			}
		};

		// Set initial height
		updateContainerHeight();

		// Add resize event listener
		window.addEventListener('resize', updateContainerHeight);

		// Clean up
		return () => {
			window.removeEventListener('resize', updateContainerHeight);
		};
	}, []);

	// Parse URL from search params
	useEffect(() => {
		const urlParam = searchParams.get('url');
		if (urlParam) {
			const decodedUrl = decodeURIComponent(urlParam);
			setInputUrl(decodedUrl);
			setUrl(decodedUrl);
		}
	}, [searchParams]);

	// Function to extract chapter number from URL
	const extractChapterNumber = (url: string): number => {
		const match = url.match(/chapter-(\d+)/i);
		return match ? parseInt(match[1], 10) : 1;
	};

	// Function to log manga view via API
	const logMangaView = async (url: string, chapter: number) => {
		try {
			const response = await fetch('/api/manga', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'logView',
					url,
					chapter,
				}),
			});
			return await response.json();
		} catch (error) {
			console.error('Error logging manga view:', error);
			return { success: false };
		}
	};

	// Function to fetch chapter info via API
	const fetchChapterInfo = async (url: string) => {
		try {
			const response = await fetch('/api/manga', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'fetchInfo',
					url,
				}),
			});
			return await response.json();
		} catch (error) {
			console.error('Error fetching chapter info:', error);
			return { success: false };
		}
	};

	/**
	 * Auto Scroll Implementation
	 *
	 * The scrolling mechanism works as follows:
	 * 1. User initiates auto-scrolling with startAutoScroll()
	 * 2. We use requestAnimationFrame to create a smooth animation loop (performScroll)
	 * 3. Each frame, we increment the scroll position by a small amount based on speed
	 * 4. We detect the end of content through multiple methods to handle cross-origin limitations
	 * 5. When end is detected or user manually scrolls, scrolling stops
	 *
	 * Challenges addressed:
	 * - Cross-origin iframe content means we can't directly access content dimensions
	 * - We need to detect scrolling limits even when scrollHeight/offsetHeight are inaccurate
	 * - Animation must be smooth across different content sizes and speeds
	 */

	// Auto scroll logic using requestAnimationFrame for smoother scrolling
	const performScroll = useCallback(() => {
		// Don't check isAutoScrolling here, as it might have changed between frames
		if (!iframeContainerRef.current || !contentLoadedRef.current) return;

		const container = iframeContainerRef.current;

		// Use scrollHeight and clientHeight for more accurate measurement
		// offsetHeight includes borders which can cause issues
		let scrollLimit = container.scrollHeight - container.clientHeight;

		// Debug logs removed in production - uncomment if needed
		// console.log('scrollLimit:', scrollLimit, 'scrollTop:', container.scrollTop);

		/**
		 * Handle difficult-to-detect end conditions:
		 *
		 * 1. When scrollLimit is incorrectly calculated as 0 or negative (common with iframes)
		 * 2. When we can't detect actual scroll dimensions due to cross-origin restrictions
		 * In these cases, we rely on detecting if scroll position stops changing
		 */
		if (scrollLimit <= 10) {
			// Small buffer to account for rounding errors
			// If we can't trust scrollLimit, use a large fallback value
			scrollLimit = 10000;

			// Detect if we've reached the bottom by checking if scroll position hasn't changed
			// after multiple scroll attempts despite our attempts to scroll
			if (
				container.scrollTop > 0 &&
				container.scrollTop === previousScrollTopRef.current
			) {
				// Increment our counter tracking consecutive frames without scroll change
				noScrollChangeCountRef.current += 1;

				// If we've had several frames with no scroll movement, we've likely hit the bottom
				if (noScrollChangeCountRef.current >= 3) {
					// 3 frames is enough to detect the end
					// Stop scrolling and notify the user
					if (autoScrollAnimationRef.current) {
						cancelAnimationFrame(autoScrollAnimationRef.current);
						autoScrollAnimationRef.current = null;
					}
					setIsAutoScrolling(false);

					toast({
						title: 'End of chapter',
						description: "You've reached the end of this chapter.",
					});
					return;
				}
			} else {
				// Reset the counter if scroll position has changed
				noScrollChangeCountRef.current = 0;
			}

			// Save current position for next comparison
			previousScrollTopRef.current = container.scrollTop;
		} else if (container.scrollTop >= scrollLimit - 5) {
			/**
			 * Standard end detection:
			 * When scrollLimit is correctly calculated and we've reached it
			 */
			// 5px buffer for rounding
			if (autoScrollAnimationRef.current) {
				cancelAnimationFrame(autoScrollAnimationRef.current);
				autoScrollAnimationRef.current = null;
			}
			setIsAutoScrolling(false);

			toast({
				title: 'End of chapter',
				description: "You've reached the end of this chapter.",
			});
			return;
		}

		/**
		 * Calculate scroll step:
		 * 1. Base it on content size for proportional scrolling speed on different content
		 * 2. Ensure a minimum scroll amount for very small content
		 * 3. Scale by user-selected speed
		 */
		const scrollStep = Math.max(
			(scrollSpeed * Math.max(container.scrollHeight, 1000)) / 5000,
			scrollSpeed * 0.2
		);

		// Move down by the calculated step
		container.scrollTop += scrollStep;

		// Continue the animation only if we're still auto-scrolling
		if (isAutoScrolling) {
			autoScrollAnimationRef.current = requestAnimationFrame(performScroll);
		}
	}, [isAutoScrolling, scrollSpeed, toast]);

	/**
	 * Start auto-scrolling function
	 *
	 * This initializes the scrolling mechanism and begins the animation loop
	 */
	const startAutoScroll = useCallback(() => {
		const container = iframeContainerRef.current;
		if (!container) {
			setError(
				'Could not access the manga content. Please try reloading the page.'
			);
			return;
		}

		if (!contentLoadedRef.current) {
			toast({
				title: 'Content still loading',
				description:
					'Please wait for the content to fully load before scrolling.',
			});
			return;
		}

		// Safety: Cancel any existing animation frames first
		if (autoScrollAnimationRef.current) {
			cancelAnimationFrame(autoScrollAnimationRef.current);
			autoScrollAnimationRef.current = null;
		}

		// Reset tracking variables to start with a clean state
		previousScrollTopRef.current = container.scrollTop;
		noScrollChangeCountRef.current = 0;

		// Set state BEFORE starting animation to ensure UI is responsive
		setIsAutoScrolling(true);

		// Begin the animation loop immediately (on the next frame)
		autoScrollAnimationRef.current = requestAnimationFrame(performScroll);

		console.log(`Auto-scrolling started with speed ${scrollSpeed}`);
	}, [performScroll, scrollSpeed, toast]);

	/**
	 * Pause auto-scrolling function
	 *
	 * Stops the animation loop and updates UI state
	 */
	const pauseAutoScroll = useCallback(() => {
		// Cancel animation frame FIRST to prevent additional frames
		if (autoScrollAnimationRef.current) {
			cancelAnimationFrame(autoScrollAnimationRef.current);
			autoScrollAnimationRef.current = null;
		}

		// Then update state to reflect UI changes
		setIsAutoScrolling(false);
		console.log('Auto-scrolling paused');
	}, []);

	// Handle iframe load events
	const handleIframeLoad = useCallback(() => {
		console.log('Iframe content loaded successfully');
		contentLoadedRef.current = true;
		setIsLoading(false);
		setContentLoaded(true);

		// Reset scroll tracking
		previousScrollTopRef.current = 0;
		noScrollChangeCountRef.current = 0;

		// Reset scroll position
		if (iframeContainerRef.current) {
			iframeContainerRef.current.scrollTop = 0;
		}

		// Stop auto-scrolling when new content is loaded
		if (isAutoScrolling) {
			console.log(
				'🚀 ~ handleIframeLoad ~ handleIframeLoad:',
				handleIframeLoad
			);

			pauseAutoScroll();
		}

		// Try to adjust iframe height based on content
		try {
			const iframe = iframeRef.current;
			if (iframe && iframe.contentWindow && iframe.contentDocument) {
				// Set minimum height to viewport height
				const minHeight = window.innerHeight - 64; // Subtract navbar height

				// Get actual content height
				const bodyHeight = iframe.contentDocument.body.scrollHeight;

				// Use the larger of the two
				const targetHeight = Math.max(minHeight, bodyHeight);

				// Set iframe height
				iframe.style.height = `${targetHeight}px`;

				console.log(`Adjusted iframe height to ${targetHeight}px`);

				// Force a reflow to ensure scrollHeight is calculated correctly
				if (iframeContainerRef.current) {
					// Reading a property forces a reflow
					const forceReflow = iframeContainerRef.current.scrollHeight;
				}
			}
		} catch (e) {
			// This might fail due to cross-origin restrictions
			console.error('Could not adjust iframe height:', e);

			// Fallback to using a fixed height
			if (iframeRef.current) {
				iframeRef.current.style.height = '100%';
			}
		}
		console.log('🚀 ~ handleIframeLoad ~ handleIframeLoad:', handleIframeLoad);
	}, [isAutoScrolling, pauseAutoScroll]);

	// Handle iframe loading errors
	const handleIframeError = () => {
		console.error('Error loading iframe content');
		contentLoadedRef.current = false;
		setIsLoading(false);
		setError(
			'Failed to load manga content. The URL might be invalid or the server is not responding.'
		);
	};

	// Update scrolling when speed changes while active
	useEffect(() => {
		if (isAutoScrolling) {
			// Restart scrolling with new speed
			pauseAutoScroll();
			startAutoScroll();
		}
	}, [scrollSpeed, isAutoScrolling, pauseAutoScroll, startAutoScroll]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (autoScrollAnimationRef.current) {
				cancelAnimationFrame(autoScrollAnimationRef.current);
			}
		};
	}, []);

	// Function to load the manga page
	const loadPage = async () => {
		if (!inputUrl) {
			setError('Please enter a URL');
			return;
		}

		setIsLoading(true);
		setError(null);
		pauseAutoScroll(); // Ensure any ongoing scrolling is stopped
		contentLoadedRef.current = false;

		try {
			// Extract chapter number from URL
			const chapter = extractChapterNumber(inputUrl);
			setCurrentChapter(chapter);

			// Save URL to localStorage
			localStorage.setItem('mangaUrl', inputUrl);

			// Set the URL directly - we'll use proxy URL when rendering
			setUrl(inputUrl);

			// Reset scroll position when loading a new page
			if (iframeContainerRef.current) {
				iframeContainerRef.current.scrollTop = 0;
			}

			// Use API calls instead of server actions
			startTransition(async () => {
				try {
					// Log the view using API
					await logMangaView(inputUrl, chapter);

					// Fetch chapter info using API
					const result = await fetchChapterInfo(inputUrl);
					if (result.success && result.data) {
						setChapterInfo(result.data as ChapterInfo);
					}
				} catch (error) {
					console.error('API call error:', error);
				}
			});
		} catch (error) {
			console.error('Error loading page:', error);
			setError('An error occurred while loading the page');
		} finally {
			setIsLoading(false);
			// Hide controls when page loads for immersive reading
			setShowControls(false);
		}
	};

	// Function to load the previous chapter
	const loadPreviousChapter = () => {
		if (currentChapter <= 1) {
			setError('You are already at the first chapter');
			return;
		}

		const prevChapter = currentChapter - 1;

		// Replace the chapter number in the URL based on the pattern
		const newUrl = inputUrl.replace(
			new RegExp(nextChapterPattern.replace('{n}', '\\d+')),
			nextChapterPattern.replace('{n}', prevChapter.toString())
		);

		setInputUrl(newUrl);
		// Don't change the current chapter yet - wait for the load to succeed

		// Stop any ongoing scrolling
		pauseAutoScroll();

		// Load the new page (this will update all necessary state)
		loadPage();
	};

	// Function to load the next chapter
	const loadNextChapter = () => {
		const nextChapter = currentChapter + 1;

		// Replace the chapter number in the URL based on the pattern
		const newUrl = inputUrl.replace(
			new RegExp(nextChapterPattern.replace('{n}', '\\d+')),
			nextChapterPattern.replace('{n}', nextChapter.toString())
		);

		setInputUrl(newUrl);
		// Don't change the current chapter yet - wait for the load to succeed

		// Stop any ongoing scrolling
		pauseAutoScroll();

		// Load the new page (this will update all necessary state)
		loadPage();
	};

	// Function to manually adjust scroll position
	const handleManualScroll = () => {
		// If user is manually scrolling, pause any auto-scrolling
		if (isAutoScrolling) {
			// pauseAutoScroll();
		}
	};

	// Toggle controls visibility
	const toggleControls = () => {
		setShowControls(!showControls);
	};

	// Handle input changes with proper typing
	const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
		setInputUrl(e.target.value);
	};

	const handleSpeedChange = (e: ChangeEvent<HTMLInputElement>) => {
		setScrollSpeed(parseInt(e.target.value, 10));
	};

	const handlePatternChange = (e: ChangeEvent<HTMLInputElement>) => {
		setNextChapterPattern(e.target.value);
	};

	// Proxy URL through our API to avoid CORS issues
	const proxyUrl = url ? `/api/proxy/${url.replace(/^https?:\/\//, '')}` : '';

	// Function to handle keyboard shortcuts
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			// Only handle shortcuts if content is loaded
			if (!contentLoadedRef.current) return;

			switch (e.key) {
				case ' ': // Space to toggle auto-scroll
					e.preventDefault();
					if (isAutoScrolling) {
						pauseAutoScroll();
					} else {
						startAutoScroll();
					}
					break;
				case 'ArrowUp': // Speed up scrolling
					if (e.shiftKey) {
						e.preventDefault();
						setScrollSpeed((prev) => Math.min(prev + 0.5, 10));
					}
					break;
				case 'ArrowDown': // Slow down scrolling
					if (e.shiftKey) {
						e.preventDefault();
						setScrollSpeed((prev) => Math.max(prev - 0.5, 0.5));
					}
					break;
				case 'h': // Toggle help
					setShowHelp(true);
					break;
				case 'Escape': // Close help
					if (showHelp) {
						setShowHelp(false);
					}
					break;
			}
		},
		[isAutoScrolling, startAutoScroll, pauseAutoScroll, showHelp]
	);

	// Add keyboard event listeners
	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);

	return (
		<div className="min-h-screen text-gray-900 dark:text-gray-200 flex flex-col">
			{/* Main container with maximized reading area */}
			<div className="flex flex-col h-screen">
				{/* Navbar using the component */}
				<NavBar
					toggleControls={toggleControls}
					toggleHelp={() => setShowHelp(true)}
					title="Manga Reader"
					// subtitle={chapterInfo?.title}
				/>

				{/* Control Panel using the component */}
				<ControlPanel
					isOpen={showControls}
					inputUrl={inputUrl}
					onUrlChange={handleUrlChange}
					scrollSpeed={scrollSpeed}
					onScrollSpeedChange={handleSpeedChange}
					nextChapterPattern={nextChapterPattern}
					onPatternChange={handlePatternChange}
					isLoading={isLoading}
					isPending={isPending}
					isAutoScrolling={isAutoScrolling}
					currentChapter={currentChapter}
					error={error}
					chapterInfo={chapterInfo}
					onLoadPage={loadPage}
					onStartAutoScroll={startAutoScroll}
					onPauseAutoScroll={pauseAutoScroll}
					onPreviousChapter={loadPreviousChapter}
					onNextChapter={loadNextChapter}
				/>

				{/* Maximized reading area */}
				{url ? (
					<div className="flex-1 relative" data-testid="manga-reader-container">
						<div
							ref={iframeContainerRef}
							className="w-full h-[100dvh] overflow-auto bg-gray-100 dark:bg-gray-900"
							onScroll={handleManualScroll}
							data-testid="iframe-container"
						>
							{isLoading && (
								<div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-900/80 z-10">
									<div className="flex flex-col items-center">
										<div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin mb-4"></div>
										<p className="text-gray-700 dark:text-gray-300">
											Loading content...
										</p>
									</div>
								</div>
							)}
							<iframe
								ref={iframeRef}
								src={proxyUrl}
								className={`w-full h-full border-0 ${
									theme === 'dark' ? 'invert' : ''
								}`}
								onLoad={handleIframeLoad}
								onError={handleIframeError}
								sandbox="allow-same-origin"
								data-testid="manga-iframe"
							/>
						</div>

						{/* Floating Controls */}
						<FloatingControls
							isAutoScrolling={isAutoScrolling}
							scrollSpeed={scrollSpeed}
							onScrollSpeedChange={setScrollSpeed}
							onStartAutoScroll={startAutoScroll}
							onPauseAutoScroll={pauseAutoScroll}
							onPreviousChapter={loadPreviousChapter}
							onNextChapter={loadNextChapter}
							onToggleControls={toggleControls}
							currentChapter={currentChapter}
							isPreviousDisabled={
								!url ||
								isPending ||
								currentChapter <= 1 ||
								!contentLoadedRef.current
							}
							isNextDisabled={!url || isPending || !contentLoadedRef.current}
							isScrollDisabled={!url || !contentLoadedRef.current}
						/>
					</div>
				) : (
					<>
						<div className="flex-1 flex items-center justify-center p-6">
							<div className="max-w-md w-full">
								<div className="text-center mb-8">
									<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
										Manga Reader
									</h1>
									<p className="text-gray-600 dark:text-gray-400 text-lg">
										Enter a manga URL to start reading
									</p>
								</div>

								<div className="space-y-5 turbo-card p-6">
									<div>
										<label
											htmlFor="initialUrl"
											className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
										>
											Manga URL
										</label>
										<input
											type="text"
											id="initialUrl"
											value={inputUrl}
											onChange={handleUrlChange}
											placeholder="https://example.com/manga/chapter-1"
											className="turbo-input"
											data-testid="manga-url-input"
										/>
									</div>

									<button
										onClick={loadPage}
										disabled={isLoading || isPending || !inputUrl}
										className="w-full turbo-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
										data-testid="load-manga-button"
									>
										{isLoading || isPending ? 'Loading...' : 'Start Reading'}
									</button>

									<button
										onClick={() => setShowHelp(true)}
										className="w-full turbo-button-outline"
										data-testid="help-button"
									>
										How to Use
									</button>
								</div>
							</div>
						</div>

						{/* Newsletter component at the bottom */}
						<div className="mt-auto">
							<Newsletter />
						</div>
					</>
				)}

				{/* Help modal using the component */}
				<HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

				{/* Scrolling speed indicator */}
				{isAutoScrolling && (
					<div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white py-2 px-4 rounded-md shadow-lg z-30">
						<div className="flex items-center space-x-2">
							<button
								onClick={() =>
									setScrollSpeed((prev) => Math.max(prev - 0.5, 0.5))
								}
								className="p-1 hover:bg-gray-700 rounded"
							>
								<span className="text-lg">−</span>
							</button>
							<div className="text-center min-w-[60px]">
								<div className="text-xs text-gray-300 mb-1">Speed</div>
								<div className="font-bold">{scrollSpeed.toFixed(1)}</div>
							</div>
							<button
								onClick={() =>
									setScrollSpeed((prev) => Math.min(prev + 0.5, 10))
								}
								className="p-1 hover:bg-gray-700 rounded"
							>
								<span className="text-lg">+</span>
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
