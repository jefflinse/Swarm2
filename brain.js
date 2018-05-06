'use strict';

var Config = require('./config');
var Synaptic = require('synaptic');

function Brain(sensors, muscles, specifics) {
    var that = this;
    specifics = specifics || {};

    this.sensors = sensors; // inputs to the brain
    this.muscles = muscles; // outputs from the brain

    if (specifics.network !== undefined) {
        this.network = specifics.network;
    }
    else {
        // default network
        this.network = new Synaptic.Architect.Perceptron(
            this.sensors.length, // inputs
            Math.max(this.sensors.length, this.muscles.length), // hidden
            this.muscles.length); // output

        // randomize the activation functions
        this.network.neurons().forEach(neuron => {
            if (neuron.layer === 'output') {
                // force all outputs to [-1, 1]
                neuron.neuron.squash = Synaptic.Neuron.squash.TANH;
            }
            else {
                // input and hidden layers can use any activation function
                neuron.neuron.squash = that._randomSquashingFunction();
            }
        });
    }
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

        // add a new sensory neuron if necessary
        if (this.network.layers.input.size < this.sensors.length) {
            let sensorNeuron = new Synaptic.Neuron();

            // add and project to all hidden layer neurons
            this.network.layers.input.add(sensorNeuron);
            this.network.layers.hidden[0].neurons().forEach(neuron => {
                sensorNeuron.project(neuron);
            });

            this._rebalanceHiddenLayer();
        }
    },

    addMuscle: function (muscle) {
        // muscle = { type: "sigmoid", value: double }
        this.muscles.push(muscle);
        
        // add a new muscle neuron if necessary
        if (this.network.layers.output.size < this.muscles.length) {
            let muscleNeuron = new Synaptic.Neuron();
            muscleNeuron.squash = Synaptic.Neuron.squash.TANH;

            // add and project all hidden layer neurons to it
            this.network.layers.output.add(muscleNeuron);
            this.network.layers.hidden[0].neurons().forEach(neuron => {
                neuron.project(muscleNeuron);
            });

            this._rebalanceHiddenLayer();
        }
    },

    clone: function () {
        return new Brain(
            this.sensors.map(sensor => { return { value: sensor.value } }),
            this.muscles.map(muscle => { return { value: muscle.value } }),
            { network: this.network.clone() },
        );
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

    _rebalanceHiddenLayer: function () {
        let hiddenLayerSize = Math.max(this.sensors.length, this.network.layers.hidden[0].size, this.muscles.length);
        if (this.network.layers.hidden[0].size < hiddenLayerSize) {
            let hiddenNeuron = new Synaptic.Neuron();
            // hidden layer can use any activation function
            hiddenNeuron.squash = this._randomSquashingFunction();
            this.network.layers.hidden[0].add(hiddenNeuron);
        }
    },

    _randomSquashingFunction: function () {
        return this.squashingFunctions[Math.floor(Math.random() * this.squashingFunctions.length)];
    },
}

module.exports = Brain;
