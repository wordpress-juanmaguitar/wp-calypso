import { isEnabled } from '@automattic/calypso-config';
import { useTranslate } from 'i18n-calypso';
import page from 'page';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import QueryEmailForwards from 'calypso/components/data/query-email-forwards';
import QueryProductsList from 'calypso/components/data/query-products-list';
import QuerySiteDomains from 'calypso/components/data/query-site-domains';
import Main from 'calypso/components/main';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { getSelectedDomain } from 'calypso/lib/domains';
import { hasEmailForwards } from 'calypso/lib/domains/email-forwarding';
import { hasGSuiteSupportedDomain } from 'calypso/lib/gsuite';
import { GOOGLE_WORKSPACE_PRODUCT_TYPE } from 'calypso/lib/gsuite/constants';
import EmailExistingForwardsNotice from 'calypso/my-sites/email/email-existing-forwards-notice';
import { BillingIntervalToggle } from 'calypso/my-sites/email/email-providers-comparison/billing-interval-toggle';
import EmailForwardingLink from 'calypso/my-sites/email/email-providers-comparison/email-forwarding-link';
import { IntervalLength } from 'calypso/my-sites/email/email-providers-comparison/interval-length';
import GoogleWorkspaceCard from 'calypso/my-sites/email/email-providers-stacked-comparison/provider-cards/google-workspace-card';
import ProfessionalEmailCard from 'calypso/my-sites/email/email-providers-stacked-comparison/provider-cards/professional-email-card';
import {
	emailManagementInDepthComparison,
	emailManagementPurchaseNewEmailAccount,
} from 'calypso/my-sites/email/paths';
import canUserPurchaseGSuite from 'calypso/state/selectors/can-user-purchase-gsuite';
import getCurrentRoute from 'calypso/state/selectors/get-current-route';
import { getDomainsWithForwards } from 'calypso/state/selectors/get-email-forwards';
import { getDomainsBySiteId } from 'calypso/state/sites/domains/selectors';
import { getSelectedSite } from 'calypso/state/ui/selectors';
import type { ReactElement } from 'react';

import './style.scss';

type EmailProvidersStackedComparisonProps = {
	comparisonContext: string;
	selectedDomainName: string;
	selectedEmailProviderSlug: string;
	selectedIntervalLength: IntervalLength | undefined;
	siteName: string;
	source: string;
};

const EmailProvidersStackedComparison = ( {
	comparisonContext,
	selectedDomainName,
	selectedEmailProviderSlug,
	selectedIntervalLength = IntervalLength.ANNUALLY,
	siteName,
	source,
}: EmailProvidersStackedComparisonProps ): ReactElement => {
	const translate = useTranslate();

	const [ detailsExpanded, setDetailsExpanded ] = useState( () => {
		if ( selectedEmailProviderSlug === GOOGLE_WORKSPACE_PRODUCT_TYPE ) {
			return {
				titan: false,
				google: true,
			};
		}

		return {
			titan: true,
			google: false,
		};
	} );

	const canPurchaseGSuite = useSelector( canUserPurchaseGSuite );

	const currentRoute = useSelector( getCurrentRoute );

	const selectedSite = useSelector( getSelectedSite );

	const domains = useSelector( ( state ) => getDomainsBySiteId( state, selectedSite?.ID ) );
	const domain = getSelectedDomain( {
		domains,
		selectedDomainName: selectedDomainName,
	} );
	const domainsWithForwards = useSelector( ( state ) => getDomainsWithForwards( state, domains ) );

	if ( ! domain ) {
		return <></>;
	}

	const isGSuiteSupported = canPurchaseGSuite && hasGSuiteSupportedDomain( [ domain ] );

	const changeExpandedState = ( providerKey: string, isCurrentlyExpanded: boolean ) => {
		const expandedEntries = Object.entries( detailsExpanded ).map( ( entry ) => {
			const [ key, currentExpanded ] = entry;

			if ( isCurrentlyExpanded ) {
				return [ key, key === providerKey ];
			}

			return [ key, key === providerKey ? isCurrentlyExpanded : currentExpanded ];
		} );

		if ( isCurrentlyExpanded ) {
			recordTracksEvent( 'calypso_email_providers_expand_section_click', {
				provider: providerKey,
			} );
		}

		setDetailsExpanded( Object.fromEntries( expandedEntries ) );
	};

	const changeIntervalLength = ( newIntervalLength: IntervalLength ) => {
		if ( ! selectedSite?.slug ) {
			return;
		}

		page(
			emailManagementPurchaseNewEmailAccount(
				selectedSite.slug,
				selectedDomainName,
				currentRoute,
				null,
				selectedEmailProviderSlug,
				newIntervalLength
			)
		);
	};

	const showGoogleWorkspaceCard =
		selectedIntervalLength === IntervalLength.ANNUALLY && isGSuiteSupported;
	const hasExistingEmailForwards = hasEmailForwards( domain );

	return (
		<Main className="email-providers-stacked-comparison__main" wideLayout>
			<QueryProductsList />
			<QueryEmailForwards domainName={ selectedDomainName } />

			{ selectedSite && <QuerySiteDomains siteId={ selectedSite.ID } /> }

			<h1 className="email-providers-stacked-comparison__header">
				{ translate( 'Pick an email solution' ) }
			</h1>

			{ isEnabled( 'emails/in-depth-comparison' ) && (
				<div className="email-providers-stacked-comparison__sub-header">
					{ translate( 'Not sure where to start? {{a}}See how they compare{{/a}}.', {
						components: {
							a: (
								<a
									href={ emailManagementInDepthComparison(
										siteName,
										selectedDomainName,
										currentRoute,
										null,
										selectedIntervalLength
									) }
								/>
							),
						},
					} ) }
				</div>
			) }

			<BillingIntervalToggle
				intervalLength={ selectedIntervalLength }
				onIntervalChange={ changeIntervalLength }
			/>

			{ hasExistingEmailForwards && domainsWithForwards !== undefined && (
				<EmailExistingForwardsNotice
					domainsWithForwards={ domainsWithForwards }
					selectedDomainName={ selectedDomainName }
				/>
			) }

			<ProfessionalEmailCard
				comparisonContext={ comparisonContext }
				detailsExpanded={ detailsExpanded.titan }
				selectedDomainName={ selectedDomainName }
				source={ source }
				intervalLength={ selectedIntervalLength }
				onExpandedChange={ changeExpandedState }
			/>

			{ showGoogleWorkspaceCard && (
				<GoogleWorkspaceCard
					comparisonContext={ comparisonContext }
					detailsExpanded={ detailsExpanded.google }
					selectedDomainName={ selectedDomainName }
					source={ source }
					intervalLength={ selectedIntervalLength }
					onExpandedChange={ changeExpandedState }
				/>
			) }

			<EmailForwardingLink selectedDomainName={ selectedDomainName } />
		</Main>
	);
};

export default EmailProvidersStackedComparison;
