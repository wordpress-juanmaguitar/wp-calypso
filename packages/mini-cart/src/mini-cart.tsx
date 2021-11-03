import { CheckoutProvider, Button } from '@automattic/composite-checkout';
import { useShoppingCart } from '@automattic/shopping-cart';
import { useTranslate } from 'i18n-calypso';
import { MiniCartLineItems } from './mini-cart-line-items';
import type { ResponseCart } from '@automattic/shopping-cart';

import './mini-cart-style.scss';

function MiniCartTotal( { responseCart }: { responseCart: ResponseCart } ) {
	const translate = useTranslate();
	return (
		<div className="mini-cart__total">
			<span>{ translate( 'Total' ) }</span>
			<span>{ responseCart.total_cost_display }</span>
		</div>
	);
}

export function MiniCart( {
	selectedSiteSlug,
	goToCheckout,
}: {
	selectedSiteSlug: string;
	goToCheckout: ( siteSlug: string ) => void;
} ): JSX.Element {
	const {
		responseCart,
		removeCoupon,
		removeProductFromCart,
		isLoading,
		isPendingUpdate,
	} = useShoppingCart( selectedSiteSlug );
	const translate = useTranslate();
	const isDisabled = isLoading || isPendingUpdate;
	const isPwpoUser = false; // TODO: deal with this properly

	return (
		<CheckoutProvider paymentMethods={ [] } paymentProcessors={ {} }>
			<div className="mini-cart">
				<div className="mini-cart__header">
					<h2 className="mini-cart__title">{ translate( 'Cart' ) }</h2>
					<span className="mini-cart__site-title">
						{ translate( 'Site: %s', {
							args: selectedSiteSlug,
						} ) }
					</span>
				</div>
				<MiniCartLineItems
					removeCoupon={ removeCoupon }
					removeProductFromCart={ removeProductFromCart }
					responseCart={ responseCart }
					isPwpoUser={ isPwpoUser }
				/>
				<MiniCartTotal responseCart={ responseCart } />
				<div className="mini-cart__footer">
					<Button
						className="mini-cart__checkout"
						buttonType={ 'primary' }
						fullWidth
						disabled={ isDisabled }
						isBusy={ isDisabled }
						onClick={ () => goToCheckout( selectedSiteSlug ) }
					>
						{ translate( 'Checkout' ) }
					</Button>
				</div>
			</div>
		</CheckoutProvider>
	);
}
