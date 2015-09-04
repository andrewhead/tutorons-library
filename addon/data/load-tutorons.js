/*jslint browser: true*/
/*global document, tutorons, self*/

tutorons.fetch(document);
self.port.on('explain-selector', tutorons.explainCurrentSelection);
