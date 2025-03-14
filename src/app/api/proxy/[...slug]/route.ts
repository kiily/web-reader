import { NextRequest, NextResponse } from 'next/server';

export async function GET(
	request: NextRequest,
	{ params }: { params: { slug: string[] } }
) {
	try {
		// Wait for params to ensure they're fully resolved
		const slugArray = await Promise.resolve(params.slug);

		// Reconstruct the target URL from the slug
		const targetUrl = `https://${slugArray.join('/')}`;

		// Log the proxied URL
		console.log(`Proxying GET request to: ${targetUrl}`);

		// Make a request to the target URL
		const response = await fetch(targetUrl, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			},
		});

		// Get response body as text
		const text = await response.text();

		// Create a new response with appropriate headers
		return new NextResponse(text, {
			status: response.status,
			statusText: response.statusText,
			headers: {
				'Content-Type': response.headers.get('Content-Type') || 'text/html',
				'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'X-Proxy-URL': targetUrl,
			},
		});
	} catch (error) {
		console.error('Proxy error:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch from target URL' },
			{ status: 500 }
		);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: { slug: string[] } }
) {
	try {
		// Wait for params to ensure they're fully resolved
		const slugArray = await Promise.resolve(params.slug);

		// Reconstruct the target URL from the slug
		const targetUrl = `https://${slugArray.join('/')}`;

		// Log the proxied URL
		console.log(`Proxying POST request to: ${targetUrl}`);

		// Get the request body
		const body = await request.text();

		// Make a request to the target URL
		const response = await fetch(targetUrl, {
			method: 'POST',
			headers: {
				'Content-Type':
					request.headers.get('Content-Type') || 'application/json',
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			},
			body,
		});

		// Get response body as text
		const text = await response.text();

		// Create a new response with appropriate headers
		return new NextResponse(text, {
			status: response.status,
			statusText: response.statusText,
			headers: {
				'Content-Type':
					response.headers.get('Content-Type') || 'application/json',
				'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'X-Proxy-URL': targetUrl,
			},
		});
	} catch (error) {
		console.error('Proxy error:', error);
		return NextResponse.json(
			{ error: 'Failed to post to target URL' },
			{ status: 500 }
		);
	}
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	});
}
