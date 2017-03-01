define([
	'ember-data',
	'rollback-extended-mixin'
], function(
	EmberData,
	RollbackExtendedMixin
) {
	EmberData.Model.reopen(RollbackExtendedMixin);
	return EmberData.Model;
});
