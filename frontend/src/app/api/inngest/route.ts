import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { generateSong } from "~/inngest/functions";

// Create an API that serves one function
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [  
    generateSong
  ],
});