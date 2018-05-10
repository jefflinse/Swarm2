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
        ActivationFunctionChange: .01,
        ConnectionWeightChange: .05,
        ScanRadiusChange: .03,
    },
    Creature: {
        AngularMaxSpeed: Math.PI / 3,
        LinearMaxSpeed: .5,
        MaxRadius: 10,
        StartingScanRadius: 50,
        MaxStartingParts: 5,
        MaxRadialChange: .5,
        Part: {
            MaxRadius: 7,
            MaxDistanceFromCreature: 25,
            MaxExtendContractSpeed: 5,
            MaxAngularSpeed: Math.PI / 25,
            MinRadiusForConsumption: 1,
        },
    },
    Fluxuation: {
        RandomConnectionWeightChange: () => plusOrMinusMax(.1),
        RandomScanRadiusChange: () => plusOrMinusMax(5),
    },
    Mutation: {
        GlobalMutationRate: .5,
    },
    World: {
        FoodDensity: .0002,
        GenerationLengthInSec: 10,
        MaxCreatures: 50,
        TickIntervalInMs: 10,
        ReproductionPercentile: .5,
    }
};

module.exports = Config;
