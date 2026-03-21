import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const outputDir = resolve(rootDir, ".github-packages");
const licensePath = resolve(rootDir, "LICENSE");

const packageConfigs = [
  {
    sourceDir: resolve(rootDir, "packages/core"),
    sourceName: "@typed-table/core",
    mirrorName: "@siriusbinarydev/typed-table-core",
  },
  {
    sourceDir: resolve(rootDir, "packages/adapters"),
    sourceName: "@typed-table/adapters",
    mirrorName: "@siriusbinarydev/typed-table-adapters",
  },
  {
    sourceDir: resolve(rootDir, "packages/react"),
    sourceName: "@typed-table/react",
    mirrorName: "@siriusbinarydev/typed-table-react",
  },
];

const mirrorNameBySourceName = new Map(
  packageConfigs.map((config) => [config.sourceName, config.mirrorName]),
);

function rewriteDependencyMap(dependencies) {
  if (!dependencies) {
    return dependencies;
  }

  return Object.fromEntries(
    Object.entries(dependencies).map(([name, version]) => [
      mirrorNameBySourceName.get(name) ?? name,
      version,
    ]),
  );
}

function getMirrorScripts(scripts) {
  if (!scripts) {
    return undefined;
  }

  const { prepublishOnly: _prepublishOnly, prepare: _prepare, prepack: _prepack, postpack: _postpack, build: _build, ...remainingScripts } = scripts;

  return Object.keys(remainingScripts).length > 0 ? remainingScripts : undefined;
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

for (const config of packageConfigs) {
  const packageJsonPath = join(config.sourceDir, "package.json");
  const readmePath = join(config.sourceDir, "README.md");
  const distDir = join(config.sourceDir, "dist");

  if (!existsSync(distDir)) {
    throw new Error(`Expected build output at ${distDir}. Run the workspace build first.`);
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const mirrorDir = join(outputDir, config.mirrorName.split("/")[1]);

  mkdirSync(mirrorDir, { recursive: true });
  cpSync(distDir, join(mirrorDir, "dist"), { recursive: true });

  if (existsSync(readmePath)) {
    cpSync(readmePath, join(mirrorDir, "README.md"));
  }

  if (existsSync(licensePath)) {
    cpSync(licensePath, join(mirrorDir, "LICENSE"));
  }

  const mirrorPackageJson = {
    ...packageJson,
    name: config.mirrorName,
    publishConfig: {
      ...packageJson.publishConfig,
      registry: "https://npm.pkg.github.com",
    },
    scripts: getMirrorScripts(packageJson.scripts),
    dependencies: rewriteDependencyMap(packageJson.dependencies),
    optionalDependencies: rewriteDependencyMap(packageJson.optionalDependencies),
    peerDependencies: rewriteDependencyMap(packageJson.peerDependencies),
  };

  writeFileSync(
    join(mirrorDir, "package.json"),
    `${JSON.stringify(mirrorPackageJson, null, 2)}\n`,
  );
}

writeFileSync(
  join(outputDir, "manifest.json"),
  `${JSON.stringify(
    packageConfigs.map((config) => ({
      sourceName: config.sourceName,
      mirrorName: config.mirrorName,
      directory: config.mirrorName.split("/")[1],
    })),
    null,
    2,
  )}\n`,
);
