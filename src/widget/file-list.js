(function (window) {
    'use strict';

    function FileListWidget (id, serializedData) {
        this.files = [];
        
        this.sortBy = null;
        this.sortDesc = false;
        

        this.id = typeof(id) !== 'undefined' ? id : null;
        this.columns = [
            {
                name: 'Name',
                key: 'name',
                sortKey: 'name'
            },
            {
                name: 'Size',
                key: 'displaySize',
                sortKey: 'size'
            },
            {
                name: 'Date modified',
                key: 'displayDate',
                sortKey: 'lastModified'
            }
        ];

        //Sort by name by default
        this.sortBy = this.columns[0].sortKey;

        this.view = new FileListWidgetView(this.id, this.columns);

        if (serializedData) {
            this.unserialize(serializedData);
        }

        this.init();
    }

    FileListWidget.prototype = {
        serialize: function () {
            return JSON.stringify(this.files);
        },

        unserialize: function (serializedData) {
            if (!serializedData || typeof(serializedData) !== 'string') {
                throw new TypeError('Wrong serialized data format.');
            }
            var files = JSON.parse(serializedData);
            this.addFiles(files);
        },

        getFileByKey: function (keyName, value) {
            return this.files.filter(function (file) {
                if (file[keyName] === value) {
                    return true;
                }
                return false;
            }).shift();
        },

        getFileById: function (fileId) {
            return this.getFileByKey('id', fileId);
        },

        getFileByHashCode: function (fileHash) {
            return this.getFileByKey('uniqueHash', fileHash);
        },

        applySort: function (key) {
            var sortDesc = this.sortDesc;
            this.sortBy = key;
            this.view.applySortClasses(key, sortDesc);
            
            this.files = this.files.sort(function (a, b) {
                var valA = a[key],
                    valB = b[key],
                    type = 'number',
                    res = 0;
                
                if (typeof(valA) === 'string' && typeof(valB) === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }

                if (valA === valB) {
                    return 0;
                }

                if (valA > valB) {
                    res = 1;
                }
                if (valA < valB) {
                    res = -1;
                }

                return res * [1, -1][~~sortDesc];
            });

            this.view.renderFiles(this.files);
        },

        initHeader: function (headerEl) {
            headerEl.addEventListener('click', function (e) {
                // Handle sorting
                var targetEl = e.target,
                    sortKey = targetEl.dataset.sortKey;

                if (targetEl.tagName === 'TH') {
                    if (sortKey === this.sortBy) {
                        // Same column clicked, swap sort direction setting
                        this.sortDesc = !this.sortDesc;
                    }
                    else {
                        // Other column clicked, sort direction is default
                        this.sortDesc = false;
                    }

                    this.applySort(targetEl.dataset.sortKey);
                }
            }.bind(this));
        },

        initFooter: function (footerEl) {
            footerEl.getElementsByClassName('file-input-btn')[0].addEventListener('change', function (e) {
                var files = Array.prototype.slice.call(e.target.files);
                this.handleFilesSelection(files);
            }.bind(this), false);
        },

        handleFilesSelection: function (files) {
            var filesCollection = [];
            files.forEach(function (file) {
                var dateFormatted = file.lastModifiedDate.getFullYear()
                    + '-' + utils.leftPad((file.lastModifiedDate.getMonth() + 1), 2, '0')
                    + '-' + utils.leftPad(file.lastModifiedDate.getDate(), 2, '0')
                    + ' ' + utils.leftPad(file.lastModifiedDate.getHours(), 2, '0')
                    + ':' + utils.leftPad(file.lastModifiedDate.getMinutes(), 2, '0')
                    + ':' + utils.leftPad(file.lastModifiedDate.getSeconds(), 2, '0');
                
                var fileObj = {
                    id: utils.simpleHash(this.id + file.name + file.size + file.lastModified),
                    uniqueHash: utils.simpleHash(file.name + file.size + file.lastModified),
                    displayDate: dateFormatted,
                    lastModified: file.lastModified,
                    name: file.name,
                    size: file.size,
                    displaySize: utils.humanFileSize(file.size)
                };

                filesCollection.push(fileObj);
            }.bind(this));
            
            this.addFiles(filesCollection);
        },

        removeFile: function (fileId) {
            this.removeFiles([fileId]);
        },

        removeFiles: function (fileIds) {
            var removedAnyFiles = false;

            if (!fileIds.length === 0) {
                return false;
            }

            for (var i = 0; i < this.files.length; i++) {
                if (fileIds.indexOf(this.files[i].id) !== -1) {
                    this.files.splice(i, 1);
                    removedAnyFiles = true;
                }
            }
            if (removedAnyFiles) {
                this.view.renderFiles(this.files);
            }
        },
        
        initDragDrop: function () {
            var el = this.view.getWidgetElement(),
                fileListEl = this.view.getFileListElement();

            fileListEl.addEventListener('dragstart', function (e) {
                // Set the file's object we're dragging as the data
                var file = this.getFileById(parseInt(e.target.dataset.id, 10));
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    file: file,
                    widgetId: this.id
                }));
            }.bind(this));

            el.addEventListener('dragover', function (e) {
                e.preventDefault();
            });
            el.addEventListener('dragenter', function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
            el.addEventListener('drop', function (e) {
                // Handle files dropped into the widget
                e.preventDefault();

                if (e.dataTransfer.files.length > 0) {
                    this.handleFilesSelection(Array.prototype.slice.call(e.dataTransfer.files));
                    e.stopPropagation();
                }
            }.bind(this));
        },

        showDuplicateFileError: function (fileName) {
            alert('File ' + fileName + ' already exists');
        },

        addFile: function (fileObj) {
            return this.addFiles([fileObj]);
        },

        addFiles: function (filesObj) {
            filesObj = filesObj.filter(function (fileObj) {
                // Remove duplicates
                if (this.getFileByHashCode(fileObj.uniqueHash)) {
                    this.showDuplicateFileError(fileObj.name);
                    return false;
                }

                return true;
            }, this);

            if (filesObj.length === 0) {
                // No files to add
                return false;
            }

            this.files = this.files.concat(filesObj);

            this.applySort(this.sortBy);
            this.view.renderFiles(this.files);
            return true;
        },

        init: function () {
            if (typeof(window.FileReader) === 'undefined') {
                throw new Error('Browser not supported');
            }

            var widgetEl = this.view.createWidget(this.id, this.columns);
            this.initHeader(widgetEl.getElementsByTagName('thead')[0]);
            this.initFooter(widgetEl.getElementsByTagName('tfoot')[0]);
            
            this.initDragDrop();
        }
    }

    window.FileListWidget = FileListWidget;
})(window);