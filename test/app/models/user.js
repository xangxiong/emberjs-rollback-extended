define([
	'ember',
	'ember-data',
	'app',
	'app/models/picture',
	'app/models/option',
	'app/serializers/user'
], function(
	Ember,
	EmberData,
	App,
	AppPictureModel,
	AppOptionModel,
	AppUserSerializer
) {
	App.UserModel = EmberData.Model.extend({
		deepRelationships: ['deep_options', 'deep_async_options', 'deep_picture', 'deep_async_picture'],
		
		name: EmberData.attr('string'),
		
		picture: EmberData.belongsTo('picture', {
			inverse: 'user',
			async: false
		}),
		async_picture: EmberData.belongsTo('picture', {
			inverse: 'async_user',
			async: true
		}),
		
		deep_picture: EmberData.belongsTo('picture', {
			inverse: 'deep_user',
			async: false
		}),
		deep_async_picture: EmberData.belongsTo('picture', {
			inverse: 'deep_async_user',
			async: true
		}),		
		
		options: EmberData.hasMany('option', {
			inverse: 'user',
			async: false
		}),
		async_options: EmberData.hasMany('option', {
			inverse: 'async_user',
			async: true
		}),
		
		deep_options: EmberData.hasMany('option', {
			inverse: 'deep_user',
			async: false
		}),
		deep_async_options: EmberData.hasMany('option', {
			inverse: 'deep_async_user',
			async: true
		})		
	});
	
	// register this model
	App.register('model:user', App.UserModel, {
		singleton: false,
		instantiate: false
	});
	
	return App.UserModel;
});