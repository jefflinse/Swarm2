'use strict';

var Config = require('./config');
var Graphics = require('./graphics');
var Synaptic = require('synaptic');
var Vector =require('./vector');

function Part(creature, specifics) {
	var that = this;
	specifics = specifics || {};

	this.creature = creature;

	if (specifics.relativePosition !== undefined) {
		this.relativePosition = specifics.relativePosition;
	}
	else {
		this.relativePosition = new Vector(0, 0);
		this.relativePosition.setMagnitude(Config.Creature.PartDistance);
		this.relativePosition.setAngle(Math.random() * Math.PI * 2);
	}

	// set up inputs (values from the neural network controlling the part)
	if (specifics.inputs !== undefined) {
		this.inputs = specifics.inputs;
	}
	else {
		this.inputs = [];
		this.inputs.push(0); // relative angle delta from creature
		this.inputs.push(0); // relative length delta from creature
		this.inputs.push(0); // relative radius delta
	}

	this.radius = specifics.radius || Math.floor(Math.random() * Config.Creature.StartingRadius) + 3;
}

Part.prototype = {

	relativePosition: undefined,
	inputs: undefined,

	clone: function (creature) {
		return new Part(creature, {
			relativePosition: this.relativePosition.copy(),
			type: this.type,
		})
	},

	tick: function () {
		let ds = this.inputs[0] * Config.Creature.PartMaxContractionSpeed;
		let da = this.inputs[1] * Config.Creature.PartAngularMaxSpeed;
		this.relativePosition.rotate(da);
		this.relativePosition.setMagnitude(this.relativePosition.magnitude() + ds).limit(Config.Creature.PartDistance);

		let dr = this.inputs[2] * Config.Creature.MaxRadialChange;
		this.radius = Math.max(3, Math.min(Config.Creature.StartingRadius, this.radius + dr));
	},

	interact: function () {
		this.creature.nearestFood.set(0, 0);
		var distanceToNearestFood = this.creature.scanRadius + 1;
		let absolutePosition = this.creature.location.copy().add(this.relativePosition);

		// eat
		for (var i in this.creature.world.food) {
			if (this.creature.world.food[i].x !== null) {
				let distanceToFood = absolutePosition.distanceBetween(this.creature.world.food[i]);
				if (distanceToFood <= this.radius) {
					this.creature.eatFood(i);
				}
				else if (distanceToFood <= distanceToNearestFood) {
					this.creature.nearestFood = this.creature.world.food[i].copy().subtract(this.creature.location);
					distanceToNearestFood = distanceToFood;
				}
			}
		}
	}
}

function Creature(world, specifics)
{
	var that = this;
	specifics = specifics || {};

	this.world = world;
	this.graphics = this.world.graphics;

	if (specifics.parts !== undefined) {
		this.parts = specifics.parts;
	}
	else {
		// random parts
		let numParts = Math.floor(Math.random() * (Config.Creature.MaxStartingParts + 1));
		this.parts = [];
		for (let i = 0; i < numParts; i++) {
			this.parts.push(new Part(this));
		}
	}

	this.reset();

	this.velocity = new Vector(0, 0).random();
	this.location = new Vector(
		Math.random() * (this.world.width - 100) + 50,
		Math.random() * (this.world.height - 100) + 50
	);

	this.nearestFood = new Vector(0, 0);

	if (specifics.scanRadius !== undefined) {
		this.scanRadius = specifics.scanRadius;
	}

	if (specifics.color !== undefined) {
		this.color = specifics.color;
	}
	else {
		this.color = 'rgb(' +
			Math.floor(Math.random() * 255) + ',' +
			Math.floor(Math.random() * 255) + ',' +
			Math.floor(Math.random() * 255) + ')';
	}

	if (specifics.network !== undefined) {
		this.network = specifics.network;
	}
	else {
		let numInputs = 4;
		let numOutputs = 0;
		this.parts.forEach(part => {
			numOutputs += part.inputs.length; // distribute outputs to parts
		});
		let numHidden = Math.ceil((numInputs + numOutputs) / 2);

		// random network
		this.network = new Synaptic.Architect.Perceptron(numInputs, numHidden, numOutputs);

		// randomize the activation functions
		this.network.neurons().forEach(function (neuron) {
			if (neuron.layer === 'output') {
				// force all outputs to [-1, 1]
				neuron.neuron.squash = synaptic.Neuron.squash.TANH;
			}
			else {
				// input and hidden layers can use any activation function
				neuron.neuron.squash = that.squashingFunctions[Math.floor(Math.random() * that.squashingFunctions.length)];
			}
		});
	}
}

