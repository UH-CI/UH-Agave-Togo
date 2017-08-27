(function(angular) {
    "use strict";
    angular.module('FileManagerApp').provider("fileManagerConfig", function() {

        var values = {
            appName: "AgaveTo Data Explorer",
            defaultLang: "en",

            listUrl: "",
            uploadUrl: "",
            renameUrl: "",
            copyUrl: "",
            removeUrl: "",
            editUrl: "",
            getContentUrl: "",
            createFolderUrl: "",
            downloadFileUrl: "",
            compressUrl: "",
            extractUrl: "",
            permissionsUrl: "",

            layout: 'boxed', // fluid or boxed
            sidebar: true,
            breadcrumb: true,
            allowedActions: {
                rename: true,
                copy: true,
                edit: true,
                changePermissions: true,
                compress: true,
                compressChooseName: true,
                extract: false,
                download: true,
                preview: true,
                remove: true,
                postits: true,
                publish: false,
                notifications: true
            },

            enablePermissionsRecursive: true,
            compressAsync: true,
            extractAsync: true,
            isEditableFilePattern: /\.(txt|html?|aspx?|ini|pl|py|md|css|js|log|htaccess|htpasswd|json|sql|xml|xslt?|sh|rb|as|bat|cmd|coffee|php[3-6]?|java|c|cbl|go|h|scala|vb|md|err|out|scala|groovy|zsh|csh|pub|agave|csv|dat|fasta|pdb|properties|tsv|submit|batch|config|cfg|conf|ya?ml|htaccess|swagger|toml|git(.*)|docker(.*)|bash(.*)|agave(.*)|profile)$/i,
            isPreviewableFilePattern: /\.(txt|html?|aspx?|ini|pl|py|md|css|js|log|htaccess|htpasswd|json|sql|xml|xslt?|sh|rb|as|bat|cmd|coffee|php[3-6]?|java|c|cbl|go|h|scala|vb|md|err|out|scala|groovy|zsh|csh|jpe?g|gif|bmp|png|pdf|svg||agave|csv|dat|fasta|pdb|properties|submit|batch|tsv|ya?ml|config|cfg|conf|swagger|toml|git(.*)|docker(.*)|bash(.*)|agave(.*)|profile|^([^.]+)|tiff?)$/i,
            isTextFilePattern: /\.(json|err|out|m|tex|sh|log|txt|tcl|config|cfg|conf|^git|^docker)$/i,
            isImageFilePattern: /\.(jpe?g|gif|bmp|png|svg|tiff?)$/i,
            isExtractableFilePattern: /\.(gz|tar|rar|bz2?|g?zip)$/i,
            isPdfFilePattern: /\.pdf$/i,
            maxPreviewSize: 1048576,
            maxEditSize: 3145728,

            tplPath: 'src/templates'
        };

        return {
            $get: function() {
                return values;
            },
            set: function (constants) {
                angular.extend(values, constants);
            }
        };

    });
})(angular);
