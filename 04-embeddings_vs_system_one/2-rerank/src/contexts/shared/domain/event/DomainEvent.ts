import { randomUUID } from "node:crypto";

export type DomainEventPrimitives = Record<string, unknown>;

export type DomainEventClass = {
	eventName: string;
};

export abstract class DomainEvent {
	readonly eventId: string;
	readonly occurredOn: string;

	protected constructor(
		readonly eventName: string,
		readonly aggregateId: string,
		eventId?: string,
		occurredOn?: string,
	) {
		this.eventId = eventId ?? randomUUID();
		this.occurredOn = occurredOn ?? new Date().toISOString();
	}

	abstract toPrimitives(): DomainEventPrimitives;
}
