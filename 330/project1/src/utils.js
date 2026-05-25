/**
 * Returns a random word from a given array of words.
 * @param {array} words - The array of words to draw from.
 * @returns {String} A random word from the array.
 */
export const getWordFromArray = (words) => words[Math.floor(Math.random() * words.length)];