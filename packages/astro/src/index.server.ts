// Node SDK exports
// Unfortunately, we cannot `export * from '@sentry/node'` because in prod builds,
// Vite puts these exports into a `default` property (Sentry.default) rather than
// on the top - level namespace.

import { sentryAstro } from './integration';

// Hence, we export everything from the Node SDK explicitly:
export {
  // eslint-disable-next-line deprecation/deprecation
  addGlobalEventProcessor,
  addEventProcessor,
  addBreadcrumb,
  captureException,
  captureEvent,
  captureMessage,
  captureCheckIn,
  withMonitor,
  configureScope,
  createTransport,
  extractTraceparentData,
  getActiveTransaction,
  getHubFromCarrier,
  getCurrentHub,
  Hub,
  makeMain,
  Scope,
  startTransaction,
  SDK_VERSION,
  setContext,
  setExtra,
  setExtras,
  setTag,
  setTags,
  setUser,
  spanStatusfromHttpCode,
  trace,
  withScope,
  autoDiscoverNodePerformanceMonitoringIntegrations,
  makeNodeTransport,
  defaultIntegrations,
  defaultStackParser,
  lastEventId,
  flush,
  close,
  getSentryRelease,
  addRequestDataToEvent,
  DEFAULT_USER_INCLUDES,
  extractRequestData,
  deepReadDirSync,
  Integrations,
  Handlers,
  setMeasurement,
  getActiveSpan,
  startSpan,
  // eslint-disable-next-line deprecation/deprecation
  startActiveSpan,
  startInactiveSpan,
  startSpanManual,
  continueTrace,
} from '@sentry/node';

// We can still leave this for the carrier init and type exports
export * from '@sentry/node';

export { init } from './server/sdk';
export { handleRequest } from './server/middleware';

export default sentryAstro;
