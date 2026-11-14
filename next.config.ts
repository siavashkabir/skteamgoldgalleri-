import type { NextConfig } from "next";

const codespacesOrigin =
  process.env.CODESPACE_NAME &&
  process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
    ? `${process.env.CODESPACE_NAME}-3000.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
    : undefined;

const nextConfig: NextConfig = {
  ...(codespacesOrigin ? { allowedDevOrigins: [codespacesOrigin] } : {}),
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
    serverActions: {
      bodySizeLimit: "6mb",
      ...(codespacesOrigin ? { allowedOrigins: [codespacesOrigin] } : {}),
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
