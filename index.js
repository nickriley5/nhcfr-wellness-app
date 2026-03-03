/**
 * @format
 */

import {AppRegistry, LogBox} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Guard Error.stack getter and console.error against Hermes "invalid receiver" crashes
try {
  const desc = Object.getOwnPropertyDescriptor(Error.prototype, 'stack');
  if (desc && typeof desc.get === 'function') {
    Object.defineProperty(Error.prototype, 'stack', {
      configurable: true,
      enumerable: false,
      get() {
        try {
          return desc.get.call(this);
        } catch {
          return '';
        }
      },
      set(value) {
        if (desc.set) {
          try {
            desc.set.call(this, value);
          } catch {
            // ignore
          }
        }
      },
    });
  }
} catch {
  // ignore patch failures
}

const originalConsoleError = console.error.bind(console);
console.error = (...args) => {
  const safeArgs = args.map((arg) => {
    if (arg && typeof arg === 'object' && !(arg instanceof Error)) {
      try {
        // Touch stack in a try/catch to avoid Hermes invalid receiver errors
        // eslint-disable-next-line no-unused-expressions
        (arg).stack;
      } catch {
        try {
          return JSON.parse(JSON.stringify(arg));
        } catch {
          return String(arg);
        }
      }
    }
    return arg;
  });
  originalConsoleError(...safeArgs);
};

// Suppress known harmless warnings from React Native 0.78 + reanimated
LogBox.ignoreLogs([
  'Error.stack getter called with an invalid receiver',
]);

AppRegistry.registerComponent(appName, () => App);
