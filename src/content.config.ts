import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { diarySchema } from "./scripts/processLetterboxdExport";

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
			image: z.string().optional(),
		}),
	}),
	movies: defineCollection({
		loader: glob({ pattern: "**/*.md", base: "./src/content/movies" }),
		schema: diarySchema,
	}),
};
