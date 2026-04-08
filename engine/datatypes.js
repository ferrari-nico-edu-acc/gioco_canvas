/** @template T */
export class Ref {
    /** @type {T} */
    val;
    /** @param {T} val */
    constructor(val) {
        this.val = val;
    }
}

export class Vector2 {
    x = 0;
    y = 0;
    /**
     * @param {number?} x
     * @param {number?} y 
    */
    constructor(x, y) {
        this.x = x ?? 0;
        this.y = y ?? 0;
    }
    get magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        const mag = this.magnitude;
        if (mag <= 0) {
            return;
        }
        this.x /= mag;
        this.y /= mag;
    }
    /** @param {number} amount */
    scale(amount) {
        this.x *= amount;
        this.y *= amount;
    }
    /**
     * @param {Vector2} other_vec
     * @returns {Vector2}
    */
    add(other_vec) {
        return new Vector2(this.x + other_vec.x, this.y + other_vec.y);
    }
}

export class CollisionBox {
    enabled = true;
    pos = new Vector2();
    size = new Vector2();
    /** 
     * @param {Vector2} pos
     * @param {Vector2} size
    */
    constructor(pos, size) {
        this.pos = pos;
        this.size = size;
    }
    /**
     * @param {CollisionBox} other
     * @param {Vector2} self_offset
     * @param {Vector2} other_offset
     * @returns {boolean}
    */
    collides_with(other,self_offset,other_offset) {
        const self_pos = this.pos.add(self_offset)
        const other_pos = other.pos.add(other_offset)
        return self_pos.x < other_pos.x + other.size.x &&
            self_pos.x + this.size.x > other_pos.x &&
            self_pos.y > other_pos.y + other.size.y &&
            self_pos.y + this.size.y < other_pos.y
    }
}