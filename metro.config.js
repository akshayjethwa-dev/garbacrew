const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// ─────────────────────────────────────────────────────────
// Resolve @firebase/auth differently per platform
//  • Native → use the RN bundle (has getReactNativePersistence)
//  • Web    → use the browser bundle (has signInWithPopup)
// ─────────────────────────────────────────────────────────
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@firebase/auth" && platform !== "web") {
    return context.resolveRequest(
      context,
      "@firebase/auth/dist/rn/index.js",
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Fix for "Cross-Origin-Opener-Policy would block window.closed"
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    return middleware(req, res, next);
  };
};

config.resolver.sourceExts.push("mjs");
config.resolver.sourceExts.push("cjs");

module.exports = config;