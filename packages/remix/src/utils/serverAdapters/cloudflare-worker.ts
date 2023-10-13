import { getCurrentHub, hasTracingEnabled } from '@sentry/core';
import { isString, logger } from '@sentry/utils';

import {
  createRoutes,
  getTransactionName,
  instrumentBuild,
  isRequestHandlerWrapped,
  startRequestHandlerTransaction,
} from '../instrumentServer';
import type { ReactRouterDomPkg, ServerBuild } from '../vendor/types';

type WorkerRequestHandler = (request: Request) => Promise<Response>;

export type CloudflareWorkerCreateRequestHandler = (
  this: unknown,
  build: ServerBuild,
  mode?: string,
) => WorkerRequestHandler;

let pkg: ReactRouterDomPkg;

function wrapCloudflareWorkerRequestHandler(
  origRequestHandler: WorkerRequestHandler,
  build: ServerBuild,
): WorkerRequestHandler {
  const routes = createRoutes(build.routes);

  // If the core request handler is already wrapped, don't wrap Express handler which uses it.
  if (isRequestHandlerWrapped) {
    return origRequestHandler;
  }

  return async function (this: unknown, request: Request): Promise<Response> {
    if (!pkg) {
      try {
        pkg = await import('react-router-dom');
      } finally {
        if (!pkg) {
          __DEBUG_BUILD__ && logger.error('Could not find `react-router-dom` package.');
        }
      }
    }

    const hub = getCurrentHub();
    const options = hub.getClient()?.getOptions();
    const scope = hub.getScope();

    scope.setSDKProcessingMetadata({ request });

    if (!options || !hasTracingEnabled(options) || !request.url || !request.method) {
      return origRequestHandler.call(this, request);
    }

    const url = new URL(request.url);
    const [name, source] = getTransactionName(routes, url, pkg);
    startRequestHandlerTransaction(hub, name, source, {
      headers: {
        'sentry-trace':
          (request.headers && isString(request.headers.get('sentry-trace')) && request.headers.get('sentry-trace')) ||
          '',
        baggage: (request.headers && isString(request.headers.get('baggage')) && request.headers.get('baggage')) || '',
      },
      method: request.method,
    });

    return origRequestHandler.call(this, request);
  };
}

/**
 * Instruments `createRequestHandler` from `@remix-run/cloudflare-workers`
 */
export function wrapCloudflareWorkerCreateRequestHandler(
  origCreateRequestHandler: CloudflareWorkerCreateRequestHandler,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (build: ServerBuild, mode?: string) => WorkerRequestHandler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (this: unknown, build: ServerBuild, mode?: string): WorkerRequestHandler {
    const newBuild = instrumentBuild(build);
    const requestHandler = origCreateRequestHandler.call(this, newBuild, mode);

    return wrapCloudflareWorkerRequestHandler(requestHandler, newBuild);
  };
}
