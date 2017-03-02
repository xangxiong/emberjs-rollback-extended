define([
	'ember',
	'ember-data',
	'jquery'
], function(
	Ember,
	EmberData,
	jQuery
) {
	var App = Ember.Application.create({
		LOG_TRANSITIONS: true,
		LOG_BINDINGS: true,
		LOG_VIEW_LOOKUPS: true,
		LOG_STACKTRACE_ON_DEPRECATION: true,
		LOG_VERSION: true,
		debugMode: true
	});
	// stop the application from proceeding until we load our services
	App.deferReadiness();
	
	// generate hash storage
	var storage = {};
	
	// custom local adapter to be use only for testing
	App.ApplicationAdapter = EmberData.Adapter.extend({
		findRecord: function(store, type, id, snapshot) {
			if(!storage[type]) {
				storage[type] = {};
			}
			
			return new Ember.RSVP.Promise(function(resolve) {
				resolve(null, storage[type][id]);
			});
		},
		createRecord: function(store, type, snapshot) {
			var data = this.serialize(snapshot, {includeId: true});
			
			if(!storage[type]) {
				storage[type] = {};
			}
			
			if(snapshot.id) {
				storage[type][snapshot.id] = data;
			}
			
			return new Ember.RSVP.Promise(function(resolve) {
				resolve(null, data);
			});
		},
		updateRecord: function(store, type, snapshot) {
			var data = this.serialize(snapshot, {includeId: true});
			
			if(!storage[type]) {
				storage[type] = {};
			}
			
			if(snapshot.id) {
				storage[type][snapshot.id] = data;
			}
			
			return new Ember.RSVP.Promise(function(resolve) {
				resolve(null, data);
			});
		},
		deleteRecord: function(store, type, snapshot) {
			var data = this.serialize(snapshot, {includeId: true});
			
			if(!storage[type]) {
				storage[type] = {};
			}
			
			if(snapshot.id) {
				delete storage[type][snapshot.id];
			}
			
			return new Ember.RSVP.Promise(function(resolve) {
				resolve(null, data);
			});
		},
		findAll: function(store, type, sinceToken, snapshotRecordArray) {
			return new Ember.RSVP.Promise(function(resolve) {
				resolve(null, storage[type]);
			});
		},
		query: function(store, type, query, recordArray) {
			query = query || {};
			
			return new Ember.RSVP.Promise(function(resolve) {
				if(storage[type]) {
					var keys = query.keys();
					
					resolve(null, storage[type].filter(function(item, index, list) {
						var match = true;
						
						keys.every(function(key) {
							if(query[key] != item.get(key)) {
								match = false;
							}
							
							return match;
						});
						
						return match;
					}));
				} else {
					resolve(null, []);
				}
			});
		}
	});
	
	return App;
});