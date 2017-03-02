define([
	'ember',
	'ember-data',
	'jquery'
], function(
	Ember,
	EmberData,
	jQuery
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