'use strict';

var Brain = require('./Brain');
var Config = require('./Config');
var Part = require('./Part');
var Vector =require('./Vector');

function Creature(world, brain, parts, inherited)
{
	var that = this;
	inherited = inherited || {};

	this.world = world;
	this.graphics = this.world.graphics;

	// create the parts and brain
	this.parts = parts || this._generateRandomParts();
	this.parts.forEach(part => part.creature = that);
	this.brain = brain || new Brain();

	// connect the parts to the brain
	let inputs = [
		{ value: 0 },  // angle of velocity vector
		{ value: 0 },  // magnitude of velocity vector
	];
	let outputs = [];
	this.parts.forEach(part => {
		inputs = inputs.concat(part.inputs);
		outputs = outputs.concat(part.outputs);
	});

	// part outputs are brain inputs, and vice-versa
	this.brain.connect(outputs, inputs)

	this.radius = inherited.radius || Config.Creature.MaxRadius;
	this.velocity = new Vector(0, 0).random();
	this.location = inherited.location || this._generateRandomLocation();
	this.color = inherited.color || this._generateRandomColor();

	this.reset();
}

Creature.prototype = {

	world: undefined,
	brain: undefined,
	graphics: undefined,
	radius: undefined,
	location: undefined,
	velocity: undefined,
	color: undefined,
	parts: undefined,

	tick: function()
	{
		if (this.subtractEnergy(0) <= 0) {
			return;
		}

		var that = this;

		// feed the neural network forward
		this.brain.activate();

		this.velocity.set(0, 0);

		let partsEnergySpent = 0;
		this.parts.forEach(part => {
			this.velocity.add(part.getThrustVector());
			partsEnergySpent += part.tick();
		});

		if (this.subtractEnergy(partsEnergySpent) <= 0) {
			return;
		}

		this.velocity.limit(Config.Creature.LinearMaxSpeed);
		this.location.add(this.velocity);

		if (this.location.x > this.world.width) {
			this.location.x = 0;
		} else if (this.location.x < 0) {
			this.location.x = this.world.width;
		}
		if (this.location.y > this.world.height) {
			this.location.y = 0;
		} else if (this.location.y < 0) {
			this.location.y = this.world.height;
		}

		// interact with the world and other creatures
		this.interact();

		// expend some energy just for existing
		this.subtractEnergy(this.parts.length * Config.Creature.Part.EnergyForExisting);

		// energy spent is the relative magnitude of the velocity multiplied by the energy per movement
		this.subtractEnergy((this.velocity.magnitude() / Config.Creature.LinearMaxSpeed) * Config.Creature.EnergyPerMovement);
	},

	interact: function()
	{
		this.parts.forEach(part => part.interact());
		this.brain.inputs[0].value = this.velocity.angle();
		this.brain.inputs[1].value = this.velocity.magnitude();
	},

	subtractEnergy: function(amount) {
		this.energy -= amount;
		if (this.energy <= 0) {
			this.energy = 0;
			this.velocity.set(0, 0);
			this.color = 'rgb(120, 120, 120)';
			return
		}

		return this.energy;
	},

	eatFood: function(foodId) {
		this.world.food[foodId].x = null; // invalidate
		this.energy += Config.Creature.EnergyPerFood;
	},

	clone: function()
	{
		let newBrain = this.brain.clone();
		let newParts = this.parts.map(part => part.clone());
		let creature = new Creature(this.world, newBrain, newParts, {
			color: this.color,
			radius: this.radius,
			location: new Vector(
				this.location.x + (Math.random() * Config.Creature.Part.MaxDistanceFromCreature * 4) - (Config.Creature.Part.MaxDistanceFromCreature * 2), 
				this.location.y + (Math.random() * Config.Creature.Part.MaxDistanceFromCreature * 4) - (Config.Creature.Part.MaxDistanceFromCreature * 2)
			),
		});
		creature.mutate();
		return creature;
	},

	mutate: function () {
		if (Math.random() < Config.Mutation.GlobalMutationRate) {
			// insane in the membrane
			this.brain.mutate();
		}
	},

	draw: function()
	{
		// draw parts
		for (let i = 0; i < this.parts.length; i++) {
			let partLocation = this.location.copy().add(this.parts[i].relativePosition);

			// draw part
			this.graphics.drawCircle(partLocation, this.parts[i].radius, {
				fillStyle: this.color,
				globalAlpha: .25,
				lineWidth: 1,
			});

			// draw line to part
			this.graphics.drawLine(this.location, partLocation, {
				lineWidth: 2,
				strokeStyle: this.color,
			});

			// draw line to nearest food
			if (this.parts[i].nearestFood.magnitude() < this.parts[i].scanRadius) {
				let absolutePosition = partLocation.copy().add(this.parts[i].nearestFood);
				this.graphics.drawLine(partLocation, absolutePosition, {
					lineWidth: 1,
					strokeStyle: 'rgba(150, 150, 150, .5)',
				});
			}
		}

		// draw pointer (to show what direction the creature is facing)
		let relativeTarget = this.velocity.copy().setMagnitude(this.radius + 5);
		let absoluteTarget = this.location.copy().add(relativeTarget);
		this.graphics.drawLine(this.location, absoluteTarget, {
			lineWidth: 6,
			strokeStyle: 'black',
		});
		this.graphics.drawLine(this.location, absoluteTarget, {
			lineWidth: 2,
			strokeStyle: 'white',
		});

		// draw self
		this.graphics.drawCircle(this.location, this.radius, {
			fillStyle: this.color,
			globalAlpha: 1,
			lineWidth: 1
		});

		// put energy amount on the creature
		this.graphics.drawText(Math.trunc((this.energy / Config.Creature.StartingEnergy) * 100), this.location, undefined, {
			font: 'bold 12px sans-serif',
			fillStyle: 'white',
			textAlign: 'center',
			textBaseline: 'middle',
		});
	},

	highlight: function()
	{
		// draw a semitransparent "halo" around the creature, to make it stand out
		this.graphics.drawCircle(this.location, Config.Creature.Part.MaxDistanceFromCreature + this.radius, {
			lineWidth: 1,
			fillStyle: this.color,
			globalAlpha: .2,
		})
	},

	fitness: function()
	{
		return this.energy;
	},

	reset: function()
	{
		this.energy = Config.Creature.StartingEnergy;
	},

	_generateParts: function (numParts) {
		let parts = [];
		for (let i = 0; i < numParts; i++) {
			parts.push(new Part());
		}

		return parts;
	},

	_generateRandomParts: function ()
	{
		return this._generateParts(1 + Math.floor(Math.random() * Config.Creature.MaxStartingParts));
	},

	_generateRandomColor: function ()
	{
		return 'rgb(' +
			Math.floor(Math.random() * 255) + ',' +
			Math.floor(Math.random() * 255) + ',' +
			Math.floor(Math.random() * 255) + ')';
	},

	_generateRandomLocation: function ()
	{
		return new Vector(
			Math.random() * this.world.width,
			Math.random() * this.world.height
		);
	},
}

module.exports = Creature;
