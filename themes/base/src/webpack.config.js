var path = require('path');
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var webpack = require('webpack');
var AssetsPlugin = require('assets-webpack-plugin');
var StyleLintPlugin = require('stylelint-webpack-plugin');
var postcssPresetEnv = require('postcss-preset-env');
var SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production';

module.exports = {
	entry: {
    app: ['./js/main.js'],
    glossary: ['./js/glossary.js']
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['env']
					}
				}
			},
			{
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: { auto: true },
              importLoaders: 1,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                postcssPresetEnv({
                  autoprefixer: { grid: true },
                  stage: 0,
                  browsers: "> .5%, last 2 versions"
                })
              ]
            },
          },

        ]
      },
      {
        test: /\.(jpe?g|png|gif|woff|woff2|eot|ttf|svg)(\?[a-z0-9=.]+)?$/,
        loader: 'url-loader?limit=100000'
      }
		]
	},

	output: {
		path: path.join(__dirname, './../static/dist'),
		filename: 'js/[name].[chunkhash].js'
	},

	resolve: {
		modules: [path.resolve(__dirname, 'src'), 'node_modules']
	},

	plugins: [
		new AssetsPlugin({
			filename: 'webpack_assets.json',
			path: path.join(__dirname, '../data'),
			prettyPrint: true
    }),
    new MiniCssExtractPlugin({
      ignoreOrder: true,
      filename: "css/[name].[contenthash].css",
      chunkFilename: 'css/[id].[contenthash].css'
    }),
    new StyleLintPlugin({
      configFile: path.resolve(__dirname, 'stylelint.config.js'),
      context: path.resolve(__dirname, '../src/css'),
      files: '**/*.css',
      failOnError: false,
      quiet: false,
    }),
    new SVGSpritemapPlugin(path.resolve(__dirname, 'icons/**/*.svg'), {
      output: {
        filename: 'images/icons.svg'
      }
    })
  ],

  mode : devMode ? 'development' : 'production'
};
