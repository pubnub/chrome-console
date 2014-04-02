(function() {

  var rendered_channels = {},
    library = {},
    auto_scroll = {},
    subscribe_key = null;

  var library = {
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

    var $div = $('.console[data-channel="' + channel + '"] .lines');

    $div.scroll(function() {

      if((($div.prop('scrollHeight') - 30) < ($div.scrollTop() + $div.height()))) {
        rendered_channels[channel].auto_scroll = true;
      } else {
        rendered_channels[channel].auto_scroll = false;
      }

    });

  }

  function autoScroll(channel) {

    var $div = $('.console[data-channel="' + channel + '"] .lines');

    if(rendered_channels[channel].auto_scroll) {
      $div.prop('scrollTop', $div.prop('scrollHeight'));
    }

  }

  function render(channel_, message, timestamp, type) {

    // console.log('type ' + type + ' and timestamp ' + timestamp);

    if(typeof message !== "undefined") {

     var
        date = new Date(timestamp / 1000),
        channel = escape(channel_),
        $new_line = $('<li></li>'),
        $channels = $('#channels'),
        $consoles = $('#consoles'),
        $new_channel = null
        $new_console = null,
        $the_console = null,
        $load_history = null,
        $clear_lines = null,
        $filter = null,
        $notes = null;

      if (typeof rendered_channels[channel] == 'undefined') {

        // create new console for output
        $new_console = $('<ul class="lines"></ul>');

        // create new div for tools
        $tools = $('<div class="tools"><a href="http://pubunb.com/" class="logo" target="_blank"><img src="http://www.pubnub.com/static/images/structure/pubnub.png"/></a></div>');

        // wrapper for console
        $new_console_wrapper = $('<div class="console hide" data-channel="' + channel + '"></div>');
        $new_console_wrapper.append($tools);
        $new_console_wrapper.append($new_console);

        // new entry in channels pane
        $new_channel = $('<li class="channel" data-channel="' + channel + '">' + channel_ + '<div class="sparky"></div></li>');
        $channels.append($new_channel);

        $new_channel.click(function() {
          changePage(channel);
          return false;
        });

        $consoles.append($new_console_wrapper);

        // clear output tool
        $clear_lines = $('<a class="tool" href="#">&Oslash; Clear</a>');
        $tools.append($clear_lines);

        $clear_lines.click(function(e) {
          $('.console[data-channel="' + channel + '"] .lines').html('');
          rendered_channels[channel].last_timestamp = new Date().getTime() * 10000;
          return false;
        });

        // load history tool
        $load_history = $('<a class="tool" href="#">&#9650; Previous 2 Minutes</a>');
        $tools.append($load_history);

        $load_history.click(function(e) {
          load_history(channel);
          return false;
        });

        // filter tool
        $filter = $('<select class="tool filter"> \
          <option value="0">All Messages</option> \
          <option value="1">Only Subscribe</option> \
          <option value="2">Only Publish</option> \
        </select>');

        $tools.append($filter);

        $filter.on('change', function() {

          $new_console_wrapper.find('li').each(function(i, el) {
            $(el).removeClass('hide');
          });

          if(this.value == 1) {
            $new_console_wrapper.find('.publish').each(function(i, el) {
              $(el).addClass('hide');
            });
          }
          if(this.value == 2) {
            $new_console_wrapper.find('.subscribe').each(function(i, el) {
              $(el).addClass('hide');
            });
          }

        });

        if($('#channels .channel').length == 1) {
         changePage(channel);
        }

        // set property for channels data
        rendered_channels[channel] = {
          auto_scroll: true,
          last_timestamp: timestamp,
          messages: [],
          messages_over_time: []
        };

        // bind events
        scrollWatch(channel);
        resizeLines();

      }

      $notes = $('<div></div>');
      $notes.addClass('notes');

      $the_console_wrapper = $('.console[data-channel="' + channel + '"]');
      $the_console = $($the_console_wrapper.find('.lines')[0]);
      $new_line.html(library.json.prettyPrint(message));
      $new_line.append($notes);

      if(type == 3) {

        $new_line.addClass('history');
        $the_console.prepend($new_line);

      } else {

        if(typeof rendered_channels[channel].messages[type] == "undefined") {
          rendered_channels[channel].messages[type] = 0;
        }

        rendered_channels[channel].messages[type] = rendered_channels[channel].messages[type] + 1;

        if(type == 2) {

          $new_line.addClass('publish');

          if($the_console_wrapper.find('.tool.filter')[0].value == 1) {
            $new_line.classList.add('hide');
          }

        } else {

         $new_line.addClass('subscribe');

          if($the_console_wrapper.find('.tool.filter')[0].value == 2) {
            $new_line.classList.add('hide');
          }

        }

        $notes.html(library.pad(date.getHours()) + ':' + library.pad(date.getMinutes()) + ':' + library.pad(date.getSeconds()));

        $the_console.append($new_line);

      }

      autoScroll(channel);

    }

  }

  function changePage(channel) {

    var $consoles = $('.console'),
      $the_console = $('.console[data-channel="' + channel + '"]'),
      $channels = $('.channel'),
      $the_channel = $('.channel[data-channel="' + channel +'"]');

    $consoles.each(function(i, el) {
      $(el).removeClass('show');
      $(el).addClass('hide');
    });

    $channels.each(function(i, el) {
      $(el).removeClass('active');
    });

    $the_console.removeClass('hide');
    $the_console.addClass('show');

    $the_channel.addClass('active');

  }

  function load_history(channel) {

    console.log('loading history from ' + rendered_channels[channel].last_timestamp);

    var since_when = rendered_channels[channel].last_timestamp - (120 * 10000000);

    pubnub.history({
      channel: channel,
      start: since_when,
      end: rendered_channels[channel].last_timestamp,
      callback: function(history){

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
          $('.console[data-channel="' + channel + '"] .lines').prop('scrollTop', 0);

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

          render(channel, message, (new Date().getTime() * 10000), 2);

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
                    render(channels[i], parsed[0][i], (new Date().getTime() * 10000), 1);
                  }

                } else {

                  console.log(parsed);

                  if(parsed.error) {
                    render(parsed.payload.channels[0], parsed.service + ': ' + parsed.message, (new Date().getTime() * 10000), 1);
                  } else {

                    // single
                    channel = params[3];

                    if(typeof parsed !== "undefined") {
                      message = parsed[0][0];
                    }

                    render(channel, message, (new Date().getTime() * 10000), 1);

                  }

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

    var $lines = $('.lines'),
      new_height = ($(window).height() - 25);

    $lines.each(function(i, el) {
      $(el).height(new_height);
      console.log($(el).height());
    });

  }

  function start() {

    bindRequest();
    resizeLines();

    $(window).resize(resizeLines);

    setInterval(function(){

      $('.channel').each(function(i, el) {


        var a_channel = rendered_channels[$(el).attr('data-channel')];
        var next_step = [];

        var i = 0;
        while(i < a_channel.messages.length) {

          next_step[i] = a_channel.messages[i];

          a_channel.messages[i] = 0;
          i++;

        }
        a_channel.messages_over_time.push(next_step);

        console.log(next_step);
        console.log(a_channel.messages_over_time);

        $(el).find('.sparky').sparkline(a_channel.messages_over_time, {type: 'bar', width: '50px'});

      });

    }, 1000);

  }

  start();

})();
