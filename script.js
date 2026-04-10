import { SpritesheetLoader, Vector2, Sprite, Ref, AnimatedSprite, SpriteAnimation, BaseGame, CollisionBox } from "./engine/index.js"

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
            Vector2.zero,
            Vector2.zero,
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
            new Vector2(200,200),
            new Vector2(100,100)
        );
        blue_square.setup_default_collision();
        blue_square.debug_render_collision_boxes = true;
        player.debug_render_collision_boxes = true;
        this.add_sprite(blue_square);
        this.add_sprite(player);
    };
    update() {
        super.update();
        const blue_square = this.sprites[0];
        blue_square.texture.val = this.check_for_collision(blue_square) != null ? "green" : "red";
    }
}

class Player extends AnimatedSprite {
    speed = 300;
    jump_height = 2000;
    last_movement_vel = Vector2.zero;
    keys_down = new Map(Object.entries({
        w: false,
        a: false,
        s: false,
        d: false
    }));
    /** @param {Game} game */
    init(game) {
        this.gravity_force = 20;
        this.size.x = run_spritesheet.sprite_size.x / 5;
        this.size.y = run_spritesheet.sprite_size.x / 5;
        this.pos.x = game.size.x / 2 - this.size.x / 2;
        this.pos.y = game.size.y / 2 - this.size.y / 2;
        this.set_animation("idle", game.last_frame);
        this.setup_default_collision();
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
    /**
     * @param {Game} game
     * @param {number} dt 
    */
    update(game,dt) {
        super.update(game,dt);
        this.velocity.subbed(this.last_movement_vel); //TODO fix against walls
        this.last_movement_vel.subbed(this.last_movement_vel)
        if (this.keys_down.get("a")) {
            this.last_movement_vel.x -= this.speed;
        }
        if (this.keys_down.get("d")) {
            this.last_movement_vel.x += this.speed;
        }
        if (this.keys_down.get("w")) {
            this.last_movement_vel.y -= this.speed;
        }
        if (this.keys_down.get("s")) {
            this.last_movement_vel.y += this.speed/3;
        }
        this.last_movement_vel.normalize();
        this.last_movement_vel.scale(this.speed);
        this.velocity.added(this.last_movement_vel);
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
