'use strict';

var coinFlip = function () {
    return Math.random() < 0.5;
}

var plusOrMinus = function (value) {
    return coinFlip() ? value : -value;
}

var plusOrMinusMax = function (value) {
    return (Math.random() * value * 2) - value;
}

var Config = {
    ChanceOf: {
        ActivationFunctionChange: .15,
        ConnectionWeightChange: .15,
        ScanRadiusChange: .15,
    },
    Creature: {
        AngularMaxSpeed: Math.PI / 3,
        LinearMaxSpeed: 1,
        StartingScanRadius: 50,
        MaxStartingParts: 2,
        PartDistance: 15,
    },
    Fluxuation: {
        RandomConnectionWeightChange: () => plusOrMinusMax(.1),
        RandomScanRadiusChange: () => plusOrMinusMax(5),
    },
    Mutation: {
        GlobalMutationRate: .5,
    },
    World: {
        FoodDensity: .001,
        GenerationLengthInSec: 10,
        MaxCreatures: 100,
        TickIntervalInMs: 10,
        ReproductionPercentile: .5,
    }
};

module.exports = Config;
