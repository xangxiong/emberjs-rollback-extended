requirejs.config({
	enforceDefine: true,
	paths: {
		'jquery'							: '../../bower_components/jquery/dist/jquery',
		'handlebars'						: '../../bower_components/handlebars/handlebars.amd',
		'ember'								: '../../bower_components/ember/ember',
		'ember-template-compiler'			: '../../bower_components/ember/ember-template-compiler',
		'ember-data'						: '../../bower_components/ember-data/ember-data',
		'text'								: '../../bower_components/text/text',
		
		'rollback-extended'					: '../../rollback-extended',
		'rollback-extended-mixin'			: '../../rollback-extended-mixin',
		
		'templates'							: 'templates'
	},
	shim: {
		'jquery': {
			'exports'				: '$'
		},
		'jquery-ui': {
			'deps'					: ['jquery'],
			'exports'				: '$.ui'
		},
		'text':	{
			'deps'					: ['jquery'],
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
		'ember-template-compiler' : {
			'deps'					: ['ember'],
			'exports'				: 'Ember'
		}
	}
});

define([
	'app',
	'router'
], function(
	App,
	Router
) {
	
});