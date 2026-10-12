import type { Order } from "./Order";
import type { OrderId } from "./OrderId";

export abstract class OrderRepository {
	abstract save(order: Order): Promise<void>;

	abstract searchAll(): Promise<Order[]>;

	abstract search(id: OrderId): Promise<Order | null>;

	abstract searchByUser(userId: string): Promise<Order[]>;
}
