'use strict';

var plusOrMinusMax = function (value) {
    return (Math.random() * value * 2) - value;
}

var Config = {
    Brain: {
        MinHiddenLayers: 1,
        MaxHiddenLayers: 1,
        MinNodesPerHiddenLayer: 5,
        MaxAdditionalNodesPerHiddenLayer: 5,
    },
    ChanceOf: {
        ActivationFunctionChange: .10,
        ConnectionWeightChange: .25,
        NewPartGrowth: .25,
        ScanRadiusChange: .03,
    },
    Creature: {
        StartingEnergy: 1000,
        EnergyPerFood: 100,
        EnergyPerMovement: .5,
        ReproductionEnergyThreshold: 1.3,
        AngularMaxSpeed: Math.PI / 180,
        LinearMaxSpeed: 8,
        MaxRadius: 10,
        StartingScanRadius: 50,
        MaxStartingParts: 6,
        MaxRadialChange: .01,
        Part: {
            EnergyPerMovement: .1,
            EnergyForExisting: .1,
            MaxRadius: 7,
            MaxDistanceFromCreature: 30,
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
        GlobalMutationRate: .80,
    },
    World: {
        FoodDensity: .00125,
        GenerationLengthInSec: 10,
        MaxCreatures: 50,
        TickIntervalInMs: 10,
        ReproductionPercentile: .3,
    }
};

module.exports = Config;
