import { Router } from "express";

import { AuthRoutes } from "../modules/auth/auth.routes";
import { UserRoutes } from "../modules/user/user.routes";
import { GoogleAuth } from "../modules/auth/passport/passport.routes";
import { BrandRoutes } from "../modules/brand/brand.route";
import { CategoryRoutes } from "../modules/category/category.route";
import { ProductRoutes } from "../modules/product/product.route";
import { WishListRoutes } from "../modules/wishList/wishList.route";
import { CartRoutes } from "../modules/cart/cart.route";
import { OrderRoutes } from "../modules/order/order.routes";
import { SizeRoutes } from "../modules/size/size.route";
import { ReviewRoutes } from "../modules/review/review.route";
import { PaymentRoutes } from "../modules/payment/payment.routes";
import { DashboardRoutes } from "../modules/dashboard/dashboard.route";
import { VisitorRoutes } from "../modules/visitor/visitor.route";
import { SocialRoutes } from "../modules/social/social.route";
import { SubCategoryRoutes } from "../modules/category/subcategory/subcategory.route";
import { SubscriberRoutes } from "../modules/subscriber/subscriber.route";
import { ColorRoutes } from "../modules/color/color.route";
import { HeroRoutes } from "../modules/cms/hero/hero.route";
import { OurStoryRoutes } from "../modules/cms/ourStory/ourStory.route";
import { BlogRoutes } from "../modules/cms/blog/blog.route";
import { SliderRoutes } from "../modules/slider/slider.route";
import { SiteSettingsRoutes } from "../modules/cms/siteSettings/siteSettings.route";

const router = Router()

const moduleRoutes = [
	{
		path: "/googleAuth",
		route: GoogleAuth,
	},
	{
		path: "/auth",
		route: AuthRoutes,
	},
	{
		path: "/visitor",
		route: VisitorRoutes,
	},
	{
		path: "/user",
		route: UserRoutes,
	},
	{
		path: "/brand",
		route: BrandRoutes,
	},
	{
		path: "/dashboard",
		route: DashboardRoutes,
	},
	{
		path: "/category",
		route: CategoryRoutes,
	},
	{
		path: "/subcategory",
		route: SubCategoryRoutes,
	},
	{
		path: "/size",
		route: SizeRoutes,
	},
	{
		path: "/color",
		route: ColorRoutes,
	},
	{
		path: "/product",
		route: ProductRoutes,
	},
	{
		path: "/wishlist",
		route: WishListRoutes,
	},
	{
		path: "/cart",
		route: CartRoutes,
	},
	{
		path: "/order",
		route: OrderRoutes,
	},
	{
		path: "/payment",
		route: PaymentRoutes,
	},
	{
		path: "/review",
		route: ReviewRoutes,
	},
	{
		path: "/social",
		route: SocialRoutes,
	},
	{
		path: "/hero",
		route: HeroRoutes,
	},
	{
		path: "/ourStory",
		route: OurStoryRoutes,
	},
	{
		path: "/blog",
		route: BlogRoutes,
	},
	{
		path: "/slider",
		route: SliderRoutes,
	},
	{
		path: "/subscriber",
		route: SubscriberRoutes,
	},
	{
		path: "/site-settings",
		route: SiteSettingsRoutes,
	},

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
