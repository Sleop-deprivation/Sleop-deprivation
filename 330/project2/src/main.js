/*
	main.js is primarily responsible for hooking up the UI to the rest of the application 
	and setting up the main event loop
*/

// We will write the functions in this file in the traditional ES5 way
// In this instance, we feel the code is more readable if written this way
// If you want to re-write these as ES6 arrow functions, to be consistent with the other files, go ahead!

import * as utils from './utils.js';
import * as audio from './audio.js';
import * as canvas from './canvas.js';

const drawParams = {
  showGradient: true,
  showBars: false,
  showMoon: true,
  showStars: true,
  showInvert: false,
  showEmboss: false,
  drawFrequency: true
};

// 1 - here we are faking an enumeration
const DEFAULTS = Object.freeze({
	sound1  :  "media/YetAnotherSleeplessNight.mp3"
});

const init = () => {
  audio.setupWebaudio(DEFAULTS.sound1);
	console.log("init called");
	console.log(`Testing utils.getRandomColor() import: ${utils.getRandomColor()}`);
	let canvasElement = document.querySelector("canvas"); // hookup <canvas> element
	setupUI(canvasElement);
  canvas.setupCanvas(canvasElement,audio.analyserNode);
  loop();
}

const setupUI = (canvasElement) => {
  // A - hookup fullscreen button
  const fsButton = document.querySelector("#button-fs");
	
  // add .onclick event to button
  fsButton.onclick = e => {
    console.log("goFullscreen() called");
    utils.goFullscreen(canvasElement);
  };

  // B - hookup play button
  const playButton = document.querySelector("#button-play");

  // add .onclick event to button
  playButton.onclick = (e) => {
    console.log(`audioCtx.state before = ${audio.audioCtx.state}`);
    
    // check if content is in suspended state (autoplay policy)
    if (audio.audioCtx.state == "suspended")
        audio.audioCtx.resume();

    console.log(`audioCtx.state after = ${audio.audioCtx.state}`);

    if (e.target.dataset.playing == "no") {
        // if track is paused, play it
        audio.playCurrentSound();
        e.target.dataset.playing = "yes"; // Our CSS will set the text to "Pause"
    } else {
        // if the track is playing, pause it
        audio.pauseCurrentSound();
        e.target.dataset.playing = "no"; // Our CSS will set the text to "Play"
    }
  };

  // C - hookup volume slider and label
  let volumeSlider = document.querySelector("#slider-volume");
  let volumeLabel = document.querySelector("#volume-label");

  // add onInput event to slider
  volumeSlider.oninput = e => {
    // set the gain
    audio.setVolume(e.target.value);
    // update value of label to match value of slider
    volumeLabel.innerHTML = Math.round(e.target.value / 2 * 100);
  };

  // set value of label to match initial value of slider
  volumeSlider.dispatchEvent(new Event("input"));

  // hookup track <select>
  let trackSelect = document.querySelector("#track-select");
  // add .onchange event to <select>
  trackSelect.onchange = e => {
    audio.loadSoundFile(e.target.value);
    // pause the current track if it is playing
    if (playButton.dataset.playing == "yes")
      playButton.dispatchEvent(new MouseEvent("click"));
  }
	
  // setup visualizer checkboxes
  // gradient
  let gradientCb = document.querySelector("#cb-gradient");
  gradientCb.onclick = e => {
    drawParams.showGradient = e.target.checked;
  }

  // bars
  let barsCb = document.querySelector("#cb-bars");
  barsCb.onclick = e => {
    drawParams.showBars = e.target.checked;
  }

  // stars
  let starsCb = document.querySelector("#cb-stars");
  starsCb.onclick = e => {
    drawParams.showStars = e.target.checked;
    canvas.toggleStars(e.target.checked);
  }

  // the moon
  let circlesCb = document.querySelector("#cb-moon");
  circlesCb.onclick = e => {
    drawParams.showMoon = e.target.checked;
  }

  // invert
  let invertCb = document.querySelector("#cb-invert");
  invertCb.onclick = e => {
    drawParams.showInvert = e.target.checked;
  }

  // emboss
  let embossCb = document.querySelector("#cb-emboss");
  embossCb.onclick = e => {
    drawParams.showEmboss = e.target.checked;
  }

  // setup data type selector
  let dataTypeSelector = document.querySelector("#select-datatype");
  dataTypeSelector.onchange = e => {
    drawParams.drawFrequency = (e.target.selectedIndex == 0);
  }

  // setup bass/treble filters
  // lowshelf (bass)
  let bassCb = document.querySelector("#cb-bass");
  bassCb.checked = false;
  bassCb.onclick = e => {
    audio.toggleLowshelf(e.target.checked);
  }

  // highshelf (treble)
  let trebleCb = document.querySelector("#cb-treble");
  trebleCb.checked = false;
  trebleCb.onclick = e => {
    audio.toggleHighshelf(e.target.checked);
  }

}; // end setupUI

const loop = () => {
  setTimeout(loop, 1000/60);
  canvas.draw(drawParams);
};

export {init};