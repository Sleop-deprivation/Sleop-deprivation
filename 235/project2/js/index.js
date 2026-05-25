// API URL
const API_URL = "https://pokeapi.co/api/v2/";

// On load, give the buttons their respective scripts, begin initializing move lists,
// and display the last stored search if one exists.
window.onload = (e) => {
    document.querySelector("#search-button").onclick = searchButtonClicked;
    document.querySelector("#reset").onclick = resetParams;
    initMoveList();
    retrieveStoredData();
};

// These are the move lists that will be initialized
let moveList = "";
let gen3MoveList = new Array;
let moveTypeLists = [
    cool = ["Cool"],
    beautiful = ["Beautiful"],
    cute = ["Cute"],
    clever = ["Clever"],
    tough = ["Tough"]
];

// Local storage keys
const prefix = "ls1539";
const moveSearchKey = prefix + "move";
const genSelectKey = prefix + "gen";
const pokemonSearchKey = prefix + "pokemon";
const typeSelectKey = prefix + "type";

// Some other important vars
let currentGeneration = "gen3";
let displayTerm = "";

// When the search button is clicked (or when forceSearch is called), get
// the current data from each of the search bars and filters, save their
// results in local storage, and prepare the appropriate output.
function searchButtonClicked(){
    //#region Saving in local storage
    // Because blanks are unviersally factored into searches, all search values will be saved,
    // empty or not
    localStorage.setItem(moveSearchKey, document.querySelector("#searchterm").value);
    localStorage.setItem(genSelectKey, currentGeneration);
    localStorage.setItem(pokemonSearchKey, document.querySelector("#pokemon-search").value);
    localStorage.setItem(typeSelectKey, document.querySelector("#types").value);
    //#endregion

    // URL string
    let url = API_URL;

    // Parse user input
    let term = document.querySelector("#searchterm").value;
    displayTerm = term;

    // Remove leading and trailing spaces
    term = term.trim();

    // Format the move's name to be compatible with PokeAPI:
    // Replace the space with a dash, and make the string lowercase
    term = formatForSearch(term);

    // Encode spaces and special characters
    term = encodeURIComponent(term);

    // If the search bar is empty but either of the filters aren't, search for all moves of that type 
    // and/or that are on that Pokémon
    if (term.length < 1)
    {
        if (document.querySelector("#pokemon-search").value)
        {
            //#region Pokémon search formatting code
            // Format the search term for API use
            // Remove leading and trailing spaces
            let term = document.querySelector("#pokemon-search").value
            term = term.trim();

            // Replace any space with a dash, and make the string lowercase
            term = formatForSearch(term);
            term = term.toLowerCase();

            // Add "-normal" to searches for Deoxys to not return null
            if (term === "deoxys")
            term += "-normal";

            // Encode spaces and special characters
            term = encodeURIComponent(term);

            //#endregion
            // URL string
            let url = API_URL + "pokemon/" + term;
            getData(url, e => {
                // If the Pokémon doesn't exist, inform the user as such
                let newXhr = e.target;
                if (newXhr.responseText == "Not Found")
                {
                    document.querySelector("#status").innerHTML =
                    `No Pokémon data found for <span class='capitalize'>${document.querySelector("#pokemon-search").value}</span>.`;
                    return;
                }
                else
                {
                    let pokemon = JSON.parse(newXhr.responseText);
                    // If the Pokémon doesn't appear in the selected games, inform the user as such
                    if (pokemon.id >= 494 || (pokemon.id > 386 && currentGeneration == "gen3"))
                    {
                        document.querySelector("#status").innerHTML =
                        `<span class='capitalize'>${document.querySelector("#pokemon-search").value}</span> is not 
                        available in these games.`;
                        document.getElementById("content").style.display = "none";
                        return;
                    }

                    // Display all of the moves that the Pokémon can learn, filtering by contest type if one was supplied
                    if (document.querySelector("#types").value != "none")
                        findAllMovesByType(pokemon, moveTypeLists[parseInt(document.querySelector("#types").value)]);
                    else
                        getAllMovesOfPokemon(pokemon);
                }
            });
        }
        else
        {
            document.querySelector("#status").innerHTML = '<b>Please enter a search term!</b>';
            return;
        }
    }
    // Otherwise, do a normal search
    else
    {
        // Append search term to URL
        url += "move/" + term;

        // Update the UI
        document.querySelector("#status").innerHTML = '<b>Searching for "' + displayTerm + '"</b>';
        if (document.querySelector("#pokemon-search").value !== "")
            document.querySelector("#status").innerHTML += ' on <b>"' + document.querySelector("#pokemon-search").value + '"</b>'; 

        // Request the data
        getData(url, moveDataLoaded);
    }
    
}

