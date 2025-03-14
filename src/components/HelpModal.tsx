'use client';

import React from 'react';

interface HelpModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
	if (!isOpen) return null;

	return (
		<>
			<div
				className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-40"
				onClick={onClose}
			></div>
			<div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#111113] p-6 rounded-xl shadow-xl z-50 max-w-md w-full max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
					aria-label="Close help dialog"
					title="Close help dialog"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clipRule="evenodd"
						/>
					</svg>
				</button>

				<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
					How to Use Manga Reader
				</h3>

				<h4 className="font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">
					Basic Usage:
				</h4>
				<ol className="list-decimal pl-5 mb-4 text-gray-700 dark:text-gray-300 text-sm">
					<li className="mb-1">
						Enter the URL of the manga chapter you want to read
					</li>
					<li className="mb-1">Click "Load Page" to display the manga</li>
					<li className="mb-1">
						Use "Start Auto-Scroll" to begin reading at your selected pace
					</li>
					<li className="mb-1">Use "Pause" to temporarily stop scrolling</li>
					<li className="mb-1">
						When finished with a chapter, use the navigation buttons to switch
						chapters
					</li>
				</ol>

				<h4 className="font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">
					Settings:
				</h4>
				<ul className="list-disc pl-5 mb-4 text-gray-700 dark:text-gray-300 text-sm">
					<li className="mb-1">
						<strong>Scroll Speed</strong>: Choose how fast the page scrolls
					</li>
					<li className="mb-1">
						<strong>Chapter Pattern</strong>: Define how the URL changes between
						chapters
					</li>
					<li className="mb-1">
						<strong>Theme Toggle</strong>: Switch between light and dark mode
						for your reading preference
					</li>
				</ul>

				<h4 className="font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">
					Tips:
				</h4>
				<ul className="list-disc pl-5 mb-4 text-gray-700 dark:text-gray-300 text-sm">
					<li className="mb-1">
						For Solo Leveling, the default pattern "chapter-{'{n}'}" should work
						correctly
					</li>
					<li className="mb-1">
						Toggle the settings panel using the gear icon in the header
					</li>
					<li className="mb-1">
						Floating controls at the bottom allow for quick navigation and speed
						adjustment
					</li>
					<li className="mb-1">
						The dark theme reduces eye strain during long reading sessions
					</li>
				</ul>

				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-2">Keyboard Shortcuts</h3>
					<ul className="space-y-2 text-gray-700 dark:text-gray-300">
						<li className="flex">
							<span className="kbd">Space</span>
							<span className="ml-3">Toggle auto-scrolling on/off</span>
						</li>
						<li className="flex">
							<span className="kbd">Shift + ↑</span>
							<span className="ml-3">Decrease scroll speed (faster)</span>
						</li>
						<li className="flex">
							<span className="kbd">Shift + ↓</span>
							<span className="ml-3">Increase scroll speed (slower)</span>
						</li>
						<li className="flex">
							<span className="kbd">h</span>
							<span className="ml-3">Show this help dialog</span>
						</li>
						<li className="flex">
							<span className="kbd">Esc</span>
							<span className="ml-3">Close dialogs</span>
						</li>
					</ul>
				</div>

				<p className="mt-5 text-sm text-gray-600 dark:text-gray-400">
					<strong>Note:</strong> This app works best with manga sites that have
					a consistent URL pattern for chapters.
				</p>
				<p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
					Version: {process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
				</p>
				<p className="mt-1 text-xs text-gray-400 dark:text-gray-600">
					Built with React 19 and Next.js 15
				</p>
			</div>
		</>
	);
}
