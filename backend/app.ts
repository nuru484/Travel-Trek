// app.ts
require('dotenv').config();
import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import routes from './src/routes';
import ENV from './src/config/env';
import rateLimiter from './src/middlewares/rateLimit';
import {
  errorHandler,
  UnauthorizedError,
} from './src/middlewares/error-handler';

const app = express();

const allowedOrigins = new Set(
  ENV.CORS_ACCESS ? ENV.CORS_ACCESS.split(',') : [],
);

interface CorsCallback {
  (err: Error | null, allow: boolean): void;
}

const corsOptions = {
  origin: function (origin: string | undefined, callback: CorsCallback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(
        new UnauthorizedError('Not allowed by CORS', {
          layer: 'cors',
          code: 'CORS_NOT_ALLOWED',
          context: { origin },
        }),
        false,
      );
    }
  },

  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser() as express.RequestHandler);
app.set('trust proxy', true); // Enable trust proxy for proper IP handling behind proxies
app.use(
  morgan(':method :url :status :response-time ms') as express.RequestHandler,
);
app.use(rateLimiter as express.RequestHandler);
app.use('/api/v1', routes);
app.use(errorHandler);

export default app;
