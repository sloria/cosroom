const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ManifestRevisionPlugin = require('manifest-revision-webpack-plugin');

const debug = (process.env.NODE_ENV !== 'production');

// Development asset host (webpack dev server)
const publicHost = debug ? 'http://localhost:2992' : '';

const rootAssetPath = path.join(__dirname, 'web', 'static');

module.exports = {
  context: __dirname,
  entry: {
    main_js: path.join(__dirname, 'web', 'static', 'main.js'),
    main_css: [
      path.join(__dirname, 'web', 'static', 'app.css'),
    ],
  },
  output: {
    path: path.join(__dirname, 'web', 'static', 'build'),
    publicPath: `${publicHost}/static/build/`,
    filename: '[name].[hash].js',
    chunkFilename: '[id].[hash].js',
  },
  resolve: {
    extensions: ['.js', '.css'],
    // Use client-side template compiling, just cuz it's easier for now
    alias: {
      vue$: 'vue/dist/vue.esm.js',
    },
  },
  devtool: 'source-map',
  module: {
    loaders: [
      { test: /\.html$/, loader: 'raw-loader' },
      { test: /\.css$/, loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' }) },
      { test: /\.(ttf|eot|svg|png|jpe?g|gif|ico)(\?.*)?$/i,
        loader: `file-loader?context=${rootAssetPath}&name=[path][name].[hash].[ext]` },
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader', query: { presets: ['es2015'], cacheDirectory: true } },
    ],
  },
  plugins: [
    new ExtractTextPlugin('[name].[hash].css'),
    new ManifestRevisionPlugin(path.join(__dirname, 'web', 'webpack', 'manifest.json'), {
      rootAssetPath,
      ignorePaths: ['/js', '/css', '.DS_Store', 'build'],
    }),
  ].concat(debug ? [] : [
    // production webpack plugins go here
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
  ]),
};
