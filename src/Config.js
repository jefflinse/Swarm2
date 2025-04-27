'use strict';

var plusOrMinusMax = function (value) {
    return (Math.random() * value * 2) - value;
}

var Config = {
    Brain: {
        MinHiddenLayers: 2,
        MaxHiddenLayers: 3,
        MinNodesPerHiddenLayer: 8,
        MaxAdditionalNodesPerHiddenLayer: 5,
    },
    ChanceOf: {
        ActivationFunctionChange: .10,
        ConnectionWeightChange: .25,
        NewPartGrowth: .25,
        ScanRadiusChange: .03,
    },
    Creature: {
        StartingEnergy: 500,
        EnergyPerFood: 100,
        EnergyPerMovement: .20,
        ReproductionEnergyThreshold: 1.5,
        AngularMaxSpeed: Math.PI / 180,
        LinearMaxSpeed: 1,
        MaxRadius: 10,
        StartingScanRadius: 50,
        MaxStartingParts: 6,
        MaxRadialChange: .01,
        Part: {
            EnergyPerMovement: .2,
            EnergyForExisting: .001,
            MaxRadius: 7,
            MaxDistanceFromCreature: 30,
            MaxExtendContractSpeed: 5,
            MaxAngularSpeed: Math.PI / 100,
            MinRadiusForConsumption: 1,
        },
    },
    Fluxuation: {
        RandomConnectionWeightChange: () => plusOrMinusMax(.2),
        RandomScanRadiusChange: () => plusOrMinusMax(5),
    },
    Mutation: {
        GlobalMutationRate: .80,
    },
    World: {
        FoodDensity: .0006,
        FoodRegenerationRatePerTick: .002,
        GenerationLengthInSec: 10,
        MaxCreatures: 50,
        TickIntervalInMs: 10,
        ReproductionPercentile: .3,
    }
};

module.exports = Config;
