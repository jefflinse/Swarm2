function Overlay(world) {

	this.world = world;

	this.draw = function() {

		var ctx = this.world.ctx;

		// transparent background for overlay
		ctx.beginPath();
		ctx.fillStyle = 'rgba(100, 150, 255, .2)';
		ctx.fillRect(0, 0, this.world.width, 30);

		// print some info
		ctx.font = '16px sans-serif';
		ctx.fillStyle = 'black';

		ctx.fillText(
			'Era: ' + this.world.era + '   ' +
			'Generation: ' + this.world.generation + '   ' +
			'Species: ' + this.world.numSpecies + '   ' +
			'Avg. Food Collected: ' + this.world.averageFoodCollected + '   ' +
			'Most Fit: ' + this.world.mostFit,
			10, 20);
	}
}
