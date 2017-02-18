function Creature(network, world, x, y)
{
	this.energy = 1.0;
	this.radius = 5;
	this.innerRadius = 50;
	this.network = network;
	this.world = world;
	this.fitness = .5;
	this.mass = .3;
	this.maxspeed = 2;
	this.location = new Vector(x, y);
	this.velocity = new Vector(0, 0);
	this.acceleration = new Vector(0, 0);
	this.repulsionScalar = 50;
	this.color = function () {
		return 'rgb(' +
			Math.floor(Math.random() * 255) + ',' +
			Math.floor(Math.random() * 255) + ',' +
			Math.floor(Math.random() * 255) + ')';
	}();

	this.neighborRatioInInnerRadius = 0;
	this.neighborRatioInOuterRadius = 0;
	this.showInnerDetector = false;
	this.showOuterDetector = false;
}

Creature.prototype = {

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

	draw: function()
	{
		this.update();

		var ctx = this.world.ctx;
		ctx.lineWidth = 1;

		try {
			var gradient = ctx.createRadialGradient(
				this.location.x, 
				this.location.y, 
				Math.sqrt(this.radius), 
				this.location.x, 
				this.location.y, 
				this.radius);	
		}
		catch (e) {
			console.log("x: " + this.location.x + ", y: " + this.location.y)
		}

		gradient.addColorStop(0, this.color);
		gradient.addColorStop(1, 'black');
		ctx.beginPath();
		ctx.fillStyle = gradient;
		ctx.arc(this.location.x, this.location.y, this.radius, 0, 2 * Math.PI);
		ctx.fill();

		if (this.showOuterDetector) {
			
			ctx.lineWidth = .5;
			ctx.strokeStyle = 'green';
			ctx.beginPath();
			ctx.arc(this.location.x, this.location.y, this.innerRadius * 2, 0, 2 * Math.PI);
			ctx.stroke();

			if (this.showInnerDetector) {
				ctx.lineWidth = .5;
				ctx.strokeStyle = 'red';
				ctx.beginPath();
				ctx.arc(this.location.x, this.location.y, this.innerRadius, 0, 2 * Math.PI);
				ctx.stroke();
			}
		}
	},

	moveTo: function(networkOutput)
	{
		var force = new Vector(0, 0);

		var target = new Vector(networkOutput[0] * this.world.width, networkOutput[1] * this.world.height);
		force.add(this.seek(target));

		this.innerRadius = networkOutput[2] * this.radius * this.radius * 2;

		this.applyForce(force);
	},

	update: function()
	{
		this.velocity.add(this.acceleration);
	    this.velocity.limit(this.maxspeed);
	    this.location.add(this.velocity);
	    this.acceleration.multiply(0);

	    this.neighborRatioInInnerRadius = this.ratioOfNeighborsInRadius(this.innerRadius);
	    this.neighborRatioInOuterRadius = this.ratioOfNeighborsInRadius(this.innerRadius * 2);

		this.energy += this.neighborRatioInOuterRadius;
		this.energy -= this.neighborRatioInInnerRadius;

		this.showInnerDetector = this.neighborRatioInInnerRadius > 0;
		this.showOuterDetector = this.neighborRatioInOuterRadius > 0;

		// enforce boundaries
		if (this.location.x < this.radius + 10) {
			this.energy = 0;
		}
		if (this.location.x > this.world.width - this.radius - 10) {
			this.energy = 0;
		}
		if (this.location.y < this.radius + 10) {
			this.energy = 0;
		}
		if (this.location.y > this.world.height - this.radius - 10) {
			this.energy = 0;
		}

		// detect collisions
		for (var i in this.world.creatures) {
			var creature = this.world.creatures[i];
			if (creature !== this) {
				if (this.location.distanceBetween(creature.location) < this.radius + creature.radius) {
					this.energy -= .9;
				}
			}
		}

		this.energy -= .001;

		if (this.energy < 0) {
			this.energy = 0;
		}
		else if (this.energy > 1) {
			this.energy = 1;
		}
	},

	ratioOfNeighborsInRadius: function(radius)
	{
		var num = 0;
		for (var i in this.world.creatures) {
			let creature = this.world.creatures[i];
			if (creature !== this &&
				this.location.distanceBetween(creature.location) < radius) {
				num++;
			}
		};

		return num / this.world.creatures.length;
	},

	applyForce: function(force)
	{
		this.acceleration.add(force);
	},

	seek: function(target)
	{
		var seek = target.copy().subtract(this.location)
		seek.normalize();
		seek.multiply(this.maxspeed);
		seek.subtract(this.velocity).limit(0.3);
		
		return seek;
	}
}
