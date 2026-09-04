import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.battastudio.nouralquran',
  appName: 'نور القرآن',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#004333',
      sound: 'adhan_makkah.mp3',
    },
  },
};

export default config;
