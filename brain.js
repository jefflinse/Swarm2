'use strict';

var Config = require('./config');
var Debug = require('./debug');
var Synaptic = require('synaptic');

function Brain(network) {

    this.network = network || this._createDefaultNetwork();
    this.sensors = [];
    this.muscles = [];
}

Brain.prototype = {

    network: undefined,
    sensors: undefined,
    muscles: undefined,

    squashingFunctions: [
        Synaptic.Neuron.squash.LOGISTIC,
        Synaptic.Neuron.squash.TANH,
        Synaptic.Neuron.squash.HLIM,
        Synaptic.Neuron.squash.IDENTITY
    ],

    activate: function () {
        let inputValues = this.sensors.map(sensor => sensor.value);
        let outputValues = this.network.activate(inputValues);
        let outputIndex = 0;
        this.muscles.forEach(muscle => {
            muscle.value = outputValues[outputIndex++];
        });
    },

    addSensor: function (sensor) {
        // sensor = { value }
        this.sensors.push(sensor);
        this._rebalanceHiddenLayer();

        // add a new sensory neuron if necessary
        if (this.network.inputs() < this.sensors.length) {
            let sensorNeuron = new Synaptic.Neuron();
            sensorNeuron.squash = this._randomSquashingFunction();

            // add and project to all hidden layer neurons
            this.network.layers.input.add(sensorNeuron);
            this.network.layers.hidden[0].neurons().forEach(neuron => {
                sensorNeuron.project(neuron, Math.random() * 2 - 1);
            });
        }

        Debug.assert(this.sensors.length === this.network.inputs(), "sensors/inputs mismatch");
    },

    addMuscle: function (muscle) {
        // muscle = { value: double }
        this.muscles.push(muscle);
        this._rebalanceHiddenLayer();
        
        // add a new muscle neuron if necessary
        if (this.network.outputs() < this.muscles.length) {
            let muscleNeuron = new Synaptic.Neuron();
            muscleNeuron.squash = Synaptic.Neuron.squash.TANH;

            // add and project all hidden layer neurons to it
            this.network.layers.output.add(muscleNeuron);
            this.network.layers.hidden[0].neurons().forEach(neuron => {
                neuron.project(muscleNeuron, Math.random() * 2 - 1);
            });
        }

        Debug.assert(this.muscles.length === this.network.outputs(), "muscles/outputs mismatch");
    },

    clone: function (sensors, muscles) {
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
            if (layer !== 'output' && Math.random() < Config.ChanceOf.ActivationFunctionChange) {
                neuron.squash = this.squashingFunctions[Math.floor(Math.random() * this.squashingFunctions.length)];
            }
        }
    },

    _createDefaultNetwork: function () {
        var that = this;

        let network = new Synaptic.Architect.Perceptron(1, 1, 1);

        // randomize the activation functions
        network.neurons().forEach(neuron => {
            if (neuron.layer === 'output') {
                // force all outputs to [-1, 1]
                neuron.neuron.squash = Synaptic.Neuron.squash.TANH;
            }
            else {
                // input and hidden layers can use any activation function
                neuron.neuron.squash = that._randomSquashingFunction();
            }
        });

        return network;
    },

    _rebalanceHiddenLayer: function () {
        let hiddenLayerSize = Math.max(this.sensors.length, this.network.layers.hidden[0].size, this.muscles.length);
        if (this.network.layers.hidden[0].size < hiddenLayerSize) {
            let hiddenNeuron = new Synaptic.Neuron();
            // hidden layer can use any activation function
            hiddenNeuron.squash = this._randomSquashingFunction();

            // project all inputs to new hidden neuron
            this.network.layers.input.list.forEach(inputNeuron => {
                inputNeuron.project(hiddenNeuron, Math.random() * 2 - 1);
            });

            // project hidden neuron to all outputs
            this.network.layers.output.list.forEach(outputNeuron => {
                hiddenNeuron.project(outputNeuron, Math.random() * 2 - 1);
            });

            this.network.layers.hidden[0].add(hiddenNeuron);
        }
    },

    _randomSquashingFunction: function () {
        return this.squashingFunctions[Math.floor(Math.random() * this.squashingFunctions.length)];
    },
}

module.exports = Brain;
