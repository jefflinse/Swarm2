'use strict';

var plusOrMinusMax = function (value) {
    return (Math.random() * value * 2) - value;
}

var Config = {
    Brain: {
        MinHiddenLayers: 1,
        MaxHiddenLayers: 1,
        MinNodesPerHiddenLayer: 3,
        MaxAdditionalNodesPerHiddenLayer: 3,
    },
    ChanceOf: {
        ActivationFunctionChange: .01,
        ConnectionWeightChange: .05,
        ScanRadiusChange: .03,
    },
    Creature: {
        AngularMaxSpeed: Math.PI / 3,
        LinearMaxSpeed: 25,
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
        RandomConnectionWeightChange: () => plusOrMinusMax(.3),
        RandomScanRadiusChange: () => plusOrMinusMax(5),
    },
    Mutation: {
        GlobalMutationRate: .5,
    },
    World: {
        FoodDensity: .00015,
        GenerationLengthInSec: 10,
        MaxCreatures: 50,
        TickIntervalInMs: 10,
        ReproductionPercentile: .3,
    }
};

module.exports = Config;
