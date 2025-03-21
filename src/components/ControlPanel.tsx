'use client';

import React, { ChangeEvent } from 'react';
import { ChapterInfo } from '../types/manga';

interface ControlPanelProps {
	isOpen: boolean;
	inputUrl: string;
	onUrlChange: (e: ChangeEvent<HTMLInputElement>) => void;
	scrollSpeed: number;
	scrollDirection: 'down' | 'up';
	onScrollSpeedChange: (e: ChangeEvent<HTMLInputElement>) => void;
	onScrollDirectionToggle: () => void;
	nextChapterPattern: string;
	onPatternChange: (e: ChangeEvent<HTMLInputElement>) => void;
	isLoading: boolean;
	isPending: boolean;
	isAutoScrolling: boolean;
	currentChapter: number;
	error: string | null;
	chapterInfo: ChapterInfo | null;
	onLoadPage: () => void;
	onStartAutoScroll: () => void;
	onPauseAutoScroll: () => void;
	onPreviousChapter: () => void;
	onNextChapter: () => void;
}

export default function ControlPanel({
	isOpen,
	inputUrl,
	onUrlChange,
	scrollSpeed,
	scrollDirection,
	onScrollSpeedChange,
	onScrollDirectionToggle,
	nextChapterPattern,
	onPatternChange,
	isLoading,
	isPending,
	isAutoScrolling,
	currentChapter,
	error,
	chapterInfo,
	onLoadPage,
	onStartAutoScroll,
	onPauseAutoScroll,
	onPreviousChapter,
	onNextChapter,
}: ControlPanelProps) {
	return (
		<div
			className={`fixed top-16 right-0 bottom-0 w-72 bg-white dark:bg-[#111113] border-l border-gray-200 dark:border-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-30 ${
				isOpen ? 'translate-x-0' : 'translate-x-full'
			}`}
		>
			<div className="p-6 h-full flex flex-col">
				<h2 className="text-base font-semibold mb-6 pb-2 border-b border-gray-200 dark:border-gray-800">
					Reader Controls
				</h2>

				<div className="mb-6">
					<label
						htmlFor="mangaUrl"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Manga URL
					</label>
					<input
						type="text"
						id="mangaUrl"
						value={inputUrl}
						onChange={onUrlChange}
						placeholder="https://example.com/manga/chapter-1"
						className="turbo-input"
					/>
					<button
						onClick={onLoadPage}
						disabled={isLoading || isPending}
						className="turbo-button-primary w-full mt-3"
					>
						{isLoading || isPending ? 'Loading...' : 'Load Page'}
					</button>
				</div>

				{error && (
					<div className="mb-6 p-3 text-sm bg-red-50 dark:bg-[#332233] text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900">
						{error}
					</div>
				)}

				<div className="mb-6">
					<label
						htmlFor="scrollSpeed"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Scroll Speed
					</label>
					<input
						type="range"
						id="scrollSpeed"
						min="1"
						max="100"
						step="1"
						value={scrollSpeed}
						onChange={onScrollSpeedChange}
						className="w-full accent-primary"
					/>
					<div className="flex justify-center text-sm text-primary font-medium mt-1">
						{scrollSpeed}
					</div>
					<div className="text-xs text-gray-500 text-center mt-1">
						{scrollSpeed <= 20
							? 'Careful reading'
							: scrollSpeed <= 60
							? 'Normal reading'
							: 'Fast scanning'}
					</div>
				</div>

				<div className="mb-6">
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Scroll Direction
					</label>
					<div className="flex">
						<button
							onClick={onScrollDirectionToggle}
							className={`flex items-center justify-center w-full py-2 px-4 rounded-md border ${
								scrollDirection === 'down'
									? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
									: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
							}`}
							title="Scroll Down"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5 mr-2"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
									clipRule="evenodd"
								/>
							</svg>
							Down
						</button>
						<button
							onClick={onScrollDirectionToggle}
							className={`flex items-center justify-center w-full py-2 px-4 rounded-md border ml-2 ${
								scrollDirection === 'up'
									? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400'
									: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
							}`}
							title="Scroll Up"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5 mr-2"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
									clipRule="evenodd"
								/>
							</svg>
							Up
						</button>
					</div>
				</div>

				<div className="mb-6">
					<label
						htmlFor="nextChapterPattern"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Chapter Pattern
					</label>
					<input
						type="text"
						id="nextChapterPattern"
						value={nextChapterPattern}
						onChange={onPatternChange}
						placeholder="chapter-{n}"
						className="turbo-input"
					/>
					<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
						Use {'{n}'} as a placeholder for the chapter number
					</p>
				</div>

				<div className="space-y-3 mt-auto">
					{isAutoScrolling ? (
						<button
							onClick={onPauseAutoScroll}
							className="w-full turbo-button bg-yellow-500 hover:bg-yellow-600 text-white"
						>
							Pause Scrolling
						</button>
					) : (
						<button
							onClick={onStartAutoScroll}
							disabled={!inputUrl}
							className="w-full turbo-button bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Start Auto-Scroll
						</button>
					)}

					<div className="flex space-x-3">
						<button
							onClick={onPreviousChapter}
							disabled={!inputUrl || isPending || currentChapter <= 1}
							className="flex-1 turbo-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>

						<button
							onClick={onNextChapter}
							disabled={!inputUrl || isPending}
							className="flex-1 turbo-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
				</div>

				{chapterInfo && (
					<div className="mt-6 pt-3 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
						<div className="flex justify-between">
							<span>Pages: {chapterInfo.pageCount}</span>
							<span>Ch. {currentChapter}</span>
						</div>
						<div className="mt-1 text-xs">
							Updated: {new Date(chapterInfo.lastUpdated).toLocaleDateString()}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
