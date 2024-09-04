import { Response } from 'express';
import { JWT_COOKIE_NAME, JWT_COOKIE_OPTIONS } from 'src/constants';

export const getYoutubeVideoId = (url: string): string | null => {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const checkValidYoutubeLink = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  return youtubeRegex.test(url);
};

export const setJwtCookie = (res: Response, token: string) => {
  res.cookie(JWT_COOKIE_NAME, token, JWT_COOKIE_OPTIONS);
};
