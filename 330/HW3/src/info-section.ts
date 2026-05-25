import { biggerNumber, smallerNumber, getImageIdFromTextId } from "./utils";

enum Sections {
    TopLeft = 0,
    MiddleLeft,
    BottomLeft,
    TopRight,
    MiddleRight,
    BottomRight
}

const infoSectionVals = [
{
    textId : "projects-a",
    imageId : "projectsimg-a",
    imgBottomMod : 1/2,
    imgLeftMod : -2/3
}, 
{
    textId : "projects-b",
    imageId : "projectsimg-b",
    imgBottomMod : -1/2,
    imgLeftMod : -1/3
},
{
    textId : "projects-c",
    imageId : "projectsimg-c",
    imgBottomMod : 3/2,
    imgLeftMod : -2/3
},
{
    textId : "aboutme-a",
    imageId : "aboutmeimg-a",
    imgBottomMod : 1/4,
    imgLeftMod : -1/4
},
{
    textId : "aboutme-b",
    imageId : "aboutmeimg-b",
    imgBottomMod : 2,
    imgLeftMod : 1/6
},
{
    textId : "aboutme-c",
    imageId : "aboutmeimg-c",
    imgBottomMod : 1,
    imgLeftMod : -1/8
}];

// The current section in focus; a bunch of methods need this
// and rechecking it every time those methods are called isn't very fast so it's
// out here and only modified when neccesary
let currentFocus : string = "";

// "Focuses" on a section, based on part input. The selected section will
// become bigger and have a higher z-index, and will stay this way until
// another section is hovered over or the mouse approaches the screen edge.
// Will not activate on smaller screens due to the different layout.
const focusOn = ({textId, imageId, imgBottomMod, imgLeftMod}) => {
    if (window.innerWidth < 1100) 
        return;

    // Choose sections to focus on based on the "part" var, and initialize
    // the imgMod variables that will be used a few dozen lines down for
    // repositioning the images specifically
    let text : HTMLElement = document.querySelector(`#${textId}`);
    let image : HTMLElement = document.querySelector(`#${imageId}`);

    // Changes the current focus if the section being called with the "part" var
    // is different than previous section that was in focus
    if (currentFocus !== "" && currentFocus !== textId)
        defocusCurrent();
    currentFocus = textId;

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
    let imgBottom : string;
    let imgLeft : string;
    // Find the image's specific style and store their left and bottom modifiers
    // for use in calculating the image's translate animation
    for(let i = 0; i < style.cssRules.length; i++) {
        if (!(style.cssRules[i] instanceof CSSStyleRule))
            continue; 

        const currentRule : CSSStyleRule = style.cssRules[i] as CSSStyleRule;  
        if((style.cssRules[i] as CSSStyleRule).selectorText === "#" + image.id) {
            imgBottom = (style.cssRules[i] as CSSStyleRule).style.bottom;
            imgLeft = (style.cssRules[i] as CSSStyleRule).style.left;

            imgBottom = imgBottom.substring(0, imgBottom.length - 2);
            imgLeft = imgLeft.substring(0, imgLeft.length - 2);
            break;
        }
    }
    // Multiply the image's vertical and horizontal transforms by imgMod vars
    // so that the transformations are consistent regardless of screen size
    image.style.transform = `translateY(${parseInt(imgBottom) * imgBottomMod}vh)`;
    image.style.transform += `translateX(${parseInt(imgLeft) * imgLeftMod}vw)`;
    image.style.transform += `scale(${1.1})`;

    // Give the center images access to pointer events temporarily so that it
    // can defocus sections if need be
    (document.querySelector("#center-image") as HTMLElement).style.pointerEvents = "all";
}

// Undoes the changes to the section made by onFocus(), if
// such changes are currently active. 
const offFocus = (textId : string, imageId : string) => {
    if (window.innerWidth < 1100) 
        return;
    
    // Choose sections to return to normal based on the "part" var, and
    // return early if the mouse is touching either of them
    let text : HTMLElement = document.querySelector(`#${textId}`);
    let image : HTMLElement = document.querySelector(`#${imageId}`);
    
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
const defocusIfMouseCloseToEdge = (event) => {
    let mouseX = event.pageX;
    let mouseY = event.pageY;
    if (mouseX <= 50 || mouseX >= screen.width - 50)
        defocusCurrent();
}

const defocusIfMouseFarFromCurrent = (event) => {
    let mouseX = event.clientX;
    let mouseY = event.clientY;
    console.log("MOUSE POS: (" + mouseX + ", " + mouseY + ")")
    if (window.innerWidth < 1100 || currentFocus === "") 
        return;
    
    // Check which section is currently in-focus based on the "currentFocus" var, and
    // store the respective part's text/image pair in corresponding variables
    let text = document.querySelector(`#${currentFocus}`);
    let image = document.querySelector(`#${getImageIdFromTextId(currentFocus)}`);

    // Store mouse and bounding rect information
    //let mouseX = event.clientX;
    //let mouseY = event.clientY;
    let textRect = text.getBoundingClientRect();
    let imgRect = image.getBoundingClientRect();

    // Calculate the current section's overall top, bottom, left, and right.
    // Overall top = lower of both tops, overall bottom = higher of both bottoms,
    // overall left = lower of both lefts, overall right = higher of both rights
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
const defocusCurrent = () => {
    if (currentFocus !== "")
    {
        offFocus(currentFocus, getImageIdFromTextId(currentFocus));
        currentFocus = "";
        (document.querySelector("#center-image") as HTMLElement).style.pointerEvents = "none";
    }
}

const infoSectionVal = (section : Sections) => infoSectionVals[section];

const addSectionFocusProperties = (section : Sections) => {
    const infoSection = infoSectionVals[section];
    let text : HTMLElement = document.querySelector(`#${infoSection.textId}`);
    let image : HTMLElement = document.querySelector(`#${infoSection.imageId}`);
    text.onmouseenter = () => focusOn(infoSection);
    image.onmouseenter = () => focusOn(infoSection);
}

export {Sections, infoSectionVal, focusOn, defocusCurrent, defocusIfMouseCloseToEdge, defocusIfMouseFarFromCurrent, addSectionFocusProperties};