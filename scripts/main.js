// The current section in focus; a bunch of methods need this
// and rechecking it every time those methods are called isn't very fast so it's
// out here and only modified when neccesary
let currentFocus = "";

// Scrolls the screen to the given coordinates.
function scrollToCoords(x, y) {
    scroll({
        left: x,
        behavior: 'smooth'
    });
}

// Scrolls the screen to around the top of the given element.
function scrollToId(id) {
    let element = document.getElementById(id);
    let y = element.offsetTop + 60;
    scroll({
        top: y,
        left: element.offsetWidth,
        behavior: 'smooth'
    });
}

// "Focuses" on a section, based on part input. The selected section will
// become bigger and have a higher z-index, and will stay this way until
// another section is hovered over or the mouse approaches the screen edge.
// Will not activate on smaller screens due to the different layout.
function focusOn(part) {
    if (window.innerWidth < 1100) 
        return;

    // Choose sections to focus on based on the "part" var, and initialize
    // the imgMod variables that will be used a few dozen lines down for
    // repositioning the images specifically
    let text;
    let image;
    let imgLeftMod;
    let imgBottomMod;

    // Changes the current focus if the section being called with the "part" var
    // is different than previous section that was in focus
    if (currentFocus !== "" && currentFocus !== part)
        offFocus(currentFocus);
    currentFocus = part;

    if (part === "abMeA")
    {
        text = document.getElementById("aboutme-a");
        image = document.getElementById("aboutmeimg-a");
        imgBottomMod = 1 / 4;
        imgLeftMod = -1 / 4;
    }
    if (part === "abMeB")
    {
        text = document.getElementById("aboutme-b");
        image = document.getElementById("aboutmeimg-b");
        imgBottomMod = 2;
        imgLeftMod = 1 / 6;
    }
    if (part === "abMeC")
    {
        text = document.getElementById("aboutme-c");
        image = document.getElementById("aboutmeimg-c");
        imgBottomMod = 1;
        imgLeftMod = -1 / 8;
    }
    if (part === "projA")
    {
        text = document.getElementById("projects-a");
        image = document.getElementById("projectimg-a");
        imgBottomMod = 1 / 2;
        imgLeftMod = -2 / 3;
    }
    if (part === "projB")
    {
        text = document.getElementById("projects-b");
        image = document.getElementById("projectimg-b");
        imgBottomMod = -1 / 2;
        imgLeftMod = -1 / 3;
    }
    if (part === "projC")
    {
        text = document.getElementById("projects-c");
        image = document.getElementById("projectimg-c");
        imgBottomMod = 3 / 2;
        imgLeftMod = -2 / 3;
    }

    // If the section is currently in focus or defocusing (conveniently enough,
    // both states involve classes with "focus" in their name), early return so 
    // that it doesn't cause issues with multiple focus classes or early re-focusing
    if (image.className.includes("focus"))
        return;
    
    // Give the section's elements the extra "focus" class, the CSS 
    // will do most of the work from there
    text.className += " focus";
    image.className += " focus";
    
    // Reposition the images to put them into focus better; since each image's
    // initial position is hard-coded and funky, specialized variables are required
    // to move each one into focus properly
    let style = document.styleSheets[0];
    let imgBottom;
    let imgLeft;
    // Find the image's specific style and store their left and bottom modifiers
    // for use in calculating the image's translate animation
    for(let i = 0; i < style.cssRules.length; i++) {
        if(style.cssRules[i].selectorText === "#" + image.id) {
            imgBottom = style.cssRules[i].style.bottom;
            imgLeft = style.cssRules[i].style.left;

            imgBottom = parseInt(imgBottom.substring(0, imgBottom.length - 2));
            imgLeft = parseInt(imgLeft.substring(0, imgLeft.length - 2));
            break;
        }
    }
    // Multiply the image's vertical and horizontal transforms by imgMod vars
    // so that the transformations are consistent regardless of screen size
    image.style.transform = `translateY(${imgBottom * imgBottomMod}vh)`;
    image.style.transform += `translateX(${imgLeft * imgLeftMod}vw)`;
    image.style.transform += `scale(${1.1})`;

    // Give the center images access to pointer events temporarily so that it
    // can defocus sections if need be
    document.getElementById("center-image").style.pointerEvents = "all";
}

// Undoes the changes to the section made by onFocus(), if
// such changes are currently active. 
function offFocus(part) {
    if (window.innerWidth < 1100) 
        return;
    
    // Choose sections to return to normal based on the "part" var, and
    // return early if the mouse is touching either of them
    let text;
    let image;
    if (part === "abMeA")
    {
        text = document.getElementById("aboutme-a");
        image = document.getElementById("aboutmeimg-a");
    }
    if (part === "abMeB")
    {
        text = document.getElementById("aboutme-b");
        image = document.getElementById("aboutmeimg-b");
    }
    if (part === "abMeC")
    {
        text = document.getElementById("aboutme-c");
        image = document.getElementById("aboutmeimg-c");
    }
    if (part === "projA")
    {
        text = document.getElementById("projects-a");
        image = document.getElementById("projectimg-a");
    }
    if (part === "projB")
    {
        text = document.getElementById("projects-b");
        image = document.getElementById("projectimg-b");
    }
    if (part === "projC")
    {
        text = document.getElementById("projects-c");
        image = document.getElementById("projectimg-c");
    }
    
    // If the object isn't in focus, early return so that it doesn't defocus
    // multiple times and cause issues
    if (!image.className.includes(" focus"))
        return;

    // Replace the objects' "focus" class with a "defocus" class that transitions
    // out of the focus transformations and prevents other transitions
    text.className = text.className.replace(" focus", "");
    image.className = image.className.replace(" focus", "");
    image.style.transform = "";
    text.className += " defocus";
    image.className += " defocus";

    // Add an event listener that checks for when the defocus transition ends, then
    // removes the defocus class, re-enables transitions, and destroys itself to
    // save memory and prevent further transition issues
    // Cool and useful AbortController
    const controller = new AbortController();
    image.addEventListener("transitionend", () => {
        text.className = text.className.replace(" defocus", "");
        image.className = image.className.replace(" defocus", "");
        controller.abort(); // Remove the listener at this this point
    }, {signal: controller.signal});
}

