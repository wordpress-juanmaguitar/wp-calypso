import { Button } from '@automattic/components';
import { useBreakpoint } from '@automattic/viewport-react';
import classnames from 'classnames';
import { useState } from 'react';
import PromoCard, { TitleLocation } from 'calypso/components/promo-section/promo-card';
import {
	EmailProviderStackedFeatures,
	EmailProviderStackedFeaturesToggleButton,
} from 'calypso/my-sites/email/email-providers-stacked-comparison/email-provider-stacked-card/email-provider-stacked-features';
import type { ProviderCard } from 'calypso/my-sites/email/email-providers-stacked-comparison/provider-cards/provider-card-props';
import type { FunctionComponent } from 'react';

import './style.scss';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const EmailProvidersStackedCard: FunctionComponent< ProviderCard > = ( props ) => {
	const {
		children,
		description,
		detailsExpanded,
		expandButtonLabel,
		features,
		footerBadge,
		formFields,
		logo,
		onExpandedChange = noop,
		priceBadge = null,
		productName,
		providerKey,
		showExpandButton = true,
	} = props;

	const [ areFeaturesExpanded, setFeaturesExpanded ] = useState( false );

	const isViewportSizeLowerThan660px = useBreakpoint( '<660px' );

	const showFeaturesToggleButton = detailsExpanded && isViewportSizeLowerThan660px;

	const toggleVisibility = ( event: React.MouseEvent ): void => {
		event.preventDefault();

		onExpandedChange( providerKey, ! detailsExpanded );
	};

	const header = (
		<div className="email-provider-stacked-card__header">
			<div className="email-provider-stacked-card__title-container">
				<h2 className="email-provider-stacked-card__title wp-brand-font"> { productName } </h2>
				<p>{ description }</p>
			</div>
			<div className="email-provider-stacked-card__title-price-badge">{ priceBadge }</div>
			{ showExpandButton && ! detailsExpanded && (
				<div className="email-provider-stacked-card__provider-card-main-details">
					<Button
						primary={ false }
						onClick={ toggleVisibility }
						className="email-provider-stacked-card__provider-expand-cta"
					>
						{ expandButtonLabel }
					</Button>
				</div>
			) }
		</div>
	);

	return (
		<PromoCard
			className={ classnames( 'email-providers-stacked-comparison__provider-card', {
				'is-expanded': detailsExpanded,
			} ) }
			image={ logo }
			titleComponent={ header }
			titleLocation={ isViewportSizeLowerThan660px ? TitleLocation.figure : TitleLocation.body }
			icon={ '' }
		>
			<div className="email-provider-stacked-card__provider-price-and-button">
				{ showFeaturesToggleButton && (
					<EmailProviderStackedFeaturesToggleButton
						handleClick={ () => setFeaturesExpanded( ! areFeaturesExpanded ) }
						isRelatedContentExpanded={ areFeaturesExpanded }
					/>
				) }
			</div>

			<div className="email-provider-stacked-card__provider-form-and-right-panel">
				<div className="email-provider-stacked-card__provider-form">{ formFields }</div>
				<div className="email-provider-stacked-card__provider-right-panel">
					{ ( ! showFeaturesToggleButton || areFeaturesExpanded ) && (
						<>
							<EmailProviderStackedFeatures features={ features } /> { footerBadge }
						</>
					) }
				</div>
			</div>

			{ children }
		</PromoCard>
	);
};

export default EmailProvidersStackedCard;
