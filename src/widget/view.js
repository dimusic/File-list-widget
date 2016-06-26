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