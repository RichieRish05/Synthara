import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  },
);

export const generateWithLyrics = inngest.createFunction(
    { id: "generate-with-lyrics" },
    { event: "generate-with-lyrics-event" },
    async ({ event, step }) => {
      await step.sleep("wait-a-moment", "1s");
      return { message: `Hello ${event.data.email}!` };
    },
  );

export const generateWithDescription = inngest.createFunction(
    { id: "generate-with-description" },
    { event: "generate-with-description-event" },
    async ({ event, step }) => {
      await step.sleep("wait-a-moment", "1s");
      return { message: `Hello ${event.data.email}!` };
    },
  );

export const generateFromDescription= inngest.createFunction(
    { id: "generate-from-description" },
    { event: "generate-from-description-event" },
    async ({ event, step }) => { 
      await step.sleep("wait-a-moment", "1s");
      return { message: `Hello ${event.data.email}!` };
    },
  );