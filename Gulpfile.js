var gulp = require('gulp');

var concat = require('gulp-concat');
var gutil = require('gulp-util');
var replace = require('gulp-replace');
var sync = require('gulp-directory-sync');
var uglyfly = require('gulp-uglyfly');

var curDate = new Date();

gulp.task('default', ['demo:sync']);

gulp.task('scripts:build', function () {
    return gulp.src('./src/js-tasker.js')
        .pipe(concat('js-tasker.js'))
        .pipe(gulp.dest('./dist'))
        .pipe(uglyfly())
        .pipe(replace(/\n/g, ''))
        .pipe(replace(/^!f/, ['/*! Build Date:', curDate.toTimeString(), curDate.toDateString(), 'File Name:', 'js-tasker.js', '*/\n'].join(' ') + '!f'))
        .pipe(concat('js-tasker.min.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('demo:sync', ['scripts:build'], function () {
    gulp.src('').pipe(sync('./dist', 'demo/assets/js', {printSummary : true})).on('error', gutil.log);
    return gulp.src('./src/demo.js').pipe(gulp.dest('./demo/assets/js'));
});