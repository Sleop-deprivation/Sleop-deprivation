class Player extends PIXI.AnimatedSprite {
    constructor(initialAnimation, x = 4, y = 2) {
        super(initialAnimation);
        // Variables
        this.xPos = x;
        this.yPos = y;

        this.scale.set(3.75);
        this.x = 15 + 75 * this.xPos;
        this.y = 10 + 75 * this.yPos;
        this.zIndex = 2;

        this.hp = 50;
        this.mp = 20;
        this.atk = 5;
        super.loop = true;
        super.animationSpeed = 0.25;
    }

    // Moves the player towards (x, y) on the map array.
    moveBy(x, y) {
        this.x += x;
        this.y += y;
    }

    // Snaps the player to (x, y) on the map array.
    snapTo(x, y) {
        this.xPos = x;
        this.yPos = y;
        this.x = 10 + 75 * this.xPos;
        this.y = 10 + 75 * this.yPos;
    }
}

class Enemy extends PIXI.Sprite {
    constructor(x = 6, y = 5, hp = 12, atk = 7) {
        super(app.loader.resources["media/PlayerCharacter.png"].texture);
        // Variables
        this.xPos = x;
        this.yPos = y;

        this.scale.set(3.75);
        this.x = 15 + 75 * this.xPos;
        this.y = 10 + 75 * this.yPos;
        this.zIndex = 2;

        this.hp = hp;
        this.atk = atk;
    }

    // Turns the enemy sprite into a smoke cloud for use in battle.
    becomeSmoke(smokeTexture) {
        super.texture = smokeTexture;
        this.anchor.set(0.5);
        this.scale.set(2.5);
        this.x += 30;
        this.y += 34;
    }

    // Reverts the enemy to their original sprite.
    revertSprite() {
        super.texture = app.loader.resources["media/PlayerCharacter.png"].texture;
        this.anchor.set(0);
        this.scale.set(3.75);
        this.x -= 30;
        this.y -= 34;
        this.angle = 0;
    }
}

class BattleUI extends PIXI.Graphics {
    constructor(scene) {
        super();
        this.beginFill(0x3f48cc);
        this.drawRoundedRect(0, -100, 600, 100, 25);
        this.endFill();
        this.textStyle = new PIXI.TextStyle({
            fill: 0xFFFFFF,
            fontSize: 20,
            fontFamily: "Nerko One",
            strokeThickness: 4
        });
        scene.addChild(this);
        // Creates the display text and adds that to the scene too.
        this.displayText = new PIXI.Text();
        this.displayText.style = this.textStyle;
        this.displayText.anchor.set(0);
        this.displayText.x = 50;
        this.displayText.y = -87;
        scene.addChildAt(this.displayText, scene.children.length);
        this.displayText.text = "Player HP: 100/100" +
            "\nPlayer MP: 50" +
            "\nEnemy HP: 10";
        // Finally, a cursor is made as well.
        this.cursor = new PIXI.Sprite();
        this.cursor.x = 25;
        scene.addChildAt(this.cursor, scene.children.length);
    }

    updateStats(playerHP, playerMP, enemyHP) {
        if (playerHP <= 0)
            playerHP = "Defeated..."
        if (enemyHP <= 0)
            enemyHP = "Defeated!";
        this.displayText.text = "Player HP: " + playerHP + "/50" +
        "\nPlayer MP: " + playerMP +
        "\nEnemy HP: " + enemyHP;
    }

    changeYPosBy(y) {
        this.y += y;
        this.displayText.y += y;
        this.cursor.y += y;
    }

    changeCursor(phase, sprite, scale) {
        if (phase === "player") {
            this.cursor.y =  this.y - 83;
        }
        else if (phase === "enemy") {
            this.cursor.y = 69;
        }
        this.cursor.texture = sprite;
        this.cursor.scale.set(scale);
    }
}

class TextBox extends PIXI.Graphics {
    constructor(scene, startingX, startingY, width, height, text) {
        super();
        this.beginFill(0x3f48cc);
        this.drawRoundedRect(startingX, startingY, width, height, 25);
        this.endFill();
        this.textStyle = new PIXI.TextStyle({
            fill: 0xFFFFFF,
            fontSize: 20,
            fontFamily: "Nerko One",
            strokeThickness: 4
        });
        scene.addChild(this);
        this.zIndex = 5;

        this.displayText = new PIXI.Text();
        this.displayText.style = this.textStyle;
        this.displayText.anchor.set(0.5);
        this.displayText.x = startingX + width/2;
        this.displayText.y = startingY + height/2;
        scene.addChildAt(this.displayText, scene.children.length);
        this.displayText.text = text;
        this.displayText.zIndex = 6;

        this.enabled = false;
    }

    moveBy(x, y) {
        this.x += x;
        this.y += y;
        this.displayText.x += x;
        this.displayText.y += y;
    }
}