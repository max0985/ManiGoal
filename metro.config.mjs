import { getDefaultConfig } from '@expo/metro-config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = getDefaultConfig(__dirname);

// Force watchman
config.watchFolders = [__dirname];
config.resolver.watchFolders = [__dirname];
config.watcher = {
  watchman: {
    enabled: true,
  },
};

// Add additional module resolution paths
config.resolver.nodeModulesPaths = [
  resolve(__dirname, 'node_modules'),
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'base64-js': resolve(__dirname, 'node_modules/base64-js'),
  'buffer': resolve(__dirname, 'node_modules/buffer')
};

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
    inlineRequires: true,
  },
});

export default config;
