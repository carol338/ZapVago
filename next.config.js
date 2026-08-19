const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
};

// withSentryConfig só faz upload de source maps (pra stack traces legíveis
// no painel) quando SENTRY_AUTH_TOKEN/SENTRY_ORG/SENTRY_PROJECT estão
// configurados — sem eles, o build funciona normal, só sem esse upload.
module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  webpack: { treeshake: { removeDebugLogging: true } },
});
