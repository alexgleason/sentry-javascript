import type { Event, EventHint, EventProcessor } from '@sentry/types';
import { getGlobalSingleton, isThenable, logger, SyncPromise } from '@sentry/utils';

import { getCurrentHub } from './hub';

/**
 * Returns the global event processors.
 * @deprecated Global event processors will be removed in v8.
 */
export function getGlobalEventProcessors(): EventProcessor[] {
  return getGlobalSingleton<EventProcessor[]>('globalEventProcessors', () => []);
}

/**
 * Add a EventProcessor to be kept globally.
 * @deprecated Use `addEventProcessor` instead. Global event processors will be removed in v8.
 */
export function addGlobalEventProcessor(callback: EventProcessor): void {
  // eslint-disable-next-line deprecation/deprecation
  getGlobalEventProcessors().push(callback);
}

/**
 * Add an event processor to the current client.
 * This event processor will run for all events processed by this client.
 */
export function addEventProcessor(callback: EventProcessor): void {
  const client = getCurrentHub().getClient();

  if (!client || !client.addEventProcessor) {
    return;
  }

  client.addEventProcessor(callback);
}

/**
 * Process an array of event processors, returning the processed event (or `null` if the event was dropped).
 */
export function notifyEventProcessors(
  processors: EventProcessor[],
  event: Event | null,
  hint: EventHint,
  index: number = 0,
): PromiseLike<Event | null> {
  return new SyncPromise<Event | null>((resolve, reject) => {
    const processor = processors[index];
    if (event === null || typeof processor !== 'function') {
      resolve(event);
    } else {
      const result = processor({ ...event }, hint) as Event | null;

      __DEBUG_BUILD__ &&
        processor.id &&
        result === null &&
        logger.log(`Event processor "${processor.id}" dropped event`);

      if (isThenable(result)) {
        void result
          .then(final => notifyEventProcessors(processors, final, hint, index + 1).then(resolve))
          .then(null, reject);
      } else {
        void notifyEventProcessors(processors, result, hint, index + 1)
          .then(resolve)
          .then(null, reject);
      }
    }
  });
}
