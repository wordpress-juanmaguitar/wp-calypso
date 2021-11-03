import { CheckoutProvider, Button } from '@automattic/composite-checkout';
import { useShoppingCart } from '@automattic/shopping-cart';
import styled from '@emotion/styled';
import { useTranslate } from 'i18n-calypso';
import { MiniCartLineItems } from './mini-cart-line-items';
import type { ResponseCart } from '@automattic/shopping-cart';

const MiniCartWrapper = styled.div`
	box-sizing: border-box;
	padding: 16px;
	max-width: 480px;
	text-align: left;
	font-size: 1rem;
`;

const MiniCartHeader = styled.div`
	text-align: left;
`;

const MiniCartTitle = styled.h2`
	font-weight: 600;
`;

const MiniCartSiteTitle = styled.span`
	color: var( --color-neutral-50 );
	font-size: 0.875rem;
`;

const MiniCartFooter = styled.div`
	margin-top: 12px;
`;

const MiniCartTotalWrapper = styled.div`
	font-weight: 600;
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	margin-bottom: 4px;
`;

function MiniCartTotal( { responseCart }: { responseCart: ResponseCart } ) {
	const translate = useTranslate();
	return (
		<MiniCartTotalWrapper className="mini-cart__total">
			<span>{ translate( 'Total' ) }</span>
			<span>{ responseCart.total_cost_display }</span>
		</MiniCartTotalWrapper>
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
			<MiniCartWrapper className="mini-cart">
				<MiniCartHeader className="mini-cart__header">
					<MiniCartTitle className="mini-cart__title">{ translate( 'Cart' ) }</MiniCartTitle>
					<MiniCartSiteTitle className="mini-cart__site-title">
						{ translate( 'Site: %s', {
							args: selectedSiteSlug,
						} ) }
					</MiniCartSiteTitle>
				</MiniCartHeader>
				<MiniCartLineItems
					removeCoupon={ removeCoupon }
					removeProductFromCart={ removeProductFromCart }
					responseCart={ responseCart }
					isPwpoUser={ isPwpoUser }
				/>
				<MiniCartTotal responseCart={ responseCart } />
				<MiniCartFooter className="mini-cart__footer">
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
				</MiniCartFooter>
			</MiniCartWrapper>
		</CheckoutProvider>
	);
}
