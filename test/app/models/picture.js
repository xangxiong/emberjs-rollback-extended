define([
	'ember',
	'ember-data',
	'app',
	'app/serializers/picture'
], function(
	Ember,
	EmberData,
	App,
	AppPictureSerializer
) {
	App.PictureModel = EmberData.Model.extend({
		url: EmberData.attr('string'),
		user: EmberData.belongsTo('user', {
			inverse: 'picture',
			async: false
		}),
		async_user: EmberData.belongsTo('user', {
			inverse: 'async_picture',
			async: true
		})
	});
	
	// register this model
	App.register('model:picture', App.PictureModel, {
		singleton: false,
		instantiate: false
	});
	
	return App.PictureModel;
});