import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Prerendered pages (generateStaticParams + dynamicParams = false) are read back from the
// deployed static assets. Without an incremental cache the worker can't find them and every
// /services/[slug] and /destinations/[slug] URL returns 404 (NoFallbackError).
export default defineCloudflareConfig({
	incrementalCache: staticAssetsIncrementalCache,
});
