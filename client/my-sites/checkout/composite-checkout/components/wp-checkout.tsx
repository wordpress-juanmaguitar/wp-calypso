import { isYearly, isJetpackPurchasableItem, isMonthlyProduct } from '@automattic/calypso-products';
import { Gridicon } from '@automattic/components';
import {
	Checkout,
	CheckoutStep,
	CheckoutStepArea,
	CheckoutSteps,
	CheckoutStepBody,
	CheckoutSummaryArea as CheckoutSummaryAreaUnstyled,
	getDefaultPaymentMethodStep,
	useFormStatus,
	useIsStepActive,
	useIsStepComplete,
	usePaymentMethod,
	useTotal,
	CheckoutErrorBoundary,
} from '@automattic/composite-checkout';
import { useShoppingCart } from '@automattic/shopping-cart';
import { styled, getCountryPostalCodeSupport } from '@automattic/wpcom-checkout';
import { useSelect, useDispatch } from '@wordpress/data';
import { useTranslate } from 'i18n-calypso';
import { useState, useCallback } from 'react';
import { useDispatch as useReduxDispatch } from 'react-redux';
import MaterialIcon from 'calypso/components/material-icon';
import {
	hasGoogleApps,
	hasDomainRegistration,
	hasTransferProduct,
} from 'calypso/lib/cart-values/cart-items';
import { getGoogleMailServiceFamily } from 'calypso/lib/gsuite';
import useCartKey from 'calypso/my-sites/checkout/use-cart-key';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import useCouponFieldState from '../hooks/use-coupon-field-state';
import useUpdateCartLocationWhenPaymentMethodChanges from '../hooks/use-update-cart-location-when-payment-method-changes';
import { validateContactDetails } from '../lib/contact-validation';
import getContactDetailsType from '../lib/get-contact-details-type';
import badge14Src from './assets/icons/badge-14.svg';
import badge7Src from './assets/icons/badge-7.svg';
import badgeGenericSrc from './assets/icons/badge-generic.svg';
import CheckoutHelpLink from './checkout-help-link';
import PaymentMethodStep from './payment-method-step';
import SecondaryCartPromotions from './secondary-cart-promotions';
import WPCheckoutOrderReview from './wp-checkout-order-review';
import WPCheckoutOrderSummary from './wp-checkout-order-summary';
import WPContactForm from './wp-contact-form';
import WPContactFormSummary from './wp-contact-form-summary';
import type { OnChangeItemVariant } from '../components/item-variation-picker';
import type { CheckoutPageErrorCallback } from '@automattic/composite-checkout';
import type { RemoveProductFromCart, MinimalRequestCartProduct } from '@automattic/shopping-cart';
import type { CountryListItem, ManagedContactDetails } from '@automattic/wpcom-checkout';

// This will make converting to TS less noisy. The order of components can be reorganized later
/* eslint-disable @typescript-eslint/no-use-before-define */

const ContactFormTitle = (): JSX.Element => {
	const translate = useTranslate();
	const isActive = useIsStepActive();
	const isComplete = useIsStepComplete();
	const cartKey = useCartKey();
	const { responseCart } = useShoppingCart( cartKey );
	const contactDetailsType = getContactDetailsType( responseCart );

	if ( contactDetailsType === 'domain' ) {
		return (
			<>
				{ ! isActive && isComplete
					? String( translate( 'Contact information' ) )
					: String( translate( 'Enter your contact information' ) ) }
			</>
		);
	}

	if ( contactDetailsType === 'gsuite' ) {
		return (
			<>
				{ ! isActive && isComplete
					? String(
							translate( '%(googleMailService)s account information', {
								args: {
									googleMailService: getGoogleMailServiceFamily(),
								},
								comment: '%(googleMailService)s can be either "G Suite" or "Google Workspace"',
							} )
					  )
					: String(
							translate( 'Enter your %(googleMailService)s account information', {
								args: {
									googleMailService: getGoogleMailServiceFamily(),
								},
								comment: '%(googleMailService)s can be either "G Suite" or "Google Workspace"',
							} )
					  ) }
			</>
		);
	}

	return (
		<>
			{ ! isActive && isComplete
				? String( translate( 'Billing information' ) )
				: String( translate( 'Enter your billing information' ) ) }
		</>
	);
};

