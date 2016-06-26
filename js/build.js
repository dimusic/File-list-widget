(function (w) {
    'use strict';

    function FileListApp () {
        this.fileListWidgets = [];
    }
    
    FileListApp.prototype.addFileListWidget = function (id) {
        if (!id && id != 0) {
            throw new Error('`id` parameter is required when creating new FileList Widget');
        }

        var newWidget = new FileListWidget(id);
        this.fileListWidgets.push(newWidget);
        document.body.appendChild(newWidget.view.getWidgetElement());
    };

    /**
     * Returns a widget's object by its id
     * @param {int} widgetId - Id of the widget
     */
    FileListApp.prototype.getWidetById = function (widgetId) {
        return this.fileListWidgets.filter(function (widget) {
            if (widgetId === widget.id) {
                return true;
            }
            return false;
        }).shift();
    };

    /**
     * Moves file from one widget to another
     * @param {int} fromWidgetId - Id of the widget to move the file from
     * @param {int} toWidgetId - Id of the widget to move the file to
     * @param {int} fileId - Id of the file to move
     */
    FileListApp.prototype.moveFile = function (fromWidgetId, toWidgetId, file) {
        var widgetFrom = this.getWidetById(fromWidgetId),
            widgetTo = this.getWidetById(toWidgetId)

        if (widgetTo.addFile(file)) {
            widgetFrom.removeFile(file.id);
        }
    };

    /**
     * Gets widget id from drop target element
     */
    FileListApp.prototype.getTargetWidgetId = function (el) {
        while(el.parentNode) {
            if (el.classList.contains('file-list-widget')) {
                return parseInt(el.dataset.widgetId, 10);
            }
            el = el.parentNode;
        }

        return false;
    };

    /**
     * Returns true if target element is not a file list widget
     */
    FileListApp.prototype.isRemoveAction = function (el) {
        while(el.parentNode) {
            if (el.classList.contains('file-list-widget')) {
                return false;
            }
            el = el.parentNode;
        }

        return true;
    };

    FileListApp.prototype.initDragDrop = function () {
        document.addEventListener('drop', function (e) {
            e.preventDefault();

            var dropEl = e.target,
                dataObj = e.dataTransfer.getData('text'),
                targetWidgetId,
                srcWidgetId;

            if (dataObj && dataObj.length > 0) {
                dataObj = JSON.parse(dataObj);
            }
            else {
                return false;
            }

            targetWidgetId = this.getTargetWidgetId(dropEl);
            srcWidgetId = dataObj.widgetId;

            if (this.isRemoveAction(dropEl)) {
                return this.getWidetById(srcWidgetId).removeFile(dataObj.file.id);
            }

            
            if (targetWidgetId !== srcWidgetId) {
                this.moveFile(srcWidgetId, targetWidgetId, dataObj.file);
            }
        }.bind(this), false);

        document.addEventListener('dragover', function (e) {
            e.preventDefault();
        }, false);
    };

    var fileListApp = new FileListApp();
    window.fileListApp = fileListApp;

    w.addEventListener('DOMContentLoaded', function () {
        fileListApp.initDragDrop();
        
        fileListApp.addFileListWidget(fileListApp.fileListWidgets.length + 1);
        
        fileListApp.addFileListWidget(fileListApp.fileListWidgets.length + 1);

        // Load serialized data
        fileListApp.getWidetById(1).unserialize('[{"id":3011814566,"uniqueHash":3735481783,"displayDate":"2016-06-26 19:55:23","lastModified":1466960123029,"name":"dsvdfv dfvd.txt","size":0,"displaySize":"0 b"},{"id":3494880894,"uniqueHash":3099367535,"displayDate":"2016-06-25 21:33:26","lastModified":1466879606126,"name":"vdfnbidnsjvkdnovirneovkmelkvsnfkjnvldfnvwoavnldfskvlkenarklvfdsl..vdfnbidnsjvkdnovirneovkmelkvsnfkjnvldfnvwoavnldfskvlkenarklvfdsl.html","size":1529,"displaySize":"1.5 kb"}]');

        console.log('1st widget serialized data: ', fileListApp.getWidetById(1).serialize());
    }, false);
})(window);
(function (window) {
    'use strict';
    
    function leftPad (str, len, char) {
        str = '' + str;
        char = '' + char;

        if (char.length === 0) {
            char = ' ';
        }
        
        var pad = new Array(len + 1).join(char);
        return pad.substring(0, pad.length - str.length) + str
    }

    function simpleHash (str) {
        var hash = 5381,
            i = str.length;

        while (i) {
            hash = (hash * 33) ^ str.charCodeAt(--i);
        }

        return hash >>> 0;
    }

    function humanFileSize (bytes) {
        var thresh = 1024;
        if(Math.abs(bytes) < thresh) {
            return bytes + ' b';
        }
        var units = ['kb','mb','gb','tb'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while(Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1)+' '+units[u];
    }

    window.utils = {
        leftPad: leftPad,
        simpleHash: simpleHash,
        humanFileSize: humanFileSize
    };
})(window);
(function (w) {
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

    w.FileListWidget = FileListWidget;
})(window);
(function (window) {
    'use strict';

    function FileListWidgetView (id, columns, parentEl) {
        this.fileTemplate = '<tr draggable="true" id="{{id}}" data-id="{{id}}" title="{{name}}">'
                + '{{fileData}}'
            + '</tr>';
        
        this.bodyTemplate = '<tbody></tbody>';
        
        this.headerTemplate = '<thead>'
                + '<tr>'
                    + '{{headerData}}'
                + '</tr>'
            + '</thead>';
        
        this.footerTemplate = '<tfoot>'
                + '<tr>'
                    + '<th colspan="3">'
                        + '<input type="file" id="addNewFilesBtn{{id}}" name="files[]" multiple="" class="file-input-btn">'
                        + '<label for="addNewFilesBtn{{id}}">+ Add new</label>'
                    + '</th>'
                + '</tr>'
            + '</tfoot>';
        
        this.columns = columns;
        
        this.el = null;
        this.fileListEl = null;
        this.widgetId = id;
        this.currentSortColumn = null;
    }

    FileListWidgetView.prototype = {
        getWidgetElement: function () {
            return this.el;
        },

        getFileListElement: function () {
            return this.getWidgetElement().getElementsByTagName('tbody')[0];
        },

        applySortClasses: function (sortKey, desc) {
            if (!sortKey) {
                return false;
            }

            var headerEl = this.el.querySelector('[data-sort-key="'+sortKey+'"]'),
                direction = (desc) ? 'sort-up' : 'sort-down';

            if (this.currentSortColumn) {
                this.currentSortColumn.classList.remove('sort-up');
                this.currentSortColumn.classList.remove('sort-down');
            }

            headerEl.classList.add(direction);
            this.currentSortColumn = headerEl;
        },

        createWidget: function (id, columns, files) {
            var widgetEl = document.createElement('table'),
                header = this.createHeader(columns),
                footer = this.createFooter(),
                body = this.createBody();
            
            widgetEl.id = id;
            widgetEl.dataset.widgetId = id;
            widgetEl.classList.add('file-list-widget');

            widgetEl.innerHTML = header + footer + body;

            this.el = widgetEl;
            this.fileListEl = widgetEl.getElementsByTagName('tbody')[0];

            return widgetEl;
        },

        createHeader: function (columns) {
            if (columns.length === 0) {
                return '';
            }

            var view = this.headerTemplate,
                headerData = '';

            columns.forEach(function (column) {
                var headerColumn = '<th class="column-header-'+column.key+'" data-sort-key='+ column.sortKey +'>'
                        + column.name
                    + '</th>';
                
                headerData += headerColumn;
            }, this);

            view = this.headerTemplate.replace('{{headerData}}', headerData);

            return view;
        },

        createFooter: function () {
            var footerTemplate = this.footerTemplate;

            footerTemplate = footerTemplate.replace(/{{id}}/g, this.widgetId);

            return footerTemplate;
        },

        createBody: function () {
            return this.bodyTemplate;
        },

        /**
         * Renders whole list of files
         * @param {array} files - Files to render
         */
        renderFiles: function (files) {
            if (this.columns.length === 0) {
                return '';
            }

            var view = '';
            files.forEach(function (file) {
                var fileTemplate = this.fileTemplate,
                    fileData = '';
                this.columns.forEach(function (column) {
                    var fileColumn = '<td class="column-'+ column.key +'">'
                            + file[column.key]
                        + '</td>';
                    fileData += fileColumn;
                }, this);

                fileTemplate = fileTemplate.replace(/{{id}}/g, file.id);
                fileTemplate = fileTemplate.replace('{{name}}', file.name);
                fileTemplate = fileTemplate.replace('{{fileData}}', fileData);

                view += fileTemplate;
            }, this);

            this.fileListEl.innerHTML = view;
        }
    };

    window.FileListWidgetView = FileListWidgetView;
})(window);