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