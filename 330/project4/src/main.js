import * as map from "./map.js";
import * as ajax from "./ajax.js";
import * as storage from "./storage.js"
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, set, increment } from  "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// I. Variables & constants
// NB - it's easy to get [longitude,latitude] coordinates with this tool: http://geojson.io/
const lnglatNYS = [-75.71615970715911, 43.025810763917775];
const lnglatUSA = [-98.5696, 39.8282];
let geojson;
let favoriteIds = [];
const addFavoriteIcon = `<span class="panel-icon">
<i class="fas fa-heart-circle-plus"></i>
</span>`;
const removeFavoriteIcon = `<span class="panel-icon">
<i class="fas fa-heart-circle-minus"></i>
</span>`;

// Firebase stuff
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDnNY2a2pIRtCn2FuHP0z4HSVfx0dWaAUI",
    authDomain: "high-scores-bebc8.firebaseapp.com",
    projectId: "high-scores-bebc8",
    storageBucket: "high-scores-bebc8.appspot.com",
    messagingSenderId: "1021254562545",
    appId: "1:1021254562545:web:7afd46269f5eb152252f50"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log(app);

// II. Functions
const setupUI = () => {
	// NYS Zoom 5.2
	document.querySelector("#btn1").onclick = () => {
		map.setZoomLevel(5.2);
		map.setPitchAndBearing(0,0);
		map.flyTo(lnglatNYS);
	}
	
	// NYS isometric view
	document.querySelector("#btn2").onclick = () => {
		map.setZoomLevel(5.5);
		map.setPitchAndBearing(45,0);
		map.flyTo(lnglatNYS);
	}

	// World zoom 0
	document.querySelector("#btn3").onclick = () => {
		map.setZoomLevel(3);
		map.setPitchAndBearing(0,0);
		map.flyTo(lnglatUSA);
	}
}

// Gets a park by its id.
const getFeatureById = (id) => {
	return geojson.features.find((element) => element.id === id);
}

// Increments the favorite count of the park at "id" by "amt".
const changeFavoriteCount = (id, amt) => {
	const db = getDatabase();
	const favRef = ref(db, 'favoriteParks/' + id);
	const parkName = getFeatureById(id).properties.title;
	set(favRef, {
		parkName,
		likes: increment(amt)
	});
}

// Shows the details of the selected park.
const showFeatureDetails = (id) => {
	console.log(`showFeatureDetails - id=${id}`);
	const feature = getFeatureById(id);
	document.querySelector("#details-1").innerHTML = `Info for ${feature.properties.title}`;
	document.querySelector("#details-2").innerHTML = 
		`<p>Address: ${feature.properties.address}</p>
		<p>Phone: <a href="tel:${feature.properties.phone}">${feature.properties.phone}</a></p>
		<p>Website: <a href="${feature.properties.url}">${feature.properties.url}</a></p>`;
	document.querySelector("#details-3").innerHTML = feature.properties.description;

	// Create the (un)favorite button, which allows users to add or remove
	// parks from their favorites list. Its default state is as an 
	// unfavorite button if the park is already marked as a favorite
	// and as a favorite button if it isn't.
	const favoriteButton = document.createElement("button");
	favoriteButton.className = "button";
	if (favoriteIds.includes(id)) {
		favoriteButton.className += " is-warning";
		favoriteButton.innerHTML = `${removeFavoriteIcon} Unfavorite`;
	} else {
		favoriteButton.className += " is-primary";
		favoriteButton.innerHTML = `${addFavoriteIcon} Favorite`;
	}

	// The code that allows the button to add/remove parks from the favorites list.
	favoriteButton.onclick = (e) => {
		favoriteButton.className = "button";
		if (favoriteIds.includes(id)) {
			favoriteButton.className += " is-primary";
			favoriteButton.innerHTML = `${addFavoriteIcon} Favorite`;
			changeFavoriteCount(id, -1);
			favoriteIds = favoriteIds.filter(item => item != id);
		} else {
			favoriteButton.className += " is-warning";
			favoriteButton.innerHTML = `${removeFavoriteIcon} Unfavorite`;
			changeFavoriteCount(id, 1);
			favoriteIds.push(id);
		}
		refreshFavorites();
	}
	// Add the button to the bottom of the park details.
	document.querySelector("#details-2").appendChild(favoriteButton);
};

// Creates a new favorite element on the favorites sidebar.
const createFavoriteElement = (id) => {
	const feature = getFeatureById(id);
	const a = document.createElement("a");
	a.className = "panel-block";
	a.id = feature.id;
	a.onclick = () => {
		showFeatureDetails(a.id);
		map.setZoomLevel(6);
		map.flyTo(feature.geometry.coordinates);
	};
	a.innerHTML = `
		<span class="panel-icon">
			<i class="fas fa-map-pin"></i>
		</span>
		${feature.properties.title}`;
	return a;
}

// Updates the favorites list in local storage and creates corresponding
// favorite elements.
const refreshFavorites = () => {
	storage.writeToLocalStorage("favoriteIds", favoriteIds);
	const favoritesContainer = document.querySelector("#favorites-list");
	favoritesContainer.innerHTML = "";
	for (const id of favoriteIds) {
		favoritesContainer.appendChild(createFavoriteElement(id));
	}
}

// Initializes the website.
const init = () => {
	// Initialize the map.
	map.initMap(lnglatNYS);

	// Load the user's favorites from local storage, if they have any.
	const favorites = storage.readFromLocalStorage("favoriteIds");
	if (Array.isArray(favorites))
		favoriteIds = favorites;

	// Downloads the geojson file, and once that's loaded, sets up the site's UI.
	ajax.downloadFile("data/parks.geojson", (str) => {
		geojson = JSON.parse(str);
		console.log(geojson);
		map.addMarkersToMap(geojson, showFeatureDetails);
		setupUI();
		refreshFavorites();
	});
};

init();