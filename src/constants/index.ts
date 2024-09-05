import { CookieOptions } from 'express';

export const MAX_AGE_JWT_COOKIE = 60 * 60 * 1000;
export const JWT_COOKIE_NAME = 'access_token';
export const JWT_COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  httpOnly: true,
  maxAge: MAX_AGE_JWT_COOKIE,
  secure: true,
  sameSite: 'strict',
};
