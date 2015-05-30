/*jslint browser:true, continue:true */
/*global $:false, self:false */

var SERVER_URL = 'http://tutorons.com';
var TUTORONS = ['wget', 'css'];
var TOOLTIP_WIDTH = 600;
var explanations = {};

/**
 * Remove non-alphanumeric characters at the fringes of strings.
 */
function stripEdgeSymbols(string) {
    var left = string.length - 1;
    var right = 0;
    var alphanumeric = /[a-z0-9]/i;
    var i;
    for (i = 0; i < string.length; i++) {
        if (string.charAt(i).match(alphanumeric) !== null) {
            left = i;
            break;
        }
    }
    for (i = string.length - 1; i >=0; i--) {
        if (string.charAt(i).match(alphanumeric) !== null) {
            right = i;
            break;
        }
    }
    if (right >= left) {
        return string.substring(left, right + 1);
    }
    return "";
}

function clearSelection() {
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }
    else if (document.selection) {
        document.selection.empty();
    }
}

/*
 * Compute the edit distance between two strings
 * Copyright (c) 2011 Andrei Mackenzie
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
var levenshtein = function(a, b){

    if (a.length === 0) {
        return b.length; 
    }
    if (b.length === 0) {
        return a.length; 
    }
   
    var matrix = [];
   
    // increment along the first column of each row
    var i;
    for (i = 0; i <= b.length; i++){
        matrix[i] = [i];
    }
   
    // increment each column in the first row
    var j;
    for (j = 0; j <= a.length; j++){
        matrix[0][j] = j;
    }
   
    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++){
        for (j = 1; j <= a.length; j++){
            if (b.charAt(i-1) === a.charAt(j-1)){
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                               Math.min(matrix[i][j-1] + 1, // insertion
                               matrix[i-1][j] + 1)); // deletion
            }
        }
    }
   
    return matrix[b.length][a.length];
};


function highlight(patterns) {
  
    var HL_CLASS = 'tutorons-highlight';
    var origX = window.scrollX, origY = window.scrollY;

    function isHighlighted(range) {
        var ancestors = $(range.startContainer).parents();
        var hlAncestors = ancestors.filter('.' + HL_CLASS);
        return (hlAncestors.length > 0);
    }

    function highlightPattern(pattern) {

        // Reset selection
        var selection = window.getSelection();
        selection.collapse(document.body, 0);

        // Find everywhere where the pattern occurs in the document
        var range, contents, span;
        var fadeIn = function() {
            $(this).fadeIn('slow');
            $(this).addClass(HL_CLASS);
            $(this).css('background-color', '#d99eff');
        };
        while (window.find(pattern)) {
          
          // Make sure this hasn't already been highlighted
          selection = window.getSelection();
          range = selection.getRangeAt(0);
          if (isHighlighted(range)) {
              continue;
          }

          // Transfer found terms into a span
          contents = range.extractContents();
          span = document.createElement('span');
          span.appendChild(contents);
          range.insertNode(span);
          
          // Smoothly fade in the highlighting
          $(span).fadeOut('fast', fadeIn);
        }

        selection.collapse(document.body, 0);

    }

    // Sort patterns from longest to shortest
    patterns.sort(function(a, b) { 
      return b.length - a.length; 
    });
    var i;
    for (i = 0; i < patterns.length; i++) {
      highlightPattern(patterns[i]);
    }

    // As the 'find' and 'select' methods may change the user's location on
    // the page, we scroll the page back to its original location here.
    window.scrollTo(origX, origY);

}

function styleTooltip(div) {
    $(div).css({
        width: String(TOOLTIP_WIDTH) + 'px',
        position: 'absolute',
        border: 'gray 2px dashed',
        display: 'none',
        'padding-top': '10px',
        'background-color': 'white',
        'padding': '20px',
        'font-family': '"Palatino Linotype", "Book Antiqua", Palatino, serif',
        'font-size': '14px',
    });
    $(div).find('p, ul, h5').css({
        'margin-top': '0',
        'margin-bottom': '.4em',
        'line-height': '1.3em',
    });
    $(div).find('ul').css({
        'padding-left': '20px',
    });
    $(div).find('h5').css({
        'font-size': '14px',
    });
    $(div).find('div.example-code').css({
        'margin-top': '10px',
        'padding': '10px',
        'font-size': '14px',
        'font-weight': 'normal',
        'background-color': '#F2EEFF',
        'border': 'gray 1px solid',
        'line-height': '1.3em',
        'font-family': '"Lucida Console", Monaco, monospace',
    });
    $(div).find('.tutoron_selection').css({
        'font-weight': 'bolder',
        'color': '#3A2E62',
    });
    $(div).find('.wget-opt').css({
        'font-family': '"Courier New", Courier, monospace',
    });
}


function fetchExplanations() {

    var saveExplanation = function(tutName) {
        return function(resp) {
            var tutExplanations = JSON.parse(resp);
            highlight(Object.keys(tutExplanations));
            explanations[tutName] = tutExplanations;
        };
    };
    var i, tutName;
    for (i = 0; i < TUTORONS.length; i++) {
        tutName = TUTORONS[i];
        explanations[tutName] = {};
        $.post(
            SERVER_URL + '/' + tutName,
            document.body.innerHTML,
            saveExplanation(tutName)
        );
    }
    return explanations;

}

/* 
 * Find the snippet that both matches the selected text and
 * that is the shortest edit distance away from the selected text.
 */
