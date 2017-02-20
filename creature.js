function Creature(network, world, x, y)
{
	this.network = network;
	this.world = world;
	this.foodEaten = 0;
	this.foodNearby = 0;
	this.distanceToNearestFood = 0;
	this.angleOfNearestFood = 0;
	this.scanRadius = 50;

	this.radius = 5;
	this.linearMaxSpeed = 6;
	this.rotationalMaxSpeed = Math.PI;

	this.location = new Vector(x, y);
	this.velocity = new Vector(0, 0);
	
	this.color = 'rgb(' +
		Math.floor(Math.random() * 255) + ',' +
		Math.floor(Math.random() * 255) + ',' +
		Math.floor(Math.random() * 255) + ')';

	this.ticks = 1;
}

Creature.prototype = {

	tick: function()
	{
		// assign all input values
		var inputs = [];
		inputs.push(this.velocity.angle());
		inputs.push(this.velocity.magnitude());
		inputs.push(this.foodNearby);
		inputs.push(this.distanceToNearestFood);
		inputs.push(this.angleOfNearestFood);

		// feed the neural network forward
		var outputs = this.network.activate(inputs);
		this.processOutputs(outputs);

		// interact with the world and other creatures
		this.interact();

		this.ticks++;
	},

	processOutputs: function(networkOutput)
	{
		// first two network outputs specify the multipliers for deltas in distance and rotation
		var ds = networkOutput[0] * this.linearMaxSpeed;
		var da = networkOutput[1] * this.rotationalMaxSpeed;

		this.velocity.setMagnitude(ds);
		this.velocity.rotate(da);

		this.location.add(this.velocity);
	},

	interact: function()
	{
		this.foodNearby = 0;
		this.distanceToNearestFood = 0;
		this.angleOfNearestFood = 0;

		// eat
		for (var i in this.world.food) {
			if (this.world.food[i] !== null) {
				let target = this.world.food[i].copy().subtract(this.location);
				let distanceToFood = target.magnitude();
				if (distanceToFood <= this.radius) {
					this.world.food[i] = null;
					this.foodEaten++;
				}
				else if (distanceToFood <= this.scanRadius) {
					this.foodNearby++;
					this.distanceToNearestFood = Math.min(this.distanceToNearestFood, distanceToFood);
					this.angleOfNearestFood = target.angle() - this.velocity.angle();
				}
			}
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
				if (Math.random() < .3) {
					connection.weight += (Math.random() * .2) - .1;
				}
			}
		}

		creature.velocity.random();
		creature.color = this.color;

		// bad
		this.reset();
		creature.reset();

		return creature;
	},

	draw: function()
	{
		this.world.ctx.lineWidth = 1;
		this.world.ctx.beginPath();
		this.world.ctx.fillStyle = this.color;
		this.world.ctx.arc(this.location.x, this.location.y, this.radius, 0, 2 * Math.PI);
		this.world.ctx.fill();

		this.world.ctx.lineWidth = 3;
		this.world.ctx.beginPath();
		this.world.ctx.strokeStyle = 'black';
		this.world.ctx.moveTo(this.location.x, this.location.y);
		var relativeTarget = this.velocity.copy().setMagnitude(this.radius + 5);
		var absolutePosition = this.location.copy().add(relativeTarget);
		this.world.ctx.lineTo(absolutePosition.x, absolutePosition.y);
		this.world.ctx.stroke();
	},

	fitness: function()
	{
		return this.foodEaten / this.ticks;
	},

	reset: function()
	{
		this.ticks = 0;
		this.foodEaten = 0;
	}
}
