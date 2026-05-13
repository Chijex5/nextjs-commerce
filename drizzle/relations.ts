import { relations } from "drizzle-orm/relations";
import { customOrderRequests, orders, users, paymentTransactions, abandonedCarts, carts, cartLines, productVariants, products, coupons, couponUsage, customOrderQuotes, customOrderQuoteTokens, googleMerchantProductSyncs, menus, menuItems, orderItems, paymentEvents, collections, productCollections, productImages, productOptions, reviews, reviewVotes, adminUsers, adminPasswordResets, emailCampaigns, campaignEmailLogs, campaignProducts } from "./schema";

export const ordersRelations = relations(orders, ({one, many}) => ({
	customOrderRequest: one(customOrderRequests, {
		fields: [orders.customOrderRequestId],
		references: [customOrderRequests.id]
	}),
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	paymentTransactions: many(paymentTransactions),
	orderItems: many(orderItems),
}));

export const customOrderRequestsRelations = relations(customOrderRequests, ({many}) => ({
	orders: many(orders),
	customOrderQuotes: many(customOrderQuotes),
}));

export const usersRelations = relations(users, ({many}) => ({
	orders: many(orders),
	abandonedCarts: many(abandonedCarts),
	reviews: many(reviews),
	reviewVotes: many(reviewVotes),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({one, many}) => ({
	order: one(orders, {
		fields: [paymentTransactions.orderId],
		references: [orders.id]
	}),
	paymentEvents: many(paymentEvents),
}));

export const abandonedCartsRelations = relations(abandonedCarts, ({one}) => ({
	user: one(users, {
		fields: [abandonedCarts.userId],
		references: [users.id]
	}),
}));

export const cartLinesRelations = relations(cartLines, ({one}) => ({
	cart: one(carts, {
		fields: [cartLines.cartId],
		references: [carts.id]
	}),
	productVariant: one(productVariants, {
		fields: [cartLines.productVariantId],
		references: [productVariants.id]
	}),
}));

export const cartsRelations = relations(carts, ({many}) => ({
	cartLines: many(cartLines),
}));

export const productVariantsRelations = relations(productVariants, ({one, many}) => ({
	cartLines: many(cartLines),
	product: one(products, {
		fields: [productVariants.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	productVariants: many(productVariants),
	googleMerchantProductSyncs: many(googleMerchantProductSyncs),
	productCollections: many(productCollections),
	productImages: many(productImages),
	productOptions: many(productOptions),
	reviews: many(reviews),
	campaignProducts: many(campaignProducts),
}));

export const couponUsageRelations = relations(couponUsage, ({one}) => ({
	coupon: one(coupons, {
		fields: [couponUsage.couponId],
		references: [coupons.id]
	}),
}));

export const couponsRelations = relations(coupons, ({many}) => ({
	couponUsages: many(couponUsage),
}));

export const customOrderQuotesRelations = relations(customOrderQuotes, ({one, many}) => ({
	customOrderRequest: one(customOrderRequests, {
		fields: [customOrderQuotes.requestId],
		references: [customOrderRequests.id]
	}),
	customOrderQuoteTokens: many(customOrderQuoteTokens),
}));

export const customOrderQuoteTokensRelations = relations(customOrderQuoteTokens, ({one}) => ({
	customOrderQuote: one(customOrderQuotes, {
		fields: [customOrderQuoteTokens.quoteId],
		references: [customOrderQuotes.id]
	}),
}));

export const googleMerchantProductSyncsRelations = relations(googleMerchantProductSyncs, ({one}) => ({
	product: one(products, {
		fields: [googleMerchantProductSyncs.productId],
		references: [products.id]
	}),
}));

export const menuItemsRelations = relations(menuItems, ({one}) => ({
	menu: one(menus, {
		fields: [menuItems.menuId],
		references: [menus.id]
	}),
}));

export const menusRelations = relations(menus, ({many}) => ({
	menuItems: many(menuItems),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
}));

export const paymentEventsRelations = relations(paymentEvents, ({one}) => ({
	paymentTransaction: one(paymentTransactions, {
		fields: [paymentEvents.paymentTransactionId],
		references: [paymentTransactions.id]
	}),
}));

export const productCollectionsRelations = relations(productCollections, ({one}) => ({
	collection: one(collections, {
		fields: [productCollections.collectionId],
		references: [collections.id]
	}),
	product: one(products, {
		fields: [productCollections.productId],
		references: [products.id]
	}),
}));

export const collectionsRelations = relations(collections, ({many}) => ({
	productCollections: many(productCollections),
}));

export const productImagesRelations = relations(productImages, ({one}) => ({
	product: one(products, {
		fields: [productImages.productId],
		references: [products.id]
	}),
}));

export const productOptionsRelations = relations(productOptions, ({one}) => ({
	product: one(products, {
		fields: [productOptions.productId],
		references: [products.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one, many}) => ({
	product: one(products, {
		fields: [reviews.productId],
		references: [products.id]
	}),
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
	reviewVotes: many(reviewVotes),
}));

export const reviewVotesRelations = relations(reviewVotes, ({one}) => ({
	review: one(reviews, {
		fields: [reviewVotes.reviewId],
		references: [reviews.id]
	}),
	user: one(users, {
		fields: [reviewVotes.userId],
		references: [users.id]
	}),
}));

export const adminPasswordResetsRelations = relations(adminPasswordResets, ({one}) => ({
	adminUser: one(adminUsers, {
		fields: [adminPasswordResets.adminId],
		references: [adminUsers.id]
	}),
}));

export const adminUsersRelations = relations(adminUsers, ({many}) => ({
	adminPasswordResets: many(adminPasswordResets),
	emailCampaigns: many(emailCampaigns),
}));

export const campaignEmailLogsRelations = relations(campaignEmailLogs, ({one}) => ({
	emailCampaign: one(emailCampaigns, {
		fields: [campaignEmailLogs.campaignId],
		references: [emailCampaigns.id]
	}),
}));

export const emailCampaignsRelations = relations(emailCampaigns, ({one, many}) => ({
	campaignEmailLogs: many(campaignEmailLogs),
	campaignProducts: many(campaignProducts),
	adminUser: one(adminUsers, {
		fields: [emailCampaigns.createdBy],
		references: [adminUsers.id]
	}),
}));

export const campaignProductsRelations = relations(campaignProducts, ({one}) => ({
	emailCampaign: one(emailCampaigns, {
		fields: [campaignProducts.campaignId],
		references: [emailCampaigns.id]
	}),
	product: one(products, {
		fields: [campaignProducts.productId],
		references: [products.id]
	}),
}));