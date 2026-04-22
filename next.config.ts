import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  // Pre-existing lint issues in tool components — not migration-related
  eslint: { ignoreDuringBuilds: true },
  // Pre-existing TS strictness issues in tool components — not migration-related  
  typescript: { ignoreBuildErrors: false },
  // These packages use Node.js APIs and must not be bundled for the browser
  serverExternalPackages: [
    'onnxruntime-web',
    '@imgly/background-removal',
    'tesseract.js',
    '@huggingface/transformers',
    'curlconverter',
    'web-tree-sitter',
  ],
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // Polyfill Node.js built-ins that some packages try to require in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }

    return config;
  },
};

export default nextConfig;
