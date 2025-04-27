'use strict';

var Config = require('./Config');
var Debug = require('./Debug');
var Vector = require('./Vector');

function Part(specifics) {
    specifics = specifics || {};
    this.relativePosition = this._generateRelativePosition();
    this.inputs = this._generateDefaultInputs();
    this.outputs = this._generateDefaultOutputs();
    this.radius = specifics.radius || Config.Creature.Part.MaxRadius;
    this.scanRadius = Config.Creature.StartingScanRadius;
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

        // part radius
        let newRadius = Math.min(Config.Creature.Part.MaxRadius, this.radius + (dr * Config.Creature.MaxRadialChange));
        this.radius = Math.abs(newRadius);
        this.scanRadius = (this.radius / Config.Creature.Part.MaxRadius) * Config.Creature.StartingScanRadius;

        // part distance from creature
        let newDistance = this.relativePosition.magnitude() + (ds * Config.Creature.Part.MaxExtendContractSpeed);
        newDistance = Math.max(newDistance, this.creature.radius + this.radius);
        this.relativePosition.setMagnitude(newDistance).limit(Config.Creature.Part.MaxDistanceFromCreature);

        // part angle from creature
        // da = ((Config.Creature.Part.MaxRadius - this.radius) / Config.Creature.Part.MaxRadius) * da;
        if (da <= 0) {
            da = Math.max(da, -Config.Creature.AngularMaxSpeed);
        } else {
            da = Math.min(da, Config.Creature.AngularMaxSpeed);
        }
        // let newAngle = (this.relativePosition.angle() + (da * Config.Creature.Part.MaxAngularSpeed)) % (Math.PI * 2);
        // limit angle change by the part's radius
        let newAngle = this.relativePosition.angle() + (da * (1-(this.radius / Config.Creature.Part.MaxRadius)));
        this.relativePosition.setAngle(newAngle);

        // energy spent is proportional to the distance and radius of the part
        return Config.Creature.Part.EnergyPerMovement
            * (this.relativePosition.magnitude() / Config.Creature.Part.MaxDistanceFromCreature)
            * (this.radius / Config.Creature.Part.MaxRadius);
    },

    interact: function  () {

        this.nearestFood.set(0, 0);
        var distanceToNearestFood = this.scanRadius;
        let absolutePosition = this.creature.location.copy().add(this.relativePosition);

        // eat
        for (var i in this.creature.world.food) {
            if (this.creature.world.food[i] !== null && this.creature.world.food[i].x !== null) {
                let distanceToFood = absolutePosition.distanceBetween(this.creature.world.food[i]);
                if (this.radius > Config.Creature.Part.MinRadiusForConsumption && distanceToFood <= this.radius) {
                    this.creature.eatFood(i);
                }
                else if (distanceToFood <= distanceToNearestFood) {
                    this.nearestFood = this.creature.world.food[i].copy().subtract(absolutePosition);
                    distanceToNearestFood = distanceToFood;
                }
            }
        }

        this.outputs[0].value = this.radius / Config.Creature.Part.MaxRadius;
        this.outputs[1].value = this.relativePosition.magnitude() / Config.Creature.Part.MaxDistanceFromCreature;
        this.outputs[2].value = this.relativePosition.angle() / (Math.PI * 2);
        this.outputs[3].value = this.nearestFood.magnitude() / this.scanRadius;
        this.outputs[4].value = this.nearestFood.angle() / (Math.PI * 2);
    },

    getThrustVector: function () {
        // initial thrust vector establishes direction
        // magnitude of thrust is calculated below
        let thrustVector = this.relativePosition.copy().invert();

        let distanceRatio = this.relativePosition.magnitude() / Config.Creature.Part.MaxDistanceFromCreature;
        let weightRatio = this.radius / Config.Creature.Part.MaxRadius;

        // each part contributes 1/Nth of the total thrust for N total parts
        let thrustMagnitude = Config.Creature.LinearMaxSpeed / this.creature.parts.length;

        // each part's thrust is proportional to the ratio of the part's distance from the creature
        thrustMagnitude *= distanceRatio;

        // thrus magnitude must always be positive
        thrustMagnitude = Math.max(thrustMagnitude, 0);

        thrustVector.setMagnitude(thrustMagnitude);

        // resistance vector is opposite of thrust vector
        let resistenceVector = thrustVector.copy().invert().normalize();

        // each part contributes 1/Nth of the total resistance for N total parts
        let resistenceMagnitude = Config.Creature.LinearMaxSpeed / this.creature.parts.length;

        // resistance is proportional to the part's radius
        resistenceMagnitude *= weightRatio;

        // resistance is also proportional to the distance from the creature
        resistenceMagnitude *= distanceRatio;

        // resistance must always be positive
        resistenceMagnitude = Math.max(resistenceMagnitude, 0);

        resistenceVector.setMagnitude(resistenceMagnitude);

        thrustVector.add(resistenceVector)

        return thrustVector;
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
            { value: 0 }, // radius
            { value: 0 }, // distance from creature
            { value: 0 }, // angle from creature
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
