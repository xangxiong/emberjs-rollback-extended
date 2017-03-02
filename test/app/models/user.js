define([
	'ember',
	'ember-data',
	'app',
	'app/models/picture',
	'app/models/option'
], function(
	Ember,
	EmberData,
	App,
	AppPictureModel,
	AppOptionModel
) {
	App.UserModel = EmberData.Model.extend({
		deepRelationship: ['options'],
		
		name: EmberData.attr('string'),
		picture: EmberData.belongsTo('picture', {
			async: false
		}),
		options: EmberData.hasMany('option', {
			async: false
		})
	});
	
	// register this model
	App.register('model:user', App.UserModel, {
		singleton: false,
		instantiate: false
	});
	
	return App.UserModel;
});