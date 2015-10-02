/*jslint continue:true */

var $ = require('jquery');
var _ = require('lodash');
var HtmlWalker = require('./html-walker').HtmlWalker;
require('jquery-ui');

var TutoronsConnection = function(window, options) {

    this.HL_CLASS = 'tutorons-highlight';
    this.TOOLTIP_PADDING_SIDES = 20;

    this.options = {
         'endpoints': {
            'wget': 'http://www.tutorons.com/wget',
            'regex': 'http://www.tutorons.com/regex',
            'css': 'http://www.tutorons.com/css',
        },
        'colors': ['#d99eff', '#ffbbbb', '#cceeaa'],
        'contextTutorons': ['css'],
    };
    this.options = _.assign(this.options, options);

    this.window = window;
    this.enabled = true;
    this.htmlWalker = new HtmlWalker(this.window);

};

TutoronsConnection.prototype.addRegions = function (tutoron, regions) {
    var parent = this;
    regions.forEach(function (r) {
        var range = parent.window.document.createRange();
        var node = parent.window.document.querySelector(r.node);
        var textNodes = parent.htmlWalker.getTextDescendants(node);
        var textRanges = parent.htmlWalker.getRangeInText(textNodes, r.start_index, r.end_index + 1);
        range.setStart(textRanges.start.node, textRanges.start.offset);
        range.setEnd(textRanges.end.node, textRanges.end.offset);
        parent.markRange(range, r.document, parent.getColor(tutoron));
    });
};

TutoronsConnection.prototype.scanDom = function () {

    function addExplanation (tutoronsConn, tutoron) {
        return function (resp) {
            var regions = JSON.parse(resp);
            tutoronsConn.addRegions(tutoron, regions);
         };
    }

    var endpoints = this.options.endpoints;
    var tutoron, endpoint;
    for (tutoron in endpoints) {
        if (endpoints.hasOwnProperty(tutoron)) {
            endpoint = endpoints[tutoron];
            $.post(endpoint + '/scan', {
                    'origin': this.window.location.href,
                    'document': this.window.document.body.innerHTML,
                }, addExplanation(this, tutoron)
            );
        }
    }

};

TutoronsConnection.prototype.explainSelection = function (tutoron, selection) {

    var DEFAULT_CONTEXT_SIZE = 3;
    var contextSize = 0;
    var queryText;

    var selectedText = selection.toString();
    var context = this.htmlWalker.getContext(selection, DEFAULT_CONTEXT_SIZE);
    if (this.options.contextTutorons.indexOf(tutoron) !== -1 && context !== null) {
        queryText = context;
        contextSize = DEFAULT_CONTEXT_SIZE;
    } else {
        queryText = selectedText;
    }

    var range = selection.getRangeAt(0);
    var parent = this;
    $.post(this.options.endpoints[tutoron] + '/explain', { 
            'origin': this.window.location.href,
            'text': queryText,
            'edge_size': contextSize,
        }, function (html) {
            parent.markRange(range, html, parent.getColor(tutoron), true);
        }
    );

};

TutoronsConnection.prototype.markRange = function (range, explanation, color, showNow) {

    if (this.isHighlighted(range)) {
        return;
    }

    var parent = this;

    // Transfer found terms into a span
    var contents = range.extractContents();
    var span = this.window.document.createElement('span');
    span.appendChild(contents);
    range.insertNode(span);
      
    // Add explanation and click handler to show explanation in tooltip
    span.onclick = function () {
        parent.showTooltip(span);
    };

    $(span).data('explanation', explanation);

    // Smoothly fade in the highlighting
    $(span).fadeOut('fast', function () {
        $(this).fadeIn('slow', function () {
            if (showNow === true) {
                parent.showTooltip(span);
            }
        });
        $(this).addClass(parent.HL_CLASS);
        $(this).css('background-color', color);
    });

};

TutoronsConnection.prototype.getTooltipWidth = function (node) {

    var TOOLTIP_MIN_WIDTH = 600;
    var TOOLTIP_PADDING_SIDES = this.TOOLTIP_PADDING_SIDES;
    var tooltipWidth = TOOLTIP_MIN_WIDTH;

    function widthWithPadding(node) {
        return Number($(node).attr('width')) + TOOLTIP_PADDING_SIDES * 2;
    }

    // We approximate an appropriate width for the tooltip as the width of
    // its largest internal descendant, plus padding
    $(node).find('*').each(function() {
        if (widthWithPadding(this) > tooltipWidth) {
            tooltipWidth = widthWithPadding(this);
        }
    });

    return tooltipWidth;

};

