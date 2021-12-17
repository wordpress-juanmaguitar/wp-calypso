import { useQuery, UseQueryResult, UseQueryOptions } from 'react-query';
import wpcom from 'calypso/lib/wp'; // eslint-disable-line no-restricted-imports
import { Design } from '../types';

// Ideally this data should come from the themes API, maybe by a tag that's applied to
// themes? e.g. `link-in-bio` or `no-fold`
const STATIC_PREVIEWS = [ 'bantry', 'sigler', 'miller', 'pollard', 'paxton', 'jones', 'baker' ];

export interface UseThemeDesignsQueryOptions {
	filter?: string;
	tier?:
		| '' // Returns all themes regardless of tier
		| 'free'
		| 'premium';
}

export function useThemeDesignsQuery(
	{ filter = '', tier = '' }: UseThemeDesignsQueryOptions = {},
	queryOptions: UseQueryOptions< unknown, unknown, Design[] > = {}
): UseQueryResult< Design[] > {
	return useQuery< any, unknown, Design[] >(
		[ 'themes', filter, tier ],
		() =>
			wpcom.req.get( '/themes', {
				search: '',
				number: 50,
				tier,
				filter,
				apiVersion: '1.2',
			} ),
		{
			// Our theme offering doesn't change that often, we don't need to
			// re-fetch until the next page refresh.
			staleTime: Infinity,

			select: ( response ) => response.themes.map( apiThemeToDesign ),

			...queryOptions,

			meta: {
				// Asks Calypso not to persist the data
				persist: false,
				...queryOptions.meta,
			},
		}
	);
}

function apiThemeToDesign( { id, name, taxonomies }: any ): Design {
	// Designs use a "featured" term in the theme_picks taxonomy. For example: Blank Canvas
	const isFeaturedPicks = !! taxonomies?.theme_picks?.find(
		( { slug }: any ) => slug === 'featured'
	);

	return {
		categories: taxonomies?.theme_subject ?? [],
		// Designs in order to appear prominently in theme galleries.
		showFirst: isFeaturedPicks,
		features: [],
		is_premium: false,
		// Designs in order to appear at the below of the theme categories.
		is_featured_picks: isFeaturedPicks,
		slug: id,
		template: id,
		theme: id,
		title: name,
		...( STATIC_PREVIEWS.includes( id ) && { preview: 'static' } ),
	};
}
