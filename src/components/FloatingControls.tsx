'use client';

import React from 'react';

interface FloatingControlsProps {
	isAutoScrolling: boolean;
	scrollSpeed: number;
	scrollDirection: 'down' | 'up';
	onScrollSpeedChange: (speed: number) => void;
	onScrollDirectionToggle: () => void;
	onStartAutoScroll: () => void;
	onPauseAutoScroll: () => void;
	onPreviousChapter: () => void;
	onNextChapter: () => void;
	onToggleControls: () => void;
	currentChapter: number;
	isPreviousDisabled: boolean;
	isNextDisabled: boolean;
	isScrollDisabled: boolean;
}

export default function FloatingControls({
	isAutoScrolling,
	scrollSpeed,
	scrollDirection,
	onScrollSpeedChange,
	onScrollDirectionToggle,
	onStartAutoScroll,
	onPauseAutoScroll,
	onPreviousChapter,
	onNextChapter,
	onToggleControls,
	currentChapter,
	isPreviousDisabled,
	isNextDisabled,
	isScrollDisabled,
}: FloatingControlsProps) {
	const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// Direct mapping - higher values mean faster scrolling
		const newSpeed = parseInt(e.target.value, 10);
		onScrollSpeedChange(newSpeed);
	};

	return (
		<div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
			<div className="bg-white dark:bg-[#111113] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
				<div className="flex items-center p-3">
					{/* Auto-Scroll Toggle */}
					{isAutoScrolling ? (
						<button
							onClick={onPauseAutoScroll}
							className="p-2 text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
							aria-label="Pause Auto-Scroll"
							title="Pause Auto-Scroll"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					) : (
						<button
							onClick={onStartAutoScroll}
							disabled={isScrollDisabled}
							className="p-2 text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							aria-label="Start Auto-Scroll"
							title="Start Auto-Scroll"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					)}

					{/* Scroll Speed Slider */}
					<div className="flex items-center px-3 min-w-[120px]">
						<div className="text-xs text-gray-500 mr-1">1</div>
						<input
							type="range"
							min="1"
							max="10"
							step="1"
							value={scrollSpeed}
							onChange={handleSpeedChange}
							className="w-full accent-primary h-2"
							aria-label="Scroll Speed"
							title="Adjust Scroll Speed: 1=Slow, 5=Normal, 10=Fast"
						/>
						<div className="text-xs text-gray-500 ml-1">10</div>
					</div>

					{/* Scroll Direction Toggle */}
					<button
						onClick={onScrollDirectionToggle}
						className={`p-2 ${
							scrollDirection === 'down'
								? 'text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20'
								: 'text-purple-600 dark:text-purple-500 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20'
						} rounded-lg transition-colors`}
						aria-label={`Scroll Direction: ${
							scrollDirection === 'down' ? 'Down' : 'Up'
						}`}
						title={`Scroll Direction: ${
							scrollDirection === 'down' ? 'Down' : 'Up'
						}`}
					>
						{scrollDirection === 'down' ? (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
									clipRule="evenodd"
								/>
							</svg>
						) : (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
									clipRule="evenodd"
								/>
							</svg>
						)}
					</button>

					{/* Previous Chapter */}
					<button
						onClick={onPreviousChapter}
						disabled={isPreviousDisabled}
						className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Previous Chapter"
						title="Previous Chapter"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
								clipRule="evenodd"
							/>
						</svg>
					</button>

					{/* Chapter Indicator */}
					<div className="px-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
						Ch. {currentChapter}
					</div>

					{/* Next Chapter */}
					<button
						onClick={onNextChapter}
						disabled={isNextDisabled}
						className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Next Chapter"
						title="Next Chapter"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
					{/* Settings Button */}
					<button
						onClick={onToggleControls}
						className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Toggle More Controls"
						title="More Controls"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}
