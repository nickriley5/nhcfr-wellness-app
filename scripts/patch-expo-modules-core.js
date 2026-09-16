const fs = require('fs');
const path = require('path');

const patches = [
  {
    label: 'ExpoModulesCore JSI string',
    targetPath: path.join(
      __dirname,
      '..',
      'node_modules',
      'expo-modules-core',
      'ios',
      'JSI',
      'EXJSIConversions.mm',
    ),
    original: `  const uint8_t *utf8 = (const uint8_t *)[value UTF8String];
  const size_t length = [value length];

  if (utf8 != nullptr && expo::isAllASCIIAndNotNull(utf8, utf8 + length)) {
    return jsi::String::createFromAscii(runtime, (const char *)utf8, length);
  }
  // Using cStringUsingEncoding should be fine as long as we provide the length.
  return jsi::String::createFromUtf16(runtime, (const char16_t *)[value cStringUsingEncoding:NSUTF16StringEncoding], length);`,
    replacement: `  const char *utf8String = [value UTF8String];
  if (utf8String == nullptr) {
    return jsi::String::createFromUtf8(runtime, "");
  }

  const auto length = strlen(utf8String);
  const auto *utf8 = reinterpret_cast<const uint8_t *>(utf8String);

  if (expo::isAllASCIIAndNotNull(utf8, utf8 + length)) {
    return jsi::String::createFromAscii(runtime, utf8String, length);
  }

  return jsi::String::createFromUtf8(runtime, utf8, length);`,
  },
  {
    label: 'Expo React Native factory',
    targetPath: path.join(
      __dirname,
      '..',
      'node_modules',
      'expo',
      'ios',
      'AppDelegates',
      'ExpoReactNativeFactory.swift',
    ),
    original: `  // TODO: Remove check when react-native-macos 0.81 is released
  #if !os(macOS)
  @objc public override init(delegate: any RCTReactNativeFactoryDelegate) {
    let releaseLevel = (Bundle.main.object(forInfoDictionaryKey: "ReactNativeReleaseLevel") as? String)
      .flatMap { [
        "canary": RCTReleaseLevel.Canary,
        "experimental": RCTReleaseLevel.Experimental,
        "stable": RCTReleaseLevel.Stable
      ][$0.lowercased()]
      }
    ?? RCTReleaseLevel.Stable

    super.init(delegate: delegate, releaseLevel: releaseLevel)
  }
  #endif`,
    replacement: `  @objc public override init(delegate: any RCTReactNativeFactoryDelegate) {
    super.init(delegate: delegate)
  }`,
  },
  {
    label: 'Expo React Native runtime configurator',
    targetPath: path.join(
      __dirname,
      '..',
      'node_modules',
      'expo',
      'ios',
      'AppDelegates',
      'ExpoReactNativeFactory.swift',
    ),
    original: `    configuration.jsRuntimeConfiguratorDelegate = delegate

`,
    replacement: '',
  },
];

let failed = false;

for (const { label, targetPath, original, replacement } of patches) {
  if (!fs.existsSync(targetPath)) {
    console.log(`Skipping ${label} patch; ${targetPath} was not found.`);
    continue;
  }

  const contents = fs.readFileSync(targetPath, 'utf8');

  const alreadyApplied = replacement === '' ? !contents.includes(original) : contents.includes(replacement);

  if (alreadyApplied) {
    console.log(`${label} patch already applied.`);
    continue;
  }

  if (!contents.includes(original)) {
    console.error(`${label} patch could not find the expected source block.`);
    failed = true;
    continue;
  }

  fs.writeFileSync(targetPath, contents.replace(original, replacement));
  console.log(`Applied ${label} patch.`);
}

process.exit(failed ? 1 : 0);
