import * as debug from 'debug';
import { getEnv, setEnv } from './utils';
const d = debug('@electron/get:proxy');
/**
 * Initializes a third-party proxy module for HTTP(S) requests.
 */
export function initializeProxy() {
    try {
        // See: https://github.com/electron/get/pull/214#discussion_r798845713
        const env = getEnv('GLOBAL_AGENT_');
        setEnv('GLOBAL_AGENT_HTTP_PROXY', env('HTTP_PROXY'));
        setEnv('GLOBAL_AGENT_HTTPS_PROXY', env('HTTPS_PROXY'));
        setEnv('GLOBAL_AGENT_NO_PROXY', env('NO_PROXY'));
        /**
         * Previously this module bootstrapped the optional `global-agent`
         * dependency.  That package is deprecated, so we simply normalize the
         * proxy-related environment variables and allow the underlying HTTP
         * client to honor them directly.
         */
        d('Skipping global-agent bootstrap; relying on standard proxy env vars');
    }
    catch (e) {
        d('Could not load either proxy modules, built-in proxy support not available:', e);
    }
}
//# sourceMappingURL=proxy.js.map