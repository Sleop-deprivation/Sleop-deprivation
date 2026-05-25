// Helper function that literally just returns the larger of two numbers.
export const biggerNumber = (a : number, b : number) => {
    if (a > b)
        return a;
    return b;
}

// Helper function that literally just returns the smaller of two numbers.
export const smallerNumber = (a : number, b : number) => {
    if (a < b)
        return a;
    return b;
}

// Helper function that takes a section's textId and returns its corresponding
// imageId.
export const getImageIdFromTextId = (textId : string) => {
    let imageId = textId.substring(0, textId.length - 2);
    imageId += `img-${textId[textId.length - 1]}`;
    return imageId;
}

// Scrolls the screen to the given coordinates.
export const scrollToCoords = (x : number, y : number) => {
    scroll({
        left: x,
        behavior: 'smooth'
    });
}

// Scrolls the screen to around the top of the given element.
export const scrollToId = (id : string) => {
    let element = document.querySelector(`#${id}`) as HTMLElement;
    let y = element.offsetTop + 60;
    scroll({
        top: y,
        left: element.offsetWidth,
        behavior: 'smooth'
    });
}

// Toggles the music and other webpage changes when the goat is clicked.
// You can optionally add "play" or "pause" as a parameter to explicitly
// set the music state.
// NOTE: One of the webpage changes involves changing the image of the 
// music toggle, but I don't have that other image yet so it'll be
// commented out for now
export const toggleMusic = (explicit : string = "") => {
    const music = document.getElementById("music") as HTMLAudioElement;
    //let image = document.getElementById("goat");
    if (music != null) {
        if (!music.paused || explicit === "pause") {
            music.pause();
            //image.src = "media/goat.png";
            document.getElementById("nowplaying").style.opacity = "0";
        }
        else if (music.paused || explicit === "play"){
            music.play();
            //image.src = "media/goat.png";
            document.getElementById("nowplaying").style.opacity = "100";
        }
    }
}