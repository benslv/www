import { z } from "astro/zod";

export const watchedSchema = z.object({
	Date: z.string(),
	Name: z.string(),
	Year: z.coerce.number().int(),
	"Letterboxd URI": z.url(),
});
export type WatchedSchema = z.infer<typeof watchedSchema>;

export const ratingSchema = watchedSchema.extend({
	Rating: z.coerce.number().min(0).max(10).multipleOf(0.5),
});
export type RatingSchema = z.infer<typeof ratingSchema>;

export const diarySchema = ratingSchema.extend({
	Rewatch: z.string().transform((val) => val === "Yes"),
	Tags: z.string().transform((val) => (val ? val.split(", ") : [])),
	"Watched Date": z.string(),
});
export type DiarySchema = z.infer<typeof diarySchema>;

export const reviewSchema = diarySchema.extend({
	Review: z.string(),
});
export type ReviewSchema = z.infer<typeof reviewSchema>;
