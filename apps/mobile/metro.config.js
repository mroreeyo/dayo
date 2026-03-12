const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

const singletonPkgs = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-native-web': path.resolve(monorepoRoot, 'node_modules/react-native-web'),
  'react-dom': path.resolve(monorepoRoot, 'node_modules/react-dom'),
};

config.resolver.extraNodeModules = singletonPkgs;

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [pkg, pkgPath] of Object.entries(singletonPkgs)) {
    if (moduleName === pkg || moduleName.startsWith(pkg + '/')) {
      const subpath = moduleName === pkg ? '' : moduleName.slice(pkg.length);
      return context.resolveRequest(
        { ...context, resolveRequest: defaultResolveRequest },
        subpath ? pkgPath + subpath : pkgPath,
        platform,
      );
    }
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
