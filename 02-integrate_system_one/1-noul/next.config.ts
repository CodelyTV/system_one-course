import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	turbopack: {
		// Pin this app as the Turbopack root so stray lockfiles above it
		// (e.g. in the student's home dir) don't skew root inference.
		root: __dirname,
		rules: {
			"*.svg": {
				loaders: [
					{
						loader: "@svgr/webpack",
						options: { svgo: false, dimensions: false },
					},
				],
				as: "*.js",
			},
		},
	},
};

export default nextConfig;
