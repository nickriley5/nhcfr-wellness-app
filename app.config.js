export default {
  expo: {
    name: 'NHCFR Wellness',
    slug: 'nhcfr-wellness-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/logo.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/logo.png',
      resizeMode: 'contain',
      backgroundColor: '#0f0f0f',
    },
    assetBundlePatterns: [
      '**/*',
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.nhcfr.wellness',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'This app uses the camera to take photos of meals for nutrition tracking.',
        NSPhotoLibraryUsageDescription: 'This app accesses your photo library to select meal photos for nutrition tracking.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/logo.png',
        backgroundColor: '#0f0f0f',
      },
      package: 'com.nhcfr.wellness',
      versionCode: 1,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
    },
    web: {
      favicon: './assets/logo.png',
    },
    extra: {
      eas: {
        projectId: '286abfeb-1156-40ff-88c6-387a906abef5',
      },
    },
  },
};
