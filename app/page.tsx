import { Metadata } from "next"
import Link from "next/link"
import AuthSection from "./components/auth-section"

export const metadata: Metadata = {
  title: "Archiverse Home",
}

export default function Web() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="container mx-auto px-4 py-8 text-center">
        <AuthSection />
        <h1 className="mt-8 text-4xl font-bold dark:text-white">
          Welcome to Archiverse
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Your platform for document management and review.
        </p>
        <div className="mt-8 space-x-4">
          <Link href="/documents" className="rounded-md bg-blue-500 px-6 py-3 text-lg font-medium text-white hover:bg-blue-600">
            Go to Documents
          </Link>
          <Link href="/upload" className="rounded-md bg-green-500 px-6 py-3 text-lg font-medium text-white hover:bg-green-600">
            Upload Document
          </Link>
        </div>
      </div>
    </main>
  )
}
