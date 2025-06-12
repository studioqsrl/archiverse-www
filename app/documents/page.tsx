"use client"

import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react"
import Link from "next/link" // Import Link
import React, { useEffect, useState } from "react"

interface OriginDocument {
  id: string
  name: string
  source: string
  uploadedAt: string
}

const DocumentsPageContents: React.FC = () => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0()
  const [documents, setDocuments] = useState<OriginDocument[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!isAuthenticated) return

      setIsLoadingDocs(true)
      setError(null)
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: "archiverse-api", // Explicitly set audience, matching auth_config.json
          },
        })

        // Replace with actual API endpoint from Sprint 1 raw_data_api
        const response = await fetch('/api/raw_data/origin_documents', { // Assuming this endpoint
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch documents: ${response.statusText}`);
        }
        const data = (await response.json()) as OriginDocument[];
        setDocuments(data);

      } catch (e: unknown) {
        console.error("Error fetching documents:", e)
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError("An unknown error occurred")
        }
      } finally {
        setIsLoadingDocs(false)
      }
    }

    fetchDocuments()
  }, [getAccessTokenSilently, isAuthenticated])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">My Documents</h1>
      <p className="mb-4">Welcome, {user?.name || user?.email}!</p>

      {isLoadingDocs && <p>Loading documents...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!isLoadingDocs && !error && documents.length === 0 && <p>No documents found.</p>}

      {!isLoadingDocs && !error && documents.length > 0 && (
        <ul className="space-y-4">
          {documents.map((doc) => (
            <li key={doc.id} className="rounded-lg border shadow transition-shadow hover:shadow-md">
              <Link href={`/documents/${doc.id}`} className="block p-4">
                <h2 className="text-xl font-semibold text-blue-600 hover:underline">{doc.name}</h2>
                <p className="text-sm text-gray-500">Source: {doc.source}</p>
                <p className="text-sm text-gray-500">Uploaded: {new Date(doc.uploadedAt).toLocaleString()}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Protect the page contents.
// If the user is not authenticated, they will be redirected to login,
// and then returned to this page.
export default withAuthenticationRequired(DocumentsPageContents, {
  // Optionally, you can add a loading component while Auth0 is checking authentication
  // onRedirecting: () => <div>Loading...</div>,
  returnTo: "/documents",
})

// Add metadata if needed, though it's simpler if the page is a server component.
// For client components, managing metadata might require a different approach or be omitted.
// export const metadata = {
// title: "My Documents",
// };
