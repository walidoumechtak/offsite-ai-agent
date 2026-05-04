import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Table 1: The Memory Bank
  messages: defineTable({
    sessionId: v.string(), 
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
  }).index("by_sessionId", ["sessionId"]),

  // Table 2: The Knowledge Base
  venues: defineTable({
    name: v.string(),
    location: v.string(),
    capacity: v.number(),
    pricePerNight: v.number(),
    tags: v.array(v.string()), 
    description: v.string(),
  }).searchIndex("search_location", {
    searchField: "location",
  }),
});