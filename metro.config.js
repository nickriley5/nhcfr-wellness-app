// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Ensure RN/browser entry points win over Node "main" for packages like axios.
    resolverMainFields: ['react-native', 'browser', 'main'],
    unstable_enablePackageExports: true,
    unstable_conditionNames: ['react-native', 'browser', 'require', 'default'],
    blockList: exclusionList([
      /node_modules[/\\]react-native-reanimated[/\\]android[/\\].cxx[/\\].*/,
      // Exclude server-side scripts from React Native bundle
      /scripts[/\\].*\.ts$/,
      /scripts[/\\].*\.js$/,
    ]),
  },
};

module.exports = mergeConfig(defaultConfig, config);
