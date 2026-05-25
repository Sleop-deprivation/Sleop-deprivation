// 1
window.onload = (e) => {document.querySelector("#search").onclick = searchButtonClicked};
	
// 2
let displayTerm = "";

// 3
function searchButtonClicked(){
    console.log("searchButtonClicked() called");

    // API URL
    const GIPHY_URL = "https://api.giphy.com/v1/gifs/search?";
    
    // API Key
    let GIPHY_KEY = "5PuWjWVnwpHUQPZK866vd7wQ2qeCeqg7";

    // URL string
    let url = GIPHY_URL + "api_key=" + GIPHY_KEY;

    // Parse user input
    let term = document.querySelector("#searchterm").value;
    displayTerm = term;

    // Remove leading and trailing spaces
    term = term.trim();

    // Encode spaces and special characters
    term = encodeURIComponent(term);

    // Bail out if there is no search on the search bar
    if (term.length < 1) return;
    
    // Append search term to URL
    url += "&q=" + term;

    // Grab the search limit from <select> and append that to the URL too
    let limit = document.querySelector("#limit").value;
    url += "&limit=" + limit;

    // Update the UI
    document.querySelector("#status").innerHTML = '<b>Searching for "' + displayTerm + '"</b>';

    // Log the URL
    console.log(url);

    // Request the data :)
    getData(url);
}

function getData(url) {
    // Create an XHR Object
    let xhr = new XMLHttpRequest();

    // Set the onload handler
    xhr.onload = dataLoaded;

    // Set the onerror handler
    xhr.onerror = dataError;

    // Open connection and send the request
    xhr.open("GET", url);
    xhr.send();
}

// Callback functions
function dataLoaded(e) {
    // event.target is the xhr object
    let xhr = e.target;

    // xhr.responseText is the JSON file we just downloaded
    console.log(xhr.responseText);
    
    // Turn text into a parsable JavaScript object
    let obj = JSON.parse(xhr.responseText);

    // If there are no results, inform the user as such and return
    if (!obj.data || obj.data.length == 0) {
        document.querySelector("#status").innerHTML = '<b>No results found for "' + displayTerm + '"</b>';
        return;
    }

    // Start building an HTML string tht will be displayed to the user
    let results = obj.data;
    console.log("results.length = " + results.length);
    let bigString = '<p><i> Here are ' + results.length + ' results for "' + displayTerm + '"</i></p>';

    // Loop through the results
    for (let result of results) {
        // Get the URL to the GIF
        let smallURL = result.images.fixed_width_small.url;
        if (!smallURL) smallURL = "images/no-image-found.png";

        // Get the URL to the Giphy page
        let url = result.url;

        // Get the GIF's rating
        let rating = result.rating.toUpperCase();

        // Build a <div> to hold each result (with ES6 string templating)
        let line = `<div class='result'><img src='${smallURL}' title='${result.id}' />`;
        line += `<span>Rating: ${rating}</span>`;
        line += `<span><a target='_blank' href='${url}'>View on Giphy</a></span></div>`;

        // Add the <div> to the bigString and loop
        bigString += line;
    }

    // Show the user the freshly-built results
    document.querySelector("#content").innerHTML = bigString;

    // Update the status
    document.querySelector("#status").innerHTML = "<b>Success!</b>";
}

function dataError(e) {
    console.log("An error occurred :(");
}
