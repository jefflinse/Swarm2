'use strict';

function Creature(network, world, x, y)
{
	this.network = network;
	this.world = world;
	this.energy = 1;
	this.foodEaten = 0;
	
	this.location = new Vector(x, y);
	this.velocity = new Vector(0, 0);

	this.nearestFood = this.location;
	
	this.color = 'rgb(' +
		Math.floor(Math.random() * 255) + ',' +
		Math.floor(Math.random() * 255) + ',' +
		Math.floor(Math.random() * 255) + ')';
}

Creature.prototype = {

	radius:           5,
	scanRadius:       50,
	maxEnergy:        1,
	linearMaxSpeed:   4,
	angularMaxSpeed:  Math.PI / 6,

	tick: function()
	{
		if (!this.isAlive()) {
			return;
		}

		// assign all input values
		var inputs = [];
		inputs.push(this.energy);
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
		let ds = networkOutput[0] * this.linearMaxSpeed;
		let da = networkOutput[1] * this.angularMaxSpeed;
		this.velocity.setMagnitude(ds);
		this.velocity.rotate(da);
		this.location.add(this.velocity);

		this.energy -= Math.abs(.02 * (ds / this.linearMaxSpeed)) + Math.abs(.02 * (da / this.angularMaxSpeed));
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
		this.energy = Math.min(this.maxEnergy, this.energy + .1);
	},

	clone: function()
	{
		var x = Math.random() * this.world.width;
		var y = Math.random() * this.world.height;
		var creature = new Creature(this.network.clone(), this.world, x, y);
		
		var neurons = creature.network.neurons();
		for (var i in neurons) {
			var neuron = neurons[i].neuron;
			for (var j in neuron.connections.projected) {
				var connection = neuron.connections.projected[j];
				if (Math.random() < .3) {
					connection.weight += (Math.random() * .2) - .1;
				}
			}
		}

		creature.velocity.random();
		creature.color = this.color;

		return creature;
	},

	draw: function()
	{
		if (!this.isAlive()) {
			return;
		}

		this.world.ctx.lineWidth = 1;
		this.world.ctx.beginPath();
		this.world.ctx.fillStyle = this.color;
		this.world.ctx.arc(this.location.x, this.location.y, this.radius, 0, 2 * Math.PI);
		this.world.ctx.fill();

		// draw pointer (to show what direction the creature is facing)
		this.world.ctx.lineWidth = 3;
		this.world.ctx.beginPath();
		this.world.ctx.strokeStyle = 'black';
		this.world.ctx.moveTo(this.location.x, this.location.y);
		var relativeTarget = this.velocity.copy().setMagnitude(this.radius + 3);
		var absolutePosition = this.location.copy().add(relativeTarget);
		this.world.ctx.lineTo(absolutePosition.x, absolutePosition.y);
		this.world.ctx.stroke();

		// draw line to nearest food
		if (this.nearestFood.magnitude() < this.scanRadius) {
			this.world.ctx.lineWidth = 1;
			this.world.ctx.beginPath();
			this.world.ctx.strokeStyle = 'rgba(150, 150, 150, .5)';
			this.world.ctx.moveTo(this.location.x, this.location.y);
			var absolutePosition = this.location.copy().add(this.nearestFood);
			this.world.ctx.lineTo(absolutePosition.x, absolutePosition.y);
			this.world.ctx.stroke();
		}
	},

	highlight: function()
	{
		// draw a semitransparent "halo" around the creature, to make it stand out
		this.world.ctx.save();
		this.world.ctx.lineWidth = 1;
		this.world.ctx.fillStyle = this.color;
		this.world.ctx.globalAlpha = .2;
		this.world.ctx.beginPath();
		this.world.ctx.arc(this.location.x, this.location.y, this.radius * 5, 0, 2 * Math.PI);
		this.world.ctx.fill();
		this.world.ctx.restore();
	},

	fitness: function()
	{
		return this.isAlive() ? this.foodEaten : 0;
	},

	isAlive: function()
	{
		return this.energy > 0;
	},

	reset: function()
	{
		this.foodEaten = 0;
		this.energy = this.maxEnergy;
	}
}
