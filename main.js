/*
 * The MIT License (MIT)
 * Copyright (c) 2013-2014 Lance Campbell. All rights reserved.
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
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";
    
    // --- Brackets Modules ---
    var PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        AppInit             = brackets.getModule("utils/AppInit"),
        Menus               = brackets.getModule("command/Menus"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        ViewCommandHandlers = brackets.getModule("view/ViewCommandHandlers"),
        MainViewManager     = brackets.getModule("view/MainViewManager");
    
    // --- CodeMirror Addons ---
    brackets.getModule(["thirdparty/CodeMirror2/addon/display/rulers"]);
    
    // --- Extension modules ---
    var Ruler = require("Ruler").Ruler;
    
    // --- Constants ---
    var EXTENSION_NAME      = "brackets-ruler";
    
    var RULER_COMMAND_NAME  = "Column Ruler",
        RULER_COMMAND_ID    = "lkcampbell.toggleColumnRuler",
        RULER_CONTEXT_MENU  = "lkcampbell-ruler-context-menu";
    
    var GUIDE_COMMAND_NAME  = "Column Guide",
        GUIDE_COMMAND_ID    = "lkcampbell.toggleColumnGuide",
        GUIDE_COLOR         = "rgba(128, 128, 128, 0.5)",
        GUIDE_LINE_STYLE    = "solid",
        GUIDE_CLASS         = "brackets-ruler-column-guide";
    
    var MIN_COLUMNS = 80;
    
    // --- Extension Preferences ---
    var prefs = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
    
    prefs.definePreference("rulerEnabled",      "boolean",  false);
    prefs.definePreference("guideEnabled",      "boolean",  false);
    prefs.definePreference("guidePosition",     "number",   MIN_COLUMNS);
    prefs.definePreference("guideColor",        "string",   GUIDE_COLOR);
    prefs.definePreference("guideLineStyle",    "string",   GUIDE_LINE_STYLE);

    
    // --- Private Variables ---
    var editor      = null,
        cm          = null,
        ruler       = new Ruler(),
        $rulerPanel = null,
        isDragging  = false;
    
    // --- Private Functions
    function applyPrefs() {
        var rulerEnabled    = prefs.get("rulerEnabled"),
            guideEnabled    = prefs.get("guideEnabled"),
            guidePosition   = prefs.get("guidePosition"),
            guideColor      = prefs.get("guideColor"),
            guideLineStyle  = prefs.get("guideLineStyle"),
            guideClass      = "",
            guideOptions    = [];
        
        // Update Ruler
        ruler.setEnabled(rulerEnabled);
        
        // Update Guide
        if (cm) {
            if (guideEnabled) {
                guideOptions.push({
                    color:      guideColor,
                    lineStyle:  guideLineStyle,
                    column:     guidePosition
                });
                
                cm.setOption("rulers", guideOptions);
            } else {
                cm.setOption("rulers", false);
            }
        }
        
        ruler.setGuidePosition(guidePosition);
        
        // Update Menu Settings
        CommandManager.get(RULER_COMMAND_ID).setChecked(rulerEnabled);
        CommandManager.get(GUIDE_COMMAND_ID).setChecked(guideEnabled);
    }
    
    // --- Helper functions ---
    function getColumnFromRulerClick(event) {
        var $allTickMarks   = $(".br-tick-marks").children(),
            $targetTickMark = null,
            clickX          = event.pageX,
            targetClass     = "",
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
        
        targetClass = $targetTickMark.attr("class").split(" ")[1];
        
        if (targetClass === "br-tick-mark-left-filler") {
            targetClass = $targetTickMark.next().attr("class").split(" ")[1];
        } else if (targetClass === "br-tick-mark-right-filler") {
            targetClass = $targetTickMark.prev().attr("class").split(" ")[1];
        }
        
        matchResult = targetClass.match(tickRegExp);
        
        return parseInt(matchResult[1], 10);
    }
    
    // --- Event Handlers ---
    function handlePrefsChange() {
        applyPrefs();
        prefs.save();
    }
    
    function handleToggleRuler() {
        prefs.set("rulerEnabled", !prefs.get("rulerEnabled"));
    }
    
    function handleToggleGuide() {
        prefs.set("guideEnabled", !prefs.get("guideEnabled"));
    }
    
    function handleDocumentChange() {
        editor  = EditorManager.getCurrentFullEditor();
        cm      = editor ? editor._codeMirror : null;

        ruler.setEditor(editor);
        applyPrefs();
    }
    
    function handleRulerDragStop() {
        $rulerPanel.off("mousemove");
        $rulerPanel.off("mouseup");
        $rulerPanel.off("mouseenter");
        
        // No dragging === mouse click: toggle guide
        if (!isDragging) {
            handleToggleGuide();
        }
        
        isDragging = false;
    }
    
    function handleRulerDrag(event) {
        // When left mouse button is no longer pressed, stop the drag
        if (event.which !== 1) {
            handleRulerDragStop();
        }
        
        isDragging = true;
        prefs.set("guidePosition", getColumnFromRulerClick(event));
    }
    
    function handleRulerMouseEnter(event) {
        if (event.which === 1) {
            handleRulerDrag();
        } else {
            handleRulerDragStop();
        }
    }
    
    function handleRulerDragStart(event) {
        // Only react to the left mouse click
        if (event.which !== 1) { return; }
        
        $rulerPanel.mousemove(handleRulerDrag);
        $rulerPanel.mouseup(handleRulerDragStop);
        $rulerPanel.mouseenter(handleRulerMouseEnter);
        
        if (prefs.get("guidePosition") === getColumnFromRulerClick(event)) {
            // Possibly a simple mouse click to toggle guide
            isDragging = false;
        } else {
            // Definitely not a toggle, start the drag column reset
            isDragging = true;
            handleRulerDrag(event);
        }
    }
    
    // --- Initialize Extension ---
    AppInit.appReady(function () {
        var viewMenu            = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU),
            rulerContextMenu    = Menus.registerContextMenu(RULER_CONTEXT_MENU);
        
        // Register toggle commands and add them to menus
        CommandManager.register(RULER_COMMAND_NAME, RULER_COMMAND_ID, handleToggleRuler);
        CommandManager.register(GUIDE_COMMAND_NAME, GUIDE_COMMAND_ID, handleToggleGuide);
        
        if (viewMenu) {
            viewMenu.addMenuItem(RULER_COMMAND_ID);
            viewMenu.addMenuItem(GUIDE_COMMAND_ID);
        }
        
        if (rulerContextMenu) {
            rulerContextMenu.addMenuItem(RULER_COMMAND_ID);
            rulerContextMenu.addMenuItem(GUIDE_COMMAND_ID);
        }
        
        // Load Style Sheet, User Interface, and Event Listeners
        ExtensionUtils.loadStyleSheet(module, "ruler.css")
            .done(function () {
                // Create Ruler UI
                $rulerPanel = ruler.createRulerPanel();
                
                // Add Ruler Panel Event Listeners
                $rulerPanel.on("contextmenu", function (e) {
                    rulerContextMenu.open(e);
                });
                
                $rulerPanel.mousedown(handleRulerDragStart);
                
                // Add General Event Listeners
                $(DocumentManager).on("currentDocumentChange", handleDocumentChange);

                prefs.on("change", handlePrefsChange);

                $(ViewCommandHandlers).on("fontSizeChange", function () {
                    ruler.updateVisibility();
                });

                $(MainViewManager).on("paneCreate paneDestroy", function () {
                    ruler.updateVisibility();
                });

                // Starting up Brackets: Fire a Document Change Event
                handleDocumentChange();
            });
    });
});
