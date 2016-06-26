'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    connect = require('gulp-connect');

var paths = {
    build: 'build/',
    html: './index.html',
    js: 'src/**/*.js'
};

gulp.task('html', function () {
    return gulp.src(paths.html)
        // .pipe(htmlReplace({
        //     js: './src/build.js'
        // }))
        .pipe(gulp.dest(paths.build))
        .pipe(connect.reload());
});

gulp.task('js', function () {
    return gulp.src(paths.js)
        .pipe(concat('build.js'))
        .pipe(gulp.dest(paths.build + 'js'))
        .pipe(connect.reload());
});

gulp.task('serve', ['build'], function() {
    connect.server({
        root: paths.build,
        livereload: true
    });
});

gulp.task('watch', ['serve'], function() {
    gulp.watch([paths.html], ['html']);
    gulp.watch([paths.js], ['js']);
});

gulp.task('build', ['html', 'js']);

gulp.task('default', ['build']);

gulp.task('dev', ['watch']);