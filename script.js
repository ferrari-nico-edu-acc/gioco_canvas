import { SpritesheetLoader, Vector2, Sprite, Ref, AnimatedSprite, SpriteAnimation, BaseGame } from "./engine/index.js"

/** @type {HTMLCanvasElement} */
const game_canvas = document.querySelector("#game_canvas");
const context = game_canvas.getContext("2d");

const idle_spritesheet = new SpritesheetLoader(
    new Vector2(1160, 878),
    "idle_spritesheet.png",
    new Vector2(232, 439),
    5,
    10
);

const run_spritesheet = new SpritesheetLoader(
    new Vector2(1452, 1374),
    "run_spritesheet.png",
    new Vector2(363, 458),
    4,
    10
);

class Game extends BaseGame {
    /** @type {Player} */
    player;
    /** @param {CanvasRenderingContext2D} context */
    constructor(context) {
        super(context)
        const player = new Player(
            new Vector2(),
            new Vector2(),
            new Map(Object.entries({
                idle: new SpriteAnimation(
                    idle_spritesheet.texture,
                    idle_spritesheet.size,
                    idle_spritesheet.frames_in_row,
                    idle_spritesheet.sprite_size,
                    idle_spritesheet.frame_amount
                ),
                run: new SpriteAnimation(
                    run_spritesheet.texture,
                    run_spritesheet.size,
                    run_spritesheet.frames_in_row,
                    run_spritesheet.sprite_size,
                    run_spritesheet.frame_amount
                )
            }))
        );
        this.player = player;
        const blue_square = new Sprite(
            new Ref("blue"),
            new Vector2(10,10),
            new Vector2(100,100)
        );
        this.sprites.push(blue_square);
        this.sprites.push(player);
    };
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
        this.size.x = run_spritesheet.sprite_size.x / 5;
        this.size.y = run_spritesheet.sprite_size.x / 5;
        this.pos.x = game.size.x / 2 - this.size.x / 2;
        this.pos.y = game.size.y / 2 - this.size.y / 2;
        this.set_animation("idle", game.last_frame);
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
        super.update(game);
        const new_velocity = new Vector2();
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
        new_velocity.normalize();
        new_velocity.scale(this.speed);
        this.velocity = new_velocity;
        this.pos.x = Math.max(Math.min(this.pos.x + this.velocity.x * game.dt, game.size.x - this.size.x), 0);
        this.pos.y = Math.max(Math.min(this.pos.y + this.velocity.y * game.dt, game.size.y - this.size.y), 0);
        if (this.velocity.x == 0 && this.velocity.y == 0) {
            if (this.animation != "idle") {
                this.set_animation("idle", game.last_frame);
            }
        } else if (this.animation != "run") {
            this.set_animation("run", game.last_frame);
        }
    }
}

const game = new Game(context);
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
