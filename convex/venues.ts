import { query } from "./_generated/server";
import { v } from "convex/values";

// This is the function the AI will trigger
export const searchVenues = query({
  args: { location: v.string() },
  handler: async (ctx, args) => {
    // Search the database index we built yesterday
    const results = await ctx.db
      .query("venues")
      .withSearchIndex("search_location", (q) =>
        q.search("location", args.location)
      )
      .take(5); // Return the top 5 matches
      
    return results;
  },
});