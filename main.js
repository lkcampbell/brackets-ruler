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
        SHORTCUT_KEY    = "Ctrl-Alt-R",
        MAX_COLUMNS     = 240;
    
    // --- Private variables ---
    var _defPrefs       = { enabled: false },
        _prefs          = PreferencesManager.getPreferenceStorage(module, _defPrefs),
        _viewMenu       = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU),
        _rulerHTML      = require("text!ruler-template.html"),
        $rulerPanel     = null;
    
    var _templateFunctions = {
        "rulerNumber": function () {
            var i           = 0,
                finalHTML   = '';
            
            for (i = 10; i <= MAX_COLUMNS; i += 10) {
                finalHTML += '                ';
                finalHTML += '<td class="number" colspan="9">';
                finalHTML += i;
                finalHTML += '</td>';
                
                if (i !== MAX_COLUMNS) {
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

            for (i = 0; i <= MAX_COLUMNS; i++) {
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
                
                if (i !== MAX_COLUMNS) {
                    finalHTML += '\n';
                }
            }
            return finalHTML;
        }
    };
      
    // --- Private functions ---
    function _updateZeroTickMark() {
        var fullEditor  = null,
            codeMirror  = null,
            $ruler      = $("#brackets-ruler #ruler"),
            gutterWidth = 0,
            dummyWidth  = 0,
            rulerOffset = 0;
        
        // Line up the zero tick mark with the editor gutter
        fullEditor = EditorManager.getCurrentFullEditor();
        codeMirror = fullEditor ? fullEditor._codeMirror : null;
        
        if (codeMirror) {
            gutterWidth = $(codeMirror.getGutterElement()).width();
            dummyWidth  = $("#brackets-ruler #dummy-tick-mark").width() * 1.5;
            rulerOffset = gutterWidth - dummyWidth + 2;
            $ruler.css("left", rulerOffset + "px");
        } else {
            $ruler.css("left", "0px");
        }
    }
    
    function _updateTickMarkSpacing() {
        var fontSize    = $(".CodeMirror").css("font-size"),
            $tickMarks  = $("#brackets-ruler .tick-marks");
        
        $tickMarks.css("font-size", fontSize);
    }
    
    function _createRuler() {
        $rulerPanel = $(Mustache.render(_rulerHTML, _templateFunctions));
        $("#editor-holder").before($rulerPanel);
    }
    
    function _showRuler() {
        if ($rulerPanel.is(":hidden")) {
            $rulerPanel.show();
            EditorManager.resizeEditor();
        }
    }
    
    function _hideRuler() {
        if ($rulerPanel.is(":visible")) {
            $rulerPanel.hide();
            EditorManager.resizeEditor();
        }
    }
    
    // --- Events ---
    function _updateRuler() {
        _updateTickMarkSpacing();
        _updateZeroTickMark();
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
    
    function _addEventListeners() {
        var fullEditor  = null,
            codeMirror  = null;
        
        $(DocumentManager).on("currentDocumentChange", _updateRuler);
        
        // No Font Size Adjustment Event in Brackets, use CodeMirror update Event
        fullEditor = EditorManager.getCurrentFullEditor();
        codeMirror = fullEditor ? fullEditor._codeMirror : null;
        
        if (codeMirror) {
            codeMirror.on("update", _updateRuler);
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
        $(DocumentManager).on("currentDocumentChange", _updateRuler);
        $(ViewCommandHandlers).on("adjustFontSize", _updateRuler);
        
        // Load the ruler CSS -- when done, create the ruler
        ExtensionUtils.loadStyleSheet(module, "ruler.css")
            .done(function () {
                _createRuler();
                _updateRuler();
                
                if (rulerEnabled) {
                    _showRuler();
                } else {
                    _hideRuler();
                }
            });
    });
});
