import { nanoid } from "nanoid" // For unique workflow IDs
import { NextRequest, NextResponse } from "next/server"
import getTemporalClient from "src/lib/temporal-client" // Using baseUrl

// Define the expected request body structure
interface StartReviewRequestBody {
  documentId: string
  tenantId?: string // tenantId might come from user session or be passed explicitly
}

// Define the response structure
interface StartReviewResponse {
  message: string
  workflowId?: string // Example: if the workflow start returns an ID
  documentId?: string
  userId?: string
}

export async function POST(req: NextRequest) {
  // API Protection and session logic removed for now.
  // Placeholder for userId, normally from session.
  const placeholderUserId = "anonymous-user"

  try {
    const body = (await req.json()) as StartReviewRequestBody
    const { documentId, tenantId } = body

    if (!documentId) {
      return NextResponse.json({ error: "Bad Request: documentId is required" }, { status: 400 })
    }

    // tenantId from body is used directly. If not provided, it will be undefined.
    const effectiveTenantId = tenantId

    const client = await getTemporalClient()
    const workflowId = `raw-data-review-${documentId}-${nanoid(6)}`

    try {
      await client.workflow.start("rawDataReviewWorkflow", {
        // Workflow name from worker
        args: [{ documentId, tenantId: effectiveTenantId, userId: placeholderUserId }], // Input object for the workflow
        taskQueue: "raw-data-review-task-queue", // Must match worker's task queue
        workflowId: workflowId,
      })

      const responsePayload: StartReviewResponse = {
        message: "Raw data review workflow successfully initiated.",
        workflowId: workflowId,
        documentId: documentId,
        userId: placeholderUserId,
      }
      console.log(
        `Successfully started 'rawDataReviewWorkflow' for doc: ${documentId}, tenant: ${effectiveTenantId}, user: ${placeholderUserId}, workflowId: ${workflowId}`
      )
      return NextResponse.json(responsePayload, { status: 200 })
    } catch (temporalError: unknown) {
      console.error(`Failed to start Temporal workflow ${workflowId}:`, temporalError)
      let errorMessage = "Failed to start workflow due to a Temporal error."
      if (temporalError instanceof Error) {
        errorMessage = temporalError.message
      }
      // Return 500 for Temporal errors specifically
      return NextResponse.json({ error: "Workflow execution failed", details: errorMessage }, { status: 500 })
    }
  } catch (error: unknown) {
    console.error("Error in start_review API route:", error)
    let errorMessage = "Internal Server Error"
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    }
    // Check for JSON parsing errors specifically
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      errorMessage = "Bad Request: Invalid JSON in request body."
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