// Initializes the move lists. Namely, the full move list, the Gen 3 move list, and all 
// type-based move lists get filled with their respective moves' names for future reference
function initMoveList()
{
    getData("https://pokeapi.co/api/v2/move?limit=467", e => {
        // Fill the move list with all moves up to Generation 4
        let xhr = e.target;
        moveList = JSON.parse(xhr.responseText).results;

        // Get the list of moves that changed types using a Bulbapedia API call to filter them out 
        // of incorrect arrays in the following call
        // (thanks Bulbapedia (sarcasm))
        let filteredMovesURL = "https://bulbapedia.bulbagarden.net/w/api.php?action=parse&format=json&origin=*&page=List_of_modified_moves&section=90";
        getData(filteredMovesURL, e => {
            let filteredXhr = e.target;
            let filteredMoveList = JSON.parse(filteredXhr.responseText).parse.text['*'];

            //#region Creating a list of moves that changed type
            // A regular expression filter, searching for, within every title field in the section's HTML,
            // a string of 1-3 words (accounting for hyphens) which is put into the "title" section,
            // and the following clarifier ("move" or "condition"), which is stored in the "property" section.
            // I don't *need* the clarifier section or the first condition after each move, but both help me visualize the result.
            let regexpLinks = /title=\"(?<title>\w+\s?\-?\w*\s?\-?\w*) \((?<property>\w+)\)\">/mg;
            let allLinks = [...filteredMoveList.matchAll(regexpLinks)];

            // Creates a new array from that, having only the moves and their respective new types stored
            let movesThatChangedType = new Array;
            // Start on idx 2 because the first two contest types don't correspond to move data,
            // and increase i by 3 per loop because of the way allLinks' data is stored
            for (let i = 2; i < allLinks.length; i += 3)
            {
                let currentMoveData = 
                {
                    name: formatForSearch(allLinks[i].groups.title),
                    newType: allLinks[i+2].groups.title
                };
                movesThatChangedType.push(currentMoveData);
            }
            //#endregion

            // Fill each respective move type list with the move types using a seperate API to make fewer calls overall
            // (thanks Bulbapedia)
            for (let type of moveTypeLists)
            {
                let bulbapedia_url = 
                `https://bulbapedia.bulbagarden.net/w/api.php?action=parse&format=json&origin=*&page=${type[0]}%20(condition)`
                getData(bulbapedia_url, e => {
                    let newXhr = e.target;
                    let linksList = JSON.parse(newXhr.responseText).parse.links;
                    // Filter the list for moves and add those to the list
                    for (let link of linksList)
                    {
                        let linkName = link['*'];
                        if (linkName.substring(linkName.length - 6) == "(move)")
                            type.push(formatForSearch(linkName.substring(0, linkName.length - 7)));
                    }

                    // Remove moves that had their types changed in Gen 6, since they'd appear on two lists and be problematic
                    let changedMovesOfType = movesThatChangedType.filter(move => move.newType === type[0]);
                    for (let i = 0; i < type.length; i++) {
                        for (let move2 of changedMovesOfType) {
                            if (move2.name === type[i])
                            {
                                type.splice(i, 1);
                                i--;
                                continue;
                            }
                        }
                    }
                })
            }
        })
        
        // Fill the Gen 3 move list (move index goes up to 354)
        for (let i = 0; i < 354; i++)
        {
            gen3MoveList.push(moveList[i]);
        }
    })
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
    let obj = null;

    // Turn text into a parsable JavaScript object
    if (xhr.responseText != "Not Found")
        obj = JSON.parse(xhr.responseText);

    // If a Pokémon is in the search field, make sure the move is compatible before displaying results
    if (document.querySelector("#pokemon-search").value !== "")
    {
        // Format the search term for API use
        // Remove leading and trailing spaces
        let term = document.querySelector("#pokemon-search").value
        term = term.trim();

        // Replace any space with a dash, and make the string lowercase
        term = formatForSearch(term);

        // Add "-normal" to searches for Deoxys to not return null
        if (term === "deoxys")
            term += "-normal";

        // Encode spaces and special characters
        term = encodeURIComponent(term);

        // URL string
        let url = API_URL + "pokemon/" + term;
        getData(url, e => {
            let newXhr = e.target;
            if (newXhr.responseText == "Not Found")
            {
                document.querySelector("#status").innerHTML =
                `No Pokémon data found for <span class='capitalize'>${document.querySelector("#pokemon-search").value}</span>.`;
                document.getElementById("content").style.display = "none";
                return;
            }
            else
            {
                let pokemon = JSON.parse(newXhr.responseText);
                // If the Pokémon doesn't appear in the selected games, inform the user as such
                if (pokemon.id >= 494 || (pokemon.id > 386 && currentGeneration == "gen3"))
                {
                    document.querySelector("#status").innerHTML =
                    `<span class='capitalize'>${document.querySelector("#pokemon-search").value}</span> is not 
                    available in these games.`;
                    document.getElementById("content").style.display = "none";
                    return;
                }

                // If the result returns "Not Found", search for moves that contain that string and can be learned by that Pokémon
                if (obj == null)
                {
                    findMovesByName(formatForSearch(displayTerm), pokemon);
                    return;
                }

                // Otherwise, check to see if that move can be learned by that Pokémon and display the move if so
                if (checkIfLearnedBy(obj.name, pokemon))
                    findSingleMove(obj);
                else
                {
                    document.querySelector("#status").innerHTML =
                    `<span class='capitalize'>${pokemon.name}</span> cannot learn <span class='capitalize'>
                    ${formatForDisplay(obj.name)}</span>.`;                    
                    document.querySelector("#content").innerHTML = "";
                    document.getElementById("content").style.display = "none";
                }
            }
        })
    }
    else
    {
        // If the result returns "Not Found", search for moves that contain that string
        if (xhr.responseText == "Not Found")
        {
            findMovesByName(formatForSearch(displayTerm));
            return;
        }

        // Otherwise, simply return that object
        findSingleMove(obj);
    }
}

