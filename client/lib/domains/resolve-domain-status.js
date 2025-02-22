import { Button } from '@automattic/components';
import { translate } from 'i18n-calypso';
import moment from 'moment';
import { isExpiringSoon } from 'calypso/lib/domains/utils/is-expiring-soon';
import { isRecentlyRegistered } from 'calypso/lib/domains/utils/is-recently-registered';
import { hasPendingGSuiteUsers } from 'calypso/lib/gsuite';
import { shouldRenderExpiringCreditCard, handleRenewNowClick } from 'calypso/lib/purchases';
import {
	SETTING_PRIMARY_DOMAIN,
	INCOMING_DOMAIN_TRANSFER_STATUSES,
	INCOMING_DOMAIN_TRANSFER_STATUSES_IN_PROGRESS,
	GDPR_POLICIES,
} from 'calypso/lib/url/support';
import {
	domainManagementEditContactInfo,
	domainManagementNameServers,
	domainMappingSetup,
} from 'calypso/my-sites/domains/paths';
import { transferStatus, type as domainTypes, gdprConsentStatus } from './constants';

export function resolveDomainStatus(
	domain,
	purchase = null,
	{
		isJetpackSite = null,
		isSiteAutomatedTransfer = null,
		isDomainOnlySite = false,
		siteSlug = null,
		getMappingErrors = false,
	} = {}
) {
	const transferOptions = {
		components: {
			strong: <strong />,
			a: (
				<a
					href={ INCOMING_DOMAIN_TRANSFER_STATUSES_IN_PROGRESS }
					rel="noopener noreferrer"
					target="_blank"
					onClick={ ( e ) => e.stopPropagation() }
				/>
			),
		},
		args: {
			transferFinishDate: moment.utc( domain.transferEndDate ).format( 'LL' ),
		},
	};

	switch ( domain.type ) {
		case domainTypes.MAPPED:
			if ( isExpiringSoon( domain, 30 ) ) {
				const expiresMessage =
					null !== domain.bundledPlanSubscriptionId
						? translate(
								'Domain connection expires with your plan on {{strong}}%(expiryDate)s{{/strong}}',
								{
									args: { expiryDate: moment.utc( domain.expiry ).format( 'LL' ) },
									components: { strong: <strong /> },
								}
						  )
						: translate( 'Domain connection expires in {{strong}}%(days)s{{/strong}}', {
								args: { days: moment.utc( domain.expiry ).fromNow( true ) },
								components: { strong: <strong /> },
						  } );

				if ( isExpiringSoon( domain, 5 ) ) {
					return {
						statusText: expiresMessage,
						statusClass: 'status-error',
						status: translate( 'Expiring soon' ),
						icon: 'info',
						listStatusText: expiresMessage,
						listStatusClass: 'alert',
						listStatusWeight: 1000,
					};
				}

				return {
					statusText: expiresMessage,
					statusClass: 'status-warning',
					status: translate( 'Expiring soon' ),
					icon: 'info',
					listStatusText: expiresMessage,
					listStatusClass: 'warning',
					listStatusWeight: 800,
				};
			}

			if ( getMappingErrors ) {
				const registrationDatePlus3Days = moment.utc( domain.registrationDate ).add( 3, 'days' );

				const hasMappingError =
					domain.type === domainTypes.MAPPED &&
					! domain.pointsToWpcom &&
					moment.utc().isAfter( registrationDatePlus3Days );

				if ( hasMappingError ) {
					const setupStep =
						domain.connectionMode === 'advanced' ? 'advanced_update' : 'suggested_update';
					const options = {
						components: {
							strong: <strong />,
							a: (
								<a
									href={ domainMappingSetup( siteSlug, domain.domain, setupStep ) }
									onClick={ ( e ) => e.stopPropagation() }
								/>
							),
						},
					};

					let status;
					if ( domain?.connectionMode === 'advanced' ) {
						status = translate(
							'{{strong}}Connection error:{{/strong}} The A records are incorrect. Please {{a}}try this step{{/a}} again.',
							options
						);
					} else {
						status = translate(
							'{{strong}}Connection error:{{/strong}} The name servers are incorrect. Please {{a}}try this step{{/a}} again.',
							options
						);
					}
					return {
						statusText: translate( 'Connection error' ),
						statusClass: 'status-alert',
						status: translate( 'Error' ),
						icon: 'info',
						listStatusText: status,
						noticeText: translate(
							"We noticed that something wasn't updated correctly. Please try {{a}}this setup{{/a}} again.",
							options
						),
						listStatusClass: 'alert',
						listStatusWeight: 1000,
					};
				}
			}

			if ( ( ! isJetpackSite || isSiteAutomatedTransfer ) && ! domain.pointsToWpcom ) {
				const status = translate(
					'{{strong}}Verifying connection:{{/strong}} You can continue to work on your site, but you domain won’t be reachable just yet.',
					{
						components: {
							strong: <strong />,
						},
					}
				);
				return {
					statusText: translate( 'Verifying' ),
					statusClass: 'status-success',
					status: translate( 'Verifying' ),
					icon: 'verifying',
					listStatusText: status,
					noticeText: translate(
						'It can take between a few minutes to 72 hours to verify the connection. You can continue to work on your site, but {{strong}}%(domainName)s{{/strong}} won’t be reachable just yet.',
						{
							components: {
								strong: <strong />,
							},
							args: {
								domainName: domain.name,
							},
						}
					),
					listStatusClass: 'verifying',
					listStatusWeight: 600,
				};
			}

			if ( hasPendingGSuiteUsers( domain ) ) {
				return {
					statusText: translate( 'Action required' ),
					statusClass: 'status-error',
					status: translate( 'Action required' ),
					icon: 'info',
					listStatusWeight: 600,
				};
			}

			return {
				statusText: translate( 'Active' ),
				statusClass: 'status-success',
				status: translate( 'Active' ),
				icon: 'check_circle',
			};

		case domainTypes.REGISTERED:
			if ( domain.isPendingRenewal ) {
				const pendingRenewalMessage = translate( 'Renewal in progress' );
				return {
					statusText: pendingRenewalMessage,
					statusClass: 'status-success',
					status: translate( 'Renewing' ),
					icon: 'info',
					listStatusText: pendingRenewalMessage,
					noticeText: translate( 'Attempting to get it renewed for you.' ),
					listStatusClass: 'warning',
					listStatusWeight: 400,
				};
			}

			if ( domain.pendingTransfer ) {
				return {
					statusText: translate( 'Outbound transfer initiated' ),
					statusClass: 'status-success',
					status: translate( 'In progress' ),
					icon: 'cached',
				};
			}

			if ( purchase && shouldRenderExpiringCreditCard( purchase ) ) {
				return {
					statusText: translate( 'Action required' ),
					statusClass: 'status-error',
					status: translate( 'Action required' ),
					icon: 'info',
					listStatusWeight: 600,
				};
			}

			if ( domain.isPendingIcannVerification && domain.isIcannVerificationSuspended ) {
				return {
					statusText: translate( 'Suspended' ),
					statusClass: 'status-error',
					status: translate( 'Suspended' ),
					icon: 'info',
					listStatusWeight: 800,
				};
			}

			if ( domain.isPendingIcannVerification && domain.currentUserCanManage ) {
				const noticeText = domain.currentUserIsOwner
					? translate(
							'We sent you an email to verify your contact information. Please complete the verification or your domain will stop working. You can also {{a}}change your email address{{/a}} if you like.',
							{
								components: {
									a: <a href={ domainManagementEditContactInfo( siteSlug, domain.name ) }></a>,
								},
								args: {
									domainName: domain.name,
								},
							}
					  )
					: translate(
							'We sent an email to the domain owner. Please complete the verification or your domain will stop working.'
					  );

				return {
					statusText: translate( 'Action required' ),
					statusClass: 'status-error',
					status: translate( 'Verify email' ),
					noticeText,
					icon: 'info',
					listStatusWeight: 600,
				};
			}

			if ( domain.expired ) {
				const daysSinceExpiration = moment.utc().diff( moment.utc( domain.expiry ), 'days' );

				let renewCta;

				if ( daysSinceExpiration >= 1 && daysSinceExpiration <= 43 ) {
					const renewableUntil = moment.utc( domain.renewableUntil ).format( 'LL' );

					renewCta = domain.currentUserIsOwner
						? translate(
								'You can renew the domain at the regular rate until {{strong}}%(renewableUntil)s{{/strong}}. {{a}}Renew now{{/a}}',
								{
									components: {
										strong: <strong />,
										a: <Button plain onClick={ () => handleRenewNowClick( purchase, siteSlug ) } />,
									},
									args: { renewableUntil },
								}
						  )
						: translate(
								'The domain owner can renew the domain at the regular rate until {{strong}}%(renewableUntil)s{{/strong}}.',
								{
									components: {
										strong: <strong />,
									},
									args: { renewableUntil },
								}
						  );
				}

				if ( daysSinceExpiration > 43 ) {
					const redeemableUntil = moment.utc( domain.redeemableUntil ).format( 'LL' );

					renewCta = domain.currentUserIsOwner
						? translate(
								'You can still renew the domain until {{strong}}%(redeemableUntil)s{{/strong}} by paying an additional redemption fee. {{a}}Renew now{{/a}}',
								{
									components: {
										strong: <strong />,
										a: <Button plain onClick={ () => handleRenewNowClick( purchase, siteSlug ) } />,
									},
									args: { redeemableUntil },
								}
						  )
						: translate(
								'The domain owner can still renew the domain until {{strong}}%(redeemableUntil)s{{/strong}} by paying an additional redemption fee.',
								{
									components: {
										strong: <strong />,
									},
									args: { redeemableUntil },
								}
						  );
				}

				const domainExpirationMessage = translate(
					'This domain expired on {{strong}}%(expiryDate)s{{/strong}}. ',
					{
						components: {
							strong: <strong />,
						},
						args: {
							expiryDate: moment.utc( domain.expiry ).format( 'LL' ),
							renewCta,
						},
					}
				);

				const noticeText = [ domainExpirationMessage, renewCta ];

				return {
					statusText: translate( 'Action required' ),
					statusClass: 'status-error',
					status: translate( 'Expired' ),
					icon: 'info',
					listStatusText: translate( 'Expired %(timeSinceExpiry)s', {
						args: {
							timeSinceExpiry: moment.utc( domain.expiry ).fromNow(),
						},
						comment:
							'timeSinceExpiry is of the form "[number] [time-period] ago" e.g. "3 days ago"',
					} ),
					noticeText,
					listStatusClass: 'alert',
					listStatusWeight: 1000,
				};
			}

			if ( isExpiringSoon( domain, 30 ) ) {
				const renewCta = domain.currentUserIsOwner
					? translate( '{{a}}Renew now{{/a}}', {
							components: {
								a: <Button plain onClick={ () => handleRenewNowClick( purchase, siteSlug ) } />,
							},
					  } )
					: translate( 'It can be renewed by the owner.' );

				const domainExpirationMessage = translate(
					'This domain will expire on {{strong}}%(expiryDate)s{{/strong}}. ',
					{
						args: { expiryDate: moment.utc( domain.expiry ).format( 'LL' ) },
						components: { strong: <strong /> },
					}
				);

				const expiresMessage = [ domainExpirationMessage, renewCta ];

				if ( isExpiringSoon( domain, 5 ) ) {
					return {
						statusText: domainExpirationMessage,
						statusClass: 'status-error',
						status: translate( 'Expiring soon' ),
						icon: 'info',
						listStatusText: domainExpirationMessage,
						noticeText: expiresMessage,
						listStatusClass: 'alert',
						listStatusWeight: 1000,
					};
				}

				return {
					statusText: expiresMessage,
					statusClass: 'status-warning',
					status: translate( 'Expiring soon' ),
					icon: 'info',
					listStatusText: expiresMessage,
					noticeText: expiresMessage,
					listStatusClass: 'warning',
					listStatusWeight: 800,
				};
			}

			if ( isRecentlyRegistered( domain.registrationDate ) ) {
				let noticeText;
				if ( domain.isPrimary ) {
					noticeText = translate(
						'We are setting up your domain. It should start working immediately, but may be unreliable during the first 30 minutes. If you are unable to access your site at {{strong}}%(domainName)s{{/strong}}, try setting the primary domain to a domain you know is working. {{learnMore}}Learn more{{/learnMore}} about setting the primary domain, or try {{try}}{{strong}}%(domainName)s{{/strong}}{{/try}} now.',
						{
							args: {
								domainName: domain.name,
							},
							components: {
								strong: <strong />,
								learnMore: (
									<a href={ SETTING_PRIMARY_DOMAIN } rel="noopener noreferrer" target="_blank" />
								),
								try: (
									<a href={ `http://${ domain.name }` } rel="noopener noreferrer" target="_blank" />
								),
							},
						}
					);
				} else {
					noticeText = translate(
						'We are setting up your domain. It should start working immediately, but may be unreliable during the first 30 minutes.'
					);
				}

				return {
					statusText: translate( 'Activating' ),
					statusClass: 'status-success',
					status: translate( 'Activating' ),
					icon: 'cloud_upload',
					listStatusText: translate( 'Activating' ),
					noticeText,
					listStatusClass: 'info',
					listStatusWeight: 400,
				};
			}

			if ( hasPendingGSuiteUsers( domain ) ) {
				return {
					statusText: translate( 'Action required' ),
					statusClass: 'status-error',
					status: translate( 'Action required' ),
					icon: 'info',
					listStatusWeight: 600,
				};
			}

			if ( isDomainOnlySite ) {
				return {
					statusText: translate( 'Parked' ),
					statusClass: 'status-neutral',
					status: translate( 'Parked' ),
					icon: 'download_done',
				};
			}

			if ( domain?.isPremium ) {
				return {
					statusText: translate( 'Active' ),
					statusClass: 'status-premium',
					status: translate( 'Active' ),
					icon: 'check_circle',
					listStatusClass: 'premium',
				};
			}

			if ( domain.transferStatus === transferStatus.COMPLETED && ! domain.pointsToWpcom ) {
				return {
					statusText: translate( 'Action required' ),
					statusClass: 'status-success',
					status: translate( 'Active' ),
					icon: 'info',
					listStatusText: translate(
						'{{strong}}Point to WordPress.com:{{/strong}} To point this domain to your WordPress.com site, you need to update the name servers. {{a}}Update now{{/a}} or do this later.',
						{
							components: {
								strong: <strong />,
								a: (
									<a
										href={ domainManagementNameServers( siteSlug, domain.domain ) }
										onClick={ ( e ) => e.stopPropagation() }
									/>
								),
							},
						}
					),
					noticeText: translate(
						'{{strong}}Transfer successful!{{/strong}} To make this domain work with your WordPress.com site you need {{a}}point it to WordPress.com name servers.{{/a}}',
						{
							components: {
								strong: <strong />,
								a: <a href={ domainManagementNameServers( siteSlug, domain.domain ) } />,
							},
						}
					),
					listStatusClass: 'transfer-warning',
					listStatusWeight: 600,
				};
			}

			if (
				gdprConsentStatus.PENDING_ASYNC === domain.gdprConsentStatus ||
				domain.pendingRegistration
			) {
				const detailCta = domain.currentUserIsOwner
					? translate( 'Please check the email sent to you for further details' )
					: translate( 'Please check the email sent to the domain owner for further details' );

				const noticeText = translate(
					'This domain requires explicit user consent to complete the registration. %(detailCta)s. {{a}}Learn more{{/a}}',
					{
						components: {
							a: <a href={ GDPR_POLICIES } />,
						},
						args: { detailCta },
					}
				);
				return {
					statusText: noticeText,
					statusClass: 'status-warning',
					status: translate( 'Pending' ),
					icon: 'info',
					listStatusText: noticeText,
					noticeText: noticeText,
					listStatusClass: 'warning',
					listStatusWeight: 400,
				};
			}

			return {
				statusText: translate( 'Active' ),
				statusClass: 'status-success',
				status: translate( 'Active' ),
				icon: 'check_circle',
			};

		case domainTypes.SITE_REDIRECT:
			if ( purchase && shouldRenderExpiringCreditCard( purchase ) ) {
				return {
					statusText: translate( 'Action required' ),
					statusClass: 'status-error',
					status: translate( 'Action required' ),
					icon: 'info',
					listStatusWeight: 600,
				};
			}

			return {
				statusText: translate( 'Active' ),
				statusClass: 'status-success',
				status: translate( 'Active' ),
				icon: 'check_circle',
			};

		case domainTypes.WPCOM:
			return {
				statusText: translate( 'Active' ),
				statusClass: 'status-success',
				status: translate( 'Active' ),
				icon: 'check_circle',
			};

		case domainTypes.TRANSFER:
			if ( domain.transferStatus === transferStatus.PENDING_START ) {
				return {
					statusText: translate( 'Complete setup' ),
					statusClass: 'status-warning',
					status: translate( 'Complete setup' ),
					icon: 'info',
					listStatusText: translate(
						'{{strong}}Transfer waiting:{{/strong}} Follow {{a}}these steps{{/a}} by %(beginTransferUntilDate)s to start the transfer.',
						{
							components: {
								strong: <strong />,
								a: (
									<a
										href={ INCOMING_DOMAIN_TRANSFER_STATUSES }
										rel="noopener noreferrer"
										target="_blank"
										onClick={ ( e ) => e.stopPropagation() }
									/>
								),
							},
							args: {
								beginTransferUntilDate: moment.utc( domain.beginTransferUntilDate ).format( 'LL' ),
							},
						}
					),
					noticeText: translate(
						'Please follow {{a}}these instructions{{/a}} to start the transfer.',
						{
							components: {
								a: (
									<a
										href={ INCOMING_DOMAIN_TRANSFER_STATUSES }
										rel="noopener noreferrer"
										target="_blank"
									/>
								),
							},
						}
					),
					listStatusClass: 'transfer-warning',
					listStatusWeight: 600,
				};
			} else if ( domain.transferStatus === transferStatus.CANCELLED ) {
				return {
					statusText: translate( 'Transfer failed' ),
					statusClass: 'status-error',
					status: translate( 'Failed' ),
					icon: 'info',
					listStatusText: translate(
						'{{strong}}Transfer failed:{{/strong}} this transfer has failed. {{a}}Learn more{{/a}}',
						transferOptions
					),
					noticeText: translate(
						'Transfer failed. Learn the possible {{a}}reasons why{{/a}}.',
						transferOptions
					),
					listStatusClass: 'alert',
					listStatusWeight: 1000,
				};
			} else if ( domain.transferStatus === transferStatus.PENDING_REGISTRY ) {
				if ( domain.transferEndDate ) {
					return {
						statusText: translate( 'Transfer in progress' ),
						statusClass: 'status-success',
						status: translate( 'In progress' ),
						icon: 'info',
						listStatusText: translate(
							'{{strong}}Transfer in progress:{{/strong}} the transfer should be completed by %(transferFinishDate)s. We are waiting for approval from your current domain provider to proceed. {{a}}Learn more{{/a}}',
							transferOptions
						),
						noticeText: translate(
							'The transfer should complete by {{strong}}%(transferFinishDate)s{{/strong}}. We are waiting for authorization from your current domain provider to proceed. {{a}}Learn more{{/a}}',
							transferOptions
						),
						listStatusClass: 'verifying',
						listStatusWeight: 200,
					};
				}
				return {
					statusText: translate( 'Transfer in progress' ),
					statusClass: 'status-success',
					status: translate( 'In progress' ),
					icon: 'info',
					listStatusText: translate(
						'{{strong}}Transfer in progress:{{/strong}} We are waiting for approval from your current domain provider to proceed. {{a}}Learn more{{/a}}',
						transferOptions
					),
					noticeText: translate(
						'We are waiting for authorization from your current domain provider to proceed. {{a}}Learn more{{/a}}',
						transferOptions
					),
					listStatusClass: 'verifying',
					listStatusWeight: 200,
				};
			}

			return {
				statusText: translate( 'Transfer in progress' ),
				statusClass: 'status-success',
				status: translate( 'In progress' ),
				icon: 'cached',
				listStatusText: translate(
					'{{strong}}Transfer in progress.{{/strong}} {{a}}Learn more{{/a}}',
					transferOptions
				),
				noticeText: domain.transferEndDate
					? translate(
							'The transfer should complete by {{strong}}%(transferFinishDate)s{{/strong}}. {{a}}Learn more{{/a}}',
							transferOptions
					  )
					: null,
				listStatusClass: 'verifying',
				listStatusWeight: 200,
			};

		default:
			return {};
	}
}
