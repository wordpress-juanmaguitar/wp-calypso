/**
 * @group gutenberg
 * @group calypso-pr
 */

import {
	DataHelper,
	NewPostFlow,
	GutenbergEditorPage,
	setupHooks,
	BrowserManager,
} from '@automattic/calypso-e2e';
import { Page } from 'playwright';

describe( DataHelper.createSuiteTitle( `Editor: Navbar` ), function () {
	let page: Page;

	setupHooks( ( args ) => {
		page = args.page;
	} );

	it( 'Log in', async function () {
		await BrowserManager.authenticateTestAccount( page, 'simpleSitePersonalPlanUser' );
	} );

	it( 'Start new post', async function () {
		const newPostFlow = new NewPostFlow( page );
		await newPostFlow.newPostFromNavbar();
	} );

	it( 'Return to Calypso dashboard', async function () {
		const gutenbergEditorPage = new GutenbergEditorPage( page );
		await gutenbergEditorPage.returnToCalypsoDashboard();
	} );
} );
