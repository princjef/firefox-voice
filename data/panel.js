var classNames = {
  conversation: "contact",
  detailsView: "left-shifted",
  placeholder: "grey",
  contactTypeaheadElement: "typeahead-element",
  gvConversation: 'gc-message',
  gvConversationRead: 'gc-message-read',
  gvConversationUnread: 'gc-message-unread',
  gvConversationPicture: 'gc-message-portrait',
  gvConversationContactName: 'gc-message-name-link',
  gvMessage: 'gc-message-sms-row',
  gvMessageFrom: 'gc-message-sms-from',
  gvMessageContent: 'gc-message-sms-text',
  gvMessageTime: 'gc-message-sms-time'
};

var ids = {
  wrap: "wrap",
  backButton: "button-back",
  messageInput: "message-input",
  conversationListing: "list",
  conversationDetailsName: "conversation-name",
  messageList: "message-list",
  messageListScroll: "message-list-wrap",
  sendMessageButton: "send-message",
  newConversationButton: "new-conversation",
  newConversationInput: "new-conversation-input",
  contactTypeahead: "contact-typeahead",
  contactTypeaheadWrap: "typeahead-wrap",
  conversationListingHeader: "conversation-listing-header"
};

var globals = {
  user: {},
  conversations: {},
  currentConversation: {},
  rnrKey: null,
  currentMessageUpdateId: 1,
  pendingMessages: [],
  findingContact: false,
  oldContactInputValue: ""
};

var handlers = {
  conversationClick: function() {
    var conversations = document.getElementsByClassName(classNames.conversation);
    for (var i = 0; i < conversations.length; i++) {
      conversations.item(i).addEventListener('click', function(event) {
        dom.populateConversationDetails(this.dataset.id);
        if (this.classList.contains('unread')) {
          this.classList.remove('unread');
          this.classList.add('read');
          self.port.emit('markRead', {
            id: this.dataset.id,
            rnrKey: globals.rnrKey
          });
        }
        document.getElementById(ids.wrap).classList.add(classNames.detailsView);
      });
    }
  },
  backButton: function() {
    document.getElementById(ids.backButton).addEventListener('click', function(event) {
      document.getElementById(ids.wrap).classList.remove(classNames.detailsView);
    });
  },
  messageInputChange: function() {
    var messageInput = document.getElementById(ids.messageInput);

    var resize = function() {
      window.setTimeout(function() {
        messageInput.style.height = "1px";
        messageInput.style.height = messageInput.scrollHeight + "px";
      }, 0);
    };

    messageInput.addEventListener('change', resize);
    messageInput.addEventListener('cut', resize);
    messageInput.addEventListener('paste', resize);
    messageInput.addEventListener('drop', resize);
    messageInput.addEventListener('keydown', resize);
  },
  sendMessage: function() {
    document.getElementById(ids.sendMessageButton).addEventListener('click', function() {
      var message = document.getElementById(ids.messageInput).value;
      globals.pendingMessages[globals.currentMessageUpdateId] = dom.addNewMessage(message, true);

      self.port.emit('sendMessage', {
        message: message,
        conversation: globals.currentConversation,
        rnrKey: globals.rnrKey,
        updateId: globals.currentMessageUpdateId
      });
    });
  },
  esc: function() {
    window.addEventListener('keydown', function(event) {
      if (event.keyCode === 27) {  // Esc key
        if (typeahead.hide()) {
          event.stopPropagation();
          event.preventDefault();
        } else if (detailsView.hide()) {
          event.stopPropagation();
          event.preventDefault();
        }
      }
    });
  }
};

