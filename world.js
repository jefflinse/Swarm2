function World(numCreatures, canvas) {
	var that = this;

	this.width = canvas.width;
	this.height = canvas.height;
	this.ctx = canvas.getContext('2d');

	this.creatures = {
		alive: [],
		dead: []
	};

	this.tick = 1;

	var loop = function () {

		applyFadeEffect();

		// update each creature
		that.creatures.alive.forEach(function(creature)
		{
			creature.tick();

			if (creature.isDead()) {
				that.creatures.dead.push(creature);
			}
			else
			{
				creature.draw();
			}
		});

		// remove dead creatures
		that.creatures.dead.forEach(function (deadCreature) {
			var index = that.creatures.alive.indexOf(deadCreature);
			if (index > -1) {
				that.creatures.alive.splice(index, 1);
			}
		});

		that.tick++;

		if (that.tick > 100) {

			console.log("generation");

			// add new offspring
			var bestCreatures = that.creatures.alive.sort(function (a, b) {
				return b.fitness() - a.fitness();
			})

			for (var i = 0, j = 0; i < that.creatures.dead.length; i++, j = (j + 1) % bestCreatures.length) {
				that.creatures.alive.push(bestCreatures[j].clone());
			}

			that.creatures.dead = [];
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
