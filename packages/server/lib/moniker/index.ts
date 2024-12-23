/**
 * Forked from https://github.com/hrbrmstr/celestial-moniker-generator
 * Original algorithm https://github.com/sayamqazi/planet-name-generator
 */

// The `celestials.json` file contains an array of celestial names in a specific format (e.g., "sol-aris" or "ve-ga")
import celestials from "./celestials.json" with { type: "json" };

// Create a unique list of syllables by splitting each celestial name at the hyphen ("-") and flattening the result
const syllables = [
  ...new Set(celestials.flatMap((celestial) => celestial.split("-"))),
];

/**
 * Create a frequency matrix (2D array) to track how syllables follow each other
 * The matrix has (syllables.length + 1) rows and columns to account for transitions between syllables and an "end state"
 * Each element of `freq` starts as an array of zeroes, representing no transitions between syllables initially
 */
const freq = Array(syllables.length + 1)
  .fill(null)
  .map(() => Array(syllables.length + 1).fill(0));

// Iterate over each celestial name in the list to build the frequency matrix
celestials.forEach((p) => {
  // Split the celestial name into syllables (e.g., "sol-aris" becomes ["sol", "aris"])
  const lex = p.split("-");

  // Map each syllable to its corresponding index in the `syllables` array
  const lexIndices = lex.map((syllable) => syllables.indexOf(syllable));

  if (lexIndices.length > 1) {
    // Extract all indices except the last for row and all except the first for column, these represent transitions between syllables (e.g., "sol" -> "aris")
    const rowIndices = lexIndices.slice(0, -1);
    const colIndices = lexIndices.slice(1);

    // For each pair of adjacent syllables, increase the frequency count in the matrix
    rowIndices.forEach((_, i) => {
      freq[rowIndices[i]][colIndices[i]] += 1;
    });
  }

  // Add a transition from the last syllable of the name to the "end state"
  const lastSyllableIndex = lexIndices[lexIndices.length - 1];
  freq[lastSyllableIndex][syllables.length] += 1;
});

// Helper function to get a random index within a specified range (0 to max-1)
const getRandomIndex = (max: number) => Math.floor(Math.random() * max);

// Recursive function to find a valid starting syllable (initial) where the syllable can lead to another one (i.e., where freq[initial] has a `1`)
const findValidInitial = (
  initial = getRandomIndex(syllables.length - 1),
): number =>
  // If the row for this syllable has no transitions (i.e., no `1` in the `freq` matrix), try another random index recursively
  freq[initial].every((value) => value !== 1) ? findValidInitial() : initial;

// Recursive function to build a name from syllables
const buildName = (parts: number, initial?: number, name = "") => {
  if (parts === 0) {
    return name.toLowerCase().trim();
  }

  // Find a valid starting syllable
  const validInitial = findValidInitial(initial);

  // Get the syllable corresponding to the valid initial index
  const newSyllable = syllables[validInitial];

  // Find the next syllable index by locating the first `1` in the `freq` matrix for the current syllable
  const nextInitial = freq[validInitial].findIndex((value) => value === 1);

  // Recursively build the rest of the name, reducing the number of parts by 1 and appending the new syllable to `name`
  return buildName(parts - 1, nextInitial, name + newSyllable);
};

/**
 *
 * @param length How many names to generate
 * @returns Array of randomly generated celestial names
 */
export default function moniker(length = 3): string[] {
  return Array(length)
    .fill(null)
    .map(() =>
      // Generate a name with 2-3 syllables
      buildName(Math.floor(Math.random() * 2) + 2),
    );
}
