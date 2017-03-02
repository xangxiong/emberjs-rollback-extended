define([
	'ember',
	'ember-data',
	'app'
], function(
	Ember,
	EmberData,
	App
) {
	App.PictureModel = EmberData.Model.extend({
		url: EmberData.attr('string')
	});
	
	// register this model
	App.register('model:picture', App.PictureModel, {
		singleton: false,
		instantiate: false
	});
	
	return App.PictureModel;
});