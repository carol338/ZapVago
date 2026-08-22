const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint agora está configurado (.eslintrc.json) e limpo — 0 erros, só 4
  // avisos react-hooks/exhaustive-deps benignos (efeitos que leem um valor
  // de propósito sem re-rodar quando ele muda). Warnings não derrubam o
  // build, só erros — então é seguro deixar rodando aqui.
  eslint: { ignoreDuringBuilds: false },
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