// Builds and displays data on a move given a successful API GET call.
function findSingleMove(result) {
    // Start building an HTML string that will be displayed to the user
    // Remove the hyphen in the move's name
    result.name = formatForDisplay(result.name);
    let bigString = "";
    bigString = "<span class='capitalize' id='name'>" + result.name + 
        `</span><span class='capitalize' id='type'>Move Type: 
        <img src='media/move-types/${result.type.name}.png' alt='${result.type.name}'
        style='vertical-align: middle;height: 18px;'>` ;

    // If the selected generation is Gen 3 and the move has contest data, request it from a seperate URL
    if (result.contest_effect !== null && 
        currentGeneration === "gen3")
    {
        getData(result.contest_effect.url, e => {
            let xhr = e.target;
        
            // Turn text into a parsable JavaScript object
            let contestData = JSON.parse(xhr.responseText);

            // If there are no results, inform the user as such and return
            if (!contestData || contestData.length == 0) {
                document.querySelector("#status").innerHTML = 
                `No contest data found for <span class='capitalize'>${document.querySelector("#searchterm").value}</span>.`;
                document.getElementById("content").style.display = "none";
                return;
            }

            // Append the contest data to the big string
            bigString += "</span><span class='capitalize' id='contest-type'>Contest Type: " +
            `<img src='media/contest-types/${result.contest_type.name}.png' alt='${result.contest_type.name}'
            style='vertical-align: middle;height: 18px;'>` +
            "</span><span id='appeal'>Appeal: "; 
            for (let i = 0; i < 8; i++){
                if (i < contestData.appeal)
                    bigString += "❤️";
                else if (i < 4)
                    bigString += "🤍";
            }
            bigString += "</span><span id='jam'>Jam: ";
            for (let i = 0; i < 4; i++){
                if (i < contestData.jam)
                    bigString += "🖤";
                else
                    bigString += "🤍";
            }
            bigString += `</span><span id='effect'>Effect: 
            ${contestData.effect_entries[0].effect}</span>`;

            // Show the user the freshly-built results
            document.querySelector("#content").innerHTML = bigString;
            document.getElementById("content").style.backgroundImage =
            `linear-gradient(to right, ${colorByType(result.type.name)}, ${colorByType(result.contest_type.name)})`;

            // Set the current display type to a grid, since it may change when searching
            document.getElementById("content").style.display = "inline-grid";

            // Re-format the content menu to fit the data
            document.getElementById("content").style.gridTemplateAreas =
                '"name name" "type contest-type" "appeal jam" "effect effect"';
        
            // Update the status
            document.querySelector("#status").innerHTML = "<b>Success!</b>";
        });
    }
    // Do the same thing but for Gen 4 if that's the current selected generation
    else if (result.super_contest_effect !== null && 
        currentGeneration === "gen4")
    {
        getData(result.super_contest_effect.url, e => {
            let xhr = e.target;
        
            // Turn text into a parsable JavaScript object
            let contestData = JSON.parse(xhr.responseText);

            // If there are no results, inform the user as such and return
            if (!contestData || contestData.length == 0) {
                document.querySelector("#status").innerHTML = 
                `No super contest data found for <span class='capitalize'>${document.querySelector("#searchterm").value}</span>.`;
                document.getElementById("content").style.backgroundImage = "";
                document.getElementById("content").style.display = "none";
                return;
            }

            bigString += "</span><span class='capitalize' id='contest-type'>Contest Type: " 
            + `<img src='media/contest-types/${result.contest_type.name}.png' alt='${result.contest_type.name}'
            style='vertical-align: middle;height: 18px;'>`
            + "</span><span id='appeal'>Appeal: "; 
            for (let i = 0; i < 8; i++){
                if (i < contestData.appeal)
                    bigString += "❤️";
                else if (i < 4)
                    bigString += "🤍";
            }
            bigString += `</span><span id='effect'>Effect: 
            ${contestData.flavor_text_entries[0].flavor_text}</span>`;

            // Show the user the freshly-built results
            document.querySelector("#content").innerHTML = bigString;
            document.getElementById("content").style.gridTemplateAreas =
                '"name name" "type contest-type" "appeal appeal" "effect effect"';
            document.getElementById("content").style.backgroundImage =
            `linear-gradient(to right, ${colorByType(result.type.name)}, ${colorByType(result.contest_type.name)})`;

            // Set the current display type to a grid, since it may change when searching
            document.getElementById("content").style.display = "inline-grid";

            // Update the status
            document.querySelector("#status").innerHTML = "<b>Success!</b>";
        });
    }
    // Display an error message to the user otherwise.
    else
    {
        document.querySelector("#status").innerHTML = `<span class='capitalize'>${result.name}</span> does not have contest data.`;
        document.getElementById("content").style.backgroundImage = "";
        document.querySelector("#content").innerHTML = "";
        document.getElementById("content").style.display = "none";
    }
}

