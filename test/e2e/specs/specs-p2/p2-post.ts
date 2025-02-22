/**
 * @group p2
 */

import {
	setupHooks,
	DataHelper,
	P2Page,
	IsolatedBlockEditorComponent,
	ParagraphBlock,
	TestAccount,
} from '@automattic/calypso-e2e';
import { ElementHandle, Page } from 'playwright';

describe( DataHelper.createSuiteTitle( 'P2: Post' ), function () {
	let page: Page;
	let testAccount: TestAccount;
	let blockHandle: ElementHandle;
	let p2Page: P2Page;
	let isolatedBlockEditorComponent: IsolatedBlockEditorComponent;

	const postContent = DataHelper.getTimestamp();

	setupHooks( async ( args ) => {
		page = args.page;
		testAccount = new TestAccount( 'p2User' );
		await testAccount.authenticate( page );
	} );

	it( 'View P2', async function () {
		await page.goto( testAccount.getSiteURL(), { waitUntil: 'networkidle' } );
	} );

	it( 'Add a Paragraph block', async function () {
		p2Page = new P2Page( page );
		await p2Page.focusInlineEditor();

		isolatedBlockEditorComponent = new IsolatedBlockEditorComponent( page );
		blockHandle = await isolatedBlockEditorComponent.addBlock(
			ParagraphBlock.blockName,
			ParagraphBlock.blockEditorSelector
		);
	} );

	it( 'Enter text', async function () {
		const paragraphBlock = new ParagraphBlock( blockHandle );
		await paragraphBlock.enterParagraph( postContent );
	} );

	it( 'Submit post', async function () {
		await isolatedBlockEditorComponent.submitPost();
	} );

	it( 'Validate post submission was successful', async function () {
		await p2Page.validatePostContent( postContent );
	} );
} );
