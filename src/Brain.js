'use strict';

var Config = require('./Config');
var Debug = require('./Debug');
var Synaptic = require('synaptic');

function Brain(network) {

    this.network = network;
    this.inputs = [];
    this.outputs = [];
}

Brain.prototype = {

    network: undefined,
    inputs: undefined,
    outputs: undefined,

    squashingFunctions: [
        Synaptic.Neuron.squash.LOGISTIC,
        Synaptic.Neuron.squash.TANH,
        Synaptic.Neuron.squash.HLIM,
        Synaptic.Neuron.squash.IDENTITY
    ],

    activate: function () {
        let inputValues = this.inputs.map(input => input.value);
        let outputValues = this.network.activate(inputValues);
        let outputIndex = 0;
        this.outputs.forEach(output => {
            output.value = outputValues[outputIndex++];
        });
    },

    connect: function (inputs, outputs) {
        this.inputs = inputs;
        this.outputs = outputs;

        this.network = this.network || this._randomNetworkBasedOnInputsAndOutputs();

        Debug.assert(this.network.layers.input.size === this.inputs.length,
            "input count mismatch with NN (" + this.inputs.length + "/" + this.network.layers.input.size + ")");
        Debug.assert(this.network.layers.output.size === this.outputs.length,
            "output count mismatch with NN (" + this.outputs.length + "/" + this.network.layers.output.size + ")");
    },

    clone: function () {
        return new Brain(this.network.clone());
    },

    mutate: function () {
        let neurons = this.network.neurons();
        for (var i in neurons) {
            let neuron = neurons[i].neuron;
            let layer = neurons[i].layer;

            // random connection weight mutation
            for (var j in neuron.connections.projected) {
                let connection = neuron.connections.projected[j];
                if (Math.random() < Config.ChanceOf.ConnectionWeightChange) {
                    connection.weight += Config.Fluxuation.RandomConnectionWeightChange();
                }
            }

            // random activation function mutation
            if (layer !== 'input' && layer !== 'output' && Math.random() < Config.ChanceOf.ActivationFunctionChange) {
                neuron.squash = this.squashingFunctions[Math.floor(Math.random() * this.squashingFunctions.length)];
            }
        }
    },

    _randomNetworkBasedOnInputsAndOutputs: function () {
        var that = this;

        let numInputs = this.inputs.length;
        let numOutputs = this.outputs.length;
        let numHiddenLayers = this._randomIntInclusive(Config.Brain.MinHiddenLayers, Config.Brain.MaxHiddenLayers);
        let maxNodesPerHiddenLayer = Math.max(numInputs, numOutputs) + Config.Brain.MaxAdditionalNodesPerHiddenLayer;

        let layers = [];
        layers.push(numInputs);
        for (var i = 0; i < numHiddenLayers; i++) {
            layers.push(this._randomIntInclusive(Config.Brain.MinNodesPerHiddenLayer, maxNodesPerHiddenLayer));
        }
        layers.push(numOutputs);

        var applyArrayArgsForConstructor = function(f, args) {
            var params = [f].concat(args);
            return f.bind.apply(f, params);
        };

        var network = new (applyArrayArgsForConstructor(Synaptic.Architect.Perceptron, layers));

        // randomize the activation functions
        network.neurons().forEach(neuron => {
            if (neuron.layer === 'input') {
                // use all input values directly
                neuron.neuron.squash = Synaptic.Neuron.squash.IDENTITY;
            }
            if (neuron.layer === 'output') {
                // force all outputs to [-1, 1]
                neuron.neuron.squash = Synaptic.Neuron.squash.TANH;
            }
            else {
                // hidden layers can use any activation function
                neuron.neuron.squash = that._randomSquashingFunction();
            }
        });

        return network;
    },

    _randomSquashingFunction: function () {
        return this.squashingFunctions[Math.floor(Math.random() * this.squashingFunctions.length)];
    },

    _randomIntInclusive(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    },
}

module.exports = Brain;
