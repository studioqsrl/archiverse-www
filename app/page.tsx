import { Metadata } from "next"
import Link from "next/link"
import AuthSection from "./components/auth-section"

export const metadata: Metadata = {
  title: "Archiverse Home",
}

export default function Web() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="w-full border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white">
            Archiverse
          </Link>
          <AuthSection />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 via-white to-white py-16 text-center dark:from-blue-900/30 dark:via-gray-900 dark:to-gray-900 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Welcome to <span className="text-blue-600 dark:text-blue-400">Archiverse</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
              Your modern platform for seamless document management, secure uploads, and efficient review workflows.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/documents"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Manage Documents
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              >
                Upload New Document
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section (Placeholder) */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
              Key Features
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Discover what Archiverse can do for you.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Secure Storage</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Reliable and secure cloud storage for all your important documents.</p>
              </div>
              {/* Feature 2 */}
              <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Easy Collaboration</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Streamlined review processes and team collaboration features.</p>
              </div>
              {/* Feature 3 */}
              <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Version Control</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Keep track of document versions and changes effortlessly.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-gray-100 py-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Archiverse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
