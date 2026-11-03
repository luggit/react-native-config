'use strict';

const fs = require('node:fs');
const path = require('node:path');

const shellQuote = value => "'" + value.replace(/'/g, "'\\''") + "'";

function copyIfChanged(source, destination) {
  const contents = fs.readFileSync(source);
  if (!fs.existsSync(destination) || !contents.equals(fs.readFileSync(destination))) {
    fs.writeFileSync(destination, contents);
  }
}

// React Native 0.88's SwiftPM autolinking plugin API is currently Preview.
module.exports = function autolinkingPlugin({outputDir, projectRoot}) {
  const root = path.resolve(__dirname, '..');
  const nativeRoot = path.join(root, 'ios', 'ReactNativeConfig');
  // Own a sibling tree, leaving RN's generated autolinking files untouched.
  // This depth preserves Package.swift's documented relative RN paths.
  const generatedRoot = path.join(path.dirname(outputDir), 'react-native-config');
  const packagePath = path.join(generatedRoot, 'libs', 'RNCConfig');
  fs.mkdirSync(path.dirname(packagePath), {recursive: true});
  let currentTarget;
  try { currentTarget = fs.readlinkSync(packagePath); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (currentTarget !== root) {
    if (currentTarget !== undefined) fs.unlinkSync(packagePath);
    fs.symlinkSync(root, packagePath, 'dir');
  }

  // Xcode builds package dependencies before app phases. Compile this reader
  // in the app so its imported GeneratedDotEnv.m is produced by the SAME
  // target's beforeCompile phase. Copies keep each app's config isolated and
  // preserve the upstream CocoaPods sources and generator unchanged.
  const sourcesRoot = path.join(generatedRoot, 'sources');
  fs.mkdirSync(sourcesRoot, {recursive: true});
  for (const file of ['RNCConfig.h', 'RNCConfig.m']) {
    copyIfChanged(path.join(nativeRoot, file), path.join(sourcesRoot, file));
  }
  const generator = path.join(nativeRoot, 'BuildDotenvConfig.rb');
  return {
    packageDependencies: [{name: 'RNCConfig', path: packagePath}],
    productDependencies: [{name: 'RNCConfig', package: 'RNCConfig'}],
    generatedSources: [{path: path.join(sourcesRoot, 'RNCConfig.m')}],
    watchPaths: [
      path.join(root, 'Package.swift'), __filename,
      path.join(nativeRoot, 'RNCConfig.h'), path.join(nativeRoot, 'RNCConfig.m'),
      generator, path.join(nativeRoot, 'ReadDotEnv.rb'),
    ],
    scriptPhases: [{
      id: 'react-native-config.codegen',
      name: 'Config codegen',
      position: 'beforeCompile',
      alwaysOutOfDate: true,
      script: `set -eu\n${shellQuote(generator)} ${shellQuote(projectRoot)} ${shellQuote(sourcesRoot)}`,
      inputPaths: [generator, path.join(nativeRoot, 'ReadDotEnv.rb')],
      outputPaths: [path.join(sourcesRoot, 'GeneratedDotEnv.m'), '$(BUILD_DIR)/GeneratedInfoPlistDotEnv.h'],
    }],
  };
};