var dom = {
  parseListingHTML: function(htmlString, jsonResponse) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlString, "text/html");
    var json = [];

    var conversations = doc.getElementsByClassName(classNames.gvConversation);
    for (var i = 0; i < conversations.length; i++) {
      var id = conversations[i].id;
      var conversation = {
        id: id,
        isRead: conversations[i].classList.contains(classNames.gvConversationRead),
        timestamp: jsonResponse[id].displayStartDateTime,
        relativeTime: jsonResponse[id].relativeStartTime,
        contact: {
          name: conversations[i].getElementsByClassName(classNames.gvConversationContactName)[0].innerHTML,
          displayNumber: jsonResponse[id].displayNumber,
          phoneNumber: jsonResponse[id].phoneNumber,
          imageUrl: conversations[i].getElementsByClassName(classNames.gvConversationPicture)[0].innerHTML
        },
        messages: []
      };

      var messages = conversations[i].getElementsByClassName(classNames.gvMessage);
      for (var j = 0; j < messages.length; j++) {
        var message = {
          isOutgoing: messages[j].getElementsByClassName(classNames.gvMessageFrom)[0].innerHTML.trim() === "Me:",
          content: messages[j].getElementsByClassName(classNames.gvMessageContent)[0].innerHTML,
          time: messages[j].getElementsByClassName(classNames.gvMessageTime)[0].innerHTML
        };
        conversation.messages.push(message);
      }

      json[id] = conversation;
    }
    return json;
  },
  populateConversationListing: function() {
    var list = document.getElementById(ids.conversationListing);
    list.innerHTML = "";
    for (var key in globals.conversations) {
      var conversation = globals.conversations[key];
      var contact = document.createElement('li');

      // Classes
      contact.classList.add('contact');
      if (conversation.isRead) {
        contact.classList.add('read');
      } else {
        contact.classList.add('unread');
      }

      // Data attributes
      contact.dataset.id = conversation.id;
      contact.dataset.phone = conversation.contact.displayNumber;

      // Name
      var name = document.createElement('div');
      name.classList.add('contact-name');
      name.innerHTML = conversation.contact.name;
      contact.appendChild(name);

      // Phone Number
      var phoneNumber = document.createElement('div');
      phoneNumber.classList.add('small');
      phoneNumber.classList.add('grey');
      phoneNumber.innerHTML = conversation.contact.displayNumber;
      contact.appendChild(phoneNumber);

      list.appendChild(contact);
    }
  },
  populateConversationDetails: function(id) {
    globals.currentConversation = globals.conversations[id];

    var list = document.getElementById(ids.messageList);
    list.innerHTML = "";

    // Name
    document.getElementById(ids.conversationDetailsName).innerHTML = globals.currentConversation.contact.name;

    // Messages
    globals.currentConversation.messages.forEach(function(message) {
      var messageHTML = document.createElement('li');

      // Classes
      messageHTML.classList.add('message');
      if (message.isOutgoing) {
        messageHTML.classList.add('message-outgoing');
      } else {
        messageHTML.classList.add('message-incoming');
      }

      // SMS Content
      var content = document.createElement('div');
      content.classList.add('message-content');
      content.innerHTML = message.content;
      messageHTML.appendChild(content);

      // SMS Time
      var time = document.createElement('div');
      time.classList.add('message-time');
      time.classList.add('grey');
      time.classList.add('small');
      time.innerHTML = message.time;
      messageHTML.appendChild(time);

      list.appendChild(messageHTML);
    });

    // Text Number
    document.getElementById(ids.messageInput).setAttribute("placeholder", "Send to " + globals.currentConversation.contact.displayNumber);

    // Scroll
    var listWrap = document.getElementById(ids.messageListScroll);
    listWrap.scrollTop = listWrap.scrollHeight;
  },
  addNewMessage: function(content, isOutgoing) {
    var list = document.getElementById(ids.messageList);
    var message = document.createElement('li');
    message.classList.add('message');
    message.classList.add('message-pending');
    if (isOutgoing) {
      message.classList.add('message-outgoing');
    } else {
      message.classList.add('message-incoming');
    }

    // Content
    var contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerHTML = content;
    message.appendChild(contentDiv);

    // Time
    var time = document.createElement('div');
    time.classList.add('message-time');
    time.classList.add('grey');
    time.classList.add('small');
    time.innerHTML = "Sending";
    message.appendChild(time);

    list.appendChild(message);

    document.getElementById(ids.messageInput).value = "";

    // Scroll
    var listWrap = document.getElementById(ids.messageListScroll);
    listWrap.scrollTop = listWrap.scrollHeight;

    return function(success) {
      if (success) {
        message.classList.remove('message-pending');

        // Set time
        var d = new Date();
        var AMPM = d.getHours() >= 12 ? "PM" : "AM";
        var hour = d.getHours() % 12;
        if (hour === 0) hour = 12;
        time.innerHTML = "" + hour + ":" + d.getMinutes() + " " + AMPM;
      } else {
        time.innerHTML = "Failed to send";
      }
    };
  }
};

