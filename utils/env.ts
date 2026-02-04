type EnvMap = Record<string, string | undefined>;

let cachedEnv: EnvMap | null = null;

export const getEnv = (): EnvMap => {
  if (cachedEnv) {
    return cachedEnv;
  }

  let configEnv: EnvMap = {};
  let localEnv: EnvMap = {};

  try {
    // Avoid importing react-native-config directly to prevent crashes
    // when the native module isn't linked.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rn = require('react-native');
    const nativeConfig = rn?.NativeModules?.RNCConfigModule;
    if (nativeConfig) {
      configEnv =
        typeof nativeConfig.getConfig === 'function'
          ? (nativeConfig.getConfig() as EnvMap)
          : (nativeConfig as EnvMap);
    }
  } catch {
    configEnv = {};
  }

  try {
    // Local-only secrets file (gitignored) to keep dev builds working
    // when native env loading isn't available.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('./localSecrets');
    const cfg = mod?.default ?? mod;
    if (cfg && typeof cfg === 'object') {
      localEnv = cfg as EnvMap;
    }
  } catch {
    localEnv = {};
  }

  const processEnv = typeof process !== 'undefined' ? (process.env as EnvMap) : {};

  cachedEnv = {
    ...localEnv,
    ...processEnv,
    ...configEnv,
  };

  return cachedEnv;
};
