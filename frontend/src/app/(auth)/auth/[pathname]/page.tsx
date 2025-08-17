import { AuthView } from "@daveyplate/better-auth-ui"
import { authViewPaths } from "@daveyplate/better-auth-ui/server"

export const dynamicParams = false

export function generateStaticParams() {
    return Object.values(authViewPaths).map((path) => ({ path }))
}


export default async function AuthPage({ params }: { params: Promise<{ pathname: string }> }) {
    const { pathname } = await params
    

    console.log('Current pathname:', pathname) // Add this for debugging

    console.log('Available AuthView Paths', authViewPaths)
    return (
        <main className="container flex grow flex-col items-center justify-center self-center p-4 md:p-6">
            <AuthView pathname={pathname} />
        </main>
    )
}