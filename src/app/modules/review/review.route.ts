import { Router } from "express";
import * as ReviewController from "./review.controller"
import validateRequest from "../../middleware/validateRequest";
// import { UserValidation } from "./user.validation";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import { ReviewValidation } from "./review.validation";


const router = Router()


router.post("/", Auth(Role.CUSTOMER, Role.ADMIN),
    validateRequest(ReviewValidation.createReviewValidationSchema), ReviewController.create)

router.get("/getAll", Auth(Role.ADMIN), ReviewController.getAll)
router.get("/:productId", ReviewController.getAllApproved)

router.get("/isReviewed/:productId", Auth(Role.CUSTOMER, Role.ADMIN), ReviewController.isReviewed)

// router.get("/:id", ReviewController.getReview)

router.patch("/:id", Auth(Role.ADMIN), ReviewController.approveReview)

router.delete("/:id", Auth(Role.ADMIN), ReviewController.deleteReview)

export const ReviewRoutes = router;
