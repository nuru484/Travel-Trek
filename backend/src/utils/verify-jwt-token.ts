import { IUser } from 'types/user-profile.types';
import jwt, { VerifyErrors } from 'jsonwebtoken';

export const verifyJwtToken = <T = IUser>(
  token: string,
  secret: string,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err: VerifyErrors | null, decoded: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as T);
      }
    });
  });
};
