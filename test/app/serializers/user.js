define([
	'ember',
	'ember-data',	
	'app',
	'serializer-extended-mixin'
], function(
	Ember,
	EmberData,
	App,
	SerializerExtendedMixin
) {
	App.UserSerializer = EmberData.RESTSerializer.extend(EmberData.EmbeddedRecordsMixin, SerializerExtendedMixin, {
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