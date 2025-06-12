import { NextRequest, NextResponse } from "next/server";
// import { getSession } from "@auth0/nextjs-auth0"; // Auth0 import removed for now
import getTemporalClient from "../../../../src/lib/temporal-client"; // Adjusted path
import { nanoid } from "nanoid";

// Define the expected request body structure from the frontend
interface InitiateIngestionRequestBody {
  originalFilename: string;
  contentType: string;
  size: number;
  originalBlobUrl: string;
  tenantId?: string; // Optional tenantId from frontend, might be overridden by session
}

export async function POST(req: NextRequest) {
  // Auth0 session logic removed for now.
  const placeholderUserId = "api-ingest-user-placeholder";

  try {
    const body = (await req.json()) as InitiateIngestionRequestBody;

    // Validate required fields
    if (!body.originalFilename || !body.contentType || !body.size || !body.originalBlobUrl) {
      return NextResponse.json({ error: "Bad Request: Missing required fields in request body." }, { status: 400 });
    }

    // Determine effective tenantId (e.g., prioritize session tenantId or use from body if allowed)
    // For now, let's assume tenantId comes from the body or is a default.
    // In a multi-tenant app, this needs careful handling based on your auth setup.
    const tenantId = body.tenantId || process.env.DEFAULT_TENANT_ID || "default-tenant"; 
    if (!tenantId) {
        return NextResponse.json({ error: "Bad Request: tenantId is required." }, { status: 400 });
    }


    const client = await getTemporalClient();

    // Prepare workflow input
    const workflowInput = {
      originalFilename: body.originalFilename,
      contentType: body.contentType,
      size: body.size,
      originalBlobUrl: body.originalBlobUrl,
      uploadedBy: placeholderUserId, // Using placeholder user ID
      tenantId: tenantId, // Use the determined tenantId
      initialStatus: "UPLOADED", // As per GraphQL enum
    };

    // Generate a unique workflow ID
    const workflowId = `ingest-doc-${tenantId}-${nanoid(10)}`;

    // Start the workflow
    await client.workflow.start("ingestAndProcessDocumentWorkflow", {
      args: [workflowInput],
      taskQueue: process.env.TEMPORAL_TASK_QUEUE || "archiverse-document-ingestion",
      workflowId: workflowId,
    });

    console.log(`Successfully initiated 'ingestAndProcessDocumentWorkflow' for doc: ${body.originalFilename}, workflowId: ${workflowId}`);
    return NextResponse.json(
      {
        message: "Document ingestion workflow successfully initiated.",
        workflowId: workflowId,
      },
      { status: 202 } // Accepted
    );

  } catch (error: unknown) {
    console.error("Error in /api/ingest/initiate:", error);
    let errorMessage = "Internal Server Error";
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      errorMessage = "Bad Request: Invalid JSON in request body.";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: "Failed to initiate ingestion workflow.", details: errorMessage }, { status: 500 });
  }
}
