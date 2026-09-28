import { DomainError } from "../../../shared/domain/DomainError";

export class UserDoesNotExistError extends DomainError {
	readonly type = `UserDoesNotExistError`;
	readonly message: string;

	constructor(public readonly value: string) {
		super();
		this.message = `The user ${value} does not exist`;
	}
}
