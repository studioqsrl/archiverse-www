import "styles/tailwind.css"
import Auth0ProviderWrapper from "./components/auth0-provider-wrapper" // Auth0 wrapper
import ApolloProviderWrapper from "../src/components/apollo-provider-wrapper"; // Apollo wrapper

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Auth0ProviderWrapper>
          <ApolloProviderWrapper>{children}</ApolloProviderWrapper>
        </Auth0ProviderWrapper>
      </body>
    </html>
  )
}
