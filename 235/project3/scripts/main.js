"use strict";
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

// Takes keyboard input and returns a string based on the keycode.
let keyboardToDirection = (e) => {
    let returnString = "null";
    switch(e.code) {
        case "KeyS":
        case "ArrowDown":
            returnString = "down";
            break;
        case "KeyW":
        case "ArrowUp":
            returnString = "up";
          break;
        case "KeyA":
        case "ArrowLeft":
            returnString = "left";
            break;
        case "KeyD":
        case "ArrowRight":
            returnString = "right";
            break;
        case "Space":
            returnString = "space";
            break;
        case "KeyF":
            returnString = "f";
            break;
        case "KeyH":
            returnString = "h";
            break;
        case "KeyP":
            returnString = "p";
            break;
        case "Backspace":
            returnString = "back";
            break;
        case "Escape":
            returnString = "esc";
            break;
    }
    currentInput = returnString;
}

// Game vars
let map;

let player;
let paused = false;
let currentInput = "";
let stage;
let gameScene;
let titleScene;
let gameOverScene;
let gameOverLabel;
let scoreDisplayLabel;
let state = "overworld";
let instructionsTextbox;
let instructionsShown = false;
let enemiesKilled = 0;

let battleTimer = 1;
let battlePhase;
let battleUi;
let battleMenu;
let numOfPotions = 1;
let heart;
let cursor;
let fireSprite;

let groundTiles = new Array;
let treeTile;
let caveTile;
let enemySprite;
let potionSprite;
let playerSpritesheet;
let smokeCloud;
let enemy;
let potion;
let potionGetText;
let mapId = 1;
let movementDirection = "null";
let movementStepsRemaining = 0;
let potionsClaimed = new Array;

let attackSfx1;
let attackSfx2;
let attackSfx3;
let bgm;
let victoryTheme;
let gameOverTheme;
let footstep1;
let footstep2;
let fire;
let heal;
let menuOpen;
let menuClose;
let itemGet;

// Create a new Pixi application
// https://pixijs.download/release/docs/PIXI.Application.html
const app = new PIXI.Application(
    {
        width: 600,
        height: 600
    }
);

// Append its "view" (a <canvas> tag that it created for us) to the DOM
document.body.appendChild(app.view);

// Prepare the document with the onload and onkeydown events.
document.body.onkeydown = keyboardToDirection;

// pre-load the images
app.loader.
    add([
        "media/PlayerCharacterSheet.png",
        "media/GroundSpritesheet.png",
        "media/LargeFlame.png",
        "media/ruby.png",
        "media/titlescreen.png",
        "media/smokecloud.png",
        "media/cursor.png",
        "media/heart.png",
        "media/PlayerCharacter.png"
    ]);
app.loader.onComplete.add(initialize);
app.loader.load();

// The game loop. Deals with player movement and battles.
function gameLoop() {
	if (paused) { 
        return;
    }
	
	// Calculate delta time
    let dt = 1/app.ticker.FPS;
    if (dt > 1/12) { 
        dt=1/12;
    }

    // In overworld
    if (state === "overworld")
    {
        // If the player is currently moving, make them move
        if (movementStepsRemaining > 0) 
            movePlayer();
        
        // Otherwise, perform whatever action is necessary for the current tile and await the next input
        else {
            // Read keyboard input to move
            if (currentInput !== "")
                readDirectionalInput();

            // React to the player's current tile
            reactToCurrentTile();
        }

        // Move the battle UI upwards if it's visible
        if (battleUi.y > 0)
            battleUi.changeYPosBy(-5);
    }
    // In battle
    else if (state === "battle")
        combat(dt);
}

