const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Modules natifs remplacés par des mocks pour la plateforme web
const WEB_MODULE_MOCKS = {
  'expo-sqlite': path.resolve(__dirname, 'src/mocks/expo-sqlite.web.js'),
  'expo-file-system': path.resolve(__dirname, 'src/mocks/expo-file-system.web.js'),
  'expo-device': path.resolve(__dirname, 'src/mocks/expo-device.web.js'),
  'expo-notifications': path.resolve(__dirname, 'src/mocks/expo-notifications.web.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_MODULE_MOCKS[moduleName]) {
    return { filePath: WEB_MODULE_MOCKS[moduleName], type: 'sourceFile' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
