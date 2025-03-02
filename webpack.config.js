const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const path = require('path');

module.exports = async function (env, argv) {
  process.env.EXPO_ROUTER_APP_ROOT = "./app";
  
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ["expo-router"]
    }
  }, argv);

  config.module.rules.push({
    test: /\.m?js$/,
    type: "javascript/auto",
    resolve: {
      fullySpecified: false
    }
  });

  return config;
};