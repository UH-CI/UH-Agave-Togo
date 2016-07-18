AgaveToGo.filter('propsFilter', function () {
    return function(items, props) {
        var out = [];

        if (angular.isArray(items)) {
            var keys = Object.keys(props);

            items.forEach(function(item) {
                var itemMatches = false;

                for (var i = 0; i < keys.length; i++) {
                    var prop = keys[i];
                    var text = props[prop].toLowerCase();
                    if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                        itemMatches = true;
                        break;
                    }
                }

                if (itemMatches) {
                    out.push(item);
                }
            });
        } else {
            // Let the output be the input untouched
            out = items;
        }

        return out;
    };
})
.filter('isOwner', function () {
    return function (username) {
        return Apps.getAuthenticatedUserProfile().username === username;
    }
})
.filter('getAbsoluteAgaveSystemPath', [ '$localStorage', function($localStorage) {
    return function(system) {
        var path = "";
        if (system.storage.homeDir) {
            path = system.storage.homeDir;
        }
        if (system.public) {
            path = "/" + $localStorage.activeProfile.username;
        }
        return path;
    }
}])
.filter("systemStatusIcon", [ function() {
    return function(system) {
        if (system.type == 'STORAGE') {
            // if (system.storage.protocol === 'S3') {
            //     return 'fa-amazon';
            // } else if (system.storage.protocol === 'DROPBOX') {
            //     return 'fa-dropbox';
            // } else if (system.storage.protocol === 'BOX') {
            //     return 'fa-box';
            // } else if (system.storage.protocol === 'IRODS') {
            //     return 'agave-irods';
            // } else  {
                return 'fa-database';
            // }
        } else {
            return 'fa-server'
        }
    }
}])
.filter("notificationStatusColor", [ function() {
    return function(status) {
        if (status.indexOf('failed')) {
            return 'label-warning';
        } else {
            return 'label-default';
        }
    }
}])
.filter("notificationStatusIcon", [ function() {
    return function(notification) {
        return 'agave-webhooks';
    }
}]);