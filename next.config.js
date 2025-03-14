/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        turbo: {
            treeShaking: true,
            resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
            moduleIdStrategy: 'deterministic',
        },
        optimizePackageImports: ['react', 'react-dom'],
    },
    compiler: {
        styledComponents: true
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/api/proxy/:path*',
                destination: '/api/proxy/:path*',
            },
        ];
    },
};

module.exports = nextConfig; 