export function slugify(title: string) {
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
