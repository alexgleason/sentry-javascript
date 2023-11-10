/* eslint-disable no-console */
import { sentryVitePlugin } from '@sentry/vite-plugin';
import type { AstroIntegration } from 'astro';
import * as fs from 'fs';
import * as path from 'path';

import { buildClientSnippet, buildSdkInitFileImportSnippet, buildServerSnippet } from './snippets';
import type { SentryOptions } from './types';

const PKG_NAME = '@sentry/astro';

export const sentryAstro = (options: SentryOptions = {}): AstroIntegration => {
  return {
    name: PKG_NAME,
    hooks: {
      // eslint-disable-next-line complexity
      'astro:config:setup': async ({ updateConfig, injectScript, addMiddleware, config }) => {
        // The third param here enables loading of all env vars, regardless of prefix
        // see: https://main.vitejs.dev/config/#using-environment-variables-in-config

        // TODO: Ideally, we want to load the environment with vite like this:
        // const env = loadEnv('production', process.cwd(), '');
        // However, this currently throws a build error.
        // Will revisit this later.
        const env = process.env;

        const uploadOptions = options.sourceMapsUploadOptions || {};

        const shouldUploadSourcemaps = uploadOptions?.enabled ?? true;
        const authToken = uploadOptions.authToken || env.SENTRY_AUTH_TOKEN;

        if (shouldUploadSourcemaps && authToken) {
          updateConfig({
            vite: {
              build: {
                sourcemap: true,
              },
              plugins: [
                sentryVitePlugin({
                  org: uploadOptions.org ?? env.SENTRY_ORG,
                  project: uploadOptions.project ?? env.SENTRY_PROJECT,
                  authToken: uploadOptions.authToken ?? env.SENTRY_AUTH_TOKEN,
                  telemetry: uploadOptions.telemetry ?? true,
                }),
              ],
            },
          });
        }

        const pathToClientInit = options.clientInitPath
          ? path.resolve(options.clientInitPath)
          : findDefaultSdkInitFile('client');
        const pathToServerInit = options.serverInitPath
          ? path.resolve(options.serverInitPath)
          : findDefaultSdkInitFile('server');

        if (pathToClientInit) {
          options.debug && console.log(`[sentry-astro] Using ${pathToClientInit} for client init.`);
          injectScript('page', buildSdkInitFileImportSnippet(pathToClientInit));
        } else {
          options.debug && console.log('[sentry-astro] Using default client init.');
          injectScript('page', buildClientSnippet(options || {}));
        }

        if (pathToServerInit) {
          options.debug && console.log(`[sentry-astro] Using ${pathToServerInit} for server init.`);
          injectScript('page-ssr', buildSdkInitFileImportSnippet(pathToServerInit));
        } else {
          options.debug && console.log('[sentry-astro] Using default server init.');
          injectScript('page-ssr', buildServerSnippet(options || {}));
        }

        const isSSR = config && (config.output === 'server' || config.output === 'hybrid');
        const shouldAddMiddleware = options.autoInstrumentation?.requestHandler !== false;

        // Guarding calling the addMiddleware function because it was only introduced in astro@3.5.0
        // Users on older versions of astro will need to add the middleware manually.
        const supportsAddMiddleware = typeof addMiddleware === 'function';

        if (supportsAddMiddleware && isSSR && shouldAddMiddleware) {
          addMiddleware({
            order: 'pre',
            entrypoint: '@sentry/astro/middleware',
          });
        }
      },
    },
  };
};

function findDefaultSdkInitFile(type: 'server' | 'client'): string | undefined {
  const fileExtensions = ['ts', 'js', 'tsx', 'jsx', 'mjs', 'cjs', 'mts'];
  return fileExtensions
    .map(ext => path.resolve(path.join(process.cwd(), `sentry.${type}.config.${ext}`)))
    .find(filename => fs.existsSync(filename));
}
