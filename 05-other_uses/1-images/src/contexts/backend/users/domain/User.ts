import { UserId } from "./UserId";

export type UserPrimitives = {
	id: string;
	name: string;
	email: string;
};

export class User {
	constructor(
		readonly id: UserId,
		readonly name: string,
		readonly email: string,
	) {}

	static fromPrimitives(primitives: UserPrimitives): User {
		return new User(
			new UserId(primitives.id),
			primitives.name,
			primitives.email,
		);
	}

	toPrimitives(): UserPrimitives {
		return { id: this.id.value, name: this.name, email: this.email };
	}
}
