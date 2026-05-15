import { z } from "astro/zod";
import { parse } from "csv-parse/sync";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const diaryFilePath = path.join(__dirname, "diary.csv");
const outputFilePath = path.join(__dirname, "../content/movies");

function sanitiseTitle(title: string) {
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

export const letterboxdEntry = z.object({
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

const a = readFileSync(diaryFilePath, "utf-8");

const records = parse(a, { columns: true }).map((i) =>
	z.parse(letterboxdEntry, i),
);

if (!existsSync(outputFilePath)) mkdirSync(outputFilePath);

for (const entry of records) {
	const sanitisedName = sanitiseTitle(entry.Name);
	const fileName = `${entry["Watched Date"]}_${sanitisedName}_${entry.Year}`;

	const contents = `---
name: ${entry.Name}
year: ${entry.Year} 
rating: ${entry.Rating}
tags: ${entry.Tags.length > 0 ? entry.Tags : null}
uri: ${entry["Letterboxd URI"]}
rewatch: ${entry.Rewatch}
dateWatched: ${entry["Watched Date"]}
dateLogged: ${entry.Date}
---`;

	const filepath = path.join(outputFilePath, `${fileName}.md`);
	writeFileSync(filepath, contents);
}
