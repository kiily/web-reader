// Define types for toast notifications
type ToastVariant = 'default' | 'destructive' | 'success';

type ToastOptions = {
	title: string;
	description: string;
	variant?: ToastVariant;
	duration?: number;
};

// Simple implementation as we don't have a toast component yet
export function useToast() {
	const toast = (options: ToastOptions) => {
		// For now, we'll just log to console
		// In a real implementation, this would trigger a toast notification UI
		console.log(
			`[${options.variant || 'default'}] ${options.title}: ${
				options.description
			}`
		);

		// Alert for development visibility
		const message = `${options.title}: ${options.description}`;
		alert(message);
	};

	return { toast };
}
