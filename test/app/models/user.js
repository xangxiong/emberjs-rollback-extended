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
		}),
		
		sort_definition: function() {
			return ['sort:asc'];
		}.property(),
		
		sorted_options: Ember.computed.sort('options', 'sort_definition'),
		sorted_async_options: Ember.computed.sort('async_options', 'sort_definition'),
		sorted_deep_options: Ember.computed.sort('deep_options', 'sort_definition'),
		sorted_deep_async_options: Ember.computed.sort('deep_async_options', 'sort_definition'),
		
		active_options: Ember.computed.filterBy('options', 'isDeleted', false),
		active_async_options: Ember.computed.filterBy('async_options', 'isDeleted', false),
		active_deep_options: Ember.computed.filterBy('deep_options', 'isDeleted', false),
		active_deep_async_options: Ember.computed.filterBy('deep_async_options', 'isDeleted', false),
		
		sorted_active_options: Ember.computed.sort('active_options', 'sort_definition'),
		sorted_active_async_options: Ember.computed.sort('active_async_options', 'sort_definition'),
		sorted_active_deep_options: Ember.computed.sort('active_deep_options', 'sort_definition'),
		sorted_active_deep_async_options: Ember.computed.sort('active_deep_async_options', 'sort_definition')
	});
	
	// register this model
	App.register('model:user', App.UserModel, {
		singleton: false,
		instantiate: false
	});
	
	return App.UserModel;
});