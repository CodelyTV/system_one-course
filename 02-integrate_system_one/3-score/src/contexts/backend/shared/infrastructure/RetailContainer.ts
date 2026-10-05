import { createGateway } from "ai";

import { CartVariantAdder } from "@/contexts/backend/checkout/application/add/CartVariantAdder";
import { CheckoutConfirmer } from "@/contexts/backend/checkout/application/confirm/CheckoutConfirmer";
import { CartItemCounter } from "@/contexts/backend/checkout/application/count/CartItemCounter";
import { CartVariantRemover } from "@/contexts/backend/checkout/application/remove/CartVariantRemover";
import { CheckoutViewGetter } from "@/contexts/backend/checkout/application/view/CheckoutViewGetter";
import { PostgresCheckoutRepository } from "@/contexts/backend/checkout/infrastructure/PostgresCheckoutRepository";
import { OrderFinder } from "@/contexts/backend/orders/application/find/OrderFinder";
import { OrdersLister } from "@/contexts/backend/orders/application/list/OrdersLister";
import { UserOrdersLister } from "@/contexts/backend/orders/application/list-mine/UserOrdersLister";
import { OrderPlacer } from "@/contexts/backend/orders/application/place/OrderPlacer";
import { PostgresOrderRepository } from "@/contexts/backend/orders/infrastructure/PostgresOrderRepository";
import { CategoriesLister } from "@/contexts/backend/products/application/categories/CategoriesLister";
import { ProductFinder } from "@/contexts/backend/products/application/find/ProductFinder";
import { InventoryLister } from "@/contexts/backend/products/application/inventory/InventoryLister";
import { LowStockLister } from "@/contexts/backend/products/application/low-stock/LowStockLister";
import { ProductsSearcher } from "@/contexts/backend/products/application/search/ProductsSearcher";
import { PostgresProductRepository } from "@/contexts/backend/products/infrastructure/PostgresProductRepository";
import { ProductReviewCreator } from "@/contexts/backend/reviews/application/create/ProductReviewCreator";
import { LabelProductReviewOnProductReviewPublished } from "@/contexts/backend/reviews/application/label/LabelProductReviewOnProductReviewPublished";
import { ProductReviewLabeler } from "@/contexts/backend/reviews/application/label/ProductReviewLabeler";
import { AllProductReviewsSearcher } from "@/contexts/backend/reviews/application/search-all/AllProductReviewsSearcher";
import { ProductReviewValidator } from "@/contexts/backend/reviews/application/validate/ProductReviewValidator";
import { ValidateProductReviewOnProductReviewCreated } from "@/contexts/backend/reviews/application/validate/ValidateProductReviewOnProductReviewCreated";
import { EvaluationModelProductReviewLabelDetector } from "@/contexts/backend/reviews/infrastructure/EvaluationModelProductReviewLabelDetector";
import { EvaluationModelProductReviewSpamDetector } from "@/contexts/backend/reviews/infrastructure/EvaluationModelProductReviewSpamDetector";
import { PostgresProductReviewRepository } from "@/contexts/backend/reviews/infrastructure/PostgresProductReviewRepository";
import { CurrentUserGetter } from "@/contexts/backend/users/application/current/CurrentUserGetter";
import type { CurrentUserProvider } from "@/contexts/backend/users/domain/CurrentUserProvider";
import { FakeSessionCurrentUserProvider } from "@/contexts/backend/users/infrastructure/FakeSessionCurrentUserProvider";
import { PostgresUserRepository } from "@/contexts/backend/users/infrastructure/PostgresUserRepository";
import type { DomainEvent } from "@/contexts/shared/domain/event/DomainEvent";
import type { DomainEventSubscriber } from "@/contexts/shared/domain/event/DomainEventSubscriber";

import { InMemoryEventBus } from "./event-bus/InMemoryEventBus";
import { PostgresConnection } from "./PostgresConnection";
import { SystemClock } from "./SystemClock";

class RetailContainer {
	private readonly connection = new PostgresConnection();

	private readonly productRepository = new PostgresProductRepository(
		this.connection,
	);

