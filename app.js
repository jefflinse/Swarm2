function start(numCreatures)
{
	var synaptic = require('synaptic');

	var canvas = document.getElementById('canvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var world = new World(numCreatures, canvas, synaptic);
	world.start();
};

start(200);
