import { Gridicon } from '@automattic/components';
import { useTranslate } from 'i18n-calypso';
import { preventWidows } from 'calypso/lib/formatting';
import type { TranslateResult } from 'i18n-calypso';
import type { FunctionComponent, MouseEventHandler } from 'react';

import './style.scss';
import * as React from 'react';
import { ESCAPE } from '@wordpress/keycodes';

export interface EmailProviderStackedFeatureProps {
	title: TranslateResult;
}

const EmailProviderStackedFeature: FunctionComponent< EmailProviderStackedFeatureProps > = (
	props
) => {
	const { title } = props;
	const size = 18;
	return (
		<div className="email-provider-stacked-features__feature">
			<Gridicon icon="checkmark" size={ size } />

			{ preventWidows( title ) }
		</div>
	);
};

export interface EmailProviderStackedFeaturesProps {
	features: TranslateResult[];
}

export const EmailProviderStackedFeatures: FunctionComponent< EmailProviderStackedFeaturesProps > = (
	props
) => {
	const { features } = props;
	const translate = useTranslate();

	if ( ! features ) {
		return null;
	}

	return (
		<>
			<span className={ 'email-provider-stacked-features__whats-included' }>
				{ translate( "What's included:" ) }
			</span>
			{ features.map( ( feature, index ) => (
				<EmailProviderStackedFeature key={ index } title={ feature } />
			) ) }
		</>
	);
};

export interface EmailProviderStackedFeaturesProps {
	features: TranslateResult[];
}

export const EmailProviderStackedFeaturesToggleButton: FunctionComponent< EmailProviderStackedFeaturesToggleButton > = (
	props
) => {
	const translate = useTranslate();
	const { handleClick, isRelatedContentExpanded } = props;

	return (
		<button className="email-provider-stacked-features__toggle-button" onClick={ handleClick }>
			<span className="email-provider-stacked-features__toggle-text">
				{ translate( 'Show all features' ) }
			</span>

			<Gridicon icon={ isRelatedContentExpanded ? 'chevron-up' : 'chevron-down' } />
		</button>
	);
};

interface EmailProviderStackedFeaturesToggleButton {
	handleClick: MouseEventHandler< HTMLButtonElement >;
	isRelatedContentExpanded: boolean;
}
