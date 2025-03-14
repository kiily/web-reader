'use client';

import React from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

interface NavBarProps {
	toggleControls: () => void;
	toggleHelp: () => void;
	title?: string;
	subtitle?: string;
}

export default function NavBar({
	toggleControls,
	toggleHelp,
	title,
	subtitle,
}: NavBarProps) {
	return (
		<div className="sticky top-4 z-40 w-full px-4 sm:px-6 lg:px-8">
			<nav className="flex items-center justify-between h-14 px-4 mx-auto rounded-full bg-black text-white max-w-7xl border border-gray-800">
				{/* Logo and title */}
				<div className="flex items-center space-x-10">
					<div className="flex-shrink-0 flex items-center">
						<Link href="/" className="flex items-center">
							<svg
								className="h-8 w-8 text-white"
								viewBox="0 0 24 24"
								fill="currentColor"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d="M16 8V5H14V8H11V10H14V13H16V10H19V8H16Z" />
								<path d="M3 5V11C3 14.3137 5.68629 17 9 17H15V15H9C6.79086 15 5 13.2091 5 11V5H3Z" />
							</svg>
							<span className="ml-2 text-base font-semibold tracking-tight text-white">
								{title || 'Manga Reader'}
							</span>
							{subtitle && (
								<span className="ml-2 text-sm text-gray-400">{subtitle}</span>
							)}
						</Link>
					</div>

					{/* Main navigation links */}
					<div className="hidden md:flex items-center space-x-6">
						{/* <NavLink href="/docs">Docs</NavLink>
						<NavLink href="/blog">Blog</NavLink>
						<NavLink href="/showcase">Showcase</NavLink>
						<NavLink href="/enterprise">Enterprise</NavLink> */}
					</div>
				</div>

				{/* Right side actions */}
				<div className="flex items-center gap-2">
					{/* <div className="relative">
						<div className="flex items-center bg-gray-800 rounded-full h-9 px-2">
							<div className="flex items-center text-gray-400 pl-2 pr-3">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<input
								type="text"
								placeholder="Search"
								className="bg-transparent border-none outline-none text-gray-300 text-sm w-32 placeholder-gray-500 focus:w-40 transition-all"
							/>
							<div className="flex items-center text-gray-400 border-l border-gray-700 ml-1 pl-2 pr-1">
								<span className="text-xs">⌘K</span>
							</div>
						</div>
					</div> */}

					<div className="flex items-center space-x-3 ml-3">
						<ThemeToggle />

						<button
							onClick={toggleControls}
							className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
							aria-label="Toggle controls"
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

						<button
							onClick={toggleHelp}
							className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
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

						<a
							href="https://github.com/"
							target="_blank"
							rel="noopener noreferrer"
							className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
							aria-label="GitHub"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="h-5 w-5"
							>
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
							</svg>
						</a>
					</div>
				</div>
			</nav>
		</div>
	);
}

// Helper component for navigation links
function NavLink({
	href,
	children,
}: {
	href: string;
	children: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			className="text-sm text-gray-400 hover:text-white font-medium transition-colors duration-200"
		>
			{children}
		</Link>
	);
}
