import { useShoppingCart } from '@automattic/shopping-cart';
import { useTranslate } from 'i18n-calypso';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hasStaleItem } from 'calypso/lib/cart-values/cart-items';
import useCartKey from 'calypso/my-sites/checkout/use-cart-key';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { infoNotice, removeNotice } from 'calypso/state/notices/actions';
import { getNoticeLastTimeShown } from 'calypso/state/notices/selectors';
import { getSectionName, getSelectedSiteSlug } from 'calypso/state/ui/selectors';

const staleCartItemNoticeId = 'stale-cart-item-notice';

export default function StaleCartItemsNotice() {
	useShowStaleCartNotice();
	return null;
}

function useShowStaleCartNotice() {
	const selectedSiteSlug = useSelector( getSelectedSiteSlug );
	const staleCartItemNoticeLastTimeShown = useSelector( ( state ) =>
		getNoticeLastTimeShown( state, staleCartItemNoticeId )
	);
	const sectionName = useSelector( getSectionName );
	const reduxDispatch = useDispatch();
	const cartKey = useCartKey();
	const { responseCart, isPendingUpdate } = useShoppingCart( cartKey );
	const translate = useTranslate();

	useEffect( () => {
		// Don't show on the checkout page?
		if ( sectionName === 'upgrades' ) {
			// Remove any existing stale cart notice
			reduxDispatch( removeNotice( staleCartItemNoticeId ) );
			return;
		}

		// Show a notice if there are stale items in the cart and it hasn't been shown
		// in the last 10 minutes (cart abandonment)
		if (
			selectedSiteSlug &&
			hasStaleItem( responseCart ) &&
			staleCartItemNoticeLastTimeShown < Date.now() - 10 * 60 * 1000 &&
			! isPendingUpdate
		) {
			reduxDispatch( recordTracksEvent( 'calypso_cart_abandonment_notice_view' ) );

			// Remove any existing stale cart notice
			reduxDispatch( removeNotice( staleCartItemNoticeId ) );

			reduxDispatch(
				infoNotice( translate( 'Your cart is awaiting payment.' ), {
					id: staleCartItemNoticeId,
					button: translate( 'View your cart' ),
					href: `/checkout/${ selectedSiteSlug }`,
					onClick: () => {
						reduxDispatch( recordTracksEvent( 'calypso_cart_abandonment_notice_click' ) );
					},
				} )
			);
		}
	}, [
		isPendingUpdate,
		sectionName,
		selectedSiteSlug,
		responseCart,
		reduxDispatch,
		translate,
		staleCartItemNoticeLastTimeShown,
	] );
}
