/**
 * @group gutenberg
 */

import { DataHelper, GutenbergEditorPage, setupHooks, TestAccount } from '@automattic/calypso-e2e';
import { Page } from 'playwright';
import { getLatestEvent } from '../../lib/gutenberg/tracking/playwright-utils';

describe( DataHelper.createSuiteTitle( `Tracks Events for Post Editor` ), function () {
	let page: Page;
	let gutenbergEditorPage: GutenbergEditorPage;

	setupHooks( async ( args ) => {
		page = args.page;
		gutenbergEditorPage = new GutenbergEditorPage( page );
		const testAccount = new TestAccount( 'gutenbergSimpleSiteUser' );
		await testAccount.authenticate( page );
	} );

	it( 'Go to the new post page', async function () {
		await gutenbergEditorPage.visit( 'post' );
	} );

	it( 'Enter post title', async function () {
		await gutenbergEditorPage.enterTitle( DataHelper.getRandomPhrase() );
	} );

	it( 'Tracks "wpcom_block_editor_post_publish_add_new_click" event', async function () {
		await gutenbergEditorPage.publish();
		// Get the frame before creating the new post because we won't be able to access it once navigation starts
		const frame = await gutenbergEditorPage.waitUntilLoaded();
		await gutenbergEditorPage.postPublishAddNewItem( { noWaitAfter: true } );

		expect( await getLatestEvent( frame ) ).toMatchObject( [
			'wpcom_block_editor_post_publish_add_new_click',
			expect.objectContaining( {
				_en: 'wpcom_block_editor_post_publish_add_new_click',
				editor_type: 'post',
				post_type: 'post',
			} ),
		] );
	} );
} );
