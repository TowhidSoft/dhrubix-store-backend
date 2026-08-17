// routes/order.routes.ts
import express from 'express';
import Auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import * as OrderController from './order.controller'
import { OrderValidation } from './order.validation';
import { Role } from '@prisma/client';

const router = express.Router();

router.post('/createOrder', Auth(Role.CUSTOMER, Role.ADMIN), OrderController.createOrder);
router.get('/allOrder', Auth(Role.CUSTOMER, Role.ADMIN), OrderController.allOrder);
router.get('/allOrderAdmin', Auth(Role.ADMIN), OrderController.allOrderAdmin);
router.get('/:id/details', Auth(Role.ADMIN), OrderController.orderDetails);
// Customer-facing single-order fetch (ownership-checked) — powers the tracking page
router.get('/:id', Auth(Role.CUSTOMER, Role.ADMIN), OrderController.customerOrderDetails);
router.get('/:id/next-statuses', Auth(Role.ADMIN), OrderController.getNextStatuses);
router.get('/:id/invoice', Auth(Role.CUSTOMER, Role.ADMIN), OrderController.downloadInvoice);
router.patch(
    '/status/:id',
    Auth(Role.ADMIN),
    validateRequest(OrderValidation.updateOrderStatusValidationSchema),
    OrderController.updateStatus
);

export const OrderRoutes = router;
