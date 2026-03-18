/** @type {HTMLCanvasElement} */
const game_canvas = document.querySelector("#game_canvas");
const context = game_canvas.getContext("2d");

/** @template T */
class Referenced {
    /** @type {T} */
    value;
    /** @param {T} value */
    constructor(value) {
        this.value = value;
    }
}

class Vector2 {
    x = 0;
    y = 0;
    /**
     * @param {number?} x
     * @param {number?} y 
    */
    constructor(x,y) {
        this.x = x ?? 0;
        this.y = y ?? 0;
    }
    get magnitude() {
        return Math.sqrt(this.x*this.x + this.y*this.y)
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

class TextureLoader {
    /** @type {Referenced<ImageBitmap?>} */
    texture = new Referenced(null);
    size = new Vector2();
    src = "";
    /**
     * @param {Vector2} size
     * @param {string} src
     */
    constructor(size,src) {
        this.size = size;
        this.src = src;
        const image = new Image(this.size.x,this.size.y);
        image.src = this.src
        image.decode().then(async () => {
            this.texture.value = await createImageBitmap(image)
        })
    }
}

class SpritesheetLoader extends TextureLoader {
    sprite_size = new Vector2()
    /**
     * @param {Vector2} size
     * @param {Vector2} sprite_size
     * @param {string} src
     */
    constructor(size,sprite_size,src) {
        this.sprite_size = sprite_size
        super(size,src)
    }
}

const idle_spritesheet = new SpritesheetLoader(
    new Vector2(1160,878),
    new Vector2(232,439),
    "idle_spritesheet.png"
)

const run_spritesheet = new SpritesheetLoader(
    new Vector2(1452,1374),
    new Vector2(363,458),
    "run_spritesheet.png"
)

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
        const player = new Player(
            new Vector2(),
            new Vector2(),
            new Map(Object.entries({
                idle: new SpriteAnimation(
                    idle_spritesheet,

                )
            }))
        );
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
    pos = new Vector2();
    size = new Vector2();
    src_pos = new Vector2();
    src_size = new Vector2();
    /** @type {Referenced<CanvasImageSource?>} */
    texture;
    /** 
     * @param {Referenced<CanvasImageSource?>} texture
     * @param {Vector2} pos
     * @param {Vector2} size
    */
    constructor(texture,pos,size) {
        super()
        this.texture = texture;
        this.pos = pos;
        this.size = size;
    }
    /** @param {Game} game */
    draw(game) {
        if (!this.texture.value) {
            return
        }
        context.drawImage(this.texture.value,this.src_pos.x,this.src_pos.y,this.src_size.x,this.src_size.y,this.pos.x,this.pos.y,this.size.x,this.size.y);
    }
}

class SpriteAnimation {
    /** @type {Referenced<CanvasImageSource?>} */
    atlas;
    atlas_size = new Vector2();
    frames_in_row = 0;
    frame_size = new Vector2();
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
    /**
     * @param {Referenced<CanvasImageSource?>} atlas 
     * @param {Vector2} atlas_size 
     * @param {number} frames_in_row 
     * @param {Vector2} frame_size 
     * @param {number} frame_amount 
     */
    constructor(atlas,atlas_size,frames_in_row,frame_size,frame_amount) {
        this.atlas = atlas
        this.atlas_size = atlas_size
        this.frames_in_row = frames_in_row
        this.frame_size = frame_size
        this.frame_amount = frame_amount
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
     * @param {Referenced<CanvasImageSource?>} texture
     * @param {Vector2} pos
     * @param {Vector2} size
     * @param {string} animation
     * @param {Map<string,SpriteAnimation>} sprite_animations
    */
    constructor(pos,size,sprite_animations) {
        super(null,pos,size);
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
    velocity = new Vector2();
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
        const new_velocity = new Vector2()
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
        this.pos.x = Math.max(Math.min(this.pos.x + this.velocity.x * game.dt, game.width - this.size.x), 0);
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