Creature.prototype = {

	radius:           Config.Creature.StartingRadius,
	scanRadius:       Config.Creature.StartingScanRadius,
	parts:            [],

	squashingFunctions: [
		Synaptic.Neuron.squash.LOGISTIC,
		Synaptic.Neuron.squash.TANH,
		Synaptic.Neuron.squash.HLIM,
		Synaptic.Neuron.squash.IDENTITY
	],

	tick: function()
	{
		// assign all input values
		var inputs = [];
		inputs.push(this.nearestFood.magnitude());
		inputs.push(this.nearestFood.angle());
		inputs.push(this.velocity.magnitude());
		inputs.push(this.velocity.angle());

		// feed the neural network forward
		var outputs = this.network.activate(inputs);

		let totalWeight = 0;
		this.velocity.set(0, 0);
		for (let i = 0; i < this.parts.length; i++) {
			let outputIndex = i * 3;
			this.parts[i].inputs[0] = outputs[outputIndex];
			this.parts[i].inputs[1] = outputs[outputIndex + 1];
			this.parts[i].inputs[2] = outputs[outputIndex + 2];
			this.parts[i].tick();
			this.velocity.add(this.parts[i].relativePosition.copy().invert());
			totalWeight += this.parts[i].radius;
		}

		// limit magnitude based on overall radii ratio
		let magnitude = (this.velocity.magnitude() / Config.Creature.PartDistance) * Config.Creature.LinearMaxSpeed;
		let weightRatio = totalWeight / (this.parts.length * Config.Creature.StartingRadius);
		magnitude = magnitude - (magnitude * weightRatio);
		this.velocity.setMagnitude(magnitude);
		this.velocity.limit(Config.Creature.LinearMaxSpeed);
		this.location.add(this.velocity);

		// interact with the world and other creatures
		this.interact();
	},

	interact: function()
	{
		for (let i = 0; i < this.parts.length; i++) {
			this.parts[i].interact();
		}
	},

	eatFood: function(foodId) {
		this.world.food[foodId].x = null; // invalidate
		this.foodEaten++;
	},

	clone: function()
	{
		var creature = new Creature(this.world, {
			network: this.network.clone(),
			color: this.color,
			scanRadius: this.scanRadius,
			parts: [],
		});

		this.parts.forEach(part => {
			creature.parts.push(part.clone(creature));
		});
		
		// mutations
		if (Math.random() < Config.Mutation.GlobalMutationRate) {
			let neurons = creature.network.neurons();
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

			// scan radius mutation
			if (Math.random() < Config.ChanceOf.ScanRadiusChange) {
				creature.scanRadius += Config.Fluxuation.RandomScanRadiusChange();
			}

			// part generation
			if (Math.random() < Config.ChanceOf.PartGeneration) {
				creature.addPart(new Part(creature));
			}
		}

		return creature;
	},

	draw: function()
	{
		// draw self
		this.graphics.drawCircle(this.location, this.radius, {
			fillStyle: this.color,
			globalAlpha: 1,
			lineWidth: 1
		});

		// draw parts
		let parts = this.parts;
		for (let i = 0; i < parts.length; i++) {
			let partLocation = this.location.copy().add(parts[i].relativePosition);

			// draw part
			this.graphics.drawCircle(partLocation, parts[i].radius, {
				fillStyle: this.color,
				globalAlpha: .5,
				lineWidth: 1,
			});

			// draw line to part
			this.graphics.drawLine(this.location, partLocation, {
				lineWidth: 2,
				strokeStyle: 'rgba(50, 50, 50, .5)',
			});
		}

		// // draw pointer (to show what direction the creature is facing)
		// let relativeTarget = this.velocity.copy().setMagnitude(this.radius + 3);
		// let absoluteTarget = this.location.copy().add(relativeTarget);
		// this.graphics.drawLine(this.location, absoluteTarget, {
		// 	lineWidth: 3,
		// 	strokeStyle: 'black',
		// });

		// draw line to nearest food
		if (this.nearestFood.magnitude() < this.scanRadius) {
			let absolutePosition = this.location.copy().add(this.nearestFood);
			this.graphics.drawLine(this.location, absolutePosition, {
				lineWidth: 1,
				strokeStyle: 'rgba(150, 150, 150, .5)',
			});
		}
	},

	highlight: function()
	{
		// draw a semitransparent "halo" around the creature, to make it stand out
		this.graphics.drawCircle(this.location, this.scanRadius, {
			lineWidth: 1,
			fillStyle: this.color,
			globalAlpha: .2,
		})
	},

	addPart: function (part) {
		this.parts.push(part);
		for (let newNeuronIndex = 0; newNeuronIndex < part.inputs.length; newNeuronIndex++) {
			let outputNeuron = new synaptic.Neuron();
			outputNeuron.squash = synaptic.Neuron.squash.TANH;
			// connect all hidden layer neurons to this new output neuron
			for (let i = 0; i < this.network.layers.hidden[0].length; i++) {
				let hiddenNeuron = this.network.layers.hidden[0][i].neuron;
				hiddenNeuron.project(outputNeuron);
			}
			this.network.layers.output.add(outputNeuron);
		}
	},

	fitness: function()
	{
		return this.foodEaten;
	},

	reset: function()
	{
		this.foodEaten = 0;
	}
}

module.exports = Creature;
