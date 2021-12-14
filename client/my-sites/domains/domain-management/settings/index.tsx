import { useTranslate } from 'i18n-calypso';
import { connect } from 'react-redux';
import Accordion from 'calypso/components/domains/accordion';
import TwoColumnsLayout from 'calypso/components/domains/layout/two-columns-layout';
import Main from 'calypso/components/main';
import BodySectionCssClass from 'calypso/layout/body-section-css-class';
import { getSelectedDomain } from 'calypso/lib/domains';
import Breadcrumbs from 'calypso/my-sites/domains/domain-management/components/breadcrumbs';
import DomainDeleteInfoCard from 'calypso/my-sites/domains/domain-management/components/domain/domain-info-card/delete';
import DomainEmailInfoCard from 'calypso/my-sites/domains/domain-management/components/domain/domain-info-card/email';
import DomainTransferInfoCard from 'calypso/my-sites/domains/domain-management/components/domain/domain-info-card/transfer';
import { domainManagementEdit, domainManagementList } from 'calypso/my-sites/domains/paths';
import { getCurrentRoute } from 'calypso/state/selectors/get-current-route';
import isDomainOnlySite from 'calypso/state/selectors/is-domain-only-site';
import SetAsPrimary from './set-as-primary';
import SettingsHeader from './settings-header';
import type {
	SettingsPageConnectedProps,
	SettingsPagePassedProps,
	SettingsPageProps,
} from './types';

const Settings = ( props: SettingsPageProps ): JSX.Element => {
	const translate = useTranslate();

	const renderBreadcrumbs = () => {
		const { selectedSite, currentRoute, selectedDomainName } = props;

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

	const renderSettingsCards = () => (
		<>
			<DomainEmailInfoCard selectedSite={ props.selectedSite } domain={ props.domain } />
			<DomainTransferInfoCard selectedSite={ props.selectedSite } domain={ props.domain } />
			<DomainDeleteInfoCard selectedSite={ props.selectedSite } domain={ props.domain } />
		</>
	);
	const renderContent = () => {
		return (
			<>
				{ /* Placeholder to test accordion */ }
				<div style={ { marginTop: '30px' } }>
					<Accordion
						title="First element title"
						subtitle="First element subtitle"
						expanded={ true }
					>
						<div>Component placeholder: this one is exapanded by default</div>
					</Accordion>
					<Accordion title="Second element title" subtitle="Second element subtitle">
						<div>Component placeholder: this one i'snt exapanded by default</div>
					</Accordion>
					<SetAsPrimary domain={ props.domain } selectedSite={ props.selectedSite } />
				</div>
			</>
		);
	};

	return (
		<Main wideLayout>
			<BodySectionCssClass bodyClass={ [ 'edit__body-white' ] } />
			{ renderBreadcrumbs() }
			<SettingsHeader domain={ props.domain } />
			<TwoColumnsLayout content={ renderContent() } sidebar={ renderSettingsCards() } />
		</Main>
	);
};

export default connect(
	( state, ownProps: SettingsPagePassedProps ): SettingsPageConnectedProps => {
		return {
			domain: getSelectedDomain( ownProps )!,
			currentRoute: getCurrentRoute( state ),
			hasDomainOnlySite: Boolean( isDomainOnlySite( state, ownProps.selectedSite!.ID ) ),
		};
	}
)( Settings );
