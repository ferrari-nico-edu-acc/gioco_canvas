import { SpritesheetLoader, Vector2, Sprite, Ref, AnimatedSprite, SpriteAnimation, BaseGame, TextureLoader } from "./engine/index.js"

/** @type {HTMLCanvasElement} */
const game_canvas = document.querySelector("#game_canvas");
const context = game_canvas.getContext("2d");
context.imageSmoothingEnabled = false

const tile_size = 48
const tiles = [
    "",
    " & ",
    "",
    "?&?",
    "      ",
    "     &&",
    "    &&&"
]
const tile_x_offset = 3 * tile_size

const smb_tileset = new TextureLoader(
    new Vector2(680,776),
    "smb_tileset.png"
)

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

/**
 * @param {number} column
 * @param {number} row
 * @param {Vector2} src_pos
 * @param {Game} game
*/
function create_tile(column,row,src_pos,game) {
    const y_offset = game.size.y - tiles.length * tile_size
    return new Sprite(smb_tileset.texture,new Vector2(tile_x_offset + column * tile_size,y_offset + row * tile_size),new Vector2(tile_size,tile_size),src_pos,new Vector2(16,16))
}

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
        this.add_sprite(player);
        for (let row = 0; row < tiles.length; row++) {
            const row_tiles = tiles[row].split("")
            for (let column = 0; column < row_tiles.length; column++) {
                const tile = row_tiles[column];
                switch (tile) {
                    case " ":
                        break
                    case "&":
                        const breakable_block = create_tile(column,row,new Vector2(17,16),this);
                        breakable_block.setup_default_collision();
                        this.add_sprite(breakable_block);
                        breakable_block.hit.connect(() => {
                            /** @type {import("./engine/game.js").CollisionInfo} */
                            let collision;
                            //TODO
                            this.sprites.splice(this.sprites.indexOf(breakable_block),1)
                        })
                        break
                    case "?":
                        const question_block = create_tile(column,row,new Vector2(298,78),this);
                        question_block.setup_default_collision();
                        this.add_sprite(question_block);
                        break
                }
            }
        }
    };
    update() {
        super.update();
        this.camera_position.x = -this.player.pos.x + this.size.x/2 - this.player.size.x/2 - this.size.x/8
    }
}

class Player extends AnimatedSprite {
    keys_down = [];
    /** @param {Game} game */
    init(game) {
        super.init(game);
        this.gravity_force = 1400;
        this.collision_sensor = true;
        this.collision_steps = 3;
        this.size.x = run_spritesheet.sprite_size.x / 5;
        this.size.y = run_spritesheet.sprite_size.x / 5;
        this.pos.y = game.size.y - this.size.y;
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
        const is_grounded = this.is_grounded(game)
        if ((this.keys_down.includes("w") || this.keys_down.includes(" ")) && is_grounded) {
            this.jump()
        }
        if (this.velocity.is_zero() && is_grounded) {
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
