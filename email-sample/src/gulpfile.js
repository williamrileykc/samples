var gulp          = require('gulp'),
    path          = require('path'),
    colorguard    = require('gulp-colorguard'),
    sass          = require('gulp-sass'),
    plumber       = require('gulp-plumber'),
    inlineCss     = require('gulp-inline-css'),// Styles inline
    autoprefixer  = require('gulp-autoprefixer'),
    html2txt      = require('gulp-html2txt'),
    replace       = require('gulp-replace-task'),
    unusedImages  = require('gulp-delete-unused-images'),
    notify        = require('gulp-notify'),
    zip           = require('gulp-zip');

// Gets the name of the current directory's parent using Node.js
var version = path.dirname(process.cwd()).split('/').pop() + '';

/******************/
//Production Tasks
/******************/

//Compile Sass
gulp.task('styles', function() {
    gulp.src('scss/*.scss')
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError))
        .pipe(colorguard())
        .pipe(autoprefixer({
            browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 7', 'ios 8', 'android 4']
        }))
        .pipe(gulp.dest('css/'))
        .pipe(notify({message: 'Styles task complete'}));
});

//Inline the new CSS file into the HTML
gulp.task('inline', function() {
    return gulp.src('*.html')
        .pipe(plumber())
        .pipe(inlineCss({
            applyStyleTags: false,
            applyLinkTags: true,
            removeStyleTags: false,
            removeLinkTags: true,
            preserveMediaQueries: true
        }))
        .pipe(gulp.dest('temp/'))
        .pipe(notify({message: 'Inline task complete'}));
});

// Any weird Word doc characters?
gulp.task('chars', ['inline'], function() {
    gulp.src('temp/*.html')
        .pipe(replace({
            patterns: [
                {
                    match: /“/g,
                    replacement: '"'
                },
                {
                    match: /”/g,
                    replacement: '"'
                },
                {
                    match: /’/g,
                    replacement: "'"
                },
                {
                    match: /‘/g,
                    replacement: "'"
                },
                {
                    match: /–/g,
                    replacement: '&ndash;'
                },
                {
                    match: /—/g,
                    replacement: '&mdash;'
                },
                {
                    match: / & /g,
                    replacement: ' &amp; '
                },
                {
                    match: /©/g,
                    replacement: '&copy;'
                },
                {
                    match: /®/g,
                    replacement: '&reg;'
                },
                {
                    match: /é/g,
                    replacement: '&eacute;'
                },
                {
                    match: //g,
                    replacement: ' '
                }
                // {
                //     match: //g,
                //     replacement: ''
                // }
            ]
        }))
        .pipe(gulp.dest('temp/'));
});

// Use to map vars with a url. Don't forget to prefix vars with @@ in HTML
// Highlight the variables object below and use this regex in sublime to highlight all of the old links to delete easily: (?<=: ')[a-z0-9;.:=/?%&\[_\]+!-]*
gulp.task('href', ['images:path'], function() {
    gulp.src('temp/index.html')
        .pipe(replace({
            variables: {
                'logo': 'https://www.gotobermuda.co.uk/',
                'hero': 'https://www.gotobermuda.co.uk/splash-sale',
                'button': 'https://www.gotobermuda.co.uk/splash-sale',
                'tracking': '#',
                'arrivalist': '#'
            }
        }))
        .pipe(gulp.dest(`../${version}`))
        .pipe(notify({message: 'Links added to HTML for stage.'}));
});


// Converts the HTML eMail into a text version
gulp.task('txt', function(){
  gulp.src('temp/*.html')
    .pipe(html2txt(150)) // optional wordwrap value. 
    .pipe(gulp.dest('text'))
    .pipe(notify({message: 'Text version created'}));
});


// Any images here that should be?
gulp.task('images:unused', function(){
  gulp.src(['images/*', 'css/*.css', 'index.html'])
    .pipe(plumber())
    .pipe(unusedImages({
        log: true,
        delete: false // to be safe first go
    }))
    .pipe(plumber.stop())
    .pipe(notify({message: 'Unused images listed in console'}));
});

// Copy image folder to stage folder
gulp.task('images:copy', function() {
    gulp.src('images/**/*')
        .pipe(gulp.dest(`../${version}/images`))
        .pipe(notify({message: 'Image copied to stage folder'}));
});

// Change relative image URLs and paste result in collection folder with images
gulp.task('images:path', function() {
    gulp.src(`../${version}/*.html`)
        .pipe(replace({
            usePrefix: false,
            patterns: [{
                match: '../images',
                replacement: 'images'
            }]
        }))
        .pipe(gulp.dest('../' + version));
});

// Zip everything up
gulp.task('zip', function() {
    gulp.src(`../${version}`)
        .pipe(zip(version + '.zip'))
        .pipe(gulp.dest('../'));
});

//Creates a default task to run sass, inline (and chars), and watch tasks with one command
gulp.task('default', function() {
    gulp.start('styles', 'chars', 'watch');
});

//Create watch task
gulp.task('watch', function() {
    gulp.watch(['scss/*.scss', '*.html'], ['styles', 'chars']);
});
