const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Añadimos soporte para archivos .mjs que usa React Query v5
config.resolver.sourceExts.push('mjs');

module.exports = config;
