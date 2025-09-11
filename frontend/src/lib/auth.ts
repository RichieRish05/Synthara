import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "../server/db";

// Log environment variables
console.log('=== AUTH CONFIG DEBUG ===');
console.log('BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL);
console.log('BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('========================');

// If your Prisma file is located elsewhere, you can change the path

export const auth = betterAuth({
    database: prismaAdapter(db , {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {    
        enabled: true
    },
    baseURL: process.env.BETTER_AUTH_URL,
    // Add Vercel-specific configuration
    trustedOrigins: [
        process.env.BETTER_AUTH_URL!,
        process.env.NEXT_PUBLIC_BETTER_AUTH_URL!
    ],
    // Ensure proper response handling for Vercel
    logger: {
        level: process.env.NODE_ENV === "production" ? "error" : "info"
    }
});
