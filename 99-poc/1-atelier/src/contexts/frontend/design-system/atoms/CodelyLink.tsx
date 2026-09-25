"use client";

import NextLink from "next/link";
import React from "react";

export type CodelyLinkProps = React.ComponentProps<typeof NextLink> & {
	component?: React.ElementType;
};

export const CodelyLink: React.FC<CodelyLinkProps> = ({
	component: LinkComponent = NextLink,
	onClick,
	target,
	rel,
	...props
}) => {
	// This Link made sense when we had to patch the native Next.js Link component to fix the navigation issue on macOS.
	// We prefer to still use it just as a way to easily modify the default behavior of the Link component.
	const defaultRel =
		target === "_blank" && !rel ? "noopener noreferrer" : rel;
	const finalProps = { ...props, target, rel: defaultRel };

	return <LinkComponent {...finalProps} onClick={onClick} />;
};
