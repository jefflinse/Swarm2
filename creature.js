'use strict';

var Config = require('./config');
var Graphics = require('./graphics');
var Synaptic = require('synaptic');
var Vector =require('./vector');

function Creature(world, specifics)
{
	var that = this;
	specifics = specifics || {};

	this.world = world;
	this.graphics = this.world.graphics;

	if (specifics.network !== undefined ) {
		this.network = specifics.network;
	}
	else {
		this.network = new Synaptic.Architect.Perceptron(4, 10, 2);

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
}

Creature.prototype = {

	radius:           5,
	scanRadius:       Config.Creature.StartingScanRadius,

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
		this.processOutputs(outputs);

		// interact with the world and other creatures
		this.interact();
	},

	processOutputs: function(networkOutput)
	{
		// first two network outputs specify the multipliers for deltas in distance and rotation
		let ds = networkOutput[0] * Config.Creature.LinearMaxSpeed;
		let da = networkOutput[1] * Config.Creature.AngularMaxSpeed;
		this.velocity.setMagnitude(ds);
		this.velocity.rotate(da);
		this.location.add(this.velocity);
	},

	interact: function()
	{
		this.nearestFood = new Vector(0, 0);
		var distanceToNearestFood = this.scanRadius + 1;

		// eat
		for (var i in this.world.food) {
			if (this.world.food[i].x !== null && this.world.food[i].y !== null) {
				let distanceToFood = this.location.distanceBetween(this.world.food[i]);
				if (distanceToFood <= this.radius) {
					this.eatFood(i);
				}
				else if (distanceToFood <= distanceToNearestFood) {
					this.nearestFood = this.world.food[i].copy().subtract(this.location);
					distanceToNearestFood = distanceToFood;
				}
			}
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
		}

		return creature;
	},

	draw: function()
	{
		this.graphics.drawCircle(this.location, this.radius, {
			fillStyle: this.color,
			globalAlpha: 1,
			lineWidth: 1
		});

		// draw pointer (to show what direction the creature is facing)
		let relativeTarget = this.velocity.copy().setMagnitude(this.radius + 3);
		let absoluteTarget = this.location.copy().add(relativeTarget);
		this.graphics.drawLine(this.location, absoluteTarget, {
			lineWidth: 3,
			strokeStyle: 'black',
		});

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
