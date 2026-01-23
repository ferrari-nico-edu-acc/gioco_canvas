/** @type {HTMLCanvasElement} */
const game_canvas = document.querySelector("#game_canvas");
const context = game_canvas.getContext("2d");

class Game {
    width = 640;
    height = 320;
    fps = 60;
    get dt() {
        return 1 / this.fps;
    };
    /** @type {Player} */
    player;
    constructor(player) {
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
        this.player.update(this);
    };
}

class Player {
    pos_x = 0;
    pos_y = 0;
    size = 50;
    color = "#ff0000";
    movement_dir_x = 0;
    movement_dir_y = 0;
    speed = 45;
    keys_down = new Map(Object.entries({
        w: false,
        a: false,
        s: false,
        d: false
    }));
    /** @param {Game} game */
    init(game) {
        this.pos_x = game.width / 2 - this.size / 2;
        this.pos_y = game.height / 2 - this.size / 2;
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
        context.fillStyle = this.color;
        context.fillRect(Math.floor(this.pos_x), Math.floor(this.pos_y), this.size, this.size);
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
        this.pos_x = Math.max(Math.min(this.pos_x + this.movement_dir_x * game.dt, game.width - this.size), 0);
        this.pos_y = Math.max(Math.min(this.pos_y + this.movement_dir_y * game.dt, game.height - this.size), 0);
    }
}

const game = new Game(new Player());

game.init();

setInterval(() => {
    game.update();
    game.draw();
}, game.dt);
