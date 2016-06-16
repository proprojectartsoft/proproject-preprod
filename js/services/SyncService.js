angular.module($APP.name).factory('SyncService', [
    '$q',
    'CacheFactory',
    '$ionicPopup',
    'FormInstanceService',
    'FormDesignService',
    'ProjectService',
    '$rootScope',
    '$http',
    '$timeout',
    'ResourceService',
    'UserService',
    function ($q, CacheFactory, $ionicPopup, FormInstanceService, FormDesignService, ProjectService, $rootScope, $http, $timeout, ResourceService, UserService) {

        return {
            sync: function () {
                var requests = [];
                var upRequests = [];
                var projectsCache = CacheFactory.get('projectsCache');
                var designsCache = CacheFactory.get('designsCache');
                var resourcesCache = CacheFactory.get('resourcesCache');
                var unitCache = CacheFactory.get('unitCache');
                var custSettCache = CacheFactory.get('custSettCache');
                var restypesCache = CacheFactory.get('restypesCache');
                var settingsCache = CacheFactory.get('settings');
                var sync = CacheFactory.get('sync');
                var photos = CacheFactory.get('photos');
                var forms, pics, picX, formX;

                var syncPopup = $ionicPopup.alert({
                    title: "Syncing",
                    template: "<center><ion-spinner icon='android'></ion-spinner></center>",
                    content: "",
                    buttons: []
                });
                function upload() {
                    if (!sync || sync.length === 0) {
                        sync = CacheFactory('sync');
                    }
                    if (!photos) {
                        photos = CacheFactory('photos');
                        photos.setOptions({
                            storageMode: 'localStorage'
                        });
                    }
                    forms = sync.keys();
                    pics = photos.keys();
                    console.log('w', forms);
                    if (forms) {
                        angular.forEach(forms, function (formKey) {
                            picX = false;
                            formX = sync.get(formKey);
                            if (pics.indexOf(formKey) !== -1) {
                                console.log('sync.start.create_sync', formKey);
                                picX = photos.get(formKey);
                                console.log('sync.stop.create_sync', picX);
                            }
                            if (formX) {
                                var help1 = angular.copy(formX);
                                var help2 = angular.copy(picX);
                                upRequests.push(FormInstanceService.create_sync(help1, help2).then(function () {
                                    console.log('help', help1, help2)
                                }));
                            }
                        });
                    }
                }
                function clear() {
                    if (!settingsCache) {
                        settingsCache = CacheFactory('settingsCache');
                        settingsCache.setOptions({
                            storageMode: 'localStorage'
                        });
                    }
                    if (!photos) {
                        photos = CacheFactory('photos');
                        photos.setOptions({
                            storageMode: 'localStorage'
                        });
                    }

                    if (projectsCache) {
                        projectsCache.removeAll();
                    } else {
                        projectsCache = CacheFactory('projectsCache');
                        projectsCache.setOptions({
                            storageMode: 'localStorage'
                        });
                        projectsCache.removeAll();
                    }

                    if (designsCache) {
                        designsCache.removeAll();
                    } else {
                        designsCache = CacheFactory('designsCache');
                        designsCache.setOptions({
                            storageMode: 'localStorage'
                        });
                        designsCache.removeAll();
                    }

                    if (resourcesCache) {
                        resourcesCache.removeAll();
                    } else {
                        resourcesCache = CacheFactory('resourcesCache');
                        resourcesCache.setOptions({
                            storageMode: 'localStorage'
                        });
                        resourcesCache.removeAll();
                    }

                    if (unitCache) {
                        unitCache.removeAll();
                    } else {
                        unitCache = CacheFactory('unitCache');
                        unitCache.setOptions({
                            storageMode: 'localStorage'
                        });
                        unitCache.removeAll();
                    }
                    if (custSettCache) {
                        custSettCache.removeAll();
                    } else {
                        custSettCache = CacheFactory('custSettCache');
                        custSettCache.setOptions({
                            storageMode: 'localStorage'
                        });
                        custSettCache.removeAll();
                    }
                    upload();
                }
                function asyncCall(listOfPromises, onErrorCallback, finalCallback) {
                    listOfPromises = listOfPromises || [];
                    onErrorCallback = onErrorCallback || angular.noop;
                    finalCallback = finalCallback || angular.noop;
                    var newListOfPromises = listOfPromises.map(function (promise) {
                        return promise.catch(function (reason) {
                            onErrorCallback(reason);
                            return {'rejected_status': reason.status};

                        });
                    });
                    $q.all(newListOfPromises).then(finalCallback);
                }
                return $http.get($APP.server + '/api/userversion/session').then(function (version) {
                    if (!settingsCache) {
                        settingsCache = CacheFactory('settingsCache');
                        settingsCache.setOptions({
                            storageMode: 'localStorage'
                        });
                    }
                    var currentVersion = settingsCache.get("version");
                    var doRequest;
                    if (currentVersion !== version.data) {
                        clear();
                        requests = [ProjectService.list_current(true), FormDesignService.list_mobile(), ResourceService.list_unit(), UserService.cust_settings()];
                        doRequest = requests.concat(upRequests);
                        console.log(doRequest);
                    } else {
                        upload();
                        doRequest = upRequests;
                        if (doRequest.length === 0) {
                            syncPopup.close();
                        }
                        console.log('OK', upRequests)
                    }
                    if (doRequest.length === 0 && upRequests === 0) {
                        syncPopup.close();
                    }
                    asyncCall(doRequest,
                            function error(result) {
                                console.log('Some error occurred, but we get going:', result);
                            },
                            function success(result) {
                                var sw = false;
                                if (currentVersion !== version.data) {
                                    $rootScope.projects = result[0];
                                    angular.forEach($rootScope.projects, function (proj) {
                                        if (proj.id === $rootScope.projectId && proj.name === $rootScope.navTitle) {
                                            sw = true;
                                        }
                                    });
//                                    CustomerService.list_settings().then(function (result) {
//                                        var custSettingsCache = CacheFactory.get('custSettingsCache');
//                                        if (!custSettingsCache || custSettingsCache.length === 0) {
//                                            custSettingsCache = CacheFactory('custSettingsCache');
//                                            custSettingsCache.setOptions({
//                                                storageMode: 'localStorage'
//                                            });
//                                        }
//                                        $scope.customerSettings = {};
//                                        angular.forEach(result, function (sett) {
//                                            $scope.customerSettings[sett.name] = sett.value;
//                                        });
//                                    })
                                    if (result[0].length > 0) {
//                                        var projectsAux = [], settingsAux = {};
                                        if (!sw) {
                                            $rootScope.projectId = result[0][0].id;
                                            $rootScope.navTitle = result[0][0].name;
                                        }
                                        for (var i = 0; i < result[0].length; i++) {
//                                            projectsAux.push({id: result[0][i].id, proj: result[0][i]})
                                            projectsCache.put(result[0][i].id, result[0][i]);
                                        }
//                                        for (var i = 0; i < projectsAux.length; i++) {
//                                            ProjectService.settings(projectsAux[i].id).then(function (result) {
//                                                projectsAux[i].settings = [];
//                                                angular.forEach(result, function (sett) {
//                                                    projectsAux[i].settings.push({id: sett.id, name: sett.name, value: sett.value})
//                                                });
//                                                projectsCache.put(projectsAux[i].id, projectsAux[i]);
//                                            })
//
//                                        }
                                        if (result[1]) {
                                            for (var i = 0; i < result[1].length; i++) {
                                                designsCache.put(result[1][i].id, result[1][i]);
                                            }
                                        }
                                        if (result[2]) {
                                            for (var i = 0; i < result[2].length; i++) {
                                                unitCache.put(result[2][i].id, result[2][i]);
                                                $rootScope.unit_list.push(result[2][i])
                                            }
                                        }
                                        if (result[3]) {
                                            for (var i = 0; i < result[3].length; i++) {
                                                custSettCache.put(result[3][i].name, result[3][i]);
                                                $rootScope.custSett[result[3][i].name] = result[3][i].value;
                                            }
                                        }
//                                        if (result[2]) {
//                                            for (var i = 0; i < result[2].length; i++) {
//                                                resourcesCache.put(result[2][i].id, result[2][i]);
//                                                $rootScope.unit_list.push(result[2][i])
//                                            }
//                                        }
                                    } else {
                                        $rootScope.projectId = 0;
                                        $rootScope.navTitle = 'No projects';
                                    }
                                }
                                currentVersion = version.data;

                                if (sync) {
                                    sync.removeAll();
                                } else {
                                    sync = CacheFactory('sync');
                                    sync.setOptions({
                                        storageMode: 'localStorage'
                                    });
                                    sync.removeAll();
                                }

                                if (photos) {
                                    photos.removeAll();
                                } else {
                                    photos = CacheFactory('photos');
                                    photos.setOptions({
                                        storageMode: 'localStorage'
                                    });
                                    photos.removeAll();
                                }

                                settingsCache.put("version", currentVersion);

                                $timeout(function () {
                                    syncPopup.close();
                                });
                            }
                    );
                }, function errorCallback(response) {
                    $timeout(function () {
                        syncPopup.close();
                        var alertPopup = $ionicPopup.alert({
                            title: 'Offline',
                            template: 'Could not connect to the cloud'
                        });
                    });
                });

            }
        };
    }
]);
