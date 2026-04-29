import { collection, config, fields } from "@keystatic/core";

const isProduction = process.env.NODE_ENV === "production";

export default config({
	storage: isProduction ? { kind: "cloud" } : { kind: "local" },
	cloud: { project: "bens/site" },
	collections: {
		posts: collection({
			label: "Posts",
			columns: ["title", "date", "draft"],
			slugField: "title",
			path: "src/content/posts/*",
			entryLayout: "content",
			format: {
				contentField: "body",
			},
			schema: {
				title: fields.slug({ name: { label: "Title" } }),
				date: fields.date({ label: "Date" }),
				image: fields.text({ label: "Image" }),
				draft: fields.checkbox({ label: "Draft" }),
				body: fields.markdoc({
					label: "Body",
					extension: "md",
				}),
			},
		}),
		pages: collection({
			label: "Pages",
			slugField: "title",
			path: "src/content/pages/*",
			entryLayout: "content",
			format: {
				contentField: "body",
			},
			schema: {
				title: fields.slug({ name: { label: "Title" } }),
				body: fields.markdoc({
					label: "Body",
					extension: "md",
				}),
				image: fields.text({ label: "Image" }),
			},
		}),
	},
});
