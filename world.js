'use strict';

var Creature = require('./creature');
var Graphics = require('./graphics');
var Vector = require('./vector');

function World(numCreatures, canvas) {
	var that = this;

	this.width = canvas.width;
	this.height = canvas.height;
	this.graphics = new Graphics(canvas.getContext('2d'), this.width, this.height);

	// configuration (this should be externalized at some point...)
	this.maxCreatures = numCreatures;
	this.tickIntervalInMs = 10;
	this.generationLengthInSec = 5;

	// populate
	this.creatures = [];
	for (var i = 0; i < numCreatures; i++) {
		this.creatures[i] = new Creature(that);
	}

	this.foodDensity = .001;
	this.food = [];
	for (var i = 0; i < (this.width * this.height * this.foodDensity); i++) {
		this.food.push(null);
	}

	this.generation = 1;
	this.era = 1;
	this.numSpecies = numCreatures;
	this.ticks = 1;
	this.ticksPerGeneration = this.generationLengthInSec * 1000 / this.tickIntervalInMs;

	var loop = function () {

		that.graphics.drawBackground();
		populateFood();
		updateCreatures();

		that.ticks++;
		if (that.ticks % that.ticksPerGeneration === 0) {
			newGeneration();
		}

		that.graphics.drawOverlay(
			'Era: ' + that.era + '   ' +
			'Generation: ' + that.generation + '   ' +
			'Creatures: ' + that.creatures.length + '   ' +
			'Species: ' + that.numSpecies);
	}

	var populateFood = function () {
		for (var i = 0; i < that.food.length; i++) {
			if (that.food[i] === null) {
				that.food[i] = new Vector(null, null);
			}

			if (that.food[i].x === null || that.food[i].y === null) {
				that.food[i].x = Math.random() * (that.width - 100) + 50;
				that.food[i].y = Math.random() * (that.height - 100) + 50;
			}

			that.graphics.drawCircle(that.food[i], 3, {
				fillStyle: '#DDDDDD',
			});
		}
	}

	var updateCreatures = function () {
		that.creatures.forEach(function (creature) {
			creature.tick();
			creature.draw();
		});

		that.creatures[0].highlight();
	}

	var newGeneration = function () {
		console.log("new generation");
		that.generation++;

		// sort creatures by fitness
		var newCreatures = that.creatures.sort(function (a, b) {
			return b.fitness() - a.fitness();
		});

		// remove unfit
		var numUnfitRemoved = 0;
		while (newCreatures.length > that.maxCreatures / 2) {
			newCreatures.pop();
			++numUnfitRemoved;
		}
		console.log("Removed " + numUnfitRemoved + " unfit creatures");

		// reproduce
		var numToClone = newCreatures.length;
		for (var i = 0; i < numToClone; i++) {
			newCreatures.push(newCreatures[i].clone());
		}
		console.log(numToClone + " creatures reproduced");

		// collect stats
		var colors = {};
		for (var i = 0; i < newCreatures.length; i++) {
			colors[newCreatures[i].color] = colors[newCreatures[i].color] ? colors[newCreatures[i].color]++ : 1;
		}

		that.numSpecies = Object.keys(colors).length;
		if (that.numSpecies == 1) {
			that.era++;

			// randomize colors
			for (var i = 0; i < newCreatures.length; i++) {
				newCreatures[i].color = 'rgb(' +
					Math.floor(Math.random() * 255) + ',' +
					Math.floor(Math.random() * 255) + ',' +
					Math.floor(Math.random() * 255) + ')';
			}

			that.numSpecies = newCreatures.length;
		}

		// reset
		newCreatures.forEach(function (creature) {
			creature.reset();
		});

		that.creatures = newCreatures;
		that.ticks = 1;
	}

	this.start = function() {

		setInterval(loop, that.tickIntervalInMs);
	}
}

module.exports = World;
