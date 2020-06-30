/**
 * WordPress dependencies
 */
import { createContext, useEffect, useState, useRef, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { useError } from '../utils/use-error';

export const Options = createContext();

/**
 * Context provider for options retrieval and updating.
 *
 * @param {Object} props Component props.
 * @param {?any} props.children Component children.
 * @param {string} props.optionsRestEndpoint REST endpoint to retrieve options.
 */
export function OptionsContextProvider( { children, optionsRestEndpoint } ) {
	const [ options, setOptions ] = useState( null );
	const [ fetchingOptions, setFetchingOptions ] = useState( false );
	const [ savingOptions, setSavingOptions ] = useState( false );
	const [ hasOptionsChanges, setHasOptionsChanges ] = useState( false );
	const [ didSaveOptions, setDidSaveOptions ] = useState( false );

	const { setError } = useError();

	const originalOptions = useRef();

	// This component sets state inside async functions. Use this ref to prevent state updates after unmount.
	const hasUnmounted = useRef( false );

	/**
	 * Sends options to the REST endpoint to be saved.
	 *
	 * @param {Object} data Plugin options to update.
	 */
	const saveOptions = useCallback( async () => {
		setSavingOptions( true );

		try {
			await apiFetch(
				{
					method: 'post',
					url: optionsRestEndpoint,
					data: { ...options, wizard_completed: true },
				},
			);

			if ( true === hasUnmounted.current ) {
				return;
			}
		} catch ( e ) {
			setError( e );
			return;
		}

		setDidSaveOptions( true );
		setSavingOptions( false );
	}, [ options, optionsRestEndpoint, setError ] );

	/**
	 * Updates options in state.
	 *
	 * @param {Object} newOptions Updated options values.
	 */
	const updateOptions = ( newOptions ) => {
		setHasOptionsChanges( true );
		setOptions( { ...options, ...newOptions } );
		setDidSaveOptions( false );
	};

	useEffect( () => {
		if ( options || fetchingOptions ) {
			return;
		}

		/**
		 * Fetches plugin options from the REST endpoint.
		 */
		( async () => {
			setFetchingOptions( true );

			try {
				const fetchedOptions = await apiFetch( { url: optionsRestEndpoint } );

				if ( true === hasUnmounted.current ) {
					return;
				}

				originalOptions.current = fetchedOptions;
				setOptions( fetchedOptions );
			} catch ( e ) {
				setError( e );
				return;
			}

			setFetchingOptions( false );
		} )();
	}, [ fetchingOptions, options, optionsRestEndpoint, setError ] );

	useEffect( () => () => {
		hasUnmounted.current = true;
	}, [] );

	return (
		<Options.Provider
			value={
				{
					fetchingOptions,
					hasOptionsChanges,
					didSaveOptions,
					options: options || {},
					originalOptions: originalOptions.current,
					saveOptions,
					savingOptions,
					updateOptions,
				}
			}
		>
			{ children }
		</Options.Provider>
	);
}

OptionsContextProvider.propTypes = {
	children: PropTypes.any,
	optionsRestEndpoint: PropTypes.string.isRequired,
};
