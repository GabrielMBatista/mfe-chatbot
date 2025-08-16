import { NextFederationPlugin } from '@module-federation/nextjs-mf';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['storage.googleapis.com'],
    },
    webpack: (config) => {
        config.plugins.push(
            new NextFederationPlugin({
                name: 'Chatbot',
                filename: 'static/chunks/remoteEntry.js',
                exposes: {
                    './App': './src/pages/_app.tsx',
                    './Chatbot': './src/pages/chatbot/index.tsx',
                    './GabsIAWidget': './src/components/GabsIAWidget.tsx',
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

        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            react: path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        };

        return config;
    },
    transpilePackages: ['@meta/react-components'],
    output: 'standalone',
    async headers() {
        const allow = process.env.NEXT_PUBLIC_ALLOW_CORS_LOCALHOST === "true";
        if (!allow) return [];
        // permite acesso de origens localhost/127.0.0.1 em dev
        const common = [
            { key: "Access-Control-Allow-Origin", value: "*" },
            { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,OPTIONS" },
            { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
            { key: "Access-Control-Max-Age", value: "86400" },
            { key: "Vary", value: "Origin" },
        ];
        return [
            // catch-all: garante CORS também para arquivos no /public (ex.: .lottie)
            { source: "/:path*", headers: common },
            { source: "/:path*.lottie", headers: common },
            { source: "/api/:path*", headers: common },
            { source: "/responses.json", headers: common },
            { source: "/_next/static/chunks/:path*", headers: common },
            { source: "/_next/static/:path*", headers: common },
            { source: "/_next/mf-manifest.json", headers: common },
            { source: "/static/chunks/:path*", headers: common },
            { source: "/types/:path*", headers: common },
        ];
    }
};

export default nextConfig;
