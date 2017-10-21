'use strict';

var World = require('./world');

function start(numCreatures)
{
	var canvas = document.getElementById('canvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var world = new World(numCreatures, canvas);
	world.start();
};

start(100);
