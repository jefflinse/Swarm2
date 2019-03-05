'use strict';

var plusOrMinusMax = function (value) {
    return (Math.random() * value * 2) - value;
}

var Config = {
    Brain: {
        MinHiddenLayers: 1,
        MaxHiddenLayers: 2,
        MinNodesPerHiddenLayer: 3,
        MaxAdditionalNodesPerHiddenLayer: 3,
    },
    ChanceOf: {
        ActivationFunctionChange: .1,
        ConnectionWeightChange: .5,
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
            MaxExtendContractSpeed: 2,
            MaxAngularSpeed: Math.PI / 50,
            MinRadiusForConsumption: 1,
        },
    },
    Fluxuation: {
        RandomConnectionWeightChange: () => plusOrMinusMax(.5),
        RandomScanRadiusChange: () => plusOrMinusMax(5),
    },
    Mutation: {
        GlobalMutationRate: .5,
    },
    World: {
        FoodDensity: .00035,
        GenerationLengthInSec: 10,
        MaxCreatures: 25,
        TickIntervalInMs: 10,
        ReproductionPercentile: .4,
    }
};

module.exports = Config;
