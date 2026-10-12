import { ProductReviewImageTooLargeError } from "./errors/ProductReviewImageTooLargeError";
import { UnsupportedProductReviewImageTypeError } from "./errors/UnsupportedProductReviewImageTypeError";

export type ProductReviewImagePrimitives = {
	mediaType: string;
	data: string;
};

export class ProductReviewImage {
	static readonly supportedMediaTypes = [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
	];

	static readonly maxSizeInBytes = 2 * 1024 * 1024;

	constructor(
		readonly mediaType: string,
		readonly data: string,
	) {
		if (!ProductReviewImage.supportedMediaTypes.includes(mediaType)) {
			throw new UnsupportedProductReviewImageTypeError(
				ProductReviewImage.supportedMediaTypes,
			);
		}

		if (
			Buffer.byteLength(data, "base64") >
			ProductReviewImage.maxSizeInBytes
		) {
			throw new ProductReviewImageTooLargeError(
				ProductReviewImage.maxSizeInBytes,
			);
		}
	}

	static fromPrimitives(
		primitives: ProductReviewImagePrimitives,
	): ProductReviewImage {
		return new ProductReviewImage(primitives.mediaType, primitives.data);
	}

	toDataUrl(): string {
		return `data:${this.mediaType};base64,${this.data}`;
	}

	toPrimitives(): ProductReviewImagePrimitives {
		return { mediaType: this.mediaType, data: this.data };
	}
}
