import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'myspera.vercel.app',
  appName: 'Spera',
  webDir: 'build',
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
