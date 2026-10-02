import { describe, expect, it } from "vitest";

import { InMemoryEventBus } from "@/contexts/backend/shared/infrastructure/event-bus/InMemoryEventBus";
import {
	DomainEvent,
	type DomainEventClass,
	type DomainEventPrimitives,
} from "@/contexts/shared/domain/event/DomainEvent";
import type { DomainEventSubscriber } from "@/contexts/shared/domain/event/DomainEventSubscriber";

class SomethingHappenedDomainEvent extends DomainEvent {
	static readonly eventName = "codely.test.something.happened";

	constructor(aggregateId: string) {
		super(SomethingHappenedDomainEvent.eventName, aggregateId);
	}

	toPrimitives(): DomainEventPrimitives {
		return {};
	}
}

class SomethingElseHappenedDomainEvent extends DomainEvent {
	static readonly eventName = "codely.test.something_else.happened";

	constructor(aggregateId: string) {
		super(SomethingElseHappenedDomainEvent.eventName, aggregateId);
	}

	toPrimitives(): DomainEventPrimitives {
		return {};
	}
}

class RecordingSubscriber implements DomainEventSubscriber<DomainEvent> {
	readonly received: string[] = [];

	constructor(private readonly eventClass: DomainEventClass) {}

	subscribedTo(): DomainEventClass[] {
		return [this.eventClass];
	}

	async on(event: DomainEvent): Promise<void> {
		this.received.push(event.aggregateId);
	}
}

describe("InMemoryEventBus should", () => {
	it("deliver each event only to the subscribers of its name", async () => {
		const somethingSubscriber = new RecordingSubscriber(
			SomethingHappenedDomainEvent,
		);
		const somethingElseSubscriber = new RecordingSubscriber(
			SomethingElseHappenedDomainEvent,
		);
		const eventBus = new InMemoryEventBus([
			somethingSubscriber,
			somethingElseSubscriber,
		]);

		await eventBus.publish([
			new SomethingHappenedDomainEvent("a1"),
			new SomethingHappenedDomainEvent("a2"),
		]);

		expect(somethingSubscriber.received).toEqual(["a1", "a2"]);
		expect(somethingElseSubscriber.received).toEqual([]);
	});
});
