'use strict';

var World = require('./world');

var canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

new World(100, canvas).start();
