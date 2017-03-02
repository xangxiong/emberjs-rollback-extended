define([
	'ember',
	'ember-data',
	'app'
], function(
	Ember,
	EmberData,
	App
) {
	App.UserSerializer = EmberData.RESTSerializer.extend(EmberData.EmbeddedRecordsMixin, {
		attrs: {
			picture: {
				serialize: 'ids',
				deserialize: 'ids'
			},
			async_picture: {
				serialize: 'ids',
				deserialize: 'ids'
			},
			options: {
				serialize: 'ids',
				deserialize: 'ids'
			},
			async_options: {
				serialize: 'ids',
				deserialize: 'ids'
			}
		}
	});
	
	// register this serializer
	App.register('serializer:user', App.UserSerializer, {
		singleton: true,
		instantiate: true
	});
	
	return App.UserSerializer;
});