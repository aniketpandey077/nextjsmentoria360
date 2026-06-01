const path = require("path");
const { loadEnvConfig } = require("@next/env");

// Ensure .env.local is loaded before Next reads config (Firebase Admin vars).
loadEnvConfig(path.join(__dirname));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile photos
      },
    ],
  },
  // Firebase Google signInWithPopup needs to read popup window state.
  // Without this, browsers log COOP errors for window.closed / window.close.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
