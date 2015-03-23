'use strict';
 
var gulp = require('gulp');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');
var sass = require('gulp-sass');

gulp.task('default', ['serve'], function () {
});

gulp.task('serve', ['sass', 'browser-sync'], function() {

    gulp.watch("public/styles/scss/*.scss", ['sass']);
    gulp.watch("public/*.html").on('change', reload);
});

gulp.task('sass', function () {
    gulp.src('./public/styles/scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('./public/styles/css/'));
});
 
gulp.task('browser-sync', ['nodemon'], function() {
    browserSync.init(null, {
        proxy: "http://localhost:5000",
        files: ["public/**/*.*"],
        browser: "google chrome",
        port: 7000,
    });
});
 
gulp.task('nodemon', function (cb) {
    return nodemon({
      script: 'index.js'
    }).on('start', function () {
      cb();
  });
});