/*jslint browser: true*/
/*global document, tutorons, self*/

var tutoronsConnection = new tutorons.TutoronsConnection(window);

tutoronsConnection.scanDom();

self.port.on('explain-selector', function (tutoron) {
    var selection = window.getSelection();
    tutoronsConnection.explainSelection(tutoron, selection);
});
