import { SpritesheetLoader, Vector2, Sprite, Ref, AnimatedSprite, SpriteAnimation, BaseGame, CollisionBox, move_toward } from "./engine/index.js"

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
    /**
     * @param {CanvasRenderingContext2D} context
     * @param {Vector2} size 
    */
    constructor(context,size) {
        super(context,size)
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
        const black_square = new Sprite(
            new Ref("black"),
            new Vector2(200,200),
            new Vector2(100,50)
        );
        black_square.setup_default_collision();
        this.add_sprite(black_square);
        this.add_sprite(player);
    };
    update() {
        super.update();
        /*const black_square = this.sprites[0];
        black_square.texture.val = this.check_for_collision(black_square) != null ? "green" : "red";*/
        this.camera_position.x = -this.player.pos.x + this.size.x/2 - this.player.size.x/2
    }
}

class Player extends AnimatedSprite {
    keys_down = [];
    /** @param {Game} game */
    init(game) {
        this.gravity_force = 1400;
        this.size.x = run_spritesheet.sprite_size.x / 5;
        this.size.y = run_spritesheet.sprite_size.x / 5;
        this.pos.x = game.size.x / 2 - this.size.x / 2;
        this.pos.y = game.size.y / 2 - this.size.y / 2;
        this.set_animation("idle", game.last_frame);
        this.setup_default_collision();
        document.addEventListener("keydown", ev => {
            if (!this.keys_down.includes(ev.key)) {
                this.keys_down.push(ev.key);
            }
        });
        document.addEventListener("keyup", ev => {
            if (this.keys_down.includes(ev.key)) {
                this.keys_down.splice(this.keys_down.indexOf(ev.key),1)
            }
        });
    }
    /**
     * @param {Game} game
     * @param {number} dt 
    */
    update(game,dt) {
        super.update(game,dt);
        const movement_vel = Vector2.zero;
        if (this.keys_down.includes("a")) {
            movement_vel.x -= 1;
        }
        if (this.keys_down.includes("d")) {
            movement_vel.x += 1;
        }
        if (movement_vel.x > 0) {
            this.texture_flip_x = false;
        } else if (movement_vel.x < 0) {
            this.texture_flip_x = true;
        }
        this.move(movement_vel,dt,game);
        //game.debug_log.val = this.is_grounded(game)
        if ((this.keys_down.includes("w") || this.keys_down.includes(" ")) && this.is_grounded(game)) {
            this.jump()
        }
        if (this.velocity.is_zero()) {
            if (this.animation != "idle") {
                this.set_animation("idle", game.last_frame);
            }
        } else if (this.animation != "run") {
            this.set_animation("run", game.last_frame);
        }
    }
}

const game = new Game(context,new Vector2(game_canvas.width,game_canvas.height));
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
