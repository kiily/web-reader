// Global type definitions for the project

import React from 'react';

// NodeJS namespace for setTimeout/setInterval
declare namespace NodeJS {
	interface Timeout {
		// Node.js timeout object
		ref(): Timeout;
		unref(): Timeout;
		hasRef(): boolean;
		refresh(): Timeout;
		[Symbol.toPrimitive](): number;
	}
}

// Make sure JSX works without errors
declare namespace JSX {
	interface IntrinsicElements {
		[elemName: string]: any;
	}
}
