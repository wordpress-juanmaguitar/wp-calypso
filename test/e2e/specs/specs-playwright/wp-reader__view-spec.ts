/**
 * @group calypso-pr
 */

import { DataHelper, LoginPage, setupHooks, ReaderPage } from '@automattic/calypso-e2e';
import { Page } from 'playwright';

describe( DataHelper.createSuiteTitle( 'Reader: View and Comment' ), function () {
	let page: Page;
	let readerPage: ReaderPage;

	setupHooks( ( args: { page: Page } ) => {
		page = args.page;
	} );

	it( 'Log in', async function () {
		const loginPage = new LoginPage( page );
		await loginPage.login( { account: 'commentingUser' }, { landingUrl: '**/read' } );
	} );

	it( 'View the Reader stream', async function () {
		readerPage = new ReaderPage( page );
		const testSiteForNotifications = DataHelper.config.get( 'testSiteForNotifications' );
		const siteOfLatestPost = await readerPage.siteOfLatestPost();
		expect( siteOfLatestPost ).toEqual( testSiteForNotifications );
	} );

	it( 'Visit latest post', async function () {
		await readerPage.visitPost( { index: 1 } );
	} );
} );
