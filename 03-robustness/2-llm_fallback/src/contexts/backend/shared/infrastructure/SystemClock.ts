import { Clock } from "@/contexts/shared/domain/Clock";

export class SystemClock extends Clock {
	now(): string {
		return new Date().toISOString();
	}
}
