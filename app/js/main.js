'use strict';

/***
Agave ToGo AngularJS App Main Script
***/

/* Metronic App */
var AgaveToGo = angular.module('AgaveToGo', [
  'AgavePlatformScienceAPILib',
  'angular-cache',
  'angularMoment',
  'angularUtils.directives.dirPagination',
  'checklist-model',
  'CommonsService',
  'ds.objectDiff',
  'jsonFormatter',
  'JiraService',
  'ChangelogParserService',
  'ngCookies',
  'ngSanitize',
  'ngStorage',
  'ngMd5',
  'ng.jsoneditor',
  'oc.lazyLoad',
  'pascalprecht.translate',
  'schemaForm',
  'schemaFormWizard',
  'TagsService',
  'timer',
  'toastr',
  'ui.bootstrap',
  'ui.router',
  'ui.select'
]).service('NotificationsService',['$rootScope', '$localStorage', 'MetaController', 'toastr', function($rootScope, $localStorage, MetaController, toastr){
    if (typeof $localStorage.tenant !== 'undefined' && typeof $localStorage.activeProfile !== 'undefined') {
      this.client = new Fpp.Client('https://48e3f6fe.fanoutcdn.com/fpp');
      this.channel = this.client.Channel($localStorage.tenant.code + '/' + $localStorage.activeProfile.username);
      this.channel.on('data', function (data) {
        var toastData = {};
        if (data.event === 'FORCED_EVENT'){
          toastData = 'FORCED_ EVENT - ' + data.source;
        } else {
          if ('app' in data.message){
            toastData = 'APP - ' + data.event;
          } else if ('file' in data.message){
            toastData = 'FILE - ' + data.event;
          } else if ('job' in data.message){
            toastData = 'JOB - ' + data.event;
          } else if ('system' in data.message){
            toastData = 'SYSTEM - ' + data.event;
          } else {
            toastData = data.event;
          }
        }

        // saving all notifications to metadata for now
        var metadata = {};
        metadata.name = 'notifications';
        metadata.value = data;
        MetaController.addMetadata(metadata)
          .then(
            function(){
            },
            function(response){
              var message = '';
              if (response.errorResponse.message) {
                message = 'Error: Could not save notification - ' + response.errorResponse.message;
              } else if (response.errorResponse.fault){
                message = 'Error: Could not save notifications - ' + response.errorResponse.fault.message;
              } else {
                message = 'Error: Could not save notifications';
              }
              App.alert(
                {
                  type: 'danger',
                  message: message
                }
              );
            }
          );
        toastr.info(toastData);
      });
    } else {
      App.alert(
        {
          type: 'danger',
          message: 'Error: Invalid Credentials'
        }
      );
    }

}]);

/* Configure ocLazyLoader(refer: https://github.com/ocombe/ocLazyLoad) */
AgaveToGo.config(['$ocLazyLoadProvider', function($ocLazyLoadProvider) {
    $ocLazyLoadProvider.config({
        debug: true,
        modules: [
        {
            name: 'ui.codemirror',
            files: [
                '../bower_components/codemirror/lib/codemirror.css',
                '../bower_components/codemirror/theme/neo.css',
                '../bower_components/codemirror/lib/codemirror.js',
                '../bower_components/angular-ui-codemirror/ui-codemirror.min.js'
            ]
        }]
    });
}]);

AgaveToGo.config(function(toastrConfig) {
  angular.extend(toastrConfig, {
    allowHtml: false,
    autoDismiss: true,
    closeButton: true,
    maxOpened: 0,
    newestOnTop: true,
    positionClass: 'toast-top-right',
    preventDuplicates: false,
    preventOpenDuplicates: false,
    templates: {
      toast: 'directives/toast/toast.html',
      progressbar: 'directives/progressbar/progressbar.html'
    },
    timeOut: 5000
  });
});

AgaveToGo.config(function($locationProvider) {
    $locationProvider.html5Mode({
        enabled: false,
        //hashPrefix: '!',
        required: false
    });
});

AgaveToGo.config(function ($provide) {
  $provide.decorator('$q', function ($delegate) {

    /**
     * $q.allSettled returns a promise that is fulfilled with an array of promise state snapshots,
     * but only after all the original promises have settled, i.e. become either fulfilled or rejected.
     *
     * This method is often used in order to execute a number of operations concurrently and be
     * notified when they all finish, regardless of success or failure.
     *
     * @param promises array or object of promises
     * @returns {Promise} when resolved will contain an an array or object of resolved or rejected promises.
     * A resolved promise have the form { status: 'fulfilled', value: value }.  A rejected promise will have
     * the form { status: 'rejected', reason: reason }.
     */
    function allSettled(promises) {
      var deferred = $delegate.defer(),
          counter = 0,
          results = angular.isArray(promises) ? [] : {};

      angular.forEach(promises, function(promise, key) {
        counter++;
        $delegate.when(promise).then(function(value) {
          if (results.hasOwnProperty(key)) {
            return;
          }
          results[key] = { status: 'fulfilled', value: value };
          if (!(--counter)){
            deferred.resolve(results);
          }
        }, function(reason) {
          if (results.hasOwnProperty(key)){
            return;
          }
          results[key] = { status: 'rejected', reason: reason };
          if (!(--counter)){
            deferred.resolve(results);
          }
        });
      });

      if (counter === 0) {
        deferred.resolve(results);
      }

      return deferred.promise;
    }
    $delegate.allSettled = allSettled;
    return $delegate;
  });
});

