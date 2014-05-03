var buttons = require('sdk/ui/button/toggle');
var panels = require('sdk/panel');
var tabs = require('sdk/tabs');
var self = require('sdk/self');
var {Cc, Ci, Cu} = require('chrome');

var url = {
  login: "https://www.google.com/voice",
  smsListing: "https://www.google.com/voice/inbox/recent/sms/"
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
  contentScriptFile: self.data.url('panel.js'),
  onHide: handleHide
});

function handleClick(state) {
  if (state.checked) {
    get(url.smsListing, function(request) {
      var response = parseXMLResponse(request);
      if (response !== null) {
        panel.port.emit("recentSMS", response);
        panel.show({
          position: button
        });
      } else {
        state.checked = false;
        tabs.open(url.login);
      }
    });
  }
}

function handleHide() {
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

function parseXMLResponse(request) {
  console.log("Content-Type", request.getResponseHeader('content-type').split(";")[0].trim());
  if (request.getResponseHeader('content-type').split(";")[0].trim() != "text/xml") {
    return null;
  } else if (request.responseXML === null) {
    console.log("Response bad", request.responseText);
    return null;
  } else {
    return {
      html: request.responseXML.documentElement.getElementsByTagName("html")[0].textContent,
      json: JSON.parse(request.responseXML.documentElement.getElementsByTagName("json")[0].textContent).messages
    };
  }
}