TutoronsConnection.prototype.showTooltip = function (node) {

    var explanation = $(node).data('explanation');
    if (this.enabled === false || explanation === undefined) {
        return;
    }

    // Remove container if it already exists
    var div = this.window.document.getElementById('hint-tooltip');
    if (div !== null) {
        this.window.document.body.removeChild(div);
    }

    // Create container
    div = this.window.document.createElement('div');
    div.id = 'hint-tooltip';
    this.window.document.body.appendChild(div);

    // Add explanation to tooltip
    div.innerHTML = explanation;
    this.styleTooltip(div);

    // Center tooltip beneath text.  Doesn't work in IE9.
    var selRect = node.getBoundingClientRect();
    var selMidX = this.window.pageXOffset + selRect.left + selRect.width / 2;
    var tooltipWidth = this.getTooltipWidth(div);
    var bodyWidth = $(this.window.document.body).width();
    var divX = selMidX - tooltipWidth / 2;
    var divY = selRect.bottom + this.window.pageYOffset + 10;
    divX = Math.max(this.window.pageXOffset, divX);
    divX = Math.min(divX, this.window.pageXOffset + bodyWidth - tooltipWidth);

    // Hide tooltip when click happens outside it
    var parent = this;
    var hide = function (event) {
        if (!$(event.target).closest('#hint-tooltip').length) {
            $(div).css('display', 'none');
            $(parent.window.document.body).unbind('mousedown', hide);
            parent.htmlWalker.clearSelection();
        }
    };
    $(this.window.document.body).bind('mousedown', hide);

    // XXX: when tested in Firefox, it was necessary to explicitly set to CSS property
    // for 'left' to the empty string '' before setting it to a new value for the page
    // to reflect the intended position.  This only appears to be a problem when 'all'
    // CSS properties for the 'div' are set to 'initial' before setting the value of 'left'.
    $(div).css('left', '');
    $(div).css({
        position: 'absolute',
        left: String(divX) + 'px',
        top: String(divY) + 'px',
    });

    // Fade in the tooltip
    $(div).show('scale', {}, 200);

};

TutoronsConnection.prototype.getColor = function (tutoron) {
    var tutorons = [];
    var endpoints = this.options.endpoints;
    var t;
    for (t in endpoints) {
        if (endpoints.hasOwnProperty(t)) {
            tutorons.push(t);
        }
    }
    tutorons.sort();
    return this.options.colors[tutorons.indexOf(tutoron)];
};

TutoronsConnection.prototype.styleTooltip = function (div) {

    // Initialize the format of all formatted elements
    $(div).css({
        'all': 'initial',
    });
    $(div).find('p, ul, h5, div.example-code, .tutoron-selection, .wget-opt').css({
        'all': 'initial',
    });

    // Apply formatting to elements
    $(div).css({
        'width': String(this.getTooltipWidth(div)) + 'px',
        'border': 'gray 2px dashed',
        'display': 'none',
        'padding-top': '10px',
        'background-color': 'white',
        'padding': String(this.TOOLTIP_PADDING_SIDES) + 'px',
        'font-family': '"Palatino Linotype", "Book Antiqua", Palatino, serif',
        'font-size': '14px',
    });
    $(div).find('p, ul, h5').css({
        'display': 'block',
        'margin-top': '0',
        'margin-bottom': '.4em',
        'font-family': '"Palatino Linotype", "Book Antiqua", Palatino, serif',
        'font-size': '14px',
        'line-height': '1.3em',
    });
    $(div).find('ul').css({
        'padding-left': '20px',
    });
    $(div).find('h5').css({
        'font-weight': 'bold',
    });
    $(div).find('div.example-code').css({
        'display': 'block',
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

};

TutoronsConnection.prototype.isHighlighted = function (range) {
    var ancestors = $(range.startContainer).parents();
    var hlAncestors = ancestors.filter('.' + this.HL_CLASS);
    return (hlAncestors.length > 0);
};

module.exports = {
    'TutoronsConnection': TutoronsConnection,
};
