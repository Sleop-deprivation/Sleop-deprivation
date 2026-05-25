/**
 * @overview Homework 1
 * @author Leo Schindler-Gerendasi <ls1539@rit.edu>
 */

/** Imported function */
import {getWordFromArray} from "./utils.js"

/** Module variables */
let words1;
let words2;
let words3;
let output = document.querySelector("#output");

/**
 * Genereates some technobabble and displays it on the page. It will default to generating one string, but if an amount is
 * specified, it will generate and display that many strings.
 * @param {number} numOfBabble - The amount of babble strings to generate.
 */
const generateBabble = (numOfBabble = 1) => {
    let html = "";
    for (let i = 0; i < numOfBabble; i++) {
        html += `${getWordFromArray(words1)} ${getWordFromArray(words2)} ${getWordFromArray(words3)} <br>`
    }
    output.innerHTML = html;
}

/**
 * Loads the babble-data.json file and calls babbleLoaded() to handle the usage of the JSON data.
 */
const loadBabble = () => {
    const url = "data/babble-data.json";
    const xhr = new XMLHttpRequest();
    xhr.onload = (e) => {
        console.log(`In onload - HTTP Status Code = ${e.target.status}`);
        const text = e.target.responseText;
        let json;
        try {
            json = JSON.parse(text);
        } catch {
            console.log("JSON.parse() failed!");
            return;
        }

        babbleLoaded(json);        
    };
    xhr.onerror = e => console.log(`In onerror - HTTP Status Code = ${e.target.status}`);
    xhr.open("GET", url);
    xhr.send();
}

/**
 * Initializes the words arrays, generates and displays the initial babble, and assigns generateBabble() events
 * to the corresponding buttons.
 * @param {JSON} json - The JSON data, ideallt from data/babble-data.json.
 */
function babbleLoaded(json) {
    words1 = json.words1;
    words2 = json.words2;
    words3 = json.words3;
    generateBabble();
    document.querySelector("#single-babble").onclick = () => {generateBabble()};
    document.querySelector("#quintuple-babble").onclick = () => {generateBabble(5)};
}

loadBabble();