Web library for querying tutorons for micro-explanations of code found online.

# Running the addon

## Working with a local Tutorons development server

To set the addon to look to your local Tutorons server, replace the following line in the `addon/data/load-tutorons.js` file:

    var tutoronsConnection = new tutorons.TutoronsConnection(window);

with the lines:

    var tutoronsConnection = new tutorons.TutoronsConnection(window, {
        'endpoints': {
            'wget': 'http://127.0.0.1:8002/wget',
            'css': 'http://127.0.0.1:8002/css',
            'regex': 'http://127.0.0.1:8002/regex',
        },
    });

## Running the addon

    npm run build-xpi && npm run text-xpi

## Deploying to a running (not test) browser

To actually deploy to your running Firefox browser, you can use this command (in conjunction with some other MDN Addon documentation I'll add later:

    function pushext { wget --post-file=$1 http://localhost:8888/; }

