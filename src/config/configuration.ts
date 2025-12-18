export default () => ({
  port: parseInt(process.env.PORT!, 10) || 3000,
  protean: {
    apiKey: process.env.PROTEAN_API_KEY,
    apiSecret: process.env.PROTEAN_API_SECRET,
    baseUrl: process.env.PROTEAN_BASE_URL,
    authorizationUrl: process.env.PROTEAN_AUTHORIZATION_URL,
    clientId: process.env.PROTEAN_CLIENT_ID,
    redirectUri: process.env.PROTEAN_REDIRECT_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
});