import type { DomainEvent } from "@/contexts/shared/domain/event/DomainEvent";
import type { DomainEventSubscriber } from "@/contexts/shared/domain/event/DomainEventSubscriber";
import { EventBus } from "@/contexts/shared/domain/event/EventBus";

export class InMemoryEventBus extends EventBus {
	constructor(
		private readonly subscribers: DomainEventSubscriber<DomainEvent>[],
	) {
		super();
	}

	async publish(events: DomainEvent[]): Promise<void> {
		for (const event of events) {
			const interestedSubscribers = this.subscribers.filter(
				(subscriber) =>
					subscriber
						.subscribedTo()
						.some(
							(eventClass) =>
								eventClass.eventName === event.eventName,
						),
			);

			// eslint-disable-next-line no-await-in-loop
			await Promise.all(
				interestedSubscribers.map((subscriber) => subscriber.on(event)),
			);
		}
	}
}
