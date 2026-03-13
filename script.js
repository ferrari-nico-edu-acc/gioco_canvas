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
const run_sprite_dimentions = {x: 363, y: 458}
const run_spritesheet_frame_positions = [
    [0,0], [run_sprite_dimentions.x,0], [2*run_sprite_dimentions.x,0], [3*run_sprite_dimentions.x,0],
    [0,run_sprite_dimentions.y], [run_sprite_dimentions.x,run_sprite_dimentions.y], [2*run_sprite_dimentions.x,run_sprite_dimentions.y], [3*run_sprite_dimentions.x,run_sprite_dimentions.y],
    [0,2*run_sprite_dimentions.y]
]

/** @type {ImageBitmap?} */
let idle_spritesheet
const idle_spritesheet_image = new Image(1160,878);
idle_spritesheet_image.src = "idle_spritesheet.png";
idle_spritesheet_image.decode().then(async () => {
    idle_spritesheet = await createImageBitmap(idle_spritesheet_image);
})
const idle_sprite_dimentions = {x: 232, y: 439}
const idle_spritesheet_frame_positions = [
    [0,0], [idle_sprite_dimentions.x,0], [2*idle_sprite_dimentions.x,0], [3*idle_sprite_dimentions.x,0], [4*idle_sprite_dimentions.x,0],
    [0,idle_sprite_dimentions.y], [idle_sprite_dimentions.x,idle_sprite_dimentions.y], [2*idle_sprite_dimentions.x,idle_sprite_dimentions.y], [3*idle_sprite_dimentions.x,idle_sprite_dimentions.y], [4*idle_sprite_dimentions.x,0]
]

class Game {
    width = 640;
    height = 320;
    fps = 60;
    last_frame = performance.now()
    dt = 0;
    target_dt = 0;
    /** @type {Player} */
    player;
    constructor(player) {
        this.target_dt = 1/this.fps;
        this.player = player;
    };
    init() {
        this.player.init(this);
    };
    draw() {
        context.clearRect(0, 0, this.width, this.height);
        this.player.draw(this);
    };
    update() {
        const now = performance.now();
        this.dt = (now - this.last_frame) / 1000;
        this.last_frame = now;
        this.player.update(this);
    };
}

class Player {
    pos_x = 0;
    pos_y = 0;
    size_x = run_sprite_dimentions.x/5;
    size_y = run_sprite_dimentions.y/5;
    color = "#ff0000";
    movement_dir_x = 0;
    movement_dir_y = 0;
    speed = 300;
    animation_frame = 0;
    last_animation_frame_change = 0;
    animation_frame_dt = .2;
    animation = "idle";
    keys_down = new Map(Object.entries({
        w: false,
        a: false,
        s: false,
        d: false
    }));
    /** @param {Game} game */
    init(game) {
        this.pos_x = game.width / 2 - this.size_x / 2;
        this.pos_y = game.height / 2 - this.size_y / 2;
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
    draw(game) {
        if (!run_spritesheet || !idle_spritesheet) return
        if (game.last_frame - this.last_animation_frame_change >= this.animation_frame_dt) {
            if (this.animation == "run") {
                this.animation_frame = (this.animation_frame + 1) % 9;
            }
            if (this.animation == "idle") {
                this.animation_frame = (this.animation_frame + 1) % 6;
                console.log(this.animation_frame)
            }
            this.last_animation_frame_change = game.last_frame
        }
        console.log(this.animation)
        if (this.animation == "run")
            context.drawImage(run_spritesheet,run_spritesheet_frame_positions[this.animation_frame][0],run_spritesheet_frame_positions[this.animation_frame][1],
                run_sprite_dimentions.x,run_sprite_dimentions.y,Math.floor(this.pos_x),Math.floor(this.pos_y),this.size_x,this.size_y)
        if (this.animation == "idle")
            context.drawImage(idle_spritesheet,idle_spritesheet_frame_positions[this.animation_frame][0],idle_spritesheet_frame_positions[this.animation_frame][1],
                idle_sprite_dimentions.x,idle_sprite_dimentions.y,Math.floor(this.pos_x),Math.floor(this.pos_y),this.size_x,this.size_y)
    }
    /** @param {Game} game */
    update(game) {
        let new_movement_x = 0;
        let new_movement_y = 0;
        if (this.keys_down.get("w")) {
            new_movement_y -= this.speed;
        }
        if (this.keys_down.get("a")) {
            new_movement_x -= this.speed;
        }
        if (this.keys_down.get("s")) {
            new_movement_y += this.speed;
        }
        if (this.keys_down.get("d")) {
            new_movement_x += this.speed;
        }
        const length = Math.sqrt(new_movement_x * new_movement_x + new_movement_y * new_movement_y);
        if (length > 0) {
            new_movement_x = new_movement_x / length * this.speed;
            new_movement_y = new_movement_y / length * this.speed;
        }
        this.movement_dir_x = new_movement_x;
        this.movement_dir_y = new_movement_y;
        this.pos_x = Math.max(Math.min(this.pos_x + this.movement_dir_x * game.dt, game.width - this.size_x), 0);
        this.pos_y = Math.max(Math.min(this.pos_y + this.movement_dir_y * game.dt, game.height - this.size_y), 0);
        if (this.movement_dir_x == 0 && this.movement_dir_y == 0) {
            if (this.animation != "idle") {
                this.animation = "idle";
                this.animation_frame = 0
                this.last_animation_frame_change = game.last_frame
            }
        } else if (this.animation != "run") {
            this.animation = "run";
            this.animation_frame = 0
            this.last_animation_frame_change = game.last_frame
        }
    }
}

const game = new Game(new Player());

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