// Creates a map from the current map array
function drawMap() {
    let sprite;
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            // 3 represents a tree tile, everything else is a ground tile
            if (map[y][x] === 3) {
                sprite = new PIXI.Sprite(treeTile);
            }
            else if (map[y][x] === 6) {
                sprite = new PIXI.Sprite(caveTile);
            }
            else if (map[y][x] < 3) {
                sprite = new PIXI.Sprite(groundTiles[map[y][x]]);
            }
            else {
                sprite = new PIXI.Sprite(groundTiles[0]);
            }
            sprite.x = 75 * x;
            sprite.y = 75 * y;
            sprite.zIndex = -1;
            sprite.scale.set(4.6875);
            gameScene.addChild(sprite);

            // Spawn an enemy at any point marked with a 2
            if (map[y][x] === 5) {
                spawnEnemy(x, y);
            }

            // Spawn a chest at every point marked with a 4 if the room's potion is unclaimed
            if (map[y][x] === 4 && !(potionsClaimed.includes(mapId))) {
                potion = new PIXI.Sprite(potionSprite);
                potion.x = 20 + 75 * x;
                potion.y = 15 + 75 * y;
                potion.scale.set(4.6875);
                gameScene.addChild(potion);
            }
        }
    }
}

// Initializes the game and all of the required scenes.
function initialize() {
    // Prepare the stage
    stage = app.stage;

    //#region Load textures
    let ground = loadSpritesheet("media/GroundSpritesheet.png", 16, 16, 8)
    groundTiles.push(ground[2]);
    groundTiles.push(ground[1]);
    groundTiles.push(ground[3]);
    treeTile = ground[0];
    caveTile = ground[6];
    potionSprite = app.loader.resources["media/ruby.png"].texture;
    playerSpritesheet = loadSpritesheet("media/PlayerCharacterSheet.png", 16, 16, 24);
    smokeCloud = app.loader.resources["media/smokecloud.png"].texture;
    heart = app.loader.resources["media/heart.png"].texture;
    cursor = app.loader.resources["media/cursor.png"].texture;
    fireSprite = app.loader.resources["media/LargeFlame.png"].texture;
    //#endregion

    //#region Set up title scene
    titleScene = new PIXI.Container();
    stage.addChild(titleScene);
    let titleScreenSprite = app.loader.resources["media/titlescreen.png"].texture;
    let titleScreen = new PIXI.Sprite(titleScreenSprite);
    titleScene.addChild(titleScreen);
    //#endregion

    //#region Set up the game over scene
    gameOverScene = new PIXI.Container();
    stage.addChild(gameOverScene);
    // The background color
    let backgroundColor = new PIXI.Graphics();
    backgroundColor.beginFill(0x001f09);
    backgroundColor.drawRect(0, 0, 600, 600);
    backgroundColor.endFill();
    backgroundColor.zIndex = 4;
    gameOverScene.addChild(backgroundColor);
    // Game over text
    gameOverLabel = new PIXI.Text();
    gameOverLabel.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 40,
        fontFamily: "Nerko One",
        strokeThickness: 4,
        align: "center"
    });
    gameOverLabel.x = 300;
    gameOverLabel.y = 150;
    gameOverLabel.anchor.set(0.5);
    gameOverLabel.zIndex = 5;
    gameOverScene.addChild(gameOverLabel);
    // Final score text
    scoreDisplayLabel = new PIXI.Text();
    scoreDisplayLabel.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 20,
        fontFamily: "Nerko One",
        strokeThickness: 4,
        align: "center"
    });
    scoreDisplayLabel.x = 300;
    scoreDisplayLabel.y = 350;
    scoreDisplayLabel.anchor.set(0.5);
    gameOverScene.addChild(scoreDisplayLabel);
    scoreDisplayLabel.zIndex = 5;
    gameOverScene.visible = false;
    gameOverScene.sortChildren();
    //#endregion

    //#region Set up the game scene
    gameScene = new PIXI.Container();
    stage.addChild(gameScene);
    player = new Player(getDirectionalSpriteSheet("down"));
    gameScene.addChild(player);
    map = getRoomById(1);
    drawMap();
    createDisplays();
    gameScene.sortChildren();
    gameScene.visible = false;
    app.ticker.add(gameLoop);
    //#endregion

    //#region Load sound effects and music
    attackSfx1 = new Howl({
        src: ['audio/hit1.wav']
    });
    attackSfx2 = new Howl({
        src: ['audio/hit2.wav']
    });
    attackSfx3 = new Howl({
        src: ['audio/hit3.wav']
    });
    bgm = new Howl({
        src: ['audio/Inescapable Fate.wav']
    });
    victoryTheme = new Howl({
        src: ['audio/Triumph.wav']
    });
    gameOverTheme = new Howl({
        src: ['audio/Game Over.mp3']
    });
    fire = new Howl({
        src: ['audio/fire.wav']
    });
    heal = new Howl({
        src: ['audio/heal.wav']
    });
    footstep1 = new Howl({
        src: ['audio/footstep1.wav']
    });
    footstep2 = new Howl({
        src: ['audio/footstep2.wav']
    });
    menuOpen = new Howl({
        src: ['audio/menuopen.wav']
    });
    menuClose = new Howl({
        src: ['audio/menuclose.wav']
    });
    
    itemGet = new Howl({
        src: ['audio/getitem.wav']
    });
    //#endregion

    // Start playing background music
    // bgm.loop(true);
    // bgm.play();
    // BGM and sound effects are copyrighted, don't want to deal with that stuff
} 

