"use client" // This is a Client Component

import { useAuth0 } from "@auth0/auth0-react"
import Image from "next/image"

export default function AuthSection() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0()

  if (isLoading) {
    return <p className="text-gray-500 dark:text-gray-400">Loading authentication...</p>
  }

  return (
    <div className="mb-4">
      {!isAuthenticated && (
        <button
          onClick={() => loginWithRedirect()}
          className="mr-3 inline-flex h-full min-h-12 min-w-32 items-center justify-center rounded-xl border border-blue-400 bg-blue-400 px-6 py-2.5 text-center text-lg text-white transition-colors delay-50 hover:enabled:bg-blue-700"
        >
          Log In
        </button>
      )}
      {isAuthenticated && (
        <>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="mr-3 inline-flex h-full min-h-12 min-w-32 items-center justify-center rounded-xl border border-blue-400 bg-blue-400 px-6 py-2.5 text-center text-lg text-white transition-colors delay-50 hover:enabled:bg-blue-700"
          >
            Log Out
          </button>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <p>Welcome, {user?.name || user?.email}!</p>
            {user?.picture && (
              <Image
                src={user.picture}
                alt={user?.name || "User"}
                width={40}
                height={40}
                className="mx-auto mt-2 rounded-full"
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
