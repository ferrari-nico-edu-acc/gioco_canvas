import { Vector2, Ref, CollisionBox } from "./datatypes.js";
import { in_range } from "./math.js";
/** @import { Sprite } from "./sprite.js" */
/** @typedef {"over"|"under"|"left"|"right"|"unknown"} Direction */
/** @typedef {[Sprite,Direction,CollisionBox,CollisionBox]} CollisionInfo */

export class BaseGame {
    size = Vector2.zero;
    fps = 60;
    last_frame = performance.now();
    dt = 0;
    target_dt = 0;
    /** @type {Ref<any>} */
    debug_log = new Ref(null)
    /** @type {Sprite[]} */
    sprites = [];
    /** @type {Vector2} */
    camera_position = Vector2.zero;
    /** @type {CanvasRenderingContext2D} */
    context;
    /** @type {Map<Sprite,CollisionInfo[]>} */
    frame_collisions = new Map()
    /**
     * @param {CanvasRenderingContext2D} context
     * @param {Vector2} size
    */
    constructor(context,size) {
        this.context = context
        this.target_dt = 1 / this.fps;
        this.size = size;
    };
    init() {
    }
    draw() {
        this.context.clearRect(0, 0, this.size.x, this.size.y);
        this.context.save()
        this.context.fillStyle = "#9494FF"
        this.context.fillRect(0, 0, this.size.x, this.size.y)
        this.context.restore()
        for (const sprite of this.sprites) {
            sprite.draw(this,this.context,this.camera_position);
        }
        if (this.debug_log.val != null) {
            this.context.save()
            this.context.font = "30px Arial"
            this.context.fillText(String(this.debug_log.val),20,50)
            this.context.restore()
        }
    };
    update() {
        const now = performance.now();
        this.dt = (now - this.last_frame) / 1000;
        this.last_frame = now;
        this.frame_collisions.clear()
        for (const sprite of this.sprites) {
            if (!sprite.collision_sensor) {
                continue;
            }
            this.frame_collisions.set(sprite,this.check_for_collision(sprite,[],false))
        }
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
     * @returns {CollisionInfo[]}
    */
    check_for_collision(sprite,ignore = [],only_solid) {
        const collisions = []
        for (const other_sprite of this.sprites) {
            if (other_sprite === sprite) {
                continue;
            }
            /*if (this.frame_collisions.has(other_sprite)) {
                continue;
            }*/
            if (only_solid && !sprite.solid) {
                continue;
            }
            if (ignore.includes(other_sprite)) {
                continue;
            }
            for (const other_collision_box of other_sprite.collision_boxes) {
                for (const sprite_collision_box of sprite.collision_boxes) {
                    if (sprite_collision_box.collides_with(other_collision_box,sprite.pos,other_sprite.pos)) {
                        let collision
                        if (in_range(sprite.pos.y + sprite.size.y,other_sprite.pos.y,4)) {
                            collision = [other_sprite,"over",sprite_collision_box,other_collision_box];
                        } else if (in_range(sprite.pos.y,other_sprite.pos.y + other_sprite.size.y,10)) {
                            collision = [other_sprite,"under",sprite_collision_box,other_collision_box];
                        } else if (in_range(sprite.pos.x + sprite.size.x,other_sprite.pos.x,10)) {
                            collision = [other_sprite,"left",sprite_collision_box,other_collision_box];
                        } else if (in_range(sprite.pos.x,other_sprite.pos.x + other_sprite.size.x,10)) {
                            collision = [other_sprite,"right",sprite_collision_box,other_collision_box];
                        } else {
                            collision = [other_sprite,"unknown",sprite_collision_box,other_collision_box];
                        }
                        collisions.push(collision)
                    }
                }
            }
        }
        return collisions;
    }
}