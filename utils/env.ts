type EnvMap = Record<string, string | undefined>;

let cachedEnv: EnvMap | null = null;

export const getEnv = (): EnvMap => {
  if (cachedEnv) {
    return cachedEnv;
  }

  let configEnv: EnvMap = {};

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

  const processEnv = typeof process !== 'undefined' ? (process.env as EnvMap) : {};

  cachedEnv = {
    ...processEnv,
    ...configEnv,
  };

  return cachedEnv;
};
