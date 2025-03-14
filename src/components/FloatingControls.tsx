'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

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
	const [expanded, setExpanded] = useState(true);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
	const [elementOffset, setElementOffset] = useState({ x: 0, y: 0 });
	const controlRef = useRef<HTMLDivElement>(null);
	const startTimeRef = useRef<number>(0);
	const hasDraggedRef = useRef<boolean>(false);

	// Handle speed change input
	const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newSpeed = parseInt(e.target.value, 10);
		onScrollSpeedChange(newSpeed);
	};

	// Get viewport dimensions
	const getViewportDimensions = useCallback(() => {
		return {
			width: window.innerWidth || document.documentElement.clientWidth,
			height: window.innerHeight || document.documentElement.clientHeight,
		};
	}, []);

	// Keep track of control dimensions
	const getControlDimensions = useCallback(() => {
		if (!controlRef.current) return { width: 140, height: 60 };
		return {
			width: controlRef.current.offsetWidth,
			height: controlRef.current.offsetHeight,
		};
	}, []);

	// Toggle expanded/collapsed state
	const toggleExpanded = useCallback(() => {
		// If we're about to collapse and don't have a position yet, set it to bottom right
		if (expanded && !position.x && !position.y) {
			const viewport = getViewportDimensions();
			setPosition({
				x: viewport.width - 140,
				y: viewport.height - 100,
			});
		}
		setExpanded(!expanded);
	}, [expanded, position, getViewportDimensions]);

	// Handle window resize to keep control within bounds
	useEffect(() => {
		const handleResize = () => {
			if (!expanded) {
				const viewport = getViewportDimensions();
				const { width, height } = getControlDimensions();

				setPosition((prevPos) => ({
					x: Math.min(prevPos.x, viewport.width - width),
					y: Math.min(prevPos.y, viewport.height - height),
				}));
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [expanded, getViewportDimensions, getControlDimensions]);

	// Reset position when switching to expanded mode
	useEffect(() => {
		if (expanded) {
			// Store last collapsed position for when we collapse again
			const lastPosition = { ...position };
			if (lastPosition.x || lastPosition.y) {
				setPosition(lastPosition);
			}
		}
	}, [expanded, position]);

	// Handle drag start
	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (!controlRef.current || expanded) return;

			// Track start time to distinguish between clicks and drags
			startTimeRef.current = Date.now();
			hasDraggedRef.current = false;

			const rect = controlRef.current.getBoundingClientRect();

			// Save starting position of pointer
			setDragStartPos({ x: e.clientX, y: e.clientY });

			// Save offset of pointer within the element
			setElementOffset({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});

			setIsDragging(true);

			// Capture pointer to ensure we get all events even outside the element
			(e.target as HTMLElement).setPointerCapture(e.pointerId);

			// Prevent default to avoid text selection
			e.preventDefault();
		},
		[expanded]
	);

	// Handle drag movement
	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!isDragging || !controlRef.current) return;

			// Calculate how far we've moved from starting position
			const deltaX = e.clientX - dragStartPos.x;
			const deltaY = e.clientY - dragStartPos.y;

			// If we've moved more than 5px, consider it a drag not a click
			if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
				hasDraggedRef.current = true;
			}

			const viewport = getViewportDimensions();
			const { width, height } = getControlDimensions();

			// Calculate new position with bounds checking
			const newX = Math.max(
				0,
				Math.min(e.clientX - elementOffset.x, viewport.width - width)
			);
			const newY = Math.max(
				0,
				Math.min(e.clientY - elementOffset.y, viewport.height - height)
			);

			setPosition({ x: newX, y: newY });
			e.preventDefault();
		},
		[
			isDragging,
			dragStartPos,
			elementOffset,
			getViewportDimensions,
			getControlDimensions,
		]
	);

	// Handle drag end
	const handlePointerUp = useCallback(
		(e: React.PointerEvent) => {
			if (!isDragging) return;

			// Release pointer capture
			try {
				(e.target as HTMLElement).releasePointerCapture(e.pointerId);
			} catch (err) {
				// Ignore errors from releasing capture
			}

			setIsDragging(false);

			// Only trigger click if:
			// 1. We haven't moved much (not a drag)
			// 2. The interaction was short (less than 300ms)
			const isClick =
				!hasDraggedRef.current && Date.now() - startTimeRef.current < 300;

			// If it was a click on collapsed control, expand it
			if (isClick && !expanded) {
				toggleExpanded();
			}

			e.preventDefault();
		},
		[isDragging, expanded, toggleExpanded]
	);

	// Handle cancel events (ESC key, etc)
	const handlePointerCancel = useCallback((e: React.PointerEvent) => {
		setIsDragging(false);
	}, []);

	// Determine position styles
	const getPositionStyles = useCallback(() => {
		if (expanded) {
			return {
				bottom: '2rem',
				left: '50%',
				transform: 'translateX(-50%)',
				transition: 'opacity 0.3s ease',
			};
		}

		return {
			top: `${position.y}px`,
			left: `${position.x}px`,
			transition: isDragging
				? 'none'
				: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
			transform: 'none',
		};
	}, [expanded, position, isDragging]);

	return (
		<div
			ref={controlRef}
			className={`fixed z-20 ${isDragging ? 'cursor-grabbing' : ''}`}
			style={getPositionStyles()}
			onPointerDown={!expanded ? handlePointerDown : undefined}
			onPointerMove={!expanded ? handlePointerMove : undefined}
			onPointerUp={!expanded ? handlePointerUp : undefined}
			onPointerCancel={!expanded ? handlePointerCancel : undefined}
		>
			{expanded ? (
				<div className="bg-white dark:bg-[#111113] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300">
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

						{/* Collapse Button */}
						<button
							onClick={toggleExpanded}
							className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
							aria-label="Collapse Controls"
							title="Collapse Controls"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					</div>
				</div>
			) : (
				// Collapsed Controls - Simplified to match the image
				<div
					className={`bg-white dark:bg-[#111113] rounded-full px-2 py-1.5 shadow-lg border border-gray-200 dark:border-gray-800 cursor-grab ${
						isDragging
							? 'cursor-grabbing shadow-xl scale-105'
							: 'hover:shadow-md'
					} transition-all duration-200 flex items-center space-x-2`}
				>
					{/* Drag Indicator */}
					<div
						className="text-gray-400 dark:text-gray-500 flex items-center justify-center"
						aria-hidden="true"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
						</svg>
					</div>

					{/* Play/Pause Button */}
					<button
						onClick={(e) => {
							e.stopPropagation();
							isAutoScrolling ? onPauseAutoScroll() : onStartAutoScroll();
						}}
						className={`p-1 ${
							isAutoScrolling
								? 'text-yellow-600 dark:text-yellow-500'
								: 'text-green-600 dark:text-green-500'
						} rounded-full hover:bg-gray-100 dark:hover:bg-gray-800`}
						aria-label={
							isAutoScrolling ? 'Pause Auto-Scroll' : 'Start Auto-Scroll'
						}
					>
						{isAutoScrolling ? (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-6 w-6"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
									clipRule="evenodd"
								/>
							</svg>
						) : (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-6 w-6"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
									clipRule="evenodd"
								/>
							</svg>
						)}
					</button>

					{/* Fullscreen/Expand Button */}
					<button
						onClick={(e) => {
							e.stopPropagation();
							toggleExpanded();
						}}
						className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
						aria-label="Expand Controls"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
							/>
						</svg>
					</button>
				</div>
			)}
		</div>
	);
}
