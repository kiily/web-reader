'use client';

import React, { ChangeEvent } from 'react';
import { ChapterInfo } from '../types/manga';

interface ControlPanelProps {
	isOpen: boolean;
	inputUrl: string;
	onUrlChange: (e: ChangeEvent<HTMLInputElement>) => void;
	scrollSpeed: number;
	onScrollSpeedChange: (e: ChangeEvent<HTMLInputElement>) => void;
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
	onScrollSpeedChange,
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
						max="10"
						value={scrollSpeed}
						onChange={onScrollSpeedChange}
						className="w-full accent-primary"
					/>
					<div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
						<span>Slow</span>
						<span>Fast</span>
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
