import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Images are served as-is (SVG art now, pre-sized JPG/AVIF later);
  // Workers has no built-in image optimiser.
  images: { unoptimized: true },
  async redirects() {
    // /services/private-driver was merged into the private chauffeur page (one page per search intent).
    return [{ source: "/services/private-driver", destination: "/services/private-chauffeur", permanent: true }];
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
