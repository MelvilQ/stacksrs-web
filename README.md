Web version of [StackSRS](https://github.com/MelvilQ/stacksrs), an app to learn vocabulary using flashcards. The deck state is hold in local storage. [Website](https://stacksrs.droppages.com).

## Dependencies

* Single-page framework: [Vue.js](https://vuejs.org/)
* HTTP library: [Axios.js](https://github.com/axios/axios)
* Keyboard shortcuts: [Mousetrap.js](https://craig.is/killing/mice)
* SVG flags: [flag-icon-css](https://github.com/lipis/flag-icon-css)

## Admin Scripts

These scripts can be run using Python 3 only.

### importMemriseCourse.py

Generates a CSV file from a Memrise course.

Arguments:

* Memrise-Course-ID (the number in the URL)
* Optionally, the letter <code>i</code> if you want to invert front and back

Example (Duolingo Swedish): <code>python3 importMemriseCourse.py 462533 i</code>

### convertCsvToDownloadableDeck.py

Generates a deck file in JSON format from a CSV file.

Arguments:

* Filename of the CSV file

The CSV file has to be tab-separated. The first row contains only the name of the deck. The second row contains the two-letter language codes of the source language and the target language. Then, each line contains a word pair. The third column may contain a topic or category, but it is currently not used.