import { Request, Response, NextFunction } from 'express';
import ENV from '../config/env';
import { assertEnv } from '../config/env';
import { verifyJwtToken } from '../utils/verify-jwt-token';
import { CookieManager } from '../utils/CookieManager';

export const verifyAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const accessToken = CookieManager.getAccessToken(req);

  if (!accessToken) {
    return next();
  }

  try {
    const decoded = await verifyJwtToken(
      accessToken,
      assertEnv(ENV.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET'),
    );
    req.user = decoded;
    next();
  } catch (error) {
    next();
  }
};
