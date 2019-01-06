'use strict';

var Config = require('../Config');
var Debug = require('../Debug');
var Vector = require('../Vector');

function Part(specifics) {
    specifics = specifics || {};
    this.relativePosition = this._generateRelativePosition();
    this.inputs = this._generateDefaultInputs();
    this.outputs = this._generateDefaultOutputs();
    this.radius = specifics.radius || Config.Creature.Part.MaxRadius;
    this.scanRadius = specifics.scanRadius || Config.Creature.StartingScanRadius;
    this.nearestFood = new Vector(0, 0).setMagnitude(Config.Creature.StartingScanRadius);
}

Part.prototype = {

    creature: undefined,
    relativePosition: undefined,
    inputs: undefined,
    outputs: undefined,
    radius: undefined,
    scanRadius: undefined,
    nearestFood: undefined,

    clone: function () {
        return new Part({
            radius: this.radius,
            scanRadius: this.scanRadius,
        });
    },

    tick: function () {
        let inputIndex = 0;
        let ds = this.inputs[inputIndex++].value;
        let da = this.inputs[inputIndex++].value;
        let dr = this.inputs[inputIndex++].value;

        Debug.assert(ds !== NaN, "ds is NaN");
        Debug.assert(da !== NaN, "da is NaN");
        Debug.assert(dr !== NaN, "dr is NaN");

        // part distance from creature
        let newDistance = this.relativePosition.magnitude() + (ds * Config.Creature.Part.MaxExtendContractSpeed);
        this.relativePosition.setMagnitude(newDistance).limit(Config.Creature.Part.MaxDistanceFromCreature);

        // part angle from creature
        let newAngle = (this.relativePosition.angle() + (da * Config.Creature.Part.MaxAngularSpeed)) % (Math.PI * 2);
        this.relativePosition.setAngle(newAngle);

        // part radius
        let newRadius = Math.min(Config.Creature.Part.MaxRadius, this.radius + (dr * Config.Creature.MaxRadialChange));
        this.radius = Math.abs(newRadius);
    },

    interact: function () {

        this.nearestFood.set(0, 0);
        var distanceToNearestFood = this.scanRadius + 1;
        let absolutePosition = this.creature.location.copy().add(this.relativePosition);

        // eat
        for (var i in this.creature.world.food) {
            if (this.creature.world.food[i].x !== null) {
                let distanceToFood = absolutePosition.distanceBetween(this.creature.world.food[i]);
                if (this.radius > Config.Creature.Part.MinRadiusForConsumption && distanceToFood <= this.radius) {
                    this.creature.eatFood(i);
                }
                else if (distanceToFood <= distanceToNearestFood) {
                    this.nearestFood = this.creature.world.food[i].copy().subtract(this.creature.location);
                    distanceToNearestFood = distanceToFood;
                }
            }
        }

        this.outputs[0].value = this.nearestFood.magnitude();
        this.outputs[1].value = this.nearestFood.angle();
    },

    _generateDefaultInputs: function () {
        return [
            { value: 0 }, // relative angle delta from creature
            { value: 0 }, // relative length delta from creature
            { value: 0 }, // relative radius delta
        ];
    },

    _generateDefaultOutputs: function () {
        return [
            { value: 0 }, // relative distance to nearest food
            { value: 0 }, // relative angle of nearest food
        ];
    },

    _generateRelativePosition: function () {
        return new Vector(1, 1)
            .setMagnitude(Config.Creature.Part.MaxDistanceFromCreature)
            .setAngle(Math.random() * Math.PI * 2);
    },
}

module.exports = Part;