const OrderReviewTitle = () => {
	const translate = useTranslate();
	return <>{ String( translate( 'Your order' ) ) }</>;
};

const paymentMethodStep = getDefaultPaymentMethodStep();

export default function WPCheckout( {
	removeProductFromCart,
	changePlanLength,
	siteId,
	siteUrl,
	countriesList,
	addItemToCart,
	showErrorMessageBriefly,
	isLoggedOutCart,
	infoMessage,
	createUserAndSiteBeforeTransaction,
	onPageLoadError,
}: {
	removeProductFromCart: RemoveProductFromCart;
	changePlanLength: OnChangeItemVariant;
	siteId: number | undefined;
	siteUrl: string | undefined;
	countriesList: CountryListItem[];
	addItemToCart: ( item: MinimalRequestCartProduct ) => void;
	showErrorMessageBriefly: ( error: string ) => void;
	isLoggedOutCart: boolean;
	infoMessage?: JSX.Element;
	createUserAndSiteBeforeTransaction: boolean;
	onPageLoadError: CheckoutPageErrorCallback;
} ): JSX.Element {
	const cartKey = useCartKey();
	const {
		responseCart,
		applyCoupon,
		updateLocation,
		isPendingUpdate: isCartPendingUpdate,
	} = useShoppingCart( cartKey );
	const translate = useTranslate();
	const couponFieldStateProps = useCouponFieldState( applyCoupon );
	const total = useTotal();
	const activePaymentMethod = usePaymentMethod();
	const reduxDispatch = useReduxDispatch();

	const areThereDomainProductsInCart =
		hasDomainRegistration( responseCart ) || hasTransferProduct( responseCart );
	const isGSuiteInCart = hasGoogleApps( responseCart );

	const contactDetailsType = getContactDetailsType( responseCart );

	const contactInfo: ManagedContactDetails = useSelect( ( sel ) =>
		sel( 'wpcom-checkout' ).getContactInfo()
	);
	const {
		touchContactFields,
		applyDomainContactValidationResults,
		clearDomainContactErrorMessages,
	} = useDispatch( 'wpcom-checkout' );

	const [
		shouldShowContactDetailsValidationErrors,
		setShouldShowContactDetailsValidationErrors,
	] = useState( false );

	// The "Summary" view is displayed in the sidebar at desktop (wide) widths
	// and before the first step at mobile (smaller) widths. At smaller widths it
	// starts collapsed and can be expanded; at wider widths (as a sidebar) it is
	// always visible. It is not a step and its visibility is managed manually.
	const [ isSummaryVisible, setIsSummaryVisible ] = useState( false );

	const { formStatus } = useFormStatus();

	const arePostalCodesSupported = getCountryPostalCodeSupport(
		countriesList,
		contactInfo.countryCode?.value ?? ''
	);

	const updateCartContactDetails = useCallback( () => {
		// Update tax location in cart
		const nonTaxPaymentMethods = [ 'free-purchase' ];
		if ( ! activePaymentMethod || ! contactInfo ) {
			return;
		}
		if ( nonTaxPaymentMethods.includes( activePaymentMethod.id ) ) {
			// this data is intentionally empty so we do not charge taxes
			updateLocation( {
				countryCode: '',
				postalCode: '',
				subdivisionCode: '',
			} );
		} else {
			// The tax form does not include a subdivisionCode field but the server
			// will sometimes fill in the value on the cart itself so we should not
			// try to update it when the field does not exist.
			const subdivisionCode = contactDetailsType === 'tax' ? undefined : contactInfo.state?.value;
			updateLocation( {
				countryCode: contactInfo.countryCode?.value,
				postalCode: arePostalCodesSupported ? contactInfo.postalCode?.value : '',
				subdivisionCode,
			} );
		}
	}, [
		activePaymentMethod,
		updateLocation,
		contactInfo,
		contactDetailsType,
		arePostalCodesSupported,
	] );

	useUpdateCartLocationWhenPaymentMethodChanges( activePaymentMethod, updateCartContactDetails );

	const onReviewError = useCallback(
		( error ) =>
			onPageLoadError( 'step_load', String( error ), {
				step_id: 'review',
			} ),
		[ onPageLoadError ]
	);

	const onSummaryError = useCallback(
		( error ) =>
			onPageLoadError( 'step_load', String( error ), {
				step_id: 'summary',
			} ),
		[ onPageLoadError ]
	);

	const validatingButtonText = isCartPendingUpdate
		? String( translate( 'Updating cart…' ) )
		: String( translate( 'Please wait…' ) );

	return (
		<Checkout>
			<CheckoutSummaryArea className={ isSummaryVisible ? 'is-visible' : '' }>
				<CheckoutErrorBoundary
					errorMessage={ translate( 'Sorry, there was an error loading this information.' ) }
					onError={ onSummaryError }
				>
					<CheckoutSummaryTitleLink onClick={ () => setIsSummaryVisible( ! isSummaryVisible ) }>
						<CheckoutSummaryTitle>
							<CheckoutSummaryTitleIcon icon="info-outline" size={ 20 } />
							{ translate( 'Purchase Details' ) }
							<CheckoutSummaryTitleToggle icon="keyboard_arrow_down" />
						</CheckoutSummaryTitle>
						<CheckoutSummaryTitlePrice className="wp-checkout__total-price">
							{ total.amount.displayValue }
						</CheckoutSummaryTitlePrice>
					</CheckoutSummaryTitleLink>
					<CheckoutSummaryBody>
						<WPCheckoutOrderSummary
							siteId={ siteId }
							onChangePlanLength={ changePlanLength }
							nextDomainIsFree={ responseCart?.next_domain_is_free }
						/>
						<SecondaryCartPromotions
							responseCart={ responseCart }
							addItemToCart={ addItemToCart }
							isCartPendingUpdate={ isCartPendingUpdate }
						/>
						<CheckoutHelpLink />
					</CheckoutSummaryBody>
				</CheckoutErrorBoundary>
			</CheckoutSummaryArea>
			<CheckoutStepArea
				submitButtonHeader={ <SubmitButtonHeader /> }
				submitButtonFooter={ <SubmitButtonFooter /> }
			>
				{ infoMessage }
				<CheckoutStepBody
					onError={ onReviewError }
					className="wp-checkout__review-order-step"
					stepId="review-order-step"
					isStepActive={ false }
					isStepComplete={ true }
					titleContent={ <OrderReviewTitle /> }
					completeStepContent={
						<WPCheckoutOrderReview
							removeProductFromCart={ removeProductFromCart }
							couponFieldStateProps={ couponFieldStateProps }
							onChangePlanLength={ changePlanLength }
							siteUrl={ siteUrl }
							siteId={ siteId }
							createUserAndSiteBeforeTransaction={ createUserAndSiteBeforeTransaction }
						/>
					}
					validatingButtonText={ validatingButtonText }
					validatingButtonAriaLabel={ validatingButtonText }
					formStatus={ formStatus }
				/>
				<CheckoutSteps>
					{ contactDetailsType !== 'none' && (
						<CheckoutStep
							stepId={ 'contact-form' }
							isCompleteCallback={ () => {
								setShouldShowContactDetailsValidationErrors( true );
								// Touch the fields so they display validation errors
								touchContactFields();
								updateCartContactDetails();
								return validateContactDetails(
									contactInfo,
									isLoggedOutCart,
									responseCart,
									showErrorMessageBriefly,
									applyDomainContactValidationResults,
									clearDomainContactErrorMessages,
									reduxDispatch,
									translate,
									true
								).then( ( response ) => {
									if ( response ) {
										reduxDispatch(
											recordTracksEvent( 'calypso_checkout_composite_step_complete', {
												step: 1,
												step_name: 'contact-form',
											} )
										);
									}
									return response;
								} );
							} }
							activeStepContent={
								<WPContactForm
									countriesList={ countriesList }
									shouldShowContactDetailsValidationErrors={
										shouldShowContactDetailsValidationErrors
									}
									contactValidationCallback={ () =>
										validateContactDetails(
											contactInfo,
											isLoggedOutCart,
											responseCart,
											showErrorMessageBriefly,
											applyDomainContactValidationResults,
											clearDomainContactErrorMessages,
											reduxDispatch,
											translate,
											false
										)
									}
									contactDetailsType={ contactDetailsType }
									isLoggedOutCart={ isLoggedOutCart }
								/>
							}
							completeStepContent={
								<WPContactFormSummary
									areThereDomainProductsInCart={ areThereDomainProductsInCart }
									isGSuiteInCart={ isGSuiteInCart }
									isLoggedOutCart={ isLoggedOutCart }
								/>
							}
							titleContent={ <ContactFormTitle /> }
							editButtonText={ String( translate( 'Edit' ) ) }
							editButtonAriaLabel={ String( translate( 'Edit the contact details' ) ) }
							nextStepButtonText={ String( translate( 'Continue' ) ) }
							nextStepButtonAriaLabel={ String(
								translate( 'Continue with the entered contact details' )
							) }
							validatingButtonText={ validatingButtonText }
							validatingButtonAriaLabel={ validatingButtonText }
						/>
					) }
					<CheckoutStep
						stepId="payment-method-step"
						activeStepContent={
							<PaymentMethodStep activeStepContent={ paymentMethodStep.activeStepContent } />
						}
						completeStepContent={ paymentMethodStep.completeStepContent }
						titleContent={ paymentMethodStep.titleContent }
						editButtonText={ String( translate( 'Edit' ) ) }
						editButtonAriaLabel={ String( translate( 'Edit the payment method' ) ) }
						nextStepButtonText={ String( translate( 'Continue' ) ) }
						nextStepButtonAriaLabel={ String(
							translate( 'Continue with the selected payment method' )
						) }
						validatingButtonText={ validatingButtonText }
						validatingButtonAriaLabel={ validatingButtonText }
						isCompleteCallback={ () => false }
					/>
				</CheckoutSteps>
			</CheckoutStepArea>
		</Checkout>
	);
}

