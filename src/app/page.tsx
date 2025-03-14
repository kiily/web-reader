import MangaReader from '@/components/MangaReader';
import { Suspense } from 'react';

export default function Home() {
	return (
		<Suspense fallback={<div className="p-4">Loading...</div>}>
			<MangaReader />
		</Suspense>
	);
}
