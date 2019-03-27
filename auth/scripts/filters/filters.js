angular.module('AgaveAuth')
.filter('propsFilter', function () {
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
.filter('tenantWebsite', function () {
    return function (tenantCode, defaultUrl) {
        if (tenantCode === 'agave.prod') {
            return 'https://agaveapi.co/';
        } else if (tenantCode === 'iplantc.org') {
            return 'https://cyverse.org/';
        } else if (tenantCode === 'araport') {
            return 'https://araport.org/';
        } else if (tenantCode === 'tacc.prod') {
            return 'https://tacc.utexas.edu/';
        } else if (tenantCode === 'designsafe') {
            return 'https://designsafe-ci.org/';
        } else if (tenantCode === 'ikewai') {
            return 'https://ikeauth.its.hawaii.edu/';
	} else {
            return defaultUrl;
        }
    };
});
