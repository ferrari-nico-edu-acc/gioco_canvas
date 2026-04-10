import { Actor } from "./actor.js";
import { CollisionBox, Vector2, Ref } from "./datatypes.js";

export class Sprite extends Actor {
    pos = Vector2.zero;
    size = Vector2.zero;
    src_pos = Vector2.zero;
    src_size = Vector2.zero;
    /** @type {Ref<ImageBitmap | string | null>} */
    texture;
    /** @type {CollisionBox[]} */
    collision_boxes = []
    /** 
     * @param {Ref<ImageBitmap | string | null>} texture
     * @param {Vector2} pos
     * @param {Vector2} size
    */
    debug_render_collision_boxes = false;
    velocity = Vector2.zero;
    gravity_force = 16;
    constructor(texture, pos, size) {
        super();
        this.texture = texture;
        this.pos = pos;
        this.size = size;
    }
    /**
     * @param {CanvasRenderingContext2D} context 
    */
    draw(game,context) {
        if (!this.texture.val) {
            return;
        }
        if (this.texture.val instanceof ImageBitmap) {
            context.drawImage(this.texture.val, this.src_pos.x, this.src_pos.y, this.src_size.x, this.src_size.y, this.pos.x, this.pos.y, this.size.x, this.size.y);
        }
        if (typeof this.texture.val == "string") {
            const last_fill_style = context.fillStyle;
            context.fillStyle = this.texture.val;
            context.fillRect(this.pos.x,this.pos.y,this.size.x,this.size.y);
            context.fillStyle = last_fill_style;
        }
        if (this.debug_render_collision_boxes) {
            for (const collision_box of this.collision_boxes) {
                const last_stroke_style = context.strokeStyle;
                context.strokeStyle = "blue";
                context.strokeRect(this.pos.x + collision_box.pos.x,this.pos.y + collision_box.pos.y,collision_box.size.x,collision_box.size.y);
                context.strokeStyle = last_stroke_style;
            }
        }
    }
    update(game,dt) {
        this.velocity.y += this.gravity_force;
        const previous_pos = this.pos.clone();
        this.pos.x = Math.max(Math.min(this.pos.x + this.velocity.x * dt, game.size.x - this.size.x), 0);
        this.pos.y = Math.max(Math.min(this.pos.y + this.velocity.y * dt, game.size.y - this.size.y), 0);
        this.velocity = this.pos.sub(previous_pos).scaled(1/dt);
    }
    setup_default_collision() {
        this.collision_boxes.push(new CollisionBox(Vector2.zero, this.size.clone()));
    }
}

export class SpriteAnimation {
    /** @type {Ref<CanvasImageSource?>} */
    atlas;
    atlas_size = Vector2.zero;
    frames_in_row = 0;
    frame_size = Vector2.zero;
    frame_amount = 0;
    /** 
     * @param {number} idx
     * @returns {Vector2}
    */
    get_frame_pos_at_idx(idx) {
        return new Vector2(idx % this.frames_in_row, Math.floor(idx / this.frames_in_row));
    }
    /** 
     * @param {number} idx
     * @returns {Vector2}
    */
    get_sized_frame_pos_at_idx(idx) {
        const frame_pos = this.get_frame_pos_at_idx(idx);
        frame_pos.x *= this.frame_size.x;
        frame_pos.y *= this.frame_size.y;
        return frame_pos;
    }
    /**
     * @param {Ref<CanvasImageSource?>} atlas 
     * @param {Vector2} atlas_size 
     * @param {number} frames_in_row 
     * @param {Vector2} frame_size 
     * @param {number} frame_amount 
     */
    constructor(atlas, atlas_size, frames_in_row, frame_size, frame_amount) {
        this.atlas = atlas;
        this.atlas_size = atlas_size;
        this.frames_in_row = frames_in_row;
        this.frame_size = frame_size;
        this.frame_amount = frame_amount;
    }
}

export class AnimatedSprite extends Sprite {
    animation_frame = 0;
    last_animation_frame_change = 0;
    animation_frame_dt = .2;
    animation = "";
    /** @type {Map<string,SpriteAnimation>} */
    sprite_animations;
    /**
     * @param {string} id
     * @param {number} last_frame
    */
    set_animation(id, last_frame) {
        this.animation = id;
        this.animation_frame = 0;
        this.last_animation_frame_change = last_frame;
        const sprite_animation = this.sprite_animations.get(this.animation);
        if (!sprite_animation) {
            return;
        }
        this.texture = sprite_animation.atlas;
        this.src_size = sprite_animation.frame_size;
        this.src_pos = sprite_animation.get_sized_frame_pos_at_idx(this.animation_frame);
    }
    /**
     * @param {Ref<CanvasImageSource?>} texture
     * @param {Vector2} pos
     * @param {Vector2} size
     * @param {string} animation
     * @param {Map<string,SpriteAnimation>} sprite_animations
    */
    constructor(pos, size, sprite_animations) {
        super(null, pos, size);
        this.sprite_animations = sprite_animations;
    }
    /**
     * @param {T} game
     * @param {number} dt 
    */
    update(game,dt) {
        super.update(game,dt);
        const sprite_animation = this.sprite_animations.get(this.animation);
        if (!sprite_animation) {
            return;
        }
        if (game.last_frame - this.last_animation_frame_change >= this.animation_frame_dt) {
            this.animation_frame = (this.animation_frame + 1) % sprite_animation.frame_amount;
            this.last_animation_frame_change = game.last_frame;
        }
        this.src_pos = sprite_animation.get_sized_frame_pos_at_idx(this.animation_frame);
    }
}