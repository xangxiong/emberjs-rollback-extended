requirejs.config({
	enforceDefine: true,
	paths: {
		'jquery'							: '../../bower_components/jquery/dist/jquery',
		'handlebars'						: '../../bower_components/handlebars/handlebars.amd',
		'ember'								: '../../bower_components/ember/ember.debug',
		'ember-data'						: '../../bower_components/ember-data/ember-data',
		'pure-uuid'							: '../../bower_components/pure-uuid/uuid',
		'qunit'								: '../../bower_components/qunit/qunit/qunit',
		'rollback-extended'					: '../../rollback-extended',
		'rollback-extended-mixin'			: '../../rollback-extended-mixin',
		'serializer-extended-mixin'			: '../../serializer-extended-mixin',
		
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
		'pure-uuid': {
			'deps'					: ['jquery'],
			'exports' 				: 'UUID'
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
	'qunit',
	'rollback-extended'
], function(
	Ember,
	EmberData,
	App,
	QUnit,
	RollbackExtended
) {
	Ember.Application.initializer({
		name: 'service_initializer',
		initialize: function(application) {
			application.advanceReadiness();
			
			// load the tests
			require([
				'tests/unit/rollback-extended'
			], function(
				RollbackExtendedTest		
			) {
				// start the QUnit testing
				QUnit.start();
			});
		}
	})
});