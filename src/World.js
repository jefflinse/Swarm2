'use strict';

var Config = require('./Config');
var Creature = require('./Creature');
var Graphics = require('./Graphics');
var Vector = require('./Vector');

function World(canvas) {
	var that = this;

	this.width = canvas.width;
	this.height = canvas.height;
	this.graphics = new Graphics(canvas.getContext('2d'), this.width, this.height);

	// populate
	this.creatures = [];
	for (var i = 0; i < Config.World.MaxCreatures; i++) {
		this.creatures[i] = new Creature(that);
	}

	this.food = [];
	for (var i = 0; i < (this.width * this.height * Config.World.FoodDensity); i++) {
		this.food.push(null);
	}

	this.generation = 1;
	this.era = 1;
	this.numSpecies = this.creatures.length;
	this.ticks = 1;
	this.ticksPerGeneration = Config.World.GenerationLengthInSec * 1000 / Config.World.TickIntervalInMs;

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
				that.food[i].x = Math.random() * that.width;
				that.food[i].y = Math.random() * that.height;
			}

			that.graphics.drawCircle(that.food[i], 3, {
				fillStyle: '#DDDDDD',
			});
		}
	}

	var updateCreatures = function () {
		that.creatures.forEach(creature => {
			creature.tick();
			creature.draw();
		});

		// that.creatures[0].highlight();
	}

	var newGeneration = function () {
		console.log("new generation");
		that.generation++;

		// collect stats
		var colors = {};
		for (var i = 0; i < that.creatures.length; i++) {
			colors[that.creatures[i].color] = colors[that.creatures[i].color] ? colors[that.creatures[i].color]++ : 1;
		}

		that.numSpecies = Object.keys(colors).length;
		if (that.numSpecies == 1) {
			that.era++;
		}

		// // reset
		// newCreatures.forEach((creature) => {
		// 	creature.reset();
		// });

		// that.creatures = newCreatures;
		that.ticks = 1;
	}

	this.start = function() {

		setInterval(loop, Config.TickIntervalInMs);
	}
}

module.exports = World;
