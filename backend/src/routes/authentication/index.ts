// src/routes/authentication/index.ts
import { Router } from 'express';
import registerRoutes from './register';
import loginRoutes from './login';
import refreshRoutes from './refresh-token';
import logoutRoutes from './logout';

const authenticationRouter = Router();

authenticationRouter.use('/auth', registerRoutes);
authenticationRouter.use('/auth', loginRoutes);
authenticationRouter.use('/auth', refreshRoutes);
authenticationRouter.use('/auth', logoutRoutes);

export { authenticationRouter };
