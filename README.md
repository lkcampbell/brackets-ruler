# Ruler for Brackets
An extension for [Brackets](https://github.com/adobe/brackets/) that adds
an adjustable column ruler to the editor.

This extension is still being built.  See the Roadmap section for more details.

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

* Column guide
   * Create UI
      * Hook in Click event to toggle guide
      * Hook in Drag event to move guide left and right
   * Create UI for word wrap guide
      * Hook in Click and Double Click event to toggle word wrap guide
      * Hook word wrap guide to current Brackets word wrap code
  
* Nice But Not Necessary
   * Change CSS to LESS (proper namespacing of styles)
   * Update ruler when changing themes in Themes extension
   * Clean up ruler HTML-generator code using jQuery

### License
MIT-licensed -- see `main.js` for details.

### Compatibility
Tested on Brackets Sprint 25 and later, Windows 7.
