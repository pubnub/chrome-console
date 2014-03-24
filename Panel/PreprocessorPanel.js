(function() {

  var rendered_channels = {},
    library = {},
    auto_scroll = {},
    subscribe_key = null;


  library = {
    pad: function(n) { return ("0" + n).slice(-2); },
    json: {
      replacer: function(match, pIndent, pKey, pVal, pEnd) {
        var key = '<span class=json-key>';
        var val = '<span class=json-value>';
        var str = '<span class=json-string>';
        var r = pIndent || '';
        if (pKey)
           r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
        if (pVal)
           r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
        return r + (pEnd || '');
      },
      prettyPrint: function(obj) {
        var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
        return JSON.stringify(obj, null, 2)
         .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
         .replace(/</g, '&lt;').replace(/>/g, '&gt;')
         .replace(jsonLine, library.json.replacer);
      }
    }
  };

  function scrollWatch(channel) {

    var div = document.querySelector('.console[data-channel="' + channel + '"] .lines');

    div.onscroll = function() {

      if(((div.scrollHeight - 30) < (div.scrollTop + div.offsetHeight))) {
        rendered_channels[channel].auto_scroll = true;
      } else {
        rendered_channels[channel].auto_scroll = false;
      }

    };

  }

  function autoScroll(channel) {

    var div = document.querySelector('.console[data-channel="' + channel + '"] .lines');

    if(rendered_channels[channel].auto_scroll) {
      div.scrollTop = div.scrollHeight;
    }

  }

  function render(channel_, message, timestamp, type) {

    console.log('type ' + type + ' and timestamp ' + timestamp);

    if(typeof message !== "undefined") {

     var
        date = new Date(timestamp / 1000),
        channel = escape(channel_),
        $new_line = document.createElement('li'),
        $channels = document.querySelector('#channels'),
        $consoles = document.querySelector('#consoles'),
        $new_channel = null
        $new_console = null,
        $the_console = null,
        $load_history = null,
        $clear_lines = null,
        $filter = null,
        $notes = null;

      if (typeof rendered_channels[channel] == 'undefined') {

        // create new console for output
        $new_console = document.createElement('ul');
        $new_console.classList.add('lines');

        // create new div for tools
        $tools = document.createElement('div');
        $tools.classList.add('tools');

        // clear output tool
        $clear_lines = document.createElement('div');
        $clear_lines.classList.add('tool');
        $clear_lines.innerHTML = "&Oslash; Clear Output";

        $tools.appendChild($clear_lines);

        $clear_lines.addEventListener('click', function(e) {
          document.querySelector('.console[data-channel="' + channel + '"] .lines').innerHTML = "";
          rendered_channels[channel].last_timestamp = new Date().getTime() * 10000;
          console.log(rendered_channels[channel].last_timestamp)
        });

        // load history tool
        $load_history = document.createElement('div');
        $load_history.classList.add('tool');
        $load_history.innerHTML = "&#9650; Previous 2 Minutes";

        $tools.appendChild($load_history);

        $load_history.addEventListener('click', function(e) {
          load_history(channel);
        });

        // filter tool
        $filter = document.createElement("select");
        $filter.innerHTML = '<option value="0">All Messages</option><option value="1">Only Subscribe</option><option value="2">Only Publish</option>';

        $filter.classList.add('tool');
        $tools.appendChild($filter);

        // wrapper for console
        $new_console_wrapper = document.createElement('div');
        $new_console_wrapper.classList.add('console');
        $new_console_wrapper.classList.add('hide');
        $new_console_wrapper.dataset.channel = channel;

        $new_console_wrapper.appendChild($tools);
        $new_console_wrapper.appendChild($new_console);

        // new entry in channels pane
        $new_channel = document.createElement('li');
        $new_channel.textContent = channel_;
        $new_channel.dataset.channel = channel;
        $new_channel.classList.add('channel');

        $new_channel.addEventListener('click', function() {
         changePage(channel);
        }, false);

        $channels.appendChild($new_channel);
        $consoles.appendChild($new_console_wrapper);

        if(document.querySelectorAll('#channels .channel').length == 1) {
         changePage(channel);
        }

        // set property for channels data
        rendered_channels[channel] = {
          auto_scroll: true,
          last_timestamp: timestamp
        };

        // bind events
        scrollWatch(channel);
        resizeLines();

      }

      $notes = document.createElement('div');
      $notes.classList.add('notes');

      $the_console = document.querySelector('.console[data-channel="' + channel + '"] .lines');
      $new_line.innerHTML = library.json.prettyPrint(message);
      $new_line.appendChild($notes);

      if(type == 3) {

        $notes.classList.add('history');
        $the_console.insertBefore($new_line, $the_console.firstChild);

      } else {

        if(type == 1) {
         $notes.classList.add('publish');
        } else {
         $notes.classList.add('subscribe');
        }
        $notes.innerHTML = library.pad(date.getHours()) + ':' + library.pad(date.getMinutes()) + ':' + library.pad(date.getSeconds());

        $the_console.appendChild($new_line);

      }

      autoScroll(channel);

    }

  }

  function changePage(channel) {

    var $consoles = document.querySelectorAll('.console'),
      $the_console = document.querySelector('.console[data-channel="' + channel + '"]'),
      $channels = document.querySelectorAll('.channel'),
      $the_channel = document.querySelector('.channel[data-channel="' + channel +'"]');

    [].forEach.call($consoles, function(el) {
      el.classList.remove('show');
      el.classList.add('hide');
    });

    [].forEach.call($channels, function(el) {
      el.classList.remove('active');
    });

    $the_console.classList.remove('hide');
    $the_console.classList.add('show');

    $the_channel.classList.add('active');

  }

  function load_history(channel) {

    console.log('loading history from ' + rendered_channels[channel].last_timestamp);

    var since_when = rendered_channels[channel].last_timestamp - (120 * 10000000);

    pubnub.history({
      channel: channel,
      start: since_when,
      end: rendered_channels[channel].last_timestamp,
      callback: function(history){

        console.log('somehow channel has been set to ' + channel)

        history[0].reverse();

        if(!history[0].length) {

          alert('No history for this channel.');

        } else {

          for(var i = 0; i < history[0].length; i++) {
            render(decodeURIComponent(channel), history[0][i], history[1], 3);
          }

          // scroll to top
          rendered_channels[channel].auto_scroll = false;
          rendered_channels[channel].last_timestamp = since_when;
          document.querySelector('.console[data-channel="' + channel + '"] .lines').scrollTop = 0;

        }

      },
    });

  }

  function bindRequest() {

    chrome.devtools.network.onRequestFinished.addListener(function(request) {

      var parser = document.createElement('a'),
        params = null,
        channel = null,
        message = null,
        channels = [],
        i = 0;

      parser.href = request.request.url;

      if(parser.hostname.split('.')[1] == "pubnub") {

        params = parser.pathname.split('/');

        if(params[1] == "publish") {

          channel = decodeURIComponent(params[5]);

          message = JSON.parse(decodeURIComponent(params[7]));

          render(channel, message, (new Date().getTime() * 10000), 1);

        }

        if(params[1] == "subscribe") {

          if(!subscribe_key) {

            subscribe_key = params[2];

            pubnub = PUBNUB.init({
              subscribe_key: subscribe_key,
            });

          }

          request.getContent(function(body){

              parsed = JSON.parse(body);

              if(parsed) {

                if(typeof parsed[2] !== "undefined") {

                  // bundle
                  channels = parsed[2].split(',');

                  for(var i = 0; i < parsed[0].length; i++) {
                    render(channels[i], parsed[0][i], (new Date().getTime() * 10000), 2);
                  }

                } else {

                  // single
                  channel = params[3];

                  if(typeof parsed !== "undefined") {
                    message = parsed[0][0];
                  }

                  render(channel, message, (new Date().getTime() * 10000), 2);

                }

              } else {
                console.log('parsed fail on message')
                console.log(body)
              }

            });

        }

      }

    });

  }

  function resizeLines() {

    var $lines = document.querySelectorAll('.lines'),
      new_height = (window.innerHeight - 30);

    [].forEach.call($lines, function(el) {
      el.style.height = new_height;
    });

  }

  function start() {

    bindRequest();
    resizeLines();

    window.onresize = resizeLines;

  }

  start();

})();