// Loads the given spritesheet, splicing it based on width, height, and the number of frames.
function loadSpritesheet(reference, width, height, numFrames) {
    let spritesheet = PIXI.BaseTexture.from(reference);
    let textures = [];
    for (let i = 0; i < numFrames; i++) {
        let frame = new PIXI.Texture(spritesheet, new PIXI.Rectangle(i * width, 0, width, height));
        textures.push(frame);
    }
    return textures;
}

// Creates all textboxes needed for the game and adds them to the game scene.
function createDisplays() {
    battleUi = new BattleUI(gameScene);
    battleMenu = new TextBox(gameScene, -300, 300, 300, 200, 
        "Choose an option:");
    potionGetText = new TextBox(gameScene, 0, -50, 600, 50,
        "Got a potion!");
        potionGetText.displayText.style.fontSize = 25;
    instructionsTextbox = new TextBox(gameScene, 50, 50, 500, 500,
        "Welcome to the forest! Here are some tips to keep in mind:\n\n" +
        "- Use WASD or arrow keys to move in the overworld.\n" +
        "- The gems you see in the overworld are potions!\n   Pick them up by walking to them.\n" +
        "- Your goal is to make your way to the cave deep\n   within the forest.\n\n" +
        "- In battle, you and the enemy will fight automatically,\n   no input required.\n" +
        "- Press Space in-battle to open the battle menu,\n   where you can cast spells or use potions.\n" +
        "- You can only cast spells if you have enough MP\n   and can only use potions if you have any remaining, though.\n\n" +
        "Once you reach the cave, you will be given a final score\nrepresentative of how many enemies you killed and\n" +
        "how much health you have left.Manage your resources carefully\nto win and get the high score, but don't\n" +
        "over-extend yourself and end up wiping before the end!\n\n" +
        "Press any key to leave this menu, and press Escape\nin the overlorld to bring it up again.");
    instructionsTextbox.displayText.style.fontSize = 16;
}

// Creates a new enemy at x,y on the map array and adds it to the scene.
function spawnEnemy(x, y) {
    enemy = new Enemy(x, y)
    gameScene.addChild(enemy);
}

// Draws a new map given its id and removes the old map.
function drawMapById(id) {
    map = getRoomById(id);
    let i = 0;
    // Clear the game scene of all previous tiles to save space and performance
    while (i < gameScene.children.length) {
        if (!(gameScene.children[i] instanceof Player) && !(gameScene.children[i] instanceof BattleUI) && 
                !(gameScene.children[i] instanceof TextBox) && !(gameScene.children[i] instanceof PIXI.Text) &&
                (gameScene.children[i] !== battleUi.cursor)) {
            gameScene.removeChildAt(i);
            i--;
        }
        i++;
    }
    drawMap();
    gameScene.sortChildren();
}

