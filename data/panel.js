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
  currentConversation: null,
  rnrKey: null,
  currentMessageUpdateId: 1,
  pendingMessages: [],
  conversationPendingMessages: {},
  findingContact: false,
  oldContactInputValue: ""
};

var handlers = {
  backButton: function() {
    document.getElementById(ids.backButton).addEventListener('click', function(event) {
      document.getElementById(ids.wrap).classList.remove(classNames.detailsView);
    });
  },
  messageInputChange: function() {
    var messageInput = document.getElementById(ids.messageInput);

    messageInput.addEventListener('change', dom.resizeMessageInput);
    messageInput.addEventListener('cut', dom.resizeMessageInput);
    messageInput.addEventListener('paste', dom.resizeMessageInput);
    messageInput.addEventListener('drop', dom.resizeMessageInput);
    messageInput.addEventListener('keydown', dom.resizeMessageInput);
  },
  sendMessage: function() {
    document.getElementById(ids.sendMessageButton).addEventListener('click', function() {
      var message = new Message({
        isOutgoing: true,
        content: document.getElementById(ids.messageInput).value,
        time: null
      }, true);
      dom.addNewMessage(message);
      globals.pendingMessages[globals.currentMessageUpdateId] = message;

      var messageData = {
        isOutgoing: true,
        content: message,
        time: "Sending"
      };

      globals.currentConversation.messages.push(messageData);

      self.port.emit('sendMessage', {
        message: message,
        conversation: globals.currentConversation,
        rnrKey: globals.rnrKey,
        updateId: globals.currentMessageUpdateId++
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
  switchToDetailsView: function() {
    document.getElementById(ids.wrap).classList.add(classNames.detailsView);
    setTimeout(function() {
      document.getElementById(ids.messageInput).focus();
    },200);
  },
  parseListingHTML: function(htmlString, jsonResponse) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlString, "text/html");
    var json = [];

    var conversations = doc.getElementsByClassName(classNames.gvConversation);
    for (var i = 0; i < conversations.length; i++) {
      var id = conversations[i].id;
      var conversation = new Conversation({
        id: id,
        isRead: conversations[i].classList.contains(classNames.gvConversationRead),
        timestamp: jsonResponse[id].displayStartDateTime,
        relativeTime: jsonResponse[id].relativeStartTime,
        contact: new Contact({
          name: conversations[i].getElementsByClassName(classNames.gvConversationContactName)[0].innerHTML,
          displayNumber: jsonResponse[id].displayNumber,
          phoneNumber: jsonResponse[id].phoneNumber,
          imageUrl: conversations[i].getElementsByClassName(classNames.gvConversationPicture)[0].innerHTML
        }),
        messages: []
      });

      var messages = conversations[i].getElementsByClassName(classNames.gvMessage);
      for (var j = 0; j < messages.length; j++) {
        var message = new Message({
          isOutgoing: (messages[j].getElementsByClassName(classNames.gvMessageFrom)[0].innerHTML.trim() === "Me:"),
          content: (messages[j].getElementsByClassName(classNames.gvMessageContent)[0].innerHTML),
          time: (messages[j].getElementsByClassName(classNames.gvMessageTime)[0].innerHTML)
        }, false);
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
      var element = conversation.newElement(globals.rnrKey);
      list.appendChild(element);
    }
  },
  addNewMessage: function(message) {
    var list = document.getElementById(ids.messageList);

    var messageElement = message.newElement();
    list.appendChild(messageElement);

    document.getElementById(ids.messageInput).value = "";
    dom.resizeMessageInput();

    // Scroll
    var listWrap = document.getElementById(ids.messageListScroll);
    listWrap.scrollTop = listWrap.scrollHeight;
  },
  resizeMessageInput: function() {
    window.setTimeout(function() {
      var messageInput = document.getElementById(ids.messageInput);
      messageInput.style.height = "1px";
      messageInput.style.height = messageInput.scrollHeight + "px";
    }, 0);
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

      if (globals.currentConversation !== null) {
        for (var id in globals.conversations) {
          if (globals.conversations[id].hasContact(globals.currentConversation.contact)) {
            globals.conversations[id].absorb(globals.currentConversation);
            globals.currentConversation = globals.conversations[id];
          }
        }
      }

      dom.populateConversationListing();
      if (globals.currentConversation !== null) {
        globals.currentConversation.populateDetails();
      }

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
      globals.pendingMessages[data.updateId].sent(data.success);
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
      globals.conversations[data.id].populateDetails();
    });
  },
  hide: function() {
    self.port.on('hide', function() {
      typeahead.hide();
      detailsView.hide();
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
  api.hide();
};
