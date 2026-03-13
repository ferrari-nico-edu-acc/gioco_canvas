/** @type {HTMLCanvasElement} */
const game_canvas = document.querySelector("#game_canvas");
const context = game_canvas.getContext("2d");

/** @type {ImageBitmap?} */
let run_spritesheet
const run_spritesheet_image = new Image(1452,1374);
run_spritesheet_image.src = "run_spritesheet.png";
run_spritesheet_image.decode().then(async () => {
    run_spritesheet = await createImageBitmap(run_spritesheet_image);
})
const run_sprite_dimentions = new Vector2(363,458);

/** @type {ImageBitmap?} */
let idle_spritesheet
const idle_spritesheet_image = new Image(1160,878);
idle_spritesheet_image.src = "idle_spritesheet.png";
idle_spritesheet_image.decode().then(async () => {
    idle_spritesheet = await createImageBitmap(idle_spritesheet_image);
})
const idle_sprite_dimentions = new Vector2(232,439)

class Vector2 {
    x = 0;
    y = 0;
    /**
     * @param {number} x
     * @param {number} y 
    */
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
    get magnitude() {
        return Math.sqrt(x*x + y*y)
    }
    normalize() {
        const mag = this.magnitude;
        this.x /= mag;
        this.y /= mag;
    }
    /** @param {number} amount */
    scale(amount) {
        this.x *= amount
        this.y *= amount
    }
}

class Game {
    size = new Vector2(640,320);
    fps = 60;
    last_frame = performance.now()
    dt = 0;
    target_dt = 0;
    /** @type {Sprite[]} */
    sprites = [];
    /** @type {Player} */
    player;
    constructor() {
        const player = new Player();
        this.target_dt = 1/this.fps;
        this.player = player;
        this.sprites.push(player)
    };
    init() {
        this.player.init(this);
    };
    draw() {
        context.clearRect(0, 0, this.size.x, this.size.y);
        for (const sprite of this.sprites) {
            sprite.draw(this)
        }
    };
    update() {
        const now = performance.now();
        this.dt = (now - this.last_frame) / 1000;
        this.last_frame = now;
        this.player.update(this);
    };
}

class Actor {
    /** @param {Game} game */
    init(game) {

    }
    /** @param {Game} game */
    draw(game) {

    }
    /** @param {Game} game */
    update(game) {

    }
}

class Sprite extends Actor {
    pos = new Vector2(0,0);
    size = new Vector2(0,0);
    src_pos = new Vector2(0,0);
    src_size = new Vector2(0,0);
    /** @type {CanvasImageSource} */
    texture;
    /** 
     * @param {CanvasImageSource} texture
     * @param {Vector2} pos
     * @param {Vector2} size
    */
    constructor(texture,pos,size) {
        this.texture = texture;
        this.pos = pos;
        this.size = size;
    }
    /** @param {Game} game */
    draw(game) {
        context.drawImage(this.texture,this.src_pos.x,this.src_pos.y,this.src_size.x,this.src_size.y,this.pos.x,this.pos.y,this.size.x,this.size.y);
    }
}

class SpriteAnimation {
    /** @type {CanvasImageSource} */
    atlas;
    atlas_size = new Vector2(0,0);
    frames_in_row = 0;
    frame_size = new Vector2(0,0);
    frame_amount = 0;
    /** 
     * @param {number} idx
     * @returns {Vector2}
    */
    get_frame_pos_at_idx(idx) {
        return new Vector2(idx % this.frames_in_row,Math.floor(idx / this.frames_in_row))
    }
    /** 
     * @param {number} idx
     * @returns {Vector2}
    */
    get_sized_frame_pos_at_idx(idx) {
        const frame_pos = get_frame_pos_at_idx(idx)
        frame_pos.x *= this.frame_size.x
        frame_pos.y *= this.frame_size.y
        return frame_pos
    }
}

class AnimatedSprite extends Sprite {
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
    set_animation(id,last_frame) {
        this.animation = id
        this.animation_frame = 0
        this.last_animation_frame_change = last_frame
        const sprite_animation = this.sprite_animations.get(this.animation);
        if (!sprite_animation) {
            return
        }
        this.sprite = sprite_animation.atlas
        this.src_size = sprite_animation.frame_size
    }
    /**
     * @param {CanvasImageSource} texture
     * @param {Vector2} pos
     * @param {Vector2} size
     * @param {string} animation
     * @param {Map<string,SpriteAnimation>} sprite_animations
    */
    constructor(pos,size,animation,sprite_animations) {
        super(null,pos,size);
        this.animation = animation;
        this.sprite_animations = sprite_animations;
    }
    /** @param {Game} game */
    update(game) {
        const sprite_animation = this.sprite_animations.get(this.animation);
        if (!sprite_animation) {
            return;
        }
        this.src_pos = sprite_animation.get_sized_frame_pos_at_idx(this.animation_frame);
        if (game.last_frame - this.last_animation_frame_change >= this.animation_frame_dt) {
            this.animation_frame = (this.animation_frame + 1) % sprite_animation.frame_amount;
            this.last_animation_frame_change = game.last_frame
        }
    }
}

class Player extends AnimatedSprite {
    velocity = new Vector2(0,0);
    speed = 300;
    keys_down = new Map(Object.entries({
        w: false,
        a: false,
        s: false,
        d: false
    }));
    /** @param {Game} game */
    init(game) {
        this.size.x = run_sprite_dimentions.x/5
        this.size.y = run_sprite_dimentions.x/5
        this.pos.x = game.size.x / 2 - this.size.x / 2;
        this.pos.y = game.size.y / 2 - this.size.y / 2;
        this.set_animation("idle",game.last_frame);
        document.addEventListener("keydown", ev => {
            if (this.keys_down.has(ev.key)) {
                this.keys_down.set(ev.key, true);
            }
        });
        document.addEventListener("keyup", ev => {
            if (this.keys_down.has(ev.key)) {
                this.keys_down.set(ev.key, false);
            }
        });
    }
    /** @param {Game} game */
    update(game) {
        const new_velocity = new Vector2(0,0)
        if (this.keys_down.get("w")) {
            new_velocity.y -= this.speed;
        }
        if (this.keys_down.get("a")) {
            new_velocity.x -= this.speed;
        }
        if (this.keys_down.get("s")) {
            new_velocity.y += this.speed;
        }
        if (this.keys_down.get("d")) {
            new_velocity.x += this.speed;
        }
        new_velocity.normalize()
        new_velocity.scale(this.speed)
        this.velocity = new_velocity;
        this.pos.x = Math.max(Math.min(this.pox.x + this.velocity.x * game.dt, game.width - this.size.x), 0);
        this.pos.y = Math.max(Math.min(this.pos.y + this.velocity.y * game.dt, game.height - this.size.y), 0);
        if (this.velocity.x == 0 && this.velocity.y == 0) {
            if (this.animation != "idle") {
                this.set_animation("idle",game.last_frame);
            }
        } else if (this.animation != "run") {
            this.set_animation("run",game.last_frame)
        }
    }
}

const game = new Game();

game.init();

let last_update = performance.now();
function update_game() {
    const now = performance.now();
    if (now - last_update >= game.target_dt) {
        last_update = now;
        game.update();
        game.draw();
    }
    requestAnimationFrame(update_game);
}
requestAnimationFrame(update_game);
