const { createRunOncePlugin, withAndroidStyles } = require('@expo/config-plugins');

function setForceDarkModeToFalse(styles) {
  // Add android:forceDarkAllowed to AppTheme
  return styles.map((style) => {
    if (style.name === 'AppTheme') {
      style.items.push({
        _name: 'item',
        _attrs: {
          name: 'android:forceDarkAllowed',
        },
        _value: 'false',
      });
    }
    return style;
  });
}

const withForceLightModeAndroid = (config) => {
  return withAndroidStyles(config, (config) => {
    config.modResults.resources = setForceDarkModeToFalse(config.modResults.resources);
    return config;
  });
};

module.exports = createRunOncePlugin(withForceLightModeAndroid, 'withForceLightModeAndroid', '1.0.0');
