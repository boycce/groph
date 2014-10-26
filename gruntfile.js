module.exports = function(grunt) {

  var banner = [
    "/*",
    "    <%= pkg.name %> <%= pkg.version %>",
    "",
    "    (c) 2014 <%= pkg.author %>.",
    "    <%= pkg.name %> may be freely distributed under the MIT license.",
    "    For all details and documentation: <%= pkg.homepage %>",
    "",
    "*/"
  ].join('\n');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    uglify: {
      main: {
        options: {
          banner: banner
        },
        files: {
          'groph.min.js' : 'groph.js'
        }
      }
    }
  });

  // Load modules.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Build
  grunt.registerTask('default', [
    'uglify'
  ]);
};