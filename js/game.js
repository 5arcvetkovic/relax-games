// game settings
var row_count = 4;
var column_count = 6;
var win_threshold = 2; // <= column_count
var win_amount = [1,2,3,4,5,6,7,8,9,10,11,12];

// dimensions
var scale = calculateScale(row_count+2, column_count);
var symbolWidth = 200*scale;
var symbolHeight = 200*scale;
var gameWidth = Math.min(window.innerWidth, column_count*symbolWidth);
var gameHeight = Math.min(window.innerHeight, (row_count+2)*symbolHeight);

// bet/credit
var game_count = 0;
var credit = 100;
var bet = 0;

var config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    backgroundColor: '#2d2d2d',
    parent: 'relax-gaming',
    scene: {
        preload: preload,
        create: create
    }
};

new Phaser.Game(config);

function preload () {
    this.load.spritesheet('symbols', 'assets/reel1.png', { frameWidth: 200, frameHeight: 200 });
    this.load.image('reel', 'assets/reel2.png');
    this.load.image('darkness', 'assets/darkness.png');
    this.load.image('spin-btn', 'assets/spin-btn.png');
    this.load.image('one-btn', 'assets/one-btn.png');
    this.load.image('max-btn', 'assets/max-btn.png');
    this.load.image('rst-btn', 'assets/rst-btn.png');
    this.load.audio('action-sound',
        ['assets/action-sound.mp3'],
        {instances: 1});
}

