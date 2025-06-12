// frontend/src/config.ts
import configJson from "./auth_config.json"

interface AuthConfig {
  auth0domain: string
  spaClientId: string
  apiAudience?: string // Make apiAudience optional as it might be a placeholder
}

interface AppConfig {
  domain: string
  clientId: string
  audience?: string
}

export function getConfig(): AppConfig {
  const config: AuthConfig = configJson

  // Configure the audience here. Otherwise, the API sample won't work.
  const audience = config.apiAudience && config.apiAudience !== "YOUR_API_AUDIENCE" ? config.apiAudience : undefined // Use undefined for optional properties in TypeScript

  const appConfig: AppConfig = {
    domain: config.auth0domain,
    clientId: config.spaClientId,
  }

  if (audience) {
    appConfig.audience = audience
  }

  return appConfig
}
