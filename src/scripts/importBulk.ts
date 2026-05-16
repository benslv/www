import dotenv from "dotenv";
dotenv.config();

import { z } from "astro/zod";
import { parse } from "csv-parse/sync";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "fs";
import path from "path";
import {
	diarySchema,
	ratingSchema,
	reviewSchema,
	watchedSchema,
	type DiarySchema,
	type RatingSchema,
	type ReviewSchema,
	type WatchedSchema,
} from "./letterboxdSchemas";

import {
	getFullImagePath,
	ImageSizes,
	TMDB,
	TMDB_IMAGE_BASE_URL,
	type Movie,
	type TV,
} from "@api-wrappers/tmdb-wrapper";
import { downloadPoster } from "./fetchPosters";

function slugify(title: string) {
	return (
		title
			// Strip double-quotes (CSV artifact)
			.replace(/"/g, "")
			// Strip apostrophes/single-quotes
			.replace(/'/g, "")
			// & → and
			.replace(/\s*&\s*/g, " and ")
			// × → x
			.replace(/×/g, "x")
			// Interpunct → hyphen
			.replace(/·/g, "-")
			// Slash → hyphen
			.replace(/\//g, "-")
			// Colon, en/em dash, asterisk, exclamation mark, comma → space
			.replace(/[:\u2013\u2014*!,]/g, " ")
			// Strip trailing period
			.replace(/\.(\s*)$/, "$1")
			// Normalise diacritics/macrons → ASCII
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			// Lowercase
			.toLowerCase()
			// Catch-all: remaining non-alphanumeric non-hyphen non-space → space
			.replace(/[^a-z0-9\- ]/g, " ")
			// Spaces → hyphens
			.replace(/\s+/g, "-")
			// Collapse multiple hyphens
			.replace(/-+/g, "-")
			// Strip leading/trailing hyphens
			.replace(/^-+|-+$/g, "")
	);
}

function importFile<
	T extends WatchedSchema | RatingSchema | DiarySchema | ReviewSchema,
>(fileName: string, schema: z.ZodType<T>): Record<string, T> {
	const csvFilePath = path.join(import.meta.dirname, fileName);

	if (!existsSync(csvFilePath)) {
		console.log(`No file found at path: ${csvFilePath}`);

		return {};
	}

	const csvData = readFileSync(csvFilePath, "utf-8");

	const parsedData = parse(csvData, { columns: true }).reduce<
		Record<string, T>
	>((acc, row) => {
		const parsedRow = schema.parse(row);

		const id = slugify(
			`${parsedRow.Date}-${parsedRow.Name}-${parsedRow.Year}`,
		);

		if (id in acc) {
			throw new Error(`${id} ID already exists...`);
			// console.log(`Skipping ${id}... already in entries.`);
			// return acc;
		}

		acc[id] = parsedRow;

		return acc;
	}, {});

	return parsedData;
}

const reviewEntries = importFile("reviews.csv", reviewSchema);
const diaryEntries = importFile("diary.csv", diarySchema);
const ratingEntries = importFile("ratings.csv", ratingSchema);
const watchedEntries = importFile("watched.csv", watchedSchema);

// We can only guarantee that properties from WatchedSchema will exist but we
// need to support all the possible properties up to the size of ReviewSchema
type AnyEntry = WatchedSchema & Partial<ReviewSchema>;

const allEntries: Record<string, AnyEntry> = {};

const outputFilePath = path.join(import.meta.dirname, "../content/movies");
if (!existsSync(outputFilePath)) mkdirSync(outputFilePath);

const existingFiles = new Set(
	readdirSync(outputFilePath).map((name) => name.replace(/\.md$/, "")),
);

/**
 * Iterate over review, diary, rating, and watched to fill in any gaps.
 *
 * The order is important here since rating is a subset of diary, and watched is a subset of rating.
 *
 * We want to process the items with the most information first.
 */
for (const entries of [
	reviewEntries,
	diaryEntries,
	ratingEntries,
	watchedEntries,
]) {
	for (const id in entries) {
		//  Skip IDs that are already present, as they will already have the same data (and probably more).
		if (id in allEntries) continue;

		if (existingFiles.has(id)) continue;

		allEntries[id] = entries[id];
	}
}

// Write all of the processed entries to Markdown files.
for (const id in allEntries) {
	const data = allEntries[id];

	const fileName = `${id}.md`;
	const filePath = path.join(outputFilePath, fileName);

	const contents = `---
name: "${data.Name}"
year: ${data.Year}
rating: ${data.Rating ?? null}
tags: ${data.Tags ?? null}
uri: ${data["Letterboxd URI"]}
rewatch: ${data.Rewatch}
date: ${data["Watched Date"] || data.Date}
---
${data.Review ?? ""}`;

	writeFileSync(filePath, contents);
}

const tmdb = new TMDB({
	accessToken: process.env.TMDB_ACCESS_TOKEN!,
	client: {
		retry: {
			maxAttempts: 5,
			delayMs: 1000,
		},
	},
});

const posterOutputPath = path.join(
	import.meta.dirname,
	"../content/movies/posters",
);

if (!existsSync(posterOutputPath)) mkdirSync(posterOutputPath);

let i = 0;
// Need to slowly download the images now...
for (const id in allEntries) {
	const { Name, Year } = allEntries[id];

	console.log(`Downloading ${i}/${Object.keys(allEntries).length}: ${Name}`);

	const data = await tmdb.search.movies({
		query: Name,
		year: Year,
	});

	let item: Movie | TV = data.results[0];

	if (!item) {
		console.log(`No movie found for ${Name}`);

		// Fallback and search TV if no movie found.
		const data = await tmdb.search.tv({
			query: Name,
			year: Year,
		});

		item = data.results[0];

		if (!item) {
			console.log(`No item returned for ${Name} ${Year}`);
			continue;
		}
	}

	const posterPath = item.poster_path;

	if (!posterPath) {
		console.log(`No poster path for ${Name} ${Year}`);
		continue;
	}

	const fullPosterUrl = getFullImagePath(
		TMDB_IMAGE_BASE_URL,
		ImageSizes.W92,
		posterPath,
	);

	const fileName = slugify(`${Name}-${Year}`) + ".jpg";
	const filePath = path.join(posterOutputPath, fileName);

	await downloadPoster(fullPosterUrl, filePath);

	i += 1;
}
