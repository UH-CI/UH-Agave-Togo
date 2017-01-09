'use strict';

angular.module('AgaveToGo').controller('MetaManagerDirectoryController', function ($scope, $translate, $stateParams, MetaController, ActionsService, ActionsBulkService, MessageService) {

    $scope._COLLECTION_NAME = 'metas';
    $scope._RESOURCE_NAME = 'meta';

    $scope[$scope._COLLECTION_NAME] = [];
    $scope.metaSelected = [];

    $scope.query = '';

    $scope.offset = 0;
    $scope.limit = 10;

    $scope.sortType = 'lastUpdated';
    $scope.sortReverse  = true;

    $scope.refresh = function() {
      $scope.requesting = true;

      if ($stateParams.id){
        $scope.filter = $stateParams.id;
      }

      MetaController.listMetadata($scope.query, $scope.limit, $scope.offset)
        .then(
          function (response) {
            $scope[$scope._COLLECTION_NAME] = response.result;
            $scope.requesting = false;
          },
          function(response){
            MessageService.handle(response, $translate.instant('error_meta_list'));
            $scope.requesting = false;
          }
      );
    };


    $scope.searchButton = true;

    $scope.handleError = function(error){
      if (typeof error === 'undefined'){
        $scope.searchButton = true;
      } else {
        $scope.searchButton = false;
      }
    };

    $scope.options = {mode: 'code', change: $scope.handleError };

    $scope.search = function(){
      $scope.requesting = true;
      try {
        var queryString = JSON.stringify($scope.query);
        MetaController.listMetadata(queryString, $scope.limit, $scope.offset)
          .then(
            function (response) {
              $scope[$scope._COLLECTION_NAME] = response.result;
              $scope.requesting = false;
            },
            function(response){
              MessageService.handle(response, $translate.instant('error_meta_list'));
              $scope.requesting = false;
            }
        );

      } catch (error){
        App.alert(
          {
            type: 'danger',
            message:   $translate.instant('error_meta_search_query') + error
          }
        );
      }
    };

    $scope.selectAllMetas = function(checkAll){
      if (checkAll){
        _.each($scope[$scope._COLLECTION_NAME], function(meta){
          $scope.metaSelected.push(meta);
        });
      } else {
        $scope.metaSelected = [];
      }
    };

    $scope.confirmBulkAction = function(collectionType, collection, selected, collectionAction){
      ActionsBulkService.confirmBulkAction(collectionType, collection, selected, collectionAction);

    };

    $scope.confirmAction = function(resourceType, resource, resourceAction, resourceList, resourceIndex){
      ActionsService.confirmAction(resourceType, resource, resourceAction, resourceList, resourceIndex);
    };

    $scope.$on('ActionsBulkService:done', function() {
      $scope.metaSelected = [];
    });

    $scope.refresh();
});
