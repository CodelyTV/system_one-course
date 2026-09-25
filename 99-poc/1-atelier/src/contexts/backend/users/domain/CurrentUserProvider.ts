import type { UserId } from "./UserId";

export abstract class CurrentUserProvider {
	abstract currentUserId(): Promise<UserId>;
}