// Searches for all moves that contain name within them, further filtering
// the list if a Pokémon is searched or a type is specified
function findMovesByName(name, pokemon=null)
{
    let bigString = "";
    let tentativeMoveList = new Array;
    document.getElementById("content").style.backgroundImage = "";

    // Only search for Gen 3 moves if looking up Gen 3 data
    if (currentGeneration === "gen3")
    {
        for (let i = 0; i < 354; i++)
        {
            if (moveList[i].name.search(name) != -1)
                tentativeMoveList.push(moveList[i].name);
        }
    }
    else
    {
        moveList.forEach(move => {
            if (move.name.search(name) != -1)
                tentativeMoveList.push(move.name);
        });
    }

    // Filter the results if currently filtering by move type
    if (document.querySelector("#types").value != "none")
    {
        let typeList = moveTypeLists[parseInt(document.querySelector("#types").value)];
        tentativeMoveList = tentativeMoveList.filter(move => typeList.includes(move));
    }
    
    // Further filter the moves if searching by Pokémon
    if (pokemon !== null)
        tentativeMoveList = tentativeMoveList.filter(move => checkIfLearnedBy(move, pokemon));

    tentativeMoveList.forEach(move => {
        bigString += buildMoveListElement(move);
    })
    
    // Display a message if there are no moves of a similar name, otherwise
    // display the new string of moves
    document.getElementById("repeat-search").style.display = "none";
    if (bigString)
    {
        document.querySelector("#content").innerHTML = bigString;
        document.getElementById("content").style.display = "inline-flex";
        
        document.querySelector("#status").innerHTML = "<b>Found the following moves with similar names:</b>";
    }
    else
    {
        bigString = "No ";
        if (document.querySelector("#types").value != "none")
            bigString += moveTypeLists[parseInt(document.querySelector("#types").value)][0] + " ";
        bigString += `move data found for "<span class='capitalize'>${document.querySelector("#searchterm").value}"</span>`;
        if (pokemon != null)
            bigString += ` that can be learned by <span class='capitalize'>${pokemon.name}</span>`;
        bigString += ".";
        document.querySelector("#status").innerHTML = bigString;
        document.getElementById("content").style.display = "none";
        document.querySelector("#content").innerHTML = "";
        document.getElementById("content").style.backgroundImage = "";
    }
}

