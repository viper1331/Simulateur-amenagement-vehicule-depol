/**
 * Initializes proxy helpers so that HTTP requests honour standard
 * environment variables.
 */
export declare function initializeProxy(): void;
export declare function getProxyAgentForUrl(requestUrl: string): import("http").Agent | undefined;
