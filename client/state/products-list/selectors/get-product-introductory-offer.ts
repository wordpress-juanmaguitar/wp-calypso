import { getProductBySlug } from './get-product-by-slug';
import type { IntroductoryOffer } from '@automattic/calypso-products';
import type { AppState } from 'calypso/types';
import 'calypso/state/products-list/init';

type Product = {
	introductory_offer?: {
		interval_unit: 'year' | 'month' | 'week' | 'day';
		interval_count: number;
		usage_limit: number | null;
		cost_per_interval: number;
		transition_after_renewal_count: number;
		should_prorate_when_offer_ends: boolean;
	};
};

/**
 * Returns the introductory offer of the specified product, or null if it does not exist
 *
 * @param {object} state - global state tree
 * @param {string} productSlug - internal product slug, eg 'jetpack_premium'
 * @returns {IntroductoryOffer} The price tiers.
 */
export function getProductIntroductoryOffer(
	state: AppState,
	productSlug: string
): IntroductoryOffer | null {
	const product = getProductBySlug( state, productSlug ) as Product;

	if ( ! product || ! product.introductory_offer ) {
		return null;
	}

	return {
		interval: product.introductory_offer.interval_unit,
		intervalCount: product.introductory_offer.interval_count,
		costPerInterval: product.introductory_offer.cost_per_interval,
	};
}
