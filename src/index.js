import path from 'path';
import colors from 'picocolors';
import { compileFile } from 'pug';

function getShortName(file, root) {
  return file.startsWith(root + '/') ? path.posix.relative(root, file) : file;
}

export default function ({ pugOptions = {}, pugLocals = {} } = {}) {
  const plugin = {
    name: 'vite-plugin-pug-transformer',

    handleHotUpdate({ file, server }) {
      if (file.endsWith('.pug')) {
        server.config.logger.info(
          colors.green('page reload ') + colors.dim(getShortName(file, server.config.root)),
          { clear: true, timestamp: true }
        );

        server.ws.send({
          type: 'full-reload'
        });

        return [];
      }
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, { filename }) {
        return html.replace(
          /<!--[\s\S]*?-->|<template\b[^>]*\bdata-type\s*=\s*["']pug["'][^>]*(?:\/\s*>|>\s*<\/template\s*>)/gi,
          (matchedString) => {
            // Ignore commented-out Pug templates.
            if (matchedString.startsWith('<!--')) {
              return matchedString;
            }

          if (!rawTemplatePath) {
            throw new Error(`Template path not specified for ${matchedString}`);
          }

          const entryFileDir = filename.replace(/(.*)\/.*\.html$/, '$1');
          const templateFilePath = path.join(entryFileDir, rawTemplatePath);

          return compileFile(templateFilePath, pugOptions)(pugLocals);
          }
        );
      }
    }
  };

  // Properties for supporting old versions of Vite
  plugin.transformIndexHtml.enforce = plugin.transformIndexHtml.order;
  plugin.transformIndexHtml.transform = plugin.transformIndexHtml.handler;

  return plugin;
}
