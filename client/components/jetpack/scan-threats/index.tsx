import { Button } from '@automattic/components';
import { numberFormat, translate } from 'i18n-calypso';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import FixAllThreatsDialog from 'calypso/components/jetpack/fix-all-threats-dialog';
import SecurityIcon from 'calypso/components/jetpack/security-icon';
import ThreatDialog from 'calypso/components/jetpack/threat-dialog';
import ThreatItem from 'calypso/components/jetpack/threat-item';
import { FixableThreat, Threat, ThreatAction } from 'calypso/components/jetpack/threat-item/types';
import contactSupportUrl from 'calypso/lib/jetpack/contact-support-url';
import { triggerScanRun } from 'calypso/lib/jetpack/trigger-scan-run';
import { useThreats } from 'calypso/lib/jetpack/use-threats';
import { recordTracksEvent } from 'calypso/state/analytics/actions';

import './style.scss';

interface Site {
	ID: number;
	name: string;
	URL: string;
}

interface Props {
	site: Site;
	threats: Array< Threat >;
	error: boolean;
}

const ScanError: React.FC< { site: Site } > = ( { site } ) => {
	const dispatch = useDispatch();
	const dispatchScanRun = React.useCallback( () => {
		triggerScanRun( site.ID )( dispatch );
	}, [ dispatch, site ] );

	return (
		<div className="scan-threats__error">
			{ translate(
				'The scanner was unable to check all files and errored before completion. Deal with the threats found above and run the {{runScan}}scan again{{/runScan}}. If the error persists, we are {{linkToSupport}}here to help{{/linkToSupport}}.',
				{
					components: {
						runScan: (
							<Button className="scan-threats__run-scan-button" onClick={ dispatchScanRun } />
						),
						linkToSupport: (
							<a href={ contactSupportUrl( site.URL ) } rel="noopener noreferrer" target="_blank" />
						),
					},
				}
			) }
		</div>
	);
};

