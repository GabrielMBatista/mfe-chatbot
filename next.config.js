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
        return [
            {
                source: '/responses.json',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*'
                    }
                ]
            }
        ]
    }
};

export default nextConfig;
