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

	// apply the mixin for all models
	require([
		"rollback-extended"
	], function(
		RollbackExtended
	) {
		// proceed with model creation
	})

	// apply the mixin for only a select model
	require([
                "rollback-extended-mixin"
        ], function(
                RollbackExtendedMixin
        ) {
                // proceed with model creation
		var User = DS.Model.extend(RollbackExtendedMixin, {

		});
        })


