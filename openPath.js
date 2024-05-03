// openPath.js
const { exec } = require('child_process');

function openPath(path) {
    let command;
    switch (process.platform) {
        case 'win32':
            command = `start "" "${path}"`; // Ensures the command works even if the path contains spaces
            break;
        case 'darwin':
            command = `open "${path}"`;
            break;
        case 'linux':
            command = `xdg-open "${path}"`;
            break;
        default:
            throw new Error('Unsupported platform: ' + process.platform);
    }

    exec(command, (error) => {
        if (error) {
            console.error('Failed to open path:', error);
        } else {
            console.log('Successfully opened:', path);
        }
    });
}

module.exports = openPath;
