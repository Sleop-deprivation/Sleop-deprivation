/*
	The purpose of this file is to take in the analyser node and a <canvas> element: 
	  - the module will create a drawing context that points at the <canvas> 
	  - it will store the reference to the analyser node
	  - in draw(), it will loop through the data in the analyser node
	  - and then draw something representative on the canvas
	  - maybe a better name for this file/module would be *visualizer.js* ?
*/

import * as utils from './utils.js';
import * as sprites from './loader.js';
import * as StarSprite from './star-sprite.js';

let ctx,canvasWidth,canvasHeight,gradient,analyserNode,audioData;
let starSprites = [];
let moonSprite;

const setupCanvas = (canvasElement,analyserNodeRef) => {
	// create drawing context
	ctx = canvasElement.getContext("2d");
	canvasWidth = canvasElement.width;
	canvasHeight = canvasElement.height;
	// create a gradient that runs top to bottom
	gradient = utils.getLinearGradient(ctx,0,0,0,canvasHeight,[{percent:0,color:"rgba(0, 0, 10, 1)"},{percent:0.75,color:"rgba(0, 0, 25, 1)"},{percent:1,color:"rgba(0, 0, 50, 1)"}]);
	// keep a reference to the analyser node
	analyserNode = analyserNodeRef;
	// this is the array where the analyser data will be stored
	audioData = new Uint8Array(analyserNode.fftSize/2);
    
    // Store a reference to the star sprites in here
    for (let i = 0; i < analyserNode.fftSize/2; i++) {
        starSprites.push(new StarSprite.StarSprite(0, 0, 1, sprites.starSpritesheet));
        starSprites[i].setTimer(-Math.random());
    }

    // Load the moon sprite
    moonSprite = sprites.moonSprite;

}

const draw = (params={}) => {
  // 1 - populate the audioData array with the frequency data from the analyserNode
    if (params.drawFrequency)
	    analyserNode.getByteFrequencyData(audioData);  // Frequency data
	else
	    analyserNode.getByteTimeDomainData(audioData); // waveform data
	
	// 2 - draw background
	ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha = .1;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
		
	// 3 - draw gradient
	if (params.showGradient) {
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.globalAlpha = .3;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
    }

	// 4 - draw bars
	if (params.showBars) {
        let barSpacing = 5;
        let margin = 10;
        let screenWidthForBars = canvasWidth - (audioData.length * barSpacing) - margin * 2;
        let barWidth = screenWidthForBars / audioData.length;
        let barHeight = 200;
        let topSpacing = 100;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        // loop through the data and draw!
        for (let i = 0; i < audioData.length; i++) {
            ctx.fillRect(margin + i * (barWidth + barSpacing), topSpacing + 256 - audioData[i], barWidth, barHeight);
            ctx.strokeRect(margin + i * (barWidth + barSpacing), topSpacing + 256 - audioData[i], barWidth, barHeight);
        }
        ctx.restore();
    }

    // Draw the star sprites
    if (params.showStars) {
        for (let i = 0; i < starSprites.length; i++) {
            // Calculate the current star's size, based on the value at the corresponding
            // index of audioData
            let sizeMod = 0.25 + audioData[i] / 255;
            starSprites[i].resize(sizeMod * sizeMod);
    
            // If the current star has completed its animation loop, change its y value
            // and reset its animation.
            if (starSprites[i].animLoopComplete) {
                let newY = Math.random() * 350 + 25;
                starSprites[i].reposition(10 + 10 * i, newY);
                starSprites[i].setTimer(0);
            }
    
            // Call the current star's update and draw methods.
            starSprites[i].update(1/60);
            starSprites[i].draw(ctx);
        }
    }

    // Draw the moon
	if (params.showMoon) {
        let maxRadius = canvasHeight / 8;
        ctx.save();
        ctx.globalAlpha = 0.5;
        let audioDataMean = 0;

        // Circle-drawing code from PE-7
        for (let i = 0; i < audioData.length; i++) {
            let percent = audioData[i] / 255;
            audioDataMean += percent;

            let circleRadius = percent * maxRadius;

            // light gray circles, representing moonlight
            ctx.beginPath();
            ctx.fillStyle = utils.makeColor(205, 205, 205, .01 - percent / 100.0);
            ctx.arc(7 * canvasWidth / 8, canvasHeight / 5, circleRadius * 1.5, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
        } 

        // Calculate the moon's size using the average of the values in audioData.
        audioDataMean /= audioData.length;
        let imageSize = 48 * (1 + audioDataMean);

        // Draw the moon with its size based on imageSize
        ctx.drawImage(moonSprite, 
            7 * canvasWidth / 8 - imageSize / 2, canvasHeight / 5  - imageSize / 2, // Starting coords
            imageSize, imageSize);                                                  // Image size

        ctx.restore();       
    }

    // 6 - bitmap manipulation
	// TODO: right now. we are looping though every pixel of the canvas (320,000 of them!), 
	// regardless of whether or not we are applying a pixel effect
	// At some point, refactor this code so that we are looping though the image data only if
	// it is necessary

	// A) grab all of the pixels on the canvas and put them in the `data` array
	// `imageData.data` is a `Uint8ClampedArray()` typed array that has 1.28 million elements!
	// the variable `data` below is a reference to that array 
	let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    let data = imageData.data;
    let length = data.length;
    let width = imageData.width; // not using here

	// B) Iterate through each pixel, stepping 4 elements at a time (which is the RGBA for 1 pixel)
    for (let i = 0; i < length; i += 4) {
        // invert
        if (params.showInvert) {
            let red = data[i], green = data[i+1], blue = data[i+2];
            data[i] = 255 - red;
            data[i + 1] = 255 - green;
            data[i + 2] = 255 - blue;
            // data[i + 3] is alpha, no need to touch that
        }
    }// end for
	
    // embossing
    if (params.showEmboss) {
        for (let i = 0; i < length; i++) {
            if (i % 4 == 3) continue;
            data[i] = 127 + 2 * data[i] - data[i + 4] - data[i + width * 4];
        }
    }

	// D) copy image data back to canvas
    ctx.putImageData(imageData, 0, 0);
};

const toggleStars = (enabled = true) => {
    for (let star of starSprites) {
        star.animating = enabled;
    }
}

export {setupCanvas,draw,toggleStars};