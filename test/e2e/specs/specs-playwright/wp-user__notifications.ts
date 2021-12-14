/**
 * @group quarantined
 */

import {
	setupHooks,
	DataHelper,
	LoginPage,
	NavbarComponent,
	NotificationsComponent,
	ReaderPage,
} from '@automattic/calypso-e2e';
import { Page } from 'playwright';

describe( DataHelper.createSuiteTitle( 'Notifications' ), function () {
	let page: Page;
	let readerPage: ReaderPage;
	let notificationsComponent: NotificationsComponent;

	const commentingUser = 'commentingUser';
	const notificationsUser = 'notificationsUser';
	const comment = DataHelper.getRandomPhrase() + ' notifications-trash-spec';

	setupHooks( ( args ) => {
		page = args.page;
	} );

	describe( `Leave a comment as ${ commentingUser }`, function () {
		it( `Log in as ${ commentingUser }`, async function () {
			const loginPage = new LoginPage( page );
			await loginPage.login( { account: commentingUser }, { landingUrl: '**/read' } );
		} );

		it( 'Visit latest post', async function () {
			readerPage = new ReaderPage( page );
			await readerPage.visitPost( { index: 1 } );
		} );

		it( 'Comment and confirm it is shown', async function () {
			await readerPage.comment( comment );
		} );
	} );

	describe( `Trash comment as ${ notificationsUser }`, function () {
		it( 'Clear browser cookies', async function () {
			await page.context().clearCookies();
		} );

		it( `Log in as ${ notificationsUser }`, async function () {
			const loginPage = new LoginPage( page );
			await loginPage.login( { account: notificationsUser } );
		} );

		it( 'Open notification using keyboard shortcut', async function () {
			const navbarComponent = new NavbarComponent( page );
			await navbarComponent.openNotificationsPanel( { useKeyboard: true } );
		} );

		it( `See and click notification for the comment left by ${ commentingUser }`, async function () {
			notificationsComponent = new NotificationsComponent( page );
			await notificationsComponent.clickNotification( comment );
		} );

		it( 'Delete comment from notification', async function () {
			await notificationsComponent.clickNotificationAction( 'Trash' );
		} );

		it( 'Confirm comment is trashed', async function () {
			await notificationsComponent.waitForUndoMessage();
			await notificationsComponent.waitForUndoMessageToDisappear();
		} );
	} );
} );
