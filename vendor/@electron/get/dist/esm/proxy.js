import * as debug from 'debug';
import { URL } from 'url';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getEnv, setEnv } from './utils';
const d = debug('@electron/get:proxy');
const agentCache = new Map();
const WILDCARD_HOST = '*';
/**
 * Initializes proxy environment variables so that downstream helpers can
 * honour standard proxy configuration.
 */
export function initializeProxy() {
    try {
        const env = getEnv('GLOBAL_AGENT_');
        setEnv('GLOBAL_AGENT_HTTP_PROXY', env('HTTP_PROXY'));
        setEnv('GLOBAL_AGENT_HTTPS_PROXY', env('HTTPS_PROXY'));
        setEnv('GLOBAL_AGENT_NO_PROXY', env('NO_PROXY'));
        d('Normalized proxy environment variables for Electron downloads');
    }
    catch (e) {
        d('Could not normalize proxy environment variables:', e);
    }
}
function parseNoProxy(noProxyValue) {
    if (!noProxyValue) {
        return [];
    }
    return noProxyValue
        .split(',')
        .map(entry => entry.trim())
        .filter(entry => entry.length > 0);
}
function hostMatches(hostname, candidate) {
    if (candidate === WILDCARD_HOST) {
        return true;
    }
    const normalizedCandidate = candidate.startsWith('.') ? candidate.slice(1) : candidate;
    return (hostname === normalizedCandidate ||
        hostname.endsWith(`.${normalizedCandidate}`));
}
function shouldBypassProxy(parsedUrl, noProxyList) {
    if (noProxyList.length === 0) {
        return false;
    }
    const hostname = parsedUrl.hostname.toLowerCase();
    const port = parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : parsedUrl.protocol === 'http:' ? '80' : '');
    for (const entry of noProxyList) {
        const [host, entryPort] = entry.split(':');
        if (!host) {
            continue;
        }
        if (entryPort && entryPort !== port) {
            continue;
        }
        if (hostMatches(hostname, host.toLowerCase())) {
            d('Bypassing proxy for %s due to NO_PROXY rule %s', parsedUrl.href, entry);
            return true;
        }
    }
    return false;
}
export function getProxyAgentForUrl(requestUrl) {
    try {
        const parsedUrl = new URL(requestUrl);
        const env = getEnv('');
        const noProxyList = parseNoProxy(env('NO_PROXY'));
        if (shouldBypassProxy(parsedUrl, noProxyList)) {
            return undefined;
        }
        const isHttps = parsedUrl.protocol === 'https:';
        const proxyUrl = env(isHttps ? 'HTTPS_PROXY' : 'HTTP_PROXY') || env('HTTP_PROXY');
        if (!proxyUrl) {
            return undefined;
        }
        const cacheKey = `${isHttps ? 'https' : 'http'}|${proxyUrl}`;
        if (!agentCache.has(cacheKey)) {
            try {
                agentCache.set(cacheKey, new HttpsProxyAgent(proxyUrl));
            }
            catch (error) {
                d('Failed to construct proxy agent for %s: %O', proxyUrl, error);
                return undefined;
            }
        }
        d('Using proxy %s for %s', proxyUrl, requestUrl);
        return agentCache.get(cacheKey);
    }
    catch (error) {
        d('Failed to resolve proxy settings for %s: %O', requestUrl, error);
        return undefined;
    }
}
//# sourceMappingURL=proxy.js.map
