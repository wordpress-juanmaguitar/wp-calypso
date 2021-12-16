import { useTranslate } from 'i18n-calypso';
import { connect } from 'react-redux';
import QuerySitePurchases from 'calypso/components/data/query-site-purchases';
import Accordion from 'calypso/components/domains/accordion';
import TwoColumnsLayout from 'calypso/components/domains/layout/two-columns-layout';
import Main from 'calypso/components/main';
import BodySectionCssClass from 'calypso/layout/body-section-css-class';
import { getSelectedDomain } from 'calypso/lib/domains';
import { type as domainTypes } from 'calypso/lib/domains/constants';
import Breadcrumbs from 'calypso/my-sites/domains/domain-management/components/breadcrumbs';
import DomainDeleteInfoCard from 'calypso/my-sites/domains/domain-management/components/domain/domain-info-card/delete';
import DomainEmailInfoCard from 'calypso/my-sites/domains/domain-management/components/domain/domain-info-card/email';
import DomainTransferInfoCard from 'calypso/my-sites/domains/domain-management/components/domain/domain-info-card/transfer';
import DomainMainPlaceholder from 'calypso/my-sites/domains/domain-management/components/domain/main-placeholder';
import { domainManagementEdit, domainManagementList } from 'calypso/my-sites/domains/paths';
import { getCurrentUserId } from 'calypso/state/current-user/selectors';
import {
	getByPurchaseId,
	isFetchingSitePurchases,
	hasLoadedSitePurchasesFromServer,
} from 'calypso/state/purchases/selectors';
import { getCurrentRoute } from 'calypso/state/selectors/get-current-route';
import ConnectedDomainDetails from './cards/connected-domain-details';
import DomainSecurityDetails from './cards/domain-security-details';
import RegisteredDomainDetails from './cards/registered-domain-details';
import { getSslReadableStatus } from './helpers';
import SettingsHeader from './settings-header';
import type { SettingsPageConnectedProps, SettingsPageProps } from './types';

const Settings = ( {
	currentRoute,
	domain,
	isLoadingPurchase,
	purchase,
	selectedDomainName,
	selectedSite,
}: SettingsPageProps ): JSX.Element => {
	const translate = useTranslate();

	const renderBreadcrumbs = () => {
		const previousPath = domainManagementEdit(
			selectedSite?.slug,
			selectedDomainName,
			currentRoute
		);

		const items = [
			{
				label: translate( 'Domains' ),
				href: domainManagementList( selectedSite?.slug, selectedDomainName ),
			},
			{ label: selectedDomainName },
		];

		const mobileItem = {
			label: translate( 'Back' ),
			href: previousPath,
			showBackArrow: true,
		};

		return <Breadcrumbs items={ items } mobileItem={ mobileItem } />;
	};

	const renderSecurityAccordion = () => {
		const domainSecurityCard = (
			<DomainSecurityDetails
				domain={ domain }
				selectedSite={ selectedSite }
				purchase={ purchase }
				isLoadingPurchase={ isLoadingPurchase }
			/>
		);

		if ( ! domainSecurityCard ) return null;

		return (
			<Accordion
				title={ translate( 'Domain security' ) }
				subtitle={ getSslReadableStatus( domain ) }
				key="security"
			>
				{ domainSecurityCard }
			</Accordion>
		);
	};

	const renderDetailsSection = () => {
		const accordions: JSX.Element[] = [];
		if ( domain.type === domainTypes.REGISTERED ) {
			accordions.push(
				<Accordion
					title={ translate( 'Details', { textOnly: true } ) }
					subtitle={ translate( 'Registration and auto-renew', { textOnly: true } ) }
					key="main"
					expanded
				>
					<RegisteredDomainDetails
						domain={ domain }
						selectedSite={ selectedSite }
						purchase={ purchase }
						isLoadingPurchase={ isLoadingPurchase }
					/>
				</Accordion>
			);
		} else if ( domain.type === domainTypes.MAPPED ) {
			accordions.push(
				<Accordion
					title={ translate( 'Details', { textOnly: true } ) }
					subtitle={ translate( 'Domain connection details', { textOnly: true } ) }
					key="main"
					expanded
				>
					<ConnectedDomainDetails
						domain={ domain }
						selectedSite={ selectedSite }
						purchase={ purchase }
						isLoadingPurchase={ isLoadingPurchase }
					/>
				</Accordion>
			);
		}

		const securityAccordion = renderSecurityAccordion();
		if ( securityAccordion ) {
			accordions.push( securityAccordion );
		}

		return accordions;
	};

	const renderMainContent = () => {
		// TODO: If it's a registered domain or transfer and the domain's registrar is in maintenance, show maintenance card
		return <>{ renderDetailsSection() }</>;
	};

	const renderSettingsCards = () => (
		<>
			<DomainEmailInfoCard selectedSite={ selectedSite } domain={ domain } />
			<DomainTransferInfoCard selectedSite={ selectedSite } domain={ domain } />
			<DomainDeleteInfoCard selectedSite={ selectedSite } domain={ domain } />
		</>
	);

	if ( ! domain ) {
		// TODO: Update this placeholder
		return <DomainMainPlaceholder breadcrumbs={ renderBreadcrumbs } />;
	}

	return (
		<Main wideLayout className="settings">
			{ selectedSite.ID && ! purchase && <QuerySitePurchases siteId={ selectedSite.ID } /> }
			<BodySectionCssClass bodyClass={ [ 'edit__body-white' ] } />
			{ renderBreadcrumbs() }
			<SettingsHeader domain={ domain } />
			<TwoColumnsLayout content={ renderMainContent() } sidebar={ renderSettingsCards() } />
		</Main>
	);
};

export default connect(
	( state, ownProps: SettingsPageProps ): SettingsPageConnectedProps => {
		const domain = ownProps.domains && getSelectedDomain( ownProps );
		const subscriptionId = domain && domain.subscriptionId;
		const currentUserId = getCurrentUserId( state );
		const purchase = subscriptionId
			? getByPurchaseId( state, parseInt( subscriptionId, 10 ) )
			: null;

		return {
			currentRoute: getCurrentRoute( state ),
			domain: getSelectedDomain( ownProps )!,
			isLoadingPurchase:
				isFetchingSitePurchases( state ) || ! hasLoadedSitePurchasesFromServer( state ),
			purchase: purchase && purchase.userId === currentUserId ? purchase : null,
		};
	}
)( Settings );
