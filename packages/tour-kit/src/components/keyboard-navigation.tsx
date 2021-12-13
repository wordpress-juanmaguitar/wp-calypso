/**
 * External dependencies
 */
import * as React from 'react';
/**
 * Internal dependencies
 */
import useKeydownHandler from '../hooks/use-keydown-handler';

interface Props {
	onMinimize: () => void;
	onDismiss: ( target: string ) => () => void;
	onNextStepProgression: () => void;
	onPreviousStepProgression: () => void;
	isMinimized: boolean;
}

const KeyboardNavigation: React.FunctionComponent< Props > = ( {
	onMinimize,
	onDismiss,
	onNextStepProgression,
	onPreviousStepProgression,
	isMinimized,
} ) => {
	function ExpandedTourNav() {
		useKeydownHandler( {
			onEscape: onMinimize,
			onArrowRight: onNextStepProgression,
			onArrowLeft: onPreviousStepProgression,
		} );

		return null;
	}

	function MinimizedTourNav() {
		useKeydownHandler( { onEscape: onDismiss( 'esc-key-minimized' ) } );

		return null;
	}

	return isMinimized ? <MinimizedTourNav /> : <ExpandedTourNav />;
};

export default KeyboardNavigation;