// Moves the player slightly towards the next tile, and when they get to the tile, stops their movement.
function movePlayer() {
    movementStepsRemaining --;
    if (movementDirection === "up") {
        player.moveBy(0, -15);
        if (movementStepsRemaining === 0)
            player.snapTo(player.xPos, player.yPos - 1);
    }
    if (movementDirection === "down") {
        player.moveBy(0, 15);
        if (movementStepsRemaining === 0)
            player.snapTo(player.xPos, player.yPos + 1);
    }
    if (movementDirection === "left") {
        player.moveBy(-15, 0);
        if (movementStepsRemaining === 0)
            player.snapTo(player.xPos - 1, player.yPos);
    }
    if (movementDirection === "right") {
        player.moveBy(15, 0);
        if (movementStepsRemaining === 0)
            player.snapTo(player.xPos + 1, player.yPos);
    }
//    if (movementStepsRemaining === 4)
//        footstep2.play();
//    else if (movementStepsRemaining === 0)
//        footstep1.play();
}

// Takes the current directional/WASD input, starts moving the player accordingly, and resets the input string.
// Also hides the "Potion Get!" and instructions textboxes if either are visible, as well as the title/game over screens.
function readDirectionalInput() {
    // Hides potion get textbox if it's visible
    if (potionGetText.y > 0)
        potionGetText.moveBy(0, -50);
    // Ditto for the title screen and game over screen, represented as a seperate function.
    if (titleScene.visible || gameOverScene.visible) {
        resetGame();
        return;
    }
    // Also hides the instructions and cancels any movement.
    if (!instructionsShown) {
        instructionsTextbox.moveBy(600, 0);
        instructionsShown = true;
        currentInput = "";
//        menuClose.play();
        return;
    }

    // Starts player movement based on directional input
    switch (currentInput) {
        case "up":
            if (map[player.yPos - 1][player.xPos] !== 3) 
                updatePlayerDirection()
            break;
        case "down":
            if (map[player.yPos + 1][player.xPos] !== 3) 
                updatePlayerDirection()
            break;
        case "left":
            if (map[player.yPos][player.xPos - 1] !== 3) 
                updatePlayerDirection()
            break;
        case "right":
            if (map[player.yPos][player.xPos + 1] !== 3) {
                updatePlayerDirection()
            }
            break;
        // Also checks for the escape key to bring up the help menu in the overworld
        case "esc":
            instructionsShown = false;
            instructionsTextbox.moveBy(-600, 0);
//            menuOpen.play();
            break;
    }

    // Resets the current input
    currentInput = "";
}

// Takes whatever tile the player is on and modifies the game state accordingly.
function reactToCurrentTile() {
    // If the player touches an enemy (a 5 on the map), start combat
    if (map[player.yPos][player.xPos] === 5) {
        battleUi.updateStats(player.hp, player.mp, enemy.hp);
        map[player.yPos][player.xPos] = 0;
        state = "battle";
        battleTimer = 0.75;
        battlePhase = "player";
        enemy.becomeSmoke(smokeCloud);
        battleUi.changeCursor("player", cursor, 2);
        player.visible = false;
    }
    // If the player touches a potion (a 4 on the map), pick it up
    if (map[player.yPos][player.xPos] === 4 && gameScene.children.includes(potion)) {
        map[player.yPos][player.xPos] = 0;
        gameScene.removeChild(potion);
        numOfPotions++;
        potionGetText.moveBy(0, 50);
        potionsClaimed.push(mapId);
//        itemGet.play();
    }
    // If the player touches the cave, end the game with a win.
    if (map[player.yPos][player.xPos] === 6)
        gameOver(true);
    // If the player is at the edge of the current map (the player is at an x or y pos of 0 or 7),
    // change to a corresponding map and warp the player to the opposite side of the screen.
    if (player.yPos === 7) {
        mapId ++;
        drawMapById(mapId);
        player.snapTo(player.xPos, 1);
    }
    if (player.yPos === 0) {
        mapId --;
        drawMapById(mapId);
        player.snapTo(player.xPos, 6);
    }
    if (player.xPos === 7) {
        mapId += 3;
        drawMapById(mapId);
        player.snapTo(1, player.yPos);
    }
    if (player.xPos === 0) {
        mapId -= 3;
        drawMapById(mapId);
        player.snapTo(6, player.yPos);
    }
}

