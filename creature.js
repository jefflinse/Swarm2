'use strict';

var Brain = require('./brain');
var Config = require('./config');
var Debug = require('./debug');
var Graphics = require('./graphics');
var Vector =require('./vector');

function Part() {
	this.relativePosition =  this._generateRelativePosition();
	this.inputs = this._generateDefaultInputs();
	this.outputs = this._generateDefaultOutputs();
	this.radius = Math.floor(Math.random() * Config.Creature.StartingRadius) + 3;
	this.scanRadius = Config.Creature.StartingScanRadius;
	this.nearestFood = new Vector(0, 0).setMagnitude(Config.Creature.StartingScanRadius);
}

Part.prototype = {

	creature: undefined,
	relativePosition: undefined,
	inputs: undefined,
	outputs: undefined,
	radius: undefined,
	scanRadius: undefined,
	nearestFood: undefined,

	clone: function () {
		return new Part();
	},

	tick: function () {
		let inputIndex = 0;
		let ds = this.inputs[inputIndex++].value;
		let da = this.inputs[inputIndex++].value;
		let dr = this.inputs[inputIndex++].value;

		Debug.assert(ds !== NaN, "ds is NaN");
		Debug.assert(da !== NaN, "da is NaN");
		Debug.assert(dr !== NaN, "dr is NaN");

		// part distance from creature
		let newDistance = this.relativePosition.magnitude() + (ds * Config.Creature.PartDistance);
		this.relativePosition.setMagnitude(newDistance).limit(Config.Creature.PartDistance);

		// part angle from creature
		let newAngle = (this.relativePosition.angle() + (da * Config.Creature.PartAngularMaxSpeed)) % (Math.PI * 2);
		this.relativePosition.setAngle(newAngle);

		// part radius
		let newRadius = Math.min(Config.Creature.StartingRadius, this.radius + (dr * Config.Creature.MaxRadialChange));
		this.radius = Math.abs(newRadius);
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

		this.outputs[0].value = this.nearestFood.magnitude();
		this.outputs[1].value = this.nearestFood.angle();
	},

	_generateDefaultInputs: function ()
	{
		return [
			{ value: 0 }, // relative angle delta from creature
			{ value: 0 }, // relative length delta from creature
			{ value: 0 }, // relative radius delta
		];
	},

	_generateDefaultOutputs: function () {
		return [
			{ value: 0 }, // relative distance to nearest food
			{ value: 0 }, // relative angle of nearest food
		];
	},

	_generateRelativePosition: function ()
	{
		return new Vector(1, 1)
			.setMagnitude(Config.Creature.PartDistance)
			.setAngle(Math.random() * Math.PI * 2);
	},
}

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
	let inputs = [], outputs = [];
	this.parts.forEach(part => {
		inputs = inputs.concat(part.inputs);
		outputs = outputs.concat(part.outputs);
	});

	// part outputs are brain inputs, and vice-versa
	this.brain.connect(outputs, inputs)

	this.radius = inherited.radius || Config.Creature.StartingRadius;
	this.velocity = new Vector(0, 0).random();
	this.location = this._generateRandomLocation();
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
		var that = this;

		// feed the neural network forward
		this.brain.activate();

		this.parts.forEach(part => {
			part.tick();
			let velocityComponent = part.relativePosition
				.copy()
				.invert();
			that.velocity.add(velocityComponent);
		});

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
		let newBrain = this.brain.clone();
		let newParts = this.parts.map(part => part.clone());
		let creature = new Creature(this.world, newBrain, newParts, {
			color: this.color,
			radius: this.radius,
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

	fitness: function()
	{
		return this.foodEaten;
	},

	reset: function()
	{
		this.foodEaten = 0;
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
			Math.random() * (this.world.width - 100) + 50,
			Math.random() * (this.world.height - 100) + 50
		);
	},
}

module.exports = Creature;
