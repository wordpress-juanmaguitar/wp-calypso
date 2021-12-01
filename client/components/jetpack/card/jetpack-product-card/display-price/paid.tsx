import { TERM_ANNUALLY } from '@automattic/calypso-products';
import { useTranslate, TranslateResult } from 'i18n-calypso';
import InfoPopover from 'calypso/components/info-popover';
import PlanPrice from 'calypso/my-sites/plan-price';
import TimeFrame from './time-frame';
import type { Duration } from 'calypso/my-sites/plans/jetpack-plans/types';
import type { Moment } from 'moment';
import type { ReactNode } from 'react';

type OwnProps = {
	discountedPrice?: number;
	originalPrice: number;
	billingTerm: Duration;
	currencyCode?: string | null;
	displayFrom?: boolean;
	tooltipText?: TranslateResult | ReactNode;
	expiryDate?: Moment;
	hideSavingLabel?: boolean;
};

type SavingsLabelProps = {
	billingTerm: Duration;
	discountedPrice: number;
	originalPrice: number;
};

const SavingsLabel: React.FC< SavingsLabelProps > = ( {
	billingTerm,
	discountedPrice,
	originalPrice,
} ) => {
	const translate = useTranslate();

	const discountPercentage = discountedPrice
		? ( ( originalPrice - discountedPrice ) / originalPrice ) * 100
		: null;

	const discountElt =
		billingTerm === TERM_ANNUALLY
			? translate( 'Save %(percent)d%% for the first year ✢', {
					args: {
						percent: discountPercentage,
					},
					comment: '✢ clause describing the displayed price adjustment',
			  } )
			: translate( 'You Save %(percent)d%% ✢', {
					args: {
						percent: discountPercentage,
					},
					comment: '✢ clause describing the displayed price adjustment',
			  } );

	return <span className="display-price__you-save">{ discountElt }</span>;
};

const Paid: React.FC< OwnProps > = ( {
	discountedPrice,
	originalPrice,
	billingTerm,
	currencyCode,
	displayFrom,
	tooltipText,
	expiryDate,
	hideSavingLabel,
} ) => {
	const loading = ! currencyCode || ! originalPrice;
	if ( loading ) {
		return (
			<>
				<div className="display-price__price-placeholder" />
				<div className="display-price__time-frame-placeholder" />
			</>
		);
	}

	return (
		<>
			{ displayFrom && <span className="display-price__from">from</span> }
			{ /*
			 * Price should be displayed from left-to-right, even in right-to-left
			 * languages. `PlanPrice` seems to keep the ltr direction no matter
			 * what when seen in the dev docs page, but somehow it doesn't in
			 * the pricing page.
			 */ }
			{ discountedPrice && (
				<span dir="ltr">
					<PlanPrice
						original
						className="display-price__original-price"
						rawPrice={ originalPrice }
						currencyCode={ currencyCode }
					/>
				</span>
			) }

			<span dir="ltr">
				<PlanPrice
					discounted
					rawPrice={ discountedPrice ?? originalPrice }
					currencyCode={ currencyCode }
				/>
			</span>

			{ tooltipText && (
				<InfoPopover position="top" className="display-price__price-tooltip">
					{ tooltipText }
				</InfoPopover>
			) }
			<TimeFrame expiryDate={ expiryDate } billingTerm={ billingTerm } />
			{ ! hideSavingLabel && discountedPrice && (
				<SavingsLabel
					billingTerm={ billingTerm }
					discountedPrice={ discountedPrice }
					originalPrice={ originalPrice }
				/>
			) }
		</>
	);
};

export default Paid;
