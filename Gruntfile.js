/*global module:false*/
module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		// Metadata.
		pkg: grunt.file.readJSON('package.json'),
		banner: '',
		/* Uglify JS files and compact them. */
		uglify: {
			'default' : {
				src: ['src/*.js'],
				dest: 'build/imageManipulation.min.js'
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');

};