	private readonly orderRepository = new PostgresOrderRepository(
		this.connection,
	);

	private readonly checkoutRepository = new PostgresCheckoutRepository(
		this.connection,
	);

	private readonly userRepository = new PostgresUserRepository(
		this.connection,
	);

	private readonly productReviewRepository =
		new PostgresProductReviewRepository(this.connection);

	private readonly currentUserProviderInstance =
		new FakeSessionCurrentUserProvider();

	private readonly clock = new SystemClock();

	private readonly evaluationModel = createGateway({
		apiKey: process.env.VERCEL_AI_GATEWAY_API_KEY,
	}).evaluationModel("typesafe-ai/jev");

	private readonly domainEventSubscribers: DomainEventSubscriber<DomainEvent>[] =
		[];

	private readonly eventBus = new InMemoryEventBus(
		this.domainEventSubscribers,
	);

	constructor() {
		this.domainEventSubscribers.push(
			new ValidateProductReviewOnProductReviewCreated(
				new ProductReviewValidator(
					this.productReviewRepository,
					new EvaluationModelProductReviewSpamDetector(
						this.evaluationModel,
					),
					this.eventBus,
				),
			),
			new LabelProductReviewOnProductReviewPublished(
				new ProductReviewLabeler(
					this.productReviewRepository,
					new EvaluationModelProductReviewLabelDetector(
						this.evaluationModel,
					),
				),
			),
		);
	}

	get productsSearcher(): ProductsSearcher {
		return new ProductsSearcher(this.productRepository);
	}

	get productFinder(): ProductFinder {
		return new ProductFinder(this.productRepository);
	}

	get categoriesLister(): CategoriesLister {
		return new CategoriesLister(this.productRepository);
	}

	get inventoryLister(): InventoryLister {
		return new InventoryLister(this.productRepository);
	}

	get lowStockLister(): LowStockLister {
		return new LowStockLister(this.productRepository);
	}

	get orderPlacer(): OrderPlacer {
		return new OrderPlacer(this.orderRepository);
	}

	get ordersLister(): OrdersLister {
		return new OrdersLister(this.orderRepository, this.userRepository);
	}

	get userOrdersLister(): UserOrdersLister {
		return new UserOrdersLister(
			this.orderRepository,
			this.currentUserProviderInstance,
		);
	}

	get orderFinder(): OrderFinder {
		return new OrderFinder(
			this.orderRepository,
			this.productRepository,
			this.userRepository,
		);
	}

	get cartVariantAdder(): CartVariantAdder {
		return new CartVariantAdder(
			this.checkoutRepository,
			this.productRepository,
			this.currentUserProviderInstance,
		);
	}

	get cartVariantRemover(): CartVariantRemover {
		return new CartVariantRemover(
			this.checkoutRepository,
			this.currentUserProviderInstance,
		);
	}

	get cartItemCounter(): CartItemCounter {
		return new CartItemCounter(
			this.checkoutRepository,
			this.currentUserProviderInstance,
		);
	}

	get checkoutViewGetter(): CheckoutViewGetter {
		return new CheckoutViewGetter(
			this.checkoutRepository,
			this.productRepository,
			this.currentUserProviderInstance,
		);
	}

	get checkoutConfirmer(): CheckoutConfirmer {
		return new CheckoutConfirmer(
			this.checkoutRepository,
			this.productRepository,
			this.orderPlacer,
			this.currentUserProviderInstance,
		);
	}

	get productReviewCreator(): ProductReviewCreator {
		return new ProductReviewCreator(
			this.productReviewRepository,
			this.clock,
			this.eventBus,
		);
	}

	get allProductReviewsSearcher(): AllProductReviewsSearcher {
		return new AllProductReviewsSearcher(
			this.productReviewRepository,
			this.userRepository,
			this.currentUserProviderInstance,
		);
	}

	get currentUserGetter(): CurrentUserGetter {
		return new CurrentUserGetter(
			this.currentUserProviderInstance,
			this.userRepository,
		);
	}

	get currentUserProvider(): CurrentUserProvider {
		return this.currentUserProviderInstance;
	}
}

export const retailContainer = new RetailContainer();