AgaveToGo.config(function($translateProvider) {
  $translateProvider.translations('en', {
    error_apps_add: 'Error: Could not submit app',
    error_apps_details: 'Error: Could not retrieve app',
    error_apps_edit: 'Error: Could not edit app',
    error_apps_edit_permission: 'Error: User does not have permission to edit app',
    error_apps_files_select: 'Could not find a default system to browse files. Please specify a default system',
    error_apps_form: 'Error: Invalid form. Please check all fields',
    error_apps_permissions: 'Error: Could not retreive app permissions',
    error_apps_permissions_update: 'Error: Could not update app permissions',
    error_apps_search: 'Error: Could not retrieve apps',
    error_apps_template: 'Error: Could not retrieve app template',

    error_files_list: 'Error: Could not list files for the given system and path',

    error_jobs_create: 'Error: Could not submit job',
    error_jobs_details: 'Error: Could not retrieve job',
    error_jobs_list: 'Error: Could not retrieve jobs',

    error_meta_list: 'Error: Could not retrieve metadata',
    error_meta_update_uuid: 'Error: No metadata UUID provided',
    error_meta_add: 'Error: Could not add metadata',
    error_meta_search_query: 'Error: Could not parse search query - ',



    error_meta_schema_list: 'Error: Could not retrieve metadata schema',
    error_meta_schema_add: 'Error: Could not add metadata schema',
    error_meta_delete: 'Error: Could not delete the following metadata: ',
    error_meta_schema_delete: 'Error: Could not delete the following schema: ',
    error_meta_schema_update: 'Error: Could not create/update metadata schema',
    error_meta_schema_update_uuid: 'Error: No metadata schema UUID provided',

    error_monitors_add: 'Error: Could not add monitor',
    error_monitors_list: 'Error: Could not retrieve monitor',
    error_monitors_search: 'Error: Could not retrieve monitors',
    error_monitors_test: 'Error: Could not test monitor',
    error_monitors_update: 'Error: Could not update monitor',

    error_monitors_checks_id: 'Error: Please provide a monitor id',
    error_monitors_checks_search: 'Error: could not retrieve monitor checks',

    error_notifications_add: 'Error: Could not add notification',
    error_notifications_delete: 'Error: Could not delete notification: ',
    error_notifications_alerts: 'Error: Could not retrieve notification alerts',
    error_notifications_list: 'Error: Could not retrieve notification',
    error_notifications_search: 'Error: Could not retrieve notifications',
    error_notifications_test: 'Error: Could not test notification',
    error_notifications_update: 'Error: Could not update notification',

    error_profiles_list: 'Error: Could not retrieve profile',

    error_systems_add: 'Error: Could not create system',
    error_systems_default: 'Error: Could not set default system',
    error_systems_edit: 'Error: Could not edit system',
    error_systems_edit_permission: 'Error: User does not have permission to edit system',
    error_systems_form: 'Error: Invalid form. Please check all fields',
    error_systems_list: 'Error: Could not retrieve system',
    error_systems_roles: 'Error: Could not retrieve roles',
    error_systems_roles_update: 'Error: Could not update roles',
    error_systems_search: 'Error: Could not retrieve systems',
    error_systems_template: 'Error: Could not retrieve system template',

    success_apps_permissions_update: 'Success: updated permissions for ',

    success_files_permissions_update: 'Success updating file permissions',

    success_meta_delete: 'Success deleting metadata: ',
    success_meta_schema_delete: 'Success deleting schema: ',

    success_monitors_test: 'Success: fired monitor ',
    success_monitors_update: 'Success: updated ',

    success_notifications_add: 'Success adding notification: ',
    success_notifications_delete: 'Success deleting notification: ',
    success_notifications_test: 'Success: fired notification ',
    success_notifications_update: 'Success: updated ',

    success_schema_delete: 'Success deleting schema: ',

    success_systems_roles: 'Success: updated roles for ',
    setDefault: 'set to default',
    unsetDefault: 'unset default'
  });

  $translateProvider.preferredLanguage('en');
});

AgaveToGo.constant('angularMomentConfig', {
    timezone: 'America/Chicago' // optional
});

AgaveToGo.config(['$controllerProvider', function($controllerProvider) {
  // this option might be handy for migrating old apps, but please don't use it
  // in new ones!
  $controllerProvider.allowGlobals();
}]);


/* Setup global settings */
AgaveToGo.factory('settings', ['$rootScope', function($rootScope) {
    // supported languages
    var settings = {
        layout: {
            pageSidebarClosed: false, // sidebar menu state
            pageContentWhite: true, // set page content layout
            pageBodySolid: false, // solid body color state
            pageAutoScrollOnLoad: 1000 // auto scroll to top on page load
        },
        assetsPath: '../assets',
        globalPath: '../assets/global',
        layoutPath: '../assets/layouts/layout',
    };

    $rootScope.settings = settings;

    return settings;
}]);

/* Setup App Main Controller */
AgaveToGo.controller('AppController', ['$scope', '$rootScope', function($scope) {
    $scope.$on('$viewContentLoaded', function() {
        //App.initComponents(); // init core components
        //Layout.init(); //  Init entire layout(header, footer, sidebar, etc) on page load if the partials included in server side instead of loading with ng-include directive
    });
}]);

/***
Layout Partials.
By default the partials are loaded through AngularJS ng-include directive. In case they loaded in server side(e.g: PHP include function) then below partial
initialization can be disabled and Layout.init() should be called on page load complete as explained above.
***/

/* Setup Layout Part - Header */
AgaveToGo.controller('HeaderController', ['$scope', '$localStorage', 'StatusIoController', function($scope, $localStorage, StatusIoController) {
    $scope.showTokenCountdown = false;

    // get token countdown time
    if (typeof $localStorage.token !== 'undefined'){
      var currentDate = new Date();
      var expirationDate = Date.parse($localStorage.token.expires_at);
      var diff = Math.abs((expirationDate - currentDate) / 60000);
      $scope.tokenCountdown = diff * 60;
    }

    $scope.authenticatedUser = $localStorage.activeProfile;
    $scope.platformStatus = { status:'Up', statusCode: 100, incidents: [], issues:[]};

    StatusIoController.listStatuses().then(

        function(data) {
            var issues = [];
            for (var i=0; i<data.result.status.length; i++) {
                if (data.result.status[i].status_code !== 100) {
                    issues.push({
                        'component': data.result.status[i].name,
                        'container': data.result.status[i].containers[0].name,
                        'status': data.result.status[i].status,
                        'statusCode' : data.result.status[i].status_code,
                        'updated': data.result.status[i].updated
                    });
                }
            }
            setTimeout(function() {
                $scope.platformStatus.incidents = data.result.incidents;
                $scope.platformStatus.status = data.result.status_overall.status;
                $scope.platformStatus.statusCode = data.result.status_overall.status_code;
                $scope.platformStatus.issues = issues;

            }, 0);

        }
    );

    $scope.$on('$includeContentLoaded', function() {
        Layout.initHeader(); // init header
    });
}]);

/* Setup Layout Part - Sidebar */
AgaveToGo.controller('SidebarController', ['$scope', function($scope) {
    $scope.$on('$includeContentLoaded', function() {
        Layout.initSidebar(); // init sidebar
    });
}]);

/* Setup Layout Part - Quick Sidebar */
AgaveToGo.controller('QuickSidebarController', ['$scope', '$localStorage', 'ChangelogParser', function($scope, $localStorage, ChangelogParser) {
    $scope.$on('$includeContentLoaded', function() {
        $scope.changelog = {};

        $scope.tenant = $localStorage.tenant;
        $scope.alerts = [];
        ChangelogParser.latest().then(function(data) {
            if (data) {

                for(var version in data) {
                  break;
                }
                $scope.changelog = data[version];
                $scope.changelog.version = version;

            }
        });

        setTimeout(function(){
            QuickSidebar.init(); // init quick sidebar

        }, 2000)


    });
}]);

/* Setup Layout Part - Theme Panel */
AgaveToGo.controller('ThemePanelController', ['$scope', function($scope) {
    $scope.$on('$includeContentLoaded', function() {
        Demo.init(); // init theme panel
    });
}]);

/* Setup Layout Part - Footer */
AgaveToGo.controller('FooterController', ['$scope', function($scope) {
    $scope.$on('$includeContentLoaded', function() {
        Layout.initFooter(); // init footer
    });
}]);

