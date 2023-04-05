const path = require('path');
const copy = require("rollup-plugin-copy");
const alias = require("@rollup/plugin-alias");
const resolve = require("@rollup/plugin-node-resolve");

const rootDir = path.resolve(__dirname);
const customResolver = resolve({
	extensions: ['.ts', '.js']
});

module.exports = {
	plugins: [
		alias({
			customResolver,
			entries: [
				{find: /^@\/(.*)/, replacement: path.resolve(rootDir, 'src/$1')}
			]
		}),
		...[
			process.env.DIRECTUS_EXTENSIONS_DIR ? copy({
				hook: 'writeBundle',
				targets: [
					{
						src: 'dist/index.js',
						dest: process.env.DIRECTUS_EXTENSIONS_DIR
					}
				]
			}) : null
		]
	]
}
