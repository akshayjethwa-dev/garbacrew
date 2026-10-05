const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// ✅ Fix for "Cross-Origin-Opener-Policy policy would block the window.closed call"
// This middleware adds the correct COOP header to allow popups to communicate back.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    return middleware(req, res, next);
  };
};

// Enable Expo Router file-based routing
config.resolver.sourceExts.push("mjs");
config.resolver.sourceExts.push("cjs");

module.exports = config;