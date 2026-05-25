window.onload = (e) => {document.querySelector("#search").onclick = searchButtonClicked};
	
let displayTerm = "";

function searchButtonClicked(){
    console.log("searchButtonClicked() called");

    // API URL
    const API_URL = "https://pokeapi.co/api/v2/";

    // URL string
    let url = API_URL;

    // Get filters here when I add them

    // Parse user input
    let term = document.querySelector("#searchterm").value;
    displayTerm = term;

    // Remove leading and trailing spaces
    term = term.trim();

    // Replace any space

    // Encode spaces and special characters
    term = encodeURIComponent(term);

    // Bail out if there is no search on the search bar
    if (term.length < 1) return;
    
    // Append search term to URL
    url += "move/" + term;

    //
    console.log(url);

    // Update the UI
    document.querySelector("#status").innerHTML = '<b>Searching for "' + displayTerm + '"</b>';

    // Request the data
    getData(url, moveDataLoaded);
}

function getData(url, onLoadCallBack) {
    // Create an XHR Object
    let xhr = new XMLHttpRequest();

    // Set the onload handler
    xhr.onload = onLoadCallBack;

    // Set the onerror handler
    xhr.onerror = dataError;

    // Open connection and send the request
    xhr.open("GET", url);
    xhr.send();
}

// Callback functions
function moveDataLoaded(e) {
    // event.target is the xhr object
    let xhr = e.target;
    if (xhr.responseText == "Not Found")
    {
        document.querySelector("#status").innerHTML = "No move data for " + document.querySelector("#searchterm").value;
        document.querySelector("#content").innerHTML = "";
        console.log("an error has occurred");
        return;
    }

    // Turn text into a parsable JavaScript object
    let obj = JSON.parse(xhr.responseText);

    console.log(obj);

    // If there are no results, inform the user as such and return
    if (!obj || obj.length == 0) {
        document.querySelector("#status").innerHTML = '<b>No results found for "' + displayTerm + '"</b>';
        return;
    }

    // Start building an HTML string tht will be displayed to the user
    let result = obj;
    if (result.contest_effect !== null)
    {
        let bigString = "";
        bigString = "Move Name: " + result.name + 
         "<br />Move Type: " + result.type.name + 
         "<br />Contest Type: " + result.contest_type.name;
 
         // Request contest data (why is this stored in a seperate url)
         getData(result.contest_effect.url, e => {
             let xhr = e.target;
         
             // Turn text into a parsable JavaScript object
             let contestData = JSON.parse(xhr.responseText);
 
             console.log(contestData);
 
             // If there are no results, inform the user as such and return
             if (!contestData || contestData.length == 0) {
                 document.querySelector("#status").innerHTML = '<b>No results found for "' + displayTerm + '"</b>';
                 return;
             }
 
             bigString += "<br />Appeal: " + contestData.appeal +
             "<br />Jam: " + contestData.jam +
             "<br />Effect: " + contestData.flavor_text_entries[0].flavor_text;
 
             // Show the user the freshly-built results
             document.querySelector("#content").innerHTML = bigString;
         
             // Update the status
             document.querySelector("#status").innerHTML = "<b>Success!</b>";
         });
    }
    else
    {
        document.querySelector("#status").innerHTML = result.name + " does not have contest data.";
        document.querySelector("#content").innerHTML = "";
    }
    

    /*bigString += "Appeal: " + result.appeal +
        "\nJam: " + result.jam +
        "\nEffect: " + result.flavor_text_entries.flavor_text;

    // Will deal with multiple moves later
    /*
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
    }*/
}

function dataError(e) {
    console.log("An error occurred :(");
}