<p align="center">
  <img src="brand/logo.png" alt="" width="120" height="120" />
</p>

<h1 align="center">react-native-config</h1>

<p align="center">
  Config variables for React Native apps, supporting iOS, Android, macOS and Windows.
</p>

Expose config variables to your JavaScript code — bring some
[12 factor](http://12factor.net/config) love to your mobile apps!

> [!TIP]
> **Help keep this library maintained.** If `react-native-config` is useful to you or your
> company, please consider
> [sponsoring it on Open Collective](https://opencollective.com/react-native-config).
> Contributions go toward the maintenance work that keeps it working across new React Native
> releases. See [Sponsors](#sponsors) for the tiers and what sponsorship pays for.

## Basic Usage

Create a new file `.env` in the root of your React Native app:

```
API_URL=https://myapi.com
GOOGLE_MAPS_API_KEY=abcdefgh
```

Then access variables defined there from your app:

```js
import Config from "react-native-config";

Config.API_URL; // 'https://myapi.com'
Config.GOOGLE_MAPS_API_KEY; // 'abcdefgh'
```

Keep in mind this module doesn't obfuscate or encrypt secrets for packaging, so **do not store sensitive keys in `.env`**. It's [basically impossible to prevent users from reverse engineering mobile app secrets](https://rammic.github.io/2015/07/28/hiding-secrets-in-android-apps/), so design your app (and APIs) with that in mind.

## Setup

> ✅ The latest version of react-native-config is tested with **React Native 0.87** (New
> Architecture) — see the [example app](Example/). On Windows it is tested with
> **react-native-windows 0.79**, the newest React Native version react-native-windows
> supports today — see the [Windows example app](Example.windows/).

> ⚠️ Note (Android): react-native-config v1.6.0+ requires React Native 0.74 or higher.  
> If you use an older RN version, see Troubleshooting below.

Install the package:

```
$ yarn add react-native-config
```

Link the library:

On React Native 0.60 and above there is no link step — the library is
[autolinked](https://reactnative.dev/blog/2019/07/03/version-60#native-modules-are-now-autolinked).
Rebuild the app so the native side is picked up. On iOS / macOS, install the pod first:

```
(cd ios; pod install)
```

> [!WARNING]
> Do not link this library manually on React Native 0.60 or above, and do not disable its
> autolinking in `react-native.config.js`. Autolinking is what registers the native module and,
> on the New Architecture, generates its TurboModule bindings — adding
> `include ':react-native-config'` to `android/settings.gradle` instead does neither, and the
> module then resolves to `null` at runtime. See
> [TypeError: Cannot read property 'getConfig' of null](#typeerror-cannot-read-property-getconfig-of-null).

(Note: For Windows, this module supports autolinking when used with `react-native-windows@0.63`
or later. For earlier versions you need to manually link the module.)

### iOS with React Native SwiftPM (Preview)

React Native 0.88.1's SwiftPM mode is supported for the **App** subspec on iOS
15.1 and later. Its autolinking plugin API is currently Preview. After installing
this library in a SwiftPM app, run `npx react-native spm update`. For an existing
CocoaPods app, use `npx react-native spm add --deintegrate --yes` to migrate first.
Run the same setup command after a fresh checkout and dependency installation.

`swiftpmConfig.autolinkingPlugin` registers `spm/autolinking-plugin.js`. It links
the `RNCConfig` Swift package and stages an app-specific copy of the config reader
under `ios/build/generated/react-native-config`. A `Config codegen` app phase runs
the existing Ruby generator before app compilation, so `.env` edits take effect on
the next build, including clean builds. `ENVFILE` selection works as in CocoaPods.

The reader compiles in the app target because Xcode builds package dependencies
before app build phases. The bridge compiles in the Swift package; CocoaPods
continues to compile the original sources. The Extension subspec is not supported
by this SwiftPM integration.
Under SwiftPM, native app code imports `<RNCConfig/RNCConfig.h>`.
The plugin uses the Preview `generatedSources` API with a `.m` file, which React
Native currently documents as future-proofing.

<details>
<summary><b>Manual linking</b> — only for React Native below 0.60, or react-native-windows below 0.63</summary>

```
$ react-native link react-native-config
```

(`react-native link` was removed from the React Native CLI; it is only available on the older
versions these instructions apply to.)

 - Manual Link (iOS / macOS)

	1. In XCode, in the project navigator, right click `Libraries` ➜ `Add 		Files to [your project's name]`
	2. Go to `node_modules` ➜ `react-native-config` ➜ `ios`  and add 		`ReactNativeConfig.xcodeproj`
	3. Expand the `ReactNativeConfig.xcodeproj` ➜ `Products` folder
	4. In the project navigator, select your project. Add 		`libRNCConfig.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
	5. And go the Build Settings tab. Make sure All is toggled on (instead of Basic)
	6. Look for Header Search Paths and add `$(SRCROOT)/../node_modules/react-native-config/ios/**` as `non-recursive`


 - Manual Link (Android) 

	**android/settings.gradle**
	
	```diff
	+ include ':react-native-config'
	+ project(':react-native-config').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-config/android')
	```
	**android/app/build.gradle**
	
	```diff
	dependencies {
		implementation "com.facebook.react:react-native:+"  // From node_modules
	+	implementation project(':react-native-config')
	}
	```
	**MainApplication.java**
	
	```diff
	+ import com.lugg.RNCConfig.RNCConfigPackage;
	
	@Override
	protected List<ReactPackage> getPackages() {
		   return Arrays.asList(
           		new MainReactPackage()
	+      		new RNCConfigPackage()
	    );
	}
	```

 - Manual Link (Windows)

	**windows/myapp.sln**

	Add the `RNCConfig` project to your solution.

	1. Open the solution in Visual Studio 2019
	2. Right-click Solution icon in Solution Explorer > Add > Existing Project  
	  - if using `react-native-windows@0.62` or later select `node_modules\react-native-config\windows\RNCConfig\RNCConfig.vcxproj`
		- if using `react-native-windows@0.61` select `node_modules\react-native-config\windows\RNCConfig61\RNCConfig61.vcxproj`

	**windows/myapp/myapp.vcxproj**

	Add a reference to `RNCConfig` to your main application project. From Visual Studio 2019:

	1. Right-click main application project > Add > Reference...  
	Check `RNCConfig` from Solution Projects.

	**pch.h**

	Add `#include "winrt/RNCConfig.h"`.

	**app.cpp**

	Add `PackageProviders().Append(winrt::RNCConfig::ReactPackageProvider());` before `InitializeComponent();`.

</details>

### Extra step for Android
#### Using RN-Integrate
Apply extra steps automatically:
```sh
npx react-native-integrate react-native-config
```

#### Manual
You'll also need to manually apply a plugin to your app, from `android/app/build.gradle`:

```
// 2nd line, add a new apply:
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
```

#### Advanced Android Setup

`BuildConfig` is generated in your module's `namespace`, which is not always the same as its
`applicationId` — `applicationIdSuffix` and per-flavor `applicationId` change the latter and
leave the former alone. The library resolves this for you: it looks for `BuildConfig` in the
package declaring your `Application` class (that is, the `namespace`) before falling back to the
`applicationId`, so the common variant setups need no extra configuration.

If your `BuildConfig` lives somewhere neither of those points at, name the package explicitly in
`android/app/build.gradle`:

```
defaultConfig {
    ...
    resValue "string", "build_config_package", "YOUR_NAMESPACE"
}
```

where `YOUR_NAMESPACE` matches the `namespace` in `android/app/build.gradle` (on React Native
0.72 and older, the `package` attribute of `<manifest>` in `AndroidManifest.xml`). This value
takes priority over the automatic resolution above.

If the config arrives in JS as `{}`, check logcat for `ReactConfig: Could not find BuildConfig
class` — the message lists every package that was tried.

## TypeScript declaration for your .env file

If you want to get autocompletion and typesafety for your .env files. Create a file named `react-native-config.d.ts` in the same directory where you put your type declarations, and add the following contents:

```ts
declare module 'react-native-config' {
  export interface NativeConfig {
      HOSTNAME?: string;
  }
  
  export const Config: NativeConfig
  export default Config
}
```

Then when you want to use it, you just write:

```
import Config from 'react-native-config';
console.log(Config.HOSTNAME);
```

## Native Usage

### Android

Config variables set in `.env` are available to your Java classes via `BuildConfig`:

```java
public HttpURLConnection getApiClient() {
    URL url = new URL(BuildConfig.API_URL);
    // ...
}
```

You can also read them from your Gradle configuration:

```groovy
defaultConfig {
    applicationId project.env.get("APP_ID")
}
```

And use them to configure libraries in `AndroidManifest.xml` and others:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="@string/GOOGLE_MAPS_API_KEY" />
```

All variables are strings, so you may need to cast them. For instance, in Gradle:

```
versionCode project.env.get("VERSION_CODE").toInteger()
```

Once again, remember variables stored in `.env` are published with your code, so **DO NOT put anything sensitive there like your app `signingConfigs`.**

### iOS / macOS

Read variables declared in `.env` from your Obj-C classes like:

```objective-c
// import header
#import "RNCConfig.h"

// then read individual keys like:
NSString *apiUrl = [RNCConfig envFor:@"API_URL"];

// or just fetch the whole config
NSDictionary *config = [RNCConfig env];
```

### Windows

You can access variables declared in `.env` from C++ in your App project:
```
std::string api_key = ReactNativeConfig::API_KEY;
```

Similarly, you can access those values in other project by adding reference to the `RNCConfig` as described in the manual linking section.

### Availability in Build settings and Info.plist

With one extra step environment values can be exposed to "Info.plist" and Build settings in the native project.

1. click on the file tree and create new file of type XCConfig
   ![img](./readme-pics/1.ios_new_file.png)
   ![img](./readme-pics/2.ios_file_type.png)
2. save it under `ios` folder as "Config.xcconfig" with the following content:

```
#include? "tmp.xcconfig"
```

3. add the following to your ".gitignore":

```
# react-native-config codegen
ios/tmp.xcconfig

```

4. go to project settings
5. apply config to your configurations
   ![img](./readme-pics/3.ios_apply_config.png)
6. Go to _Edit scheme..._ -> _Build_ -> _Pre-actions_, click _+_ and select _New Run Script Action_. Paste below code which will generate "tmp.xcconfig" before each build exposing values to Build Settings and Info.plist. Make sure to select your target under _Provide build settings from_, so `$SRCROOT` environment variables is available to the script. (Note that this snippet has to be placed after "cp ... \${PROJECT_DIR}/../.env" if [approach explained below](#ios-multi-scheme) is used).

   ```
   "${SRCROOT}/../node_modules/react-native-config/ios/ReactNativeConfig/BuildXCConfig.rb" "${SRCROOT}/.." "${SRCROOT}/tmp.xcconfig"
   ```

   ![img](./readme-pics/4.ios_pre_actions.png)

7. You can now access your env variables in the Info.plist, for example `$(MY_ENV_VARIABLE)`. If you face issues accessing variables, please open a new issue and provide as much details as possible so above steps can be improved.

#### App Extensions

Add dependency to `react-native-config`.

```
target 'ShareExtension' do
  platform :ios, '9.0'

  pod 'react-native-config', :path => '../node_modules/react-native-config'

  # For extensions without React dependencies
  pod 'react-native-config/Extension', :path => '../node_modules/react-native-config'
end
```

### Different environments

Save config for different environments in different files: `.env.staging`, `.env.production`, etc.

By default react-native-config will read from `.env`, but you can change it when building or releasing your app.

The simplest approach is to tell it what file to read with an environment variable, like:

```
$ ENVFILE=.env.staging react-native run-ios           # bash
$ SET ENVFILE=.env.staging && react-native run-ios    # windows
$ env:ENVFILE=".env.staging"; react-native run-ios    # powershell
```

This also works for `run-android`. Alternatively, there are platform-specific options below.

#### Android

The same environment variable can be used to assemble releases with a different config:

```
$ cd android && ENVFILE=.env.staging ./gradlew assembleRelease
```
Note: When trying to release the bundle you need to export with a different config
```
$ cd android && export ENVFILE=.env.staging ./gradlew bundleRelease
```

Alternatively, you can define a map in `build.gradle` associating builds with env files. Do it before the `apply from` call, and use build cases in lowercase, like:

```
project.ext.envConfigFiles = [
    debug: ".env.development",
    release: ".env.production",
    anothercustombuild: ".env",
]

apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
```

Also note that besides requiring lowercase, the matching is done with `buildFlavor.startsWith`, so a build named `debugProd` could match the `debug` case, above.

<a name="ios-multi-scheme"></a>

#### iOS / macOS

There are two ways to pick the env file. Prefer the first: nothing is copied over anything else,
and the same setup works from Xcode, the CLI and CI.

##### Per build configuration (recommended)

Create one build configuration per environment — in Xcode, select the project, then _Info_ >
_Configurations_, and duplicate `Debug` and `Release` into e.g. `Debug-Staging` and
`Release-Staging`. Name the env files to match, and one line in the `Podfile` covers every
configuration, present and future:

```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    next unless target.name == 'react-native-config'

    target.build_configurations.each do |config|
      config.build_settings['ENVFILE'] = '.env.$(CONFIGURATION)'
    end
  end
end
```

With configurations `Debug-Staging` and `Release-Staging`, that reads `.env.Debug-Staging` and
`.env.Release-Staging` from the project root. The path is relative to the project root, and
`$(CONFIGURATION)` — or any other build setting, such as `$(PLATFORM_NAME)` — is expanded when the
script runs.

If your env files are not named after your configurations, map them explicitly instead:

```ruby
ENVFILES = {
  'Debug' => '.env.development',
  'Release' => '.env.production',
  'Debug-Staging' => '.env.staging',
  'Release-Staging' => '.env.staging',
}
post_install do |installer|
  installer.pods_project.targets.each do |target|
    next unless target.name == 'react-native-config'

    target.build_configurations.each do |config|
      config.build_settings['ENVFILE'] = ENVFILES[config.name]
    end
  end
end
```

Run `pod install` after editing the `Podfile`. The chosen file is echoed in the build log — search
it for `ENVFILE=` to see what was selected and what it expanded to.

> [!IMPORTANT]
> If `ENVFILE` names a file that does not exist, the build does **not** fail: it falls back to
> `.env`, which means a correct-looking setup can quietly ship the wrong environment. The build log
> flags this — search for `ENVFILE was set, but that file is missing`.

Note that if you have flipper enabled in your Podfile, you must move the `flipper_post_install`
into the newly added hook, since Podfile doesn't allow multiple `post_install` hooks.

```diff
  target 'MyApp' do
    # ...
    use_flipper!
-   post_install do |installer|
-     flipper_post_install(installer)
-   end
  end

  post_install do |installer|
+   flipper_post_install(installer)

    installer.pods_project.targets.each do |target|
      next unless target.name == 'react-native-config'

      target.build_configurations.each do |config|
        config.build_settings['ENVFILE'] = '.env.$(CONFIGURATION)'
      end
    end
  end
```

##### If you have several app targets

Selection is per build **configuration**, not per target. CocoaPods builds one
`react-native-config` pod target per configuration and shares it between the app targets that
depend on it, so two targets built as `Debug` both get the same env file — there is no point at
which the library can tell them apart.

Give each environment its own build configurations (`Debug-Staging`, `Release-Staging`, …), set
each target's scheme to use them, and the setup above then distinguishes them correctly.

##### Per scheme (copies the file)

The older approach: one scheme per environment, each copying its env file over `.env` before the
build. It rewrites a file in your project on every build, and the copy is easy to forget on CI, so
prefer the configuration-based setup above unless you specifically need this.

Start by creating a new scheme:

- In the Xcode menu, go to Product > Scheme > Edit Scheme
- Click Duplicate Scheme on the bottom
- Give it a proper name on the top left. For instance: "Myapp (staging)"
- Make sure the "Shared" checkbox is checked so the scheme is added to your version control system

Then edit the newly created scheme to make it use a different env file. From the same "manage
scheme" window:

- Expand the "Build" settings on left
- Click "Pre-actions", and under the plus sign select "New Run Script Action"
- Where it says "Type a script or drag a script file", type:
  ```
  cp "${PROJECT_DIR}/../.env.staging" "${PROJECT_DIR}/../.env"  # replace .env.staging for your file
  ```

Also ensure that "Provide build settings from", just above the script, has a value selected so that
PROJECT_DIR is set.

## Troubleshooting

### Problems with Proguard

When Proguard is enabled (which it is by default for Android release builds), it can rename the `BuildConfig` Java class in the minification process and prevent React Native Config from referencing it. To avoid this, add an exception to `android/app/proguard-rules.pro`:

    -keep class com.mypackage.BuildConfig { *; }

`com.mypackage` should match the `package` value in your `app/src/main/AndroidManifest.xml` file.

If using Dexguard, the shrinking phase will remove resources it thinks are unused. It is necessary to add an exception to preserve the build config package name.

    -keepresources string/build_config_package

### Config is empty (`{}`) on iOS

The values are baked in at build time by the `Config codegen` build phase, so an empty `Config`
means that phase either did not run or did not find an env file. The library says which it
was — check the Xcode console (or `npx react-native log-ios`) for a line starting with
`[react-native-config]`:

- **"no env file was found. Looked for `<path>`"** — nothing was read. If the path is wrong,
  select the intended file with `ENVFILE` (`ENVFILE=.env.staging npx react-native run-ios`); if
  the path is right but the file is somewhere else, the project root is probably not where the
  library expects it (common in monorepos). If the path looks correct, the build phase never ran:
  re-run `pod install` and build again.
- **"the env file was read from `<path>`, and no variables were parsed out of it"** — the file
  was found but yielded nothing. Check that it contains plain `KEY=value` lines.

The same paths are listed at build time. Search the Xcode build log for `Missing .env file` to
see every location that was tried, in order.

Note that `ENVFILE` naming a file that does not exist is not an error: the library falls back to
`.env`. The logged path is the file the values actually came from, which is the quickest way to
spot that fallback.

### TypeError: Cannot read property 'getConfig' of null

The JavaScript side loaded but the native module is not registered in the build, so
`TurboModuleRegistry` returned `null`. In rough order of likelihood:

1. **The app was not rebuilt** after the library was installed. Restarting Metro does not rebuild
   native code — rebuild the app itself.
2. **Autolinking is disabled for this library.** Look for an entry like this in
   `react-native.config.js` and remove it:

   ```js
   dependencies: {
     'react-native-config': {
       platforms: { android: null }, // <- remove
     },
   },
   ```

3. **The library is linked manually.** On React Native 0.60+ autolinking replaces manual linking,
   and on the New Architecture a manually linked module is never registered as a TurboModule.
   Remove `include ':react-native-config'` (and the accompanying `project(...)` line) from
   `android/settings.gradle`, and `implementation project(':react-native-config')` from
   `android/app/build.gradle`.
4. **iOS only:** `pod install` has not been run since the library was installed.

After changing any of the above, rebuild from clean — on Android, delete `android/build` and
`android/app/build` first, since a stale build can keep the old registration.

### TypeError: _reactNativeConfig.default.getConstants is not a function

This error stems from `.env` file being malformed. Accepted formats are listed here https://regex101.com/r/cbm5Tp/1. Common causes are:
  - Missing the .env file entirely
  - Rogue space anywhere, example: in front of env variable: ` MY_ENV='foo'`

### Android build error: cannot find symbol BaseReactPackage

Starting from **react-native-config v1.6.0**, the Android implementation uses
`BaseReactPackage` instead of `ReactPackage`.

`BaseReactPackage` was introduced in **React Native 0.74**, so projects on React
Native 0.73 or older will see build errors like:

> cannot find symbol  
> class BaseReactPackage

To fix this:

- Use `react-native-config` **below 1.6.0** (e.g. `1.5.10`), or
- Upgrade React Native to **0.74 or higher**

## Testing

Since `react-native-config` contains native code, it cannot be run in a node.js environment (Jest, Mocha). [react-native-config-node](https://github.com/CureApp/react-native-config-node) provides a way to mock `react-native-config` for use in test runners - exactly as it is used in the actual app.

On Windows, the [Windows example app](Example.windows/) runs its tests with the [react-native-windows Jest preset](https://github.com/microsoft/rnx-kit/tree/main/packages/jest-preset). In the `Example.windows` folder run:

```console
yarn test:windows
```

### Jest

For mocking the `Config.FOO_BAR` usage, create a mock at `__mocks__/react-native-config.js`:

```
// __mocks__/react-native-config.js
export default {
  FOO_BAR: 'baz',
};
```

## Sponsors

`react-native-config` is downloaded around **380,000 times a week** and is used in thousands
of apps across iOS, Android, macOS and Windows. It is maintained by volunteers, in their own
time.

Sponsorship pays for the unglamorous work that keeps the library alive: testing against each
new React Native release, fixing native build breakages before they reach your CI, triaging
issues, reviewing community pull requests, and keeping the test matrix green across four
platforms.

👉 **[Sponsor on Open Collective](https://opencollective.com/react-native-config)**

The collective is hosted by [Open Source Collective](https://oscollective.org/), so
contributions come with proper invoices and receipts and can normally go through your
company's regular expense or vendor process.

### Tiers

| Tier | Amount | What you get |
| --- | --- | --- |
| **Partner** | $1,000 / month | Logo and link at the top of this README and in each release note, listed first on Open Collective, and a direct channel to the maintainers for build breakages affecting your apps. |
| **Sponsor** | $250 / month | Logo and link in this section and on Open Collective. |
| **Backer** | $50 / month | Your name or avatar in this section and on Open Collective. |
| **Supporter** | $5 / month | Your name on Open Collective — for individuals who just want to help. |
| **One-off** | any amount | Our thanks. One-off contributions fund exactly the same work. |

Different budget, or a procurement process that needs something else? Open an issue and we
will work something out.

### What sponsorship is, and what it isn't

Sponsorship funds maintenance — it is not a support contract. There is no SLA, no guaranteed
response time, and no feature commitments, and sponsors get no special influence over the
library's technical direction. What it buys is a maintained library: someone with the time to
look at the Gradle plugin the day React Native changes it.

### Current sponsors

None yet — [be the first](https://opencollective.com/react-native-config). 💛

<!-- Sponsor logos go here once we have them:
<p align="center">
  <a href="https://example.com"><img src="https://example.com/logo.png" alt="Example" height="48" /></a>
</p>
-->

### Can't sponsor? You can still help

- Reproduce and comment on open issues, especially with native build logs.
- Review or send pull requests.
- Improve the docs — setup steps go stale fast.
- Ask your company to sponsor. A recurring company sponsorship is worth far more to this
  project than any one-off donation.

## Meta

Created by Pedro Belo at [Lugg](https://lugg.com/).
