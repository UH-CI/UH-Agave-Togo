angular.module('AgaveToGo').service('PermissionsService',['$uibModal', '$rootScope', '$location', '$state', '$timeout', '$q', '$translate', 'AppsController', 'JobsController', 'ProfilesController', 'MetaController', 'MessageService', function($uibModal, $rootScope, $location, $state, $timeout, $q, $translate, AppsController, JobsController, ProfilesController, MetaController, MessageService){
  this.editPermissions = function(resource, resourceType){
      var modalInstance = $uibModal.open({
        templateUrl: 'tpl/modals/ModalPermissionManager.html',
        scope: $rootScope,
        resolve:{
            resource: function() {
              return resource;
            },
            resourceType: function(){
              return resourceType;
            }
        },
        controller: ['$scope', '$modalInstance', 'resource',
          function($scope, $modalInstance, resource){
            $scope.resource = resource;
            $scope.resourceType = resourceType;

            $scope.getRwxObj = function() {
                return {
                      read: false,
                      write: false,
                      execute: false
                };
            };

            $scope.transformRwxToAgave = function(rwxObj) {
              var result = '';
              if (rwxObj.read === true && rwxObj.write === true && rwxObj.execute === true){
                result = 'ALL';
              }
              else if (rwxObj.read === true && (rwxObj.write === false || typeof rwxObj.write === 'undefined') && (rwxObj.execute === false || typeof rwxObj.execute === 'undefined')){
                result = 'READ';
              }
              else if ((rwxObj.read === false || typeof rwxObj.read === 'undefined') && rwxObj.write === true && (rwxObj.execute === false || typeof rwxObj.execute === 'undefined')) {
                result = 'WRITE';
              }
              else if ((rwxObj.read === false || typeof rwxObj.read === 'undefined') && (rwxObj.write === false || typeof rwxObj.write === 'undefined') && rwxObj.execute === true) {
                result = 'EXECUTE';
              }
              else if (rwxObj.read === true && rwxObj.write === true && (rwxObj.execute === false || typeof rwxObj.execute === 'undefined')) {
                result = 'READ_WRITE';
              }
              else if (rwxObj.read === true && (rwxObj.write === false || typeof rwxObj.write === 'undefined') && rwxObj.execute === true) {
                result = 'READ_EXECUTE';
              }
              else if ((rwxObj.read === false || rwxObj.read === 'undefined') && rwxObj.write === true && rwxObj.execute === true) {
                result = 'WRITE_EXECUTE';
              }
              else {
                result = 'NONE';
              }
              return result;
            };

            $scope.transformAgaveToRwx = function(agavePermission) {
              var rwxObj = $scope.getRwxObj();

              switch(agavePermission){
                  case "ALL":
                      rwxObj.read = true;
                      rwxObj.write = true;
                      rwxObj.execute = true;
                    break;
                  case "READ":
                      rwxObj.read = true;
                    break;
                  case "WRITE":
                      rwxObj.write = true;
                    break;
                  case "EXECUTE":
                      rwxObj.execute = true;
                    break;
                  case "READ_WRITE":
                      rwxObj.read = true;
                      rwxObj.write = true;
                    break;
                  case "READ_EXECUTE":
                      rwxObj.read = true;
                      rwxObj.execute = true;
                    break;
                  case "WRITE_EXECUTE":
                      rwxObj.write = true;
                      rwxObj.execute = true;
                    break;
                  case "EXECUTE":
                      rwxObj.execute = true;
                    break;
              }

              return rwxObj;
            };

            $scope.refresh = function(resourceType) {
              $scope.requesting = true;

              switch(resourceType){
                case 'apps':
                  console.log('inside apps');
                  AppsController.listAppPermissions($scope.resource.id, 99999, 0).then(
                    function(response) {
                        $scope.model = {};
                        $scope.tempModel = {};

                        $scope.schema =
                        {
                          "type": "object",
                          "title": "Complex Key Support",
                          "properties": {
                            "name": {
                              "type": "string",
                              "title": "Name"
                            },
                            "permissions": {
                              "title": "permissions by username",
                              "type": "array",
                              "items": {
                                "type": "object",
                                "properties": {
                                  "username": {
                                    "title": " ",
                                    "type": "string"
                                  },
                                  "permission": {
                                    "title": " ",
                                    "type": "string",
                                    "enum": [
                                      "ALL",
                                      "READ",
                                      "WRITE",
                                      "EXECUTE",
                                      "READ_WRITE",
                                      "READ_EXECUTE",
                                      "WRITE_EXECUTE",
                                      "NONE"
                                    ]
                                  }
                                },
                              }
                            },
                          }
                        };

                        $scope.form = [
                          {
                            "key": "permissions",
                            "items": [
                              {
                                "type": "fieldset",
                                "items": [
                                    {
                                      "type": "section",
                                      "htmlClass": "col-xs-6",
                                      "items": [
                                          {
                                            "key": "permissions[].username"
                                          }
                                      ],

                                    },
                                    {
                                      "type": "section",
                                      "htmlClass": "col-xs-6",
                                      "items": ["permissions[].permission"]
                                    }
                                ]
                              }
                            ]
                          }
                        ];

                        var tempList = [];
                        $scope.tempModel.permissions = [];

                        angular.forEach(response.result, function(permission){
                          tempList.push({username: permission.username, permission:  $scope.transformRwxToAgave(permission.permission)});
                        });

                        // remove double listing of permissions for admin app owners
                        var uniqueTempList = _.uniq(tempList, function(permission){
                          return permission.username;
                        });
                        $scope.tempModel.permissions = angular.copy(uniqueTempList);

                        $scope.model.permissions = _.clone($scope.tempModel.permissions);
                        $scope.requesting = false;
                      },
                      function(response) {
                          $scope.requesting = false;
                          $modalInstance.dismiss('cancel');
                          MessageService.handle(response, $translate.instant('error_apps_permissions'));
                      });
                break;

                case 'metas':
                  MetaController.listMetadataPermissions($scope.resource.uuid, 99999, 0)
                  .then(
                    function(response){
                      $scope.model = {};
                      $scope.tempModel = {};

                      $scope.schema =
                      {
                        "type": "object",
                        "title": "Complex Key Support",
                        "properties": {
                          "name": {
                            "type": "string",
                            "title": "Name"
                          },
                          "permissions": {
                            "title": "permissions by username",
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "username": {
                                  "title": " ",
                                  "type": "string"
                                },
                                "permission": {
                                  "title": " ",
                                  "type": "string",
                                  "enum": [
                                    "ALL",
                                    "READ",
                                    "WRITE",
                                    "EXECUTE",
                                    "READ_WRITE",
                                    "READ_EXECUTE",
                                    "WRITE_EXECUTE",
                                    "NONE"
                                  ]
                                }
                              },
                            }
                          },
                        }
                      };

                      $scope.form = [
                        {
                          "key": "permissions",
                          "items": [
                            {
                              "type": "fieldset",
                              "items": [
                                  {
                                    "type": "section",
                                    "htmlClass": "col-xs-6",
                                    "items": [
                                        {
                                          "key": "permissions[].username"
                                        }
                                    ],

                                  },
                                  {
                                    "type": "section",
                                    "htmlClass": "col-xs-6",
                                    "items": ["permissions[].permission"]
                                  }
                              ]
                            }
                          ]
                        }
                      ];

                      var tempList = [];
                      $scope.tempModel.permissions = [];

                      angular.forEach(response.result, function(permission){
                        tempList.push({username: permission.username, permission:  $scope.transformRwxToAgave(permission.permission)});
                      });

                      // remove double listing of permissions for admin app owners
                      var uniqueTempList = _.uniq(tempList, function(permission){
                        return permission.username;
                      });
                      $scope.tempModel.permissions = angular.copy(uniqueTempList);

                      $scope.model.permissions = _.clone($scope.tempModel.permissions);
                      $scope.requesting = false;
                    },
                    function(response){
                      MessageService.handle(response, $translate.instant('error_meta_permissions_list'));
                    }
                  );
                break;
                case 'jobs':
                  console.log('inside jobs');
                  JobsController.listJobPermissions($scope.resource.id, 99999, 0).then(
                      function(response) {
                        $scope.model = {};
                        $scope.tempModel = {};

                        $scope.schema =
                        {
                          "type": "object",
                          "title": "Complex Key Support",
                          "properties": {
                            "name": {
                              "type": "string",
                              "title": "Name"
                            },
                            "permissions": {
                              "title": "permissions by username",
                              "type": "array",
                              "items": {
                                "type": "object",
                                "properties": {
                                  "username": {
                                    "title": " ",
                                    "type": "string"
                                  },
                                  "permission": {
                                    "title": " ",
                                    "type": "string",
                                    "enum": [
                                      "ALL",
                                      "READ",
                                      "WRITE",
                                      "EXECUTE",
                                      "READ_WRITE",
                                      "READ_EXECUTE",
                                      "WRITE_EXECUTE",
                                      "NONE"
                                    ]
                                  }
                                },
                              }
                            },
                          }
                        };

                        $scope.form = [
                          {
                            "key": "permissions",
                            "items": [
                              {
                                "type": "fieldset",
                                "items": [
                                  {
                                    "type": "section",
                                    "htmlClass": "col-xs-6",
                                    "items": [
                                      {
                                        "key": "permissions[].username"
                                      }
                                    ],

                                  },
                                  {
                                    "type": "section",
                                    "htmlClass": "col-xs-6",
                                    "items": ["permissions[].permission"]
                                  }
                                ]
                              }
                            ]
                          }
                        ];

                        var tempList = [];
                        $scope.tempModel.permissions = [];

                        angular.forEach(response.result, function(permission){
                          tempList.push({username: permission.username, permission:  $scope.transformRwxToAgave(permission.permission)});
                        });

                        // remove double listing of permissions for admin app owners
                        var uniqueTempList = _.uniq(tempList, function(permission){
                          return permission.username;
                        });
                        $scope.tempModel.permissions = angular.copy(uniqueTempList);

                        $scope.model.permissions = _.clone($scope.tempModel.permissions);
                        $scope.requesting = false;
                      },
                      function(response) {
                        $scope.requesting = false;
                        $modalInstance.dismiss('cancel');
                        MessageService.handle(response, $translate.instant('error_jobs_permissions'));
                      });
                  break;

              }


            };

            $scope.clearpermissions = function() {
                $scope.model = {};
                $scope.tempModel = {};
            };


            $scope.savePermissionChanges = function(){
              var deletedpermissions = _.difference($scope.model.permissions, $scope.tempModel.permissions);

              $scope.requesting = true;
              var promises = [];

              switch($scope.resourceType){
                case 'apps':
                  var deletedpermissions = _.difference($scope.model.permissions, $scope.tempModel.permissions);
                  $scope.requesting = true;
                  var promises = [];

                  // Take care of deleted permissions first
                  angular.forEach(deletedpermissions, function(permission){
                  promises.push(
                    AppsController.deleteAppPermission(resource.id, permission.username)
                    );
                  });

                  angular.forEach($scope.tempModel.permissions, function(permission){
                    promises.push(
                      AppsController.updateAppPermission(resource.id, permission , permission.username)
                    );
                  });

                  $q.all(promises).then(
                  function(response) {
                    App.alert({message: $translate.instant('success_apps_permissions_update') + resource.id});
                    $scope.requesting = false;
                    $modalInstance.close();
                  },
                  function(response) {
                    App.alert({message: $translate.instant('error_apps_permissions_update')});
                    $scope.requesting = false;
                    $modalInstance.close();
                  });
                break

                case 'metas':
                  // Take care of deleted permissions first
                  angular.forEach(deletedpermissions, function(permission){
                    promises.push(
                      MetaController.deleteMetadataPermission(permission.username, resource.uuid)
                    );
                  });

                  angular.forEach($scope.tempModel.permissions, function(permission){
                    promises.push(
                      MetaController.updateMetadataPermission(permission, permission.username, resource.uuid)
                    );
                  });

                  $q.all(promises).then(
                    function(response) {
                        App.alert({message: $translate.instant('success_meta_permissions_update') + resource.uuid});
                        $scope.requesting = false;
                        $modalInstance.close();
                    },
                    function(response) {
                        App.alert({message: $translate.instant('error_meta_permissions_update')});
                        $scope.requesting = false;
                        $modalInstance.close();
                    });
                break;

                case 'jobs':
                  var deletedpermissions = _.difference($scope.model.permissions, $scope.tempModel.permissions);
                  $scope.requesting = true;
                  var promises = [];

                  // Take care of deleted permissions first
                  angular.forEach(deletedpermissions, function(permission){
                    promises.push(
                        JobsController.deleteJobPermission(resource.id, permission.username)
                    );
                  });

                  angular.forEach($scope.tempModel.permissions, function(permission){
                    promises.push(
                        JobsController.updateJobPermission(permission, resource.id, permission.username)
                    );
                  });

                  $q.all(promises).then(
                      function(response) {
                        App.alert({message: $translate.instant('success_jobs_permissions_update') + resource.id});
                        $scope.requesting = false;
                        $modalInstance.close();
                      },
                      function(response) {
                        App.alert({message: $translate.instant('error_jobs_permissions_update')});
                        $scope.requesting = false;
                        $modalInstance.close();
                      });
                  break
              }


            };

            $scope.cancel = function()
            {
                $modalInstance.dismiss('cancel');
            };

            $scope.refresh(resourceType);
        }]

      });
  };

  this.edit = function(resourceType, resource){
    switch(resourceType){
      case 'apps': $state.go('apps-edit', {'appId': resource.id });
        break;
      case 'jobs': $state.go('jobs-edit', {'jobId': resource.id });
        break;
      case 'systems': $state.go('systems-edit', {'systemId': resource.id });
        break;
    }
  }
}]);
