import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

export const collections = {
	posts: defineCollection({
		loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
		schema: z.object({
			title: z.string(),
			date: z.date(),
			draft: z.boolean(),
			image: z.string().optional(),
		}),
	}),
	pages: defineCollection({
		loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
		schema: z.object({
			title: z.string(),
		}),
	}),
};
