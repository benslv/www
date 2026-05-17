import rss from "@astrojs/rss";
import assert from "assert";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { marked } from "marked";

export async function GET(context: APIContext) {
	const blog = await getCollection(
		"posts",
		({ data }) => data.draft !== true,
	);

	assert.ok(context.site, "`site` property not defined in Astro config.");

	return rss({
		title: "Ben Silverman",
		description: "My personal website!",
		site: context.site,
		items: blog.map((post) => ({
			title: post.data.title,
			pubDate: post.data.date,
			link: `/posts/${post.id}`,
			content: post.body && marked.parse(post.body, { async: false }),
		})),
	});
}
