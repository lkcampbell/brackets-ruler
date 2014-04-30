# Ruler for Brackets
An extension for [Brackets](https://github.com/adobe/brackets/) that adds
an adjustable column ruler to the editor.

### How to Install
1. Select **File > Extension Manager...**
2. Search for this extension.
3. Click on the **Install** button.

### How to Use Extension
Toggle the Column Ruler with **View > Column Ruler**.

Toggle the Column Guide with **View > Column Guide**.

Click on a column on the ruler to set the guide at that column.

Click on the same column repeatedly to toggle the guide on and off.

Click and drag on the ruler to the set the guide to a new column.

Right click on the ruler to get a context menu where you can toggle the guide
or the ruler.

### Extension Preferences

**`brackets-ruler.rulerEnabled`** *(boolean)*<br/>
If the value of this preference is `true`, the column ruler will be visible.
If the value is `false`, the column ruler will be hidden.

**`brackets-ruler.guideEnabled`** *(boolean)*<br/>
If the value of this preference is `true`, the column guide will be visible.
If the value is `false`, the column guide will be hidden.

**`brackets-ruler.guidePosition`** *(number)*<br/>
The position of the column guide as defined by a column number that is zero
or greater. Values that exceed the length of the column ruler are rounded to
the highest number on the ruler.

**`brackets-ruler.guideLineStyle`** *(string)*<br/>
The line style of the column guide. Values can be one of the following:
`"solid"`, `"dotted"`, or `"dashed"`.

For more information on setting preferences see:
[How to Use Brackets - Preferences](https://github.com/adobe/brackets/wiki/How-to-Use-Brackets#preferences)

### Unit Testing

This extension comes with a [Jasmine](http://jasmine.github.io/) test suite that
can be run from within a development build of Brackets:

1. Select **Debug > Run Tests**.
2. Click on the **Extensions** tab.
3. Click on the **Column Ruler** link.

### Known Issues

**Working with other extensions:** Any extensions that change the font family of
the editor (i.e. Themes, Fonts) from the default Brackets font of Source Code Pro
will make this extension act incorrectly, especially if the font is not monospace.
There is no good way to listen for font family change events right now in Brackets
or in CodeMirror, so I have to address these issues directly with the other extension
developers on a case-by-case basis.

### License
MIT-licensed -- see `main.js` for details.

### Compatibility
Tested on Brackets Sprint 39 and later, Mac OSX Mavericks.
