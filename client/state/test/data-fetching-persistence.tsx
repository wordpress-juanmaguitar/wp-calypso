/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { createAsyncStoragePersistor } from 'react-query/createAsyncStoragePersistor-experimental';
import { persistQueryClient } from 'react-query/persistQueryClient-experimental';
import { shouldDehydrateQuery } from '../should-dehydrate-query';

const queryClient = new QueryClient();

const PERSISTENCE_KEY = 'REACT_QUERY_OFFLINE_CACHE';

const queryKey = '123';

class AsyncStorage {
	cache: Map< string, string >;

	constructor() {
		this.cache = new Map();
	}

	async getItem( key: string ) {
		return this.cache.get( key );
	}

	async setItem( key: string, value: string ) {
		this.cache.set( key, value );
	}

	async removeItem( key: string ) {
		this.cache.delete( key );
	}

	clear() {
		this.cache.clear();
	}
}

const storage = new AsyncStorage();

const getOfflinePersistence = () => storage.getItem( PERSISTENCE_KEY );

const offlinePersistor = createAsyncStoragePersistor( {
	storage,
	key: PERSISTENCE_KEY,
	throttleTime: 0,
} );

interface DataFetchingComponentProps< T > {
	queryFn(): Promise< T >;
	persistencePredicate?: boolean | ( ( data: T ) => boolean );
}

const DataFetchingComponent = < T, >( {
	queryFn,
	persistencePredicate,
}: DataFetchingComponentProps< T > ) => {
	useQuery( queryKey, queryFn, {
		meta: {
			persist: persistencePredicate != null ? persistencePredicate : undefined,
		},
	} );

	return null;
};

const TestComponent = < T, >( dataFetchingProps: DataFetchingComponentProps< T > ) => {
	return (
		<QueryClientProvider client={ queryClient }>
			<DataFetchingComponent { ...dataFetchingProps } />
		</QueryClientProvider>
	);
};

describe( 'shouldDehydrateQuery', () => {
	beforeAll( async () => {
		await persistQueryClient( {
			queryClient,
			persistor: offlinePersistor,
			dehydrateOptions: {
				shouldDehydrateQuery,
			},
		} );
	} );

	afterEach( () => {
		storage.clear();
	} );

	describe( 'when passing `false` to `shouldPersistQuery`', () => {
		it( 'does not persist the query', async () => {
			const data = 'Hello, World!';

			render( <TestComponent queryFn={ () => Promise.resolve( data ) } persistencePredicate /> );

			expect( await getOfflinePersistence() ).toBe( 1 );
		} );
	} );
} );
