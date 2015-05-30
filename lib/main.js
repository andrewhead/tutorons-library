var data = require('sdk/self').data;
var tabs = require('sdk/tabs');
var pageMod = require('sdk/page-mod');
var ToggleButton = require('sdk/ui/button/toggle').ToggleButton;


/* Modifier to query tutorons for all pages */
var tutMod;
var workers = [];
function enableTutorons(enable) {
    if (enable === true) {
        tutMod = pageMod.PageMod({
            include: '*',
            contentScriptFile: [
                data.url('jquery-2.1.3.min.js'),
                data.url('jquery-ui-1.11.4.min.js'),
                data.url('explain.js')
            ],
            attachTo: ['existing', 'top'],
            onAttach: function(worker) {
                workers.push(worker);
            }
        });
    } else {
        if (tutMod !== undefined) {
            tutMod.destroy();
            var i = 0;
            for (i = 0; i < workers.length; i++) {
                workers[i].destroy();
            }
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