// The combat phase of the game, started when making contact with an enemy in the overworld. DeltaTime must be passed down for this method to work
function combat(dt) {
    // If the battle menu is enabled, await user input to trigger the command
    if (battleMenu.enabled)
        useBattleMenu();

    // Otherwise, the battle flows normally
    else
    {
        // Decrement the battle timer a bit 
        battleTimer -= dt;

        // When space is pressed, build the menu and enable it
        if (currentInput === "space" && battlePhase === "player")
            initBattleMenu();
        
        // Scroll the battle display down if it's currently off-screen
        if (battleUi.y < 100)
            battleUi.changeYPosBy(10);

        // Once the timer runs down to 0, have one combatant hit the other and update the current battle state
        if (battleTimer <= 0)
            fight();

        // Occasionally in battle, rotate the smoke cloud 180 degrees and update the cursor position
        if (Math.floor(battleTimer * 100) % 36 < 2 && battlePhase !== "defeat") 
            enemy.angle += 180;
    }
}

// Executes a battle command based on the player's input.
function useBattleMenu() {
    let commandExecuted = false;
    if (currentInput === "f" && player.mp > 3)
    {
        enemy.hp -= 10;
        player.mp -= 3;
 //       fire.play();
        battleUi.changeCursor("player", fireSprite, 1);
        commandExecuted = true;
        battleTimer = 0.75;
        if (enemy.hp > 0) {
            battlePhase = "playerSpell";
        }
    }
    if (currentInput === "h" && player.mp > 5)
    {
        player.hp += 15;
        if (player.hp > 50)
            player.hp = 50;
        player.mp -= 5;
//        heal.play();
        commandExecuted = true;
        battleTimer = 0.75;
        battlePhase = "playerHeal";
        battleUi.changeCursor("player", heart, 3);
    }
    if (currentInput === "p" && numOfPotions >= 1)
    {
        player.hp += 25;
        if (player.hp > 50)
            player.hp = 50;
        numOfPotions --;
//        heal.play();
        commandExecuted = true;
        battleTimer = 0.75;
        battlePhase = "playerHeal";
        battleUi.changeCursor("player", potionSprite, 2);
    }
    if (currentInput === "back") {
        commandExecuted = true;
//        menuClose.play();
    }
    
    if (commandExecuted)
    {
        battleMenu.enabled = false;
        battleMenu.moveBy(-450, 0);
    }
}

// Loads the battle menu's text based on how much MP and potions the player has, and enables it.
function initBattleMenu() {
    battleMenu.enabled = true;
    battleMenu.displayText.text = "Choose an option:\n";
    if (player.mp > 3)
        battleMenu.displayText.text += "F to cast Fire: 3 MP\n";
    else
        battleMenu.displayText.text += "Need at least 3 MP for Fire!\n";
    
    if (player.mp > 5)
        battleMenu.displayText.text += "H to cast Heal: 5 MP\n";
    else
        battleMenu.displayText.text += "Need at least 5 MP for Heal!\n";

    if (numOfPotions >= 1)
        battleMenu.displayText.text += "P to use one of your " + numOfPotions + " potions\n";
    else
        battleMenu.displayText.text += "No potions remaining!\n";
    
    battleMenu.displayText.text += "Backspace to leave the menu."
    battleMenu.moveBy(450, 0);
//    menuOpen.play();
}

