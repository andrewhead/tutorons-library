var data = require('sdk/self').data;
var tabs = require('sdk/tabs');
var pageMod = require('sdk/page-mod');
var ToggleButton = require('sdk/ui/button/toggle').ToggleButton;
var cm = require('sdk/context-menu');


/* Modifier to query tutorons for all pages */
var tutMod;
var workers = [];

// REUSE: https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/page-mod
function removeWorker(worker, workers) {
    console.log("Removing worker: " + worker.url);
    var index = workers.indexOf(worker);
    if (index !== -1) {
        workers.splice(index, -1);
    }
}

function enableTutorons(enable) {
    if (enable === true) {
        tutMod = pageMod.PageMod({
            include: '*',
            contentScriptFile: [
                data.url('tutorons-library.js'),
                data.url('load-tutorons.js')
            ],
            attachTo: ['existing', 'top'],
            onAttach: function(worker) {
                workers.push(worker);
                console.log("Adding worker: " + worker.url);
                worker.on('detach', function () {
                    removeWorker(this, workers);
                });
            }
        });
    } else {
        if (tutMod !== undefined) {
            tutMod.destroy();
            workers.forEach(function (w) {
                w.destroy();
            });
        }
        workers = [];
    }
}


/* Button for enabling and disabling Tutorons */
var button = ToggleButton({
    id: 'tutorons-button',
    label: 'tutorons button',
    icon: {
        '32': data.url('./icon32.png')
    },
    onChange: function(state) {
        enableTutorons(state.checked);
    }
});


/* Context menu for automatically querying Tutorons */
cm.Menu({
    label: "Tutorons",
    context: cm.SelectionContext(),
    contentScript: 'self.on("click", function (node, tutoron) {' +
                   '     self.postMessage(tutoron);' +
                   '});',
    onMessage: function(tutoron) {
        workers.forEach(function(w) {
            if (w.tab === tabs.activeTab) {
                try {
                    w.port.emit('explain-selector', tutoron);
                } catch (e) {
                    console.error("Zombie worker thread (" + w.url + ").  Now removing.");
                    removeWorker(w, workers);
                }
            }
        });
    },
    items: [
        cm.Item({ label: "Explain as wget", data: "wget" }),
        cm.Item({ label: "Explain as CSS selector", data: "css" }),
        cm.Item({ label: "Explain as regular expression", data: "regex" }),
        cm.Item({ label: "Explain as Python built-in", data: "python" }),
    ]
});
