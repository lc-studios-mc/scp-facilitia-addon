import * as builder from "@mcbe-toolbox-lc/builder";
import path from "node:path";
import { fileURLToPath } from "node:url";
import packageConfig from "../package.json" with { type: "json" };

// Referenced environment variables:
// `DEV`                    | Mark as dev build when set to 1.
// `DEV_BEHAVIOR_PACKS_DIR` | Path to your com.mojang/development_behavior_packs folder. Required when `DEV=1`.
// `DEV_RESOURCE_PACKS_DIR` | Path to your com.mojang/development_resource_packs folder. Required when `DEV=1`.
// `VERSION`                | Add-on version string in `0.6.9` format. Does nothing when `DEV=1`.
// `WATCH`                  | Whether to watch for file changes to rebuild automatically.

console.log("Build script:", fileURLToPath(import.meta.url));

// --- Define important variables

const isDev = Boolean(builder.getEnv("DEV"));
const shouldWatch = Boolean(builder.getEnv("WATCH"));
const versionArray = builder.parseVersionString(builder.getEnvWithFallback("VERSION", "0.0.1"));
const versionForHumans = `v${versionArray.join(".")}`;
const minecraftPackageVersions = builder.getMinecraftPackageVersions(packageConfig);
const minEngineVersion = [1, 21, 120];
const behaviorPackUuid = "3a350932-f694-4cd1-90f1-074651500002";
const resourcePackUuid = "adf053a8-cf45-4065-8fc2-87ac3c256748";

console.log(`Dev: ${isDev}`);
if (!isDev) console.log(`Version: ${versionForHumans}`);
console.log(`Watch: ${shouldWatch}`);

// --- Define pack manfiests

const behaviorPackManifest = {
	format_version: 2,
	header: {
		description: "Essentials for creating immersive SCP facilities.",
		name: isDev ? `SCP Facilitia - DEV` : `SCP Facilitia - ${versionForHumans}`,
		uuid: behaviorPackUuid,
		version: versionArray,
		min_engine_version: minEngineVersion,
	},
	modules: [
		{
			type: "data",
			uuid: "6aed8da5-f83f-4e6f-9989-12088c64c495",
			version: versionArray,
		},
		{
			language: "javascript",
			type: "script",
			uuid: "ba87cb45-5b61-4ba7-b32b-be900a7ece4e",
			version: versionArray,
			entry: "scripts/main.js",
		},
	],
	dependencies: [
		{
			uuid: resourcePackUuid,
			version: versionArray,
		},
		{
			module_name: "@minecraft/server",
			version: minecraftPackageVersions["@minecraft/server"],
		},
		{
			module_name: "@minecraft/server-ui",
			version: minecraftPackageVersions["@minecraft/server-ui"],
		},
	],
};

const resourcePackManifest = {
	format_version: 2,
	header: {
		description: "Essentials for creating immersive SCP facilities.",
		name: isDev ? `SCP Facilitia - DEV` : `SCP Facilitia - ${versionForHumans}`,
		uuid: resourcePackUuid,
		version: versionArray,
		min_engine_version: minEngineVersion,
	},
	modules: [
		{
			type: "resources",
			uuid: "0253e094-60b3-48ea-9bd1-50436b1a9e06",
			version: versionArray,
		},
	],
	capabilities: ["pbr"],
};

// --- Define configuration object

const behaviorPackTargets: string[] = [];
const resourcePackTargets: string[] = [];
const archiveOptions: builder.ArchiveOptions[] = [];

if (isDev) {
	const devBehaviorPacksDir = builder.getEnvRequired("DEV_BEHAVIOR_PACKS_DIR");
	const devResourcePacksDir = builder.getEnvRequired("DEV_RESOURCE_PACKS_DIR");

	const mainTargetPrefix = `build/dev`;
	behaviorPackTargets.push(path.join(mainTargetPrefix, "bp"));
	resourcePackTargets.push(path.join(mainTargetPrefix, "rp"));
	behaviorPackTargets.push(path.join(devBehaviorPacksDir, "scp-facilitia-bp"));
	resourcePackTargets.push(path.join(devResourcePacksDir, "scp-facilitia-rp"));
} else {
	const mainTargetPrefix = `build/${versionForHumans}`;
	behaviorPackTargets.push(path.join(mainTargetPrefix, "bp"));
	resourcePackTargets.push(path.join(mainTargetPrefix, "rp"));

	const archivePath = path.join(mainTargetPrefix, `scp-facilitia-addon-${versionForHumans}`);
	archiveOptions.push({ outFile: `${archivePath}.mcaddon` });
	archiveOptions.push({ outFile: `${archivePath}.zip` });
}

const config: builder.ConfigInput = {
	behaviorPack: {
		srcDir: "src/bp",
		targetDir: behaviorPackTargets,
		manifest: behaviorPackManifest,
		scripts: {
			entry: "src/bp/scripts/main.ts",
			bundle: true,
			sourceMap: isDev,
		},
	},
	resourcePack: {
		srcDir: "src/rp",
		targetDir: resourcePackTargets,
		manifest: resourcePackManifest,
		generateTextureList: true,
	},
	watch: shouldWatch,
	archive: archiveOptions,
};

// --- Start build

await builder.build(config);

console.log("Build script finished.");
