# emberjs-rollback-extended
The EmberJS Rollback Extended mixin was originally inspired by the rollback-relationships.js made available by `amkirwan` at https://gist.github.com/amkirwan/.  The original rollback-relationship.js was missing a few features along with some issues integrating with my application.  I decided to allocate some of my development cycle into building this rollback extended mixin to provide the missing features my application needed.

This mixin supports both deep and shallow relationship rollback, designated by the cascade.persist option along with automated saving.  This mixin now also supports the cascade.remove option which will automated deletion/unload of relationships.

## Supported Ember and EmberData versions
- Tested on Ember 2.11.2 and EmberData 2.11.2

## Shallow Relationship
All relationships will default to be a shallow relationship.  Shallow relationships will only make the model referencing it dirty if the below scenario occurrs.

- BelongsTo is changed
- HasMany is changed to a completely new list
- HasMany content is changed

All `save` on a model will not trigger a `save` on any of its shallow relationship models.

## Deep Relationship
All relationships with the option cascade.persist will automatically be classify has deep.  Deep relationships will make the model referencing it dirty if the below scenario occurrs.

- BelongsTo becomes dirty
- BelongsTo is changed
- BelongsTo is deleted
- HasMany has a record that is dirty
- HasMany is changed to a completely new list
- HasMany content is changed

All `save` on a model will also trigger a `save` on any of its deep relationships models.

## Cascading Remove
The `cascade.remove` flag will enable the relationship to auto trigger and cascade the `deleteRecord` and `unloadRecord` calls.  The `cascade.remove` by itself will not be able to handle the `destroyRecord` call as this method requires the `cascade.persist` to be enabled as well.  Calling the `destroyRecord` on a model will only mark all subsequent models as deleted, a specific `save` will be require to be invoke on each model to complete the `destroyRecord`.

## Usage
To apply the mixin to all DS.Model, load the `rollback-extended`.  Otherwise add the `rollback-extended-mixin` to any model needing this feature.

### Mixin for All

	require([
		"ember-data",
		"rollback-extended"
	], function(
		DS,
		RollbackExtended
	) {
		// proceed with model creation
		var User = DS.Model.extend({
			// model property definition
		});
	});

### Mixin for Selected Model

	require([
		"ember-data"
        "rollback-extended-mixin"
    ], function(
		DS,
        RollbackExtendedMixin
    ) {
		// proceed with model creation
		var User = DS.Model.extend(RollbackExtendedMixin, {
			// model property definition
		});
    });

### Defining Deep Relationships
All relationships will default to **Shallow** unless specifically defined to be **Deep** by adding the `cascade.persist` flag to the relationship options.

	require([
		"ember-data",
		"rollback-extended-mixin"
	], function(
		DS,
		RollbackExtendedMixin
	) {
		// proceed with model creation
		var User = DS.Model.extend(RollbackExtendedMixin, {
			// model property definition
			name: DS.attr("string"),
			picture: DS.belongsTo('picture'),
			options: DS.hasMany('option', {
				cascade: {
					persist: true
				}
			})
		});
	});

### Defining Cascading Remove
All relationship will not cascade removal.  To enable cascading of removal, add the `cascade.remove` flag to the relationship options.

	require([
		"ember-data",
		"rollback-extended-mixin"
	], function(
		DS,
		RollbackExtendedMixin
	) {
		// proceed with model creation
		var User = DS.Model.extend(RollbackExtendedMixin, {
			// model property definition
			name: DS.attr("string"),
			picture: DS.belongsTo('picture'),
			options: DS.hasMany('option', {
				cascade: {
					persist: true,
					remove: true
				}
			})
		});
	});

### Rollback Model
Just call the `model.rollback` method for the model intended to be rollback.  All **Deep** relationship will also have their respective `rollback` method call as well.
	
	if(model.get("isDirty")) {
		model.rollback();
	}