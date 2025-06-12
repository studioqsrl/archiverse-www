import { Client, Connection } from "@temporalio/client" // Sorted import

let temporalClientInstance: Client | null = null

async function getTemporalClient(): Promise<Client> {
  if (temporalClientInstance) {
    return temporalClientInstance
  }

  const temporalAddress = process.env.TEMPORAL_ADDRESS || "localhost:7233"
  const temporalNamespace = process.env.TEMPORAL_NAMESPACE || "default"

  try {
    // Use Connection.connect() as confirmed by temporalio/samples-typescript
    const connection = await Connection.connect({
      address: temporalAddress,
      // tls: {} // Configure TLS if needed for your Temporal server
    })

    temporalClientInstance = new Client({
      connection,
      namespace: temporalNamespace,
    })

    console.log(`Temporal client connected to ${temporalAddress}, namespace: ${temporalNamespace}`)
    return temporalClientInstance
  } catch (error) {
    console.error("Failed to create Temporal connection or client:", error)
    // Depending on error handling strategy, you might want to clear the instance
    // or implement retry logic. For now, rethrow to indicate failure.
    temporalClientInstance = null // Clear instance on error
    throw error
  }
}

export default getTemporalClient

// Optional: A way to gracefully close the connection when the application shuts down.
// This is more relevant for long-running server processes than serverless functions,
// but good to keep in mind.
// export async function closeTemporalClient(): Promise<void> {
//   if (temporalClientInstance) {
//     await temporalClientInstance.connection.close();
//     temporalClientInstance = null;
//     console.log('Temporal client connection closed.');
//   }
// }
