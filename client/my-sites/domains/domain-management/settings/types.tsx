import type { ResponseDomain } from 'calypso/lib/domains/types';
import type { SiteData } from 'calypso/state/ui/selectors/site-data';

type WhoisData = {
	fname: string;
	lname: string;
	org: string;
	email: string;
	city: string;
	sp: string;
	pc: string;
	cc: string;
	phone: string;
	fax: string;
	sa1: string;
	sa2: string;
	country_code: string;
	state: string;
	type: string;
};

export type SettingsPagePassedProps = {
	domains: ResponseDomain[] | null;

	currentRoute: string;
	selectedSite: SiteData;
	selectedDomainName: string;
};

export type SettingsPageConnectedProps = {
	domain: ResponseDomain;
	currentRoute: string;
	hasDomainOnlySite: boolean;

	whoisData: WhoisData[];

	requestWhois: ( domain: string ) => void;
};

export type SettingsHeaderProps = {
	domain: ResponseDomain;
};
export type SettingsPageProps = SettingsPagePassedProps & SettingsPageConnectedProps;
