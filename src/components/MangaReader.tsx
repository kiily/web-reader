'use client';

import { useState, useRef, useEffect, ChangeEvent, useTransition } from 'react';

// Get environment variables with fallbacks
const defaultPattern = process.env.NEXT_PUBLIC_DEFAULT_PATTERN || 'chapter-{n}';
const defaultScrollSpeed = parseInt(
	process.env.NEXT_PUBLIC_DEFAULT_SCROLL_SPEED || '1',
	10
);

interface ChapterInfo {
	title: string;
	pageCount: number;
	lastUpdated: string;
}

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
	const [chapterInfo, setChapterInfo] = useState<ChapterInfo | null>(null);
	const [isPending, startTransition] = useTransition();

	const iframeRef = useRef<HTMLIFrameElement>(null);
	const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

	// Function to load the manga page
	const loadPage = async () => {
		if (!inputUrl) {
			setError('Please enter a URL');
			return;
		}

		setIsLoading(true);
		setError(null);

		// Extract chapter number from URL
		const chapter = extractChapterNumber(inputUrl);
		setCurrentChapter(chapter);

		// Create a proxy URL to bypass CORS
		const proxyUrl = `/api/proxy/${inputUrl.replace(/^https?:\/\//, '')}`;
		setUrl(proxyUrl);

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

		setIsLoading(false);
	};

	// Function to start auto-scrolling
	const startAutoScroll = () => {
		if (!iframeRef.current) return;

		setIsAutoScrolling(true);

		// Clear any existing interval
		if (scrollIntervalRef.current) {
			clearInterval(scrollIntervalRef.current);
		}

		// Set up a new interval for scrolling
		scrollIntervalRef.current = setInterval(() => {
			if (iframeRef.current && iframeRef.current.contentWindow) {
				iframeRef.current.contentWindow.scrollBy(0, scrollSpeed);
			}
		}, 20);
	};

	// Function to pause auto-scrolling
	const pauseAutoScroll = () => {
		setIsAutoScrolling(false);

		if (scrollIntervalRef.current) {
			clearInterval(scrollIntervalRef.current);
			scrollIntervalRef.current = null;
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
		setCurrentChapter(prevChapter);

		// Load the new page
		setIsLoading(true);
		setError(null);

		// Create a proxy URL to bypass CORS
		const proxyUrl = `/api/proxy/${newUrl.replace(/^https?:\/\//, '')}`;
		setUrl(proxyUrl);

		// Log the new chapter view
		startTransition(async () => {
			await logMangaView(newUrl, prevChapter);

			// Fetch info for the new chapter
			const result = await fetchChapterInfo(newUrl);
			if (result.success && result.data) {
				setChapterInfo(result.data as ChapterInfo);
			}
		});

		setIsLoading(false);
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
		setCurrentChapter(nextChapter);

		// Load the new page
		setIsLoading(true);
		setError(null);

		// Create a proxy URL to bypass CORS
		const proxyUrl = `/api/proxy/${newUrl.replace(/^https?:\/\//, '')}`;
		setUrl(proxyUrl);

		// Log the new chapter view
		startTransition(async () => {
			await logMangaView(newUrl, nextChapter);

			// Fetch info for the new chapter
			const result = await fetchChapterInfo(newUrl);
			if (result.success && result.data) {
				setChapterInfo(result.data as ChapterInfo);
			}
		});

		setIsLoading(false);
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

	// Clean up interval on component unmount
	useEffect(() => {
		return () => {
			if (scrollIntervalRef.current) {
				clearInterval(scrollIntervalRef.current);
			}
		};
	}, []);

	return (
		<div className="bg-white rounded-lg shadow-md p-6">
			<div className="mb-6">
				<div className="flex items-center mb-4">
					<h2 className="text-xl font-semibold text-gray-800">
						{process.env.NEXT_PUBLIC_APP_NAME || 'Manga Reader'}
					</h2>
					<button
						onClick={() => setShowHelp(true)}
						className="ml-2 text-sm text-blue-500 hover:text-blue-700"
						aria-label="Show help"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				</div>

				<div className="flex flex-col md:flex-row gap-4 mb-4">
					<div className="flex-grow">
						<label
							htmlFor="mangaUrl"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Manga URL
						</label>
						<input
							type="text"
							id="mangaUrl"
							value={inputUrl}
							onChange={handleUrlChange}
							placeholder="https://example.com/manga/chapter-1"
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div className="flex items-end">
						<button
							onClick={loadPage}
							disabled={isLoading || isPending}
							className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
						>
							{isLoading || isPending ? 'Loading...' : 'Load Page'}
						</button>
					</div>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
						{error}
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<div>
						<label
							htmlFor="scrollSpeed"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Scroll Speed
						</label>
						<input
							type="range"
							id="scrollSpeed"
							min="1"
							max="10"
							value={scrollSpeed}
							onChange={handleSpeedChange}
							className="w-full"
						/>
						<div className="flex justify-between text-xs text-gray-500">
							<span>Slow</span>
							<span>Fast</span>
						</div>
					</div>

					<div>
						<label
							htmlFor="nextChapterPattern"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Next Chapter Pattern
						</label>
						<input
							type="text"
							id="nextChapterPattern"
							value={nextChapterPattern}
							onChange={handlePatternChange}
							placeholder="chapter-{n}"
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					{isAutoScrolling ? (
						<button
							onClick={pauseAutoScroll}
							className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
						>
							Pause
						</button>
					) : (
						<button
							onClick={startAutoScroll}
							disabled={!url}
							className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
						>
							Start Auto-Scroll
						</button>
					)}

					<button
						onClick={loadPreviousChapter}
						disabled={!url || isPending || currentChapter <= 1}
						className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
					>
						Previous Chapter
					</button>

					<button
						onClick={loadNextChapter}
						disabled={!url || isPending}
						className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
					>
						Next Chapter
					</button>
				</div>
			</div>

			{url && (
				<div className="relative">
					{chapterInfo && (
						<div className="mb-3 p-3 bg-blue-50 text-blue-800 rounded-md">
							<h3 className="font-medium">{chapterInfo.title}</h3>
							<div className="flex text-xs text-blue-600 mt-1 justify-between">
								<span>Pages: {chapterInfo.pageCount}</span>
								<span>
									Last updated:{' '}
									{new Date(chapterInfo.lastUpdated).toLocaleDateString()}
								</span>
							</div>
						</div>
					)}
					<div className="w-full h-[600px] border border-gray-300 rounded-md overflow-hidden">
						<iframe
							ref={iframeRef}
							src={url}
							className="w-full h-full"
							title="Manga Reader"
							sandbox="allow-same-origin"
						/>
					</div>
					<div className="mt-2 text-sm text-gray-500">
						Current Chapter: {currentChapter}
					</div>
				</div>
			)}

			{showHelp && (
				<>
					<div
						className="fixed inset-0 bg-black bg-opacity-50 z-40"
						onClick={() => setShowHelp(false)}
					></div>
					<div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl z-50 max-w-md w-full max-h-[80vh] overflow-y-auto">
						<button
							onClick={() => setShowHelp(false)}
							className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
						>
							&times;
						</button>
						<h3 className="text-lg font-bold mb-4">
							How to Use the Manga Reader Assistant
						</h3>

						<h4 className="font-medium mt-4 mb-2">Basic Usage:</h4>
						<ol className="list-decimal pl-5 mb-4">
							<li className="mb-1">
								Enter the URL of the manga chapter you want to read
							</li>
							<li className="mb-1">Click "Load Page" to display the manga</li>
							<li className="mb-1">
								Use "Start Auto-Scroll" to begin reading at your selected pace
							</li>
							<li className="mb-1">
								Use "Pause" to temporarily stop scrolling
							</li>
							<li className="mb-1">
								When finished with a chapter, click "Next Chapter" to load the
								next one
							</li>
						</ol>

						<h4 className="font-medium mt-4 mb-2">Settings:</h4>
						<ul className="list-disc pl-5 mb-4">
							<li className="mb-1">
								<strong>Scroll Speed</strong>: Choose how fast the page scrolls
							</li>
							<li className="mb-1">
								<strong>Next Chapter Pattern</strong>: Define how the URL
								changes between chapters
							</li>
						</ul>

						<h4 className="font-medium mt-4 mb-2">Tips:</h4>
						<ul className="list-disc pl-5 mb-4">
							<li className="mb-1">
								For Solo Leveling, the default pattern "chapter-{'{n}'}" should
								work correctly
							</li>
							<li className="mb-1">
								You can manually scroll in the reader frame if needed
							</li>
							<li className="mb-1">
								If auto-scrolling isn't working, try reloading the page
							</li>
						</ul>

						<p className="mt-4 text-sm text-gray-600">
							<strong>Note:</strong> This app works best with manga sites that
							have a consistent URL pattern for chapters.
						</p>
						<p className="mt-2 text-xs text-gray-500">
							Version: {process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
						</p>
						<p className="mt-1 text-xs text-gray-400">
							Built with React 19 and Next.js 15
						</p>
					</div>
				</>
			)}
		</div>
	);
}
