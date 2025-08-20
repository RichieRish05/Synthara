import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { generateFromDescription, generateWithDescription, generateWithLyrics } from "~/inngest/functions";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateWithLyrics,
    generateFromDescription,
    generateWithDescription
  ],
});