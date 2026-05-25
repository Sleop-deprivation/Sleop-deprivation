/**
 * An animated star. It twinkles and has functions to resize and reposition it.
 */
export class StarSprite {
    /**
     * Creates a new StarSprite.
     * @param {Number} x - The x position to create the sprite.
     * @param {Number} y - The y position to create the sprite.
     * @param {Number} size - The starting size of the sprite.
     * @param {CanvasImageSource} spritesheet - The star's spritesheet (ideally media/star-spritesheet.png)
     */
    constructor(x, y, size, spritesheet) {
        this.resize(size);
        this.reposition(x, y);
        this.animating = false;
        this.animLoopComplete = false;
        this.animState = 0;
        this.spritesheet = spritesheet;
    }

    /**
     * Changes the size of the sprite.
     * @param {Number} newSize - The new size of the sprite.
     */
    resize(newSize) {
        this.size = newSize;
    }

    /**
     * Changes the position of the sprite and resets the sprite's animation state.
     * @param {Number} x - The new x position.
     * @param {Number} y - The new y position.
     */
    reposition(x, y) {
        this.x = x;
        this.y = y;
        this.animating = true;
        this.animLoopComplete = false;
        this.animState = 0;
    }

    /**
     * Updates the sprite's animation state.
     * @param {Number} dt The amount of time passed since the last frame.
     */
    update(dt) {
        this.timer += dt;
        if (this.timer >= 0.125) {
            this.animState++;

            if (this.animState > 7) {
                this.animLoopComplete = true;
                this.animating = false;
            }
            else this.timer = 0;
        }
    }

    /**
     * Manually changes the sprite's timer.
     * @param {Number} newVal - The new value of the timer.
     */
    setTimer(newVal) {
        this.timer = newVal;
    }

    /**
     * Draws the sprite onto the screen.
     * @param {CanvasRenderingContext2D} ctx - The drawing context.
     */
    draw(ctx) {
        if (this.animating) {
            ctx.save();

            let spriteScale = 16 * this.size;
            let spritesheetX = 64;
            switch (this.animState) {
                case 0:
                case 6:
                    spritesheetX = 0;
                    break;
                case 1:
                case 5:
                    spritesheetX = 16;
                    break;
                case 2:
                case 4:
                    spritesheetX = 32;
                    break;
                case 3:
                    spritesheetX = 48;
                    break;
            }
            ctx.drawImage(this.spritesheet, spritesheetX, 0, 16, 16, 
                this.x - spriteScale / 2, this.y - spriteScale / 2, spriteScale, spriteScale);
    
            ctx.restore();
        }
    }
}