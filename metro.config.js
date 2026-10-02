const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// ✅ Force Metro to use the React Native build of @firebase/auth
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@firebase/auth") {
    return context.resolveRequest(
      context,
      "@firebase/auth/dist/rn/index.js",
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Enable Expo Router file-based routing
config.resolver.sourceExts.push("mjs");
config.resolver.sourceExts.push("cjs");

module.exports = config;