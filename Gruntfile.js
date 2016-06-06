module.exports = function (grunt) {
  var _pkg = grunt.file.readJSON('package.json');

  grunt.initConfig({
    pkg: _pkg,
    uglify: {
      options: {
        mangle: false
      },
      js: {
          files: {
              'dist/ng-d3tree.min.js': ['src/ng-d3tree.js']
          }
      }
    },
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      target: {
        files: {
            'dist/css/ng-d3tree.min.css' : ['src/css/ng-d3tree.css']
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.registerTask('default', ['cssmin', 'uglify']);
}
