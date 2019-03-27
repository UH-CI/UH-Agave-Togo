angular.module('AgaveAuth').controller('LoginSuccessController', function ($injector, $timeout, $rootScope, $scope, $state, $window, $location, moment, settings, $localStorage, AccessToken, $location, Alerts, ProfilesController, Configuration) {
    settings.layout.tenantPage = false;
    settings.layout.loginPage = true;

    // explicitely set oAuthAccessToken and BASEURI Configuration for SDK
    //Configuration.oAuthAccessToken = $localStorage.token ? $localStorage.token.access_token : '';
    Configuration.BASEURI ='https://agaveauth.its.hawaii.edu';
    Configuration.oAuthAccessToken = $localStorage.token.access_token; 
    $scope.authToken = $localStorage.token;

    $scope.loggedIn = (!!$scope.authToken) && (moment($scope.authToken.expires_at).diff(moment()) > 0);

    if ($scope.loggedIn) {
        $scope.profile = $localStorage.activeProfile;
        if (!$scope.profile) {
            $scope.requesting = true;
            ProfilesController.getProfile('me').then(
                function(response) {
                    $rootScope.$broadcast('oauth:profile', response);
                    $scope.requesting = false;
                    $scope.tenant = $localStorage.tenant;

                    var tokenEndsAt = moment($scope.authToken.expires_at).toDate();
                    $('#tokenCountdown').countdown({
                        until: tokenEndsAt
                    });
                    $window.location.href = '/app';
                },
                function(message) {
                    Alerts.danger({message:"Failed to fetch user profile."});
                    $scope.requesting = false;
                }
            );
        }
        else{
          $window.location.href = '/app';
          // $location.path('app');
        }
    } else {
        $scope.requesting = false;
        $location.path("/logout");
        $location.replace();
    }


    $rootScope.$on('oauth:profile', function(event, profile) {
        $localStorage.activeProfile = profile;
        $timeout(function () {
            $scope.profile = profile;
          $window.location = '/app';
        //    $location.path('app');
        },0);
    });

});
