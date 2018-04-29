'use strict';

var plusOrMinus = function (value) {
    return (Math.random() * value * 2) - value;
}

var Config = {
    ChanceOf: {
        ActivationFunctionChange: .1,
        ConnectionWeightChange: .25,
    },
    Fluxuation: {
        RandomConnectionWeightChange: () => plusOrMinus(.1),
    },
    World: {
        FoodDensity: .001,
        GenerationLengthInSec: 5,
        MaxCreatures: 100,
        TickIntervalInMs: 10,
    }
};

module.exports = Config;
