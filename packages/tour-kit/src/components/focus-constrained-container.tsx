/**
 * External Dependencies
 */
import { useConstrainedTabbing, useMergeRefs } from '@wordpress/compose';
import React, { Ref, forwardRef, ForwardRefRenderFunction } from 'react';
/**
 * Internal Dependencies
 */

interface Props {
	className: string;
	focusConstrained: boolean;
	children: React.ReactNode;
}

const FocusConstrainedContainer = forwardRef( ( props, ref ) => {
	const mergedRefs = useMergeRefs( [ useConstrainedTabbing(), ref ] );
	return <div ref={ mergedRefs } { ...props } />;
} );

const FocusNotConstrainedContainer = forwardRef( ( props, ref ) => {
	return <div ref={ ref as Ref< HTMLDivElement > | undefined } { ...props } />;
} );

const Container: ForwardRefRenderFunction< HTMLDivElement, Props > = (
	{ focusConstrained, ...props },
	ref
) => {
	return focusConstrained ? (
		<FocusConstrainedContainer ref={ ref } { ...props } />
	) : (
		<FocusNotConstrainedContainer ref={ ref } { ...props } />
	);
};

export default forwardRef( Container );
