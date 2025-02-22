import {
	PLAN_BUSINESS_MONTHLY,
	PLAN_BUSINESS,
	PLAN_PREMIUM,
	PLAN_PERSONAL,
	PLAN_BLOGGER,
	PLAN_PREMIUM_2_YEARS,
	PLAN_BUSINESS_2_YEARS,
	PLAN_BLOGGER_2_YEARS,
	PLAN_PERSONAL_2_YEARS,
	isFreePlanProduct,
} from '@automattic/calypso-products';
import { Button, Dialog } from '@automattic/components';
import { useTranslate } from 'i18n-calypso';
import page from 'page';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import EligibilityWarnings from 'calypso/blocks/eligibility-warnings';
import { userCan } from 'calypso/lib/site/utils';
import { IntervalLength } from 'calypso/my-sites/marketplace/components/billing-interval-switcher/constants';
import { isCompatiblePlugin } from 'calypso/my-sites/plugins/plugin-compatibility';
import { recordGoogleEvent } from 'calypso/state/analytics/actions';
import {
	getEligibility,
	isEligibleForAutomatedTransfer,
} from 'calypso/state/automated-transfer/selectors';
import { productToBeInstalled } from 'calypso/state/marketplace/purchase-flow/actions';
import shouldUpgradeCheck from 'calypso/state/marketplace/selectors';
import { isRequestingForSites } from 'calypso/state/plugins/installed/selectors';
import { removePluginStatuses } from 'calypso/state/plugins/installed/status/actions';
import isSiteAutomatedTransfer from 'calypso/state/selectors/is-site-automated-transfer';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import { PluginPrice, getPeriodVariationValue } from '../plugin-price';
import USPS from './usps';
import './style.scss';

