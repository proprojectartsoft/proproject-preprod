angular.module($APP.name).controller('FormCtrl', [
    '$scope',
    'FormInstanceService',
    '$timeout',
    'FormUpdateService',
    '$location',
    '$rootScope',
    'CacheFactory',
    '$ionicScrollDelegate',
    '$ionicPopup',
    '$stateParams',
    'ConvertersService',
    '$ionicModal',
    '$cordovaCamera',
    '$state',
    'SyncService',
    '$ionicSideMenuDelegate',
    function ($scope, FormInstanceService, $timeout, FormUpdateService, $location, $rootScope, CacheFactory, $ionicScrollDelegate, $ionicPopup, $stateParams, ConvertersService, $ionicModal, $cordovaCamera, $state, SyncService, $ionicSideMenuDelegate) {

        $ionicSideMenuDelegate.canDragContent(false);

        var designsCache = CacheFactory.get('designsCache');
        if (!designsCache || designsCache.length === 0) {
            designsCache = CacheFactory('designsCache');
            designsCache.setOptions({
                storageMode: 'localStorage'
            });
        }
        $scope.imgCounter = 1;
        $scope.formData = designsCache.get($stateParams.formId);
        $scope.shownGroup = $scope.formData.field_group_designs[0];
        $scope.imgURI = [
            {
                "id": 0,
                "base64String": "",
                "comment": "",
                "tags": "",
                "title": " ",
                "projectId": 0,
                "formInstanceId": 0
            }
        ];
        $scope.trim = function () {
            $scope.pictures = [];
            var i, j, temparray, chunk = 3;
            for (i = 0, j = $scope.imgURI.length; i < j; i += chunk) {
                temparray = $scope.imgURI.slice(i, i + chunk);
                $scope.pictures.push(temparray);
            }
        };
        $scope.trim();
        $scope.addSpot = function () {
            if ($scope.imgURI.length < 9) {
                $scope.imgURI.push({"id": $scope.imgCounter, "base64String": "", "comment": "", "tags": "", "title": " ", "projectId": 0, "formInstanceId": 0});
                $scope.imgCounter++;
                $scope.trim();
            }
        };
        $scope.delSpot = function (id) {
            for (var i = 0; i < $scope.imgURI.length; i++) {
                if ($scope.imgURI[i].id === id) {
                    $scope.imgURI.splice(i, 1);
                    $scope.trim();
                    break;
                }
            }
        };

        $scope.test = function (item) {
            console.log('item', item);
            $scope.item = item;
            $scope.itemClone = angular.copy(item);
            $ionicModal.fromTemplateUrl('view/form/_picture_modal.html', {
                scope: $scope
            }).then(function (modal) {
                $scope.picModal = modal;
                $scope.picModal.show();
            });
        };
        $scope.doShow = function () {
            $scope.picModal.hide();
        };
        $scope.takePicture = function (id) {
            var options = {
                quality: 60,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA,
                allowEdit: false,
                encodingType: Camera.EncodingType.JPEG,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: true,
                correctOrientation: true
            };

            $cordovaCamera.getPicture(options).then(function (imageData) {
                $scope.item.base64String = imageData;
            }, function (err) {
                // An error occured. Show a message to the user
            });
        };

        $scope.submit = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: 'New form',
                template: 'Are you sure you want to submit the data?'
            });
            confirmPopup.then(function (res) {
                if (res) {
                    $rootScope.formUp = $ionicPopup.alert({
                        title: "Submitting",
                        template: "<center><ion-spinner icon='android'></ion-spinner></center>",
                        content: "",
                        buttons: []
                    });


                    FormInstanceService.create($scope.formData, $scope.imgURI).then(
                            function successCallback(data) {
                                $timeout(function () {
                                    console.log('x')
                                    $rootScope.formUp.close();
                                });
                                if (data) {
                                    $rootScope.formId = data.id;
                                    if (!data.message && data.status !== 0) {
                                        console.log(data)
                                        FormInstanceService.get($rootScope.formId).then(function (data) {
                                            $rootScope.rootForm = data;
                                            $state.go('app.formInstance', {'projectId': $rootScope.projectId, 'type': 'form', 'formId': data.id});
                                        });
                                    }
                                }
                            },
                            function errorCallback(payload) {
                                console.log('asdknasdijasndoiasndoqwnoinm')
                                $rootScope.formUp.close();
                            });
                }
            });
        };

        function elmYPosition(id) {
            var elm = document.getElementById(id);
            var y = elm.offsetTop;
            var node = elm;
            while (node.offsetParent && node.offsetParent !== document.body) {
                node = node.offsetParent;
                y += node.offsetTop;
            }
            return y;
        }

        $scope.goto = function (id) {
            if (id) {
                $scope.scroll_ref = $timeout(function () { // we need little delay
                    var stopY = elmYPosition(id) - 40;
                    $ionicScrollDelegate.scrollTo(0, stopY, true);
                }, 50);
            }
        };

        $scope.repeatGroup = function (x) {
            var aux = {};
            angular.copy(x, aux);
            aux.repeatable = true;
            aux.id = 0;
            for (var i = 0; i < aux.field_designs.length; i++) {
                aux.field_designs[i].field_group_design_id = 0;
                aux.field_designs[i].id = 0;
                if (aux.field_designs[i].option_designs) {
                    for (var j = 0; j < aux.field_designs[i].option_designs.length; j++) {
                        aux.field_designs[i].option_designs[j].id = 0;
                        aux.field_designs[i].option_designs[j].field_design_id = 0;
                    }
                }
                if (aux.field_designs[i].field_values) {
                    for (var j = 0; j < aux.field_designs[i].field_values.length; j++) {
                        aux.field_designs[i].field_values[j].id = 0;
                        aux.field_designs[i].field_values[j].field_design_id = 0;
                    }
                }
            }
            for (var i = 0; i < $scope.formData.field_group_designs.length; i++) {
                if (x === $scope.formData.field_group_designs[i]) {
                    $scope.formData.field_group_designs.splice(i + 1, 0, aux);
                    break;
                }
            }
        };

        $scope.repeatField = function (x, y) {
            var test = {};
            angular.copy(y, test);
            test.repeatable = true;
            test.id = 0;
            for (var i = 0; i < x.field_designs.length; i++) {
                if (x.field_designs[i] === y) {
                    if (x.field_designs.option_designs) {
                        for (var j = 0; j < x.field_designs.option_designs.length; j++) {
                            test.field_designs.option_designs[j].id = 0;
                        }
                    }
                    x.field_designs.splice(i + 1, 0, test);
                    break;
                }
            }
        };

        $scope.toggleGroup = function (group, id) {
            if ($scope.isGroupShown(group)) {
                $scope.shownGroup = null;
            } else {
                $scope.shownGroup = group;
            }
            $scope.goto(id);
        };

        $scope.isGroupShown = function (group) {
            return $scope.shownGroup === group;
        };
        $scope.$on('updateScopeFromDirective', function () {
            FormUpdateService.addProduct($scope.formData, $scope.modalHelper);
        });
        $scope.$on('moduleSaveChanges', function () {
            $scope.formData = FormUpdateService.getProducts();
        });

        $scope.addPicture = function (index) {
            $rootScope.imgUp = $ionicPopup.alert({
                title: "Uploading",
                template: "<center><ion-spinner icon='android'></ion-spinner></center>",
                content: "",
                buttons: []
            });
            window.imagePicker.getPictures(
                    function (results) {
                        $scope.convertToDataURLviaCanvas(results[0], function (base64Img) {
                            $scope.$apply(function () {
                                $scope.item.base64String = base64Img.replace(/^data:image\/(png|jpg);base64,/, "");
                                $rootScope.imgUp.close();
                            });
                        });
                        $rootScope.imgUp.close();
                    }, function (error) {
            }, {
                maximumImagesCount: 1,
                width: 800,
                quality: 10
            });
        };
        $scope.removePicture = function (index) {
            if ($scope.pictures.length !== 1) {
                for (var i = index; i < $scope.pictures.length - 1; i++) {
                    $scope.pictures[i].comment = angular.copy($scope.pictures[i + 1].comment);
                    $scope.pictures[i].base64String = angular.copy($scope.pictures[i + 1].base64String);
                }
                $scope.pictures.splice($scope.pictures.length - 1, 1)
            } else {
                $scope.pictures[0].base64String = "";
                $scope.pictures[0].comment = "";
            }
        };

        $scope.convertToDataURLviaCanvas = function (url, callback) {
            var img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function () {
                var canvas = document.createElement('CANVAS');
                var ctx = canvas.getContext('2d');
                var dataURL;
                canvas.height = this.height;
                canvas.width = this.width;
                ctx.drawImage(this, 0, 0);
                dataURL = canvas.toDataURL('image/jpg');
                callback(dataURL);
                canvas = null;
            };
            img.src = url;
        };
    }
]);
