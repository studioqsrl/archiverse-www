"use client"

import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react"
import { useParams, useRouter } from "next/navigation" // Added useRouter for back button
import React, { useEffect, useState } from "react"

// Represents a chunk of raw textual content (Raw Layer)
interface RawContentChunk {
  id: string
  sequence: number
  content: string
}

// Represents an OriginDocument with its metadata and raw chunks (Origin + Raw Layers)
interface OriginDocumentDetails {
  id: string // Document ID
  name: string // Original file name
  originalFileType?: string // e.g., 'pdf', 'docx', 'png'
  storagePath?: string // Path/URL to the file in storage (could be a download link)
  createdAt?: string // Upload/creation date of origin document
  neo4jReferenceId?: string // ID of the node in Neo4j

  rawChunks: RawContentChunk[] // The LLM-processed textual content
}

const DocumentDetailPageContents: React.FC = () => {
  const { getAccessTokenSilently, isAuthenticated, user } = useAuth0() // Added user
  const params = useParams()
  const router = useRouter()
  const documentId = params.documentId as string

  const [documentData, setDocumentData] = useState<OriginDocumentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workflowStatus, setWorkflowStatus] = useState<string | null>(null) // For workflow trigger status

  useEffect(() => {
    if (!documentId || !isAuthenticated) return

    const fetchDocumentDetails = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const _token = await getAccessTokenSilently({
          authorizationParams: {
            audience: "archiverse-api", // As per auth_config.json
          },
        })

        // TODO: Replace with actual API call.
        // This API should return OriginDocument metadata AND its RawContentChunks.
        // Example: GET /api/v1/origin_documents/{documentId}?include_details=true&include_raw_chunks=true
        // The response should conform to OriginDocumentDetails interface.

        // Mock data incorporating Origin and Raw layer visualization:
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay

        const mockRawChunks: RawContentChunk[] = [
          {
            id: `chunk_${documentId}_1`,
            sequence: 1,
            content: `This is the LLM-processed text for the first part of document ${documentId}. It's derived from the original file content.`,
          },
          {
            id: `chunk_${documentId}_2`,
            sequence: 2,
            content: `This second chunk continues the textual representation of the origin document, without re-elaboration.`,
          },
        ]

        const mockDocument: OriginDocumentDetails = {
          id: documentId,
          name: `Original Document ${documentId}.pdf`,
          originalFileType: "pdf",
          storagePath: `/placeholder/path/to/origin_files/${documentId}.pdf`, // This could be a downloadable link
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
          neo4jReferenceId: `neo4j_node_${documentId}`,
          rawChunks: mockRawChunks,
        }
        setDocumentData(mockDocument)
      } catch (e: unknown) {
        console.error("Error fetching document details:", e)
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError("An unknown error occurred while fetching document details.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocumentDetails()
  }, [documentId, getAccessTokenSilently, isAuthenticated])

  const handleStartReviewWorkflow = async () => {
    if (!documentData) return
    setWorkflowStatus("Starting workflow...")
    setError(null) // Clear previous errors

    try {
      // Option 1: Calling a Next.js API route (preferred for simplicity if Temporal client is Node.js compatible)
      // This route would be protected by @auth0/nextjs-auth0 and use getSession.
      // No separate token needed from UI if it's a same-origin call with cookies.

      interface WorkflowErrorResponse {
        message: string
      }
      interface WorkflowSuccessResponse {
        message?: string // Optional success message
        workflowId?: string // Example field
      }

      const response = await fetch(`/api/workflows/start_review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: documentData.id,
          tenantId: user?.sub, // Or a proper tenantId if available differently
        }),
      })

      if (!response.ok) {
        let errorData: WorkflowErrorResponse = { message: "Failed to start workflow" }
        try {
          // Try to parse the JSON, but provide a fallback.
          const _parsedError = (await response.json()) as WorkflowErrorResponse
          // Check if parsedError has a message property
          if (_parsedError && typeof _parsedError.message === "string") {
            errorData = _parsedError
          }
        } catch { // _parseError removed as it's unused
          // JSON parsing failed, use default message or response.statusText
          errorData.message = response.statusText || errorData.message
        }
        throw new Error(errorData.message || `HTTP error ${response.status}`)
      }

      const result = (await response.json()) as WorkflowSuccessResponse
      setWorkflowStatus(
        `Workflow started successfully: ${result.message || (result.workflowId ? `ID: ${result.workflowId}` : "OK")}`
      )
    } catch (e: unknown) {
      console.error("Error starting workflow:", e)
      let errorMessage = "An unknown error occurred while starting the workflow."
      if (e instanceof Error) {
        errorMessage = e.message
      }
      setError(errorMessage)
      setWorkflowStatus(null) // Clear status on error
    }
  }

  if (isLoading)
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading document content...</p>
      </div>
    )
  if (error)
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  if (!documentData)
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Document not found or no content available.</p>
      </div>
    )

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="mb-6 text-blue-500 hover:underline">
        &larr; Back to Documents
      </button>

      {/* Origin Layer Visualization */}
      <section className="mb-8 rounded-lg border bg-gray-50 p-6 shadow dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-semibold">Origin Details</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <p>
            <strong>ID:</strong> {documentData.id}
          </p>
          <p>
            <strong>Name:</strong> {documentData.name}
          </p>
          <p>
            <strong>File Type:</strong> {documentData.originalFileType || "N/A"}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {documentData.createdAt ? new Date(documentData.createdAt).toLocaleString() : "N/A"}
          </p>
          <p>
            <strong>Neo4j Ref:</strong> {documentData.neo4jReferenceId || "N/A"}
          </p>
          {documentData.storagePath && (
            <p>
              <strong>Storage Link:</strong>
              {/* Assuming storagePath is a direct link or needs an API call to get a signed URL */}
              <a
                href={documentData.storagePath}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:underline"
              >
                Download/View Original
              </a>
            </p>
          )}
        </div>
      </section>

      {/* Raw Layer Visualization */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Raw Content View (LLM Processed Text)</h2>
          <button
            onClick={handleStartReviewWorkflow}
            disabled={!!workflowStatus && workflowStatus.startsWith("Workflow started")}
            className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:bg-gray-400"
          >
            {workflowStatus && workflowStatus.startsWith("Workflow started")
              ? "Review Initiated"
              : "Start Raw Data Review"}
          </button>
        </div>
        {workflowStatus && !error && <p className="mb-4 text-green-600">{workflowStatus}</p>}
        {error && workflowStatus === null && <p className="mb-4 text-red-500">Workflow Error: {error}</p>}

        {documentData.rawChunks && documentData.rawChunks.length > 0 ? (
          <div className="space-y-4">
            {documentData.rawChunks
              .sort((a, b) => a.sequence - b.sequence)
              .map((chunk) => (
                <div key={chunk.id} className="rounded-lg border bg-white p-4 shadow dark:bg-gray-700">
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">Chunk Sequence: {chunk.sequence}</p>
                  <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{chunk.content}</p>
                </div>
              ))}
          </div>
        ) : (
          <p>No raw content chunks available for this document.</p>
        )}
      </section>
    </div>
  )
}

export default withAuthenticationRequired(DocumentDetailPageContents, {
  returnTo: () => window.location.pathname,
})
