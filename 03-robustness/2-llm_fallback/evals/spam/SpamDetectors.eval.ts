import { createGateway } from "ai";
import { describe, it } from "vitest";

import { ProductReview } from "@/contexts/backend/reviews/domain/ProductReview";
import type { ProductReviewSpamDetector } from "@/contexts/backend/reviews/domain/ProductReviewSpamDetector";
import { EvaluationModelProductReviewSpamDetector } from "@/contexts/backend/reviews/infrastructure/EvaluationModelProductReviewSpamDetector";
import { EvaluationModelWithFallbackProductReviewSpamDetector } from "@/contexts/backend/reviews/infrastructure/EvaluationModelWithFallbackProductReviewSpamDetector";
import { LlmProductReviewSpamDetector } from "@/contexts/backend/reviews/infrastructure/LlmProductReviewSpamDetector";
import { RuleBasedProductReviewSpamDetector } from "@/contexts/backend/reviews/infrastructure/RuleBasedProductReviewSpamDetector";

import { type SpamCase, spamCases } from "./spamCases";

type Prediction = {
	spamCase: SpamCase;
	isSpam: boolean;
	milliseconds: number;
	dollars: number;
	confidence: number | null;
	calledLanguageModel: boolean;
};

type GatewayResponse = {
	dollars: number;
	spamProbability: number | null;
	isLanguageModel: boolean;
};

const gatewayResponses: GatewayResponse[] = [];

const gateway = createGateway({
	apiKey: process.env.VERCEL_AI_GATEWAY_API_KEY,
	fetch: async (input, init) => {
		const response = await fetch(input, init);
		const body = await response.clone().json();

		gatewayResponses.push({
			dollars: Number(body.providerMetadata?.gateway?.cost ?? 0),
			spamProbability: body.answers?.isSpam?.probability ?? null,
			isLanguageModel: String(input).endsWith("/language-model"),
		});

		return response;
	},
});

const evaluationModel = gateway.evaluationModel("typesafe-ai/jev");
const lunaLanguageModel = gateway.languageModel("openai/gpt-6-luna");
const terraLanguageModel = gateway.languageModel("openai/gpt-5.6-terra");

const detectors: Record<string, ProductReviewSpamDetector> = {
	"Rule based": new RuleBasedProductReviewSpamDetector(),
	"System One (typesafe-ai/jev)":
		new EvaluationModelProductReviewSpamDetector(evaluationModel),
	"LLM (openai/gpt-6-luna)": new LlmProductReviewSpamDetector(lunaLanguageModel),
	"LLM (openai/gpt-5.6-terra)": new LlmProductReviewSpamDetector(terraLanguageModel),
	"System One + LLM fallback":
		new EvaluationModelWithFallbackProductReviewSpamDetector(
			evaluationModel,
			new LlmProductReviewSpamDetector(lunaLanguageModel),
		),
};

type Summary = {
	accuracy: string;
	"p50 (ms)": number;
	"p95 (ms)": number;
	"cost / 1k reviews": string;
	"LLM calls": string;
};

async function predict(
	detector: ProductReviewSpamDetector,
	spamCase: SpamCase,
): Promise<Prediction> {
	const firstResponse = gatewayResponses.length;
	const start = performance.now();
	const isSpam = await detector.isSpam(
		ProductReview.fromPrimitives({
			id: "review-eval",
			productId: "product-eval",
			userId: "user-eval",
			rating: spamCase.rating,
			comment: spamCase.comment,
			status: "pending-validation",
			label: null,
			createdAt: new Date().toISOString(),
		}),
	);
	const responses = gatewayResponses.slice(firstResponse);
	const spamProbability = responses.at(-1)?.spamProbability ?? null;

	return {
		spamCase,
		isSpam,
		milliseconds: performance.now() - start,
		dollars: responses.reduce((total, r) => total + r.dollars, 0),
		confidence:
			spamProbability === null
				? null
				: isSpam
					? spamProbability
					: 1 - spamProbability,
		calledLanguageModel: responses.some((r) => r.isLanguageModel),
	};
}

function percentile(values: number[], percentage: number): number {
	const sorted = [...values].sort((a, b) => a - b);

	return sorted[Math.ceil((percentage / 100) * sorted.length) - 1];
}

function ratio(numerator: number, denominator: number): string {
	return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function summarize(predictions: Prediction[]): Summary {
	const hits = predictions.filter(
		(p) => p.isSpam === p.spamCase.isSpam,
	).length;
	const latencies = predictions.map((p) => p.milliseconds);
	const dollars = predictions.reduce((total, p) => total + p.dollars, 0);
	const languageModelCalls = predictions.filter(
		(p) => p.calledLanguageModel,
	).length;

	return {
		accuracy: ratio(hits, predictions.length),
		"p50 (ms)": Math.round(percentile(latencies, 50)),
		"p95 (ms)": Math.round(percentile(latencies, 95)),
		"cost / 1k reviews": `$${((dollars / predictions.length) * 1000).toFixed(4)}`,
		"LLM calls": ratio(languageModelCalls, predictions.length),
	};
}

function printResults(predictionsByDetector: Map<string, Prediction[]>): void {
	console.table(
		Object.fromEntries(
			[...predictionsByDetector].map(([name, predictions]) => [
				name,
				summarize(predictions),
			]),
		),
	);

	for (const [name, predictions] of predictionsByDetector) {
		const failures = predictions.filter(
			(p) => p.isSpam !== p.spamCase.isSpam,
		);

		console.log(`\n❌ ${name}: ${failures.length} failures`);

		for (const { spamCase, confidence } of failures) {
			console.log(
				`  [expected ${spamCase.isSpam ? "spam" : "not spam"}, confidence ${confidence === null ? "n/a" : ratio(confidence, 1)}] ${spamCase.comment}`,
			);
		}
	}
}

describe("Spam detectors eval", () => {
	it("compares the spam detectors", async () => {
		const predictionsByDetector = new Map<string, Prediction[]>();

		for (const [name, detector] of Object.entries(detectors)) {
			const predictions: Prediction[] = [];

			for (const spamCase of spamCases) {
				predictions.push(await predict(detector, spamCase));
			}

			predictionsByDetector.set(name, predictions);
		}

		printResults(predictionsByDetector);
	});
});
