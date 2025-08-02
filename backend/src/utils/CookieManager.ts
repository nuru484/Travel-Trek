import { Request, Response } from 'express';
import ENV from '../config/env';
import { UnauthorizedError } from '../middlewares/error-handler';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  domain?: string;
  maxAge?: number;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
}

/**
 * A utility class for managing HTTP cookies in an Express application.
 * Provides methods to set, get, clear, and configure access and refresh token cookies with secure defaults.
 */
export class CookieManager {
  // Default options that apply to all cookies
  private static defaultOptions: CookieOptions = {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    domain: ENV.COOKIE_DOMAIN || undefined,
    sameSite: 'lax',
    path: '/',
  };

  // Specific configurations for different token types
  private static tokenConfigs = {
    accessToken: {
      ...CookieManager.defaultOptions,
    },
    refreshToken: {
      ...CookieManager.defaultOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  /**
   * Sets an HTTP cookie for an access token with a 15-minute expiration.
   * @param res - The Express response object used to set the cookie.
   * @param token - The access token string to store in the cookie.
   */
  public static setAccessToken(res: Response, token: string): void {
    this.setCookie(res, 'accessToken', token, this.tokenConfigs.accessToken);
  }

  /**
   * Sets an HTTP cookie for a refresh token with a 7-day expiration.
   * @param res - The Express response object used to set the cookie.
   * @param token - The refresh token string to store in the cookie.
   */
  public static setRefreshToken(res: Response, token: string): void {
    this.setCookie(res, 'refreshToken', token, this.tokenConfigs.refreshToken);
  }

  /**
   * Clears a specified authentication token cookie by setting its expiration to 0.
   * @param res - The Express response object used to clear the cookie.
   * @param tokenName - The name of the token cookie to clear ('accessToken' or 'refreshToken').
   */
  public static clearToken(
    res: Response,
    tokenName: 'accessToken' | 'refreshToken',
  ): void {
    this.setCookie(res, tokenName, '', {
      ...this.defaultOptions,
      maxAge: 0,
    });
  }

  /**
   * Clears both access and refresh token cookies.
   * @param res - The Express response object used to clear the cookies.
   */
  public static clearAllTokens(res: Response): void {
    this.clearToken(res, 'accessToken');
    this.clearToken(res, 'refreshToken');
  }

  /**
   * Sets a generic HTTP cookie with the specified name, value, and options.
   * @param res - The Express response object used to set the cookie.
   * @param name - The name of the cookie.
   * @param value - The value to store in the cookie.
   * @param options - Optional cookie configuration (e.g., maxAge, httpOnly).
   */
  private static setCookie(
    res: Response,
    name: string,
    value: string,
    options: CookieOptions = {},
  ): void {
    res.cookie(name, value, {
      ...this.defaultOptions,
      ...options,
    });
  }

  /**
   * Retrieves the access token from request cookies.
   * @param req - The Express request object containing the cookies.
   * @returns The access token string.
   * @throws UnauthorizedError if the access token is not found in the cookies.
   */
  public static getAccessToken(req: Request): string {
    if (!req.cookies || !req.cookies.accessToken) {
      throw new UnauthorizedError('Access token not found. Please login', {
        layer: 'jwt',
        code: 'MISSING_TOKEN',
        context: { token: null },
      });
    }
    return req.cookies.accessToken;
  }

  /**
   * Retrieves the refresh token from request cookies.
   * @param req - The Express request object containing the cookies.
   * @returns The refresh token string.
   * @throws UnauthorizedError if the refresh token is not found in the cookies.
   */
  public static getRefreshToken(req: Request): string {
    if (!req.cookies || !req.cookies.refreshToken) {
      throw new UnauthorizedError('Refresh token not found. Please login', {
        layer: 'jwt',
        code: 'MISSING_TOKEN',
        context: { token: null },
      });
    }
    return req.cookies.refreshToken;
  }

  /**
   * Retrieves a cookie by name from the request.
   * @param req - The Express request object containing the cookies.
   * @param name - The name of the cookie to retrieve.
   * @param required - If true, throws an error if the cookie is not found; otherwise, returns null.
   * @returns The cookie value as a string, or null if not found and not required.
   * @throws UnauthorizedError if the cookie is required but not found.
   */
  public static getCookie(
    req: Request,
    name: string,
    required: boolean = false,
  ): string | null {
    const value = req.cookies?.[name] || null;

    if (required && !value) {
      throw new UnauthorizedError(`Cookie ${name} not found`, {
        layer: 'cookie',
        code: 'MISSING_COOKIE',
        context: { cookieName: name },
      });
    }

    return value;
  }
}
