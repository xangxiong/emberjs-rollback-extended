define([
	'ember',
	'ember-data',
	'app'
], function(
	Ember,
	EmberData,
	App
) {
	App.OptionModel = EmberData.Model.extend({
		name: EmberData.attr('string'),
		value: EmberData.attr('string')
	});
	
	// register this model
	App.register('model:option', App.OptionModel, {
		singleton: false,
		instantiate: false
	});
	
	return App.OptionModel;
});