'use strict';

var Vector = require('./Vector');

function Graphics(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
}

Graphics.prototype = {

    ctx: undefined,
    width: 0,
    height: 0,

    _preDraw: function (props) {
        this.ctx.save();
        Object.assign(this.ctx, props);
    },

    _postDraw: function () {
        this.ctx.restore();
    },

    drawBackground: function () {
        this.drawRectangle(0, 0, this.width, this.height, {
            fillStyle: '#f4f4f4',
        });
    },

    drawLine(from, to, props) {
        this._preDraw(props);
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
        this._postDraw();
    },

    drawCircle: function (origin, radius, props) {
        this._preDraw(props);
        this.ctx.beginPath();
        this.ctx.arc(origin.x, origin.y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this._postDraw();
    },

    drawRectangle: function (x, y, width, height, props) {
        this._preDraw(props);
        this.ctx.beginPath();
        this.ctx.fillRect(x, y, width, height);
        this._postDraw();
    },

    drawOverlay: function (text, props) {
        this._preDraw(props);

        // transparent background for overlay
        this.drawRectangle(0, 0, this.width, 30, {
            fillStyle: 'rgba(100, 150, 255, .2)',
        });

        // print some info
        this.ctx.font = '16px sans-serif';
        this.ctx.fillStyle = 'black';

        this.ctx.fillText(text, 10, 20);

        this._postDraw();
    }
}

module.exports = Graphics;
