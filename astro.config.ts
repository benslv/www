// @ts-check
import { defineConfig, fontProviders } from "astro/config";

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
	fonts: [
		{
			provider: fontProviders.local(),
			name: "Atkinson Hyperlegible Next",
			cssVariable: "--atkinson-hyperlegible-next",
			options: {
				variants: [
					{
						src: [
							"./src/assets/fonts/AtkinsonHyperlegibleNext-VariableFont_wght.ttf",
						],
						weight: "100 1000",
						style: "normal",
					},
					{
						src: [
							"./src/assets/fonts/AtkinsonHyperlegibleNext-Italic-VariableFont_wght.ttf",
						],
						weight: "100 1000",
						style: "italic",
					},
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: "JetBrains Mono Regular",
			cssVariable: "--jetbrains-mono",
			options: {
				variants: [
					{
						src: ["./src/assets/fonts/JetBrainsMono-Regular.woff2"],
						weight: "normal",
						style: "normal",
					},
				],
			},
		},
	],
});
