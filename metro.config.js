// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    blockList: exclusionList([
      /node_modules[\/\\]react-native-reanimated[\/\\]android[\/\\]\.cxx[\/\\].*/,
    ]),
  },
};

module.exports = mergeConfig(defaultConfig, config);
