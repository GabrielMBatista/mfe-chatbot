import { NextFederationPlugin } from '@module-federation/nextjs-mf';
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['storage.googleapis.com'],
    },

    output: 'standalone',
    experimental: {
        outputFileTracingIncludes: {
            'src/pages/api/gabsia.ts': [
                './node_modules/@prisma/client/**/*',
                './node_modules/.prisma/client/**/*',
            ],
        },
    },

    webpack: (config, { isServer }) => {
        config.plugins.push(
            new NextFederationPlugin({
                name: 'Chatbot',
                filename: 'static/chunks/remoteEntry.js',
                exposes: {
                    './App': './src/pages/_app.tsx',
                    './Chatbot': './src/pages/chatbot/index.tsx',
                    './GabsIAWidget': './src/components/GabsIAWidget.tsx',
                    './GabsTourWidget': './src/components/GabsTourWidget.tsx',
                    './GabsIaApi': './src/pages/api/gabsia.ts',
                },
                remotes: {
                    shell: `shell@${process.env.NEXT_PUBLIC_SHELL_REMOTE_URL}/_next/static/chunks/remoteEntry.js`,
                },
                shared: {
                    react: {
                        singleton: true,
                        requiredVersion: false,
                        eager: true,
                    },
                    'react-dom': {
                        singleton: true,
                        requiredVersion: false,
                        eager: true,
                    },
                },
            })
        );

        if (isServer) {
            config.plugins.push(new PrismaPlugin());
        }

        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            react: path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        };

        return config;
    },

    transpilePackages: ['@meta/react-components'],

    async headers() {
        const allow = process.env.NEXT_PUBLIC_ALLOW_CORS_LOCALHOST === 'true';
        if (!allow) return [];
        const common = [
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
            { key: 'Access-Control-Max-Age', value: '86400' },
            { key: 'Vary', value: 'Origin' },
        ];
        return [
            { source: '/:path*', headers: common },
            { source: '/:path*.lottie', headers: common },
            { source: '/api/:path*', headers: common },
            { source: '/responses.json', headers: common },
            { source: '/_next/static/chunks/:path*', headers: common },
            { source: '/_next/static/:path*', headers: common },
            { source: '/_next/mf-manifest.json', headers: common },
            { source: '/static/chunks/:path*', headers: common },
            { source: '/types/:path*', headers: common },
        ];
    },

    async redirects() {
        return [
            { source: '/', destination: '/tour', permanent: true },
            { source: '/home', destination: '/tour', permanent: true },
        ];
    },
};

export default nextConfig;
