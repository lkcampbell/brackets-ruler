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
/*global define, brackets, $, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    // --- Required modules ---
    var PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        Menus               = brackets.getModule("command/Menus"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        AppInit             = brackets.getModule("utils/AppInit"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        ViewCommandHandlers = brackets.getModule("view/ViewCommandHandlers"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils");
    
    // --- Constants ---
    var COMMAND_NAME    = "Toggle Ruler",
        COMMAND_ID      = "lkcampbell.toggle-ruler",
        SHORTCUT_KEY    = "Ctrl-Alt-R";
    
    var INIT_COLUMNS    = 80,   // Must be multiple of ten
        MAX_NUMBER_SIZE = 12;   // Measured in pixel units
    
    // --- Private variables ---
    var _defPrefs   = { enabled: false },
        _prefs      = PreferencesManager.getPreferenceStorage(module, _defPrefs),
        _viewMenu   = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU),
        _rulerHTML  = require("text!ruler-template.html"),
        $rulerPanel = null;
    
    var _templateFunctions = {
        "rulerNumber": function () {
            var i           = 0,
                finalHTML   = '';
            
            for (i = 10; i <= INIT_COLUMNS; i += 10) {
                finalHTML += '                ';
                finalHTML += '<td class="number" colspan="';
                finalHTML += (i === INIT_COLUMNS) ? '6' : '9';
                finalHTML += '">';
                finalHTML += i;
                finalHTML += '</td>';
                
                if (i !== INIT_COLUMNS) {
                    finalHTML += '\n';
                    finalHTML += '                ';
                    finalHTML += '<td class="number"></td>';
                    finalHTML += '\n';
                }
            }
            return finalHTML;
        },
        "rulerTickMark": function () {
            var i           = 0,
                finalHTML   = '';
            
            for (i = 0; i <= INIT_COLUMNS; i++) {
                finalHTML += '                ';
                
                if (i % 5) {
                    // Minor tick mark
                    finalHTML += '<td class="minor-tick-mark" id="tick-';
                    finalHTML += i;
                    finalHTML += '">&nbsp;</td>';
                } else {
                    // Major tick mark
                    finalHTML += '<td class="major-tick-mark" id="tick-';
                    finalHTML += i;
                    finalHTML += '">&nbsp;</td>';
                }
                
                if (i !== INIT_COLUMNS) {
                    finalHTML += '\n';
                }
            }
            return finalHTML;
        }
    };
      
    // --- Private functions ---
    function _updateRulerScroll() {
        var editor              = EditorManager.getCurrentFullEditor(),
            cm                  = editor ? editor._codeMirror : null,
            rulerHidden         = false,
            $cmSizer            = null,
            sizerMarginWidth    = 0,
            linePaddingWidth    = 0,
            tickWidth           = 0,
            rulerOffset         = 0,
            $ruler              = $("#brackets-ruler #ruler");
        
        if ($rulerPanel.is(":hidden")) { return; }
        
        if (cm) {
            // Scroll the ruler to the proper horizontal position
            $cmSizer            = $(cm.getScrollerElement()).find(".CodeMirror-sizer");
            sizerMarginWidth    = parseInt($cmSizer.css("margin-left"), 10);
            linePaddingWidth    = parseInt($(".CodeMirror pre").css("padding-left"), 10);
            tickWidth           = $("#brackets-ruler #tick-mark-left-filler").width();
            rulerOffset         = sizerMarginWidth + linePaddingWidth;
            rulerOffset         -= Math.ceil(tickWidth * 1.5);
            rulerOffset         -= cm.getScrollInfo().left;
            $ruler.css("left", rulerOffset + "px");
        } else {
            $ruler.css("left", "0px");
        }
    }
    
    function _updateTickMarks() {
        var fontSize        = $(".CodeMirror").css("font-size"),
            $tickMarks      = $("#brackets-ruler .tick-marks"),
            $rulerNumbers   = $("#brackets-ruler .numbers");
        
        if ($rulerPanel.is(":hidden")) { return; }
        
        $tickMarks.css("font-size", fontSize);
        
        if (parseInt(fontSize, 10) < MAX_NUMBER_SIZE) {
            $rulerNumbers.css("font-size", fontSize);
        } else {
            $rulerNumbers.css("font-size", MAX_NUMBER_SIZE + "px");
        }
        
        _updateRulerScroll();
    }
    
    function _updateRulerLength() {
        var editor  = EditorManager.getCurrentFullEditor(),
            cm      = editor ? editor._codeMirror : null;
        
        if ($rulerPanel.is(":hidden")) { return; }
        
        if (cm) {
            console.log("cm.display.maxLineLength = %s", cm.display.maxLineLength);
        }
    }
    
    function _showRuler() {
        $rulerPanel.show();
        EditorManager.resizeEditor();
        
        // Full ruler updates must occur ONLY when the ruler is visible.
        // jQuery doesn't return width() for hidden elements.
        _updateTickMarks();
        // _updateRulerScroll() is called by _updateTickMarks()
        _updateRulerLength();
    }
    
    function _hideRuler() {
        $rulerPanel.hide();
        EditorManager.resizeEditor();
    }
    
    function _toggleRuler() {
        var command         = CommandManager.get(COMMAND_ID),
            rulerEnabled    = !command.getChecked();
        
        command.setChecked(rulerEnabled);
        _prefs.setValue("enabled", rulerEnabled);
        
        if (rulerEnabled) {
            _showRuler();
        } else {
            _hideRuler();
        }
    }
    
    function _handleDocumentChange() {
        _updateRulerLength();
        
        // Need to add Document listeners with appropriate reference code
    }
    
    function _handleEditorChange(event, newEditor, oldEditor) {
        _updateRulerScroll();
        
        if (newEditor) {
            $(newEditor).on("scroll", _updateRulerScroll);
        }
        
        if (oldEditor) {
            $(oldEditor).off("scroll", _updateRulerScroll);
        }
    }
    
    // --- Initialize Extension ---
    AppInit.appReady(function () {
        var rulerEnabled = _prefs.getValue("enabled");
        
        // Register command
        CommandManager.register(COMMAND_NAME, COMMAND_ID, _toggleRuler);
        
        // Add to View menu
        if (_viewMenu) {
            _viewMenu.addMenuItem(COMMAND_ID, SHORTCUT_KEY);
        }
        
        // Apply user preferences
        CommandManager.get(COMMAND_ID).setChecked(rulerEnabled);
        
        // Add Event Listeners
        $(ViewCommandHandlers).on("fontSizeChange", _updateTickMarks);
        $(EditorManager).on("activeEditorChange", _handleEditorChange);
        $(DocumentManager).on("currentDocumentChange", _handleDocumentChange);
        
        // Load the ruler CSS -- when done, create the ruler then show/hide the ruler
        ExtensionUtils.loadStyleSheet(module, "ruler.css")
            .done(function () {
                // Insert Ruler HTML
                $rulerPanel = $(Mustache.render(_rulerHTML, _templateFunctions));
                $("#editor-holder").before($rulerPanel);
                
                if (rulerEnabled) {
                    _showRuler();
                } else {
                    _hideRuler();
                }
            });
    });
});
