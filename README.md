# Ruler for Brackets
An extension for [Brackets](https://github.com/adobe/brackets/) that adds
an adjustable column ruler to the editor.

### How to Install
1. Select **Brackets > File > Extension Manager...**
2. Click on **Install from URL...**
3. Paste https://github.com/lkcampbell/brackets-ruler
into Extension URL field.
4. Click on the **Install** button.

### How to Use Ruler
Toggle the Column Ruler with **Brackets > View > Toggle Ruler** or use the
shortcut key which is **Ctrl-Alt-R** on Windows and **Command-Alt-R** on Mac.

Toggle the Column Guide with **Brackets > View > Toggle Column Guide** or
use the shortcut key which is **Ctrl-Alt-G** on Windows and **Command-Alt-G**
on Mac.

Click on a column on the ruler to set the guide at that column.

Click on the same column repeatedly to toggle the guide on and off.

Click and drag on the ruler to the set the guide to a new column.

Right click on the ruler to get a context menu where you can toggle the guide
or the ruler.

### Known Issues

**CodeMirror Themes:** Officially, I'm only making sure the column ruler
works with the Default theme for Brackets. Unofficially, the ruler works
correctly with most of the other CodeMirror themes as well. Themes that
do not use the SourceCodePro font do not work correctly.  If you find
a bug with the ruler please make sure you can reproduce the bug while
using the Default theme before you open an issue on it.

### License
MIT-licensed -- see `main.js` for details.

### Compatibility
Tested on Brackets Sprint 25 and later, Windows 7.
