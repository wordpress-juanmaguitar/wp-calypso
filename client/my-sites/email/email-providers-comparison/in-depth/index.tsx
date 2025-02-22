/* eslint-disable wpcalypso/jsx-classname-namespace */

import { useMobileBreakpoint } from '@automattic/viewport-react';
import { useTranslate } from 'i18n-calypso';
import page from 'page';
import { useSelector } from 'react-redux';
import QueryProductsList from 'calypso/components/data/query-products-list';
import { BillingIntervalToggle } from 'calypso/my-sites/email/email-providers-comparison/billing-interval-toggle';
import EmailForwardingLink from 'calypso/my-sites/email/email-providers-comparison/email-forwarding-link';
import ComparisonList from 'calypso/my-sites/email/email-providers-comparison/in-depth/comparison-list';
import ComparisonTable from 'calypso/my-sites/email/email-providers-comparison/in-depth/comparison-table';
import {
	professionalEmailFeatures,
	googleWorkspaceFeatures,
} from 'calypso/my-sites/email/email-providers-comparison/in-depth/data';
import { IntervalLength } from 'calypso/my-sites/email/email-providers-comparison/interval-length';
import {
	emailManagementInDepthComparison,
	emailManagementPurchaseNewEmailAccount,
} from 'calypso/my-sites/email/paths';
import getCurrentRoute from 'calypso/state/selectors/get-current-route';
import { getSelectedSite } from 'calypso/state/ui/selectors';
import type { EmailProvidersInDepthComparisonProps } from 'calypso/my-sites/email/email-providers-comparison/in-depth/types';
import type { ReactElement } from 'react';

import './style.scss';

const EmailProvidersInDepthComparison = ( {
	selectedDomainName,
	selectedIntervalLength = IntervalLength.ANNUALLY,
}: EmailProvidersInDepthComparisonProps ): ReactElement => {
	const translate = useTranslate();

	const isMobile = useMobileBreakpoint();

	const selectedSite = useSelector( getSelectedSite );
	const currentRoute = useSelector( getCurrentRoute );

	const changeIntervalLength = ( newIntervalLength: IntervalLength ) => {
		if ( selectedSite === null ) {
			return;
		}

		page(
			emailManagementInDepthComparison(
				selectedSite.slug,
				selectedDomainName,
				currentRoute,
				null,
				newIntervalLength
			)
		);
	};

	const selectEmailProvider = ( emailProviderSlug: string ) => {
		if ( selectedSite === null ) {
			return;
		}

		page(
			emailManagementPurchaseNewEmailAccount(
				selectedSite.slug,
				selectedDomainName,
				currentRoute,
				null,
				emailProviderSlug,
				selectedIntervalLength
			)
		);
	};

	const ComparisonComponent = isMobile ? ComparisonList : ComparisonTable;

	return (
		<>
			<QueryProductsList />

			<h1 className="email-providers-in-depth-comparison__header">
				{ translate( 'Choose the right plan for you' ) }
			</h1>

			<div className="email-providers-in-depth-comparison__sub-header">
				{ translate( 'Try risk-free with a 14-day money back guarantee on all plans.' ) }
			</div>

			<BillingIntervalToggle
				intervalLength={ selectedIntervalLength }
				onIntervalChange={ changeIntervalLength }
			/>

			<ComparisonComponent
				emailProviders={ [ professionalEmailFeatures, googleWorkspaceFeatures ] }
				intervalLength={ selectedIntervalLength }
				onSelectEmailProvider={ selectEmailProvider }
				selectedDomainName={ selectedDomainName }
			/>

			<EmailForwardingLink selectedDomainName={ selectedDomainName } />
		</>
	);
};

export default EmailProvidersInDepthComparison;
