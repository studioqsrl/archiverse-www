import { NextRequest, NextResponse } from "next/server";
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  SASProtocol,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { nanoid } from "nanoid";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME; // Needs to be set, e.g., "archiverse"
const ORIGIN_DOCS_CONTAINER_NAME = process.env.ORIGIN_DOCS_CONTAINER_NAME || "origin-documents";

if (!AZURE_STORAGE_CONNECTION_STRING && !AZURE_STORAGE_ACCOUNT_NAME) {
  console.error("Azure Storage credentials are not configured. Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME and key.");
}
if (!AZURE_STORAGE_ACCOUNT_NAME && AZURE_STORAGE_CONNECTION_STRING) {
    // Attempt to parse from connection string if account name is missing
    const match = AZURE_STORAGE_CONNECTION_STRING.match(/AccountName=([^;]+)/);
    if (match && match[1]) {
        process.env.AZURE_STORAGE_ACCOUNT_NAME = match[1];
        console.log(`Derived AZURE_STORAGE_ACCOUNT_NAME: ${process.env.AZURE_STORAGE_ACCOUNT_NAME} from connection string.`);
    } else {
        console.error("AZURE_STORAGE_ACCOUNT_NAME is not set and could not be derived from connection string.");
    }
}

interface SasRequestPayload {
  fileName: string;
  contentType: string;
  tenantId?: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!AZURE_STORAGE_CONNECTION_STRING && (!AZURE_STORAGE_ACCOUNT_NAME || !process.env.AZURE_STORAGE_ACCOUNT_KEY)) {
      return NextResponse.json({ error: "Azure Storage credentials are not configured on the server." }, { status: 500 });
    }
    
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) {
        return NextResponse.json({ error: "Azure Storage Account Name is not configured." }, { status: 500 });
    }

    const body = await req.json() as SasRequestPayload;
    const { fileName, contentType, tenantId = "default-tenant" } = body;

    if (!fileName || !contentType) {
      return NextResponse.json({ error: "Bad Request: fileName and contentType are required." }, { status: 400 });
    }

    // Use BlobServiceClient with connection string if available, otherwise use account key
    let blobServiceClient;
    let accountKey;

    if (AZURE_STORAGE_CONNECTION_STRING) {
        blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    } else if (process.env.AZURE_STORAGE_ACCOUNT_KEY) {
        accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
        blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);
    } else {
        return NextResponse.json({ error: "Server is not configured with sufficient Azure Storage credentials." }, { status: 500 });
    }
    
    const containerClient = blobServiceClient.getContainerClient(ORIGIN_DOCS_CONTAINER_NAME);

    // Sanitize filename and create a unique blob name
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-\s]/g, "");
    const uniqueBlobName = `${tenantId}/${nanoid(10)}-${sanitizedFileName}`;

    const blobClient = containerClient.getBlobClient(uniqueBlobName);

    const startsOn = new Date();
    const expiresOn = new Date(startsOn);
    expiresOn.setMinutes(startsOn.getMinutes() + 30); // SAS token valid for 30 minutes

    // Account key is needed for generating user delegation SAS or account SAS if not using AAD identity
    // If using connection string, it contains the key. If using account name + key, we need the key.
    if (!accountKey && AZURE_STORAGE_CONNECTION_STRING) {
        const match = AZURE_STORAGE_CONNECTION_STRING.match(/AccountKey=([^;]+)/);
        if (match && match[1]) {
            accountKey = match[1];
        } else {
            return NextResponse.json({ error: "Could not extract AccountKey from connection string for SAS generation." }, { status: 500 });
        }
    } else if (!accountKey && !AZURE_STORAGE_CONNECTION_STRING) {
         return NextResponse.json({ error: "Account key is required for SAS generation and not found." }, { status: 500 });
    }


    const sasToken = generateBlobSASQueryParameters({
      containerName: ORIGIN_DOCS_CONTAINER_NAME,
      blobName: uniqueBlobName,
      permissions: BlobSASPermissions.parse("racw"), // Read, Add, Create, Write
      startsOn: startsOn,
      expiresOn: expiresOn,
      contentType: contentType,
      protocol: SASProtocol.Https,
    }, new StorageSharedKeyCredential(accountName, accountKey!)).toString();

    const sasUrl = `${blobClient.url}?${sasToken}`;

    return NextResponse.json({ sasUrl, blobUrl: blobClient.url, blobName: uniqueBlobName });

  } catch (error: unknown) {
    console.error("Error generating SAS token:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: "Failed to generate SAS token.", details: errorMessage }, { status: 500 });
  }
}
