const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const TerserPlugin = require('terser-webpack-plugin')

const plugins = [
  new CleanWebpackPlugin({}),

  new MiniCssExtractPlugin({
    filename: '[name].[contenthash].css'
  }),

  new HtmlWebpackPlugin({
    template: 'public/index.html'
  }),

  new PreloadWebpackPlugin({
    rel: 'preload',
    include: 'all'
  }),

  new CopyWebpackPlugin({
    patterns: [
      { from: path.resolve(__dirname, 'public', 'assets'), to: path.resolve(__dirname, 'dist', 'assets') },
    ]
  })
]

if (process.env.BUNDLE_ANALYZE) {
  plugins.push(new BundleAnalyzerPlugin())
}

module.exports = {
  entry: {
    main: './src/index.js'
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    historyApiFallback: true,
    allowedHosts: 'all',
    static: path.join(__dirname, 'public'),
    compress: true,
    open: true,
    hot: true,
    proxy: {
      '/__': {
        target: 'http://localhost:5002'
      }
    }
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: require('./.babelrc')
        }
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin()
    ]
  },
  performance: {
    hints: false,
    maxEntrypointSize: 272000,
    maxAssetSize: 272000
  },
  plugins
}