const PluginDetailsCTA = ( {
	plugin,
	selectedSite,
	isPluginInstalledOnsite,
	siteIds,
	isPlaceholder,
	billingPeriod,
	isMarketplaceProduct,
} ) => {
	const pluginSlug = plugin.slug;
	const translate = useTranslate();

	const requestingPluginsForSites = useSelector( ( state ) =>
		isRequestingForSites( state, siteIds )
	);

	// Site type
	const isJetpack = useSelector( ( state ) => isJetpackSite( state, selectedSite?.ID ) );
	const isAtomic = useSelector( ( state ) => isSiteAutomatedTransfer( state, selectedSite?.ID ) );
	const isJetpackSelfHosted = selectedSite && isJetpack && ! isAtomic;
	const isFreePlan = selectedSite && isFreePlanProduct( selectedSite.plan );

	const shouldUpgrade = useSelector( ( state ) => shouldUpgradeCheck( state, selectedSite ) );

	// Eligibilities for Simple Sites.
	const { eligibilityHolds, eligibilityWarnings } = useSelector( ( state ) =>
		getEligibility( state, selectedSite?.ID )
	);
	const isEligible = useSelector( ( state ) =>
		isEligibleForAutomatedTransfer( state, selectedSite?.ID )
	);
	const hasEligibilityMessages =
		! isJetpack && ( eligibilityHolds || eligibilityWarnings || isEligible );

	if ( isPlaceholder ) {
		return <PluginDetailsCTAPlaceholder />;
	}

	if ( requestingPluginsForSites ) {
		// Display nothing if we are still requesting the plugin status.
		return null;
	}
	if ( ! isJetpackSelfHosted && ! isCompatiblePlugin( pluginSlug ) ) {
		// Check for WordPress.com compatibility.
		return null;
	}

	// Check if user can manage plugins or no site is selected (all sites view).
	if ( ! selectedSite || ! userCan( 'manage_options', selectedSite ) ) {
		if ( isMarketplaceProduct ) {
			return (
				<div className="plugin-details-CTA__container">
					<div className="plugin-details-CTA__price align-right">
						<PluginPrice plugin={ plugin } billingPeriod={ billingPeriod }>
							{ ( { isFetching, price, period } ) =>
								isFetching ? (
									<div className="plugin-details-CTA__price-placeholder">...</div>
								) : (
									<>
										{ price + ' ' }
										<span className="plugin-details-CTA__period">{ period }</span>
									</>
								)
							}
						</PluginPrice>
						{ shouldUpgrade && (
							<span className="plugin-details-CTA__uprade-required">
								{ translate( 'Plan upgrade required' ) }
							</span>
						) }
					</div>
				</div>
			);
		}
		return null;
	}

	if ( isPluginInstalledOnsite ) {
		// Check if already instlaled on the site
		return null;
	}

	return (
		<div className="plugin-details-CTA__container">
			<div className="plugin-details-CTA__price">
				<PluginPrice plugin={ plugin } billingPeriod={ billingPeriod }>
					{ ( { isFetching, price, period } ) =>
						isFetching ? (
							<div className="plugin-details-CTA__price-placeholder">...</div>
						) : (
							<>
								{ price ? (
									<>
										{ price + ' ' }
										<span className="plugin-details-CTA__period">{ period }</span>
									</>
								) : (
									translate( 'Free' )
								) }
								{ shouldUpgrade && (
									<span className="plugin-details-CTA__uprade-required">
										{ translate( 'Plan upgrade required' ) }
									</span>
								) }
							</>
						)
					}
				</PluginPrice>
			</div>
			<div className="plugin-details-CTA__install">
				<CTAButton
					plugin={ plugin }
					isPluginInstalledOnsite={ isPluginInstalledOnsite }
					isJetpackSelfHosted={ isJetpackSelfHosted }
					selectedSite={ selectedSite }
					hasEligibilityMessages={ hasEligibilityMessages }
					isMarketplaceProduct={ isMarketplaceProduct }
					billingPeriod={ billingPeriod }
					shouldUpgrade={ shouldUpgrade }
				/>
			</div>
			<div className="plugin-details-CTA__t-and-c">
				{ translate(
					'By installing, you agree to {{a}}WordPress.com’s Terms of Service{{/a}} and the Third-Party plugin Terms.',
					{
						components: {
							a: <a target="_blank" rel="noopener noreferrer" href="https://wordpress.com/tos/" />,
						},
					}
				) }
			</div>

			{ ! isJetpackSelfHosted && (
				<USPS
					shouldUpgrade={ shouldUpgrade }
					isFreePlan={ isFreePlan }
					isMarketplaceProduct={ isMarketplaceProduct }
					billingPeriod={ billingPeriod }
				/>
			) }
		</div>
	);
};

const PluginDetailsCTAPlaceholder = () => {
	return (
		<div className="plugin-details-CTA__container is-placeholder">
			<div className="plugin-details-CTA__price">...</div>
			<div className="plugin-details-CTA__install">...</div>
			<div className="plugin-details-CTA__t-and-c">...</div>
		</div>
	);
};

const CTAButton = ( {
	plugin,
	selectedSite,
	shouldUpgrade,
	hasEligibilityMessages,
	isMarketplaceProduct,
	billingPeriod,
	isJetpackSelfHosted,
} ) => {
	const dispatch = useDispatch();
	const translate = useTranslate();
	const [ showEligibility, setShowEligibility ] = useState( false );

	// disable paid plugin cta for jetpack sites
	if ( isJetpackSelfHosted && isMarketplaceProduct ) {
		return (
			<p className="plugin-details-CTA__not-available">
				{ translate( 'This plugin is supported only in WordPress.com sites for the moment.' ) }
			</p>
		);
	}

	return (
		<>
			<Dialog
				additionalClassNames={ 'plugin-details-CTA__dialog-content' }
				additionalOverlayClassNames={ 'plugin-details-CTA__modal-overlay' }
				isVisible={ showEligibility }
				title={ translate( 'Eligibility' ) }
				onClose={ () => setShowEligibility( false ) }
			>
				<EligibilityWarnings
					currentContext={ 'plugin-details' }
					standaloneProceed
					onProceed={ () =>
						onClickInstallPlugin( {
							dispatch,
							selectedSite,
							plugin,
							upgradeAndInstall: shouldUpgrade,
							isMarketplaceProduct,
							billingPeriod,
						} )
					}
				/>
			</Dialog>
			<Button
				className="plugin-details-CTA__install-button"
				onClick={ () => {
					if ( hasEligibilityMessages ) {
						return setShowEligibility( true );
					}
					onClickInstallPlugin( {
						dispatch,
						selectedSite,
						plugin,
						upgradeAndInstall: shouldUpgrade,
						isMarketplaceProduct,
						billingPeriod,
					} );
				} }
			>
				{
					// eslint-disable-next-line no-nested-ternary
					isMarketplaceProduct
						? translate( 'Purchase and activate' )
						: shouldUpgrade
						? translate( 'Upgrade and activate' )
						: translate( 'Install and activate' )
				}
			</Button>
		</>
	);
};

