angular.module('AgaveToGo').controller('AppDirectoryController', function ($injector, $timeout, $rootScope, $scope, $state, $stateParams, $q, $uibModal, $http, $translate, Commons, AppsController, SystemsController, ActionsService, PermissionsService, MessageService) {

    $scope.offset = $scope.offset || 0;
    $scope.limit = $scope.limit || 25;
    $scope.systems = [];

    $scope._COLLECTION_NAME = $scope._COLLECTION_NAME || 'apps';

    $scope._RESOURCE_NAME = $scope._RESOURCE_NAME || 'app';

    $scope.limit = 10;
    $scope.available = true;
    $scope.publicOnly = null;
    $scope.privateOnly = null;
    $scope.sortType = 'lastModified';
    $scope.sortReverse  = true;

    $scope.appsList = [];
    $scope.appsDetailsList = [];

    $scope.filter = '';
    $scope.query = 'filter=id,name,version,label,shortDescription,executionSystem,tags,isPublic,revision,lastModified,uuid&public=false';

    $scope.refresh = function() {
        $scope.appsList = [];
        $scope.appsDetailsList = [];
        $scope.requesting = true;

        SystemsController.listSystems(99999).then(
            function (response) {
              $scope.systems = response.result;

              AppsController.searchApps(
                $scope.query
              )
                .then(
                  function(response){
                    $scope[$scope._COLLECTION_NAME] = [];
                    _.each(response.result, function(app){
                      if ($scope.query.indexOf("available.eq=false") === -1){
                        app.available = true;
                        console.log(app)
                        if (app['tags'].indexOf("C-MAIKI") > -1){
                          $scope[$scope._COLLECTION_NAME].push(app);
                        }
                      } else {
                        if (app['tags'].indexOf("C-MAIKI") > -1){
                          $scope[$scope._COLLECTION_NAME].push(app);
                        } 
                      }
                    });
                    // $scope[$scope._COLLECTION_NAME] = response.result;
                    $scope.requesting = false;
                  }, function(response){
                    MessageService.handle(response, $translate.instant('error_apps_search'));
                    $scope.requesting = false;
                  }
                );
            },
            function(response){
              MessageService.handle(response, $translate.instant('error_apps_search'));
              $scope.requesting = false;
            }
        );
    };

    $scope.refresh();

    $scope.searchTools = function(query){
      $scope.query = 'filter=id,name,version,label,shortDescription,executionSystem,isPublic,revision,lastModified,uuid&';
      $scope.query += query;
      $scope.refresh();
    }

    $scope.clone = function(resourceType, resource, resourceAction, resourceList, resourceIndex){
      ActionsService.clone(resourceType, resource, resourceAction, resourceList, resourceIndex);
    }

    $scope.confirmAction = function(resourceType, resource, resourceAction, resourceList, resourceIndex){
      ActionsService.confirmAction(resourceType, resource, resourceAction, resourceList, resourceIndex);
    }

    $scope.edit = function(resourceType, resource){
      ActionsService.edit(resourceType, resource);
    };

    $scope.editPermissions = function(resource, resourceType) {
      PermissionsService.editPermissions(resource, resourceType);
    }

    $scope.getNotifications = function(resourceType, resource){
      ActionsService.getNotifications(resourceType, resource);
    };

    $scope.getSystemName = function(id) {
      if (id) {
          for(var i=0; i<$scope.systems.length; i++) {
              if ($scope.systems[i].id === id) {
                  return $scope.systems[i].name;
              }
          }
      }
      return id;
    };

});
