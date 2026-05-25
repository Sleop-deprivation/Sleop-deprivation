import * as infoSection from "./info-section"
import { scrollToCoords, scrollToId, toggleMusic } from "./utils";

//#region Adding a gazillion onclick and onmouseenter events
// Add all of the functions to their corresponding HTML elements. This
// was previously done in the HTML itself, but I didn't know that declaring
// events in the HTML was a bad coding practice when I first made this last
// year (oops)

// Initialize the scrolling functions of the navigation bar.
// Said headbar isn't shown on desktop monitors, it's there
// for smaller devices since the site's format changes completely
// to accomodate for the smaller screen real estate.
(document.querySelector("#to-top") as HTMLElement).onclick = () =>
    scrollToCoords(0, 0);
(document.querySelector("#about-me") as HTMLElement).onclick = () =>
    scrollToCoords(0, 50);
(document.querySelector("#my-projects") as HTMLElement).onclick = () =>
    scrollToId('projects-header');
(document.querySelector("#other-accounts") as HTMLElement).onclick = () =>
    scrollToCoords(0, 2000);

// Have the site recognize when the mouse moves near the edge of the screen
// to automatically defocus the section in focus.
(document.querySelector("#other-accounts") as HTMLElement).onmousemove = (e) =>
    infoSection.defocusIfMouseCloseToEdge(e);

// Give each of the information sections the ability to go in and out of focus.
for (let i = 0; i < 6; i++) {
    infoSection.addSectionFocusProperties(i);
}

// A lot of things automatically defocus the current focused sections when
// hovered over, so apply the defocusing function too
(document.querySelector("#header") as HTMLElement).onmouseenter = () =>
    infoSection.defocusCurrent();
(document.querySelector("#accounts-header") as HTMLElement).onmouseenter = () =>
    infoSection.defocusCurrent();
(document.querySelector("#accounts") as HTMLElement).onmouseenter = () =>
    infoSection.defocusCurrent();
(document.querySelector("#goat") as HTMLElement).onmouseenter = () =>
    infoSection.defocusCurrent();
(document.querySelector("#center-image") as HTMLElement).onmouseenter = () =>
    infoSection.defocusCurrent();

// The goat at the bottom also plays music, so apply that function to it
(document.querySelector("#goat") as HTMLElement).onclick = () =>
    toggleMusic();

// Finally, make the music element itself automatically pause itself when it finishes.
(document.querySelector("#music") as HTMLAudioElement).onended = () =>
    toggleMusic("pause");
//#endregion