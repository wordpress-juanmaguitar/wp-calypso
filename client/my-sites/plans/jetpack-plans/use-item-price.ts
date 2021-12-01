import config from '@automattic/calypso-config';
import {
	TERM_MONTHLY,
	PRODUCT_JETPACK_CRM,
	PRODUCT_JETPACK_CRM_MONTHLY,
} from '@automattic/calypso-products';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { INTRO_PRICING_DISCOUNT_PERCENTAGE } from 'calypso/my-sites/plans/jetpack-plans/constants';
import { getJetpackSaleCouponDiscountRatio } from 'calypso/state/marketing/selectors';
import { getProductCost } from 'calypso/state/products-list/selectors/get-product-cost';
import { getProductIntroductoryOffer } from 'calypso/state/products-list/selectors/get-product-introductory-offer';
import { getProductPriceTierList } from 'calypso/state/products-list/selectors/get-product-price-tiers';
import { isProductsListFetching } from 'calypso/state/products-list/selectors/is-products-list-fetching';
import {
	getSiteAvailableProductCost,
	isRequestingSiteProducts,
} from 'calypso/state/sites/products/selectors';
import type { SelectorProduct } from './types';
import type { PriceTierEntry, IntroductoryOffer } from '@automattic/calypso-products';

interface ItemPrices {
	isFetching: boolean | null;
	originalPrice: number;
	discountedPrice?: number;
	priceTierList: PriceTierEntry[];
}

interface ItemRawPrices {
	isFetching: boolean | null;
	itemCost: number | null;
	monthlyItemCost: number | null;
	priceTierList: PriceTierEntry[];
	introductoryOffer: IntroductoryOffer | null;
}

const useProductListItemPrices = (
	item: SelectorProduct | null,
	monthlyItemSlug = ''
): ItemRawPrices => {
	const isFetching = useSelector( ( state ) => !! isProductsListFetching( state ) );
	const productSlug = item?.costProductSlug || item?.productSlug;
	const itemCost =
		useSelector( ( state ) => productSlug && getProductCost( state, productSlug ) ) || null;
	const monthlyItemCost =
		useSelector( ( state ) => getProductCost( state, monthlyItemSlug ) ) || null;
	const priceTierList = useSelector( ( state ) =>
		productSlug ? getProductPriceTierList( state, productSlug ) : []
	);
	const introductoryOffer = useSelector( ( state ) =>
		productSlug ? getProductIntroductoryOffer( state, productSlug ) : null
	);

	return {
		isFetching,
		itemCost,
		monthlyItemCost,
		priceTierList,
		introductoryOffer,
	};
};

const useSiteAvailableProductPrices = (
	siteId: number | null,
	item: SelectorProduct | null,
	monthlyItemSlug = ''
): ItemRawPrices => {
	const isFetching =
		useSelector( ( state ) => siteId && !! isRequestingSiteProducts( state, siteId ) ) || null;
	const productSlug = item?.costProductSlug || item?.productSlug;
	const itemCost =
		useSelector(
			( state ) =>
				siteId && productSlug && getSiteAvailableProductCost( state, siteId, productSlug )
		) || null;
	const monthlyItemCost =
		useSelector(
			( state ) => siteId && getSiteAvailableProductCost( state, siteId, monthlyItemSlug )
		) || null;
	const priceTierList = useSelector( ( state ) =>
		productSlug ? getProductPriceTierList( state, productSlug ) : []
	);

	return {
		isFetching,
		itemCost,
		monthlyItemCost,
		priceTierList,
		introductoryOffer: null,
	};
};

const introOfferToMonthlyDiscount = ( introOffer: IntroductoryOffer ): number | null => {
	switch ( introOffer.interval ) {
		case 'year':
			return introOffer.costPerInterval / 12;
		case 'month':
			return introOffer.costPerInterval;
		default:
			// this doesn't make sense otherwise
			return null;
	}
};

const useItemPrice = (
	siteId: number | null,
	item: SelectorProduct | null,
	monthlyItemSlug = ''
): ItemPrices => {
	const listPrices = useProductListItemPrices( item, monthlyItemSlug );
	const sitePrices = useSiteAvailableProductPrices( siteId, item, monthlyItemSlug );
	const jetpackSaleDiscountRatio = useSelector( getJetpackSaleCouponDiscountRatio );

	const isFetching = siteId ? sitePrices.isFetching : listPrices.isFetching;
	const itemCost = siteId ? sitePrices.itemCost : listPrices.itemCost;
	const monthlyItemCost = siteId ? sitePrices.monthlyItemCost : listPrices.monthlyItemCost;
	const introductoryOffer = siteId ? null : listPrices.introductoryOffer;

	const useCouponIntroductoryOffer = config.isEnabled( 'jetpack/intro-offer-coupon' );

	// const DISCOUNT_PERCENTAGE =
	// 	billingTerm === TERM_ANNUALLY && jetpackSaleDiscountRatio
	// 		? 1 - jetpackSaleDiscountRatio
	// 		: 1 - INTRO_PRICING_DISCOUNT_PERCENTAGE / 100;

	// const couponOriginalPrice = parseFloat( ( discountedPrice ?? originalPrice ).toFixed( 2 ) );
	// const couponDiscountedPrice = parseFloat(
	// 	( ( discountedPrice ?? originalPrice ) * DISCOUNT_PERCENTAGE ).toFixed( 2 )
	// );

	const priceTierList = useMemo(
		() => ( siteId ? sitePrices.priceTierList : listPrices.priceTierList ),
		[ siteId, sitePrices.priceTierList, listPrices.priceTierList ]
	);

	if ( isFetching ) {
		return {
			isFetching,
			originalPrice: 0,
			priceTierList: [],
		};
	}
	console.log( item?.productSlug );
	let originalPrice = 0;
	let discountedPrice = undefined;
	if ( item && itemCost ) {
		originalPrice = itemCost;
		if ( useCouponIntroductoryOffer ) {
			discountedPrice = itemCost * ( 1 - INTRO_PRICING_DISCOUNT_PERCENTAGE / 100 );
			console.log( `useCouponIntroductoryOffer - ${ discountedPrice }` );
		}
		if ( jetpackSaleDiscountRatio ) {
			discountedPrice = itemCost * ( 1 - jetpackSaleDiscountRatio );
			console.log( `jetpackSaleDiscountRatio - ${ discountedPrice }` );
		}
		if ( introductoryOffer ) {
			discountedPrice = introOfferToMonthlyDiscount( introductoryOffer ) ?? originalPrice;
			console.log( `introductoryOffer - ${ discountedPrice }` );
		}
		if ( monthlyItemCost && item.term !== TERM_MONTHLY ) {
			discountedPrice = ( discountedPrice ?? originalPrice ) / 12;
			console.log( `monthlyItemCost - ${ discountedPrice }` );
			originalPrice = monthlyItemCost;
		}
	}

	// Jetpack CRM price won't come from the API, so we need to hard-code it for now.
	if ( item && [ PRODUCT_JETPACK_CRM, PRODUCT_JETPACK_CRM_MONTHLY ].includes( item.productSlug ) ) {
		discountedPrice = item.displayPrice || -1;
		originalPrice = item.displayPrice || -1;
	}

	return {
		isFetching,
		originalPrice,
		discountedPrice,
		priceTierList,
	};
};

export default useItemPrice;
