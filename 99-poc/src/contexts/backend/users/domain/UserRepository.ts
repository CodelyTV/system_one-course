import type { User } from "./User";
import type { UserId } from "./UserId";

export abstract class UserRepository {
	abstract search(id: UserId): Promise<User | null>;

	abstract searchAll(): Promise<User[]>;
}
