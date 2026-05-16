/**
 * 1. Work through entries in /content/movies
 * 2. Check if poster already saved (/content/movies/posters?)
 * 3. Skip if so.
 * 4. If not, search for movie then fetch poster.
 *
 *
 * search for movie by title and year — https://developer.themoviedb.org/reference/search-movie
 * fetch poster by TMDb ID — https://developer.themoviedb.org/reference/movie-images
 */
import dotenv from "dotenv";
dotenv.config();

import { writeFile } from "fs/promises";

export async function downloadPoster(src: string, filePath: string) {
	const response = await fetch(src);

	if (!response.ok) {
		throw new Error(
			`Failed to fetch image ${src}: ${response.status} ${response.statusText}`,
		);
	}

	const arrayBuffer = await response.arrayBuffer();
	await writeFile(filePath, Buffer.from(arrayBuffer));
}
