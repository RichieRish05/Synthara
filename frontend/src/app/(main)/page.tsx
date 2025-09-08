import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
 
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
     <p>Dashboard</p>
    </main>
  );
}
