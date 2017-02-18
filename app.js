function start(numCreatures)
{
	var synaptic = require('synaptic');

	var world = new World(window.innerWidth, window.innerHeight, document.getElementById('canvas'));

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

		var network = new synaptic.Architect.Perceptron(8, 20, 3);
		network.neurons().forEach(function (neuron) {
			if (neuron.layer === 'output') {
				neuron.neuron.squash = synaptic.Neuron.squash.TANH;
			}
			else {
				neuron.neuron.squash = squashingFunctions[Math.floor(Math.random() * squashingFunctions.length)];
			}
		});

		world.creatures[i] = new Creature(network, world, x, y);
		world.creatures[i].velocity.random();
	}

	// blastoff
	world.start();
};

start(50);
