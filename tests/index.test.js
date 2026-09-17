import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { test } from 'uvu';
import * as assert from 'uvu/assert';

import pugPlugin from '../src/index.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const entryFilePath = join(currentDir, 'templates', 'index.html');

test('should work without template tag', () => {
  // ARRANGE
  const html = '<body><p>Hello, World!</p></body>';

  // ACTION
  const result = pugPlugin().transform(html, entryFilePath);

  // ASSERT
  assert.is(result, undefined);
});

test('should ignore template tag without necessary type', () => {
  // ARRANGE
  const html = `
    <body>
      <p>
        Hello, World!
        <template>I'm template</template>
      </p>
    </body>
  `;

  // ACTION
  const result = pugPlugin().transform(html, entryFilePath);

  // ASSERT
  assert.is(result, undefined);
});

test('should throw error when there is no path in template tag', () => {
  // ARRANGE
  const html = `
    <body>
      <p>
        Hello, World!
        <template data-type="pug"></template>
      </p>
    </body>
  `;

  // ACTION
  const transformFn = () => pugPlugin().transform(html, entryFilePath);

  // ASSERT
  assert.throws(
    transformFn,
    'Template path not specified for <template data-type="pug"></template>'
  );
});

test('should throw error when there is no path in self-closed template tag', () => {
  // ARRANGE
  const html = `
    <body>
      <p>
        Hello, World!
        <template data-type="pug" />
      </p>
    </body>
  `;

  // ACTION
  const transformFn = () => pugPlugin().transform(html, entryFilePath);

  // ASSERT
  assert.throws(transformFn, 'Template path not specified for <template data-type="pug" />');
});

test('should transform template tag', () => {
  // ARRANGE
  const rawHtml = `
    <body>
      <p>
        Hello, World!
        <template data-type="pug" data-src="./template.pug"></template>
      </p>
    </body>
  `;

  const expectedHtml = `
    <body>
      <p>
        Hello, World!
        <p>Pug</p>
      </p>
    </body>
  `;

  // ACTION
  const result = pugPlugin().transform(rawHtml, entryFilePath);

  // ASSERT
  assert.equal(result.code, expectedHtml);
});

test('should transform self-closed template tag', () => {
  // ARRANGE
  const rawHtml = `
    <body>
      <p>
        Hello, World!
        <template data-type="pug" data-src="./template.pug" />
      </p>
    </body>
  `;

  const expectedHtml = `
    <body>
      <p>
        Hello, World!
        <p>Pug</p>
      </p>
    </body>
  `;

  // ACTION
  const result = pugPlugin().transform(rawHtml, entryFilePath);

  // ASSERT
  assert.equal(result.code, expectedHtml);
});

test('should work with pug locals', () => {
  // ARRANGE
  const rawHtml = `
    <body>
      <p>
        Hello, World!
        <template data-type="pug" data-src="./locals.pug" />
      </p>
    </body>
  `;

  const expectedHtml = `
    <body>
      <p>
        Hello, World!
        <p>Vite is the best</p>
      </p>
    </body>
  `;

  // ACTION
  const result = pugPlugin({ pugLocals: { bundler: 'Vite' } }).transform(rawHtml, entryFilePath);

  // ASSERT
  assert.equal(result.code, expectedHtml);
});

test('should work multiple templates', () => {
  // ARRANGE
  const rawHtml = `
    <body>
      <p>
        Hello, World!
        <template data-type="pug" data-src="./template.pug" />
        <template data-type="pug" data-src="./locals.pug" />
      </p>
    </body>
  `;

  const expectedHtml = `
    <body>
      <p>
        Hello, World!
        <p>Pug</p>
        <p>Vite is the best</p>
      </p>
    </body>
  `;

  // ACTION
  const result = pugPlugin({ pugLocals: { bundler: 'Vite' } }).transform(rawHtml, entryFilePath);

  // ASSERT
  assert.equal(result.code, expectedHtml);
});

test('should transform when template is on multiple lines', () => {
  // ARRANGE
  const rawHtml = `
    <body>
      <p>
        Hello, World!
          <template
            data-src="./template.pug"
            data-type="pug"
          ></template>
          <template
            data-type="pug"
            data-src="./locals.pug"
          ></template>
      </p>
    </body>
  `;

  const expectedHtml = `
    <body>
      <p>
        Hello, World!
          <p>Pug</p>
          <p>Vite is the best</p>
      </p>
    </body>
  `;

  // ACTION
  const result = pugPlugin({ pugLocals: { bundler: 'Vite' } }).transform(rawHtml, entryFilePath);

  // ASSERT
  assert.equal(result.code, expectedHtml);
});

test('should ignore commented-out Pug template', () => {
  // ARRANGE
  const html = `
    <body>
      <!--
        <template
          data-type="pug"
          data-src="./template.pug"
        ></template>
      -->
    </body>
  `;

  // ACTION
  const result = pugPlugin().transform(html, entryFilePath);

  // ASSERT
  assert.is(result, undefined);
});

test('should expose transform hook', () => {
  // ARRANGE
  const plugin = pugPlugin();

  // ASSERT
  assert.type(plugin.transform, 'function');
});

test('should transform Pug templates in dev', () => {
  // ARRANGE
  const html = `
    <body>
      <template
        data-type="pug"
        data-src="./template.pug"
      ></template>
    </body>
  `;

  const plugin = pugPlugin();

  plugin.configResolved({ command: 'serve' });

  // ACTION
  const result = plugin.transformIndexHtml.handler(html, { filename: entryFilePath });

  // ASSERT
  assert.ok(result.includes('<p>Pug</p>'));
});

test.run();
