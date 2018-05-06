'use strict';

var Brain = require('./brain');
var Config = require('./config');
var Graphics = require('./graphics');
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

	this.sensors = [
		{ value: 0 }, // relative distance to nearest food
		{ value: 0 }, // relative angle of nearest food
	]

	this.muscles = [
		{ value: 0 }, // relative angle delta from creature
		{ value: 0 }, // relative length delta from creature
		{ value: 0 }, // relative radius delta
	];

	this.radius = Math.floor(Math.random() * Config.Creature.StartingRadius) + 3;
	this.scanRadius = Config.Creature.StartingScanRadius;
	this.nearestFood = new Vector(0, 0);
}

Part.prototype = {

	creature: undefined,
	relativePosition: undefined,
	sensors: undefined,
	muscles: undefined,
	radius: undefined,
	scanRadius: undefined,
	nearestFood: undefined,

	clone: function (creature) {
		return new Part(creature, {
			relativePosition: this.relativePosition.copy(),
		});
	},

	tick: function () {
		let muscleIndex = 0;
		let ds = this.muscles[muscleIndex++].value * Config.Creature.PartMaxContractionSpeed;
		let da = this.muscles[muscleIndex++].value * Config.Creature.PartAngularMaxSpeed;
		let dr = this.muscles[muscleIndex++].value * Config.Creature.MaxRadialChange;

		this.relativePosition.setMagnitude(this.relativePosition.magnitude() + ds).limit(Config.Creature.PartDistance);

		// limit rotation by torque
		let resistenceTorque = (this.radius / Config.Creature.StartingRadius) * (this.relativePosition.magnitude() / Config.Creature.PartDistance);
		this.relativePosition.rotate((1 - resistenceTorque) * da);
		
		this.radius = Math.max(3, Math.min(Config.Creature.StartingRadius, this.radius + dr));
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
	}
}

function Creature(world, specifics)
{
	var that = this;
	specifics = specifics || {};

	this.world = world;
	this.graphics = this.world.graphics;
	this.radius = Config.Creature.StartingRadius;
	this.velocity = new Vector(0, 0).random();
	this.location = new Vector(
		Math.random() * (this.world.width - 100) + 50,
		Math.random() * (this.world.height - 100) + 50
	);

	if (specifics.parts !== undefined) {
		this.parts = specifics.parts;
	}
	else {
		// random parts
		this.parts = [];
		let numParts = 1 + Math.floor(Math.random() * Config.Creature.MaxStartingParts);
		for (let i = 0; i < numParts; i++) {
			this.parts.push(new Part(this));
		}
	}

	if (specifics.brain !== undefined) {
		this.brain = specifics.brain;
	}
	else {
		// create a random brain based on the sensors and muscles from all parts
		let allSensors = [];
		let allMuscles = [];
		this.parts.forEach(part => {
			part.sensors.forEach(sensor => allSensors.push(sensor));
			part.muscles.forEach(sensor => allMuscles.push(sensor));
		});
		this.brain = new Brain(allSensors, allMuscles);
	}

	this.color = specifics.color || 'rgb(' +
		Math.floor(Math.random() * 255) + ',' +
		Math.floor(Math.random() * 255) + ',' +
		Math.floor(Math.random() * 255) + ')';

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

		let totalWeight = 0;
		this.velocity.set(0, 0);
		this.parts.forEach(part => {
			part.tick();
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
		var creature = new Creature(this.world, {
			brain: this.brain.clone(),
			color: this.color,
			parts: [],
		});

		creature.parts = this.parts.map(part => part.clone(creature));
		
		// mutations
		if (Math.random() < Config.Mutation.GlobalMutationRate) {
			
			// insane in the membrane
			this.brain.mutate();

			// part generation
			if (Math.random() < Config.ChanceOf.PartGeneration) {
				creature.addPart(new Part(creature));
			}
		}

		return creature;
	},

	draw: function()
	{
		// draw parts
		let parts = this.parts;
		for (let i = 0; i < parts.length; i++) {
			let partLocation = this.location.copy().add(parts[i].relativePosition);

			// draw part
			this.graphics.drawCircle(partLocation, parts[i].radius, {
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

	addPart: function (part) {
		var that = this;
		this.parts.push(part);
		part.sensors.forEach(sensor => {
			that.brain.addSensor(sensor);
		});
		part.muscles.forEach(muscle => {
			that.brain.addMuscle(muscle);
		});
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
