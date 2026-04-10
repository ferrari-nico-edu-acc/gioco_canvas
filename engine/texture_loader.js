import { Ref, Vector2 } from "./datatypes.js";

export class TextureLoader {
    /** @type {Ref<ImageBitmap?>} */
    texture = new Ref(null);
    size = Vector2.zero;
    src = "";
    /**
     * @param {Vector2} size
     * @param {string} src
     */
    constructor(size, src) {
        this.size = size;
        this.src = src;
        const image = new Image(this.size.x, this.size.y);
        image.src = this.src;
        image.decode().then(async () => {
            this.texture.val = await createImageBitmap(image);
        });
    }
}

export class SpritesheetLoader extends TextureLoader {
    sprite_size = Vector2.zero;
    frames_in_row = 0;
    frame_amount = 0;
    /**
     * @param {Vector2} size
     * @param {string} src
     * @param {Vector2} sprite_size
     * @param {number} frames_in_row
     * @param {number} frame_amount
     */
    constructor(size, src, sprite_size, frames_in_row, frame_amount) {
        super(size, src);
        this.sprite_size = sprite_size;
        this.frames_in_row = frames_in_row;
        this.frame_amount = frame_amount;
    }
}