import type { CurrentUserProvider } from "../../domain/CurrentUserProvider";
import type { UserRepository } from "../../domain/UserRepository";

export type CurrentUserResponse = {
	id: string;
	name: string;
	email: string;
};

export class CurrentUserGetter {
	constructor(
		private readonly currentUserProvider: CurrentUserProvider,
		private readonly userRepository: UserRepository,
	) {}

	async get(): Promise<CurrentUserResponse> {
		const userId = await this.currentUserProvider.currentUserId();
		const user = await this.userRepository.search(userId);

		if (!user) {
			throw new Error(`Current user ${userId.value} not found`);
		}

		return user.toPrimitives();
	}
}
