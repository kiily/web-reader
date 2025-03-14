import './globals.css';
import { Inter } from 'next/font/google';
import { metadata, viewport } from './metadata';

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
			<body className={inter.className}>
				<main className="min-h-screen bg-gray-50">{children}</main>
			</body>
		</html>
	);
}
