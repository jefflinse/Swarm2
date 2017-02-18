function World(width, height, canvas) {
	var that = this;

	canvas.width = this.width = width;
	canvas.height = this.height = height;
	this.ctx = canvas.getContext('2d');
	this.creatures = [];
	this.deadCreatures = [];
	this.tick = 1;

	var loop = function () {

		applyFadeEffect();

		// update each creature
		that.creatures.forEach(function(creature)
		{
			// move
			var inputs = [];
			inputs.push(creature.location.x);
			inputs.push(creature.location.y);
			inputs.push(creature.velocity.x);
			inputs.push(creature.velocity.y);
			inputs.push(creature.neighborRatioInInnerRadius);
			inputs.push(creature.neighborRatioInOuterRadius);
			inputs.push(creature.energy);
			inputs.push(that.deadCreatures.length);

			var outputs = creature.network.activate(inputs);
			creature.moveTo(outputs);

			if (creature.energy !== 0) {
				creature.draw();
			}
			else
			{
				that.deadCreatures.push(creature);
			}
		});

		// remove dead creatures
		that.deadCreatures.forEach(function (deadCreature) {
			var index = that.creatures.indexOf(deadCreature);
			if (index > -1) {
				that.creatures.splice(index, 1);
			}
		});

		that.tick++;

		if (that.tick > 100) {

			console.log("new generation");

			// add new offspring
			for (var i = 0; i < that.deadCreatures.length; i++) {
				that.creatures.push(that.creatures[i].clone());
			}

			that.deadCreatures = [];
			that.tick = 0;
		}
		
		setTimeout(loop, 10);
	}

	var applyFadeEffect = function () {
		that.ctx.globalAlpha = 0.2;
		that.ctx.fillStyle = '#f4f4f4';
		that.ctx.fillRect(0, 0, that.width, that.height);
		that.ctx.globalAlpha = 1;
	}

	this.start = function() {

		return loop();
	}
}
