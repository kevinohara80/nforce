var gulp    = require('gulp');
var jshint  = require('gulp-jshint');
var stylish = require('jshint-stylish');

var files = {
  js: [
    './*.js',
    './lib/*.js',
    './test/*.js',
    './examples/*.js'
  ]
};

// run jshint tasks across all js files
gulp.task('jshint', function() {
  return gulp.src(files.js)
  .pipe(jshint())
  .pipe(jshint.reporter(stylish));
});

// set up a file watcher and run jshint
gulp.task('watch', function() {
  gulp.watch(files.js, ['default']);
});

// default task
gulp.task('default', ['jshint']);
