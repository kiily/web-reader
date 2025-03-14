import { NextRequest, NextResponse } from 'next/server';

export async function GET(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	const path = params.path.join('/');
	const targetUrl = `https://${path}`;

	try {
		const response = await fetch(targetUrl);
		const contentType = response.headers.get('Content-Type') || 'text/html';

		// Create a new response with the original content
		const modifiedResponse = new NextResponse(await response.text(), {
			status: response.status,
			statusText: response.statusText,
			headers: {
				'Content-Type': contentType,
				'Access-Control-Allow-Origin': '*',
			},
		});

		return modifiedResponse;
	} catch (error) {
		console.error('Proxy error:', error);
		return new NextResponse(
			JSON.stringify({ error: 'Failed to fetch content' }),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}
}
