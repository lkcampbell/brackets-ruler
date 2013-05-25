# Ruler for Brackets
An extension for [Brackets](https://github.com/adobe/brackets/) that adds
an adjustable column ruler to the editor.

### How to Install
1. Select **Brackets > File > Install Extension...**
2. Paste https://github.com/lkcampbell/brackets-ruler
into Extension URL field.
3. Click on the **Install** button.

### How to Use Ruler
Toggle the Column Ruler with **Brackets > View > Toggle Ruler** or use the
shortcut key which is **Ctrl-Alt-R** on Windows and **Command-Alt-R** on Mac.

Toggle the Column Guide with **Brackets > View > Toggle Column Guide** or
use the shortcut key which is **Ctrl-Alt-G** on Windows and **Command-Alt-G**
on Mac.

Click on any of the tick marks on the ruler to toggle on the Column Guide
and set it to that column.  Toggle the Column Guide on and off by clicking
on the same tick mark multiple times.

### Known Issues

**CodeMirror Themes:** Officially, I'm only making sure the column ruler
works with the Default theme for Brackets. Unofficially, the ruler works
correctly with most of the other CodeMirror themes as well. Themes that
do not use the SourceCodePro font do not work correctly.  If you find
a bug with the ruler please make sure you can reproduce the bug while
using the Default theme before you open an issue on it.

### Roadmap

* Column guide
   * Ruler click events should fire off when clicking on any part of the ruler
   * Make guide adjustable via ruler click and drag events

* Nice But Not Necessary
   * Update ruler when changing themes in Themes extension
   * Clean up ruler HTML-generator code using jQuery

### License
MIT-licensed -- see `main.js` for details.

### Compatibility
Tested on Brackets Sprint 25 and later, Windows 7.
