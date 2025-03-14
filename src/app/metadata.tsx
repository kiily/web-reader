import type { Metadata, Viewport } from 'next';

// Static metadata
export const metadata: Metadata = {
	title: {
		template: '%s | Manga Reader Assistant',
		default: 'Manga Reader Assistant - Read manga with auto-scrolling',
	},
	description:
		'A web application that helps you read manga with auto-scrolling capabilities',
	keywords: ['manga', 'reader', 'auto-scroll', 'comics', 'webtoon'],
	authors: [{ name: 'Manga Reader Team' }],
	creator: 'Manga Reader Team',
	publisher: 'Manga Reader',
	formatDetection: {
		email: false,
		telephone: false,
		address: false,
	},
	openGraph: {
		title: 'Manga Reader Assistant',
		description: 'Read manga with auto-scrolling capabilities',
		url: 'https://manga-reader.example.com',
		siteName: 'Manga Reader Assistant',
		locale: 'en_US',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Manga Reader Assistant',
		description: 'Read manga with auto-scrolling capabilities',
	},
	icons: {
		icon: '/favicon.ico',
		apple: '/apple-icon.png',
	},
};

// Viewport metadata
export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#f5f5f5' },
		{ media: '(prefers-color-scheme: dark)', color: '#222222' },
	],
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};
