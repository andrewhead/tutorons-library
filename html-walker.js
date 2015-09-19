var $ = require('jquery');

var HtmlWalker = function (window) {
    this.window = window;
};

/**
 * Clear all active selections in the DOM
 */
HtmlWalker.prototype.clearSelection = function () {
    if (this.window.getSelection) {
        this.window.getSelection().removeAllRanges();
    }
    else if (this.window.document.selection) {
        this.window.document.selection.empty();
    }
};

/**
 * Given a list of text nodes that are descendants of a node and the
 * character offsets in that node, return the text nodes at the start
 * and end and the character offsets within those nodes.
 */
HtmlWalker.prototype.getRangeInText = function (textNodeList, startOffset, endOffset) {

    var currentOffset = 0;
    var nodeStartOffset, nodeEndOffset;
    var startNode, endNode;
    var foundStart = false, foundEnd = false;

    textNodeList.some(function (node) {
        var textLength = node.textContent.length;
        if (startOffset >= currentOffset && 
            startOffset < currentOffset + textLength) {
            foundStart = true;
            startNode = node;
            nodeStartOffset = startOffset - currentOffset;
        }
        if (endOffset >= currentOffset &&
            endOffset <= currentOffset + textLength) {
            foundEnd = true;
            endNode = node;
            nodeEndOffset = endOffset - currentOffset;
        }
        currentOffset += textLength;
        return foundStart && foundEnd;
    });

    return {
        'start': {
            'node': startNode,
            'offset': nodeStartOffset
        },
        'end': {
            'node': endNode,
            'offset': nodeEndOffset
        }
    };

};

/**
 * Get an ordered list of all text nodes within a node.
 */
HtmlWalker.prototype.getTextDescendants = function (node) {
    var descendants = [];
    var i, j;
    var child;
    var childDescendants;
    if (node.nodeName === '#text') {
        descendants.push(node);
    } else {
        for (i = 0; i < node.childNodes.length; i++) {
            child = node.childNodes[i];
            childDescendants = this.getTextDescendants(child);
            for (j = 0; j < childDescendants.length; j++) {
                descendants.push(childDescendants[j]);
            }
        }
    }
    return descendants;
};

/* 
 * Return the first single node that holds the full range.
 */
HtmlWalker.prototype.getEncapsulatingNode = function (range) {

    var sCont = range.startContainer;
    var eCont = range.endContainer;
    var startParents = [sCont].concat($(sCont).parents().toArray());
    var endParents = [eCont].concat($(eCont).parents().toArray());

    var i, j, sNode, eNode;
    for (i = 0; i < startParents.length; i++) {
        for (j = 0; j < endParents.length; j++) {
            sNode = startParents[i];
            eNode = endParents[j];
            if (sNode === eNode && sNode.nodeType === 1 && eNode.nodeType === 1) {
                return sNode;
            }
        }
    }
    return null;

};

/**
 * Get offsets of a range within an element
 * REUSE: Based on code concept found at:
 * http://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container#4812022
 */
HtmlWalker.prototype.offsetsWithinElement = function (node, range) {

    var beforeRange, afterRange, nodeLength, sOffset, eOffset;

    beforeRange = range.cloneRange();
    beforeRange.selectNodeContents(node);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    sOffset = beforeRange.toString().length;

    afterRange = range.cloneRange();
    afterRange.selectNodeContents(node);
    nodeLength = afterRange.toString().length;
    afterRange.setStart(range.endContainer, range.endOffset);
    eOffset = nodeLength - afterRange.toString().length;

    return {
        'start': sOffset,
        'end': eOffset,
    };

};

/**
 * Given a selection, get the text of the selection plus 'edge_size' characters
 * on either side of the original selection.
 */
HtmlWalker.prototype.getContext = function (selection, edge_size) {

    var range = selection.getRangeAt(0);
    var node = this.getEncapsulatingNode(range);
    var parents = [node].concat($(node).parents().toArray());
    var i, par, offsets, start_char, end_char;
    for (i = 0; i < parents.length; i++) {
        par = parents[i];
        offsets = this.offsetsWithinElement(par, range);
        start_char = offsets.start;
        end_char = offsets.end - 1;
        if (start_char >= edge_size && end_char < par.textContent.length - edge_size) {
            return par.textContent.substring(start_char - edge_size, end_char + edge_size + 1);
        }
    }
    return null;

};


module.exports = {
    'HtmlWalker': HtmlWalker,
};
