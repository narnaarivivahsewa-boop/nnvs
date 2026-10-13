import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nnvs.rishteclub',
  appName: 'RishteClub Matrimony',
  webDir: 'public',
  server: {
    url: 'https://www.rishteclub.com',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'https://www.rishteclub.com',
      '*.rishteclub.com',
      '*.razorpay.com',
      'api.razorpay.com',
      'checkout.razorpay.com',
      '*.cloudinary.com',
      'wa.me',
      'api.whatsapp.com',
    ],
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#4A121A',
  },
};

export default config;
