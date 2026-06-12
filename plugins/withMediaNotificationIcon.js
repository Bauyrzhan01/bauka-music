const { withDangerousMod, createRunOncePlugin } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SERVICE_RELATIVE_PATH = path.join(
  'node_modules',
  'expo-audio',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'audio',
  'service',
  'AudioControlsService.kt'
);

const GENERIC_SMALL_ICON =
  '.setSmallIcon(androidx.media3.session.R.drawable.media3_icon_circular_play)';

const APP_SMALL_ICON = '.setSmallIcon(context.applicationInfo.icon)';

function withMediaNotificationIcon(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const servicePath = path.join(
        config.modRequest.projectRoot,
        SERVICE_RELATIVE_PATH
      );

      if (!fs.existsSync(servicePath)) {
        console.warn(
          '[withMediaNotificationIcon] expo-audio service not found, skipping'
        );
        return config;
      }

      const content = fs.readFileSync(servicePath, 'utf8');
      if (!content.includes(GENERIC_SMALL_ICON)) {
        return config;
      }

      fs.writeFileSync(
        servicePath,
        content.replace(GENERIC_SMALL_ICON, APP_SMALL_ICON)
      );
      return config;
    },
  ]);
}

module.exports = createRunOncePlugin(
  withMediaNotificationIcon,
  'with-media-notification-icon',
  '1.0.0'
);
