const { withAppBuildGradle } = require("@expo/config-plugins");

const signingConfig = `
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_FILE"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
`;

module.exports = function withAndroidSigning(config) {
  return withAppBuildGradle(config, (modResults) => {
    let contents = modResults.modResults.contents;

    if (!contents.includes("ANDROID_KEYSTORE_FILE")) {
      contents = contents.replace(
        /android\s*\{/,
        (match) => `${match}\n${signingConfig}`,
      );
    }

    contents = contents.replace(
      /versionCode\s+\d+/,
      'versionCode Integer.parseInt(System.getenv("ANDROID_VERSION_CODE") ?: "1")',
    );
    contents = contents.replace(
      /signingConfig\s+signingConfigs\.debug/,
      "signingConfig signingConfigs.release",
    );

    modResults.modResults.contents = contents;
    return modResults;
  });
};
