var buttons = require('sdk/ui/button/toggle');
var panels = require('sdk/panel');
var tabs = require('sdk/tabs');
var self = require('sdk/self');
var timer = require('sdk/timers');
var notifications = require('sdk/notifications');
var {Cc, Ci, Cu} = require('chrome');
var prefs = require('sdk/simple-prefs').prefs;
var prefRunner = require('sdk/simple-prefs');

var url = {
  home: "https://www.google.com/voice",
  smsListing: "https://www.google.com/voice/inbox/recent/sms/",
  sendMessage: "https://www.google.com/voice/sms/send/",
  markRead: "https://www.google.com/voice/inbox/mark"
};

var button = buttons.ToggleButton({
  id: 'firefox-voice',
  label: 'Firefox Voice',
  icon: {
    '16': './icon-16.png',
    '32': './icon-32.png',
    '64': './icon-64.png'
  },
  onChange: handleClick
});

var panel = panels.Panel({
  contentURL: self.data.url('panel.html'),
  contentScriptFile: [
    self.data.url('panel-message.js'),
    self.data.url('panel-contact.js'),
    self.data.url('panel-conversation.js'),
    self.data.url('panel-typeahead.js'),
    self.data.url('panel-conversations-view.js'),
    self.data.url('panel.js')
  ],
  onHide: handleHide
});

var firstLoad = true;

var tabOpen = false;
function handleClick(state) {
  if (state.checked) {
    contentUpdate(false, function(response) {
      if (response !== null) {
        panel.show({
          position: button
        });
      } else {
        button.state('window', { checked: false });
        tabOpen = false;
        tabs.open({
          url: url.home,
          onReady: function() {
            if (tabOpen) {
              setUpdateInterval();
            } else {
              tabOpen = true;
            }
            console.log("Tab changed");
          }
        });
      }
    });
  }
}

var pageCount = 1;

function contentUpdate(notify, callback) {
  for (var page = 1; page <= pageCount; page++) {
    requestPage(page, notify, true, callback);
  }
  panel.port.emit('clearConversations');
}

function requestPage(page, notify, replace, callback) {
  var queryString = queryStringEncode({
    page: "p" + page
  });
  get(url.smsListing + "?" + queryString, function(request) {
    console.log("Got messages for page", page, "with code", request.status);
    var response = parseXMLResponse(request);
    if (response !== null) {
      panel.port.emit("receiveSMS", {
        replace: replace,
        notify: notify,
        response: response,
        page: page
      });
    }
    if (callback !== null && callback !== undefined) {
      callback(response);
    }
  });
}

function handleHide() {
  panel.port.emit('hide');
  button.state('window', { checked: false });
}

function get(url, callback) {
  var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  req.mozBackgroundRequest = true;
  req.timeout = 5000;
  req.open('GET', url, true);
  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      callback(req);
    }
  };
  req.channel.QueryInterface(Ci.nsIHttpChannelInternal).forceAllowThirdPartyCookie = true;
  req.send(null);
}

function post(url, params, callback) {
  var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  req.mozBackgroundRequest = true;
  req.timeout = 5000;
  req.open('POST', url, true);
  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      callback(req);
    }
  };
  var queryString = queryStringEncode(params);
  console.log(queryString);
  req.setRequestHeader("Content-Length", queryString.length);
  req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
  req.channel.QueryInterface(Ci.nsIHttpChannelInternal).forceAllowThirdPartyCookie = true;
  req.send(queryString);
}

function parseXMLResponse(request) {
  // console.log("Status", request.status);
  // console.log("Content-Type", request.getResponseHeader('content-type').split(";")[0].trim());
  // console.log("Headers", request.getAllResponseHeaders());
  if (request.getResponseHeader('content-type').split(";")[0].trim() != "text/xml") {
    return null;
  } else if (request.responseXML === null) {
    console.log("Response bad", request.responseText);
    return null;
  } else {
    if (firstLoad) {
      get(url.home, function(request2) {
        firstLoad = false;
        panel.port.emit('globalData', request2.responseText);
      });
    }

    var json = JSON.parse(request.responseXML.documentElement.getElementsByTagName("json")[0].textContent);
    panel.port.emit('updateUnreadCount', json.unreadCounts.sms);

    return {
      html: request.responseXML.documentElement.getElementsByTagName("html")[0].textContent,
      json: json.messages
    };
  }
}

function queryStringEncode(obj) {
  var params = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      params.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
    }
  }
  return params.join("&");
}

panel.port.on('sendMessage', function(data) {
  var params = {
    id: data.conversation.id,
    phoneNumber: data.conversation.contact.phoneNumber,
    conversationId: data.conversation.id,
    text: data.message.content,
    contact: data.conversation.contact.name,
    _rnr_se: data.rnrKey
  };

  post(url.sendMessage, params, function(request) {
    console.log("Sent message with code", request.status);
    panel.port.emit('messageSent', {
      success: request.status === 200,
      updateId: data.updateId
    });
  });
});

panel.port.on('markRead', function(data) {
  var params = {
    messages: data.id,
    read: "1",
    _rnr_se: data.rnrKey
  };

  post(url.markRead, params, function(request) {
    console.log("Marked conversation read with code", request.status);
  });
});

panel.port.on('messageNotification', function(data) {
  notifications.notify({
    title: data.name || data.displayNumber,
    text: data.content,
    iconURL: self.data.url("icon-64.png"),
    data: data.id,
    onClick: function(id) {
      panel.show({
        position: button
      });
      panel.port.emit('notificationClick', {
        id: id
      });
      console.log("Clicked notification with id", id);
    }
  });
});

panel.port.on('updatePageCount', function(newCount) {
  console.log("updating page count to", newCount);
  pageCount = newCount;
});

panel.port.on('requestSMS', function(page) {
  console.log("requestSMS: page", page);
  requestPage(page, false, false);
});

function contentUpdateWrap() {
  console.log(prefs.notificationsEnabled);
  contentUpdate(prefs.notificationsEnabled);
}

var contentUpdateInterval = null;
function setUpdateInterval() {
  contentUpdateWrap();
  if (contentUpdateInterval !== null) {
    timer.clearInterval(contentUpdateInterval);
  }
  contentUpdateInterval = timer.setInterval(contentUpdateWrap, 1000*prefs.updateFrequency);
}

var prefTimeout = null;
prefRunner.on('updateFrequency', function() {
  if (prefTimeout !== null) {
    timer.clearTimeout(prefTimeout);
  }
  prefTimeout = timer.setTimeout(function() {
    setUpdateInterval();
    prefTimeout = null;
  }, 3000);
});

setUpdateInterval();
