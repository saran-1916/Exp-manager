import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stranz.spera',
  appName: 'Spera',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
      overlaysWebView: false
    },
    SplashScreen: {
      backgroundColor: '#FFFFFF'
    }
  }
};

export default config;