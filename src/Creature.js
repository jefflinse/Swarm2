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
		{ value: 0 },  // creature's relative energy level
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
	this.color = inherited.color ? this._copyColor(inherited.color) : this._generateRandomColor();

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
	ticks: 0,
	foodEaten: 0,

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

		if (this.energy > Config.Creature.StartingEnergy * Config.Creature.ReproductionEnergyThreshold) {
			this.energy -= Config.Creature.StartingEnergy;
			let clone = this.clone(true);
			clone.reset();
			this.world.creatures.push(clone);
		}

		this.ticks++;
	},

	interact: function()
	{
		this.parts.forEach(part => part.interact());
		this.brain.inputs[0].value = this.energy / Config.Creature.StartingEnergy;
		this.brain.inputs[1].value = this.velocity.angle();
		this.brain.inputs[2].value = this.velocity.magnitude();
	},

	subtractEnergy: function(amount) {
		this.energy -= amount;
		if (this.energy <= 0) {
			this.die();
			return
		}

		return this.energy;
	},

	die: function()
	{
		this.energy = 0;
		this.velocity.set(0, 0);
		this.color = [120, 120, 120];
		this.world.creatures = this.world.creatures.filter(creature => creature !== this);
		if (this.world.creatures.length < Config.World.MaxCreatures && this.foodEaten < 5) {
			const replacement = new Creature(this.world);
			replacement.reset();
			this.world.creatures.push(replacement);
		}
	},

	eatFood: function(foodId) {
		this.world.food[foodId].x = null; // invalidate
		this.energy += Config.Creature.EnergyPerFood;
		this.foodEaten++;
	},

	clone: function(shouldMutate = false, nearby = true)
	{
		let newBrain = this.brain.clone();
		let newParts = this.parts.map(part => part.clone());
		let creature = new Creature(this.world, newBrain, newParts, {
			color: this._copyColor(this.color),
			radius: this.radius,
			location: nearby ? new Vector(
				this.location.x + (Math.random() * Config.Creature.Part.MaxDistanceFromCreature * 4) - (Config.Creature.Part.MaxDistanceFromCreature * 2), 
				this.location.y + (Math.random() * Config.Creature.Part.MaxDistanceFromCreature * 4) - (Config.Creature.Part.MaxDistanceFromCreature * 2)
			) : this.location.copy(),
		});
		
		if (shouldMutate && creature.mutate()) {
			creature.color = this._generateDriftColor(this.color);
		}

		return creature;
	},

	mutate: function () {
		let mutated = false;

		// if (Math.random() < Config.ChanceOf.NewPartGrowth) {
		// 	// grow a new part
		// 	let part = new Part();
		// 	part.creature = this;
		// 	part.relativePosition = this.velocity.copy().setMagnitude(this.radius + part.radius);
		// 	part.scanRadius = part.radius / Config.Creature.Part.MaxRadius * Config.Creature.StartingScanRadius;
		// 	this.parts.push(part);
		// 	console.log("grew new part");
		// 	mutated = true;
		// }

		if (Math.random() < Config.Mutation.GlobalMutationRate) {
			// insane in the membrane
			this.brain.mutate();
			// console.log("mutated brain");
			mutated = true;
		}

		return mutated;
	},

	draw: function()
	{
		// drop shadow
		this.graphics.drawCircle(this.location.copy().add(new Vector(3, 3)), this.radius, {
			fillStyle: 'rgb(0, 0, 0)',
			globalAlpha: 1,
			lineWidth: 1
		});
		
		// draw parts
		for (let i = 0; i < this.parts.length; i++) {
			let partLocation = this.location.copy().add(this.parts[i].relativePosition);

			// draw part
			this.graphics.drawCircle(partLocation, this.parts[i].radius, {
				fillStyle: 'rgb(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ')',
				globalAlpha: .25,
				lineWidth: 1,
			});

			// draw line to part
			this.graphics.drawLine(this.location, partLocation, {
				lineWidth: 2,
				strokeStyle: 'rgb(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ')',
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
			fillStyle: 'rgb(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ')',
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
			fillStyle: 'rgb(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ')',
			globalAlpha: .2,
		})

		// show the count of food eaten at the top center of the shadow
		this.graphics.drawText(this.foodEaten, this.location.copy().add(new Vector(0, -Config.Creature.Part.MaxDistanceFromCreature)), undefined, {
			font: 'bold 12px sans-serif',
			fillStyle: 'white',
			textAlign: 'center',
			textBaseline: 'middle',
		});
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
		return [
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
		];
	},

	_generateDriftColor: function (source)
	{
		return [
			Math.min(Math.max(0, source[0] + Math.floor(Math.random() * 70) - 35), 255),
			Math.min(Math.max(0, source[1] + Math.floor(Math.random() * 70) - 35), 255),
			Math.min(Math.max(0, source[2] + Math.floor(Math.random() * 70) - 35), 255),
		];
	},

	_copyColor: function (source)
	{
		return [
			source[0],
			source[1],
			source[2],
		];
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
