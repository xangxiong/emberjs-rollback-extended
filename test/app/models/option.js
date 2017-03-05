define([
	'ember',
	'ember-data',
	'app',
	'app/serializers/option'
], function(
	Ember,
	EmberData,
	App,
	AppOptionSerializer
) {
	App.OptionModel = EmberData.Model.extend({
		deepRelationships: ['deep_user', 'deep_async_user'],
		
		name: EmberData.attr('string'),
		value: EmberData.attr('string'),
		sort: EmberData.attr('number'),
		
		user: EmberData.belongsTo('user', {
			inverse: 'options',
			async: false
		}),		
		async_user: EmberData.belongsTo('user', {
			inverse: 'async_options',
			async: true
		}),
		
		deep_user: EmberData.belongsTo('user', {
			inverse: 'deep_options',
			async: false
		}),		
		deep_async_user: EmberData.belongsTo('user', {
			inverse: 'deep_async_options',
			async: true
		})
	});
	
	// register this model
	App.register('model:option', App.OptionModel, {
		singleton: false,
		instantiate: false
	});
	
	return App.OptionModel;
});