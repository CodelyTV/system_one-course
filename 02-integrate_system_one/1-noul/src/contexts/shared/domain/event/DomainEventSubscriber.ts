import type { DomainEvent, DomainEventClass } from "./DomainEvent";

export interface DomainEventSubscriber<T extends DomainEvent> {
	subscribedTo(): DomainEventClass[];

	on(event: T): Promise<void>;
}
