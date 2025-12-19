export default () => ({
  port: parseInt(process.env.PORT!, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },
  protean: {
    apiKey: process.env.PROTEAN_API_KEY,
    apiSecret: process.env.PROTEAN_API_SECRET,
    baseUrl: process.env.PROTEAN_BASE_URL,
    authorizationUrl: process.env.PROTEAN_AUTHORIZATION_URL,
    clientId: process.env.PROTEAN_CLIENT_ID,
    redirectUri: process.env.PROTEAN_REDIRECT_URI,
  },
});