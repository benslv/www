// @ts-check
import { defineConfig } from "astro/config";

import markdoc from "@astrojs/markdoc";
import react from "@astrojs/react";
import keystatic from "@keystatic/astro";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
	integrations: [react(), markdoc(), keystatic()],
	site: "https://bensilverman.co.uk",
	adapter: netlify(),
	prefetch: true,
});
