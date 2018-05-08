'use strict';

function Debug() {
    
}

Debug.prototype = {

    assert: function (result, message) {
        if (result !== true) {
            throw new Error(message || "ASSERT failed");
        }
    },

    fail: function (message) {
        this.assert(false, message);
    },
}

module.exports = new Debug();
