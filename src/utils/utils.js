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