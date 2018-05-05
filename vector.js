'use strict';

function Vector(x, y)
{
	this.x = x;
	this.y = y;
}

Vector.prototype = {

	set: function(x, y)
	{
		this.x = x;
		this.y = y;
		return this;
	},

	add: function(v)
	{
		this.x += v.x;
		this.y += v.y;
		return this;
	},

	subtract: function(v)
	{
		this.x -= v.x;
		this.y -= v.y;
		return this;
	},

	multiply: function(s)
	{
		this.x *= s;
		this.y *= s;
		return this;
	},

	divide: function(s)
	{
		!s && console.log("Division by zero!");

		this.x /= s;
		this.y /= s;
		return this;
	},

	magnitude: function()
	{
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},

	setMagnitude: function(m)
	{
		var angle = this.angle();
		this.x = m * Math.cos(angle);
		this.y = m * Math.sin(angle);
		return this;
	},

	normalize: function()
	{
		var magnitude = this.magnitude();
		magnitude && this.divide(magnitude);
		return this;
	},

	angle: function()
	{
		return Math.atan2(this.y, this.x);
	},

	setAngle: function(a)
	{
		var magnitude = this.magnitude();
		this.x = magnitude * Math.cos(a);
		this.y = magnitude * Math.sin(a);
		return this;
	},

	rotate: function(a)
	{
		this.setAngle(this.angle() + a);
		return this;
	},

	limit: function(limit)
	{
		var magnitude = this.magnitude();
		if (magnitude > limit) {
			this.setMagnitude(limit);
		}

		return this;
	},

	angleBetween: function(v)
	{
		return this.angle() - v.angle();
	},

	dot: function(v)
	{
		return this.x * v.x + this.y * v.y;
	},

	lerp: function(v, amt)
	{
		this.x += (v.x - this.x) * amt;
		this.y += (v.y - this.y) * amt;
		return this;
	},

	distanceBetween: function(v)
	{
		var dx = this.x - v.x;
		var dy = this.y - v.y;
		return Math.sqrt(dx * dx + dy * dy);
	},

	invert: function() {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	},

	copy: function()
	{
		return new Vector(this.x, this.y);
	},

	random: function()
	{
		this.set(1, 1);
		this.setAngle(Math.random() * Math.PI * 2);
		return this;
	}
}

module.exports = Vector;
