const url = require('@rollup/plugin-url')
const svgo = require('rollup-plugin-svgo')
const replace = require('@rollup/plugin-replace')

module.exports = {
  rollup(config, options) {
    config.plugins = config.plugins.map(plugin => {
      if (plugin.name === 'replace') {
        return replace({
          ...plugin.options,
          preventAssignment: true,
        })
      }
      return plugin
    })

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
