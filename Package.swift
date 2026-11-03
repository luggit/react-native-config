// swift-tools-version: 6.0

import Foundation
import PackageDescription

// This library's autolinking plugin stages this manifest at build/generated/react-native-config/libs/RNCConfig.
let usedRootEntries: Set<String> = ["ios", "include", "spm-headers", "Package.swift"]
let unusedRootEntries = try! FileManager.default.contentsOfDirectory(atPath: Context.packageDirectory)
    .filter { !usedRootEntries.contains($0) }
    .sorted()

let retainedNativeEntries: Set<String> = ["RNCConfig.h", "RNCConfigModule.h", "RNCConfigModule.mm"]
let unusedNativeEntries = try! FileManager.default.contentsOfDirectory(atPath: Context.packageDirectory + "/ios/ReactNativeConfig")
    .filter { !retainedNativeEntries.contains($0) }
    .map { "ios/ReactNativeConfig/" + $0 }
    .sorted()

let package = Package(
    name: "RNCConfig",
    platforms: [.iOS("15.1")],
    products: [.library(name: "RNCConfig", targets: ["RNCConfig"])],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
    ],
    targets: [
        .target(
            name: "RNCConfig",
            dependencies: [
                .product(name: "ReactHeaders", package: "ReactNative"),
                .product(name: "ReactNativeHeaders", package: "ReactNative"),
                .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
                .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
            ],
            path: ".",
            exclude: ["ios/ReactNativeConfig.xcodeproj"] + unusedNativeEntries + unusedRootEntries,
            // The plugin compiles RNCConfig.m in the app target, after Config codegen.
            sources: ["ios/ReactNativeConfig/RNCConfigModule.mm"],
            publicHeadersPath: "include",
            cSettings: [.define("RCT_NEW_ARCH_ENABLED", to: "1"), .headerSearchPath("spm-headers")],
            cxxSettings: [.define("RCT_NEW_ARCH_ENABLED", to: "1"), .headerSearchPath("spm-headers")],
            linkerSettings: [.linkedFramework("Foundation")]
        ),
    ],
    cxxLanguageStandard: .cxx20
)
