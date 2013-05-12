# Ruler for Brackets
An extension for [Brackets](https://github.com/adobe/brackets/) that adds
an adjustable column ruler to the editor.

**WARNING:** This extension is in experimental mode and is not functional
at all. I am putting it on GitHub purely for my own convenience.  Please
do **not** install it or use it until I have made an announcement on the
Bracket-Dev Google Group that it is ready to use.

### How to Install
1. Select **Brackets > File > Install Extension...**
2. Paste https://github.com/lkcampbell/brackets-ruler
into Extension URL field.
3. Click on the **Install** button.

### How to Use Ruler
Toggle the extension with **Brackets > View > Toggle Ruler** or use the
shortcut key which is **Ctrl-Alt-R** on Windows and **Command-Alt-R** on Mac.

### Known Issues

**CodeMirror Themes:** Officially, I'm only making sure the column ruler
works with the Default theme for Brackets. Unofficially, the ruler works
correctly with most of the other CodeMirror themes as well. The problem
cases are themes with different fonts (e.g. Rubyblue) and themes with
drastically styled gutters (e.g. Solarized). If you find a bug with
the ruler please make sure you can reproduce the bug while using the
Default theme before you open an issue on it.

### Roadmap

* Column Ruler
  * Sync up editor scrolling and ruler scrolling
  * Hook in create and update ruler event for increase/decrease document width
     * Research: How to get longest line or widest visible column
     * Research: What happens to these values during word wrap?
     * Have a minimum width that runs off of the editor screen always
     * Using jQuery, add or remove one `<td>` for each character change
  * Conditional code for updating ruler: gutter size, font size, document width

* Column guide
   * Create UI
      * Hook in Click event to toggle guide
      * Hook in Drag event to move guide left and right
   * Create UI for word wrap guide
      * Hook in Click and Double Click event to toggle word wrap guide
      * Hook word wrap guide to current Brackets word wrap code
  
* Nice But Not Necessary
   * Clean up ruler HTML-generator code using jQuery
   * Changed CSS to LESS (proper namespacing of styles)

### License
MIT-licensed -- see `main.js` for details.

### Compatibility
Tested on Brackets Sprint 25 and later, Windows 7.
