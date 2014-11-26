'use strict';
module.exports = function(grunt) {

  // ----------------------------------------------------------
  // WARNING, BRAVE DEVELOPER
  // ----------------------------------------------------------
  // Webhook allows you to use local grunt tasks and files.
  // However, these tasks are ONLY RUN LOCALLY and not when
  // your live site needs to be rebuilt. This means you should
  // only use grunt for pre-processing tasks like building
  // Sass, less or coffescript files, not for reading things
  // from your templates and making dynamic changes during
  // the build process. Doing so will cause your live site
  // not to regerate.
  //
  // You have been warned!
  grunt.initConfig({
    // BUILD LESS TO CSS
    less: {
      dev: {
        options: {
          // Uncomment the below line to include outside directories as well.
          //paths: ['/static/startup/**/*.less']
        },
        files: [{
          // Files in the /less/ directory will go to /static/css/ when processed.
          expand: true,
          cwd: 'static/less/',
          src: ['*.less'],
          dest: 'static/css/',
          ext: '.css'
        }]
      }
    },
    // WHEN FILES CHANGE, RUN THE ABOVE TASKS ALONG WITH BUILD
    watch: {
      less: {
        files: ['static/less/*.less'],
        tasks: ['less', 'build']
      }
    }
  });

  // THIS LOADS THE TASKS WE NEED ABOVE IN FROM OUR NPM
  // Note, that we need to have these installed through the package.json file as well
  grunt.loadNpmTasks('grunt-contrib-less');

  // NEVER REMOVE THESE LINES, OR ELSE YOUR PROJECT MAY NOT WORK
  require('./options/generatorOptions.js')(grunt);
  grunt.loadTasks('tasks');
};