function create () {

    // placeholders
    for (var i = 0; i < column_count; i++) {
        this.add.image(i*symbolWidth + symbolWidth/2, i*symbolHeight, 'reel').setDepth(-101, 1).setScale(scale);
    }

    // surroundings/background
    var darkness_bottom = this.make.image({
        key: 'darkness',
        x: 5,
        y: gameHeight - symbolHeight*3/4*scale,
        scale: { x: gameWidth, y: scale }
    });
    darkness_bottom.setAlpha(0, 1, 1, 0);
    var darkness_top = this.make.image({
        key: 'darkness',
        x: 5,
        y: symbolHeight*3/4*scale,
        scale: { x: gameWidth, y: scale }
    });
    darkness_top.setAlpha(1, 0, 0, 1);
    var graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(0, 0, gameWidth, symbolHeight/2);
    graphics.fillRect(0, gameHeight - symbolHeight/2, gameWidth, symbolHeight/2);

    // current bet information
    this.add.text(10, 10, "BET", {
        fontFamily: "Arial Black",
        fontSize: 24*scale,
        color: "#dddddd"
    }).setStroke('#555', 5).setShadow(2, 2, "#333333", 2, true, true);
    var bet_label = this.add.text(80*scale, 10, "0", {
        fontFamily: "Arial Black",
        fontSize: 24*scale,
        color: "#ddd"
    }).setStroke('#555', 5).setShadow(2, 2, "#333333", 2, true, true);
    // credit information
    this.add.text(symbolWidth, 10, "CREDIT", {
        fontFamily: "Arial Black",
        fontSize: 24*scale,
        color: "#ddd"
    }).setStroke('#555', 5).setShadow(2, 2, "#333333", 2, true, true);
    var credit_label = this.add.text(320*scale, 10, credit.toString(), {
        fontFamily: "Arial Black",
        fontSize: 24*scale,
        color: "#ddd"
    }).setStroke('#555', 5).setShadow(2, 2, "#333333", 2, true, true);
    // this will be animated when player wins
    var win_text = this.add.text(gameWidth/2 - 100*scale, -100, "GOOD LUCK", {
        fontFamily: "Arial Black",
        fontSize: 24*scale,
        color: "#F00",
        align: 'center'
    }).setStroke('#555', 5).setShadow(2, 2, "#300", 2, true, true);

    // action buttons + animations
    var actionSound = this.sound.add('action-sound', { loop: false });
    var betOneBtn = this.add.sprite(symbolWidth/2, gameHeight - 50*scale, 'one-btn')
        .setInteractive().setName('bet_one').setScale(scale);
    betOneBtn.on('pointerdown', function ()  {
        this.setTint(0x555555);
        actionSound.play();
    });
    betOneBtn.on('pointerout', function () {
        this.clearTint();
    });
    betOneBtn.on('pointerup', function () {
        this.clearTint();
    });
    var betMaxBtn = this.add.sprite(symbolWidth, gameHeight - 50*scale, 'max-btn')
        .setInteractive().setName('bet_max').setScale(scale);
    betMaxBtn.on('pointerdown', function () {
        this.setTint(0x555555);
        actionSound.play();
    });
    betMaxBtn.on('pointerout', function () {
        this.clearTint();
    });
    betMaxBtn.on('pointerup', function () {
        this.clearTint();
    });
    var resetBtn = this.add.sprite(symbolWidth*3/2, gameHeight - 50*scale, 'rst-btn')
        .setInteractive().setName('reset').setScale(scale);
    resetBtn.on('pointerdown', function () {
        this.setTint(0x555555);
    });
    resetBtn.on('pointerout', function () {
        this.clearTint();
    });
    resetBtn.on('pointerup', function () {
        this.clearTint();
    });
    var spinBtn = this.add.sprite(gameWidth - symbolWidth/2, gameHeight - 50*scale, 'spin-btn')
        .setInteractive().setName('spin').setScale(scale);
    spinBtn.on('pointerdown', function () {
        this.setTint(0x555555);
    });
    spinBtn.on('pointerout', function () {
        this.clearTint();
    });
    spinBtn.on('pointerup', function () {
        this.clearTint();
    });

    // action listeners
    this.input.on('gameobjectdown', function (pointer, gameObject) {
        if (gameObject.name === 'bet_one') {
            if (bet < credit) {
                bet++;
                bet_label.setText(bet.toString());
                bet_label.setColor('#ddd');
            } else {
                credit_label.setColor('#F00');
            }
        }
        if (gameObject.name === 'bet_max') {
            bet = credit;
            bet_label.setText(bet.toString());
            bet_label.setColor('#ddd');
        }
        if (gameObject.name === 'reset') {
            bet = 0;
            bet_label.setText(bet.toString());
            bet_label.setColor('#ddd');
            credit_label.setColor('#ddd');
        }
        if (gameObject.name === 'spin') {
            // mark/unmark the bet and credit amounts - if bet is not set, don't spin the reels
            if (bet === 0) {
                bet_label.setColor('#F00');
                return;
            }
            bet_label.setColor('#ddd');
            credit_label.setColor('#ddd');
            actionSound.play();
            // update bet and credit amounts
            credit -= bet;
            credit_label.setText(credit.toString());

            // generate numbers/symbols
            var numbers = [];
            for (var i = 0; i < row_count + 2; i++) {
                numbers[i] = [];
                for (var j = 0; j < column_count; j++) {
                    numbers[i][j] = Math.round(Math.random() * 11);
                }
            }
            // calculate winnings
            // - for visual purposes, we generate top and bottom row for the reels
            //   but these are not used when calculating winnings
            // - it is possible to have multiple winnings in a single row
            //   if 2 matching symbols are required and we have 3 columns with the same symbol, winnings are doubled
            var winnings = 0;
            for (i = 1; i < row_count + 1; i++) {
                for (j = 0; j <= column_count - win_threshold; j++) {
                    var player_won = true;
                    for (var k = j + 1; k < j + win_threshold; k++) {
                        if (numbers[i][j] !== numbers[i][k]) {
                            player_won = false;
                            break;
                        }
                    }
                    if (player_won) {
                        winnings += win_amount[numbers[i][j]];
                    }
                }
            }

            var reels = [];
            var symbols = [];
            var tweens = [];
            // spinning reels is done using tweens, but they keep their source image "depth",
            // so we in this implementation we keep adding new image objects
            // so that their tweens are shown over the old ones
            // FIXME: cleanup image objects
            for (i = 0; i < column_count; i++) {
                reels[i] = this.add.image(i*symbolWidth + symbolWidth/2, -12*symbolHeight, 'reel');
                reels[i].setDepth(-100, 1).setScale(scale);
                tweens.push({
                    targets: reels[i],
                    y: 12*symbolHeight,
                    offset: 100
                });
            }
            // render symbols
            for (i = 0; i < row_count + 2; i++) {
                symbols[i] = [];
                for (j = 0; j < column_count; j++) {
                    symbols[i][j] = this.add.sprite(
                        j*symbolWidth + symbolWidth/2,
                        i*symbolHeight - (row_count + 2)*symbolHeight + symbolHeight/2 - symbolHeight*12,
                        'symbols', numbers[i][j])
                        .setDepth(-100, 1).setScale(scale);
                    tweens.push({
                        targets: symbols[i][j],
                        y: i*symbolHeight + symbolHeight/2,
                        offset: 100
                    });
                }
            }
            this.tweens.timeline({
                ease: 'Power2',
                duration: 1000,
                tweens: tweens
            });

            // TODO: present the winnings sound
            if (winnings > 0) {
                var amount_won = winnings*bet;
                credit += amount_won;
                credit_label.setText(credit.toString());
                win_text.setText(["YOU WON", amount_won.toString()]);
                // wait for the reels to stop
                this.tweens.add({
                    targets: win_text,
                    delay: 1000,
                    duration: 1000,
                    scaleX: 2,
                    scaleY: 2,
                    ease: 'Power2',
                    y: gameHeight/2 - 50,
                    yoyo: true
                });
            }

            // TODO: if the user looses too much (credit < threshold) or passes the threshold for played games, warn them
            game_count++;
            bet = 0;
            bet_label.setText(bet.toString());
        }

    }, this);

}

function calculateScale(rowCount, columnCount) {
    var spriteWidth = 200;
    var spriteHeight = 200;
    var scaleX = 1;
    var scaleY = 1;
    if (columnCount*spriteWidth > window.innerWidth)  {
        scaleX = window.innerWidth/(rowCount*spriteWidth);
    }
    if (rowCount*spriteHeight > window.innerHeight)  {
        scaleY = window.innerHeight/(rowCount*spriteHeight);
    }
    return Math.min(scaleX, scaleY);
}