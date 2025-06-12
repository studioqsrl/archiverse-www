"use client";

import { useAuth0 } from "@auth0/auth0-react";
import React, { ReactNode } from "react";
/* eslint-disable sort-imports */
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider as Provider,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client";
/* eslint-enable sort-imports */
import { setContext } from "@apollo/client/link/context";
import { getConfig } from "../config"; // Assuming config.ts provides apiAudience for the router

// Get Auth0 and API configuration
// const auth0Config = getConfig(); // This should ideally provide the GraphQL API audience

// The audience for your Apollo Router GraphQL API, as registered in Auth0
// This should match the 'identifier' in Auth0 and 'audience' in router.yaml
const APOLLO_ROUTER_API_AUDIENCE = "https://api.archiverse.com/graphql"; // As per Sprint 3 docs
const APOLLO_ROUTER_ENDPOINT = process.env.NEXT_PUBLIC_APOLLO_ROUTER_URL || "http://localhost:4000/graphql";

interface ApolloProviderWrapperProps {
  children: ReactNode;
}

export default function ApolloProviderWrapper({ children }: ApolloProviderWrapperProps) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  // HTTP link to your Apollo Router
  const httpLink = createHttpLink({
    uri: APOLLO_ROUTER_ENDPOINT,
  });

  // Middleware to set the Authorization header with the Auth0 access token
  const authLink = setContext(async (_, { headers }) => {
    if (!isAuthenticated) {
      // If not authenticated, don't try to get a token
      return { headers };
    }

    let token;
    try {
      token = await getAccessTokenSilently({
        authorizationParams: {
          audience: APOLLO_ROUTER_API_AUDIENCE,
          // You might need to add scopes here if your GraphQL API requires specific permissions
          // scope: "read:data write:data",
        },
      });
    } catch (error: unknown) {
      console.error("Error getting access token for GraphQL API:", error);
      // Check if error is an object and has an 'error' property before accessing it
      if (typeof error === 'object' && error !== null && 'error' in error) {
        const specificError = error as { error?: string }; // Type assertion
        if (specificError.error === "consent_required" || specificError.error === "login_required") {
          // Handle specific Auth0 errors, e.g., by prompting for login or consent.
          // For now, we'll just log it. In a real app, you might redirect or show a modal.
        }
      }
      // Return existing headers if token acquisition fails
      return { headers };
    }

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  });

  // Create the Apollo Client instance
  const client = new ApolloClient({
    link: ApolloLink.from([authLink, httpLink]), // Chain the authLink and httpLink
    cache: new InMemoryCache(),
    // connectToDevTools: process.env.NODE_ENV === 'development', // Enable DevTools in development
  });

  return <Provider client={client}>{children}</Provider>;
}
