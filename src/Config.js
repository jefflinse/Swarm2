'use strict';

var plusOrMinusMax = function (value) {
    return (Math.random() * value * 2) - value;
}

var Config = {
    Brain: {
        MinHiddenLayers: 2,
        MaxHiddenLayers: 3,
        MinNodesPerHiddenLayer: 5,
        MaxAdditionalNodesPerHiddenLayer: 5,
    },
    ChanceOf: {
        ActivationFunctionChange: .2,
        ConnectionWeightChange: .75,
        ScanRadiusChange: .03,
    },
    Creature: {
        StartingEnergy: 1000,
        EnergyPerFood: 100,
        EnergyPerMovement: 1,
        AngularMaxSpeed: Math.PI / 3,
        LinearMaxSpeed: 8,
        MaxRadius: 10,
        StartingScanRadius: 50,
        MaxStartingParts: 6,
        MaxRadialChange: .01,
        Part: {
            EnergyPerMovement: .1,
            EnergyForExisting: .01,
            MaxRadius: 7,
            MaxDistanceFromCreature: 25,
            MaxExtendContractSpeed: 2,
            MaxAngularSpeed: Math.PI / 100,
            MinRadiusForConsumption: 1,
        },
    },
    Fluxuation: {
        RandomConnectionWeightChange: () => plusOrMinusMax(.5),
        RandomScanRadiusChange: () => plusOrMinusMax(5),
    },
    Mutation: {
        GlobalMutationRate: .75,
    },
    World: {
        FoodDensity: .00100,
        GenerationLengthInSec: 10,
        MaxCreatures: 50,
        TickIntervalInMs: 10,
        ReproductionPercentile: .3,
    }
};

module.exports = Config;
