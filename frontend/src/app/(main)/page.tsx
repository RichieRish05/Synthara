import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";

 
export default async function HomePage() {

  try {
    // Prevent unauthenticated users from accessing dashboard
    const session = await auth.api.getSession({   // Check db to see if user is authenticated from browser headers
    headers: await headers()                    // Send current cookies over 
    })

    if (!session) {
      redirect("/auth/sign-in")                   // Redirect to sign in
    }
  } catch (PrismaClientInitializationError) {
    redirect("/auth/sign-in")                   // Redirect to sign in if session expired
  }

    
  return ( 
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col justify-start w-full max-w-3xl px-4 gap-2 pb-15">
        <h1 className="text-purple-600 font-extrabold text-5xl md:text-6xl tracking-tight">Welcome To Synthara!</h1>
        <h2 className="text-4xl">An AI Music Generation Service</h2>
        <p className="text-muted-foreground">
          Coming soon: a dashboard to publish and browse AI-generated songs, plus a functional in-app play bar. For now, use the Create page to generate tracks from prompts with an option to download them.
        </p>
        <Wrench className="mr-2"/>
        

      </div>

    </main>
  );
}
