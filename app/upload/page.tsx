"use client";

import React, { useState } from 'react';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';

interface IngestApiResponse {
  message?: string;
  workflowId?: string;
  error?: string;
  details?: string;
}

interface SasApiResponse {
  sasUrl?: string;
  blobUrl?: string; // The final URL of the blob without SAS token
  blobName?: string;
  error?: string;
  details?: string;
}

async function uploadFileToAzureBlobStorage(
  file: File,
  tenantId: string,
  setUploadMessageCallback: React.Dispatch<React.SetStateAction<string | null>>
): Promise<{ finalBlobUrl: string; blobName: string }> {
  setUploadMessageCallback("Requesting upload permission...");
  // 1. Get SAS token from our backend API
  const sasResponse = await fetch('/api/upload/sas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      tenantId: tenantId,
    }),
  });

  const sasResult = await sasResponse.json() as SasApiResponse;

  if (!sasResponse.ok || !sasResult.sasUrl || !sasResult.blobUrl || !sasResult.blobName) {
    throw new Error(`Failed to get SAS token: ${sasResult.error || 'Unknown error'}`);
  }

  setUploadMessageCallback("Uploading file to Azure Blob Storage...");
  // 2. Use SAS URL to upload the file
  const blockBlobClient = new BlockBlobClient(sasResult.sasUrl);
  await blockBlobClient.uploadData(file, {
    blobHTTPHeaders: { blobContentType: file.type },
    onProgress: (progress) => {
      const percentDone = progress.loadedBytes / file.size * 100;
      setUploadMessageCallback(`Uploading: ${percentDone.toFixed(2)}%`);
    }
  });
  
  console.log(`File uploaded successfully to ${sasResult.blobUrl}`);
  return { finalBlobUrl: sasResult.blobUrl, blobName: sasResult.blobName };
}

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string>("default-tenant"); // Example tenant ID

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadMessage(null);
    }
  };

  const handleTenantIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTenantId(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setUploadMessage("Please select a file first.");
      return;
    }
    if (!tenantId.trim()) {
      setUploadMessage("Please enter a Tenant ID.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("Uploading file and initiating ingestion...");

    try {
      // 1. Upload file to Azure Blob Storage using SAS token
      const { finalBlobUrl, blobName } = await uploadFileToAzureBlobStorage(selectedFile, tenantId, setUploadMessage);
      setUploadMessage("File uploaded. Initiating ingestion workflow...");

      // 2. Call the backend API to initiate the Temporal workflow
      const response = await fetch('/api/ingest/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalFilename: selectedFile.name,
          contentType: selectedFile.type,
          size: selectedFile.size,
          originalBlobUrl: finalBlobUrl, // Use the actual blob URL
          tenantId: tenantId,
        }),
      });

      const result = await response.json() as IngestApiResponse;

      if (response.ok && result.workflowId) {
        setUploadMessage(`Ingestion successfully initiated. Workflow ID: ${result.workflowId}`);
        setSelectedFile(null); // Clear file input
        // Optionally, clear the form or redirect
      } else {
        setUploadMessage(`Error: ${result.error || 'Failed to initiate ingestion.'} (Details: ${result.details || (result.message || 'N/A')})`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadMessage(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <h1>Upload Document for Processing</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="tenantId" style={{ display: 'block', marginBottom: '5px' }}>Tenant ID:</label>
          <input
            type="text"
            id="tenantId"
            value={tenantId}
            onChange={handleTenantIdChange}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label htmlFor="fileUpload" style={{ display: 'block', marginBottom: '5px' }}>Choose file:</label>
          <input
            type="file"
            id="fileUpload"
            onChange={handleFileChange}
            disabled={isUploading}
            style={{ width: '100%', padding: '8px', marginBottom: '20px' }}
          />
        </div>
        <button
          type="submit"
          disabled={isUploading || !selectedFile || !tenantId.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: (isUploading || !selectedFile || !tenantId.trim()) ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (isUploading || !selectedFile || !tenantId.trim()) ? 'not-allowed' : 'pointer',
          }}
        >
          {isUploading ? 'Processing...' : 'Upload and Process'}
        </button>
      </form>
      {uploadMessage && (
        <p style={{ marginTop: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
          {uploadMessage}
        </p>
      )}
    </div>
  );
}