// Checks to see if the mouse is too close to the horizontal edges of the
// screen, and calls defocusCurrent if they are
function defocusIfMouseCloseToEdge(event) {
    let mouseX = event.pageX;
    let mouseY = event.pageY;
    if (mouseX <= 50 || mouseX >= screen.width - 50)
        defocusCurrent();
}

function defocusIfMouseFarFromCurrent(event) {
    let mouseX = event.clientX;
    let mouseY = event.clientY;
    console.log("MOUSE POS: (" + mouseX + ", " + mouseY + ")")
    if (window.innerWidth < 1100 || currentFocus === "") 
        return;
    // Check which section is currently in-focus based on the "currentFocus" var, and
    // store the respective part's text/image pair in corresponding variables
    let text;
    let image;
    if (currentFocus === "abMeA")
    {
        text = document.getElementById("aboutme-a");
        image = document.getElementById("aboutmeimg-a");
    }
    if (currentFocus === "abMeB")
    {
        text = document.getElementById("aboutme-b");
        image = document.getElementById("aboutmeimg-b");
    }
    if (currentFocus === "abMeC")
    {
        text = document.getElementById("aboutme-c");
        image = document.getElementById("aboutmeimg-c");
    }
    if (currentFocus === "projA")
    {
        text = document.getElementById("projects-a");
        image = document.getElementById("projectimg-a");
    }
    if (currentFocus === "projB")
    {
        text = document.getElementById("projects-b");
        image = document.getElementById("projectimg-b");
    }
    if (currentFocus === "projC")
    {
        text = document.getElementById("projects-c");
        image = document.getElementById("projectimg-c");
    }

    // Store mouse and bounding rect information
    //let mouseX = event.clientX;
    //let mouseY = event.clientY;
    let textRect = text.getBoundingClientRect();
    let imgRect = image.getBoundingClientRect();

    // Calculate the current section's overall top, bottom, left, and right.
    // Overall top = lower of both tops, overall bottom = higher of both bottoms,
    // Overall left = lower of both lefts, overall right = higher of both rights
    let currentTop = smallerNumber(textRect.top, imgRect.top);
    let currentBottom = biggerNumber(textRect.bottom, imgRect.bottom);
    let currentRight = biggerNumber(textRect.right, imgRect.right);
    let currentLeft = smallerNumber(textRect.left, imgRect.left);

    // Force an off-focus if the mouse is at least 10px away from any of the
    // top, bottom, left, or right of the element. (note: the comparison
    // for right is 175 because of a weird thing where the largest right value var
    // was not accurate to the actual largest right value)
    if (mouseY <= currentTop - 10 || mouseY >= currentBottom + 10 ||
        mouseX <= currentLeft - 10 || mouseX >= currentRight + 175)
        {
            console.log("\nCurrent focus: " + currentFocus +
                "\nFocus top: " + currentTop + "\nFocus bottom: " + currentBottom +
                "\nFocus left: " + currentLeft + "\nFocus right: " + currentRight);
            console.log("defocuseded");
            defocusCurrent();
        }
}

// Automatically defocuses whatever section is currently in-focus, and prevents
// the center image from having pointer events to focus parts of sections behind
// it easier.
function defocusCurrent() {
    if (currentFocus !== "")
    {
        offFocus(currentFocus);
        currentFocus = "";
        document.getElementById("center-image").style.pointerEvents = "none";
    }
}

// Toggles the music and other webpage changes when the goat is clicked.
// You can optionally add "play" or "pause" as a parameter to explicitly
// set the music state.
// NOTE: One of the webpage changes involves changing the image of the 
// music toggle, but I don't have that other image yet so it'll be
// commented out for now
function toggleMusic(explicit = "") {
    let music = document.getElementById("music");
    //let image = document.getElementById("goat");
    if (music != null) {
        if (!music.paused || explicit === "pause") {
            music.pause();
            //image.src = "media/goat.png";
            document.getElementById("nowplaying").style.opacity = 0;
        }
        else if (music.paused || explicit === "play"){
            music.play();
            //image.src = "media/goat.png";
            document.getElementById("nowplaying").style.opacity = 100;
        }
    }
}

// Helper function that literally just returns the larger of two numbers.
function biggerNumber(a, b) {
    if (a > b)
        return a;
    return b;
}

// Helper function that literally just returns the smaller of two numbers.
function smallerNumber(a, b) {
    if (a < b)
        return a;
    return b;
}