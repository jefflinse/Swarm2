'use strict';

var Config = {
    ChanceOf: {
        ConnectionWeightChange: .25,
    },
    Fluxuation: {
        RandomConnectionWeightChange: () => (Math.random() * .1) - .05,
    },
};

module.exports = Config;