// Alternates trading blows between the player and enemy.
function fight() {
    switch (battlePhase)
    {
        case "player":
            enemy.hp -= player.atk;
            battlePhase = "enemy";
            battleUi.changeCursor("enemy", cursor, 2);
//            if (enemy.hp > 0)
//                attackSfx1.play();
//            else
//                attackSfx3.play();
            break;
        case "enemy":
            if (enemy.hp > 0) {
                player.hp -= enemy.atk;
                battlePhase = "player";
                battleUi.changeCursor("player", cursor, 2);
//                if (player.hp > 0)
//                    attackSfx2.play();
//                else
//                    attackSfx3.play();
            }
            break;
        case ("playerSpell"):
            battlePhase = "enemy";
            battleUi.changeCursor("enemy", cursor, 2);
//            if (enemy.hp > 0)
//                attackSfx1.play();
//            else
//               attackSfx3.play();
            break;
        case ("playerHeal"):
            battlePhase = "enemy";
            battleUi.changeCursor("enemy", cursor, 2);
            break;
        case ("victory"):
            state = "overworld";
            enemiesKilled ++;
            currentInput = "";
            break;
        case ("defeat"):
            gameOver(false);
            break;
    }

    if (player.hp <= 0)
    {
        battlePhase = "defeat";
        enemy.revertSprite();
    }
    else if (enemy.hp <= 0)
    {
        gameScene.removeChild(enemy);
        player.visible = true;
        battlePhase = "victory";
    }
    battleTimer = 0.75;
    battleUi.updateStats(player.hp, player.mp, enemy.hp);
}

// Triggers the game over screen, displaying the final score if the player won or the amount of enemies defeated
// if the player lost, and resets the playing field.
function gameOver(playerAlive = true) {
    // Hides the game scene and shows the game over scene.
    gameOverScene.visible = true;
    gameScene.visible = false;
//    bgm.stop();

    // Displays different text depending on whether or not the player won.
    if (playerAlive) {
        gameOverLabel.text =  "YOU WIN!";
        scoreDisplayLabel.text = "Your final score is:\n" +
            enemiesKilled + " enemies defeated x " + player.hp + " HP left\n=\n" +
            (enemiesKilled * player.hp) + "\n\nPress any key to play again!";
//        victoryTheme.loop(true);
//        victoryTheme.play();
    }
    else {
        gameOverLabel.text =  "GAME OVER";
        scoreDisplayLabel.text = "You defeated " + enemiesKilled + " enemies.\n\n\n\n\n" +
            "Press any key to play again!";
//        gameOverTheme.play();
    }

    // Resets the game scene to its original state.
    gameScene.removeChild(player);
    player = new Player(getDirectionalSpriteSheet("down"));
    gameScene.addChild(player);
    mapId = 1;
    potionsClaimed = new Array();
    drawMapById(mapId);
    state = "overworld";
    currentInput = "";
}

// Gets the spritesheet for the player based on their current direction.
function getDirectionalSpriteSheet(direction) {
    let startIdx;
    let endIdx;
    let finalSheet = new Array;

    switch (direction) {
        case "down":
            startIdx = 0;
            endIdx = 8;
            break;
        case "left":
        case "right":
            startIdx = 8;
            endIdx = 16;
            break;
        default:
            startIdx = 16;
            endIdx = 24;
            break;
    }

    for (let i = startIdx; i < endIdx; i++) {
        finalSheet.push(playerSpritesheet[i]);
    }

    return finalSheet;
}

// Helper method for readDirectionalInput to make 4 repeated lines of code in to one repeated function.
// It updates the player's direction.
function updatePlayerDirection() {
    movementDirection = currentInput;
    movementStepsRemaining = 5;
    player.textures = getDirectionalSpriteSheet(currentInput);
    // Flip the player's sprite when facing rightso that I don't have to do so manually
    if (movementDirection === "right") {
        player.scale.x = -3.75;
        player.anchor.x = 1;
    }
    else {
        player.scale.x = 3.75;
        player.anchor.x = 0;
    }
    player.play();
}

// Resets most of the game's variables to their initial state.
function resetGame() {
//    if (titleScene.visible)
//        menuOpen.play();
    titleScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
    currentInput = "";
    enemiesKilled = 0;
//    victoryTheme.stop();
//    gameOverTheme.stop();
//    if (!bgm.playing())
//        bgm.play();
    numOfPotions = 1;
}