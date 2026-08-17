// routes/visitor.routes.ts
import { Router } from 'express';
import Auth from '../../middleware/auth';
import * as VisitorController from "./visitor.controller"
import { Role } from '@prisma/client';

const router = Router();

router.post('/track', VisitorController.trackVisitor);

router.get('/total', Auth(Role.ADMIN), VisitorController.getTotalVisitors);

export const VisitorRoutes = router;