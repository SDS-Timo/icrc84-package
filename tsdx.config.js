const url = require('@rollup/plugin-url')
const svgo = require('rollup-plugin-svgo')

module.exports = {
  rollup(config, options) {
    config.plugins = [
      ...config.plugins,
      url({
        include: ['**/*.svg'],
        limit: 0,
        emitFiles: true,
        fileName: '[name].[hash][extname]',
      }),
      svgo(),
    ]
    return config
  },
}
