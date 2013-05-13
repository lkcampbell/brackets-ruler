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
  * Hook in create and update ruler event for increase/decrease document width
     * Length is equal to the next ten-unit tick mark beyond the longest line
     * Should fire off after each text change
     * Using jQuery, add or remove one `<td>` for each character change
  * Change CodeMirror scroll event to Editor scroll event
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
   * Update ruler when changing themes in Themes extension

### License
MIT-licensed -- see `main.js` for details.

### Compatibility
Tested on Brackets Sprint 25 and later, Windows 7.
