/** @import { BaseGame } from "./game.js" */

export class Actor {
    initialized = false;
    /** @param {BaseGame} game */
    init(game) {
        this.initialized = true
    }
    /**
     * @param {BaseGame} game
     * @param {CanvasRenderingContext2D} context 
    */
    draw(game,context) {

    }
    /**
     * @param {BaseGame} game
     * @param {number} dt
    */
    update(game,dt) {

    }
}