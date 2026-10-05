import type { DomainEvent } from "./event/DomainEvent";

export abstract class AggregateRoot {
	private domainEvents: DomainEvent[] = [];

	pullDomainEvents(): DomainEvent[] {
		const events = this.domainEvents;

		this.domainEvents = [];

		return events;
	}

	protected record(event: DomainEvent): void {
		this.domainEvents.push(event);
	}
}
