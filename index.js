/**
 * @format
 */

import {AppRegistry, LogBox} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Suppress known harmless warnings from React Native 0.78 + reanimated
LogBox.ignoreLogs([
  'Error.stack getter called with an invalid receiver',
]);

AppRegistry.registerComponent(appName, () => App);