/* Setup Rounting For All Pages */
AgaveToGo.config(['$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', function($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider) {
    function valToString(val) { return val != null ? val.toString() : val; }
    function valFromString(val) { return val != null ? val.toString() : val; }
    function regexpMatches(val) { /*jshint validthis:true */ return this.pattern.test(val); }

    // Redirect any unmatched url
    $urlRouterProvider.otherwise('/dashboard');

    $urlRouterProvider.rule(function ($injector, $location) {
       var path = $location.path().replace(/\/\/+/g, '/');
       $location.replace().path(path);
   });

    // Make trailing slashed options
    $urlMatcherFactoryProvider.strictMode(false);

    $stateProvider
        // Dashboard
        .state('dashboard', {
            url: '/dashboard',
            templateUrl: 'views/dashboard.html',
            data: {pageTitle: 'Admin Dashboard Template'},
            controller: 'DashboardController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before a LINK element with this ID. Dynamic CSS files must be loaded between core and theme css files
                        files: [
                            '../assets/global/plugins/morris/morris.css',
                            '../assets/global/plugins/morris/morris.min.js',
                            '../assets/global/plugins/morris/raphael-min.js',
                            '../assets/global/plugins/jquery.sparkline.min.js',
                            '../assets/pages/scripts/dashboard.min.js',
                            '../bower_components/faker/build/build/faker.min.js',
                            'js/controllers/DashboardController.js',
                        ]
                    });
                }]
            }
        })

        /**********************************************************************/
        /**********************************************************************/
        /***                                                                ***/
        /***                       Jobs Routes                              ***/
        /***                                                                ***/
        /**********************************************************************/
        /**********************************************************************/
        .state('jobs-manage', {
            url: '/jobs',
            templateUrl: 'views/jobs/manager.html',
            data: {pageTitle: 'Jobs Manager'},
            controller: 'JobsDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            //'../bower_components/datatables/media/css/dataTables.bootstrap.min.css',
                            //'../bower_components/datatables/media/css/jquery.dataTables.min.css',
                            //
                            //'../bower_components/datatables/media/js/dataTables.bootstrap.js',
                            //'../bower_components/datatables/media/js/jquery.dataTables.js',
                            '../assets/global/scripts/datatable.js',
                            '../bower_components/holderjs/holder.js',
                            'js/services/ActionsService.js',
                            'js/services/MessageService.js',
                            'js/services/PermissionsService.js',
                            'js/services/RolesService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/jobs/JobsDirectoryController.js'
                        ]
                    });
                }]
            }
        })

        .state('jobs', {
          abtract: true,
          url:'/jobs/:id',
          templateUrl:'views/jobs/resource/resource.html',
          controller: 'JobsResourceController',
          resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
              return $ocLazyLoad.load([
                {
                  name: 'AgaveToGo',
                    files: [
                      'js/controllers/jobs/resource/JobsResourceController.js'
                    ]
                }
              ]);
            }]
          }
        })

        .state('jobs.details', {
          url: '',
          templateUrl: 'views/jobs/resource/details.html',
          controller: 'JobsResourceDetailsController',
          resolve: {
              deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                  {
                    name: 'AgaveToGo',
                    files: [
                        'js/services/ActionsService.js',
                        'js/services/MessageService.js',
                        'js/services/PermissionsService.js',
                        'js/controllers/jobs/resource/JobsResourceDetailsController.js'
                    ]
                  }
                ]);
              }]
          }
        })

        .state('jobs.history', {
          url: '/history',
          controller: 'JobsResourceHistoryController',
          templateUrl: 'views/jobs/resource/history.html',
          resolve: {
              deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                  {
                    name: 'AgaveToGo',
                    files: [
                        'js/services/ActionsService.js',
                        'js/controllers/jobs/resource/JobsResourceHistoryController.js'
                    ]
                  }
                ]);
              }]
          }
        })

        .state('jobs.stats', {
          url: '/jobs',
          controller: 'JobsResourceStatsController',
          templateUrl: 'views/jobs/resource/stats.html',
          resolve: {
              deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                  {
                    name: 'AgaveToGo',
                    files: [
                        'js/controllers/jobs/resource/JobsResourceStatsController.js'
                    ]
                  }
                ]);
              }]
          }
        })

       /**********************************************************************/
       /**********************************************************************/
       /***                                                                ***/
       /***                         Metadata Routes                        ***/
       /***                                                                ***/
       /**********************************************************************/
       /**********************************************************************/

       .state('meta-schema-manager', {
           url: '/meta/schema',
           templateUrl: 'views/meta/schema-manager.html',
           data: {pageTitle: 'Metadata Schema Manager'},
           controller: 'SchemaManagerDirectoryController',
           resolve: {
               deps: ['$ocLazyLoad', function($ocLazyLoad) {
                   return $ocLazyLoad.load({
                       serie: true,
                       name: 'AgaveToGo',
                       insertBefore: '#ng_load_plugins_before',
                       files: [
                           'js/services/ActionsService.js',
                           'js/services/ActionsBulkService.js',
                           'js/services/MessageService.js',
                           'js/controllers/meta/SchemaManagerDirectoryController.js'
                       ]
                   });
               }]
           }
       })

       .state('meta-schema-add', {
           url: '/meta/schema/add',
           data: {pageTitle: 'Metadata Schema Add'},
           templateUrl: 'views/meta/schema-add.html',
           controller: 'SchemaAddController',
           resolve: {
               deps: ['$ocLazyLoad', function($ocLazyLoad) {
                 return $ocLazyLoad.load([
                   {
                     serie: true,
                     name: 'AgaveToGo',
                     files: [
                         'js/services/ActionsService.js',
                         'js/services/MessageService.js',
                         'js/controllers/meta/SchemaAddController.js'
                     ]
                   }
                 ]);
               }]
           }
       })

       .state('meta-schema-edit', {
           url: '/meta/schema/edit/:uuid',
           params: {
             uuid: '',
           },
           data: {pageTitle: 'Metadata Schema Edit'},
           templateUrl: 'views/meta/schema-edit.html',
           controller: 'SchemaEditController',
           resolve: {
               deps: ['$ocLazyLoad', function($ocLazyLoad) {
                 return $ocLazyLoad.load([
                   {
                     serie: true,
                     name: 'AgaveToGo',
                     files: [
                         'js/services/ActionsService.js',
                         'js/services/MessageService.js',
                         'js/controllers/meta/SchemaEditController.js'
                     ]
                   }
                 ]);
               }]
           }
       })


       .state('meta-manager', {
           url: '/meta',
           templateUrl: 'views/meta/meta-manager.html',
           data: {pageTitle: 'Metadata Manager'},
           controller: 'MetaManagerDirectoryController',
           resolve: {
               deps: ['$ocLazyLoad', function($ocLazyLoad) {
                   return $ocLazyLoad.load({
                       serie: true,
                       name: 'AgaveToGo',
                       insertBefore: '#ng_load_plugins_before',
                       files: [
                           'js/services/ActionsService.js',
                           'js/services/ActionsBulkService.js',
                           'js/services/MessageService.js',
                           'js/controllers/meta/MetaManagerDirectoryController.js'
                       ]
                   });
               }]
           }
       })


       .state('meta-add', {
           url: '/meta/add',
           data: {pageTitle: 'Metadata Add'},
           templateUrl: 'views/meta/meta-add.html',
           controller: 'MetaAddController',
           resolve: {
               deps: ['$ocLazyLoad', function($ocLazyLoad) {
                 return $ocLazyLoad.load([
                   {
                     serie: true,
                     name: 'AgaveToGo',
                     files: [
                         'js/services/ActionsService.js',
                         'js/services/MessageService.js',
                         'js/controllers/meta/MetaAddController.js'
                     ]
                   }
                 ]);
               }]
           }
       })

       .state('meta-edit', {
           url: '/meta/edit/:uuid',
           params: {
             uuid: '',
           },
           data: {pageTitle: 'Metadata Edit'},
           templateUrl: 'views/meta/meta-edit.html',
           controller: 'MetaEditController',
           resolve: {
               deps: ['$ocLazyLoad', function($ocLazyLoad) {
                 return $ocLazyLoad.load([
                   {
                     serie: true,
                     name: 'AgaveToGo',
                     files: [
                         'js/services/ActionsService.js',
                         'js/services/MessageService.js',
                         'js/controllers/meta/MetaEditController.js'
                     ]
                   }
                 ]);
               }]
           }
       })



        /**********************************************************************/
        /**********************************************************************/
        /***                                                                ***/
        /***                       Notifications Routes                     ***/
        /***                                                                ***/
        /**********************************************************************/
        /**********************************************************************/

        .state('notifications-noslash', {
            url: '/notifications',
            templateUrl: 'views/notifications/manager.html',
            data: {pageTitle: 'Notifications Manager'},
            controller: 'NotificationsManagerDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/services/ActionsService.js',
                            'js/services/ActionsBulkService.js',
                            'js/services/MessageService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/notifications/NotificationsManagerDirectoryController.js'
                        ]
                    });
                }]
            }
        })

        .state('notifications-manager-noslash', {
            url: '/notifications/manager',
            templateUrl: 'views/notifications/manager.html',
            data: {pageTitle: 'Notifications Manager'},
            controller: 'NotificationsManagerDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/services/ActionsService.js',
                            'js/services/ActionsBulkService.js',
                            'js/services/MessageService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/notifications/NotificationsManagerDirectoryController.js'
                        ]
                    });
                }]
            }
        })

        .state('notifications-manager', {
            url: '/notifications/manager/:associatedUuid',
            params: {
              associatedUuid: '',
              resourceType: ''
            },
            templateUrl: 'views/notifications/manager.html',
            data: {pageTitle: 'Notifications Manager'},
            controller: 'NotificationsManagerDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/services/ActionsService.js',
                            'js/services/ActionsBulkService.js',
                            'js/services/MessageService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/notifications/NotificationsManagerDirectoryController.js'
                        ]
                    });
                }]
            }
        })

        .state('notifications-edit', {
            url: '/notifications/edit/:notificationId',
            templateUrl: 'views/notifications/resource/edit.html',
            controller: 'NotificationsResourceEditController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                  return $ocLazyLoad.load([
                    {
                      serie: true,
                      name: 'AgaveToGo',
                      files: [
                          'js/services/ActionsService.js',
                          'js/services/MessageService.js',
                          'js/controllers/notifications/resource/NotificationsResourceEditController.js'
                      ]
                    }
                  ]);
                }]
            }
        })

        .state('notifications-add-noslash', {
            url: '/notifications/add',
            params: {
              associatedUuid: '',
              resourceType: ''
            },
            templateUrl: 'views/notifications/resource/add.html',
            controller: 'NotificationsResourceAddController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                  return $ocLazyLoad.load([
                    {
                      serie: true,
                      name: 'AgaveToGo',
                      files: [
                          'js/services/ActionsService.js',
                          'js/services/MessageService.js',
                          'js/controllers/notifications/resource/NotificationsResourceAddController.js'
                      ]
                    }
                  ]);
                }]
            }
        })

        .state('notifications-add', {
            url: '/notifications/add/:associatedUuid',
            params: {
              associatedUuid: '',
              resourceType: ''
            },
            templateUrl: 'views/notifications/resource/add.html',
            controller: 'NotificationsResourceAddController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                  return $ocLazyLoad.load([
                    {
                      serie: true,
                      name: 'AgaveToGo',
                      files: [
                          'js/services/ActionsService.js',
                          'js/services/MessageService.js',
                          'js/controllers/notifications/resource/NotificationsResourceAddController.js'
                      ]
                    }
                  ]);
                }]
            }
        })

        .state('notifications-alerts-id', {
            url: '/notifications/alerts/:id',
            templateUrl: 'views/notifications/alerts.html',
            data: {pageTitle: 'Notifications Alerts'},
            controller: 'NotificationsAlertsDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/services/ActionsService.js',
                            'js/services/ActionsBulkService.js',
                            'js/services/MessageService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/notifications/NotificationsAlertsDirectoryController.js'
                        ]
                    });
                }]
            }
        })

        .state('notifications-history', {
            url: '/notifications/alerts',
            templateUrl: 'views/notifications/alerts.html',
            data: {pageTitle: 'Notifications History'},
            controller: 'NotificationsAlertsDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/services/ActionsService.js',
                            'js/services/ActionsBulkService.js',
                            'js/services/MessageService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/notifications/NotificationsAlertsDirectoryController.js'
                        ]
                    });
                }]
            }
        })

        .state('notifications', {
            abtract: true,
            url: '/notifications/:id',
            templateUrl: 'views/notifications/resource/resource.html',
            controller: 'NotificationsResourceController',
            resolve: {
              deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                  {
                    name: 'AgaveToGo',
                      files: [
                        'js/controllers/notifications/resource/NotificationsResourceController.js'
                      ]
                  }
                ]);
              }]
            }
        })

        .state('notifications.details', {
            url: '',
            templateUrl: 'views/notifications/resource/details.html',
            controller: 'NotificationsResourceDetailsController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                  return $ocLazyLoad.load([
                    {
                      serie: true,
                      name: 'AgaveToGo',
                      files: [
                          'js/services/ActionsService.js',
                          'js/services/PermissionsService.js',
                          'js/controllers/notifications/resource/NotificationsResourceDetailsController.js'
                      ]
                    }
                  ]);
                }]
            }
        })

        /**********************************************************************/
        /**********************************************************************/
        /***                                                                ***/
        /***                       Monitors Routes                          ***/
        /***                                                                ***/
        /**********************************************************************/
        /**********************************************************************/

        .state('monitors-noslash', {
            url: '/monitors',
            templateUrl: 'views/monitors/manager.html',
            data: {pageTitle: 'Monitors Manager'},
            controller: 'MonitorsManagerDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/services/ActionsService.js',
                            'js/services/MessageService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/monitors/MonitorsManagerDirectoryController.js'
                        ]
                    });
                }]
            }
        })

        .state('monitors-manager-noslash', {
            url: '/monitors/manager',
            templateUrl: 'views/monitors/manager.html',
            data: {pageTitle: 'Monitors Manager'},
            controller: 'MonitorsManagerDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/services/ActionsService.js',
                            'js/services/MessageService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/monitors/MonitorsManagerDirectoryController.js'
                        ]
                    });
                }]
            }
        })

        .state('monitors-manager', {
            url: '/monitors/manager/:systemId',
            params: {
              systemId: ''
            },
            templateUrl: 'views/monitors/manager.html',
            data: {pageTitle: 'Monitors Manager'},
            controller: 'MonitorsManagerDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/services/ActionsService.js',
                            'js/services/MessageService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/monitors/MonitorsManagerDirectoryController.js'
                        ]
                    });
                }]
            }
        })

        .state('monitors-edit', {
            url: '/monitors/edit/:monitorId',
            templateUrl: 'views/monitors/resource/edit.html',
            controller: 'MonitorsResourceEditController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                  return $ocLazyLoad.load([
                    {
                      serie: true,
                      name: 'AgaveToGo',
                      files: [
                          'js/services/ActionsService.js',
                          'js/services/MessageService.js',
                          'js/controllers/monitors/resource/MonitorsResourceEditController.js'
                      ]
                    }
                  ]);
                }]
            }
        })

        .state('monitors-add-noslash', {
            url: '/monitors/add',
            params: {
              associatedUuid: '',
              resourceType: ''
            },
            templateUrl: 'views/monitors/resource/add.html',
            controller: 'MonitorsResourceAddController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                  return $ocLazyLoad.load([
                    {
                      serie: true,
                      name: 'AgaveToGo',
                      files: [
                          'js/services/ActionsService.js',
                          'js/services/MessageService.js',
                          'js/controllers/monitors/resource/MonitorsResourceAddController.js'
                      ]
                    }
                  ]);
                }]
            }
        })

        .state('monitors-add', {
            url: '/monitors/add/:systemId',
            params: {
              systemId: ''
            },
            templateUrl: 'views/monitors/resource/add.html',
            controller: 'MonitorsResourceAddController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                  return $ocLazyLoad.load([
                    {
                      serie: true,
                      name: 'AgaveToGo',
                      files: [
                          'js/services/ActionsService.js',
                          'js/services/MessageService.js',
                          'js/controllers/monitors/resource/MonitorsResourceAddController.js'
                      ]
                    }
                  ]);
                }]
            }
        })

        .state('monitors-checks', {
            url: '/monitors/checks',
            templateUrl: 'views/monitors/checks.html',
            data: {pageTitle: 'Monitors Checks'},
            controller: 'MonitorsChecksDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/services/ActionsService.js',
                            'js/services/MessageService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/monitors/MonitorsChecksDirectoryController.js'
                        ]
                    });
                }]
            }
        })

        .state('monitors-checks-id', {
            url: '/monitors/checks/:monitorId',
            templateUrl: 'views/monitors/checks.html',
            data: {pageTitle: 'Monitors Checks'},
            controller: 'MonitorsChecksDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/services/ActionsService.js',
                            'js/services/MessageService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/monitors/MonitorsChecksDirectoryController.js'
                        ]
                    });
                }]
            }
        })

        .state('monitors', {
            abtract: true,
            url: '/monitors/:id',
            templateUrl: 'views/monitors/resource/resource.html',
            controller: 'MonitorsResourceController',
            resolve: {
              deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                  {
                    name: 'AgaveToGo',
                      files: [
                        'js/controllers/monitors/resource/MonitorsResourceController.js'
                      ]
                  }
                ]);
              }]
            }
        })

        .state('monitors.details', {
            url: '',
            templateUrl: 'views/monitors/resource/details.html',
            controller: 'MonitorsResourceDetailsController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                  return $ocLazyLoad.load([
                    {
                      serie: true,
                      name: 'AgaveToGo',
                      files: [
                          'js/services/ActionsService.js',
                          'js/services/MessageService.js',
                          'js/services/PermissionsService.js',
                          'js/controllers/monitors/resource/MonitorsResourceDetailsController.js'
                      ]
                    }
                  ]);
                }]
            }
        })

        /**********************************************************************/
        /**********************************************************************/
        /***                                                                ***/
        /***                       Applications Routes                      ***/
        /***                                                                ***/
        /**********************************************************************/
        /**********************************************************************/

        .state('apps-edit', {
            url: '/apps/edit/:appId',
            templateUrl: 'views/apps/edit-wizard.html',
            data: {pageTitle: 'App Edit Wizard'},
            controller: 'AppEditWizardController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        files: [
                            '../bower_components/codemirror/lib/codemirror.css',
                            '../bower_components/codemirror/theme/neo.css',
                            '../bower_components/codemirror/lib/codemirror.js',
                            '../bower_components/angular-ui-codemirror/ui-codemirror.min.js',

                            'js/services/MessageService.js',
                            'js/controllers/apps/AppEditWizardController.js'
                        ]
                    },
                    'ui.codemirror'
                    );
                }]
            }
        })


        .state('apps-new', {
            url: '/apps/new',
            templateUrl: 'views/apps/wizard.html',
            data: {pageTitle: 'App Builder Wizard'},
            controller: 'AppBuilderWizardController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        files: [
                            '../bower_components/codemirror/lib/codemirror.css',
                            '../bower_components/codemirror/theme/neo.css',
                            '../bower_components/codemirror/lib/codemirror.js',
                            '../bower_components/angular-ui-codemirror/ui-codemirror.min.js',

                            'js/services/MessageService.js',
                            'js/controllers/apps/AppBuilderWizardController.js'
                        ]
                    },
                    'ui.codemirror'
                    );
                }]
            }
        })

        .state('apps-manage', {
            url: '/apps',
            templateUrl: 'views/apps/manager.html',
            data: {pageTitle: 'App Manager'},
            controller: 'AppDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            'js/services/ActionsService.js',
                            'js/services/MessageService.js',
                            'js/services/PermissionsService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/apps/AppDirectoryController.js',
                            'js/controllers/modals/ModalConfirmResourceActionController.js',
                            'js/controllers/modals/ModalPermissionEditorController.js'
                        ]
                    });
                }]
            }
        })

        .state('apps-manage-slash', {
            url: '/apps/',
            templateUrl: 'views/apps/manager.html',
            data: {pageTitle: 'App Manager'},
            controller: 'AppDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            '../assets/global/scripts/datatable.js',
                            '../bower_components/holderjs/holder.js',
                            'js/services/ActionsService.js',
                            'js/services/PermissionsService.js',
                            'js/controllers/QueryController.js',
                            'js/controllers/apps/AppDirectoryController.js',
                            'js/controllers/modals/ModalConfirmResourceActionController.js',
                            'js/controllers/modals/ModalPermissionEditorController.js'
                        ]
                    });
                }]
            }
        })


        .state('apps', {
          abtract: true,
          url:'/apps/:appId',
          templateUrl:'views/apps/resource/resource.html',
          controller: 'AppsResourceController',
          resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
              return $ocLazyLoad.load([
                {
                  name: 'AgaveToGo',
                    files: [
                      'js/controllers/apps/resource/AppsResourceController.js'
                    ]
                }
              ]);
            }]
          }
        })

        .state('apps.details', {
          url: '',
          templateUrl: 'views/apps/resource/details.html',
          controller: 'AppsResourceDetailsController',
          resolve: {
              deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                  {
                    serie: true,
                    name: 'AgaveToGo',
                    files: [
                        'js/services/ActionsService.js',
                        'js/services/MessageService.js',
                        'js/services/PermissionsService.js',
                        'js/controllers/apps/resource/AppsResourceDetailsController.js'
                    ]
                  }
                ]);
              }]
          }
        })

        .state('apps.stats', {
          url: '/stats',
          controller: 'AppsResourceStatsController',
          templateUrl: 'views/apps/resource/stats.html',
          resolve: {
              deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                  {
                    name: 'AgaveToGo',
                    files: [
                        'js/controllers/apps/resource/AppsResourceStatsController.js'
                    ]
                  }
                ]);
              }]
          }
        })

        .state('apps.run', {
          url: '/run',
          controller: 'AppsResourceRunController',
          templateUrl: 'views/apps/resource/job-form.html',
          resolve: {
              deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                  {
                    serie: true,
                    name: 'AgaveToGo',
                    files: [
                        'js/services/MessageService.js',
                        'js/controllers/apps/resource/AppsResourceRunController.js'
                    ]
                  }
                ]);
              }]
          }
        })


        /**********************************************************************/
        /**********************************************************************/
        /***                                                                ***/
        /***                       Data Management Routes                   ***/
        /***                                                                ***/
        /**********************************************************************/
        /**********************************************************************/

        // TO-DO: need to improve this with redirect
        .state('data-explorer-noslash', {
            url: '/data/explorer/:systemId',
            templateUrl: 'views/data/explorer.html',
            data: { pageTitle: 'File Explorer' },
            controller: 'FileExplorerController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        {
                            serie: true,
                            name: 'AgaveToGo',
                            insertBefore: '#ng_load_plugins_before',
                            files: [
                                'js/services/MessageService.js',
                                'js/controllers/data/FileExplorerController.js'
                            ]
                        }
                    ]);
                }]
            }
        })

        // AngularJS plugins
        .state('data-explorer', {
            url: '/data/explorer/:systemId/{path:any}',
            templateUrl: 'views/data/explorer.html',
            data: { pageTitle: 'File Explorer' },
            controller: 'FileExplorerController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        {
                            serie: true,
                            name: 'AgaveToGo',
                            insertBefore: '#ng_load_plugins_before',
                            files: [
                                /********* File Manager ******/
                                'js/services/MessageService.js',
                                'js/controllers/data/FileExplorerController.js'
                            ]
                        }
                    ]);
                }]
            }
        })


        /**********************************************************************/
        /**********************************************************************/
        /***                                                                ***/
        /***                       User Profile Routes                      ***/
        /***                                                                ***/
        /**********************************************************************/
        /**********************************************************************/

        // User Profile
        .state('profile', {
            url: '/profile/:username',
            templateUrl: 'views/profile/main.html',
            data: {pageTitle: 'User Profile'},
            controller: 'UserProfileController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            '../assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.css',
                            '../assets/pages/css/profile.css',
                            '../assets/pages/css/search.css',

                            '../assets/global/plugins/jquery.sparkline.min.js',
                            '../assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.js',

                            '../assets/pages/scripts/profile.min.js',
                            '../bower_components/faker/build/build/faker.min.js',

                            'js/services/MessageService.js',
                            'js/controllers/profiles/UserProfileController.js'
                        ]
                    });
                }]
            }
        })

        // User Profile Dashboard
        .state('profile.dashboard', {
            url: '/dashboard',
            templateUrl: 'views/profile/dashboard.html',
            data: {pageTitle: 'User Profile'}
        })

        // User Profile Account
        .state('profile.account', {
            url: '/account',
            templateUrl: 'views/profile/account.html',
            data: {pageTitle: 'User Account'}
        })

        // User Profile Help
        .state('profile.help', {
            url: '/help',
            templateUrl: 'views/profile/help.html',
            data: {pageTitle: 'User Help'}
        })

        // User Profile Search
        .state('profile.search', {
            url: '/search',
            templateUrl: 'views/profile/search.html',
            data: {pageTitle: 'Directory Search'}
        })

        /**********************************************************************/
        /**********************************************************************/
        /***                                                                ***/
        /***                       Systems Routes                           ***/
        /***                                                                ***/
        /**********************************************************************/
        /**********************************************************************/

        .state('systems-manage', {
            url: '/systems',
            templateUrl: 'views/systems/manager.html',
            data: {pageTitle: 'Systems Manager'},
            controller: 'SystemDirectoryController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        serie: true,
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            //'../bower_components/datatables/media/css/dataTables.bootstrap.min.css',
                            //'../bower_components/datatables/media/css/jquery.dataTables.min.css',
                            //
                            //'../bower_components/datatables/media/js/dataTables.bootstrap.js',
                            //'../bower_components/datatables/media/js/jquery.dataTables.js',
                            '../assets/global/scripts/datatable.js',
                            '../bower_components/holderjs/holder.js',
                            'js/services/ActionsService.js',
                            'js/services/MessageService.js',
                            'js/services/RolesService.js',
                            'js/controllers/QueryBuilderController.js',
                            'js/controllers/systems/SystemDirectoryController.js'
                        ]
                    });
                }]
            }
        })

        .state('systems-new', {
            url: '/systems/new',
            templateUrl: 'views/systems/wizard.html',
            data: {pageTitle: 'System Builder Wizard'},
            controller: 'SystemBuilderWizardController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                            serie: true,
                            name: 'AgaveToGo',
                            insertBefore: '#ng_load_plugins_before',
                            files: [
                              'js/services/MessageService.js',
                              'js/controllers/systems/SystemBuilderWizardController.js',
                              'js/controllers/data/FileExplorerController.js',
                              '../bower_components/codemirror/lib/codemirror.css',
                              '../bower_components/codemirror/theme/neo.css',
                              '../bower_components/codemirror/theme/solarized.css',
                              '../bower_components/codemirror/mode/javascript/javascript.js',
                              '../bower_components/codemirror/mode/markdown/markdown.js',
                              '../bower_components/codemirror/mode/clike/clike.js',
                              '../bower_components/codemirror/mode/shell/shell.js',
                              '../bower_components/codemirror/mode/python/python.js',
                              '../bower_components/codemirror/lib/codemirror.js',
                              '../bower_components/angular-ui-codemirror/ui-codemirror.min.js',
                            ]
                        },
                        // 'FileManagerApp',
                        'ui.codemirror'
                    );
                }]
            }
        })

        .state('systems-edit', {
            url: '/systems/edit/:systemId',
            templateUrl: 'views/systems/edit-wizard.html',
            data: {pageTitle: 'System Editor Wizard'},
            controller: 'SystemEditorWizardController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                            serie: true,
                            name: 'AgaveToGo',
                            insertBefore: '#ng_load_plugins_before',
                            files: [
                                'js/services/MessageService.js',
                                'js/controllers/systems/SystemEditorWizardController.js',
                                '../bower_components/codemirror/lib/codemirror.css',
                                '../bower_components/codemirror/theme/neo.css',
                                '../bower_components/codemirror/theme/solarized.css',
                                '../bower_components/codemirror/mode/javascript/javascript.js',
                                '../bower_components/codemirror/mode/markdown/markdown.js',
                                '../bower_components/codemirror/mode/clike/clike.js',
                                '../bower_components/codemirror/mode/shell/shell.js',
                                '../bower_components/codemirror/mode/python/python.js',
                                '../bower_components/codemirror/lib/codemirror.js',
                                '../bower_components/angular-ui-codemirror/ui-codemirror.min.js',
                            ]
                        },
                        // 'FileManagerApp',
                        'ui.codemirror'
                    );
                }]
            }
        })

        .state('systems', {
          abtract: true,
          url:'/systems/:systemId',
          templateUrl:'views/systems/resource/resource.html',
          controller: 'SystemsResourceController',
          resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
              return $ocLazyLoad.load([
                {
                  name: 'AgaveToGo',
                    files: [
                      'js/controllers/systems/resource/SystemsResourceController.js'
                    ]
                }
              ]);
            }]
          }
        })

        .state('systems.details', {
          url: '',
          templateUrl: 'views/systems/resource/details.html',
          controller: 'SystemsResourceDetailsController',
          resolve: {
              deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                  {
                    serie: true,
                    name: 'AgaveToGo',
                    files: [
                        'js/services/ActionsService.js',
                        'js/services/MessageService.js',
                        'js/services/RolesService.js',
                        'js/controllers/systems/resource/SystemsResourceDetailsController.js'
                    ]
                  }
                ]);
              }]
          }
        })

        .state('systems.queues', {
          url: '/queues',
          controller: 'SystemsResourceQueuesController',
          templateUrl: 'views/systems/resource/queues.html',
          resolve: {
              deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                  {
                    name: 'AgaveToGo',
                    files: [
                        'js/services/MessageService.js',
                        'js/controllers/systems/resource/SystemsResourceQueuesController.js'
                    ]
                  }
                ]);
              }]
          }
        })

        .state('systems.apps', {
          url: '/apps',
          templateUrl: 'views/systems/resource/apps.html',
          controller: 'SystemsResourceAppsController',
          resolve: {
              deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                  {
                    name: 'AgaveToGo',
                    files: [
                        'js/services/MessageService.js',
                        'js/controllers/systems/resource/SystemsResourceAppsController.js'
                    ]
                  }
                ]);
              }]
          }
        })

        .state('systems.stats', {
          url: '/stats',
          controller: 'SystemsResourceStatsController',
          templateUrl: 'views/systems/resource/stats.html',
          resolve: {
              deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                  {
                    name: 'AgaveToGo',
                    files: [
                        'js/services/MessageService.js',
                        'js/controllers/systems/resource/SystemsResourceStatsController.js'
                    ]
                  }
                ]);
              }]
          }
        })




        /**********************************************************************/
        /**********************************************************************/
        /***                                                                ***/
        /***                       Plugin Routes                            ***/
        /***                                                                ***/
        /**********************************************************************/
        /**********************************************************************/

        // UI Select
        .state('uiselect', {
            url: '/ui_select.html',
            templateUrl: 'views/ui_select.html',
            data: {pageTitle: 'AngularJS Ui Select'},
            controller: 'UISelectController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([{
                        name: 'ui.select',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            '../assets/global/plugins/angularjs/plugins/ui-select/select.min.css',
                            '../assets/global/plugins/angularjs/plugins/ui-select/select.min.js'
                        ]
                    }, {
                        name: 'AgaveToGo',
                        files: [
                            'js/controllers/UISelectController.js'
                        ]
                    }]);
                }]
            }
        })

        // UI Bootstrap
        .state('uibootstrap', {
            url: '/ui_bootstrap.html',
            templateUrl: 'views/ui_bootstrap.html',
            data: {pageTitle: 'AngularJS UI Bootstrap'},
            controller: 'GeneralPageController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([{
                        name: 'AgaveToGo',
                        files: [
                            'js/controllers/GeneralPageController.js'
                        ]
                    }]);
                }]
            }
        })

        // Tree View
        .state('tree', {
            url: '/tree',
            templateUrl: 'views/tree.html',
            data: {pageTitle: 'jQuery Tree View'},
            controller: 'GeneralPageController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([{
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            '../assets/global/plugins/jstree/dist/themes/default/style.min.css',
                            '../assets/global/plugins/jstree/dist/jstree.min.js',
                            '../assets/pages/scripts/ui-tree.min.js',
                            'js/controllers/GeneralPageController.js'
                        ]
                    }]);
                }]
            }
        })

        // Form Tools
        .state('formtools', {
            url: '/form-tools',
            templateUrl: 'views/form_tools.html',
            data: {pageTitle: 'Form Tools'},
            controller: 'GeneralPageController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([{
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            '../assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.css',
                            '../assets/global/plugins/bootstrap-switch/css/bootstrap-switch.min.css',
                            '../assets/global/plugins/bootstrap-markdown/css/bootstrap-markdown.min.css',
                            '../assets/global/plugins/typeahead/typeahead.css',
                            '../assets/global/plugins/fuelux/js/spinner.min.js',
                            '../assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.js',
                            '../assets/global/plugins/jquery-inputmask/jquery.inputmask.bundle.min.js',
                            '../assets/global/plugins/jquery.input-ip-address-control-1.0.min.js',
                            '../assets/global/plugins/bootstrap-pwstrength/pwstrength-bootstrap.min.js',
                            '../assets/global/plugins/bootstrap-switch/js/bootstrap-switch.min.js',
                            '../assets/global/plugins/bootstrap-maxlength/bootstrap-maxlength.min.js',
                            '../assets/global/plugins/bootstrap-touchspin/bootstrap.touchspin.js',
                            '../assets/global/plugins/typeahead/handlebars.min.js',
                            '../assets/global/plugins/typeahead/typeahead.bundle.min.js',
                            '../assets/pages/scripts/components-form-tools-2.min.js',

                            'js/controllers/GeneralPageController.js'
                        ]
                    }]);
                }]
            }
        })

        // Date & Time Pickers
        .state('pickers', {
            url: '/pickers',
            templateUrl: 'views/pickers.html',
            data: {pageTitle: 'Date & Time Pickers'},
            controller: 'GeneralPageController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([{
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            '../assets/global/plugins/clockface/css/clockface.css',
                            '../assets/global/plugins/bootstrap-datepicker/css/bootstrap-datepicker3.min.css',
                            '../assets/global/plugins/bootstrap-timepicker/css/bootstrap-timepicker.min.css',
                            '../assets/global/plugins/bootstrap-colorpicker/css/colorpicker.css',
                            '../assets/global/plugins/bootstrap-daterangepicker/daterangepicker-bs3.css',
                            '../assets/global/plugins/bootstrap-datetimepicker/css/bootstrap-datetimepicker.min.css',

                            '../assets/global/plugins/bootstrap-datepicker/js/bootstrap-datepicker.min.js',
                            '../assets/global/plugins/bootstrap-timepicker/js/bootstrap-timepicker.min.js',
                            '../assets/global/plugins/clockface/js/clockface.js',
                            '../assets/global/plugins/moment.min.js',
                            '../assets/global/plugins/bootstrap-daterangepicker/daterangepicker.js',
                            '../assets/global/plugins/bootstrap-colorpicker/js/bootstrap-colorpicker.js',
                            '../assets/global/plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js',

                            '../assets/pages/scripts/components-date-time-pickers.min.js',

                            'js/controllers/GeneralPageController.js'
                        ]
                    }]);
                }]
            }
        })

        // Custom Dropdowns
        .state('dropdowns', {
            url: '/dropdowns',
            templateUrl: 'views/dropdowns.html',
            data: {pageTitle: 'Custom Dropdowns'},
            controller: 'GeneralPageController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([{
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            '../assets/global/plugins/bootstrap-select/css/bootstrap-select.min.css',
                            '../assets/global/plugins/select2/css/select2.min.css',
                            '../assets/global/plugins/select2/css/select2-bootstrap.min.css',

                            '../assets/global/plugins/bootstrap-select/js/bootstrap-select.min.js',
                            '../assets/global/plugins/select2/js/select2.full.min.js',

                            '../assets/pages/scripts/components-bootstrap-select.min.js',
                            '../assets/pages/scripts/components-select2.min.js',

                            'js/controllers/GeneralPageController.js'
                        ]
                    }]);
                }]
            }
        })

        // Advanced Datatables
        .state('datatablesAdvanced', {
            url: '/datatables/managed.html',
            templateUrl: 'views/datatables/managed.html',
            data: {pageTitle: 'Advanced Datatables'},
            controller: 'GeneralPageController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            '../assets/global/plugins/datatables/datatables.min.css',
                            '../assets/global/plugins/datatables/plugins/bootstrap/datatables.bootstrap.css',

                            '../assets/global/plugins/datatables/datatables.all.min.js',

                            '../assets/pages/scripts/table-datatables-managed.min.js',

                            'js/controllers/GeneralPageController.js'
                        ]
                    });
                }]
            }
        })

        // Ajax Datetables
        .state('datatablesAjax', {
            url: '/datatables/ajax.html',
            templateUrl: 'views/datatables/ajax.html',
            data: {pageTitle: 'Ajax Datatables'},
            controller: 'GeneralPageController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            '../assets/global/plugins/datatables/datatables.min.css',
                            '../assets/global/plugins/datatables/plugins/bootstrap/datatables.bootstrap.css',
                            '../assets/global/plugins/bootstrap-datepicker/css/bootstrap-datepicker3.min.css',

                            '../assets/global/plugins/datatables/datatables.all.min.js',
                            '../assets/global/plugins/bootstrap-datepicker/js/bootstrap-datepicker.min.js',
                            '../assets/global/scripts/datatable.js',

                            'js/scripts/table-ajax.js',
                            'js/controllers/GeneralPageController.js'
                        ]
                    });
                }]
            }
        })

        /**********************************************************************/
        /**********************************************************************/
        /***                                                                ***/
        /***                       Project Routes                           ***/
        /***                                                                ***/
        /**********************************************************************/
        /**********************************************************************/

        // Projects
        .state('projects', {
            url: '/projects',
            templateUrl: 'views/projects/dashboard.html',
            data: {pageTitle: 'Projects'},
            controller: 'ProjectDashboardController',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'AgaveToGo',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                        files: [
                            '../assets/apps/css/todo.css',
                            'js/services/Projects.js',
                            'js/services/Tasks.js',
                            'js/services/Comments.js',
                            'js/controllers/projects/ProjectDashboardController.js'
                        ]
                    });
                }]
            }
        })

        .state('project.new', {
            url: '/projects/new',
            templateUrl: 'views/projects/editor.html',
            data: {pageTitle: 'New Project'}
        })

        .state('project.edit', {
            url: '/projects/edit',
            templateUrl: 'views/projects/editor.html',
            data: {pageTitle: 'New Project'}
        })

}]);

