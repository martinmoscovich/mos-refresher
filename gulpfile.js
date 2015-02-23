var gulp = require('gulp');
var plugins = require("gulp-load-plugins")({lazy:false});
var runSequence = require('run-sequence');

var OUTPUT = "dist/";
var INPUT = "lib/"

gulp.task('default', function(cb) {
	runSequence("clean", ["js:core", "js:bundle", "sass:core", "sass:bundle"], cb);
});

/**
 * Limpia el directorio de output
 */
gulp.task('clean', function() {
  return gulp.src(OUTPUT, { read: false })
    .pipe(plugins.rimraf({ force: true }));
});

gulp.task('js:core', function() {
	return gulp.src(INPUT + "mos-refresher.js")
	.pipe(plumber())
	.pipe(plugins.stripDebug())
	.pipe(plugins.ngAnnotate())
	.pipe(gulp.dest(OUTPUT))
	.pipe(plugins.uglify())
	.pipe(plugins.rename("mos-refresher.min.js"))
	.pipe(gulp.dest(OUTPUT))
});

gulp.task('js:bundle', function() {
	
	return gulp.src([INPUT + "mos-refresher.js", INPUT + "**/*.js"])
	.pipe(plumber())
	.pipe(plugins.concat("mos-refresher.bundle.js"))
	.pipe(plugins.stripDebug())
	.pipe(plugins.ngAnnotate())
	.pipe(gulp.dest(OUTPUT))
	.pipe(plugins.uglify())
	.pipe(plugins.rename("mos-refresher.bundle.min.js"))
	.pipe(gulp.dest(OUTPUT))
});

gulp.task('sass:core', function() {
	return gulp.src(INPUT + 'styles.scss')
	.pipe(plumber())
    .pipe(plugins.sass())
    .pipe(plugins.rename("mos-refresher.css"))
	.pipe(gulp.dest(OUTPUT));
});

gulp.task('sass:bundle', function() {
	return gulp.src([INPUT + 'styles.scss', INPUT + '**/*.scss'])
	.pipe(plumber())
	.pipe(plugins.sass())
	.pipe(plugins.concat("mos-refresher.bundle.css"))
    .pipe(gulp.dest(OUTPUT));
});

/**
 * Funcion que arregla un bug de node al usar pipes
 */
function plumber() {
    return plugins.plumber({errorHandler: function (err) {
            plugins.util.beep();
            console.log(err);
        }
    });
}