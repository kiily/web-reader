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
	process.env.NEXT_PUBLIC_DEFAULT_SCROLL_SPEED || '5',
	10
);

export default function MangaReader() {
	const [url, setUrl] = useState<string>('');
	const [inputUrl, setInputUrl] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
	const [scrollSpeed, setScrollSpeed] = useState<number>(defaultScrollSpeed);
	const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
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
		// First, try to match the pattern from the URL
		// Create a dynamic regex based on nextChapterPattern
		const patternWithoutN = nextChapterPattern.replace('{n}', '');
		const escapedPattern = patternWithoutN.replace(
			/[-\/\\^$*+?.()|[\]{}]/g,
			'\\$&'
		);
		const regexPattern = new RegExp(`${escapedPattern}(\\d+)`, 'i');

		// Try to match with the dynamic pattern first
		const patternMatch = url.match(regexPattern);
		if (patternMatch) {
			return parseInt(patternMatch[1], 10);
		}

		// Fallback to default chapter-X pattern
		const defaultMatch = url.match(/chapter[_-]?(\d+)/i);
		if (defaultMatch) {
			return parseInt(defaultMatch[1], 10);
		}

		// Try to extract any number from the URL as a last resort
		const anyNumberMatch = url.match(/\/(\d+)(?:[\/\.]|$)/);
		if (anyNumberMatch) {
			return parseInt(anyNumberMatch[1], 10);
		}

		return 1; // Default to chapter 1 if no match found
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

			// Detect if we've reached the bottom or top by checking if scroll position hasn't changed
			// after multiple scroll attempts despite our attempts to scroll
			if (
				((scrollDirection === 'down' && container.scrollTop > 0) ||
					(scrollDirection === 'up' && container.scrollTop < scrollLimit)) &&
				container.scrollTop === previousScrollTopRef.current
			) {
				// Increment our counter tracking consecutive frames without scroll change
				noScrollChangeCountRef.current += 1;

				// If we've had several frames with no scroll movement, we've likely hit the bottom or top
				if (noScrollChangeCountRef.current >= 3) {
					// 3 frames is enough to detect the end
					// Stop scrolling and notify the user
					if (autoScrollAnimationRef.current) {
						cancelAnimationFrame(autoScrollAnimationRef.current);
						autoScrollAnimationRef.current = null;
					}
					setIsAutoScrolling(false);

					toast({
						title:
							scrollDirection === 'down' ? 'End of chapter' : 'Top of chapter',
						description:
							scrollDirection === 'down'
								? "You've reached the end of this chapter."
								: "You've reached the top of this chapter.",
					});
					return;
				}
			} else {
				// Reset the counter if scroll position has changed
				noScrollChangeCountRef.current = 0;
			}

			// Save current position for next comparison
			previousScrollTopRef.current = container.scrollTop;
		} else if (
			(scrollDirection === 'down' && container.scrollTop >= scrollLimit - 5) ||
			(scrollDirection === 'up' && container.scrollTop <= 5)
		) {
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
				title: scrollDirection === 'down' ? 'End of chapter' : 'Top of chapter',
				description:
					scrollDirection === 'down'
						? "You've reached the end of this chapter."
						: "You've reached the top of this chapter.",
			});
			return;
		}

		/**
		 * Calculate scroll step:
		 * 1. Base it on content size for proportional scrolling on different content
		 * 2. Ensure scrolling is intuitive at all speed settings
		 * 3. Use a simpler, more direct calculation based on user speed setting
		 */
		// Non-linear calculation for more intuitive speed progression
		// 1: Very slow, 5: Leisurely, 6-8: Quick reading, 10: Very fast
		let scrollStep;

		if (scrollSpeed === 1) {
			// Very slow - slow enough to read complex passages
			scrollStep = 1.2;
		} else if (scrollSpeed <= 3) {
			// Slow to moderate - good for normal reading
			scrollStep = 2 + (scrollSpeed - 1) * 1.5;
		} else if (scrollSpeed <= 5) {
			// Moderate to leisurely - comfortable continuous reading
			scrollStep = 5 + (scrollSpeed - 3) * 2;
		} else if (scrollSpeed <= 8) {
			// Quick reading - faster progression for scanning
			scrollStep = 9 + (scrollSpeed - 5) * 3;
		} else {
			// Very fast - rapid scanning and skimming
			scrollStep = 18 + (scrollSpeed - 8) * 4;
		}

		// Move based on direction
		container.scrollTop +=
			scrollDirection === 'down' ? scrollStep : -scrollStep;

		// Continue the animation only if we're still auto-scrolling
		if (isAutoScrolling) {
			autoScrollAnimationRef.current = requestAnimationFrame(performScroll);
		}
	}, [isAutoScrolling, scrollSpeed, scrollDirection, toast]);

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

	// Handle iframe load events with better error handling
	const handleIframeLoad = useCallback(() => {
		console.log('Iframe content loaded successfully');

		// Set a timeout to ensure the iframe content has fully rendered
		setTimeout(() => {
			contentLoadedRef.current = true; // Mark content as loaded
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
		}, 300); // Longer timeout to ensure content is fully rendered
	}, [isAutoScrolling, pauseAutoScroll]);

	// Function to handle iframe errors with retry
	const handleIframeError = () => {
		console.error('Error loading iframe content');

		// Don't disable navigation - user might want to try another chapter
		setTimeout(() => {
			contentLoadedRef.current = true;
			setContentLoaded(true);
			setIsLoading(false);

			// Show error message
			toast({
				title: 'Loading Error',
				description:
					'Failed to load the manga content. Try navigating to another chapter or check the URL.',
				variant: 'destructive',
			});

			// Set error state as well
			setError(
				'Failed to load manga content. Try navigating to another chapter or check the URL.'
			);
		}, 300); // Ensure enough time has passed so UI doesn't flash
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

	// Add special effect to watch for iframe errors and retry
	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe || !url) return;

		// Create proxy URL here to avoid using it before declaration
		const currentProxyUrl = `/api/proxy/${url.replace(/^https?:\/\//, '')}`;

		// If we have a loading error, we might want to retry after a delay
		let retryTimeout: NodeJS.Timeout | null = null;

		const handleLoadFailure = () => {
			console.log('Iframe may have failed to load correctly');

			// Only set up retry if content isn't already loaded
			if (
				!contentLoadedRef.current &&
				iframe.contentDocument?.body?.innerHTML === ''
			) {
				retryTimeout = setTimeout(() => {
					// Attempt to reload by changing the src attribute
					if (iframe && currentProxyUrl) {
						console.log('Attempting to reload iframe');

						// Ensure navigation is enabled even if loading fails again
						setTimeout(() => {
							contentLoadedRef.current = true;
							setContentLoaded(true);
							setIsLoading(false);
						}, 8000); // After 8 seconds, enable navigation anyway

						iframe.src = '';
						setTimeout(() => {
							if (iframe) iframe.src = currentProxyUrl;
						}, 100);
					}
				}, 5000); // Wait 5 seconds before retry
			}
		};

		// Set up this check to run after expected load time
		const timeoutId = setTimeout(handleLoadFailure, 10000);

		return () => {
			clearTimeout(timeoutId);
			if (retryTimeout) clearTimeout(retryTimeout);
		};
	}, [url]);

	// Update loadPage function to remove timeouts that might be causing issues
	const loadPage = async () => {
		if (!inputUrl) {
			setError('Please enter a URL');
			return;
		}

		setIsLoading(true);
		setError(null);
		pauseAutoScroll(); // Ensure any ongoing scrolling is stopped
		contentLoadedRef.current = false; // Mark content as not loaded yet
		setContentLoaded(false); // Update state as well

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
			contentLoadedRef.current = true; // Ensure buttons remain enabled if there's an error
			setContentLoaded(true);
		} finally {
			// Don't set isLoading false here - we'll do it in the iframe load handler
			// Hide controls when page loads for immersive reading
			setShowControls(false);
		}
	};

	// Function to load the previous chapter
	const loadPreviousChapter = () => {
		if (currentChapter <= 1) {
			toast({
				title: 'Navigation Error',
				description: 'You are already at the first chapter',
				variant: 'destructive',
			});
			return;
		}

		// Let the user know we're changing chapters - using a less intrusive toast
		toast({
			title: 'Navigating',
			description: `Loading chapter ${currentChapter - 1}...`,
		});

		const prevChapter = currentChapter - 1;

		try {
			// Try to replace the chapter number based on the pattern
			const patternWithoutN = nextChapterPattern.replace('{n}', '');
			const escapedPattern = patternWithoutN.replace(
				/[-\/\\^$*+?.()|[\]{}]/g,
				'\\$&'
			);
			const regexPattern = new RegExp(`${escapedPattern}\\d+`, 'i');

			const newUrl = inputUrl.replace(
				regexPattern,
				`${patternWithoutN}${prevChapter}`
			);

			let finalUrl = newUrl;
			if (newUrl === inputUrl) {
				// If no replacement happened, try with the default pattern
				const defaultPattern = /chapter[_-]?\d+/i;
				const newUrlWithDefault = inputUrl.replace(
					defaultPattern,
					`chapter-${prevChapter}`
				);

				if (newUrlWithDefault === inputUrl) {
					throw new Error("Couldn't find chapter pattern in URL");
				}

				finalUrl = newUrlWithDefault;
			}

			// Set the input URL
			setInputUrl(finalUrl);

			// Stop any ongoing scrolling
			pauseAutoScroll();

			// Set the URL directly to trigger iframe refresh
			setUrl(finalUrl);

			// Update the chapter number directly
			setCurrentChapter(prevChapter);

			// Mark content as loading
			contentLoadedRef.current = false;
			setContentLoaded(false);
			setIsLoading(true);

			// No need to call loadPage() as setting the URL will trigger the iframe to load
		} catch (error) {
			console.error('Navigation error:', error);
			toast({
				title: 'Navigation Error',
				description:
					'Could not navigate to the previous chapter. The URL pattern might not match the current URL structure.',
				variant: 'destructive',
			});
		}
	};

	// Function to load the next chapter
	const loadNextChapter = () => {
		// Let the user know we're changing chapters - using a less intrusive toast
		toast({
			title: 'Navigating',
			description: `Loading chapter ${currentChapter + 1}...`,
		});

		const nextChapter = currentChapter + 1;

		try {
			// Try to replace the chapter number based on the pattern
			const patternWithoutN = nextChapterPattern.replace('{n}', '');
			const escapedPattern = patternWithoutN.replace(
				/[-\/\\^$*+?.()|[\]{}]/g,
				'\\$&'
			);
			const regexPattern = new RegExp(`${escapedPattern}\\d+`, 'i');

			const newUrl = inputUrl.replace(
				regexPattern,
				`${patternWithoutN}${nextChapter}`
			);

			let finalUrl = newUrl;
			if (newUrl === inputUrl) {
				// If no replacement happened, try with the default pattern
				const defaultPattern = /chapter[_-]?\d+/i;
				const newUrlWithDefault = inputUrl.replace(
					defaultPattern,
					`chapter-${nextChapter}`
				);

				if (newUrlWithDefault === inputUrl) {
					throw new Error("Couldn't find chapter pattern in URL");
				}

				finalUrl = newUrlWithDefault;
			}

			// Set the input URL
			setInputUrl(finalUrl);

			// Stop any ongoing scrolling
			pauseAutoScroll();

			// Set the URL directly to trigger iframe refresh
			setUrl(finalUrl);

			// Update the chapter number directly
			setCurrentChapter(nextChapter);

			// Mark content as loading
			contentLoadedRef.current = false;
			setContentLoaded(false);
			setIsLoading(true);

			// No need to call loadPage() as setting the URL will trigger the iframe to load
		} catch (error) {
			console.error('Navigation error:', error);
			toast({
				title: 'Navigation Error',
				description:
					'Could not navigate to the next chapter. The URL pattern might not match the current URL structure.',
				variant: 'destructive',
			});
		}
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
		// Set the speed directly - the control components now handle the inversion
		setScrollSpeed(parseInt(e.target.value, 10));
	};

	const handlePatternChange = (e: ChangeEvent<HTMLInputElement>) => {
		setNextChapterPattern(e.target.value);
	};

	// Proxy URL through our API to avoid CORS issues
	const proxyUrl = url ? `/api/proxy/${url.replace(/^https?:\/\//, '')}` : '';

	// Function to toggle scroll direction
	const toggleScrollDirection = useCallback(() => {
		setScrollDirection((prev) => (prev === 'down' ? 'up' : 'down'));
		// If currently scrolling, restart to apply the new direction
		if (isAutoScrolling) {
			pauseAutoScroll();
			// Small delay to ensure state is updated
			setTimeout(() => {
				startAutoScroll();
			}, 50);
		}
	}, [isAutoScrolling, pauseAutoScroll, startAutoScroll]);

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
				case 'ArrowUp': // Make scrolling faster or toggle direction
					if (e.shiftKey) {
						e.preventDefault();
						setScrollSpeed((prev) => Math.min(prev + 1, 10));
					} else if (e.ctrlKey || e.metaKey) {
						e.preventDefault();
						if (scrollDirection !== 'up') setScrollDirection('up');
					}
					break;
				case 'ArrowDown': // Make scrolling slower or toggle direction
					if (e.shiftKey) {
						e.preventDefault();
						setScrollSpeed((prev) => Math.max(prev - 1, 1));
					} else if (e.ctrlKey || e.metaKey) {
						e.preventDefault();
						if (scrollDirection !== 'down') setScrollDirection('down');
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
		[
			isAutoScrolling,
			startAutoScroll,
			pauseAutoScroll,
			showHelp,
			scrollDirection,
		]
	);

	// Add keyboard event listeners
	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);

	// Add a function to check if loading a specific chapter
	const isLoadingChapter = isLoading || isPending;

	return (
		<div className="min-h-screen text-gray-900 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 flex flex-col">
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
					scrollDirection={scrollDirection}
					onScrollSpeedChange={handleSpeedChange}
					onScrollDirectionToggle={toggleScrollDirection}
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
								className="w-full h-full border-0"
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
							scrollDirection={scrollDirection}
							onScrollSpeedChange={setScrollSpeed}
							onScrollDirectionToggle={toggleScrollDirection}
							onStartAutoScroll={startAutoScroll}
							onPauseAutoScroll={pauseAutoScroll}
							onPreviousChapter={loadPreviousChapter}
							onNextChapter={loadNextChapter}
							onToggleControls={toggleControls}
							currentChapter={currentChapter}
							isPreviousDisabled={
								!url || isLoadingChapter || currentChapter <= 1
							}
							isNextDisabled={!url || isLoadingChapter}
							isScrollDisabled={!url || !contentLoadedRef.current}
						/>
					</div>
				) : (
					<>
						{/* Landing page with enhanced background */}
						<div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-8">
							<div className="max-w-md w-full">
								{/* Header with gradient accent */}
								<div className="text-center mb-10 relative">
									<div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
									<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 relative">
										Manga Reader
									</h1>
									<p className="text-gray-600 dark:text-gray-400 text-lg mt-4">
										Enter a manga URL to start reading with auto-scroll and
										chapter navigation
									</p>
								</div>

								{/* Input form with enhanced styling */}
								<div className="space-y-6 p-8 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700">
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
											className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
											data-testid="manga-url-input"
										/>
										<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
											Paste the URL of the manga chapter you want to read
										</p>
									</div>

									<button
										onClick={loadPage}
										disabled={isLoading || isPending || !inputUrl}
										className="w-full px-4 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										data-testid="load-manga-button"
									>
										{isLoading || isPending ? (
											<span className="flex items-center justify-center">
												<svg
													className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
												>
													<circle
														className="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														strokeWidth="4"
													></circle>
													<path
														className="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
												Loading...
											</span>
										) : (
											'Start Reading'
										)}
									</button>

									<button
										onClick={() => setShowHelp(true)}
										className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
										data-testid="help-button"
									>
										How to Use
									</button>
								</div>

								{/* Features section */}
								<div className="mt-8 text-center">
									<h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
										Features
									</h2>
									<div className="grid grid-cols-3 gap-4">
										<div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md">
											<div className="text-primary text-xl mb-1">🔄</div>
											<div className="text-sm font-medium text-gray-700 dark:text-gray-300">
												Auto-Scroll
											</div>
										</div>
										<div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md">
											<div className="text-primary text-xl mb-1">📖</div>
											<div className="text-sm font-medium text-gray-700 dark:text-gray-300">
												Chapter Navigation
											</div>
										</div>
										<div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md">
											<div className="text-primary text-xl mb-1">🌙</div>
											<div className="text-sm font-medium text-gray-700 dark:text-gray-300">
												Dark Mode
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</>
				)}

				{/* Help modal using the component */}
				<HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
			</div>
		</div>
	);
}
