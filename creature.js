'use strict';

var Brain = require('./brain');
var Config = require('./config');
var Debug = require('./debug');
var Graphics = require('./graphics');
var Vector =require('./vector');

function Part() {
	this.relativePosition =  this._generateRelativePosition();
	this.sensors = this._generateDefaultSensors();
	this.muscles = this._generateDefaultMuscles();
	this.radius = Math.floor(Math.random() * Config.Creature.StartingRadius) + 3;
	this.scanRadius = Config.Creature.StartingScanRadius;
	this.nearestFood = new Vector(0, 0).setMagnitude(Config.Creature.StartingScanRadius);
}

Part.prototype = {

	creature: undefined,
	relativePosition: undefined,
	sensors: undefined,
	muscles: undefined,
	radius: undefined,
	scanRadius: undefined,
	nearestFood: undefined,

	clone: function () {
		return new Part();
	},

	tick: function () {
		let muscleIndex = 0;
		let ds = this.muscles[muscleIndex++].value;
		let da = this.muscles[muscleIndex++].value;
		let dr = this.muscles[muscleIndex++].value;

		this.relativePosition.setMagnitude(ds * Config.Creature.PartDistance);
		this.relativePosition.setAngle(this.relativePosition.a);
		this.radius = Math.abs(dr * Config.Creature.StartingRadius);
	},

	interact: function () {
		
		this.nearestFood.set(0, 0);
		var distanceToNearestFood = this.scanRadius + 1;
		let absolutePosition = this.creature.location.copy().add(this.relativePosition);

		// eat
		for (var i in this.creature.world.food) {
			if (this.creature.world.food[i].x !== null) {
				let distanceToFood = absolutePosition.distanceBetween(this.creature.world.food[i]);
				if (this.radius > Config.Creature.MinPartRadiusForConsumption && distanceToFood <= this.radius) {
					this.creature.eatFood(i);
				}
				else if (distanceToFood <= distanceToNearestFood) {
					this.nearestFood = this.creature.world.food[i].copy().subtract(this.creature.location);
					distanceToNearestFood = distanceToFood;
				}
			}
		}

		this.sensors[0].value = this.nearestFood.magnitude();
		this.sensors[1].value = this.nearestFood.angle();
	},

	_generateDefaultSensors: function ()
	{
		return [
			{ value: 0 }, // relative distance to nearest food
			{ value: 0 }, // relative angle of nearest food
		];
	},

	_generateDefaultMuscles: function ()
	{
		return [
			{ value: 0 }, // relative angle delta from creature
			{ value: 0 }, // relative length delta from creature
			{ value: 0 }, // relative radius delta
		];
	},

	_generateRelativePosition: function ()
	{
		return new Vector(1, 1)
			.setMagnitude(Config.Creature.PartDistance)
			.setAngle(Math.random() * Math.PI * 2);
	},
}

function Creature(world, brain, numParts)
{
	var that = this;

	this.world = world;
	this.graphics = this.world.graphics;

	this.parts = [];
	if (brain !== undefined && numParts !== undefined) {
		this.brain = brain;
		this._generateParts(numParts)
	}
	else {
		this.brain = new Brain();
		this._generateRandomParts();
	}

	this.radius = Config.Creature.StartingRadius;
	this.velocity = new Vector(0, 0).random();
	this.location = this._generateRandomLocation();
	this.color = this._generateRandomColor();

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
		var that = this;

		// feed the neural network forward
		this.brain.activate();
		this.velocity.set(1, 1);
		let totalWeight = 0;
		this.parts.forEach(part => {
			part.tick();
			let velocityComponent = part.relativePosition.copy().invert();
			if (that.velocity === null) {
				that.velocity = velocityComponent;
			}
			else {
				that.velocity.add(velocityComponent);
			}
			that.velocity.add(part.relativePosition.copy().invert());
			totalWeight += part.radius;
		});

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
		this.parts.forEach(part => part.interact());
	},

	eatFood: function(foodId) {
		this.world.food[foodId].x = null; // invalidate
		this.foodEaten++;
	},

	clone: function()
	{
		var creature = new Creature(this.world, this.brain.clone(), this.parts.length);
		creature.mutate();
		return creature;
	},

	mutate: function () {
		if (Math.random() < Config.Mutation.GlobalMutationRate) {

			// insane in the membrane
			this.brain.mutate();

			// part generation
			if (Math.random() < Config.ChanceOf.PartGeneration) {
				let newPart = new Part();
				newPart.creature = this;
				this.addPart(newPart);
			}
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
				globalAlpha: .30,
				lineWidth: 1,
			});

			// draw line to part
			this.graphics.drawLine(this.location, partLocation, {
				lineWidth: 2,
				strokeStyle: this.color,
			});

			// draw line to nearest food
			// if (parts[i].nearestFood.magnitude() < parts[i].scanRadius) {
			// 	let absolutePosition = partLocation.copy().add(parts[i].nearestFood);
			// 	this.graphics.drawLine(partLocation, absolutePosition, {
			// 		lineWidth: 1,
			// 		strokeStyle: 'rgba(150, 150, 150, .5)',
			// 	});
			// }
		}

		// // draw pointer (to show what direction the creature is facing)
		// let relativeTarget = this.velocity.copy().setMagnitude(this.radius + 3);
		// let absoluteTarget = this.location.copy().add(relativeTarget);
		// this.graphics.drawLine(this.location, absoluteTarget, {
		// 	lineWidth: 3,
		// 	strokeStyle: 'black',
		// });

		// draw shadow
		this.graphics.drawCircle(this.location.copy().add(new Vector(3, 3)), this.radius, {
			fillStyle: 'rgb(0, 0, 0)',
			globalAlpha: .2,
			lineWidth: 1
		});

		// draw self
		this.graphics.drawCircle(this.location, this.radius, {
			fillStyle: this.color,
			globalAlpha: 1,
			lineWidth: 1
		});
	},

	highlight: function()
	{
		// draw a semitransparent "halo" around the creature, to make it stand out
		this.graphics.drawCircle(this.location, Config.Creature.PartDistance + (this.radius / 2), {
			lineWidth: 1,
			fillStyle: this.color,
			globalAlpha: .2,
		})
	},

	addPart: function () {
		var that = this;

		let part = new Part();
		part.creature = this;
		part.sensors.forEach(sensor => {
			that.brain.addSensor(sensor);
		});
		part.muscles.forEach(muscle => {
			that.brain.addMuscle(muscle);
		});

		this.parts.push(part);
	},

	fitness: function()
	{
		return this.foodEaten;
	},

	reset: function()
	{
		this.foodEaten = 0;
	},

	_generateParts: function (numParts) {
		for (let i = 0; i < numParts; i++) {
			this.addPart();
		}
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
			Math.random() * (this.world.width - 100) + 50,
			Math.random() * (this.world.height - 100) + 50
		);
	},
}

module.exports = Creature;
