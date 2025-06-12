"use client" // This directive makes it a Client Component

import { AppState, Auth0Provider } from "@auth0/auth0-react" // Sorted imports
import { useRouter } from "next/navigation" // Import useRouter
import React from "react"
import { getConfig } from "../../src/config" // Adjusted path

// getConfig can be called at the top level as it doesn't depend on hooks or client environment
const auth0Config = getConfig()

export default function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter() // Initialize useRouter inside the component

  const onRedirectCallback = (appState?: AppState) => {
    // Use router.replace for navigation
    router.replace(appState?.returnTo || window.location.pathname)
  }

  const providerConfig = {
    domain: auth0Config.domain,
    clientId: auth0Config.clientId,
    onRedirectCallback, // Use the new callback
    authorizationParams: {
      redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined, // Handle server-side rendering
      ...(auth0Config.audience ? { audience: auth0Config.audience } : {}), // Conditionally add audience
    },
  }

  // Ensure domain and clientId are present before rendering Auth0Provider
  if (!(providerConfig.domain && providerConfig.clientId)) {
    // You might want to log an error here or render a specific message
    console.error("Auth0 domain or clientId is missing. Auth0Provider will not be rendered.")
    return <>{children}</>
  }

  return <Auth0Provider {...providerConfig}>{children}</Auth0Provider>
}
