const express = require('express'); //express is a web application framework for node
const app = express(); //this creates an instance of an express application, which can then be used to set up the server and configure its behavior
const port = 3000; //will be used to specify which port the express app should listen to for incoming connections
const fs = require('fs'); //allows us to work with the file system on our device, for example for reading and writing files
const opn = require('opn');//allows us to open folders
const path = require('path'); //allows us to work with file paths across different operating systems in a consistent and easy manner
app.set('view engine', 'ejs'); //configures our express app to use EJS as its view engine. Express will then know to look for EJS files in our views directory.
app.use(express.static('public')); //tells express to serve static files from the public directory
app.use(express.urlencoded({extended: true})); //tells express to parse incoming requests with urlencoded payloads
let fontCategories = {};

// Check if the app is running in a development environment or as a packaged app
const isPackaged = process.mainModule.filename.indexOf('app.asar') !== -1 || process.execPath.indexOf('node') === -1;

// Set the path based on whether the app is packaged
const basePath = isPackaged ? path.dirname(process.execPath) : path.join(__dirname);

// Default fonts directory
const defaultFontsDir = path.join(__dirname, 'public/fonts');

// Define the path for the settings file
const configFilePath = path.join(basePath, 'settings.json');

// Example configuration structure
let appConfig = {
    fontDirectory: '',
    fontCategories: {}
};

//load settings from file

function loadConfig() {
    try {
        console.log("Attempting to load configuration from:", configFilePath); // Log the path
        if (fs.existsSync(configFilePath)) {
            const data = fs.readFileSync(configFilePath, 'utf8');
            Object.assign(appConfig, JSON.parse(data));
            console.log("Loaded configuration:", appConfig); // Log the loaded configuration
            
            // Ensure fontCategories is initialized as an empty object
            appConfig.fontCategories = appConfig.fontCategories || {};

            console.log("Loaded font categories:", appConfig.fontCategories); // Log the loaded font categories
        } else {
            console.log("Configuration file does not exist:", configFilePath); // Log if file doesn't exist
        }
    } catch (err) {
        console.error('Failed to load configuration:', err);
    }
}


//save configuration

function saveConfig(data) {
    try {
        const jsonData = JSON.stringify(data, null, 4);
        fs.writeFileSync(configFilePath, jsonData, 'utf8');
        console.log('Configuration saved to', configFilePath);
    } catch (err) {
        console.error('Failed to save configuration:', err);
    }
}


// Load the configuration at the start of the application
loadConfig();

// Update fontsDir based on the loaded configuration
if (appConfig.fontDirectory && fs.existsSync(appConfig.fontDirectory)) {
    fontsDir = appConfig.fontDirectory;
    console.log("Using configured fontsDir:", fontsDir);
} else {
    fontsDir = defaultFontsDir;
    console.log("Configured fontsDir not found, using default:", fontsDir);
}

console.log("fontsDir: ", fontsDir);

console.log("fontsDir: ", fontsDir);

app.set('views', path.join(__dirname, 'views')); //tells express to look in the views directory for views

//define a default route for the index
app.get('/', (req, res) => {
    const fontFiles = readFontsRecursively(fontsDir).map(file => path.relative(fontsDir, file)); //calls the readFontsRecursively function and passes in the fonts directory

    let uniqueCategories = new Set(); //creates a new set to hold the unique categories. A set is a collection of unique values.

    Object.values(appConfig.fontCategories).forEach(categories => {
        categories.forEach(category => {
            uniqueCategories.add(category); //adds the category to the set
        });
    }) //loops through all the font categories

    uniqueCategories = Array.from(uniqueCategories); //converts the set to an array

    console.log("uniqueCategories: ", uniqueCategories);

        res.render('index', { //render the index page with the fonts directory and the font files
            fontsDir: fontsDir,
            fonts: fontFiles,
            categories: uniqueCategories,
            fontCategories: appConfig.fontCategories,
            path: path // Pass the 'path' module here
        })
    });


//recursive search (means it can also look into subfolders to get fonts)
function readFontsRecursively(dir, fileList = []){
    const files = fs.readdirSync(dir);
    files.forEach(file =>{
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            readFontsRecursively(filePath, fileList);
        } else if (filePath.endsWith('.ttf') || filePath.endsWith('.otf') || filePath.endsWith('.woff') || filePath.endsWith('.woff2')) {
            fileList.push(filePath);
        }
    })

    return fileList;
}

/* define a route to handle POST requests to /change-font-dir */

app.post('/change-font-dir', (req, res) => {
    const newDir = req.body.changedFontsDir; // Get the new directory from the request body
    if (fs.existsSync(newDir)) {
        fontsDir = newDir; // Set the fonts directory to the new directory
        appConfig.fontDirectory = newDir; // Update the font directory in the config
        console.log("Changed fontsDir to:", fontsDir);
    } else {
        console.log("Provided fontsDir does not exist, retaining old:", fontsDir);
    }
    saveConfig(appConfig); // Save the updated configuration
    res.redirect('/'); // Redirect to the index page
});


//route for categorizing fonts
app.post('/categorize-fonts', (req, res) => {
    let selectedFonts = req.body.selectedFonts;
    const newCategory = req.body.categoryInput;
    if (typeof selectedFonts === 'string') {
        selectedFonts = [selectedFonts];
    }

    selectedFonts.forEach(font => {
        if (!appConfig.fontCategories[font]) {
            appConfig.fontCategories[font] = [newCategory];
        } else if (!appConfig.fontCategories[font].includes(newCategory)) {
            appConfig.fontCategories[font].push(newCategory);
        }
    });

    saveConfig(appConfig); // Save the updated configuration
    res.redirect('/');
});

/* server font files over HTTP(S) because FILE:/// protocol is not allowed */

app.get('/font/*', (req, res) => {
    const fontPath = decodeURIComponent(req.params[0]); //get the font path from the request params
    const fullPath = path.join(fontsDir, fontPath);
    res.sendFile(fullPath, (err) => { //send the font file at the specified path
        if (err) {
             
            if (!res.headersSent) { // Check if headers have not been sent yet
                console.log(err);
                res.status(404).send('Font not found');
            } else {
                console.error('Attempted to send a 404 after headers were already sent.');
            }
        }
    });
});

app.get('/open-fonts-dir', (req, res) => {
    // Open the fontsDir when this route is accessed
    console.log("fontsDir: ", fontsDir);
    opn(fontsDir + '').then(() => {
        console.log('Opened fonts directory');
        // Here, you might want to render a different template or send a response back to the client indicating that the fonts directory has been opened.
        res.send('Opened fonts directory');
    }).catch(err => {
        console.error('Error opening fonts directory:', err);
        res.status(500).send('Failed to open fonts directory');
    });
});



//start the server
app.listen(port, ()=>{
    console.log('Font Manager is now running and can be accessed through any browser at http://localhost:' + port);
})