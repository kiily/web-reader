import './globals.css';
import { Inter } from 'next/font/google';
import { metadata, viewport } from './metadata';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

// Export the metadata and viewport for Next.js to use
export { metadata, viewport };

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body
				className={`${inter.className} bg-white dark:bg-[#111113] text-gray-900 dark:text-gray-200 transition-colors duration-200`}
			>
				<ThemeProvider>
					<main className="min-h-screen">{children}</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
