define([
	'ember',
	'ember-data',
	'ember-template-compiler',
	'jquery',
	'rollback-extended'
], function(
	Ember,
	EmberData,
	EmberTemplateCompiler,
	jQuery,
	RollbackExtended
) {
	var App = Ember.Application.create({
		LOG_TRANSITIONS: true,
		LOG_BINDINGS: true,
		LOG_VIEW_LOOKUPS: true,
		LOG_STACKTRACE_ON_DEPRECATION: true,
		LOG_VERSION: true,
		debugMode: true
	});
	
	return App;
});