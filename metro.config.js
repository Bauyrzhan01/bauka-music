const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('mp3', 'm4a', 'wav', 'aac');

module.exports = config;
