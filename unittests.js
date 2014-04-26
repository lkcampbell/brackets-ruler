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
/*global define, brackets, $, describe, it, expect, beforeFirst, afterLast, afterEach, runs, waitsFor, waitsForDone */

define(function (require, exports, module) {
    "use strict";
    
    // --- Brackets Modules ---
    var ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        CommandManager,         // loaded from brackets.test
        Commands,               // loaded from brackets.test
        PreferencesManager,     // loaded from brackets.test
        ViewCommandHandlers,    // loaded from brackets.test
        EditorManager,          // loaded from brackets.test
        SpecRunnerUtils         = brackets.getModule("spec/SpecRunnerUtils");
    
    // --- Constants ---
    var EXTENSION_NAME      = "brackets-ruler",
        RULER_COMMAND_ID    = "lkcampbell.toggleColumnRuler",
        GUIDE_COMMAND_ID    = "lkcampbell.toggleColumnGuide";
    
    describe("Column Ruler", function () {
        var testWindow  = null,
            testPath    = ExtensionUtils.getModulePath(module, "unittest-files");
        
        beforeFirst(function () {
            // Create a new window that will be shared by ALL tests in this spec.
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow  = w;
                
                // Load module instances from brackets.test
                ExtensionUtils      = testWindow.brackets.test.ExtensionUtils;
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                PreferencesManager  = testWindow.brackets.test.PreferencesManager;
                ViewCommandHandlers = testWindow.brackets.test.ViewCommandHandlers;
                EditorManager       = testWindow.brackets.test.EditorManager;
                
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });
        
        afterLast(function () {
            testWindow      = null;
            testPath        = null;
            ExtensionUtils  = null;
            CommandManager  = null;
            Commands        = null;
            SpecRunnerUtils.closeTestWindow();
        });
        
        afterEach(function () {
            testWindow.closeAllFiles();
        });
        
        describe("Toggle Commands", function () {
            var prefs = null;
            
            it("should TOGGLE the rulerEnabled preference", function () {
                prefs = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                
                // Start at FALSE
                prefs.set("rulerEnabled", false);
                
                // TOGGLE to TRUE
                CommandManager.execute(RULER_COMMAND_ID);
                expect(prefs.get("rulerEnabled")).toBeTruthy();
                
                // TOGGLE to FALSE
                CommandManager.execute(RULER_COMMAND_ID);
                expect(prefs.get("rulerEnabled")).toBeFalsy();
            });
            
            it("should TOGGLE the guideEnabled preference", function () {
                prefs = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                
                // Start at FALSE
                prefs.set("guideEnabled", false);
                
                // TOGGLE to TRUE
                CommandManager.execute(GUIDE_COMMAND_ID);
                expect(prefs.get("guideEnabled")).toBeTruthy();
                
                // TOGGLE to FALSE
                CommandManager.execute(GUIDE_COMMAND_ID);
                expect(prefs.get("guideEnabled")).toBeFalsy();
            });
        });
        
        describe("Ruler Visibility", function () {
            var prefs       = null,
                filePath    = "",
                $ruler      = null,
                promise     = null;
            
            it("should be FALSE when ruler is NOT ENABLED and code editor is NOT OPEN", function () {
                prefs   = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                $ruler  = testWindow.$("#brackets-ruler");
                
                // Ruler is NOT ENABLED
                prefs.set("rulerEnabled", false);
                
                // Code editor is NOT OPEN by default
                
                // Ruler Visibility should be FALSE
                expect($ruler.is(":visible")).toBeFalsy();
            });
            
            it("should be FALSE when ruler is ENABLED and code editor is NOT OPEN", function () {
                prefs   = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                $ruler  = testWindow.$("#brackets-ruler");
                
                // Ruler is ENABLED
                prefs.set("rulerEnabled", true);
                
                // Code editor is NOT OPEN by default
                
                // Ruler Visibility should be FALSE
                expect($ruler.is(":visible")).toBeFalsy();
            });
            
            it("should be FALSE when ruler is NOT ENABLED and code editor is OPEN", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test.txt";
                $ruler      = testWindow.$("#brackets-ruler");
                
                // Ruler is NOT ENABLED
                prefs.set("rulerEnabled", false);
                
                // OPEN the code editor
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    // Ruler Visibility should be FALSE
                    expect($ruler.is(":visible")).toBeFalsy();
                });
            });
            
            it("should be TRUE when ruler is ENABLED and code editor is OPEN", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test.txt";
                $ruler      = testWindow.$("#brackets-ruler");
                
                // Ruler is ENABLED
                prefs.set("rulerEnabled", true);
                
                // OPEN the code editor
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    // Ruler Visibility should be TRUE
                    expect($ruler.is(":visible")).toBeTruthy();
                });
            });
            
            it("should be FALSE when ruler is NOT ENABLED and code editor opens a raster graphic file", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test.png";
                $ruler      = testWindow.$("#brackets-ruler");
                
                // Ruler is NOT ENABLED
                prefs.set("rulerEnabled", false);
                
                // OPEN the code editor
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    // Ruler Visibility should be FALSE
                    expect($ruler.is(":visible")).toBeFalsy();
                });
            });
            
            it("should be FALSE when ruler is ENABLED and code editor opens a raster graphic file", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test.png";
                $ruler      = testWindow.$("#brackets-ruler");
                
                // Ruler is ENABLED
                prefs.set("rulerEnabled", true);
                
                // open a raster graphic file in the code editor
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    // Ruler Visibility should be FALSE
                    expect($ruler.is(":visible")).toBeFalsy();
                });
            });
        });
        
        describe("Column Guide Visibility", function () {
            var prefs       = null,
                filePath    = "",
                $guide      = null,
                promise     = null;
            
            // Guide doesn't exist if code editor is NOT OPEN so skip those cases
            
            it("should be FALSE when guide is NOT ENABLED and code editor is OPEN", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test.txt";
                
                // Guide is NOT ENABLED
                prefs.set("guideEnabled", false);
                
                // OPEN the code editor
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    $guide = testWindow.$(".brackets-ruler-column-guide");
                    
                    // Column Guide Visibility should be FALSE
                    expect($guide.is(":visible")).toBeFalsy();
                });
            });
            
            it("should be TRUE when guide is ENABLED and code editor is OPEN", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test.txt";
                
                // Guide is ENABLED
                prefs.set("guideEnabled", true);
                
                // OPEN the code editor
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    $guide = testWindow.$(".brackets-ruler-column-guide");
                    
                    // Column Guide Visibility should be TRUE
                    expect($guide.is(":visible")).toBeTruthy();
                });
            });
        });
        
        describe("Column Guide Position", function () {
            var prefs       = null,
                filePath    = "",
                promise     = null,
                editor      = null,
                cm          = null,
                guidePos    = 0;
            
            it("should BE the value of guidePosition preference after CHANGING the preference", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test.txt";
                
                // Enable the ruler
                prefs.set("rulerEnabled", true);
                
                // Open the code editor
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    editor  = EditorManager.getCurrentFullEditor();
                    cm      = editor._codeMirror;
                    
                    // CHANGING guidePosition preference by setting the preference
                    prefs.set("guidePosition", 40);
                    
                    // Column Guide Position should BE 40
                    guidePos = cm.getOption("rulers")[0].column;
                    expect(guidePos).toBe(40);
                    
                    // CHANGING guidePosition preference by setting the preference
                    prefs.set("guidePosition", 0);
                    
                    // Column Guide Position should BE 0
                    guidePos = cm.getOption("rulers")[0].column;
                    expect(guidePos).toBe(0);
                    
                    // CHANGING guidePosition preference by setting the preference
                    prefs.set("guidePosition", 80);
                    
                    // Column Guide Position should BE 80
                    guidePos = cm.getOption("rulers")[0].column;
                    expect(guidePos).toBe(80);
                });
            });
        });
        
        describe("Ruler Tickmark Font Size", function () {
            var prefs               = null,
                filePath            = "",
                promise             = null,
                tickmarkFontSize    = "",
                editorFontSize      = "";
            
            it("should EQUAL Editor Font Size after CHANGING Editor Font Size", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test.txt";
                
                // Enable the ruler
                prefs.set("rulerEnabled", true);
                
                // Open the code editor
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    // CHANGING Editor Font Size by Increasing Size
                    CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);
                    
                    // Ruler Tickmark Font Size should EQUAL Editor Font Size
                    tickmarkFontSize    = testWindow.$("#brackets-ruler .br-tick-marks").css("font-size");
                    editorFontSize      = PreferencesManager.getViewState("fontSizeStyle");
                    expect(tickmarkFontSize).toEqual(editorFontSize);
                    
                    // Restore Editor Font Size to default size (12px)
                    CommandManager.execute(Commands.VIEW_RESTORE_FONT_SIZE);
                    
                    // CHANGING Editor Font Size by Decreasing Size
                    CommandManager.execute(Commands.VIEW_DECREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_DECREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_DECREASE_FONT_SIZE);
                    
                    // Ruler Tickmark Font Size should EQUAL Editor Font Size
                    tickmarkFontSize    = testWindow.$("#brackets-ruler .br-tick-marks").css("font-size");
                    editorFontSize      = PreferencesManager.getViewState("fontSizeStyle");
                    expect(tickmarkFontSize).toEqual(editorFontSize);
                    
                    // Restore Editor Font Size to default size (12px)
                    CommandManager.execute(Commands.VIEW_RESTORE_FONT_SIZE);
                });
            });
        });
        
        describe("Ruler Number Font Size", function () {
            var prefs               = null,
                filePath            = "",
                promise             = null,
                numberFontSize      = "",
                editorFontSize      = "";
            
            it("should EQUAL Editor Font Size when Editor Font Size is LESS THAN 14 pixels", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test.txt";
                
                // Enable the ruler
                prefs.set("rulerEnabled", true);
                
                // Open the code editor
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    // Restore Editor Font Size to default size (12px)
                    CommandManager.execute(Commands.VIEW_RESTORE_FONT_SIZE);
                    
                    // Decrease Editor Font Size so it is absolutely LESS THAN 14 pixels
                    CommandManager.execute(Commands.VIEW_DECREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_DECREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_DECREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_DECREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_DECREASE_FONT_SIZE);
                    
                    // Number Font Size should EQUAL Editor Font Size
                    numberFontSize  = testWindow.$("#brackets-ruler .br-numbers").css("font-size");
                    editorFontSize  = PreferencesManager.getViewState("fontSizeStyle");
                    expect(numberFontSize).toEqual(editorFontSize);
                    
                    // Restore Editor Font Size to default size (12px)
                    CommandManager.execute(Commands.VIEW_RESTORE_FONT_SIZE);
                });
            });
            
            it("should EQUAL '14px' when Editor Font Size is NOT LESS THAN 14 pixels", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test.txt";
                
                // Enable the ruler
                prefs.set("rulerEnabled", true);
                
                // Open the code editor
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    // Restore Editor Font Size to default size (12px)
                    CommandManager.execute(Commands.VIEW_RESTORE_FONT_SIZE);
                    
                    // Increase Editor Font Size so it is absolutely NOT LESS THAN 14 pixels
                    CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);
                    
                    // Number Font Size should EQUAL "14px"
                    numberFontSize  = testWindow.$("#brackets-ruler .br-numbers").css("font-size");
                    expect(numberFontSize).toEqual("14px");
                    
                    // Restore Editor Font Size to default size (12px)
                    CommandManager.execute(Commands.VIEW_RESTORE_FONT_SIZE);
                });
            });
        });
        
        describe("Ruler Scroll", function () {
            var prefs               = null,
                filePath            = "",
                promise             = null,
                tickmarkWidth       = 0,
                rulerScroll         = 0,
                editorScroll        = 0,
                editor              = null,
                $ruler              = null,
                rulerScrolled       = false;
            
            it("should EQUAL Editor Scroll after CHANGING Gutter Width", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test.txt";
                
                // Enable the ruler
                prefs.set("rulerEnabled", true);
                
                // Open the code editor
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    // CHANGING Gutter Width by toggling Line Numbers
                    CommandManager.execute(Commands.TOGGLE_LINE_NUMBERS);
                    
                    // Ruler Scroll should EQUAL Editor Scroll
                    tickmarkWidth   =   testWindow.$("#brackets-ruler #br-tick-0").width();
                    rulerScroll     =   testWindow.$("#brackets-ruler #br-ruler").offset().left;
                    rulerScroll     +=  Math.ceil(tickmarkWidth * 1.5);
                    rulerScroll     -=  parseInt(testWindow.$(".CodeMirror pre").css("padding-left"), 10);
                    editorScroll    =   testWindow.$(".CodeMirror-code").offset().left;
                    expect(rulerScroll).toEqual(editorScroll);
                    
                    // CHANGING Gutter Width by toggling Line Numbers
                    CommandManager.execute(Commands.TOGGLE_LINE_NUMBERS);
                    
                    // Ruler Scroll should EQUAL Editor Scroll
                    tickmarkWidth   =   testWindow.$("#brackets-ruler #br-tick-0").width();
                    rulerScroll     =   testWindow.$("#brackets-ruler #br-ruler").offset().left;
                    rulerScroll     +=  Math.ceil(tickmarkWidth * 1.5);
                    editorScroll    =   testWindow.$(".CodeMirror-code").offset().left;
                    expect(rulerScroll).toEqual(editorScroll);
                });
            });
            
            it("should EQUAL Editor Scroll after SCROLLING Editor", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test.txt";
                
                // Enable the ruler
                prefs.set("rulerEnabled", true);
                
                // Turn off Word Wrap so that editor can be horizontally scrolled
                PreferencesManager.set("wordWrap", false);
                
                // Open the code editor
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    $ruler          = testWindow.$("#brackets-ruler");
                    rulerScrolled   = false;
                    
                    $ruler.on("scroll", function () {
                        rulerScrolled = true;
                    });
                    
                    // SCROLLING Editor to the right
                    editor = EditorManager.getCurrentFullEditor();
                    editor.setScrollPos(200, 0);
                });
                
                waitsFor(function () {
                    return rulerScrolled;
                });
                
                runs(function () {
                    $ruler          = testWindow.$("#brackets-ruler");
                    rulerScrolled   = false;
                    
                    // Ruler Scroll should EQUAL Editor Scroll
                    tickmarkWidth   =   testWindow.$("#brackets-ruler #br-tick-0").width();
                    rulerScroll     =   testWindow.$("#brackets-ruler #br-ruler").offset().left;
                    rulerScroll     +=  Math.ceil(tickmarkWidth * 1.5);
                    editorScroll    =   testWindow.$(".CodeMirror-code").offset().left;
                    expect(rulerScroll).toEqual(editorScroll);
                    
                    $ruler.on("scroll", function () {
                        rulerScrolled = true;
                    });
                    
                    // SCROLLING Editor to the left
                    editor = EditorManager.getCurrentFullEditor();
                    editor.setScrollPos(100, 0);
                    
                    waitsFor(function () {
                        return rulerScrolled;
                    });
                });
                
                waitsFor(function () {
                    return rulerScrolled;
                });
                
                runs(function () {
                    // Ruler Scroll should EQUAL Editor Scroll
                    tickmarkWidth   =   testWindow.$("#brackets-ruler #br-tick-0").width();
                    rulerScroll     =   testWindow.$("#brackets-ruler #br-ruler").offset().left;
                    rulerScroll     +=  Math.ceil(tickmarkWidth * 1.5);
                    editorScroll    =   testWindow.$(".CodeMirror-code").offset().left;
                    expect(rulerScroll).toEqual(editorScroll);
                });
            });
        });
        
        describe("Ruler Length (No Word Wrap)", function () {
            var prefs       = null,
                filePath    = "",
                promise     = null,
                rulerLength = 0;
            
            it("should BE 80 after OPENING empty file", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test-0-chars.txt";
                
                // Enable the ruler
                prefs.set("rulerEnabled", true);
                
                // Turn off Word Wrap
                PreferencesManager.set("wordWrap", false);
                
                // OPENING empty file
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                // Ruler Length (No Word Wrap) should be 80
                runs(function () {
                    rulerLength = testWindow.$("#br-number-right-filler").prev().text();
                    rulerLength = parseInt(rulerLength, 10);
                    expect(rulerLength).toBe(80);
                });
            });
            
            it("should BE 1000 after OPENING file with one line of 1500 characters", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test-1500-chars.txt";
                
                // Enable the ruler
                prefs.set("rulerEnabled", true);
                
                // Turn off Word Wrap
                PreferencesManager.set("wordWrap", false);
                
                // OPENING file with one line of 1500 characters
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                // Ruler Length (No Word Wrap) should be 1000
                runs(function () {
                    rulerLength = testWindow.$("#br-number-right-filler").prev().text();
                    rulerLength = parseInt(rulerLength, 10);
                    expect(rulerLength).toBe(1000);
                });
            });
            
            it("should BE 100 after OPENING file with one line of 95 characters", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test-95-chars.txt";
                
                // Enable the ruler
                prefs.set("rulerEnabled", true);
                
                // Turn off Word Wrap
                PreferencesManager.set("wordWrap", false);
                
                // OPENING file with one line of 95 characters
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                // Ruler Length (No Word Wrap) should be 100
                runs(function () {
                    rulerLength = testWindow.$("#br-number-right-filler").prev().text();
                    rulerLength = parseInt(rulerLength, 10);
                    expect(rulerLength).toBe(100);
                });
            });
            
            it("should BE 90 after OPENING empty file and SETTING guide position to 90", function () {
                prefs       = PreferencesManager.getExtensionPrefs(EXTENSION_NAME);
                filePath    = testPath + "/test-0-chars.txt";
                
                // Enable the ruler
                prefs.set("rulerEnabled", true);
                
                // Turn off Word Wrap
                PreferencesManager.set("wordWrap", false);
                
                // SETTING guide position to 90
                prefs.set("guidePosition", 90);
                
                // OPENING empty file
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });
                
                // Ruler Length (No Word Wrap) should be 90
                runs(function () {
                    rulerLength = testWindow.$("#br-number-right-filler").prev().text();
                    rulerLength = parseInt(rulerLength, 10);
                    expect(rulerLength).toBe(90);
                });
            });
        });
        
        // **TO DO** Ruler Length (Word Wrap) Unit Tests
    });
});
