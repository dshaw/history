#!/usr/bin/env node
/*!
 * history
 * Copyright(c) 2012 Daniel D. Shaw <dshaw@dshaw.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs')
  , exec = require('child_process').exec

/**
 * Configuration
 */

var historyFile = './' + (process.env['HIST_FILENAME'] || 'History.md')
  , underlineChar = process.env['HIST_UNDERLINE'] || '='

/**
 * History
 */

;(function () { // wrapper in case we're in module_context mode

  process.title = 'hist' // set process title

  var args = Array.prototype.splice.call(process.argv, 2)
    , cmd = args.shift()
    , commands = {
        usage: usage
      , '-v': histv
      , version: version
      , view: view
      , write: write
    }

  if (!cmd) cmd = 'usage'
  if (commands[cmd]) return commands[cmd](cb)

  // interactively write new history entry
  args.push(cmd, cb)
  write.apply(null, args)

})()

/**
 * usage
 */

function usage (fn) {
  var usage_ = [
    'usage:'
    , '   hist [command]'
    , ''
    , '   `hist` - prints this usage message'
    , '   `hist version` - current package version'
    , '   `hist {version}` - interactively write History.md entries for a new {version}'
    , '   `hist view` - view History.md'
  ].join('\n')
  if (fn) fn(null, usage_)
  else return usage_
}

/**
 * version
 */

function histv (fn) {
  var histv_ = require('./package.json').version
  if (fn) return fn(null, histv_)
  return histv_
}

/**
 * version
 */

function version (fn) {
  var npm = require(process.cwd() + '/package.json')
    , version_ = npm && npm.version
  if (fn) fn(null, (version_) ? version_ :  'no package.json')
  else return version_
}

/**
 * view
 */

function view (fn) {
  fs.readFile(historyFile, 'utf8', function (err, data) {
    if (err) {
      if (err.code === 'ENOENT') return fn(historyFile + ' does not exist. Type `hist 0.0.1` to start.')
      return fn(err)
    }
    fn(null, data)
  })
}


/**
 * write
 */

function write (version_, date, fn) {
  if (typeof date === 'function') {
    fn = date
    date = undefined
  }

  var historyFile = './History.md'
    , _out = process.stdout
    , _in = process.stdin
    , lastVersion = version()
    , heading = version_ + ' / ' + formattedDate(date)
    , history = [
        ''
      , heading
      , underline(underlineChar, heading.length)
      , ''
      , ''
    ].join('\n')
    , prefix = '  * '
    , prompt = prefix;

  function end () {
    // cheating because npm.commands is a PITA
    exec('npm version ' + version_)

    // prepend to the history file
    fs.readFile(historyFile, 'utf8', function (err, data) {
      if (err) {
        if (err.code === 'ENOENT') data = ''
        else return fn(err)
      }

      fs.writeFile(historyFile, history + data, function (err) {
        if (err) return fn && fn(err)
          // display new history entry
        fn && fn(null, history)
      })
    })
  }

  // setup stdin
  _in.setEncoding('utf8');

  _in.on('data', function (entry) {
    // exit commands
    if (~['\n','.done\n'].indexOf(entry)) {
      _in.pause()
      return end()
    }

    var line = prefix + entry
    history += line
    _in.pause()
    //_out.write(line) - echo
    _out.write(prompt)
    _in.resume()
  });

  _in.on('end', end);

  _out.write('last version: ' + lastVersion + '\n')
  _out.write(history)
  _out.write(prompt)

  // start interactive session
  _in.resume()
}

/**
 * Underline
 */

function underline (char, length) {
  return (new Array(length + 1)).join(char)
}

/**
 * formattedDate
 */

function formattedDate (date) {
  date || (date = new Date);
  function pad (n) { return n < 10 ? '0' + n : n }
  return [date.getUTCFullYear(), pad(date.getUTCMonth()+1), pad(date.getUTCDate())].join('-')
}

/**
 * Callback handler
 */

function cb (err, data) {
  if (err) console.error(err)
  if (data) console.log((typeof data === "string") ? data : JSON.stringify(data))
}
