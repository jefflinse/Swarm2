function World(numCreatures, canvas, synaptic) {
	var that = this;

	this.width = canvas.width;
	this.height = canvas.height;
	this.ctx = canvas.getContext('2d');

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

			var network = new synaptic.Architect.Perceptron(4, 5, 5, 5, 2);

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

	this.food = [];
	for (var i = 0; i < 2000; i++) {
		this.food.push(null);
	}

	this.generation = 1;
	this.epoch = 1;
	this.ticks = 1;

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

			// sort by fitness
			that.creatures.sort(function (a, b) {
				return b.fitness() - a.fitness();
			});

			var totalFoodCollected = 0;
			var colors = {};
			for (var i = 0; i < that.creatures.length; i++) {
				totalFoodCollected += that.creatures[i].foodEaten;
				colors[that.creatures[i].color] = colors[that.creatures[i].color] ? colors[that.creatures[i].color]++ : 1;
			}

			console.log("most fit: " + that.creatures[0].fitness());
			console.log("average food collected: " + (totalFoodCollected / that.creatures.length));

			var halfLength = that.creatures.length / 2;
			for (var i = 0; i < halfLength; i++) {
				that.creatures[i + halfLength] = that.creatures[i].clone();
			}

			if (Object.keys(colors).length == 1) {
				console.log("NEW EPOCH! randomizing colors");
				that.epoch++;

				// randomize colors
				for (var i = 0; i < that.creatures.length; i++) {
					that.creatures[i].color = 'rgb(' +
						Math.floor(Math.random() * 255) + ',' +
						Math.floor(Math.random() * 255) + ',' +
						Math.floor(Math.random() * 255) + ')';
				}
			}
		}

		// draw some info
		that.ctx.font = '16px sans-serif';
		that.ctx.fillStyle = 'black';

		that.ctx.fillText(
			'Epoch: ' + that.epoch + '   ' +
			'Generation: ' + that.generation,
			10, 20);
		
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
