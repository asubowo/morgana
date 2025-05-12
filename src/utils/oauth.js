import fetch from "node-fetch"
import { URLSearchParams } from "url"
import { logger } from "./logger.js"

let accessToken = ""
let tokenExpiresAt = 0 // epoch timestamp

export async function fetchAccessToken() {
  logger.info("Attempting to retrieve OAuth access token")
  const now = Math.floor(Date.now() / 1000)

  if (accessToken && now < tokenExpiresAt - 30) {
    logger.info("Current access token is still valid")
    return { token: accessToken, expiresAt: tokenExpiresAt } // still valid
  }

  const clientId = process.env.OAUTH_CLIENT_ID
  const clientSecret = process.env.OAUTH_CLIENT_SECRET
  const authUrl = process.env.OAUTH_BASE_URL
  const tokenUrl = `${authUrl}/realms/subspace/protocol/openid-connect/token`

  if (!clientId || !clientSecret) {
    logger.warn("OAuth client ID or secret not specified!")
    return
  }

  const params = new URLSearchParams()
  params.append("grant_type", "client_credentials")
  params.append("client_id", clientId)
  params.append("client_secret", clientSecret)

  const res = await fetch(tokenUrl, {
    method: "POST",
    body: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })

  // Report failure but don't hard fail out
  if (!res.ok) {
    const error = await res.text()
    logger.error("Failed to fetch access token", error)
    return
  }

  const json = await res.json()
  accessToken = json.access_token
  tokenExpiresAt = now + json.expires_in
  logger.debug("Retrieved access token", accessToken)
  logger.info(`Access token valid until ${new Date(tokenExpiresAt * 1000).toLocaleString()}`)
  return { token: accessToken, expiresAt: tokenExpiresAt}
}
