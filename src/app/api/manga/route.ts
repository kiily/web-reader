import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const data = await request.json();
		const { action, url, chapter } = data;

		if (action === 'logView') {
			// In a real application, this would log to a database
			console.log(`[API] User viewed manga: ${url}, Chapter: ${chapter}`);
			return NextResponse.json({ success: true });
		}

		if (action === 'fetchInfo') {
			// Mock data for demonstration
			const mockData = {
				title: `Chapter extracted from ${url}`,
				pageCount: Math.floor(Math.random() * 30) + 10,
				lastUpdated: new Date().toISOString(),
			};

			return NextResponse.json({
				success: true,
				data: mockData,
			});
		}

		return NextResponse.json(
			{ success: false, error: 'Invalid action' },
			{ status: 400 }
		);
	} catch (error) {
		console.error('API error:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
