requirejs.config({
	enforceDefine: true,
	paths: {
		'jquery'							: '../../bower_components/jquery/dist/jquery',
		'handlebars'						: '../../bower_components/handlebars/handlebars.amd',
		'ember'								: '../../bower_components/ember/ember.debug',
		'ember-data'						: '../../bower_components/ember-data/ember-data',
		'qunit'								: '../../bower_components/qunit/qunit/qunit',
		'rollback-extended'					: '../../rollback-extended',
		'rollback-extended-mixin'			: '../../rollback-extended-mixin',
		
		'tests'								: 'tests'
	},
	shim: {
		'jquery': {
			'exports'				: '$'
		},
		'ember': {
			'deps'					: ['jquery', 'handlebars'],
			'exports'				: 'Ember'
		},
		'ember-data': {
			'deps'					: ['ember'],
			'exports'				: 'DS'
		},
		'qunit'						: {
			'deps'					: ['jquery'],
			'exports'				: 'QUnit'
		}
	}
});

define([
	'ember',
	'ember-data',
	'app',
	'rollback-extended',
	'tests/unit/rollback-extended'
], function(
	Ember,
	EmberData,
	App,
	RollbackExtended,
	RollbackExtendedTest
) {
	
});