const CheckoutSummaryArea = styled( CheckoutSummaryAreaUnstyled )`
	@media ( ${ ( props ) => props.theme.breakpoints.desktopUp } ) {
		position: relative;
	}
`;

const CheckoutSummaryTitleLink = styled.button`
	background: ${ ( props ) => props.theme.colors.background };
	border-bottom: 1px solid ${ ( props ) => props.theme.colors.borderColorLight };
	color: ${ ( props ) => props.theme.colors.textColor };
	display: flex;
	font-size: 16px;
	font-weight: ${ ( props ) => props.theme.weights.bold };
	justify-content: space-between;
	padding: 20px 23px 20px 14px;
	width: 100%;

	.rtl & {
		padding: 20px 14px 20px 23px;
	}

	.is-visible & {
		border-bottom: none;
	}

	@media ( ${ ( props ) => props.theme.breakpoints.smallPhoneUp } ) {
		border: 1px solid ${ ( props ) => props.theme.colors.borderColorLight };
		border-bottom: none 0;
	}

	@media ( ${ ( props ) => props.theme.breakpoints.desktopUp } ) {
		display: none;
	}
`;

const CheckoutSummaryTitle = styled.span`
	display: flex;
`;

const CheckoutSummaryTitleIcon = styled( Gridicon )`
	margin-right: 4px;

	.rtl & {
		margin-right: 0;
		margin-left: 4px;
	}
`;

