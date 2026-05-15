import { z } from "astro/zod";
import { parse } from "csv-parse/sync";
import {
	appendFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const diaryFilePath = path.join(__dirname, "diary.csv");
const reviewsFilePath = path.join(__dirname, "reviews.csv");
const outputFilePath = path.join(__dirname, "../content/movies");

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

function generateFrontmatter(obj: DiaryEntry | ReviewEntry) {
	return `---
name: ${obj.Name}
year: ${obj.Year}
rating: ${obj.Rating}
tags: ${obj.Tags.length > 0 ? obj.Tags : null}
uri: ${obj["Letterboxd URI"]}
rewatch: ${obj.Rewatch}
dateWatched: ${obj["Watched Date"]}
dateLogged: ${obj.Date}
---`;
}

export const diarySchema = z.object({
	Date: z.string(),
	Name: z.string(),
	Year: z.coerce.number(),
	"Letterboxd URI": z.string(),
	Rating: z.coerce.number(),
	Rewatch: z.string().transform((val) => val === "Yes"),
	Tags: z
		.string()
		.transform((val) => (val.length > 0 ? val.split(", ") : [])),
	"Watched Date": z.string(),
});

const reviewSchema = diarySchema.extend({
	Review: z.string(),
});

type DiaryEntry = z.infer<typeof diarySchema>;
type ReviewEntry = z.infer<typeof reviewSchema>;

const diary = readFileSync(diaryFilePath, "utf-8");
const reviews = readFileSync(reviewsFilePath, "utf-8");

const parsedDiary = parse(diary, { columns: true }).map((i) =>
	z.parse(diarySchema, i),
);

const parsedReviews = parse(reviews, { columns: true }).map((i) =>
	z.parse(reviewSchema, i),
);

if (!existsSync(outputFilePath)) mkdirSync(outputFilePath);

const slugs = new Set<string>();

// Generate diary entries first
for (const entry of parsedDiary) {
	const date = entry["Watched Date"] || entry.Date;

	const slug = slugify(`${date}_${entry.Name}_${entry.Year}`);

	if (slugs.has(slug)) {
		throw new Error(`Generated a slug we've already seen: ${slug}`);
	}

	slugs.add(slug);

	const fileName = `${slug}.md`;

	const frontmatter = generateFrontmatter(entry);

	const filepath = path.join(outputFilePath, fileName);
	writeFileSync(filepath, frontmatter);
}

for (const review of parsedReviews) {
	const date = review["Watched Date"] || review.Date;

	const slug = slugify(`${date}_${review.Name}_${review.Year}`);

	const fileName = `${slug}.md`;

	const filepath = path.join(outputFilePath, fileName);

	if (slugs.has(slug)) {
		// Append just the review if we already have a diary entry.
		appendFileSync(filepath, `\n${review.Review}`);
	} else {
		console.log(`Found review without diary entry: ${slug}`);
		const frontmatter = generateFrontmatter(review);

		const content = `${frontmatter}
		
${review.Review}`;

		// Add the frontmatter and review if this entry isn't already present.
		writeFileSync(filepath, content);
	}
}
