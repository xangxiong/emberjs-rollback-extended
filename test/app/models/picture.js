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
		deepRelationships: ['deep_user', 'deep_async_user'],
		
		url: EmberData.attr('string'),
		
		user: EmberData.belongsTo('user', {
			inverse: 'picture',
			async: false
		}),
		async_user: EmberData.belongsTo('user', {
			inverse: 'async_picture',
			async: true
		}),
		
		deep_user: EmberData.belongsTo('user', {
			inverse: 'deep_picture',
			async: false
		}),
		deep_async_user: EmberData.belongsTo('user', {
			inverse: 'deep_async_picture',
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