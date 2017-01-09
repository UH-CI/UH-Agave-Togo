'use strict';

angular.module('AgaveToGo').controller('NotificationsResourceAddController', function($scope, $state, $stateParams, $translate, ActionsService, MessageService, NotificationsController) {
		$scope.model = {};
		if ($stateParams.associatedUuid){
			$scope.model.associatedUuid = $stateParams.associatedUuid;
		}
		if ($stateParams.resourceType){
			$scope.model.resource = $stateParams.resourceType;
		}

		$scope.schema = {
			'type': 'object',
			'properties': {
					'associatedUuid': {
							'type': 'string',
							'description': 'The associated resource uuid',
							'title': 'Associated UUID'
					},
					'resource': {
						'type': 'string',
						'description': 'The notification resource type',
						'enum': [
								'app', 'file', 'job', 'metadata', 'monitor', 'schema', 'system', 'postit', 'profile'
						],
						'title': 'Resource type'
					},
					'persistent': {
						'type': 'string',
						'description': 'Specifies whether the notification should fire more than once. If set to false, the notification will be removed after it is fired',
						'enum': [
								'true', 'false'
						],
						'title': 'Persistent'
					},
					'url': {
						'type': 'string',
						'description': 'URL to which Agave will send a POST request when that event occurs. A webhook can be any web accessible URL. Use this fanout.io default to see live toast alerts in Agave ToGo',
						'format': 'url',
						'title': 'URL',
						'default': 'https://48e3f6fe.fanoutcdn.com/fpp'
						// 'validator': '(http|https)://[\\w-]+(\\.[\\w-]*)+([\\w.,@?^=%&amp;:/~+#-]*[\\w@?^=%&amp;/~+#-])?'
					},
			}
		};
		$scope.form = [
			'associatedUuid',
			'resource',
			{
				'key': 'event',
				'condition': 'model.resource === "app"',
				'type': 'select',
				'description': 'The events to which you want to be notified',
				'titleMap': [
						{'value': '*', 'name': '*'},
						{'value': 'UPDATED', 'name': 'UPDATED'},
						{'value': 'DELETED', 'name': 'DELETED'},
						{'value': 'PUBLISHED', 'name': 'PUBLISHED'},
						{'value': 'CLONED', 'name': 'CLONED'},
						{'value': 'PERMISSION_GRANT', 'name': 'PERMISSION_GRANT'},
						{'value': 'PERMISSION_REVOKE', 'name': 'PERMISSION_REVOKE'},
						{'value': 'RESTORED', 'name': 'RESTORED'},
						{'value': 'UNPUBLISHED', 'name': 'UNPUBLISHED'},
						{'value': 'PUBLISHING_FAILED', 'name': 'PUBLISHING_FAILED'},
						{'value': 'DISABLED', 'name': 'DISABLED'},
						{'value': 'CLONING_FAILED', 'name': 'CLONING_FAILED'},
						{'value': 'REGISTERED', 'name': 'REGISTERED'}
				],
				'title': 'Events',
				ngModelOptions: {
					updateOnDefault: true
				}
			},
			{
				'key': 'event',
				'condition': 'model.resource === "file"',
				'type': 'select',
				'description': 'The events to which you want to be notified',
				'titleMap': [
						{'value': '*', 'name': '*'},
						{'value': 'CREATED', 'name': 'CREATED'},
						{'value': 'DELETED', 'name': 'DELETED'},
						{'value': 'RENAME', 'name': 'RENAME'},
						{'value': 'MOVED', 'name': 'MOVED'},
						{'value': 'OVERWRITTEN', 'name': 'OVERWRITTEN'},
						{'value': 'PERMISSION_GRANT', 'name': 'PERMISSION_GRANT'},
						{'value': 'PERMISSION_REVOKE', 'name': 'PERMISSION_REVOKE'},
						{'value': 'STAGING_QUEUED', 'name': 'STAGING_QUEUED'},
						{'value': 'STAGING','name': 'STAGING'},
						{'value': 'STAGING_FAILED', 'name': 'STAGING_FAILED'},
						{'value': 'STAGING_COMPLETED', 'name': 'STAGING_COMPLETED'},
						{'value': 'PREPROCESSING', 'name': 'PREPROCESSING'},
						{'value': 'TRANSFORMING_QUEUED', 'name': 'TRANSFORMING_QUEUED'},
						{'value': 'TRANSFORMING', 'name': 'TRANSFORMING'},
						{'value': 'TRANSFORMING_FAILED', 'name': 'TRANSFORMING_FAILED'},
						{'value': 'TRANSFORMING_COMPLETED', 'name': 'TRANSFORMING_COMPLETED'},
						{'value': 'UPLOADED', 'name': 'UPLOADED'},
						{'value': 'CONTENT_CHANGED', 'name': 'CONTENT_CHANGED'}
				],
				'title': 'Events',
				ngModelOptions: {
					updateOnDefault: true
				}
			},
			{
				'key': 'event',
				'condition': 'model.resource === "job"',
				'type': 'select',
				'description': 'The events to which you want to be notified',
				'titleMap': [
						{'value': '*', 'name': '*'},
						{'value': 'CREATED', 'name': 'CREATED'},
						{'value': 'UPDATED', 'name': 'UPDATED'},
						{'value': 'DELETED', 'name': 'DELETED'},
						{'value': 'PERMISSION_GRANT', 'name': 'PERMISSION_GRANT'},
						{'value': 'PERMISSION_REVOKE', 'name': 'PERMISSION_REVOKE'},
						{'value': 'PENDING', 'name': 'PENDING'},
						{'value': 'STAGING_INPUTS', 'name': 'STAGING_INPUTS'},
						{'value': 'CLEANING_UP', 'name': 'CLEANING_UP'},
						{'value': 'ARCHIVING', 'name': 'ARCHIVING'},
						{'value': 'STAGING_JOB', 'name': 'STAGING_JOB'},
						{'value': 'FINISHED', 'name': 'FINISHED'},
						{'value': 'KILLED', 'name': 'KILLED'},
						{'value': 'FAILED', 'name': 'FAILED'},
						{'value': 'STOPPED', 'name': 'STOPPED'},
						{'value': 'RUNNING', 'name': 'RUNNING'},
						{'value': 'PAUSED', 'name': 'PAUSED'},
						{'value': 'QUEUED', 'name': 'QUEUED'},
						{'value': 'SUBMITTING', 'name': 'SUBMITTING'},
						{'value': 'STAGED', 'name': 'STAGED'},
						{'value': 'PROCESSING_INPUTS', 'name': 'PROCESSING_INPUTS'},
						{'value': 'ARCHIVING_FINISHED', 'name': 'ARCHIVING_FINISHED'},
						{'value': 'ARCHIVING_FAILED', 'name': 'ARCHIVING_FAILED'},
						{'value': 'HEARTBEAT', 'name': 'HEARTBEAT'}
				],
				'title': 'Events',
				ngModelOptions: {
					updateOnDefault: true
				}
			},
			{
				'key': 'event',
				'condition': 'model.resource === "metadata"',
				'type': 'select',
				'description': 'The events to which you want to be notified',
				'titleMap': [
						{'value': '*', 'name': '*'},
						{'value': 'CREATED', 'name': 'CREATED'},
						{'value': 'UPDATED', 'name': 'UPDATED'},
						{'value': 'DELETED', 'name': 'DELETED'},
						{'value': 'PERMISSION_GRANT', 'name': 'PERMISSION_GRANT'},
						{'value': 'PERMISSION_REVOKE', 'name': 'PERMISSION_REVOKE'},
				],
				'title': 'Events',
				ngModelOptions: {
					updateOnDefault: true
				}
			},
			{
				'key': 'event',
				'condition': 'model.resource === "monitor"',
				'type': 'select',
				'description': 'The events to which you want to be notified',
				'titleMap': [
						{'value': '*', 'name': '*'},
						{'value': 'CREATED', 'name': 'CREATED'},
						{'value': 'CANCELLED', 'name': 'CANCELLED'},
						{'value': 'ACTIVATED', 'name': 'ACTIVATED'},
						{'value': 'DEACTIVATED', 'name': 'DEACTIVATED'},
						{'value': 'RESULT_CHANGE', 'name': 'RESULT_CHANGE'},
						{'value': 'STATUS_CHANGE', 'name': 'STATUS_CHANGE'},
						{'value': 'PASSED', 'name': 'PASSED'},
						{'value': 'FAILED', 'name': 'FAILED'},
						{'value': 'UNKNOWN', 'name': 'UNKNOWN'}
				],
				'title': 'Events',
				ngModelOptions: {
					updateOnDefault: true
				}
			},
			{
				'key': 'event',
				'condition': 'model.resource === "schema"',
				'type': 'select',
				'description': 'The events to which you want to be notified',
				'titleMap': [
						{'value': '*', 'name': '*'},
						{'value': 'CREATED', 'name': 'CREATED'},
						{'value': 'UPDATED', 'name': 'UPDATED'},
						{'value': 'DELETED', 'name': 'DELETED'},
						{'value': 'PERMISSION_GRANT', 'name': 'PERMISSION_GRANT'},
						{'value': 'PERMISSION_REVOKE', 'name': 'PERMISSION_REVOKE'}
				],
				'title': 'Events',
				ngModelOptions: {
					updateOnDefault: true
				}
			},
			{
				'key': 'event',
				'condition': 'model.resource === "system"',
				'type': 'select',
				'description': 'The events to which you want to be notified',
				'titleMap': [
						{'value': '*', 'name': '*'},
						{'value': 'CREATED', 'name': 'CREATED'},
						{'value': 'UPDATED', 'name': 'UPDATED'},
						{'value': 'DELETED', 'name': 'DELETED'},
						{'value': 'ROLES_GRANT', 'name': 'ROLES_GRANT'},
						{'value': 'ROLES_REVOKE', 'name': 'ROLES_REVOKE'},
						{'value': 'STATUS_CHANGE', 'name': 'STATUS_CHANGE'}
				],
				'title': 'Events',
				ngModelOptions: {
					updateOnDefault: true
				}
			},
			{
				'key': 'event',
				'condition': 'model.resource === "postit"',
				'type': 'select',
				'description': 'The events to which you want to be notified',
				'titleMap': [
						{'value': '*', 'name': '*'},
						{'value': 'CREATED', 'name': 'CREATED'},
						{'value': 'UPDATED', 'name': 'UPDATED'},
						{'value': 'REFRESHED', 'name': 'REFRESHED'},
						{'value': 'DELETED', 'name': 'DELETED'},
						{'value': 'REDEEMED', 'name': 'REDEEMED'}
				],
				'title': 'Events',
				ngModelOptions: {
					updateOnDefault: true
				},
			},
			{
					'key': 'event',
					'condition': 'model.resource === "profile"',
					'type': 'select',
					'description': 'The events to which you want to be notified',
					'titleMap': [
							{'value': '*', 'name': '*'},
							{'value': 'CREATED', 'name': 'CREATED'},
							{'value': 'DELETED', 'name': 'DELETED'},
							{'value': 'UPDATED', 'name': 'UPDATED'},
							{'value': 'ACCOUNT_ACTIVATED', 'name': 'ACCOUNT_ACTIVATED'},
							{'value': 'ACCOUNT_DEACTIVATED', 'name': 'ACCOUNT_DEACTIVATED'},
							{'value': 'ROLE_GRANTED', 'name': 'ROLE_GRANTED'},
							{'value': 'ROLE_REVOKED', 'name': 'ROLE_REVOKED'},
							{'value': 'QUOTA_EXCEEDED', 'name': 'QUOTA_EXCEEDED'}
					],
					'title': 'Events',
					ngModelOptions: {
						updateOnDefault: true
					}
			},
			'persistent',
			'url'
		];

		$scope.delete = function(){
			ActionsService.confirmAction('notifications', $scope.notification, 'delete');
		};

		$scope.submit = function(){
			$scope.requesting = true;
			var body = {};
			body.associatedUuid = $scope.model.associatedUuid;
			body.event = $scope.model.event;
			body.url = $scope.model.url;
			body.persistent = $scope.model.persistent;


			NotificationsController.addNotification(body)
				.then(
					function(response){
						$scope.notificationId = response.result.id;
						App.alert({message: $translate.instant('success_notifications_add') + $scope.notificationId });
						$scope.requesting = false;
					},
					function(response){
						MessageService.handle(response, $translate.instant('error_notifications_add'));
						$scope.requesting = false;
					}
				);
		};

		$scope.test = function(){
			var body = {'foo': 'bar'};

			NotificationsController.fireNotification(body, $scope.notificationId)
				.then(
					function(){
						App.alert({message: $translate.instant('success_notifications_test') + $scope.notificationId});
					},
					function(response){
						MessageService.handle(response, $translate.instant('error_notifications_test'));
					}
				);
		}


	});