function getNearestExplanation(explanations, selString) {

    var explanation, tutKey, tut, key, editDist;
    var closestDist = Number.MAX_VALUE;
    for (tutKey in explanations) {
        if (explanations.hasOwnProperty(tutKey)) {
            tut = explanations[tutKey];
            for (key in tut) {
                if (tut.hasOwnProperty(key)) {
                    editDist = levenshtein(selString, key);
                    if (editDist < closestDist && key.indexOf(selString) !== -1) {
                        closestDist = editDist;
                        explanation = tut[key];
                    }
                }
            }
        }
    }
    return explanation;

}

(function addon() {

    var tooltipShowing = false;
    var enabled = true;

    /* Listen for activation or deactivation of plugin */
    self.port.on('detach', function() {
        // console.log("Detached");
        enabled = false;
    });

    var explanations = fetchExplanations();
 
    /* Trigger tooltip to show selection */
    document.body.onmouseup = function() {

        if (enabled === false || tooltipShowing === true) {
            return;
        }

        var selection = window.getSelection();
        var selString = selection.toString();
        selString = stripEdgeSymbols(selString);
        if (selString.length > 0) {

            var explanation = getNearestExplanation(explanations, selString);
            if (explanation === undefined) {
                return;
            }

            // Remove container if it already exists
            var div = document.getElementById('hint-tooltip');
            if (div !== null) {
                document.body.removeChild(div);
            }

            // Create container
            div = document.createElement('div');
            div.id = 'hint-tooltip';
            document.body.appendChild(div);

            // Add explanation to tooltip
            div.innerHTML = explanation;
            styleTooltip(div);

            // Center tooltip beneath text.  Doesn't work in IE9.
            var selRange = selection.getRangeAt(0);
            var selRect = selRange.getBoundingClientRect();
            var selMidX = window.pageXOffset + selRect.left + selRect.width / 2;
            var divX = selMidX - TOOLTIP_WIDTH / 2;
            var divY = selRect.bottom + window.pageYOffset + 10;
            divX = Math.max(window.pageXOffset, divX);
            divX = Math.min(divX, window.pageXOffset + window.innerWidth - TOOLTIP_WIDTH);
            $(div).css({
                left: String(divX) + 'px',
                top: String(divY) + 'px',
            });

            // Hide tooltip when click happens outside it
            var hide = function(event) {
                if (!$(event.target).closest('#hint-tooltip').length) {
                    $(div).css('display', 'none');
                    $(document.body).unbind('mousedown', hide);
                    clearSelection();
                    tooltipShowing = false;
                }
            };
            $(document.body).bind('mousedown', hide);

            // Fade in the tooltip
            $(div).show('scale', {}, 200);
            tooltipShowing = true;

        }
    };

}());
