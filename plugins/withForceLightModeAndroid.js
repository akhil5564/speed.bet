// Expo config plugin to force light mode on Android
module.exports = function withForceLightModeAndroid(config) {
  return {
    ...config,
    android: {
      ...config.android,
      userInterfaceStyle: 'light',
    },
  };
};