// Finds all moves learned by the given Pokémon of the given type,
// provided by the list of moves of that type.
function findAllMovesByType(pokemon, typeList) {
    // Initialize some variables
    let fullMoveList = new Array;
    let movesToCheck = moveList;
    // Make sure that only Gen 3 moves are being checked if the toggle for it is enabled
    if (currentGeneration === "gen3")
        movesToCheck = gen3MoveList;
    
    // For each move in a Pokémon's kit, if it is a part of the type list
    // and also a part of that generation, add it to the moves list
    for (let move of pokemon.moves)
    {
        if (typeList.includes(move.move.name))
        {
            for (let moveByType of movesToCheck)
            {
                if (moveByType.name === move.move.name)
                {
                    fullMoveList.push(move.move.name);
                    break;
                }
            }
        }
    }

    // Display a message if the Pokémon somehow can't learn any moves of that type,
    // otherwise build the move display
    document.getElementById("repeat-search").style.display = "none";
    if (fullMoveList === null)
    {
        document.querySelector("#status").innerHTML =
            `No ${typeList[0]} moves can be learned by <span class='capitalize'>${pokemon.name}.</span>`;
        document.getElementById("content").style.display = "none";
        document.getElementById("content").style.backgroundImage = "";
    }
    else
    {
        let bigString = "";
        fullMoveList.forEach(move => {
            bigString += buildMoveListElement(move);
        });

        document.querySelector("#content").innerHTML = bigString;
        document.getElementById("content").style.backgroundImage = "";
        document.getElementById("content").style.display = "inline-flex";
        document.querySelector("#status").innerHTML = 
            `<span class='capitalize'>${pokemon.name}</span> can learn the following ${typeList[0]} moves:`;
    }
}

// Checks to see if the given move can be learned by the given Pokémon.
function checkIfLearnedBy(moveName, pokemon){
    for (let move of pokemon.moves)
    {
        if (move.move.name === moveName)
            return true;
    }
    return false;
}

// Finds every move a Pokémon can learn and displays a list of them.
function getAllMovesOfPokemon(pokemon)
{
    // Initialize vars
    let fullMoveList = new Array;
    let movesToCheck = moveList;
    if (currentGeneration === "gen3")
        movesToCheck = gen3MoveList;

    // Check the Pokémon's full move list, and only include moves in that generation
    for (let move of pokemon.moves)
    {
        for (let moveByType of movesToCheck)
        {
            if (moveByType.name === move.move.name)
            {
                fullMoveList.push(move.move.name);
                break;
            }
        }
    }

    // Build the list of returned moves
    let bigString = "";
    fullMoveList.forEach(move => {
        bigString += buildMoveListElement(move);
    });

    // Display the list of returned moves
    document.querySelector("#content").innerHTML = bigString;
    document.getElementById("content").style.display = "inline-flex";        
    document.querySelector("#status").innerHTML = 
        `<span class='capitalize'>${pokemon.name}</span> can learn the following moves:`;
    document.getElementById("repeat-search").style.display = "none";
}

// Forces a search with the parameters provided. Since this is generally called upon
// selecting one move from a list of moves, it additionally makes a "repeat last search"
// button visible for the user's convinience to go back to the last search (which also 
// calls this method).
function forceSearch(move = "", gen = "gen3", pokemon = "", type = "none") {
    // Set the "repeat last search" button to use the current search terms for its forceSearch() call.
    document.querySelector("#repeat-search").setAttribute('onclick', `forceSearch(
        '${document.querySelector("#searchterm").value}',
        '${currentGeneration}',
        '${document.querySelector("#pokemon-search").value}',
        '${document.querySelector("#types").value}')`);
    document.getElementById("content").style.backgroundImage = "";
    document.getElementById("repeat-search").style.display = "initial";
    
    // Update all of the values to be of the search term
    document.querySelector("#searchterm").value = move;
    document.querySelector("#pokemon-search").value = pokemon;
    document.querySelector("#types").value = type;
    document.querySelector(`#${gen}`).checked = true;
    selectChoice(gen);
    searchButtonClicked();
}

// Builds a string for a <p> element representing the given move, and returns it.
// The <p> element will show the move's name, have a color based on its type, and 
// will call forceSearch() when clicked, specifying itself as the name.
function buildMoveListElement(move) {
    return `<p onclick=forceSearch('${move}','${currentGeneration}') class='capitalize' 
    style='color: ${findTypeColorOfMove(move)};'>${formatForDisplay(move)}</p>`;
}

