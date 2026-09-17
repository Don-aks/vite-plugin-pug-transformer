import path from 'path';
import colors from 'picocolors';
import { compileFile } from 'pug';

function getShortName(file, root) {
  return file.startsWith(root + '/') ? path.posix.relative(root, file) : file;
}

function getTemplatePath(template, filename) {
  const [, rawTemplatePath] = template.match(/\bdata-src\s*=\s*["']([^"']+)["']/i) || [];

  if (!rawTemplatePath) {
    throw new Error(`Template path not specified for ${template}`);
  }

  return path.resolve(path.dirname(filename), rawTemplatePath);
}

function transformPugTemplates(html, filename, pugOptions, pugLocals) {
  return html.replace(
    /<!--[\s\S]*?-->|<template\b[^>]*\bdata-type\s*=\s*["']pug["'][^>]*(?:\/\s*>|>\s*<\/template\s*>)/gi,
    (matchedString) => {
      // Ignore commented-out Pug templates.
      if (matchedString.startsWith('<!--')) {
        return matchedString;
      }

      const templateFilePath = getTemplatePath(matchedString, filename);

      return compileFile(templateFilePath, pugOptions)(pugLocals);
    }
  );
}

export default function ({ pugOptions = {}, pugLocals = {} } = {}) {
  return {
    name: 'vite-plugin-pug-transformer',

    transform(code, id) {
      if (!id.endsWith('.html')) return;

      const transformedCode = transformPugTemplates(code, id, pugOptions, pugLocals);

      if (transformedCode === code) return;

      return {
        code: transformedCode,
        map: null
      };
    },

    handleHotUpdate({ file, server }) {
      if (!file.endsWith('.pug')) {
        return;
      }

      server.config.logger.info(
        colors.green('page reload ') + colors.dim(getShortName(file, server.config.root)),
        {
          clear: true,
          timestamp: true
        }
      );

      server.ws.send({
        type: 'full-reload'
      });

      return [];
    }
  };
}
