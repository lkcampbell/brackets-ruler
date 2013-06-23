/*
 * The MIT License (MIT)
 * Copyright (c) 2013 Lance Campbell. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, regexp: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, Mustache, window */

define(function (require, exports, module) {
    "use strict";
    
    // --- Required modules ---
    var PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        Menus               = brackets.getModule("command/Menus"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        Editor              = brackets.getModule("editor/Editor").Editor,
        CommandManager      = brackets.getModule("command/CommandManager"),
        AppInit             = brackets.getModule("utils/AppInit"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        ViewCommandHandlers = brackets.getModule("view/ViewCommandHandlers"),
        PanelManager        = brackets.getModule("view/PanelManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils");
    
    // --- Constants ---
    var RULER_COMMAND_NAME  = "Toggle Ruler",
        RULER_COMMAND_ID    = "lkcampbell.toggleRuler",
        RULER_SHORTCUT_KEY  = "Ctrl-Alt-R",
        RULER_CONTEXT_MENU  = "lkcampbell-ruler-context-menu";
    
    var GUIDE_COMMAND_NAME  = "Toggle Column Guide",
        GUIDE_COMMAND_ID    = "lkcampbell.toggleColumnGuide",
        GUIDE_SHORTCUT_KEY  = "Ctrl-Alt-G";
    
    var MIN_COLUMNS     = 80,   // Must be multiple of ten
        MAX_COLUMNS     = 1000, // Must be multiple of ten
        MAX_NUMBER_SIZE = 12;   // Measured in pixel units
    
    // --- Private variables ---
    var _defPrefs           = { rulerEnabled:   false,
                                guideEnabled:   false,
                                guideColumnNum: MIN_COLUMNS },
        _prefs              = PreferencesManager.getPreferenceStorage(module, _defPrefs),
        _viewMenu           = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU),
        _rulerContextMenu   = Menus.registerContextMenu(RULER_CONTEXT_MENU),
        _rulerHTML          = require("text!ruler-template.html"),
        _currentDoc         = null,
        _currentEditor      = null,
        _guideColumnNum     = MIN_COLUMNS,
        _editorScrollPos    = null,
        _currentGutterWidth = 0,
        _isDragging         = false;
    
    var _$rulerPanel    = null,
        _$columnGuide   = null;
    
    var _templateFunctions = {
        "rulerNumber": function () {
            var i           = 0,
                finalHTML   = "";
            
            for (i = 10; i <= MIN_COLUMNS; i += 10) {
                finalHTML += "                ";
                finalHTML += "<td class='br-number' colspan='";
                finalHTML += (i === MIN_COLUMNS) ? "6" : "9";
                finalHTML += "'>";
                finalHTML += i;
                finalHTML += "</td>";
                
                if (i !== MIN_COLUMNS) {
                    finalHTML += "\n";
                    finalHTML += "                ";
                    finalHTML += "<td class='br-number'></td>";
                    finalHTML += "\n";
                }
            }
            return finalHTML;
        },
        "rulerTickMark": function () {
            var i           = 0,
                finalHTML   = '';
            
            for (i = 0; i <= MIN_COLUMNS; i++) {
                finalHTML += '                ';
                
                if (i % 5) {
                    // Minor tick mark
                    finalHTML += "<td class='br-minor-tick-mark' id='br-tick-";
                } else {
                    // Major tick mark
                    finalHTML += "<td class='br-major-tick-mark' id='br-tick-";
                }
                
                finalHTML += i;
                finalHTML += "'>&nbsp;</td>";
                
                if (i !== MIN_COLUMNS) {
                    finalHTML += '\n';
                }
            }
            return finalHTML;
        }
    };
    
    // --- Show/Hide functions ---
    function _showGuide() {
        if (_$columnGuide.is(":hidden")) {
            _$columnGuide.show();
        }
    }
    
    function _hideGuide() {
        if (_$columnGuide.is(":visible")) {
            _$columnGuide.hide();
        }
    }
    
    function _showRuler(skipResize) {
        if (_$rulerPanel.is(":hidden")) {
            _$rulerPanel.show();
            
            if (!skipResize) {
                EditorManager.resizeEditor();
            }
        }
    }
    
    function _hideRuler(skipResize) {
        if (_$rulerPanel.is(":visible")) {
            _$rulerPanel.hide();
            
            if (!skipResize) {
                EditorManager.resizeEditor();
            }
        }
    }
    
    // --- Helper functions ---
    function _getColumnFromXPos(xPos) {
        var editor          = EditorManager.getCurrentFullEditor(),
            cm              = editor ? editor._codeMirror : null,
            rulerHidden     = _$rulerPanel.is(":hidden"),
            tickWidth       = 0,
            columnNumber    = 0;
        
        if (cm) {
            // Can only get the width of an element if it is visible
            // If the ruler is not visible, show it temporarily...
            if (rulerHidden) {
                _showRuler(true);
            }
            
            tickWidth = $("#brackets-ruler #br-tick-mark-left-filler").width();
            
            // ...then hide the ruler again
            if (rulerHidden) {
                _hideRuler(true);
            }
            
            columnNumber = Math.ceil(xPos / tickWidth);
            columnNumber = (columnNumber < 0) ? 0 : columnNumber;
        } else {
            columnNumber = 0;
        }
        
        return columnNumber;
    }
    
    function _getColumnFromRulerClick(event) {
        var $allTickMarks   = $(".br-tick-marks").children(),
            $targetTickMark = null,
            clickX          = event.pageX,
            targetID        = "",
            tickRegExp      = /^br-tick-(\d+)$/,
            matchResult     = [];
        
        $targetTickMark = $allTickMarks.filter(function () {
            return $(this).offset().left <= clickX;
        }).filter(function () {
            return ($(this).offset().left + $(this).outerWidth()) > clickX;
        });
        
        // Take care of the edge cases
        if ($targetTickMark.length === 0) {
            if (clickX < $allTickMarks.first().offset().left) {
                $targetTickMark = $allTickMarks.eq(1);
            } else {
                $targetTickMark = $allTickMarks.eq($allTickMarks.length - 2);
            }
        }
        
        targetID = $targetTickMark.attr("id");
        
        if (targetID === "br-tick-mark-left-filler") {
            targetID = $targetTickMark.next().attr("id");
        } else if (targetID === "br-tick-mark-right-filler") {
            targetID = $targetTickMark.prev().attr("id");
        }
        
        matchResult = targetID.match(tickRegExp);
        
        return parseInt(matchResult[1], 10);
    }
    
    // --- Update Column Guide functions ---
    function _updateGuidePosX() {
        var $tickMark   = null,
            $ruler      = null,
            rulerHidden = false,
            rulerPosX   = 0,
            tickPosX    = 0,
            tickWidth   = 0,
            guidePosX   = 0;
        
        $ruler      = $("#brackets-ruler #br-ruler");
        $tickMark   = $("#brackets-ruler #br-tick-" + _guideColumnNum);
        rulerHidden = _$rulerPanel.is(":hidden");
        
        // Can only get the position of an element if it is visible
        // If the ruler is not visible, show it temporarily...
        if (rulerHidden) {
            _showRuler(true);
        }
        
        rulerPosX   = $ruler.position().left;
        tickPosX    = $tickMark.position().left;
        tickWidth   = $tickMark.width();
        guidePosX   = rulerPosX + tickPosX + Math.ceil(tickWidth * 0.5);
        _$columnGuide.css("left", guidePosX + "px");
        
        // ...then hide the ruler again
        if (rulerHidden) {
            _hideRuler(true);
        }
        
        _prefs.setValue("guideColumnNum", _guideColumnNum);
    }
    
    function _updateGuideHeight() {
        var editor      = EditorManager.getCurrentFullEditor(),
            cm          = editor ? editor._codeMirror : null,
            guideHeight = 0;
        
        if (cm) {
            guideHeight = cm.getScrollInfo().clientHeight;
            guideHeight = (guideHeight > 0) ? guideHeight : 0;
            
            if (_$columnGuide) {
                _$columnGuide.height(guideHeight);
            }
        }
    }
    
    function _updateGuideZIndex() {
        var editor      = EditorManager.getCurrentFullEditor(),
            cm          = editor ? editor._codeMirror : null,
            guideXPos   = 0,
            editorWidth = 0,
            guideZIndex = 0;
        
        // If guide falls outside of the bounds of the editor window, change
        // its z-index so it isn't drawn on top of side bar or the tool bar.
        if (cm) {
            guideXPos   = _$columnGuide.position().left;
            editorWidth = cm.getScrollInfo().clientWidth;
            editorWidth = (editorWidth > 0) ? editorWidth : 0;
            
            if ((guideXPos < 0) || (guideXPos > editorWidth)) {
                // Outside of the editor window bounds
                guideZIndex = -1;
            } else {
                // Inside of the editor window bounds
                guideZIndex = 1;
            }
            
            _$columnGuide.css("z-index", guideZIndex);
        }
    }
    
    // --- Update Ruler functions ---
    function _updateRulerLength() {
        var editor              = EditorManager.getCurrentFullEditor(),
            cm                  = editor ? editor._codeMirror : null,
            currentMaxColumns   = 0,
            editorWidth         = 0,
            newMaxColumns       = 0,
            $currentElement     = null,
            $newElement         = null,
            i                   = 0;
        
        if (cm) {
            $currentElement     = $("#br-number-right-filler").prev();
            currentMaxColumns   = parseInt($currentElement.text(), 10);
            
            if (Editor.getWordWrap()) {
                // Word wrap on.  Ruler length determined by width of editor.
                editorWidth = cm.getScrollInfo().clientWidth;
                newMaxColumns = Math.ceil(_getColumnFromXPos(editorWidth) / 10) * 10;
            } else {
                // Word wrap off.  Ruler length determined by longest text line.
                newMaxColumns = Math.ceil(cm.display.maxLineLength / 10) * 10;
            }
            
            // Ruler needs to be the minimum length
            if (newMaxColumns < MIN_COLUMNS) {
                newMaxColumns = MIN_COLUMNS;
            }
            
            // Ruler must also be long enough to show column guide
            if (newMaxColumns < _guideColumnNum) {
                newMaxColumns = Math.ceil(_guideColumnNum / 10) * 10;
            }
            
            // Ruler causes some performance issues if it gets too long
            if (newMaxColumns > MAX_COLUMNS) {
                newMaxColumns = MAX_COLUMNS;
            }
            
            if (newMaxColumns < currentMaxColumns) {
                // Remove Ruler Numbers
                $currentElement = $("#br-number-right-filler");
                $currentElement.prev().remove();
                
                for (i = (currentMaxColumns - 10); i > newMaxColumns; i -= 10) {
                    $currentElement.prev().remove();
                    $currentElement.prev().remove();
                }
                
                $currentElement.prev().remove();
                $currentElement.prev().attr("colspan", 6);
                
                // Remove Ruler Tick Marks
                $currentElement = $("#br-tick-mark-right-filler");
                
                for (i = currentMaxColumns; i > newMaxColumns; i--) {
                    $currentElement.prev().remove();
                }
            } else if (newMaxColumns > currentMaxColumns) {
                // Add Ruler Numbers
                $currentElement = $("#br-number-right-filler").prev();
                $currentElement.attr("colspan", 9);
                $newElement = $("<td></td>");
                $newElement.attr("class", "br-number");
                $currentElement.after($newElement);
                $currentElement = $currentElement.next();
                
                for (i = (currentMaxColumns + 10); i <= newMaxColumns; i += 10) {
                    $newElement = $("<td></td>");
                    $newElement.attr("class", "br-number");
                    
                    if (i !== newMaxColumns) {
                        $newElement.attr("colspan", 9);
                    } else {
                        $newElement.attr("colspan", 6);
                    }
                    
                    $newElement.text(i);
                    $currentElement.after($newElement);
                    $currentElement = $currentElement.next();
                    
                    if (i !== newMaxColumns) {
                        $newElement = $("<td></td>");
                        $newElement.attr("class", "br-number");
                        $currentElement = $currentElement.after($newElement);
                        $currentElement = $currentElement.next();
                    }
                }
                
                // Add Ruler Tick Marks
                $currentElement = $("#br-tick-mark-right-filler").prev();
                
                for (i = (currentMaxColumns + 1); i <= newMaxColumns; i++) {
                    $newElement = $("<td></td>");
                    
                    if (i % 5) {
                        // Minor Tick Mark
                        $newElement.attr("class", "br-minor-tick-mark");
                    } else {
                        // Major Tick Mark
                        $newElement.attr("class", "br-major-tick-mark");
                    }
                    
                    $newElement.attr("id", "br-tick-" + i);
                    
                    // Insert non-breaking space character
                    $newElement.text("\xa0");
                    
                    $currentElement.after($newElement);
                    $currentElement = $currentElement.next();
                }
            } // else they are equal so do nothing...
        }
    }
    
    function _updateRulerScroll() {
        var editor              = EditorManager.getCurrentFullEditor(),
            cm                  = editor ? editor._codeMirror : null,
            rulerHidden         = _$rulerPanel.is(":hidden"),
            $cmSizer            = null,
            sizerMarginWidth    = 0,
            linePaddingWidth    = 0,
            tickWidth           = 0,
            rulerOffset         = 0,
            $ruler              = $("#brackets-ruler #br-ruler");
        
        if (cm) {
            // Can only get the width of an element if it is visible
            // If the ruler is not visible, show it temporarily...
            if (rulerHidden) {
                _showRuler(true);
            }
            
            $cmSizer            = $(cm.getScrollerElement()).find(".CodeMirror-sizer");
            sizerMarginWidth    = parseInt($cmSizer.css("margin-left"), 10);
            linePaddingWidth    = parseInt($(".CodeMirror pre").css("padding-left"), 10);
            tickWidth           = $("#brackets-ruler #br-tick-mark-left-filler").width();
            rulerOffset         = sizerMarginWidth + linePaddingWidth;
            rulerOffset         -= Math.ceil(tickWidth * 1.5);
            rulerOffset         -= cm.getScrollInfo().left;
            $ruler.css("left", rulerOffset + "px");
            
            // ...then hide the ruler again
            if (rulerHidden) {
                _hideRuler(true);
            }
        } else {
            $ruler.css("left", "0px");
        }
        
        // Ruler scroll affects guide's horizontal position so update position
        _updateGuidePosX();
    }
    
    function _updateTickMarks() {
        var fontSize        = $(".CodeMirror").css("font-size"),
            $tickMarks      = $("#brackets-ruler .br-tick-marks"),
            $rulerNumbers   = $("#brackets-ruler .br-numbers");
        
        $tickMarks.css("font-size", fontSize);
        
        if (parseInt(fontSize, 10) < MAX_NUMBER_SIZE) {
            $rulerNumbers.css("font-size", fontSize);
        } else {
            $rulerNumbers.css("font-size", MAX_NUMBER_SIZE + "px");
        }
        
        // Tick mark width affects ruler scroll so update scroll
        _updateRulerScroll();
        
        // If word wrap is on, update "infinite" ruler when tick marks update
        if (Editor.getWordWrap()) {
            _updateRulerLength();
        }
    }
    
    function _updateAll() {
        // Note that some of the update functions have dependencies on other
        // update functions (see comments below), so don't change the calling
        // order here or things might break.
        
        // --- Update Ruler ---
        _updateTickMarks();
        // _updateRulerScroll() is called by _updateTickMarks()
        _updateRulerLength();
        
        // --- Update Column Guide ---
        // _updateGuidePosX() is called by _updateRulerScroll()
        _updateGuideHeight();
        _updateGuideZIndex();
    }
    
    // --- Toggle functions ---
    function _toggleColumnGuide() {
        var guideCommand    = CommandManager.get(GUIDE_COMMAND_ID),
            guideEnabled    = !guideCommand.getChecked();
        
        guideCommand.setChecked(guideEnabled);
        _prefs.setValue("guideEnabled", guideEnabled);
        
        if (guideEnabled) {
            _showGuide();
            _updateGuideZIndex();
        } else {
            _hideGuide();
        }
    }
    
    function _toggleRuler() {
        var rulerCommand    = CommandManager.get(RULER_COMMAND_ID),
            rulerEnabled    = !rulerCommand.getChecked();
        
        rulerCommand.setChecked(rulerEnabled);
        _prefs.setValue("rulerEnabled", rulerEnabled);
        
        if (rulerEnabled) {
            _showRuler();
        } else {
            _hideRuler();
        }
    }
    
    // --- Event Handlers ---
    function _handleFontSizeChange() {
        _updateTickMarks();
        _updateGuideHeight();
        _updateGuideZIndex();
    }
    
    function _handleEditorResize() {
        if (Editor.getWordWrap()) {
            _updateRulerLength();
        }
        
        _updateGuideHeight();
        _updateGuideZIndex();
    }
    
    function _handleThemeChange() {
        _updateTickMarks();
    }
    
    function _handleTextChange() {
        var editor          = EditorManager.getCurrentFullEditor(),
            $scroller       = null,
            $gutter         = null,
            newGutterWidth  = 0;
        
        // If word wrap is not on, ruler length is based on longest text line,
        // so update the ruler length when the text changes
        if (!Editor.getWordWrap()) {
            _updateRulerLength();
        }
        
        if (editor) {
            // If gutter width changes after text change, update ruler scroll
            $scroller       = $(editor.getScrollerElement());
            $gutter         = $scroller.find(".CodeMirror-gutter");
            newGutterWidth  = $gutter.width();
            
            if (_currentGutterWidth !== newGutterWidth) {
                _currentGutterWidth = newGutterWidth;
                _updateRulerScroll();
            }
        }
    }
    
    function _handleEditorScroll() {
        var oldScrollX      = _editorScrollPos.x,
            newScrollPos    = _currentEditor.getScrollPos(),
            newScrollX      = newScrollPos.x;
        
        // Only update on a horizontal scroll
        if (oldScrollX !== newScrollX) {
            _updateRulerScroll();
            _updateGuideZIndex();
        }
        
        _editorScrollPos = newScrollPos;
    }
    
    function _handleRulerDragStop() {
        _$rulerPanel.off("mousemove");
        _$rulerPanel.off("mouseup");
        _$rulerPanel.off("mouseenter");
        
        // No dragging === mouse click: toggle guide
        if (!_isDragging) {
            _toggleColumnGuide();
        }
        
        _isDragging = false;
    }
    
    function _handleRulerDrag(event) {
        var newColumnNum    = MIN_COLUMNS,
            guideCommand    = CommandManager.get(GUIDE_COMMAND_ID),
            guideEnabled    = false;
        
        // When left mouse button is no longer pressed, stop the drag
        if (event.which !== 1) { _handleRulerDragStop(); }
        
        _isDragging = true;
        
        _guideColumnNum = _getColumnFromRulerClick(event);
        
        // New guide column number may affect length of ruler
        _updateRulerLength();
        _updateGuidePosX();
        _updateGuideZIndex();
        
        _showGuide();
        
        guideEnabled = true;
        guideCommand.setChecked(guideEnabled);
        
        _prefs.setValue("guideEnabled", guideEnabled);
        _prefs.setValue("guideColumnNum", _guideColumnNum);
    }
    
    function _handleRulerMouseEnter(event) {
        if (event.which === 1) {
            _handleRulerDrag();
        } else {
            _handleRulerDragStop();
        }
    }
    
    function _handleRulerDragStart(event) {
        // Only react to the left mouse click
        if (event.which !== 1) { return; }
        
        _$rulerPanel.mousemove(_handleRulerDrag);
        _$rulerPanel.mouseup(_handleRulerDragStop);
        _$rulerPanel.mouseenter(_handleRulerMouseEnter);
        
        if (_guideColumnNum === _getColumnFromRulerClick(event)) {
            // Possibly a simple mouse click to toggle guide
            _isDragging = false;
        } else {
            // Definitely not a toggle, start the drag column reset
            _isDragging = true;
            _handleRulerDrag(event);
        }
    }
    
    function _handleEditorOptionChange(event, option, value) {
        if (option === "lineNumbers") {
            _updateRulerScroll();
        } else if (option === "lineWrapping") {
            if (_currentDoc) {
                if (Editor.getWordWrap()) {
                    // Word wrap is on, stop listening for text changes
                    $(_currentDoc).off("change", _handleTextChange);
                    _currentDoc.releaseRef();
                } else {
                    // Word wrap is off, start listening for text changes
                    $(_currentDoc).on("change", _handleTextChange);
                    _currentDoc.addRef();
                }
            }
            
            _updateRulerLength();
            _updateGuideHeight();
        }
    }
    
    function _handleDocumentChange() {
        var rulerCommand    = CommandManager.get(RULER_COMMAND_ID),
            $scroller       = null,
            $gutter         = null,
            rulerEnabled    = rulerCommand.getChecked(),
            guideCommand    = CommandManager.get(GUIDE_COMMAND_ID),
            guideEnabled    = guideCommand.getChecked();
        
        if (_currentDoc) {
            // If wrap is off, ruler length updates on text changes.
            // Remove the old Text Change event.
            if (!Editor.getWordWrap()) {
                $(_currentDoc).off("change", _handleTextChange);
                _currentDoc.releaseRef();
            }
        }
        
        _currentDoc = DocumentManager.getCurrentDocument();
        
        if (_currentDoc) {
            // If wrap is off, ruler length updates on text changes.
            // Add the new Text Change event.
            if (!Editor.getWordWrap()) {
                $(_currentDoc).on("change", _handleTextChange);
                _currentDoc.addRef();
            }
            
            CommandManager.get(RULER_COMMAND_ID).setEnabled(true);
            CommandManager.get(GUIDE_COMMAND_ID).setEnabled(true);
        } else {
            _hideRuler();
            _hideGuide();
            CommandManager.get(RULER_COMMAND_ID).setEnabled(false);
            CommandManager.get(GUIDE_COMMAND_ID).setEnabled(false);
            return;
        }
        
        if (_currentEditor) {
            $(_currentEditor).off("scroll", _handleEditorScroll);
            $(_currentEditor).off("optionChange", _handleEditorOptionChange);
        }
        
        _currentEditor = EditorManager.getCurrentFullEditor();
        
        if (_currentEditor) {
            $(_currentEditor).on("scroll", _handleEditorScroll);
            $(_currentEditor).on("optionChange", _handleEditorOptionChange);
            _editorScrollPos    = _currentEditor.getScrollPos();
            $scroller           = $(_currentEditor.getScrollerElement());
            $gutter             = $scroller.find(".CodeMirror-gutter");
            _currentGutterWidth = $gutter.width();
            _currentEditor.refresh();
        }
        
        // Update Ruler and Column Guide
        _updateAll();
        
        // Show/Hide Ruler
        if (rulerEnabled) {
            _showRuler();
        } else {
            _hideRuler();
        }
        
        EditorManager.resizeEditor();
        
        // Show/Hide Column Guide
        if (guideEnabled) {
            _showGuide();
        } else {
            _hideGuide();
        }
    }
    
    // --- Initialize Extension ---
    AppInit.appReady(function () {
        var rulerEnabled    = _prefs.getValue("rulerEnabled"),
            guideEnabled    = _prefs.getValue("guideEnabled");
        
        // Register commands
        CommandManager.register(RULER_COMMAND_NAME, RULER_COMMAND_ID, _toggleRuler);
        CommandManager.register(GUIDE_COMMAND_NAME, GUIDE_COMMAND_ID, _toggleColumnGuide);
        
        // Add commands to View menu
        if (_viewMenu) {
            _viewMenu.addMenuItem(RULER_COMMAND_ID, RULER_SHORTCUT_KEY);
            _viewMenu.addMenuItem(GUIDE_COMMAND_ID, GUIDE_SHORTCUT_KEY);
        }
        
        // Add commands to Ruler context menu
        if (_rulerContextMenu) {
            _rulerContextMenu.addMenuItem(RULER_COMMAND_ID);
            _rulerContextMenu.addMenuItem(GUIDE_COMMAND_ID);
        }
        
        // Apply user preferences
        CommandManager.get(RULER_COMMAND_ID).setChecked(rulerEnabled);
        CommandManager.get(GUIDE_COMMAND_ID).setChecked(guideEnabled);
        _guideColumnNum = _prefs.getValue("guideColumnNum");
        
        // Load the ruler CSS
        ExtensionUtils.loadStyleSheet(module, "ruler.css")
            .done(function () {
                // Create Ruler
                _$rulerPanel = $(Mustache.render(_rulerHTML, _templateFunctions));
                $("#editor-holder").before(_$rulerPanel);
                _$rulerPanel.mousedown(_handleRulerDragStart);
                _$rulerPanel.on("contextmenu", function (e) {
                    _rulerContextMenu.open(e);
                });
                
                // Create Column Guide
                _$columnGuide = $("<div id='brackets-ruler-column-guide'></div>");
                $("#editor-holder").prepend(_$columnGuide);
                
                // Add Event Listeners
                $(ViewCommandHandlers).on("fontSizeChange", _handleFontSizeChange);
                $(DocumentManager).on("currentDocumentChange", _handleDocumentChange);
                $(PanelManager).on("editorAreaResize", _handleEditorResize);
                $(ExtensionUtils).on("Themes.themeChanged", _handleThemeChange);
                
                // Starting up Brackets loads a new document so fire off handler
                _handleDocumentChange();
            });
    });
});