// Formats the string to have dashes instead of spaces and be fully lowercase for use in API searching.
function formatForSearch(term) {
    return term.replaceAll(" ", "-").toLowerCase();
}

// Formats the string to replace all dashes with spaces for display purposes.
function formatForDisplay(term) {
    return term.replaceAll("-", " ");
}

// Updates the current generation value when the respective media button is clicked.
function selectChoice(value) {
    currentGeneration = value;    
}

// A lookup chart disguised as a function that returns a color corresponding to the 
// type inputted. Some types share the same colors, as they do in Pokémon games as well.
// Additionally, since Fairy wasn't a type in Gens 3 & 4 and all Fairy type moves in those 
// generations are Normal type, Fairy is treated as Normal.
function colorByType(type) {
    if (type === "normal" || type === "fairy")
        return "#c2c0a5";
    if (type === "fire" || type === "cool")
        return "#ff822e";
    if (type === "fighting")
        return "#912d19";
    if (type === "water" || type === "beauty" || type === "beautiful")
        return "#066dc7";
    if (type === "flying")
        return "#ab8df7";
    if (type === "grass" || type === "smart" || type === "clever")
        return "#63a840";
    if (type === "poison")
        return "#7f40a8"
    if (type === "electric" || type === "tough")
        return "#f7e754";
    if (type === "ground")
        return "#e8d68e";
    if (type === "psychic" || type === "cute")
        return "#f261ac";
    if (type === "rock")
        return "#ab8a49";
    if (type === "ice")
        return "#b0fffb";
    if (type === "bug")
        return "#bef089";
    if (type === "dragon")
        return "#42377a";
    if (type === "ghost")
        return "#3a294f";
    if (type === "dark")
        return "#1c0a03";
    return "#707070";
}

// Finds the color relating to the contest type of the given move name.
function findTypeColorOfMove(moveName) {
    let typeFound = false;
    let color = "#000000";
    for (let type of moveTypeLists)
    {
        for (let move of type)
        {
            if (move === moveName)
            {
                typeFound = true;
                color = colorByType(type[0].toLowerCase());
                break;
            }
        }
        if (typeFound)
            break;
    }
    // Yellow (representing Tough) is made darker to make it more visible on the pink background
    if (color === "#f7e754")
        color = "#b3a100";
    return color;
}

function dataError(e) {
    console.log("An error occurred :(");
}

// Restores the last search the user made upon closing the page.
function retrieveStoredData() {
    // Find the data stored in local storage
    let storedMove = localStorage.getItem(moveSearchKey);
    let storedGen = localStorage.getItem(genSelectKey);
    let storedPokemon = localStorage.getItem(pokemonSearchKey);
    let storedType = localStorage.getItem(typeSelectKey);

    // If any are null, set the vars to their corresponding filters' respective defaults
    if (storedMove === null)
        storedMove = "";
    if (storedGen === null)
        storedGen = "gen3";
    if (storedPokemon === null)
        storedPokemon = "";
    if (storedType === null)
        storedType = "none";

    // Set each filter's value to their respective value in storage
    document.querySelector("#searchterm").value = storedMove;
    document.querySelector("#pokemon-search").value = storedPokemon;
    document.querySelector("#types").value = storedType;
    document.querySelector(`#${storedGen}`).checked = true;
    currentGeneration = storedGen;
}

// Resets the entire page to its state upon first loading the page.
function resetParams() {
    document.querySelector("#searchterm").value = "";
    document.querySelector("#status").innerHTML = "Ready to search!";
    document.querySelector("#content").innerHTML = "<h2>Tips:</h2>" +
        "<p>RSE = Ruby/Sapphire/Emerald (Generation 3), DPPt = Diamond/Pearl/Platinum (Generation 4)</p>" +
        "<p>If a searched move is returned successfully, it will ignore the contest type filter.</p>" +
        "<p>Only one of the filters needs to be filled before searching, but the resulting move list may be quite long.</p>" +
        "<p>When given a list of moves, you can click on one to automatically give you that move's data.</p>" +
        "<p>After searching for a move from a list, you can repeat your last search with the button on the bottom.</p>" +
        "<p>The last search will also be saved upon closing the page, and will be there when it's re-opened.</p>" +
        "<p>You can only access the data of Pokemon and moves if they appear in the selected games. No searching for Bidoof in RSE!</p>";
    document.querySelector("#content").style.display="inline-flex";
    document.querySelector("#pokemon-search").value = "";
    document.querySelector("#types").value = "none";
    document.getElementById("content").style.backgroundImage = "";
}

