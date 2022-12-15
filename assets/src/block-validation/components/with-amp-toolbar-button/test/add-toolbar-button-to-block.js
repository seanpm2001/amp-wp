/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { dispatch } from '@wordpress/data';
import { registerBlockType, createBlock } from '@wordpress/blocks';
import '@wordpress/block-editor'; // Block editor data store needed.

/**
 * Internal dependencies
 */
import { createStore } from '../../../store';
import { withAMPToolbarButton } from '../index';

let block;

const TEST_BLOCK = 'my-plugin/test-block';

jest.mock('../amp-toolbar-button', () => ({
	AMPToolbarButton: () => <div id="amp-toolbar-button" />,
}));

describe('withAMPToolbarButton: filtering with errors', () => {
	beforeAll(() => {
		registerBlockType(TEST_BLOCK, {
			attributes: {},
			save: noop,
			category: 'widgets',
			title: 'test block',
		});

		block = createBlock(TEST_BLOCK, {});
		dispatch('core/block-editor').insertBlock(block);

		createStore({
			reviewLink: 'http://review-link.test',
			unreviewedValidationErrors: [
				{
					clientId: block.clientId,
					code: 'DISALLOWED_TAG',
					status: 3,
					term_id: 12,
					title: 'Invalid script: <code>jquery.js</code>',
					type: 'js_error',
				},
			],
			validationErrors: [
				{
					clientId: block.clientId,
					code: 'DISALLOWED_TAG',
					status: 3,
					term_id: 12,
					title: 'Invalid script: <code>jquery.js</code>',
					type: 'js_error',
				},
			],
		});
	});

	it('is filtered correctly with a class component', () => {
		class UnfilteredComponent extends Component {
			render() {
				return <div id="default-component-element">{''}</div>;
			}
		}

		const FilteredComponent = withAMPToolbarButton(UnfilteredComponent);

		const { container } = render(
			<FilteredComponent clientId={block.clientId} />
		);

		expect(
			container.querySelector('#default-component-element')
		).not.toBeNull();
		expect(container.querySelector('#amp-toolbar-button')).not.toBeNull();
	});

	it('is filtered correctly with a function component', () => {
		function UnfilteredComponent() {
			return <div id="default-component-element">{''}</div>;
		}

		const FilteredComponent = withAMPToolbarButton(UnfilteredComponent);

		const { container } = render(
			<FilteredComponent clientId={block.clientId} />
		);

		expect(
			container.querySelector('#default-component-element')
		).not.toBeNull();
		expect(container.querySelector('#amp-toolbar-button')).not.toBeNull();
	});
});

describe('withAMPToolbarButton: filtering without errors', () => {
	beforeAll(() => {
		block = createBlock(TEST_BLOCK, {});
		dispatch('core/block-editor').insertBlock(block);

		createStore({
			reviewLink: 'http://review-link.test',
			validationErrors: [],
		});
	});

	it('is not filtered with a class component and no errors', () => {
		class UnfilteredComponent extends Component {
			render() {
				return <div id="default-component-element">{''}</div>;
			}
		}

		const FilteredComponent = withAMPToolbarButton(UnfilteredComponent);

		const { container } = render(
			<FilteredComponent clientId={block.clientId} />
		);

		expect(
			container.querySelector('#default-component-element')
		).not.toBeNull();
		expect(container.querySelector('#amp-toolbar-button')).toBeNull();
	});

	it('is not filtered with a function component and no errors', () => {
		function UnfilteredComponent() {
			return <div id="default-component-element">{''}</div>;
		}

		const FilteredComponent = withAMPToolbarButton(UnfilteredComponent);

		const { container } = render(
			<FilteredComponent clientId={block.clientId} />
		);

		expect(
			container.querySelector('#default-component-element')
		).not.toBeNull();
		expect(container.querySelector('#amp-toolbar-button')).toBeNull();
	});
});
