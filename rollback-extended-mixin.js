define([
	'ember',
	'jquery'
], function(
	Ember,
	$
) {

return Ember.Mixin.create({
	// the fields of the relationships that should be deeply tracked
	// deep tracked relationships implies that if the models in the relationship has been dirty, the model referring to it will be dirty as well.
	deepRelationships: [],
	
	// the cached of all relationships that are not deep relationships
	// shallow tracked relationship will only make the model referring to it dirty if the relationship has been updated.
	// belongsTo => the relationship is changed, belongsTo=val1 => belongsTo=val2
	// hasMany => the relationship is changed or the content of the list changed, hasMany=[val1, val2] => hasMany=[val1] or hasMany=[val1, val3] or hasMany=[val1, val2, val3]
	_shallowRelationships: null,
	
	// all original relationships captured
	_originalRelationships: null,
	
	// any dirty relationships captured
	_dirtyRelationships: null,
	
	// any active observers
	_activeObservers: null,
	
	// tracking whether a rollback is in progress
	_rollingback: false,
	
	onInit: function() {
		var self = this;
		
		this.set('_shallowRelationships', Ember.A());
		this.set('_originalRelationships', Ember.Object.create());
		this.set('_dirtyRelationships', Ember.A());
		this.set('_activeObservers', Ember.Object.create());
		
		// load the shallow relationships
		this.eachRelationship(function(key, meta) {
			if(!self.isDeepRelationship(key)) {
				self.get('_shallowRelationships').addObject(key);
			}
		});
		
		// @important must run within a Ember.run.once so that circular belongsTo reference does not cause continuous new model being created
		Ember.run.once(this, function() {
			this._captureRelationships();
			this._startObservers();
		});		
		
		// trigger the get of isDirty to activate the the computed property
		this.get('isDirty');
	}.on('init'),
	
	isDirty: function() {
		// @note: hasDirtyAttributes is a computed property base on currentState.isDirty (ember-data.js line 3447)
		return this.get('hasDirtyAttributes') || this.get('hasDirtyRelationships') || this.get('isDeleted') || this.get('isNew');
	}.property('currentState.isDirty', '_dirtyRelationships.[]', 'isDeleted', 'isNew'),
	
	rollbackInProgress: function() {
		return this.get('_rollingback') === true;
	}.property('_rollingback'),
	
	observerEnabled: function() {
		return this.get('_rollingback') === false;
	}.property('_rollingback'),
	
	hasDirtyRelationships: function() {
		return this.get('_dirtyRelationships').length > 0;
	}.property('_dirtyRelationships.[]'),
	
	isDeepRelationship: function(key) {
		return this.get('deepRelationships').includes(key);
	},
	
	/**
	 * Rollback any unsaved changes
	 * @todo Looks like the rollback is reaching too far?  Not sure why 
	 * */
	rollback: function() {
		var self = this;
		
		// enable the rolling back flag
		this.set('_rollingback', true);
		
		// rollback all attributes
		this.rollbackAttributes();
		
		// rollback all shallow relationships
		this.get('_shallowRelationships').forEach(function(key) {
			var meta = self.relationshipFor(key);
			
			if(meta.kind === 'belongsTo') {
				let belongsTo = self.belongsTo(key);
				
				if((meta.options.async === false || belongsTo.belongsToRelationship.hasLoaded) && self.get('_dirtyRelationships').includes(key)) {
					// this belongsto is already loaded, we can rollback
					self._rollbackBelongsTo(key, false);
				}
			} else if(meta.kind === 'hasMany') {
				let hasMany = self.hasMany(key);
				
				if((meta.options.async === false || hasMany.hasManyRelationship.hasLoaded) && self.get('_dirtyRelationships').includes(key)) {
					// this hasmany is already loaded, we can rollback
					self._rollbackHasMany(key, false);
				}
			}
			
			// reset the dirty tracking
			self.get('_dirtyRelationships').removeObject(key);
		});
		
		// rollback all deep relationships
		this.get('deepRelationships').forEach(function(key) {
			var meta = self.relationshipFor(key);
			
			if(meta.kind === 'belongsTo') {
				let belongsTo = self.belongsTo(key);
				
				if((meta.options.async === false || belongsTo.belongsToRelationship.hasLoaded) && self.get('_dirtyRelationships').includes(key)) {
					// this belongsto is already loaded, we can rollback
					self._rollbackBelongsTo(key, true);
				}
			} else if(meta.kind === 'hasMany') {
				let hasMany = self.hasMany(key);
				
				if((meta.options.async === false || hasMany.hasManyRelationship.hasLoaded) && self.get('_dirtyRelationships').includes(key)) {
					// this hasmany is already loaded, we can rollback
					self._rollbackHasMany(key, true);
				}
			}
			
			// reset the dirty tracking
			self.get('_dirtyRelationships').removeObject(key);
		});
		
		// disable the rolling back flag
		this.set('_rollingback', false);
	},
	
	/**
	 * Internal belongsTo rollback, should not be call directly
	 * */
	_rollbackBelongsTo: function(key, deep) {
		var self = this;
		let meta = this.relationshipFor(key);
		
		deep = deep || false;
		
		// @note using $.when here over Ember.RSVP.Promise.resolve since when will immediately fire the `then` if the value is already loaded.
		//		 Ember.RSVP.Promise.resolve will fire the `then` in an async manner, which will not guarantee the rollback is trigger before the function finishes
		$.when(this.get(key)).then(function(val) {
			var current_id = undefined;
			
			if(val) {
				if(deep && val.get('isDirty') && !val.get('rollbackInProgress')) {
					val.rollback();
				}
				
				current_id = val.get('id');
			}
			
			// if the original value and the current value have different data, we wil replace the current value with the original value
			var original_id = self.get('_originalRelationships').get(key);
			
			if(!original_id) {
				self.set(key, undefined);
			} else if(original_id != current_id) {				
				var record = self.store.peekRecord(meta.type, original_id);
				if(record) {
					if(deep && record.get('isDirty') && !record.get('rollbackInProgress')) {
						record.rollback();
					}
					
					self.set(key, record);
				} else {
					self.set(key, undefined);
				}
			}
		});
	},
	
	/**
	 * Internal hasMany rollback, should not be call directly
	 * */
	_rollbackHasMany: function(key, deep) {
		var self = this;
		let meta = this.relationshipFor(key);
		
		deep = deep || false;
		
		// @note using $.when here over Ember.RSVP.Promise.resolve since when will immediately fire the `then` if the value is already loaded.
		//		 Ember.RSVP.Promise.resolve will fire the `then` in an async manner, which will not guarantee the rollback is trigger before the function finishes
		$.when(this.get(key)).then(function(list) {
			// invokes the rollback method on every element in the list
			if(deep) {
				list.invoke('rollback');
			}
			
			var original_list = self.get('_originalRelationships').get(key);
			
			// if the original list and current list have different data, we will replace the current list with the data in the original list
			if(!Ember.isEqual(original_list.join(','), list.sortBy('id').mapBy('id').join(','))) {
				list.clear();
				
				original_list.forEach(function(id) {
					var record = self.store.peekRecord(meta.type, id);
					if(record) {
						if(deep && record.get('isDirty') && !record.get('rollbackInProgress')) {
							record.rollback();
						}
						
						list.pushObject(record);
					}
				});
			}
		});
	},
	
	/**
	 * Capture the initial state of all relationships
	 * */
	_captureRelationships: function() {
		var self = this;
		
		this.eachRelationship(function(key, meta) {			
			if(meta.kind === 'belongsTo') {
				self.get('_originalRelationships').set(key, undefined);
				
				if(meta.options.async) {
					let belongsTo = self.belongsTo(key);
					
					if(belongsTo.belongsToRelationship.hasLoaded) {
						// this async property is already loaded, we should start capture it
						self.get(key).then(function(val) {
							val = (val) ? val.get('id') : undefined;
							
							self.get('_originalRelationships').set(key, val);
						});
					} else {
						// this async property is not loaded yet, we should add an observer to it
						var oldHasLoaded = belongsTo.belongsToRelationship.setHasLoaded;
						belongsTo.belongsToRelationship.setHasLoaded = function(value) {
							// restore the old has loaded function
							belongsTo.belongsToRelationship.setHasLoaded = oldHasLoaded;
							belongsTo.belongsToRelationship.setHasLoaded(value);
							
							self.get(key).then(function(val) {
								val = (val) ? val.get('id') : undefined;
								
								self.get('_originalRelationships').set(key, val);
							});
						};
					}
				} else {
					let val = self.get(key);
					val = (val) ? val.get('id') : undefined;
					
					self.get('_originalRelationships').set(key, val);
				}
			} else if(meta.kind === 'hasMany') {
				self.get('_originalRelationships').set(key, []);
				
				if(meta.options.async) {
					let hasMany = self.hasMany(key);
					
					if(hasMany.hasManyRelationship.hasLoaded) {
						// this async property is already loaded, we should start capture it
						self.get(key).then(function(list) {
							self.get('_originalRelationships').set(key, list.without(undefined).sortBy('id').mapBy('id'));
						});
					} else {
						// this async property is not loaded yet, we should add an observer to it
						var oldHasLoaded = hasMany.hasManyRelationship.setHasLoaded;
						hasMany.hasManyRelationship.setHasLoaded = function(value) {
							// restore the old has loaded function
							hasMany.hasManyRelationship.setHasLoaded = oldHasLoaded;
							hasMany.hasManyRelationship.setHasLoaded(value);
							
							self.get(key).then(function(list) {
								self.get('_originalRelationships').set(key, list.without(undefined).sortBy('id').mapBy('id'));
							});
						};
					}
				} else {
					self.get('_originalRelationships').set(key, self.get(key).without(undefined).sortBy('id').mapBy('id'));
				}
			}
		});
	},
	
	/**
	 * Override the set to hook into when a relationship has been completed swapped
	 * */
	set: function(key, value) {
		var self = this;
		
		if(!this.get('isLoaded')) {
			return this._super.apply(this, arguments);
		}
		
		var meta = this.relationshipFor(key);
		if(!meta) {
			return this._super.apply(this, arguments);
		}
		
		var current_value = this.get(key);
		
		$.when(current_value).then(function(current_value) {
			if(current_value !== value && meta && self.isDeepRelationship(key)) {				
				// this is a relationship property, we will need to remove the current observer for the current relationship
				this._removeKeyObserver(key);
			}
		});
		
		// if the key is a deep relationship, we will have to remove existing observer from the current value and add new observer to the new value
		var ret = this._super.apply(this, arguments);
		
		if(meta) {
			// manually trigger the dirty checker base on the relationship type
			if(meta.kind === 'belongsTo') {
				this._belongsToDirtyChecker(key, this);
			} else if(meta.kind === 'hasMany') {
				this._hasManyDirtyChecker(key, this);
			}
		}
		
		$.when(current_value).then(function(current_value) {
			if(current_value !== value && meta && self.isDeepRelationship(key)) {
				// initialize the new observers
				this._initializeObserver(key, meta);
			}
		});	
		
		return ret;
	},
	
	/**
	 * Register the observer under the given key
	 * */
	_addKeyObserver: function(key, record, ikey, callback) {
		// make sure any current key observer is removed first
		if(this.get('_activeObservers').get(key)) {
			this._removeKeyObserver(key);
		}
		
		callback = $.proxy(callback, this, key);
		
		record = record || this;
		record.addObserver(ikey, callback);
		
		this.get('_activeObservers').set(key, [record, ikey, callback]);
	},
	
	/**
	 * Unregister the observer with the given key
	 * */
	_removeKeyObserver: function(key) {
		var currentObserver = this.get('_activeObservers').get(key);
		if (currentObserver && currentObserver.length > 3) {
			currentObserver[0].removeObserver(currentObserver[1], currentObserver[2]);
		}
		
		this.get('_activeObservers').set(key, undefined);
	},
	
	/**
	 * Dirty checker for belongsto relationships
	 * */
	_belongsToDirtyChecker: function(key, sender) {
		var self = this;
		
		if(this.get('observerEnabled')) {
			$.when(this.get(key)).then(function(current_val) {
				if(self.isDeepRelationship(key)) {
					if(current_val && current_val.get('isDirty')) {
						if(!self.get('_dirtyRelationships').includes(key)) {
							self.get('_dirtyRelationships').addObject(key);
						}
						
						return;
					}
				}
				
				let current_id = (current_val) ? current_val.get('id') : undefined;
				
				if(Ember.isEqual(current_id, self.get('_originalRelationships.' + key))) {
					self.get('_dirtyRelationships').removeObject(key);
				} else {
					if(!self.get('_dirtyRelationships').includes(key)) {
						self.get('_dirtyRelationships').addObject(key);
					}
				}
			});
		}
	},
	
	/**
	 * Dirty checker for hasmany relationships
	 * */
	_hasManyDirtyChecker: function(key, sender) {
		var self = this;
		
		if(this.get('observerEnabled')) {
			$.when(this.get(key)).then(function(current_list) {
				if(self.isDeepRelationship(key)) {
					let dirty_ids = self.get(key).without(undefined).filterBy('isDirty', true).sortBy('id').mapBy('id');
					dirty_ids = (dirty_ids === null || dirty_ids === undefined) ? [] : dirty_ids;
					
					if(dirty_ids.length > 0) {
						// there are values that itself is dirty
						if(!self.get('_dirtyRelationships').includes(key)) {
							self.get('_dirtyRelationships').addObject(key);
						}
						
						return;
					}
				}
				
				let current_ids = current_list.without(undefined).filterBy('isDeleted', false).sortBy('id').mapBy('id');
				
				// check this with the original value to see if we should flag this as dirty
				if(Ember.isEqual(current_ids.join(','), self.get('_originalRelationships').get(key).join(','))) {
					self.get('_dirtyRelationships').removeObject(key);
				} else {
					if(!self.get('_dirtyRelationships').includes(key)) {
						self.get('_dirtyRelationships').addObject(key);
					}
				}
			});
		}
	},
	
	/**
	 * Start the observers to monitor changes and dirty relationships
	 * */
	_startObservers: function() {		
		var self = this;
		
		this.eachRelationship(function(key, meta) {
			self._initializeObserver(key, meta);
		});
	},
	
	/**
	 * Initializes the observer for the given key
	 * */
	_initializeObserver: function(key, meta) {
		var self = this;
		
		if(meta.kind === 'belongsTo') {
			// we only care about observing deep belongsto
			if(self.isDeepRelationship(key)) {
				if(meta.options.async) {
					let belongsTo = self.belongsTo(key);
					
					if(belongsTo.belongsToRelationship.hasLoaded) {
						// this async property is already loaded, we should start monitoring it
						self._addKeyObserver(key, self.get(key), 'content.isDirty', self._belongsToDirtyChecker);
					} else {
						// this async property is not loaded yet, we should add an observer to it
						var oldHasLoaded = belongsTo.belongsToRelationship.setHasLoaded;
						belongsTo.belongsToRelationship.setHasLoaded = function(value) {
							// set the hasLoaded and then restore the old has loaded function
							belongsTo.belongsToRelationship.setHasLoaded = oldHasLoaded;
							belongsTo.belongsToRelationship.setHasLoaded(value);
							
							self._addKeyObserver(key, self.get(key), 'content.isDirty', self._belongsToDirtyChecker);
						};
					}
				} else {
					self._addKeyObserver(key, self, key + '.isDirty', self._belongsToDirtyChecker);
				}
			}
		} else if(meta.kind === 'hasMany') {				
			if(meta.options.async) {
				let hasMany = self.hasMany(key);
				let key_observer = key;
				
				if(self.isDeepRelationship(key)) {
					key_observer = 'content.@each.isDirty';
				} else {
					key_observer = 'content.[]';
				}
				
				if(hasMany.hasManyRelationship.hasLoaded) {
					// this async property is already loaded, we should start monitoring it
					self._addKeyObserver(key, self.get(key), key_observer, self._hasManyDirtyChecker);
				} else {
					// this async property is not loaded yet, we should add an observer to it
					var oldHasLoaded = hasMany.hasManyRelationship.setHasLoaded;
					hasMany.hasManyRelationship.setHasLoaded = function(value) {
						// set the hasLoaded and then restore the old has loaded function
						hasMany.hasManyRelationship.setHasLoaded = oldHasLoaded;
						hasMany.hasManyRelationship.setHasLoaded(value);
						
						self._addKeyObserver(key, self.get(key), key_observer, self._hasManyDirtyChecker);
					};
				}
			} else if(self.isDeepRelationship(key)) {
				self._addKeyObserver(key, self, key + '.@each.isDirty', self._hasManyDirtyChecker);
			} else {
				self._addKeyObserver(key, self, key + '.[]', self._hasManyDirtyChecker);
			}
		}
	}
});

});