const CheckoutSummaryTitleToggle = styled( MaterialIcon )`
	fill: ${ ( props ) => props.theme.colors.textColor };
	margin-left: 4px;
	transition: transform 0.1s linear;
	width: 18px;
	height: 18px;
	vertical-align: bottom;

	.rtl & {
		margin-right: 0;
		margin-left: 4px;
	}

	.is-visible & {
		transform: rotate( 180deg );
	}
`;

const CheckoutSummaryTitlePrice = styled.span`
	.is-visible & {
		display: none;
	}
`;

const CheckoutSummaryBody = styled.div`
	border-bottom: 1px solid ${ ( props ) => props.theme.colors.borderColorLight };
	display: none;

	.is-visible & {
		display: block;
	}

	@media ( ${ ( props ) => props.theme.breakpoints.smallPhoneUp } ) {
		border-bottom: none;
	}

	@media ( ${ ( props ) => props.theme.breakpoints.desktopUp } ) {
		display: block;
		max-width: 328px;
		position: fixed;
		width: 100%;
	}
`;

function SubmitButtonHeader() {
	const translate = useTranslate();

	const scrollToTOS = () => document?.getElementById( 'checkout-terms' )?.scrollIntoView();

	return (
		<SubmitButtonHeaderWrapper>
			{ translate( 'By continuing, you agree to our {{button}}Terms of Service{{/button}}.', {
				components: {
					button: <button onClick={ scrollToTOS } />,
				},
			} ) }
		</SubmitButtonHeaderWrapper>
	);
}

