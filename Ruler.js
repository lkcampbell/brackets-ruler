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
    var Editor          = brackets.getModule("editor/Editor").Editor,
        EditorManager   = brackets.getModule("editor/EditorManager");
    
    // --- Constants ---
    var MIN_COLUMNS         = 80,       // Must be multiple of ten
        MAX_COLUMNS         = 1000,     // Must be multiple of ten
        MAX_NUMBER_SIZE     = 14;       // Defined in pixels
        
    var RULER_HTML          = require("text!ruler.html"),
        DEFAULT_FONT_FAMILY = "SourceCodePro-Medium,ＭＳ ゴシック,MS Gothic,monospace";
    
    // --- Ruler Object ---
    function Ruler() {
        this.$panel = null;
        this.editor = null;
        this.cm     = null;
        
        // Ruler States
        this.enabled        = false;
        this.visible        = false;
        this.length         = MIN_COLUMNS;
        this.scrollX        = 0; // measured in pixels
        this.tickmarkWidth  = 0; // measured in pixels
        this.guidePosition  = MIN_COLUMNS;
        
        // Editor States
        this.editorScrollPosX   = "";
        this.editorWordWrap     = false;
        
        // CodeMirror States
        this.cmFontSize         = "";
        this.cmGutterWidth      = 0; // measured in pixels
        this.cmWidth            = 0; // measured in pixels
        this.cmMaxLineLength    = 0;
    }
    
    Ruler.prototype = {
        createRulerPanel: function () {
            this.$panel = $(RULER_HTML);
//            $("#editor-holder").before(this.$panel);
            $("#first-pane").prepend(this.$panel);
            return this.$panel;
        },
        
        updateEventListeners: function () {
            var self            = this,
                refreshRuler    = function () { self.refresh(); };
            
            this.cm.off("viewportChange", refreshRuler);
            this.cm.off("scroll", refreshRuler);
            this.cm.off("change", refreshRuler);
            
            this.cm.on("viewportChange", refreshRuler);
            this.cm.on("scroll", refreshRuler);
            this.cm.on("change", refreshRuler);
        },
        
        setEnabled: function (enabled) {
            this.enabled = enabled;
            this.updateVisibility();
        },
        
        setEditor: function (editor) {
            // This should **NEVER** happen but just in case...
            if ((editor) && (this.editor === editor)) {
                console.error("Ruler.setEditor is **NOT CHANGING** to new editor.");
                return;
            }
            
            if (editor) {
                // Update State Information
                this.editor = editor;
                this.cm     = this.editor._codeMirror;
                
                this.editorScrollPosX   = this.editor.getScrollPos().x;
                this.editorWordWrap     = Editor.getWordWrap();
                
                this.cmFontSize         = $(this.cm.getWrapperElement()).css("font-size");
                this.cmGutterWidth      = $(this.cm.getGutterElement()).width();
                this.cmWidth            = $(this.cm.display.sizer).width();
                this.cmMaxLineLength    = this.cm.display.maxLineLength;
                
                // Update Event Listeners
                this.updateEventListeners();
            } else {
                // Clear state information
                this.editor = null;
                this.cm     = null;
                
                this.editorScrollPosX   = "";
                this.editorWordWrap     = false;
                
                this.cmFontSize         = "";
                this.cmGutterWidth      = 0;
                this.cmWidth            = 0;
                this.cmMaxLineLength    = 0;
            }
            
            // Editor changed: update ruler visibility
            this.updateVisibility();
            
            // Editor changed: update the entire ruler view
            this.refresh(true);
        },
        
        setGuidePosition: function (guidePosition) {
            if (guidePosition > MAX_COLUMNS) {
                guidePosition = MAX_COLUMNS;
            }
            
            this.guidePosition = guidePosition;
            this.updateLength();
        },
        
        show: function () {
            if (this.$panel.is(":hidden")) {
                this.$panel.show();
                EditorManager.resizeEditor();
            }
        },
        
        hide: function () {
            if (this.$panel.is(":visible")) {
                this.$panel.hide();
                EditorManager.resizeEditor();
            }
        },
        
        updateVisibility: function () {
            // Don't show ruler if there is no Codemirror Editor
            this.visible = this.cm ? true : false;
            
            if (this.enabled && this.visible) {
                this.show();
            } else {
                this.hide();
            }
        },
        
        updateTickmarks: function () {
            var $cmWrapper      = $(this.cm.getWrapperElement()),
                $tickMarks      = $(".brackets-ruler .br-tick-marks"),
                $rulerNumbers   = $(".brackets-ruler .br-numbers"),
                rulerHidden     = this.$panel.is(":hidden"),
                $tickmarkZero   = $(".brackets-ruler .br-tick-0"),
                $ruler          = $(".brackets-ruler .br-ruler");
            
            // Set the font size of the tickmarks and the ruler numbers
            this.tickmarkFontSize = this.cmFontSize;
            $tickMarks.css("font-size", this.tickmarkFontSize);
            
            if (parseInt(this.tickmarkFontSize, 10) < MAX_NUMBER_SIZE) {
                $rulerNumbers.css("font-size", this.tickmarkFontSize);
            } else {
                $rulerNumbers.css("font-size", MAX_NUMBER_SIZE + "px");
            }
            
            // Can't get width of a tickmark if ruler is not visible.
            if (rulerHidden) {
                // Show ruler briefly...
                this.show();
                // ...grab the tickmark width...
                this.tickmarkWidth = $tickmarkZero.width();
                // ...then hide ruler again.
                this.hide();
            } else {
                this.tickmarkWidth = $tickmarkZero.width();
            }
            
            this.updateScrollX();
        },
        
        updateScrollX: function () {
            var $ruler = $(".brackets-ruler .br-ruler");
            
            // Line up tickmark zero with column one
            this.scrollX  = 0;
            this.scrollX += this.cmGutterWidth;
            this.scrollX += parseInt($(".CodeMirror pre").css("padding-left"), 10);
            this.scrollX -= Math.ceil(this.tickmarkWidth * 1.5);
            this.scrollX -= this.cm.getScrollInfo().left;
            
            $ruler.css("left", this.scrollX + "px");
            
            // Used by unit testing
            $ruler.trigger("scroll");
        },
        
        updateLength: function () {
            var newLength       = 0,
                $currentElement = null,
                $newElement     = null,
                i               = 0;
            
            if (this.editorWordWrap) {
                // Word wrap on.  Ruler length determined by width of client.
                newLength = Math.ceil((this.cmWidth / this.tickmarkWidth) / 10) * 10;
            } else {
                // Word wrap off.  Ruler length determined by longest text line.
                newLength = Math.ceil(this.cmMaxLineLength / 10) * 10;
            }
            
            // Ruler needs to be the minimum length
            if (newLength < MIN_COLUMNS) {
                newLength = MIN_COLUMNS;
            }
            
            // Ruler must also be long enough to show column guide
            if (newLength < this.guidePosition) {
                newLength = Math.ceil(this.guidePosition / 10) * 10;
            }
            
            // Ruler causes some performance issues if it gets too long
            if (newLength > MAX_COLUMNS) {
                newLength = MAX_COLUMNS;
            }
            
            if (newLength < this.length) {
                // Remove Ruler Numbers
                $currentElement = $(".brackets-ruler .br-number-right-filler");
                $currentElement.prev().remove();
                
                for (i = (this.length - 10); i > newLength; i -= 10) {
                    $currentElement.prev().remove();
                    $currentElement.prev().remove();
                }
                
                $currentElement.prev().remove();
                $currentElement.prev().attr("colspan", 6);
                
                // Remove Ruler Tick Marks
                $currentElement = $(".brackets-ruler .br-tick-mark-right-filler");
                
                for (i = this.length; i > newLength; i--) {
                    $currentElement.prev().remove();
                }
            } else if (newLength > this.length) {
                // Add Ruler Numbers
                $currentElement = $(".brackets-ruler .br-number-right-filler").prev();
                $currentElement.attr("colspan", 9);
                $newElement = $("<td></td>");
                $newElement.attr("class", "br-number");
                $currentElement.after($newElement);
                $currentElement = $currentElement.next();
                
                for (i = (this.length + 10); i <= newLength; i += 10) {
                    $newElement = $("<td></td>");
                    $newElement.attr("class", "br-number");
                    
                    if (i !== newLength) {
                        $newElement.attr("colspan", 9);
                    } else {
                        $newElement.attr("colspan", 6);
                    }
                    
                    $newElement.text(i);
                    $currentElement.after($newElement);
                    $currentElement = $currentElement.next();
                    
                    if (i !== newLength) {
                        $newElement = $("<td></td>");
                        $newElement.attr("class", "br-number");
                        $currentElement = $currentElement.after($newElement);
                        $currentElement = $currentElement.next();
                    }
                }
                
                // Add Ruler Tick Marks
                $currentElement = $(".brackets-ruler .br-tick-mark-right-filler").prev();
                
                for (i = (this.length + 1); i <= newLength; i++) {
                    $newElement = $("<td></td>");
                    
                    if (i % 5) {
                        // Minor Tick Mark
                        $newElement.attr("class", "br-minor-tick-mark br-tick-" + i);
                    } else {
                        // Major Tick Mark
                        $newElement.attr("class", "br-major-tick-mark br-tick-" + i);
                    }

                    // Insert non-breaking space character
                    $newElement.text("\xa0");
                    
                    $currentElement.after($newElement);
                    $currentElement = $currentElement.next();
                }
            } // else they are equal so do nothing...
            
            this.length = newLength;
        },
        
        refresh: function (updateAll) {
            if (this.cm) {
                // Unconditional update of all view components
                if (updateAll) {
                    this.updateTickmarks();
                    this.updateScrollX();
                    this.updateLength();
                    return;
                }
                
                // Font size changed: update tickmarks
                if (this.cmFontSize !== $(this.cm.getWrapperElement()).css("font-size")) {
                    this.cmFontSize = $(this.cm.getWrapperElement()).css("font-size");
                    this.updateTickmarks();
                }
                
                // Gutter width changed: update scrollX
                if (this.cmGutterWidth !== $(this.cm.getGutterElement()).width()) {
                    this.cmGutterWidth = $(this.cm.getGutterElement()).width();
                    this.updateScrollX();
                }
                
                // Horizontal scroll changed: update scrollX
                if (this.editorScrollPosX !== this.editor.getScrollPos().x) {
                    this.editorScrollPosX = this.editor.getScrollPos().x;
                    this.updateScrollX();
                }
                
                // Word wrap preference changed: update length
                if (this.editorWordWrap !== Editor.getWordWrap()) {
                    this.editorWordWrap = Editor.getWordWrap();
                    this.updateLength();
                }
                
                // Word wrap determines which setting to check for changes
                if (this.editorWordWrap) {
                    // With word wrap, if editor width changes: update length
                    if (this.cmWidth !== $(this.cm.display.sizer).width()) {
                        this.cmWidth = $(this.cm.display.sizer).width();
                        this.updateLength();
                    }
                } else {
                    // Without word wrap, if longest text line changes: update length
                    if (this.cmMaxLineLength !== this.cm.display.maxLineLength) {
                        this.cmMaxLineLength = this.cm.display.maxLineLength;
                        this.updateLength();
                    }
                }
            }
        }
    };
    
    // Public API
    exports.Ruler = Ruler;
});
