import MangaReader from '@/components/MangaReader';

export default function Home() {
	return (
		<div className="container mx-auto px-4 py-8">
			<header className="mb-8 text-center">
				<h1 className="text-3xl font-bold text-gray-800 mb-2">
					Manga Reader Assistant
				</h1>
				<p className="text-gray-600">
					Read your favorite manga with auto-scrolling capabilities
				</p>
			</header>

			<MangaReader />

			<footer className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
				<p>
					© {new Date().getFullYear()} Manga Reader Assistant. All rights
					reserved.
				</p>
				<p className="mt-2">
					This app is for educational purposes only. All manga content belongs
					to their respective owners.
				</p>
			</footer>
		</div>
	);
}
