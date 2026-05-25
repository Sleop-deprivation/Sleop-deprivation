import * as main from "./main.js";

let starSpritesheet, moonSprite;

window.onload = ()=>{
	console.log("window.onload called");
	// 1 - do preload here - load fonts, images, additional sounds, etc...
	loadJsonXHR();
}

const loadJsonXHR = () => {
	const url = "data/av-data.json";
	const xhr = new XMLHttpRequest();

	xhr.onload = (e) => {
		console.log(`In onload - HTTP Status Code = ${e.target.status}`);
		const text = e.target.responseText;
		let json;
		try {
			json = JSON.parse(text);
		} catch {
			document.querySelector("#output").innerHTML = "JSON.parse() failed!";
			return;
		}

		// Set the page's title
		document.title = json.title;

		// Set the values of the track selector
		let trackSelectHtml = "";
		for (let song of json.songdata) {
			trackSelectHtml += `<option value = "${song.trackurl}">${song.trackname} (${song.tracksource})</option>`;
		}
		document.querySelector("#track-select").innerHTML = trackSelectHtml;

		// Set the UI's default values
		const uiDefaults = json.defaults;
		document.querySelector("#cb-gradient").checked = uiDefaults.showGradient;
		document.querySelector("#cb-bars").checked = uiDefaults.showBars;
		document.querySelector("#cb-moon").checked = uiDefaults.showMoon;
		document.querySelector("#cb-stars").checked = uiDefaults.showStars;
		document.querySelector("#cb-invert").checked = uiDefaults.showInvert;
		document.querySelector("#cb-emboss").checked = uiDefaults.showEmboss;
		if (uiDefaults.drawFrequency)
			document.querySelector("#select-datatype").selectedIndex = 0;
		else
			document.querySelector("#select-datatype").selectedIndex = 1;

		// Load the star sprite when the defaults finish loading
		loadStarSprite();
	}

	xhr.onerror = e => console.log(`In onerror - HTTP Status Code = ${e.target.status}`);
	xhr.open("GET", url);
	xhr.send();
}

const loadStarSprite = () => {
	starSpritesheet = new Image();

	starSpritesheet.onload = () => {
		// Load the moon sprite when the star sprite finishes loading
		loadMoonSprite();
	}

	starSpritesheet.onerror = () => {
		console.log(`Star didn't load! Check your URL!`);
	};

	starSpritesheet.src = 'media/star-spritesheet.png';
}

/**
 * Loads the sprite of the moon, then starts main.
 */
const loadMoonSprite = () => {
	moonSprite = new Image();

	moonSprite.onload = () => {
		// Since this is the last thing to external thing to load, run init() to load the rest of the program
		main.init();
	}

	moonSprite.onerror = () => {
		console.log(`Moon didn't load! Check your URL!`);
	};

	moonSprite.src = 'media/moon.png';
}

export {starSpritesheet, moonSprite};