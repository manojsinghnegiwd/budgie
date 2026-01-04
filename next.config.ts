import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude libsql packages from webpack bundling (they need native Node.js)
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
};

export default nextConfig;
