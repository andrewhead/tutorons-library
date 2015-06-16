/*jslint browser:true, continue:true */

var $ = require('jquery');
require('jquery-ui');

var SERVER_URL = 'http://tutorons.com';
var TUTORONS = ['wget', 'css'];
var TOOLTIP_WIDTH = 600;
var explanations = {};
var enabled = true;


function clearSelection() {

    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }
    else if (document.selection) {
        document.selection.empty();
    }

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


function showTooltip(node) {

    var explanation = explanations[node.textContent];
    if (enabled === false || explanation === undefined) {
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
    var selRect = node.getBoundingClientRect();
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
        }
    };
    $(document.body).bind('mousedown', hide);

    // Fade in the tooltip
    $(div).show('scale', {}, 200);

}


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

        var clickhandler = function(node) {
            return function() {
                showTooltip(node);
            };
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
          
          // Add explanation and click handler to show explanation in tooltip
          span.onclick = clickhandler(span);

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


function fetchExplanations() {

    var saveExplanation = function(resp) {
        var tutExplanations = JSON.parse(resp);
        highlight(Object.keys(tutExplanations));
        var code;
        for (code in tutExplanations) {
            if (tutExplanations.hasOwnProperty(code)) {
                explanations[code] = tutExplanations[code];
            }
        }
    };

    var i, tutName;
    for (i = 0; i < TUTORONS.length; i++) {
        tutName = TUTORONS[i];
        explanations[tutName] = {};
        $.post(
            SERVER_URL + '/' + tutName,
            {
                'origin': window.location.href,
                'document': document.body.innerHTML,
            },
            saveExplanation
        );
    }
    return explanations;

}

function addon() {
    fetchExplanations();
}

module.exports = {
    'fetch': addon,
};
