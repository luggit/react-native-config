'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

const root = path.resolve(__dirname, '../..');
// Node resolves require() through macOS's /var -> /private/var symlink.
const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "rnc-spm space-'quoted-")));

try {
  // Exercise both library and app paths containing spaces and apostrophes.
  const library = path.join(tmp, "library space's");
  fs.mkdirSync(path.join(library, 'spm'), {recursive: true});
  fs.copyFileSync(path.join(root, 'spm/autolinking-plugin.js'), path.join(library, 'spm/autolinking-plugin.js'));
  fs.copyFileSync(path.join(root, 'Package.swift'), path.join(library, 'Package.swift'));
  fs.cpSync(path.join(root, 'ios/ReactNativeConfig'), path.join(library, 'ios/ReactNativeConfig'), {recursive: true});
  const plugin = require(path.join(library, 'spm/autolinking-plugin.js'));
  const projectRoot = path.join(tmp, "app space's");
  // appRoot is authoritative, even when the native directory isn't named ios.
  const appRoot = path.join(projectRoot, 'native ios');
  const outputDir = path.join(appRoot, 'build/generated/autolinking');
  fs.mkdirSync(outputDir, {recursive: true});
  const ctx = {appRoot, outputDir, projectRoot};
  const contribution = plugin(ctx);
  const phase = contribution.scriptPhases[0];
  const reader = contribution.generatedSources[0].path;
  const sourcesRoot = path.dirname(reader);
  const nativeRoot = path.join(library, 'ios/ReactNativeConfig');
  const srcrootPath = file => '$(SRCROOT)/' + path.relative(appRoot, file);

  // Only paths serialized into the app project must be relocatable. The plugin
  // contract requires absolute watchPaths and permits absolute local packages.
  for (const file of [...phase.inputPaths, ...phase.outputPaths]) {
    assert.equal(path.isAbsolute(file), false, `Non-portable Xcode path: ${file}`);
    assert.match(file, /^\$\((SRCROOT|BUILD_DIR)\)\//);
  }
  assert.deepEqual(phase.inputPaths, [
    srcrootPath(path.join(nativeRoot, 'BuildDotenvConfig.rb')),
    srcrootPath(path.join(nativeRoot, 'ReadDotEnv.rb')),
  ]);
  assert.deepEqual(phase.outputPaths, [
    srcrootPath(path.join(sourcesRoot, 'GeneratedDotEnv.m')),
    '$(BUILD_DIR)/GeneratedInfoPlistDotEnv.h',
  ]);
  assert.equal(phase.script.includes(tmp), false, 'Script embeds a machine-specific absolute path');
  assert.match(phase.script, /\$\{SRCROOT\}/);
  assert.equal(phase.position, 'beforeCompile');
  assert.equal(phase.alwaysOutOfDate, true);

  const alias = contribution.packageDependencies[0].path;
  const before = [fs.lstatSync(alias).ino, fs.statSync(reader).mtimeMs];
  assert.deepEqual(plugin(ctx), contribution);
  assert.deepEqual([fs.lstatSync(alias).ino, fs.statSync(reader).mtimeMs], before);
  assert.equal(fs.realpathSync(alias), library);
  assert.equal(fs.existsSync(path.join(sourcesRoot, 'GeneratedDotEnv.m')), false);

  fs.writeFileSync(path.join(projectRoot, '.env'), 'API_URL=https://first.example\n');
  fs.writeFileSync(path.join(projectRoot, '.env.custom'), 'API_URL=https://second.example\n');
  for (const [ENVFILE, expected] of [['.env', 'https://first.example'], ['.env.custom', 'https://second.example']]) {
    execFileSync('/bin/sh', ['-c', phase.script], {
      cwd: appRoot,
      env: {...process.env, SRCROOT: appRoot, BUILD_DIR: tmp, ENVFILE},
    });
    assert.ok(fs.readFileSync(path.join(sourcesRoot, 'GeneratedDotEnv.m'), 'utf8').includes(expected));
    assert.ok(fs.readFileSync(path.join(tmp, 'GeneratedInfoPlistDotEnv.h'), 'utf8').includes(expected));
  }

  const otherRoot = path.join(tmp, 'other');
  const other = plugin({
    projectRoot: otherRoot,
    appRoot: path.join(otherRoot, 'ios'),
    outputDir: path.join(otherRoot, 'ios/build/generated/autolinking'),
  });
  assert.notEqual(other.generatedSources[0].path, reader);
  assert.equal(fs.existsSync(path.join(path.dirname(other.generatedSources[0].path), 'GeneratedDotEnv.m')), false);
  console.log('PASS: portable Xcode paths, quoted script paths, stable copies, no sync-time env output, ENVFILE, app isolation');
} finally {
  fs.rmSync(tmp, {recursive: true, force: true});
}
