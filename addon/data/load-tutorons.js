/*jslint browser: true*/
/*global document, tutorons, self*/

var tutoronsConnection = new tutorons.TutoronsConnection(window, {
    'endpoints': {
        'wget': 'http://127.0.0.1:8002/wget',
        'css': 'http://127.0.0.1:8002/css',
        'regex': 'http://127.0.0.1:8002/regex',
        'python': 'http://127.0.0.1:8002/python',
    },
});

tutoronsConnection.scanDom();

self.port.on('explain-selector', function (tutoron) {
    var selection = window.getSelection();
    tutoronsConnection.explainSelection(tutoron, selection);
});
