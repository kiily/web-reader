'use client';

import React, { useState } from 'react';

export default function Newsletter() {
	const [email, setEmail] = useState('');
	const [isSubscribed, setIsSubscribed] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (email) {
			// Here you would typically send the email to your API
			console.log('Subscribing email:', email);
			setIsSubscribed(true);
			setEmail('');
			// Reset subscription status after 5 seconds
			setTimeout(() => setIsSubscribed(false), 5000);
		}
	};

	return (
		<div className="w-full bg-black text-white py-12 px-4">
			<div className="max-w-7xl mx-auto">
				<div className="max-w-3xl mx-auto">
					<h2 className="text-2xl font-bold mb-4">
						Subscribe to our newsletter
					</h2>
					<p className="text-gray-400 text-lg mb-6">
						Subscribe to the Manga Reader newsletter and stay updated on new
						features, guides, and reading tips.
					</p>

					<form
						onSubmit={handleSubmit}
						className="flex flex-col sm:flex-row gap-3"
					>
						<div className="flex-grow">
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								required
							/>
						</div>
						<button
							type="submit"
							className="bg-white text-black font-medium px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200"
						>
							{isSubscribed ? 'Subscribed!' : 'Subscribe'}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