function onClickInstallPlugin( {
	dispatch,
	selectedSite,
	plugin,
	upgradeAndInstall,
	isMarketplaceProduct,
	billingPeriod,
} ) {
	dispatch( removePluginStatuses( 'completed', 'error' ) );

	dispatch(
		recordGoogleEvent( 'Plugins', 'Install on selected Site', 'Plugin Name', plugin.slug )
	);
	dispatch(
		recordGoogleEvent( 'calypso_plugin_install_click_from_plugin_info', {
			site: selectedSite?.ID,
			plugin: plugin.slug,
		} )
	);

	dispatch( productToBeInstalled( plugin.slug, selectedSite.slug ) );

	if ( isMarketplaceProduct ) {
		// We need to add the product to the  cart.
		// Plugin install is handled on the backend by activating the subscription.
		const variationPeriod = getPeriodVariationValue( billingPeriod );
		const product_slug = plugin?.variations?.[ variationPeriod ]?.product_slug;
		if ( upgradeAndInstall ) {
			// We also need to add a business plan to the cart.
			return page(
				`/checkout/${ selectedSite.slug }/${ businessPlanToAdd(
					selectedSite?.plan,
					billingPeriod
				) },${ product_slug }?redirect_to=/marketplace/thank-you/${ plugin.slug }/${
					selectedSite.slug
				}#step2`
			);
		}

		return page(
			`/checkout/${ selectedSite.slug }/${ product_slug }?redirect_to=/marketplace/thank-you/${ plugin.slug }/${ selectedSite.slug }#step2`
		);
	}

	// After buying a plan we need to redirect to the plugin install page.
	const installPluginURL = `/marketplace/${ plugin.slug }/install/${ selectedSite.slug }`;
	if ( upgradeAndInstall ) {
		// We also need to add a business plan to the cart.
		return page(
			`/checkout/${ selectedSite.slug }/${ businessPlanToAdd(
				selectedSite?.plan,
				billingPeriod
			) }?redirect_to=${ installPluginURL }#step2`
		);
	}

	// No need to go through chekout, go to install page directly.
	return page( installPluginURL );
}

// Return the correct business plan slug depending on current plan and pluginBillingPeriod
function businessPlanToAdd( currentPlan, pluginBillingPeriod ) {
	switch ( currentPlan.product_slug ) {
		case PLAN_PERSONAL_2_YEARS:
		case PLAN_PREMIUM_2_YEARS:
		case PLAN_BLOGGER_2_YEARS:
			return PLAN_BUSINESS_2_YEARS;
		case PLAN_PERSONAL:
		case PLAN_PREMIUM:
		case PLAN_BLOGGER:
			return PLAN_BUSINESS;
		default:
			// Return annual plan if selected, monthly otherwise.
			return pluginBillingPeriod === IntervalLength.ANNUALLY
				? PLAN_BUSINESS
				: PLAN_BUSINESS_MONTHLY;
	}
}

export default PluginDetailsCTA;