var api = {
  smsListing: function() {
    var that = this;
    self.port.on('recentSMS', function(data) {
      var newConversations = dom.parseListingHTML(data.response.html, data.response.json);
      if (data.notify) {
        that.newMessageNotification(newConversations);
      }

      globals.conversations = newConversations;

      dom.populateConversationListing();
      if (globals.currentConversation.id !== undefined && globals.currentConversation.id !== null) {
        dom.populateConversationDetails(globals.currentConversation.id);
      }
      handlers.conversationClick();
    });
  },
  globalData: function() {
    self.port.on('globalData', function(htmlString) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(htmlString, "text/html");
      globals.rnrKey = doc.getElementsByName("_rnr_se")[0].value;
      console.log("rnrKey", globals.rnrKey);

      var scriptElements = doc.getElementsByTagName("script");
      var userText = scriptElements.item(scriptElements.length - 1)
        .textContent                   // get text of script element
        .split("var _gcData = ")[1]    // Start of JSON data
        .split(/;$/m)[0]               // End of JSON data
        .replace(/(\/\/)*'/g, "$1\"")  // replace unescaped single quote with double quote
        .replace(/\,\s*\}/g, "}")      // get rid of trailing commas in object
        .replace(/\,\s*\]/g, "]");     // get rid of trailing commas in array
      globals.user = JSON.parse(userText);
      console.log("Extracted user info");
      typeahead.populate();
    });
  },
  updateMessageTime: function() {
    self.port.on('messageSent', function(data) {
      globals.pendingMessages[data.updateId](data.success);
    });
  },
  newMessageNotification: function(newConversations) {
    var firstMessageOnly = (globals.conversations === null);
    for (var id in newConversations) {
      var conversation = newConversations[id];
      if (!conversation.isRead) {
        if (globals.conversations === null ||
            globals.conversations === undefined ||
            globals.conversations[id] === undefined ||
            globals.conversations[id].isRead ||
            conversation.length > globals.conversations[id].length
        ) {
          var sentNotification = false;
          for (var i = conversation.messages.length - 1; i >= 0; i--) {
            if (!conversation.messages[i].isOutgoing) {
              self.port.emit('messageNotification', {
                id: id,
                name: conversation.contact.name,
                displayNumber: conversation.contact.displayNumber,
                content: conversation.messages[i].content
              });
              sentNotification = true;
              break;
            }
          }
          if (sentNotification && firstMessageOnly) {
            break;
          }
        }
      }
    }
  },
  notificationClick: function() {
    self.port.on('notificationClick', function(data) {
      document.getElementById(ids.wrap).classList.add(classNames.detailsView);
      dom.populateConversationDetails(data.id);
    });
  }
};

var detailsView = {
  hide: function() {
    var wrap = document.getElementById(ids.wrap);
    if (wrap.classList.contains(classNames.detailsView)) {
      wrap.classList.remove(classNames.detailsView);
    } else {
      return false;
    }
  }
}

window.onload = function() {
  handlers.backButton();
  handlers.sendMessage();
  handlers.messageInputChange();
  handlers.esc();
  typeahead.openDialog();
  typeahead.inputChange();
  typeahead.keyEvents();
  api.smsListing();
  api.globalData();
  api.updateMessageTime();
};
