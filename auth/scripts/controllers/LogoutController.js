angular.module('AgaveAuth').controller('LogoutController', function ($injector, $timeout, $rootScope, $scope, $state, moment, $location, settings, $localStorage, AccessToken, TenantsController, Commons, Alerts) {

    settings.layout.tenantPage = true;
    settings.layout.loginPage = false;

    //$scope.loggedIn = !!AccessToken.get();

    $timeout(function() {
        $scope.profile = $localStorage.activeProfile;
        $scope.tenant = $localStorage.tenant;

        // delete $localStorage.activeProfile;
        // delete $localStorage.token;
    }, 50);

    $scope.$watch('$localStorage.activeProfile', function(value){
        $timeout(function () {
            $scope.profile = $localStorage.activeProfile;
        }, 0);
    }, true);

    $scope.$watch('settings.tenants', function(value){
        $timeout(function () {
            $rootScope.$broadcast('oauth:template:update', '/auth/views/templates/oauth-ng-button.html');
        }, 0);
    }, true);

    // show content on state change success
    $scope.$on('$stateChangeSuccess', function () {
        jQuery('.content.hide, .copyright.hide').removeClass('hide'); // show content area
    });

    // show content on state change success
    $scope.$on('$stateChangeError', function () {
        jQuery('.content.hide, .copyright.hide').removeClass('hide'); // show content area
    });

    // show content on state change success
    $scope.$on('$stateNotFound', function () {
        jQuery('.content.hide, .copyright.hide').removeClass('hide'); // show content area
    });
});
