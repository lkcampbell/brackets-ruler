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

### Roadmap
* Column Ruler
    * Increase tick marks to match font size
    * Hook in update ruler event for increase/decrease font size
    * Hook in update ruler event for increase/decrease document width
    * Conditional code for updating ruler: gutter size, font size, document width
    * Sync up editor scrolling and ruler scrolling
* Column guide
    * Create UI
    * Hook in Click event to toggle guide
    * Hook in Drag event to move guide left and right
    * Create UI for word wrap guide
    * Hook in Click and Double Click event to toggle word wrap guide
    * Hook word wrap guide to current Brackets word wrap code

### License
MIT-licensed -- see `main.js` for details.

### Compatibility
Tested on Brackets Sprint 25 and later, Windows 7.
