/*jslint browser: true*/
/*global document, tutorons, self*/

tutorons.fetch(document);
window.tutorons = tutorons;
self.port.on('explain-selector', tutorons.explainCurrentSelection);
