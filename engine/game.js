import { Vector2, Ref } from "./datatypes.js";
import { Sprite } from "./sprite.js";
import { in_range } from "./math.js";

export class BaseGame {
    size = new Vector2(640, 640);
    fps = 60;
    last_frame = performance.now()
    dt = 0;
    target_dt = 0;
    /** @type {Ref<any>} */
    debug_log = new Ref(null)
    /** @type {Sprite[]} */
    sprites = [];
    /** @type {CanvasRenderingContext2D} */
    context;
    /** @param {CanvasRenderingContext2D} context */
    constructor(context) {
        this.context = context
        this.target_dt = 1 / this.fps;
    };
    init() {
    }
    draw() {
        this.context.clearRect(0, 0, this.size.x, this.size.y);
        for (const sprite of this.sprites) {
            sprite.draw(this,this.context);
        }
        this.context.save()
        this.context.font = "30px Arial"
        this.context.fillText(String(this.debug_log.val),20,50)
        this.context.restore()
    };
    update() {
        const now = performance.now();
        this.dt = (now - this.last_frame) / 1000;
        this.last_frame = now;
        for (const sprite of this.sprites) {
            sprite.update(this,this.dt);
        }
    };
    /**
     * @param {Sprite} sprite
    */
    add_sprite(sprite) {
        if (!this.sprites.includes(sprite)) {
            this.sprites.push(sprite);
        }
        if (!sprite.initialized) {
            sprite.init(this);
        }
    }
    /**
     * @param {Sprite} sprite
     * @param {Sprite[]} ignore
     * @param {boolean} only_solid
     * @returns {[Sprite,"over"|"under"|"left"|"right"|"unknown"]?}
    */
    check_for_collision(sprite,ignore = [],only_solid) {
        for (const other_sprite of this.sprites) {
            if (other_sprite === sprite) {
                continue;
            }
            if (only_solid && !sprite.solid) {
                continue;
            }
            if (ignore.includes(other_sprite)) {
                continue;
            }
            for (const other_collision_box of other_sprite.collision_boxes) {
                for (const sprite_collision_box of sprite.collision_boxes) {
                    if (sprite_collision_box.collides_with(other_collision_box,sprite.pos,other_sprite.pos)) {
                        const direction = in_range(sprite.pos.y + sprite.size.y,other_sprite.pos.y,10) ? "over" :
                            in_range(sprite.pos.y,other_sprite.pos.y + other_sprite.size.y,10) ? "under" :
                            in_range(sprite.pos.x + sprite.size.x,other_sprite.pos.x,10) ? "left" :
                            in_range(sprite.pos.x,other_sprite.pos.x + other_sprite.size.x,10) ? "right" : "unknown"
                        return [other_sprite,direction];
                    }
                }
            }
        }
        return null;
    }
}