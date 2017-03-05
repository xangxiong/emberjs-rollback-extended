/**
 * MIT License
 *
 * Copyright (c) 2017 Xang Xiong
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function(window, factory) {
	if(typeof define === 'function' && define.amd) {
		define([
			'ember',
			'jquery'
		], function(
			Ember,
			$
		) {
			return factory(Ember, $);
		});
	} else {
		factory(Ember, $);
	}
}(this, function(Ember, $) {
	/**
	 * Mixin the ability to rollback deep and shallow relationships.  Deep relationships are relationships with the cascade persist=true.  All others are shallow relationships.
	 * Also mixin the ability to cascade persist (save) and remove (delete) along with removal of orphan relationships
	 *
	 * field: DS.hasMany('model', {
	 *		cascade: {
	 *			persist: true,
	 *			remove: true,
	 *			orphan: true
	 *		}
	 * })
	 * */
	return Ember.Mixin.create({
		// current dirty state
		isDirty: false,
		
		/**
		 * the cached of the relationships that are deeply tracked.
		 * deep tracked relationships implies that if the models in the relationship has been dirty, the model referring to it will be dirty as well.
		 * to define a relationship as deep, it should have the persist cascade flag set to true.
		 * 
		 *	field: DS.hasMany('model', {
		 *		async: true,
		 *		cascade: {
		 *			persist: true
		 *		}
		 *	})
		 * */
		_deepRelationships: null,
		
		/**
		 * the cached of the remaining relationships that are not deep relationships.
		 * shallow tracked relationship will only make the model referring to it dirty if the relationship has been updated.
		 * belongsTo => the relationship is changed, belongsTo=val1 => belongsTo=val2
		 * hasMany => the relationship is changed or the content of the list changed, hasMany=[val1, val2] => hasMany=[val1] or hasMany=[val1, val3] or hasMany=[val1, val2, val3]
		 * */
		_shallowRelationships: null,
		
		// all original relationships captured
		_originalRelationships: null,
		
		// any dirty relationships captured
		_dirtyRelationships: null,
		
		// any active observers
		_activeObservers: null,
		
		// tracking whether a rollback is in progress
		_rollingback: false,
		// tracking whether a save is in progress
		_saving: false,
		
		onInit: function() {
			var self = this;
			
			this.set('_deepRelationships', Ember.A());
			this.set('_shallowRelationships', Ember.A());
			this.set('_originalRelationships', Ember.Object.create());
			this.set('_dirtyRelationships', Ember.A());
			this.set('_activeObservers', Ember.Object.create());
			
			// load the shallow relationships
			this.eachRelationship(function(key, meta) {
				if(meta.options && meta.options.cascade && meta.options.cascade.persist === true) {
					self.get('_deepRelationships').addObject(key);
				} else {				
					self.get('_shallowRelationships').addObject(key);
				}
			});
			
			// @important must run within a Ember.run.once so that circular belongsTo reference does not cause continuous new model being created
			Ember.run.once(this, function() {
				this._captureRelationships();
				this._startObservers();
			});
		}.on('init'),
		
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
			return this.get('_deepRelationships').includes(key);
		},
		
		/**
		 * Rollback any unsaved changes
		 * */
		rollback: function() {
			var self = this;
			
			// enable the rolling back flag
			this.set('_rollingback', true);
			
			// rollback all shallow relationships
			this.get('_shallowRelationships').forEach(function(key) {
				var meta = self.relationshipFor(key);
				
				if(meta.kind === 'belongsTo') {
					var belongsTo = self.belongsTo(key);
					
					if((meta.options.async === false || belongsTo.belongsToRelationship.hasLoaded) && self.get('_dirtyRelationships').includes(key)) {
						// this belongsto is already loaded, we can rollback
						self._rollbackBelongsTo(key, false);
					}
				} else if(meta.kind === 'hasMany') {
					var hasMany = self.hasMany(key);
					
					if((meta.options.async === false || hasMany.hasManyRelationship.hasLoaded) && self.get('_dirtyRelationships').includes(key)) {
						// this hasmany is already loaded, we can rollback
						self._rollbackHasMany(key, false);
					}
				}
				
				// reset the dirty tracking
				self.get('_dirtyRelationships').removeObject(key);
			});
			
			// rollback all deep relationships
			this.get('_deepRelationships').forEach(function(key) {
				var meta = self.relationshipFor(key);
				
				if(meta.kind === 'belongsTo') {
					var belongsTo = self.belongsTo(key);
					
					if((meta.options.async === false || belongsTo.belongsToRelationship.hasLoaded) && self.get('_dirtyRelationships').includes(key)) {
						// this belongsto is already loaded, we can rollback
						self._rollbackBelongsTo(key, true);
					}
				} else if(meta.kind === 'hasMany') {
					var hasMany = self.hasMany(key);
					
					if((meta.options.async === false || hasMany.hasManyRelationship.hasLoaded) && self.get('_dirtyRelationships').includes(key)) {
						// this hasmany is already loaded, we can rollback
						self._rollbackHasMany(key, true);
					}
				}
				
				// reset the dirty tracking
				self.get('_dirtyRelationships').removeObject(key);
			});
			
			// rollback all attributes
			this.rollbackAttributes();
			
			// disable the rolling back flag
			this.set('_rollingback', false);
		},
		
		/**
		 * Internal belongsTo rollback, should not be call directly
		 * */
		_rollbackBelongsTo: function(key, deep) {
			var self = this;
			var meta = this.relationshipFor(key);
			
			deep = deep || false;		
			
			var val = this.get(key);
			if(meta.options.async && val) {
				val = val.get('content');
			}
			
			var current_id = undefined;
			
			if(val) {
				if(deep && val.get('isDirty') && !val.get('rollbackInProgress')) {
					val.rollback();
				}
				
				current_id = val.get('id');
			}
			
			// if the original value and the current value have different data, we wil replace the current value with the original value
			var original_id = this.get('_originalRelationships').get(key);
			
			if(!original_id) {
				this.set(key, undefined);
			} else if(original_id != current_id) {				
				var record = this.store.peekRecord(meta.type, original_id);
				if(record) {
					if(deep && record.get('isDirty') && !record.get('rollbackInProgress')) {
						record.rollback();
					}
					
					this.set(key, record);
				} else {
					this.set(key, undefined);
				}
			}
		},
		
		/**
		 * Internal hasMany rollback, should not be call directly
		 * */
		_rollbackHasMany: function(key, deep) {
			var self = this;
			var meta = this.relationshipFor(key);
			
			deep = deep || false;
			
			var list = this.get(key);
			if(meta.options.async && list) {
				list = list.get('content');
			}
			
			// invokes the rollback method on every element in the list
			if(deep && list) {
				list.invoke('rollback');
			}
			
			var original_list = this.get('_originalRelationships').get(key);
			
			// if the original list and current list have different data, we will replace the current list with the data in the original list
			if(!Ember.isEqual(original_list.join(','), list.sortBy('id').mapBy('id').join(','))) {
				var new_list = [];
				
				original_list.forEach(function(id) {
					var record = self.store.peekRecord(meta.type, id);
					if(record) {
						if(deep && record.get('isDirty') && !record.get('rollbackInProgress')) {
							record.rollback();
						}
						
						new_list.pushObject(record);
					}
				});
				
				this.set(key, new_list);
			}
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
						var belongsTo = self.belongsTo(key);
						
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
						var val = self.get(key);
						val = (val) ? val.get('id') : undefined;
						
						self.get('_originalRelationships').set(key, val);
					}
				} else if(meta.kind === 'hasMany') {
					self.get('_originalRelationships').set(key, []);
					
					if(meta.options.async) {
						var hasMany = self.hasMany(key);
						
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
			
			if(this.isDeepRelationship(key)) {
				if(meta.options.async) {
					if(!current_value || (current_value.get('isFulfilled') && current_value.get('content') !== value)) {
						// remove all observer for this key
						this._removeKeyObserver(key);
					} else {
						$.when(current_value).then(function(current_value) {
							if(current_value !== value) {
								// remove all observer for this key
								self._removeKeyObserver(key);
							}
						});
					}
				} else if(current_value !== value) {				
					// remove all observer for this key
					this._removeKeyObserver(key);
				}
			}
			
			// if the key is a deep relationship, we will have to remove existing observer from the current value and add new observer to the new value
			var ret = this._super.apply(this, arguments);
			
			// manually trigger the dirty checker base on the relationship type
			if(meta.kind === 'belongsTo') {
				this._belongsToDirtyChecker(key, this);
			} else if(meta.kind === 'hasMany') {
				this._hasManyDirtyChecker(key, this);
			}
			
			if(this.isDeepRelationship(key)) {
				if(meta.options.async) {
					if(!current_value || (current_value.get('isFulfilled') && current_value.get('content') !== value)) {
						// initialize the new observer for this key
						this._initializeObserver(key, meta);
					} else {
						$.when(current_value).then(function(current_value) {
							if(current_value !== value) {
								// initialize the new observer for this key
								self._initializeObserver(key, meta);
							}
						});
					}
				} else if(current_value !== value) {				
					// initialize the new observer for this key
					this._initializeObserver(key, meta);
				}			
			}
			
			return ret;
		},
		
		save: function(options) {
			var self = this;
			
			// enable the saving back flag
			this.set('_saving', true);
			
			var promises = [];
			
			// save all deep relationships first
			this.get('_deepRelationships').forEach(function(key) {
				var meta = self.relationshipFor(key);
				
				if(meta.kind === 'belongsTo') {
					var belongsTo = self.belongsTo(key);
					
					if(meta.options.async === false || belongsTo.belongsToRelationship.hasLoaded) {
						// this belongsto is already loaded, we can save
						var val = self.get(key);
						if(meta.options.async && val) {
							val = val.get('content');
						}
						
						if(val && val.get('isDirty') && val.get('_saving') !== true) {
							promises.push(val.save());
						}
					}
				} else if(meta.kind === 'hasMany') {
					var hasMany = self.hasMany(key);
					
					if(meta.options.async === false || hasMany.hasManyRelationship.hasLoaded) {
						// this hasmany is already loaded, we can rollback
						var list = self.get(key);
						if(meta.options.async && list) {
							list = list.get('content');
						}
						
						if(list) {
							list.forEach(function(val) {
								if(val.get('isDirty') && val.get('_saving') !== true) {
									promises.push(val.save());
								}
							});
						}
					}
				}
			});
			
			promises.push(this._super.apply(this, arguments));
			
			return new Ember.RSVP.Promise(function(resolve, reject) {
				Ember.RSVP.Promise.all(promises).then(function() {
					// we will need to clear the dirty tracking
					self.set('_dirtyRelationships', Ember.A());
					self.set('_originalRelationships', Ember.Object.create());
					self.set('isDirty', false);
					
					self._captureRelationships();
					
					// disable the rolling back flag
					self.set('_saving', false);
					
					resolve();
				}, function(error) {
					self.set('_saving', false);
					reject(error);
				});
			});
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
				var checker = function(current_val) {
					if(self.isDeepRelationship(key)) {
						if(current_val && current_val.get('isDirty')) {
							if(!self.get('_dirtyRelationships').includes(key)) {
								self.get('_dirtyRelationships').addObject(key);
							}
							
							return;
						}
					}
					
					var current_id = (current_val) ? current_val.get('id') : undefined;
					
					if(Ember.isEqual(current_id, self.get('_originalRelationships.' + key))) {
						self.get('_dirtyRelationships').removeObject(key);
					} else {
						if(!self.get('_dirtyRelationships').includes(key)) {
							self.get('_dirtyRelationships').addObject(key);
						}
					}
				};
				
				var current_val = this.get(key);
				var meta = this.relationshipFor(key);
				
				if(meta.options.async) {
					checker(current_val.get('content'));
				} else {
					checker(current_val);
				}
			}
		},
		
		/**
		 * Dirty checker for hasmany relationships
		 * */
		_hasManyDirtyChecker: function(key, sender) {
			var self = this;
			
			if(this.get('observerEnabled')) {
				// @todo using when here makes this process no-sync, which produces a race condition on the isDirty check
				var checker = function(current_list) {
					if(self.isDeepRelationship(key)) {
						var dirty_ids = self.get(key).without(undefined).filterBy('isDirty', true).sortBy('id').mapBy('id');
						dirty_ids = (dirty_ids === null || dirty_ids === undefined) ? [] : dirty_ids;
						
						if(dirty_ids.length > 0) {
							// there are values that itself is dirty
							if(!self.get('_dirtyRelationships').includes(key)) {
								self.get('_dirtyRelationships').addObject(key);
							}
							
							return;
						}
					}
					
					var current_ids = current_list.without(undefined).filterBy('isDeleted', false).sortBy('id').mapBy('id');
					current_ids = current_ids || [];
					
					var original_ids = self.get('_originalRelationships').get(key);
					original_ids = original_ids || [];
					
					// check this with the original value to see if we should flag this as dirty
					if(Ember.isEqual(current_ids.join(','), original_ids.join(','))) {
						self.get('_dirtyRelationships').removeObject(key);
					} else {
						if(!self.get('_dirtyRelationships').includes(key)) {
							self.get('_dirtyRelationships').addObject(key);
						}
					}
				};
				
				var current_list = this.get(key);
				var meta = this.relationshipFor(key);
				
				if(meta.options.async) {
					checker(current_list.get('content'));
				} else {
					checker(current_list);
				}
			}
		},
		
		/**
		 * Start the observers to monitor changes and dirty relationships
		 * */
		_startObservers: function() {		
			var self = this;
			
			// we will have to track and set the isDirty without using a computed property since there are cases where a computed property will not trigger an observer
			// if the property has not been fetch yet
			var dirtyHandler = function() {
				self.set('isDirty', self.get('hasDirtyAttributes') || self.get('hasDirtyRelationships') || self.get('isDeleted') || self.get('isNew'));
			};
			
			// add the observer for dirty change tracking
			this.addObserver('currentState.isDirty', dirtyHandler);
			this.addObserver('_dirtyRelationships.[]', dirtyHandler);
			this.addObserver('isDeleted', dirtyHandler);
			this.addObserver('isNew', dirtyHandler);
			
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
						var belongsTo = self.belongsTo(key);
						
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
				var hasMany = self.hasMany(key);
				
				if(meta.options.async) {
					var key_observer = key;
					
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
}));