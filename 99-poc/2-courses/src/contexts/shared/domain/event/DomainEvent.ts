export type DomainEventAttributes = { [key: string]: unknown };

export abstract class DomainEvent {
	public readonly eventId: string;
	public readonly occurredOn: Date;

	protected constructor(
		public readonly eventName: string,
		public readonly aggregateId: string,
		eventId?: string,
		occurredOn?: Date,
	) {
		this.eventId = eventId ?? crypto.randomUUID();
		this.occurredOn = occurredOn ?? new Date();
	}

	// eslint-disable-next-line @typescript-eslint/member-ordering
	static fromPrimitives: (
		aggregateId: string,
		eventId: string,
		occurredOn: Date,
		attributes: DomainEventAttributes,
	) => DomainEvent;

	abstract toPrimitives(): DomainEventAttributes;
}
