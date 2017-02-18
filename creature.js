function Creature(network, world, x, y)
{
	this.network = network;
	this.world = world;
	this.energy = 1.0;

	this.radius = 5;
	this.maxspeed = 2;
	this.seekDistance = 100;
	this.sensors = [
		new Vector(0, 0),
		new Vector(0, 0),
		new Vector(0, 0),
		new Vector(0, 0),
		new Vector(0, 0)
	];

	this.location = new Vector(x, y);
	this.velocity = new Vector(0, 0);
	this.acceleration = new Vector(0, 0);
	
	this.color = 'rgb(' +
		Math.floor(Math.random() * 255) + ',' +
		Math.floor(Math.random() * 255) + ',' +
		Math.floor(Math.random() * 255) + ')';
}

Creature.prototype = {

	tick: function()
	{
		// assign all input values
		var inputs = [];
		inputs.push(this.location.x);
		inputs.push(this.location.y);
		inputs.push(this.velocity.x);
		inputs.push(this.velocity.y);
		inputs.push(this.sensors[0].angle());
		inputs.push(this.sensors[0].magnitude());
		inputs.push(this.sensors[1].angle());
		inputs.push(this.sensors[1].magnitude());
		inputs.push(this.sensors[2].angle());
		inputs.push(this.sensors[2].magnitude());
		inputs.push(this.sensors[3].angle());
		inputs.push(this.sensors[3].magnitude());
		inputs.push(this.sensors[4].angle());
		inputs.push(this.sensors[4].magnitude());
		inputs.push(this.energy);

		// feed the neural network forward
		var outputs = this.network.activate(inputs);
		this.processOutputs(outputs);

		// move based on neural network outputs
		this.velocity.add(this.acceleration);
		this.velocity.limit(this.maxspeed);
		this.location.add(this.velocity);
		this.acceleration.multiply(0);
		this.adjustEnergyBy(-.001);

		// interact with the world and other creatures
		this.interact();
	},

	processOutputs: function(networkOutput)
	{
		// first two network outputs are used for the x and y coordinates of the target location
		var target = new Vector(networkOutput[0] * this.world.width, networkOutput[1] * this.world.height);
		this.applyForce(target);
	},

	interact: function()
	{
		var sensorIndex = 0;

		// detect edges and other creatures
		for (var i in this.world.creatures.alive) {
			var creature = this.world.creatures.alive[i];
			if (creature !== this) {

				let target = creature.location.copy().subtract(this.location);
				if (sensorIndex < this.sensors.length && target.magnitude() <= this.seekDistance) {
					this.sensors[sensorIndex] = target;
					sensorIndex++;
				}

				// collision with another creature
				if (this.location.distanceBetween(creature.location) < this.radius + creature.radius) {
					this.adjustEnergyBy(-.5);
				}
			}
		}

		while (sensorIndex < this.sensors.length) {
			this.sensors[sensorIndex].set(0, 0);
			sensorIndex++;
		}

		// enforce boundaries (kill if hitting an edge)
		if (this.location.x < this.radius ||
			this.location.x > this.world.width - this.radius ||
			this.location.y < this.radius ||
			this.location.y > this.world.height - this.radius
			) {
			this.kill();
		}
	},

	clone: function()
	{
		var x = Math.random() * this.world.width;
		var y = Math.random() * this.world.height;
		var creature = new Creature(this.network.clone(), this.world, x, y);
		
		var neurons = creature.network.neurons();
		for (var i in neurons) {
			var neuron = neurons[i].neuron;
			for (var j in neuron.connections.projected) {
				var connection = neuron.connections.projected[j];
				if (Math.random() < .5) {
					connection.weight += (Math.random() * .1) - .05;
				}
			}
		}

		creature.velocity.random();
		creature.color = this.color;

		return creature;
	},

	adjustEnergyBy: function (delta) {
		this.energy += delta;
		if (this.energy < 0) {
			this.energy = 0;
		}
		else if (this.energy > 1) {
			this.energy = 1;
		}
	},

	kill: function () {
		this.energy = 0;
	},

	isDead: function () {
		return this.energy === 0;
	},

	draw: function()
	{
		var gradient = this.world.ctx.createRadialGradient(
			this.location.x, 
			this.location.y, 
			Math.sqrt(this.radius), 
			this.location.x, 
			this.location.y, 
			this.radius);

		gradient.addColorStop(0, this.color);
		gradient.addColorStop(1, 'black');
		this.world.ctx.lineWidth = 1;
		this.world.ctx.beginPath();
		this.world.ctx.fillStyle = gradient;
		this.world.ctx.arc(this.location.x, this.location.y, this.radius, 0, 2 * Math.PI);
		this.world.ctx.fill();

		// sensors
		this.world.ctx.lineWidth = .5;
		for (var i in this.sensors) {
			if (this.sensors[i].x !== 0 && this.sensors[i].y !== 0) {
				this.world.ctx.beginPath();
				this.world.ctx.strokeStyle = 'red';
				this.world.ctx.moveTo(this.location.x, this.location.y);
				let absolute = this.location.copy().add(this.sensors[i]);
				this.world.ctx.lineTo(absolute.x, absolute.y);
				this.world.ctx.stroke();
			}
		}
	},

	applyForce: function(force)
	{
		this.acceleration.add(force);
	},

	fitness: function()
	{
		return this.energy;
	}
}
