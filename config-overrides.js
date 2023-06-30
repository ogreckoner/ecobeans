const webpack = require("webpack");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: false,
    stream: false,
    assert: false,
    http: false,
    https: false,
    os: false,
    url: false,
    zlib: false,
  });
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ]);
  config.ignoreWarnings = [/Failed to parse source map/];
  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    enforce: "pre",
    loader: require.resolve("source-map-loader"),
    resolve: {
      fullySpecified: false,
    },
  });

  if (!config.resolve) {
    config.resolve = { ...config.resolve, plugins: [] };
  }
  if (config.resolve.plugins) {
    config.resolve.plugins.push(new TsconfigPathsPlugin());
  } else {
    config.resolve.plugins = [new TsconfigPathsPlugin()];
  }
  return config;
};
