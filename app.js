const express = require('express'); //express is a web application framework for node
const app = express(); //this creates an instance of an express application, which can then be used to set up the server and configure its behavior
const port = 3000; //will be used to specify which port the express app should listen to for incoming connections
const fs = require('fs'); //allows us to work with the file system on our device, for example for reading and writing files
const path = require('path'); //allows us to work with file paths across different operating systems in a consistent and easy manner
app.set('view engine', 'ejs'); //configures our express app to use EJS as its view engine. Express will then know to look for EJS files in our views directory.
app.use(express.static('public')); //tells express to serve static files from the public directory
app.use(express.urlencoded({extended: true})); //tells express to parse incoming requests with urlencoded payloads
let fontCategories = {};



let fontsDir = path.join(__dirname, 'public/fonts'); //creates a path to the fonts directory

console.log("fontsDir: ", fontsDir);

app.set('views', path.join(__dirname, 'views')); //tells express to look in the views directory for views

//define a default route for the index
app.get('/', (req, res) => {
    const fontFiles = readFontsRecursively(fontsDir).map(file => path.relative(fontsDir, file)); //calls the readFontsRecursively function and passes in the fonts directory

    let uniqueCategories = new Set(); //creates a new set to hold the unique categories. A set is a collection of unique values.

    Object.values(fontCategories).forEach(categories => {
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
            fontCategories

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
    const newDir = req.body.changedFontsDir; //get the new directory from the request body sent by the form in index.ejs
    fontsDir = newDir; //set the fonts directory to the new directory
    res.redirect('/'); //redirect to the index page
});

//route for categorizing fonts
app.post('/categorize-fonts', (req, res) => {
    let selectedFonts = req.body.selectedFonts; //get the selected fonts from the request body sent by the form in index.ejs
    const newCategory = req.body.categoryInput; //get the new category from the request body sent by the form in index.ejs

    //ensure selectedFonts is always treated as an array
    if (typeof selectedFonts ==='string'){
        selectedFonts = [selectedFonts];
    }

    

    selectedFonts.forEach(font => {
        if (!fontCategories[font]){
            fontCategories[font] = [newCategory];
        } else if (!fontCategories[font].includes(newCategory)){
            fontCategories[font].push(newCategory);
        }
    });

    console.log("fontCategories: ", fontCategories);

    res.redirect('/');

})

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

//start the server
app.listen(port, ()=>{
    console.log('Font Manager is now running and can be accessed through any browser at http://localhost:' + port);
})