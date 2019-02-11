/**
 * A simple 2D game framework
 * @author Ethan Elshyeb
 */

class Game {

    /**
     * Creates a Game
     * @param canvas {HTMLCanvasElement} The canvas element to draw to
     * @param sceneRoot {GameObject} The GameObject scene root
     */
    constructor(/** @type HTMLCanvasElement */ canvas, /** @type GameObject **/ sceneRoot) {
        this.canvas = canvas;
        this.ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
        this.sceneRoot = sceneRoot;
        this.sceneRoot.parent = this;
        this.rendering = false;
        this.onFrame = [];
    }

    /**
     * Starts the game, if it is not already running
     */
    start() {
        if(!this.rendering) {
            console.log("Game started");
            this._render();
            this.rendering = true;
        } else console.warn("Game was already started")
    }

    /**
     * Renders a frame and schedules the next frame to be rendered
     * @private You should not call this method directly. Use start() instead.
     */
    _render() {
        this.sceneRoot.draw(this.ctx, 0, 0);
        this.onFrame.forEach((f) => f());
        window.requestAnimationFrame(this._render.bind(this));
    }

    /**
     * Adds a callback to be run on every frame.
     * @param listener The callback to run on every frame.
     */
    addFrameListener(/** @type {Function} */ listener) {
        this.onFrame.push(listener)
    }

    /**
     * Removes a callback added with addFrameListener()
     * @param listener The callback to remove.
     */
    removeFrameListener(/** @type {Function} */ listener) {
        this.onFrame = this.onFrame.filter((f) => f !== listener)
    }

    /**
     * Use for the purpose of the game property of GameObjects
     * @returns {Game} This game object.
     */
    get game() { return this; }

    /**
     * @returns The width in physical pixels of this game
     */
    get width() { return this.canvas.width; }

    /**
     * @returns {number} The height in physical pixels of this game
     */
    get height() { return this.canvas.height; }
}

/**
 * A base GameObject draws its children GameObjects.
 */
class GameObject {

    /**
     * Creates a GameObject.
     * @param x The starting x-coordinate.
     * @param y The starting y-coordinate.
     * @param children {Array<GameObject>} The list of children.
     */
    constructor(
        /** @type {number} */ x,
        /** @type {number} */ y,
        /** @type {Array} */ children) {
        this.x = x;
        this.y = y;
        this.children = children.map((child) => {
            child.parent = this; child.attach(); return child;
        });
        this.parent = null;
        this.collider = new Collider();
    }

    /**
     * Use for making Scenes.
     * @returns {GameObject} a GameObject at (0,0) with a default Collider and no children.
     */
    static newDefault() {
        return new GameObject(0, 0, []);
    }

    /** Fires when this GameObject has been attached to a parent */
    attach() {}

    /**
     * Draws this GameObject at an offset of xoff, yoff on ctx.
     */
    draw(/** @type CanvasRenderingContext2D */ ctx, /** @type {number} */ xoff, /** @type {number} */ yoff) {
        this.children.forEach((child) => child.draw(ctx, this.x + xoff, this.y + yoff));
    }

    /**
     * Returns the Game that this object is attached to, if any
     * @returns {Game}
     */
    get game() {
        return this.parent.game;
    }

    /**
     * Only works for objects with a reduced offset of (0, 0)
     * @returns {boolean} whether this GameObject is outside the viewport.
     */
    get outsideViewport() {
        return this.x < 0 || this.y < 0 || this.x > this.game.width || this.y > this.game.height;
    }

    /**
     * Adds a GameObject to this GameObject's list of children
     * Will reparent and call GameObject.attach() on the child to be added.
     *
     * @param child {GameObject} The GameObject to add as a child
     */
    addChild(/** @type GameObject **/ child) {
        child.parent = this;
        child.attach();
        this.children.push(child);
    }

    /**
     * Gets one of this GameObject's children
     * @param where The filter function to execute on each child
     * @returns {*|GameObject}
     */
    getChild(/** @type {Function}*/ where) {
        for(let i=0; i<this.children.length; i++) {
            if(where(this.children[i])) return this.children[i];
        }
    }

    /**
     * Removes child from this GameObject's list of children
     * This function is relatively slow, use with care.
     * @param child The GameObject child to remove
     */
    removeChild(/** @type GameObject **/ child) {
        this.children = this.children.filter((c) => c !== child);
    }

    /**
     * Removes children from this GameObject based on a filter.
     * @param filter The filter function to execute on each GameObject.
     */
    removeChildren(/** @type Function */ filter) {
        this.children = this.children.filter(filter);
    }

    /**
     * Checks if this GameObject overlaps another GameObject
     * @param other
     * @returns {boolean}
     */
    doesOverlap(/** @type GameObject */ other) {
        return this.collider.checkOverlap(other.collider);
    }

    isInside(/** @type GameObject */ other) {
        return this.collider.checkInside(other.collider);
    }

    doesContain(/** @type GameObject */ other) {
        return other.isInside(this);
    }

    findOverlaps(/** @type GameObject */ other) {
        let found = [];
        if (this.doesOverlap(other)) found.push(this);
        this.children.forEach((child) => {
            if (child.doesOverlap(other)) {
                found.push(child);
            }
        });
        return found;
    }
}

/**
 * Default implementation of Collider that does not collide.
 */
class Collider {

    constructor() {}

    /**
     * Checks if this Collider overlaps other Collider
     * @param other The other Collider
     */
    checkOverlap(/** @type Collider */ other) {
        return false; // Stub
    }

    /**
     * Checks if this Collider is inside other Collider
     * @param other The other Collider
     */
    checkInside(/** @type Collider */ other) {
        return false; // Stub
    }
}

class RectCollider extends Collider {

    constructor(x, y, width, height) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    checkOverlap(/** @type Collider */ other) {
        if (other instanceof RectCollider) {
            return !(this.x > other.x + other.width ||
                this.x + this.width < other.x ||
                this.y > other.y + other.height ||
                this.y + this.height < other.y)
        } else return false;
    }

    checkInside(/** @type Collider */ other) {
        if (other instanceof RectCollider) {
            return (this.x > other.x && this.y > other.y
                && this.x + this.width < other.x + other.width
                && this.y + this.height < other.y + other.height);
        } else return false;
    }

}

class ColorBackground extends GameObject {
    constructor(color) {
        super(0, 0, []);
        this.color = color;
    }

    draw(/** @type CanvasRenderingContext2D */ ctx, /** @type {number} */ xoff, /** @type {number} */ yoff) {
        super.draw(ctx, xoff, yoff);
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.game.width, this.game.height);
    }
}

class TextObject extends GameObject {

    constructor(x, y, text, color, font, fill = true) {
        super(x, y, []);
        this.text = text;
        this.color = color;
        this.font = font;
        this.fill = fill;
    }
    draw(/** @type CanvasRenderingContext2D */ ctx, /** @type {number} */ xoff, /** @type {number} */ yoff) {
        super.draw(ctx, xoff, yoff);
        ctx.font = this.font;

        if(this.fill) {
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, this.x + xoff, this.y + yoff);
        } else {
            ctx.strokeStyle = this.color;
            ctx.strokeText(this.text, this.x + xoff, this.y + yoff);
        }
    }
}