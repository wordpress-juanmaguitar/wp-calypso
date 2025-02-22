/**
 * @group gutenberg
 * @group coblocks
 */
import {
	setupHooks,
	BrowserHelper,
	DataHelper,
	MediaHelper,
	GutenbergEditorPage,
	TestFile,
	ClicktoTweetBlock,
	DynamicHRBlock,
	HeroBlock,
	LogosBlock,
	PricingTableBlock,
	TestAccount,
} from '@automattic/calypso-e2e';
import { Page } from 'playwright';
import { TEST_IMAGE_PATH } from '../constants';

let accountName: string;
if ( BrowserHelper.targetCoBlocksEdge() ) {
	accountName = 'coBlocksSimpleSiteEdgeUser';
} else if ( BrowserHelper.targetGutenbergEdge() ) {
	accountName = 'gutenbergSimpleSiteEdgeUser';
} else {
	accountName = 'gutenbergSimpleSiteUser';
}

describe( DataHelper.createSuiteTitle( 'CoBlocks: Blocks' ), () => {
	let page: Page;
	let testAccount: TestAccount;
	let gutenbergEditorPage: GutenbergEditorPage;
	let pricingTableBlock: PricingTableBlock;
	let logoImage: TestFile;

	// Test data
	const pricingTableBlockPrices = [ 4.99, 9.99 ];
	const heroBlockHeading = 'Hero heading';
	const clicktoTweetBlockTweet = 'Tweet text';

	setupHooks( async ( args ) => {
		page = args.page;
		logoImage = await MediaHelper.createTestFile( TEST_IMAGE_PATH );
		testAccount = new TestAccount( accountName );
		gutenbergEditorPage = new GutenbergEditorPage( page );

		await testAccount.authenticate( page );
	} );

	it( 'Go to the new post page', async () => {
		await gutenbergEditorPage.visit( 'post' );
	} );

	it( `Insert ${ PricingTableBlock.blockName } block and enter prices`, async function () {
		const blockHandle = await gutenbergEditorPage.addBlock(
			PricingTableBlock.blockName,
			PricingTableBlock.blockEditorSelector
		);
		pricingTableBlock = new PricingTableBlock( blockHandle );
		await pricingTableBlock.enterPrice( 1, pricingTableBlockPrices[ 0 ] );
		await pricingTableBlock.enterPrice( 2, pricingTableBlockPrices[ 1 ] );
	} );

	it( `Insert ${ DynamicHRBlock.blockName } block`, async function () {
		await gutenbergEditorPage.addBlock(
			DynamicHRBlock.blockName,
			DynamicHRBlock.blockEditorSelector
		);
	} );

	it( `Insert ${ HeroBlock.blockName } block and enter heading`, async function () {
		const blockHandle = await gutenbergEditorPage.addBlock(
			HeroBlock.blockName,
			HeroBlock.blockEditorSelector
		);
		const heroBlock = new HeroBlock( blockHandle );
		await heroBlock.enterHeading( heroBlockHeading );
	} );

	it( `Insert ${ ClicktoTweetBlock.blockName } block and enter tweet content`, async function () {
		const blockHandle = await gutenbergEditorPage.addBlock(
			ClicktoTweetBlock.blockName,
			ClicktoTweetBlock.blockEditorSelector
		);
		const clickToTweetBlock = new ClicktoTweetBlock( blockHandle );
		await clickToTweetBlock.enterTweetContent( clicktoTweetBlockTweet );
	} );

	it( `Insert ${ LogosBlock.blockName } block and set image`, async function () {
		const blockHandle = await gutenbergEditorPage.addBlock(
			LogosBlock.blockName,
			LogosBlock.blockEditorSelector
		);
		const logosBlock = new LogosBlock( blockHandle );
		await logosBlock.upload( logoImage.fullpath );
	} );

	it( 'Publish and visit the post', async function () {
		await gutenbergEditorPage.publish( { visit: true } );
	} );

	// Pass in a 1D array of values or text strings to validate each block.
	it.each`
		block                  | content
		${ PricingTableBlock } | ${ pricingTableBlockPrices }
		${ DynamicHRBlock }    | ${ null }
		${ HeroBlock }         | ${ [ heroBlockHeading ] }
		${ ClicktoTweetBlock } | ${ [ clicktoTweetBlockTweet ] }
	`(
		`Confirm $block.blockName block is visible in published post`,
		async ( { block, content } ) => {
			// Pass the Block object class here then call the static method to validate.
			await block.validatePublishedContent( page, content );
		}
	);

	it( `Confirm Logos block is visible in published post`, async () => {
		await LogosBlock.validatePublishedContent( page, [ logoImage.filename ] );
	} );
} );
