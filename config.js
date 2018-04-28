'use strict';

var Config = {
    ChanceOf: {
        ConnectionWeightChange: .3,
    },
    Fluxuation: {
        RandomConnectionWeightChange: () => (Math.random() * .2) - .1,
    },
};

module.exports = Config;
