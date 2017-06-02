function World(numCreatures, canvas, synaptic) {
	var that = this;

	this.width = canvas.width;
	this.height = canvas.height;
	this.ctx = canvas.getContext('2d');
	this.maxCreatures = numCreatures;

	// populate
	this.creatures = function (numCreatures, synaptic) {

		var squashingFunctions = [
			synaptic.Neuron.squash.LOGISTIC,
			synaptic.Neuron.squash.TANH,
			synaptic.Neuron.squash.HLIM,
			synaptic.Neuron.squash.IDENTITY
		];

		var creatures = [];

		for (var i = 0; i < numCreatures; i++) {

			var x = Math.random() * (that.width - 100) + 50;
			var y = Math.random() * (that.height - 100) + 50;

			var network = new synaptic.Architect.Perceptron(5, 10, 15, 10, 2);

			// randomize the activation functions
			network.neurons().forEach(function (neuron) {
				if (neuron.layer === 'output') {
					neuron.neuron.squash = synaptic.Neuron.squash.TANH;
				}
				else {
					neuron.neuron.squash = squashingFunctions[Math.floor(Math.random() * squashingFunctions.length)];
				}
			});

			creatures[i] = new Creature(network, that, x, y);
			creatures[i].velocity.random();
		}

		return creatures;

	}(numCreatures, synaptic);

	this.foodDensity = .001;
	this.food = [];
	for (var i = 0; i < (this.width * this.height * this.foodDensity); i++) {
		this.food.push(null);
	}

	this.generation = 1;
	this.era = 1;
	that.mostFit = 0;
	that.averageFoodCollected = 0;
	this.numSpecies = numCreatures;
	this.ticks = 1;

	this.overlay = new Overlay(this);

	var loop = function () {

		applyFadeEffect();

		// add food
		for (var i = 0; i < that.food.length; i++) {
			if (that.food[i] === null) {
				that.food[i] = new Vector(null, null);
			}

			if (that.food[i].x === null || that.food[i].y === null) {
				var x = Math.random() * (that.width - 100) + 50;
				var y = Math.random() * (that.height - 100) + 50;
				while (x > (that.width / 2) - (that.width / 6) && x < (that.width / 2) + (that.width / 6) &&
					y > (that.height / 2) - (that.height / 6) && y < (that.height / 2) + (that.height / 6)) {
					x = Math.random() * (that.width - 100) + 50;
					y = Math.random() * (that.height - 100) + 50;
				}
				that.food[i].x = x;
				that.food[i].y = y;
			}

			that.ctx.beginPath();
			that.ctx.fillStyle = '#DDDDDD';
			that.ctx.arc(that.food[i].x, that.food[i].y, 3, 0, 2 * Math.PI);
			that.ctx.fill();
		}

		// update each creature
		that.creatures.forEach(function (creature) {
			creature.tick();
			creature.draw();
		});

		that.ticks++;

		if (that.ticks % 300 == 0) {

			console.log("new generation");
			that.generation++;

			// remove dead creatures and sort remaining by fitness
			var newCreatures = that.creatures.filter(function (creature) {
				return creature.isAlive();
			}).sort(function (a, b) {
				return b.fitness() - a.fitness();
			});
			console.log("Removed " + (that.creatures.length - newCreatures.length) + " dead creatures");

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

				that.numSpecies = that.numCreatures;
			}

			// reset
			newCreatures.forEach(function (creature) {
				creature.reset();
			});

			that.creatures = newCreatures;
		}

		that.overlay.draw();
		
		setTimeout(loop, 10);
	}

	var applyFadeEffect = function () {
		//that.ctx.globalAlpha = 0.2;
		that.ctx.fillStyle = '#f4f4f4';
		that.ctx.fillRect(0, 0, that.width, that.height);
		//that.ctx.globalAlpha = 1;
	}

	this.start = function() {

		return loop();
	}
}