/* Init global settings and run the app */
//AgaveToGo.run(['$rootScope', 'settings', '$state', 'ProfilesController', function($rootScope, settings, $state) { //}, ProfilesController) {
AgaveToGo.run(['$rootScope', 'settings', '$state', '$http', '$templateCache', '$localStorage', '$window', 'CacheFactory', 'NotificationsService', function($rootScope, settings, $state, $http, $templateCache, $localStorage, $window, CacheFactory, NotificationsService) {
    $rootScope.$state = $state; // state to be accessed from view
    $rootScope.$settings = settings; // state to be accessed from view

    $http.defaults.cache = CacheFactory('defaultCache', {
        maxAge: 24 * 60 * 60 * 1000, // Items added to this cache expire after 1 day
        cacheFlushInterval: 30 * 24 * 60 * 60 * 1000, // This cache will clear itself every 30 days
        deleteOnExpire: 'aggressive', // Items will be deleted from this cache when they expire
        storageMode: 'localStorage'
    });


    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
        // Temp fix until I find better solution
        // This is to avoid changing url location on filemanager promise returns
        if ((fromState.name === 'data-explorer-noslash' || fromState.name === 'data-explorer') && (toState.name !== 'data-explorer-noslash' || toState.name !== 'data-explorer')){
          $rootScope.locationChange = false;
        } else {
          $rootScope.locationChange = true;
        }

        if (typeof $localStorage.tenant !== 'undefined' && typeof $localStorage.token !== 'undefined'){
          var currentDate = new Date();
          var expirationDate = Date.parse($localStorage.token.expires_at);

          var diff = (expirationDate - currentDate) / 60000;
          if (diff < 0) {
            $window.location.href = '/auth';
          }
        } else {
          $window.location.href = '/auth';
        }
    });
}]);
