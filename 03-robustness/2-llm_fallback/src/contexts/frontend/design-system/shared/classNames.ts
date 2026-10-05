type ClassNameProp = string | { [key: string]: boolean } | undefined;

export const classNames = (...classNames: ClassNameProp[]): string => {
	const resultClasses: string[] = [];

	classNames.forEach((className) => {
		if (className === undefined) {
			return;
		}

		if (typeof className === "string") {
			resultClasses.push(className);

			return;
		}

		Object.keys(className).forEach((key) => {
			if (className[key]) {
				resultClasses.push(key);
			}
		});
	});

	return resultClasses.join(" ");
};