const ScanThreats = ( { error, site, threats }: Props ) => {
	const {
		updatingThreats,
		selectedThreat,
		setSelectedThreat,
		fixThreats,
		updateThreat,
	} = useThreats( site.ID );
	const [ showThreatDialog, setShowThreatDialog ] = React.useState( false );
	const [ showFixAllThreatsDialog, setShowFixAllThreatsDialog ] = React.useState( false );
	const [ actionToPerform, setActionToPerform ] = React.useState< ThreatAction >( 'fix' );
	const dispatch = useDispatch();
	const dispatchScanRun = React.useCallback( () => {
		triggerScanRun( site.ID )( dispatch );
	}, [ dispatch, site ] );

	const allFixableThreats = threats.filter(
		( threat ): threat is FixableThreat =>
			threat.fixable !== false && threat.fixerStatus !== 'in_progress'
	);
	const hasFixableThreats = !! allFixableThreats.length;

	const openFixAllThreatsDialog = React.useCallback( () => {
		dispatch(
			recordTracksEvent( `calypso_jetpack_scan_allthreats_open`, {
				site_id: site.ID,
			} )
		);
		setShowFixAllThreatsDialog( true );
	}, [ dispatch, site ] );

	const openDialog = React.useCallback(
		( action: ThreatAction, threat: Threat ) => {
			const eventName =
				action === 'fix'
					? 'calypso_jetpack_scan_fixthreat_dialogopen'
					: 'calypso_jetpack_scan_ignorethreat_dialogopen';
			dispatch(
				recordTracksEvent( eventName, {
					site_id: site.ID,
					threat_signature: threat.signature,
				} )
			);
			setSelectedThreat( threat );
			setActionToPerform( action );
			setShowThreatDialog( true );
		},
		[ dispatch, setSelectedThreat, site ]
	);

	const closeDialog = React.useCallback( () => {
		setShowThreatDialog( false );
	}, [] );

	const confirmAction = React.useCallback( () => {
		closeDialog();
		updateThreat( actionToPerform );
	}, [ actionToPerform, closeDialog, updateThreat ] );

	const confirmFixAllThreats = React.useCallback( () => {
		setShowFixAllThreatsDialog( false );
		fixThreats( allFixableThreats );
	}, [ allFixableThreats, fixThreats ] );

	const isFixing = React.useCallback(
		( threat: Threat ) => {
			return (
				!! updatingThreats.find( ( threatId ) => threatId === threat.id ) ||
				threat.fixerStatus === 'in_progress'
			);
		},
		[ updatingThreats ]
	);

	/* eslint-disable wpcalypso/i18n-mismatched-placeholders */
	return (
		<>
			<SecurityIcon icon="error" />
			<h1 className="scan-threats scan__header">{ translate( 'Your site may be at risk' ) }</h1>
			<p>
				{ translate(
					'Jetpack Scan found {{strong}}%(threatCount)s{{/strong}} potential threat on {{strong}}%(siteName)s{{/strong}}. Please review the threat and take action.',
					'Jetpack Scan found {{strong}}%(threatCount)s{{/strong}} potential threats on {{strong}}%(siteName)s{{/strong}}. Please review each threat and take action.',
					{
						args: {
							siteName: site.name,
							threatCount: numberFormat( threats.length, 0 ),
						},
						components: {
							strong: <strong />,
						},
						comment:
							'%(threatCount)s represents the number of threats currently identified on the site, and $(siteName)s is the name of the site. The {{a}} tag is a link that goes to a contact support page.',
						count: threats.length,
					}
				) }
			</p>
			<div className="scan-threats__threats">
				<div className="scan-threats__buttons">
					{ hasFixableThreats && (
						<>
							<p>
								{ translate(
									'Jetpack can auto fix 1 found threat.',
									'Jetpack can auto fix %(fixableCount)s of %(threatCount)s found threats.',
									{
										args: {
											fixableCount: numberFormat( allFixableThreats.length, 0 ),
											threatCount: numberFormat( threats.length, 0 ),
										},
										comment:
											'%(fixableCount)s represents the number of auto fixable threats, %(threatCount)s represents the number of threats currently identified on the site',
										count: allFixableThreats.length,
									}
								) }
							</p>
							<Button
								primary
								className="scan-threats__fix-all-threats-button"
								onClick={ openFixAllThreatsDialog }
								disabled={ ! hasFixableThreats || updatingThreats.length > 0 }
							>
								{ translate(
									'Auto fix %(fixableCount)s threat',
									'Auto fix %(fixableCount)s threats',
									{
										args: {
											fixableCount: numberFormat( allFixableThreats.length, 0 ),
										},
										comment:
											'%(fixableCount)s represents the number of auto fixable threats on the site',
										count: allFixableThreats.length,
									}
								) }
							</Button>
						</>
					) }
				</div>
				{ threats.map( ( threat ) => (
					<ThreatItem
						key={ threat.id }
						threat={ threat }
						onFixThreat={ () => openDialog( 'fix', threat ) }
						onIgnoreThreat={ () => openDialog( 'ignore', threat ) }
						isFixing={ isFixing( threat ) }
						contactSupportUrl={ contactSupportUrl( site.URL ) }
						isPlaceholder={ false }
					/>
				) ) }
			</div>

			{ ! error && (
				<div className="scan-threats__rerun">
					<p className="scan-threats__rerun-help">
						{ translate(
							'If you have manually fixed any of the threats above, you can {{button}}run a scan now{{/button}} or wait for Jetpack to scan your site later today.',
							{
								components: {
									button: (
										<Button className="scan-threats__run-scan-button" onClick={ dispatchScanRun } />
									),
								},
							}
						) }
					</p>
					<Button className="scan-threats__run-scan-main-button" onClick={ dispatchScanRun }>
						{ translate( 'Scan again' ) }
					</Button>
				</div>
			) }

			{ error && <ScanError site={ site } /> }

			{ selectedThreat && (
				<ThreatDialog
					showDialog={ showThreatDialog }
					onCloseDialog={ closeDialog }
					onConfirmation={ confirmAction }
					siteName={ site.name }
					threat={ selectedThreat }
					action={ actionToPerform }
				/>
			) }
			<FixAllThreatsDialog
				threats={ allFixableThreats }
				showDialog={ showFixAllThreatsDialog }
				onCloseDialog={ () => setShowFixAllThreatsDialog( false ) }
				onConfirmation={ confirmFixAllThreats }
			/>
		</>
	);
};
/* eslint-enable wpcalypso/i18n-mismatched-placeholders */

export default ScanThreats;
