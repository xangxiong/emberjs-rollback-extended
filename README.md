# emberjs-rollback-extended
The EmberJS Rollback Extended mixin adds rollback support for EmberData relationships.  This mixin supports both deep and shallow relationship rollback.

## Deep Relationship
Deep relationships will make the model referencing it dirty if the below scenario occurrs.

- BelongsTo becomes dirty
- BelongsTo is changed
- BelongsTo is deleted
- HasMany has a record that is dirty
- HasMany is changed to a completely new list
- HasMany content is changed

## Shallow Relationship
Shallow relationships will only make the model referencing it dirty if the below scenario occurrs.

- BelongsTo is changed
- HasMany is changed to a completely new list
- HasMany content is changed

## Usage
The Rollback Extended mixin assumes that RequireJS is being used to load these JS files.  To apply the mixin to all DS.Model, load the `rollback-extended`.  Otherwise add the `rollback-extended-mixin` to any model needing this feature.

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
All relationships will default to **Shallow** unless specifically defined to be **Deep**.

	require([
		"ember-data",
                "rollback-extended-mixin"
        ], function(
		DS,
                RollbackExtendedMixin
        ) {
                // proceed with model creation
                var User = DS.Model.extend(RollbackExtendedMixin, {
                        // define deep relationships
			deepRelationships: ["options"],

			// model property definition
			name: DS.attr("string"),
			picture: DS.belongsTo('picture'),
			options: DS.hasMany('option')
                });
        });

### Rollback Model
Just call the `model.rollback` method for the model intended to be rollback.  All **Deep** relationship will also have their respective `rollback` method call as well.
	
	if(model.get("isDirty")) {
		model.rollback();
	}

