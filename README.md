# Manga Reader Assistant

A web application built with Next.js 15 and React 19 that helps you read manga with auto-scrolling capabilities.

## Features

- Load manga chapters directly within the app
- Auto-scroll at customizable speeds
- Navigate easily between chapters
- **Light and Dark Mode** support for comfortable reading
- Built with modern React 19 and Next.js 15
- **Powered by Turbopack** for lightning-fast development
- **Utilizes React 19's latest features** for improved performance

## What's New in React 19 & Next.js 15

This project leverages the latest advancements in React and Next.js:

### React 19 Features
- **Improved Performance** - React 19 includes significant performance improvements
- **React Compiler** - Automatic optimization of your React components
- **React Actions** - Simplified server/client interactions
- **Document Metadata** - Better SEO and metadata management

### Next.js 15 Benefits
- **Partial Prerendering (PPR)** - Combines static and dynamic content for faster initial loading
- **Server Actions** - Write server code directly in your components
- **Enhanced Image Optimization** - Better image handling and optimization
- **Improved Developer Experience** - Better error handling and debugging

## What is Turbopack?

Turbopack is Next.js's Rust-based successor to Webpack, designed for incredible speed in development:

- **Extremely fast** - Up to 700x faster than Webpack, 10x faster than Vite
- **Incremental computation** - Only recomputes what changed, not the entire application
- **Built for JavaScript** - Optimized for JavaScript and TypeScript projects
- **Integrated with Next.js** - Seamlessly works with the Next.js ecosystem
- **React 19 Optimized** - Configured for optimal performance with React 19

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/manga-reader.git
   cd manga-reader
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server with Turbopack
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter the URL of a manga chapter (e.g., https://www.solo-leveling-manhwa.com/solo-leveling-chapter-117)
2. Click "Load Page" to display the manga
3. Select your preferred scroll speed
4. Click "Start Auto-Scroll" to begin reading
5. Use the control buttons to pause, stop, or navigate to the next chapter
6. Toggle between light and dark mode using the theme button in the header

## Theme Support

The application supports both light and dark modes:

- **Dark Mode**: Default theme optimized for reading in low-light environments to reduce eye strain
- **Light Mode**: Bright theme for reading in well-lit environments
- **Automatic Detection**: The app will initially use your system preference
- **Persistent Preference**: Your theme choice is saved and persists between sessions

## Note About Turbopack

This application uses Turbopack for development, which provides:
- Instant updates when you make changes to your code
- Optimized hot module replacement
- Type checking in parallel
- Efficient caching for faster reloads

## Note About Cross-Origin Resources

Some manga websites may block their content from being displayed in iframes due to CORS policies. The proxy API route in this application attempts to work around this limitation, but it may not work with all websites.

## License

MIT

## Acknowledgements

- Next.js and Turbopack for the amazing development experience
- All manga creators for their artwork 