import { Actor } from "./actor.js";
import { CollisionBox, Vector2, Ref } from "./datatypes.js";
import { move_toward, in_range } from "./math.js";

export class Sprite extends Actor {
    pos = Vector2.zero;
    size = Vector2.zero;
    src_pos = Vector2.zero;
    src_size = Vector2.zero;
    /** @type {Ref<ImageBitmap | string | null>} */
    texture;
    texture_flip_x = false;
    texture_flip_y = false;
    /** @type {CollisionBox[]} */
    collision_boxes = [];
    solid = true;
    /** 
     * @param {Ref<ImageBitmap | string | null>} texture
     * @param {Vector2} pos
     * @param {Vector2} size
    */
    debug_render_collision_boxes = false;
    velocity = Vector2.zero;
    gravity_force = 16;
    speed = 500;
    jump_height = 500;
    acceleration = 4000;
    ground_friction = 5000;
    air_friction = 3000;
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
            context.save()
            context.scale(this.texture_flip_x ? -1 : 1,this.texture_flip_y ? -1 : 1)
            const pos = this.pos.clone()
            if (this.texture_flip_x) {
                pos.x = -pos.x - this.size.x
            }
            if (this.texture_flip_y) {
                pos.y = -pos.y - this.size.y
            }
            context.drawImage(this.texture.val, this.src_pos.x, this.src_pos.y, this.src_size.x, this.src_size.y, pos.x, pos.y, this.size.x, this.size.y);
            context.restore()
        }
        if (typeof this.texture.val == "string") {
            context.save()
            context.fillStyle = this.texture.val;
            context.fillRect(this.pos.x,this.pos.y,this.size.x,this.size.y);
            context.restore()
        }
        if (this.debug_render_collision_boxes) {
            for (const collision_box of this.collision_boxes) {
                context.save()
                context.strokeStyle = "blue";
                context.strokeRect(this.pos.x + collision_box.pos.x,this.pos.y + collision_box.pos.y,collision_box.size.x,collision_box.size.y);
                context.restore()
            }
        }
    }
    jump() {
        this.pos.y -= 1;
        this.velocity.y -= this.jump_height;
    }
    /**
     * @param {Vector2} direction
     * @param {number} dt
     * @param {any} game
    */
    move(direction,dt,game) {
        const target_horizontal_velocity = direction.x * this.speed;
        const current_acceleration = direction.x != 0 ? this.acceleration : (this.is_grounded(game) ? this.ground_friction : this.air_friction);
        this.velocity.x = move_toward(this.velocity.x, target_horizontal_velocity, current_acceleration*dt);
    }
    is_grounded(game) {
        const [collider,direction] = game.check_for_collision(this,[],true) ?? [];
        const void_grounded = this.is_void_grounded(game)
        if (!collider) {
            return void_grounded;
        }
        return direction === "over" || void_grounded;
    }
    is_void_grounded(game) {
        return this.pos.y === game.size.y - this.size.y;
    }
    update(game,dt) {
        if (!this.is_grounded(game)) {
            this.velocity.y += this.gravity_force;
        } else {
            this.velocity.y = 0;
        }
        const step_amount = 8;
        let move_amount_x = this.velocity.x * dt / step_amount
        let move_amount_y = this.velocity.y * dt / step_amount
        for (let i = 0; i < step_amount; i++) {
            const [collider,direction] = game.check_for_collision(this,[],true) ?? [];
            if (collider) {
                if ((direction === "left" && move_amount_x > 0) || (direction === "right" && move_amount_x < 0)) {
                    move_amount_x = 0;
                } else if ((direction === "over" && move_amount_y > 0) || (direction === "under" && move_amount_y < 0)) {
                    move_amount_y = 0;
                }
            }
            this.pos.x = Math.max(Math.min(this.pos.x + move_amount_x, game.size.x - this.size.x), 0);
            this.pos.y = Math.max(Math.min(this.pos.y + move_amount_y, game.size.y - this.size.y), 0);
            if (move_amount_x === 0 && move_amount_y === 0) {
                break
            }
        }
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