const SubmitButtonFooter = () => {
	const cartKey = useCartKey();
	const { responseCart } = useShoppingCart( cartKey );
	const translate = useTranslate();

	const hasCartJetpackProductsOnly = responseCart?.products?.every( ( product ) =>
		isJetpackPurchasableItem( product.product_slug )
	);

	if ( ! hasCartJetpackProductsOnly ) {
		return null;
	}

	const show7DayGuarantee = responseCart?.products?.every( isMonthlyProduct );
	const show14DayGuarantee = responseCart?.products?.every( isYearly );
	const content =
		show7DayGuarantee || show14DayGuarantee ? (
			translate( '%(dayCount)s day money back guarantee', {
				args: {
					dayCount: show7DayGuarantee ? 7 : 14,
				},
			} )
		) : (
			<>
				{ translate( '14 day money back guarantee on yearly subscriptions' ) }
				<br />
				{ translate( '7 day money back guarantee on monthly subscriptions' ) }
			</>
		);
	let imgSrc = badgeGenericSrc;

	if ( show7DayGuarantee ) {
		imgSrc = badge7Src;
	} else if ( show14DayGuarantee ) {
		imgSrc = badge14Src;
	}

	return (
		<SubmitButtonFooterWrapper>
			<img src={ imgSrc } alt="" />
			<span>{ content }</span>
		</SubmitButtonFooterWrapper>
	);
};

const SubmitButtonFooterWrapper = styled.div< React.HTMLAttributes< HTMLDivElement > >`
	display: flex;
	justify-content: center;
	align-items: flex-start;

	margin-top: 1.25rem;

	color: ${ ( props ) => props.theme.colors.textColor };

	font-weight: 500;

	img {
		margin-right: 0.5rem;
	}

	span {
		padding-top: 3px;
	}
`;

const SubmitButtonHeaderWrapper = styled.div`
	display: none;
	font-size: 13px;
	margin-top: -5px;
	margin-bottom: 10px;
	text-align: center;

	.checkout__step-wrapper--last-step & {
		display: block;

		@media ( ${ ( props ) => props.theme.breakpoints.tabletUp } ) {
			display: none;
		}
	}

	button {
		color: ${ ( props ) => props.theme.colors.highlight };
		display: inline;
		font-size: 13px;
		text-decoration: underline;
		width: auto;

		&:hover {
			color: ${ ( props ) => props.theme.colors.highlightOver };
		}
	}
`;
