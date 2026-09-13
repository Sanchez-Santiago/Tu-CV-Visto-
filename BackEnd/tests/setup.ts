process.env.URL_TURSO = 'file:./tests/.test-cvisto.db';
process.env.TOKEN_TURSO = '';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.PANTALLA_BETA = 'false';
process.env.JWT_SECRET =
  'clave-de-prueba-lo-suficientemente-larga-para-hs256-0000000000';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.GOOGLE_CLIENT_ID = 'tests-id.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'tests-secret';
process.env.GOOGLE_CALLBACK_URL =
  'http://localhost:3000/auth/google/callback';