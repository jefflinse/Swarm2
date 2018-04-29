'use strict';

var plusOrMinus = function (value) {
    return (Math.random() * value * 2) - value;
}

var Config = {
    ChanceOf: {
        ActivationFunctionChange: .1,
        ConnectionWeightChange: .25,
    },
    Creature: {
        AngularMaxSpeed: Math.PI / 3,
        LinearMaxSpeed: 1,
        StartingScanRadius: 50,
    },
    Fluxuation: {
        RandomConnectionWeightChange: () => plusOrMinus(.1),
    },
    Mutation: {
        GlobalMutationRate: .5,
    },
    World: {
        FoodDensity: .001,
        GenerationLengthInSec: 5,
        MaxCreatures: 100,
        TickIntervalInMs: 10,
        ReproductionPercentile: .5,
    }
};

module.exports = Config;
