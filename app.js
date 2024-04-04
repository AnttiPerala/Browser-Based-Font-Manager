const express = require('express'); //express is a web application framework for node
const app = express(); //this creates an instance of an express application, which can then be used to set up the server and configure its behavior
const port = 3000; //will be used to specify which port the express app should listen to for incoming connections
const fs = require('fs'); //allows us to work with the file system on our device, for example for reading and writing files
const path = require('path'); //allows us to work with file paths across different operating systems in a consistent and easy manner
app.set('view engine', 'ejs'); //configures our express app to use EJS as its view engine. Express will then know to look for EJS files in our views directory.
app.use(express.static('public')); //tells express to serve static files from the public directory
app.use(express.urlencoded({extended: true})); //tells express to parse incoming requests with urlencoded payloads

let fontsDir = path.join(__dirname, 'public/fonts'); //creates a path to the fonts directory

//define a default route for the index
app.get('/', (req, res) => {
    fs.readdir(fontsDir, (err, files) => {
        if (err) {
            console.error('Could not list the directory', err);
            res.status(500).send('Server error while reading fonts directory');
            return;
        }

        const fontFiles = files.filter(file => file.endsWith('.ttf') || file.endsWith('.otf') || file.endsWith('.woff') || file.endsWith('.woff2')); //filter the files array to only include the font files

        res.render('index', {
            fontsDir: fontsDir,
            fonts: fontFiles
        })
    })

});

/* define a route to handle POST requests to /change-font-dir */

app.post('/change-font-dir', (req, res) => {
    const newDir = req.body.fontsDir; //get the new directory from the request body sent by the form in index.ejs
    fontsDir = newDir; //set the fonts directory to the new directory
    res.redirect('/'); //redirect to the index page
});

/* server font files over HTTP(S) because FILE:/// protocol is not allowed */

app.get('/font/*', (req, res) => {
    const fontPath = decodeURIComponent(req.params[0]);
    const fullPath = path.join(fontsDir, fontPath);
    res.sendFile(fullPath, (err) => {
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

//start the server
app.listen(port, ()=>{
    console.log('Font Manager is now running and can be accessed throug any browser at http://localhost:' + port);
})