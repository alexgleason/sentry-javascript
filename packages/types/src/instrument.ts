// This should be: null | Blob | BufferSource | FormData | URLSearchParams | string
// But since not all of those are available in node, we just export `unknown` here for now
// Make sure to cast it where needed!
type XHRSendInput = unknown;

export type ConsoleLevel = 'debug' | 'info' | 'warn' | 'error' | 'log' | 'assert' | 'trace';

export interface SentryWrappedXMLHttpRequest {
  __sentry_xhr_v3__?: SentryXhrData;
  __sentry_own_request__?: boolean;
}

// WARNING: When the shape of this type is changed bump the version in `SentryWrappedXMLHttpRequest`
export interface SentryXhrData {
  method: string;
  url: string;
  status_code?: number;
  body?: XHRSendInput;
  request_body_size?: number;
  response_body_size?: number;
  request_headers: Record<string, string>;
}

export interface HandlerDataXhr {
  /**
   * @deprecated This property will be removed in v8.
   */
  args: [string, string];
  xhr: SentryWrappedXMLHttpRequest;
  startTimestamp?: number;
  endTimestamp?: number;
}

interface SentryFetchData {
  method: string;
  url: string;
  request_body_size?: number;
  response_body_size?: number;
}

export interface HandlerDataFetch {
  args: any[];
  fetchData: SentryFetchData;
  startTimestamp: number;
  endTimestamp?: number;
  // This is actually `Response`, make sure to cast this where needed (not available in Node)
  response?: unknown;
  error?: Error;
}

export interface HandlerDataDom {
  event: Event | { target: EventTarget };
  name: string;
  global?: boolean;
}

export interface HandlerDataConsole {
  level: ConsoleLevel;
  args: any[];
}

export interface HandlerDataHistory {
  from: string | undefined;
  to: string;
}

export interface HandlerDataError {
  column?: number;
  error?: Error;
  line?: number;
  msg: string | Event;
  url?: string;
}

export type HandlerDataUnhandledRejection = unknown;
