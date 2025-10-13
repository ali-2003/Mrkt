/**
 * This configuration is used for the Sanity Studio
 */
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schema } from "./sanity/schema";

// Import the PDF export document action
import fulfillOrderAction from "./sanity/documentActions/fulfillOrderAction";

export default defineConfig({
  basePath: "/studio",
  projectId: "tv2rto4y",
  dataset: "production",
  
  // Add and edit the content schema in the './sanity/schema' folder
  schema,
  
  plugins: [
    deskTool(),
    // Vision is a tool that lets you query your content with GROQ in the studio
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  
  // ⚠️ NEW: Add document actions for custom buttons
  document: {
    actions: (prev, context) => {
      // Add the "Fulfill Order" PDF button for order documents
      return [...prev, fulfillOrderAction];
    },
  },
});