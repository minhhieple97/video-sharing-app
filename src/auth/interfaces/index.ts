import { User } from '@prisma/client';

export interface IAuthorizedRequest extends Request {
  user?: User;
}

export interface JwtTokenPayload {
  id: number;
  email: string;
  iat: number;
}
