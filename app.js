function start(numCreatures)
{
	var synaptic = require('synaptic');

	var canvas = document.getElementById('canvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var world = new World(numCreatures, canvas);

	var squashingFunctions = [
		synaptic.Neuron.squash.LOGISTIC,
		synaptic.Neuron.squash.TANH,
		synaptic.Neuron.squash.HLIM
	];

	// populate creatures
	for (var i = 0; i < numCreatures; i++)
	{
		var x = Math.random() * world.width;
		var y = Math.random() * world.height;

		var network = new synaptic.Architect.Perceptron(5, 20, 3);
		network.neurons().forEach(function (neuron) {
			if (neuron.layer === 'output') {
				neuron.neuron.squash = synaptic.Neuron.squash.TANH;
			}
			else {
				neuron.neuron.squash = squashingFunctions[Math.floor(Math.random() * squashingFunctions.length)];
			}
		});

		world.creatures.alive[i] = new Creature(network, world, x, y);
		world.creatures.alive[i].velocity.random();
	}

	// blastoff
	world.start();
};

start(50);
