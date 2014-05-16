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
  messageInputLength: "message-input-length",
  messageInputCapacity: "message-input-capacity",
  conversationListing: "list",
  conversationDetailsName: "conversation-name",
  messageList: "message-list",
  messageListScroll: "message-list-wrap",
  sendMessageButton: "send-message",
  newConversationButton: "new-conversation",
  newConversationInput: "new-conversation-input",
  contactTypeahead: "contact-typeahead",
  contactTypeaheadWrap: "typeahead-wrap",
  typeaheadPlaceholder: "typeahead-element-placeholder",
  typeaheadPlaceholderPhoneNumber: "typeahead-element-placeholder-phone",
  conversationListingHeader: "conversation-listing-header",
  loadMoreConversations: "load-more-conversations",
  unreadCount: "unread-count"
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

var views = {};

var handlers = {
  backButton: function() {
    document.getElementById(ids.backButton).addEventListener('click', function(event) {
      document.getElementById(ids.wrap).classList.remove(classNames.detailsView);
    });
  },
  messageInputChange: function() {
    var messageInput = document.getElementById(ids.messageInput);

    messageInput.addEventListener('change', dom.updateMessageInput);
    messageInput.addEventListener('cut', dom.updateMessageInput);
    messageInput.addEventListener('paste', dom.updateMessageInput);
    messageInput.addEventListener('drop', dom.updateMessageInput);
    messageInput.addEventListener('keydown', dom.updateMessageInput);
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
        updateId: globals.currentMessageUpdateId++
      });

      document.getElementById(ids.messageInput).focus();
    });
  },
  loadMoreConversations: function() {
    document.getElementById(ids.loadMoreConversations).addEventListener('click', function() {
      self.port.emit('smsListing')
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
      var nameElement = conversations[i].getElementsByClassName(classNames.gvConversationContactName)[0];
      var conversation = new Conversation({
        id: id,
        isRead: conversations[i].classList.contains(classNames.gvConversationRead),
        timestamp: jsonResponse[id].displayStartDateTime,
        relativeTime: jsonResponse[id].relativeStartTime,
        contact: new Contact({
          name: (nameElement !== undefined ? nameElement.innerHTML : undefined),
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
    var conversations = list.getElementsByClassName(classNames.conversation);
    for (var i = conversations.length - 1; i >= 0; i--) {
      conversations[i].remove();
    }

    for (var key in globals.conversations) {
      var conversation = globals.conversations[key];
      var element = conversation.newElement();
      list.appendChild(element);
    }
  },
  addNewMessage: function(message) {
    var list = document.getElementById(ids.messageList);

    var messageElement = message.newElement();
    list.appendChild(messageElement);

    document.getElementById(ids.messageInput).value = "";
    dom.updateMessageInput();

    // Scroll
    var listWrap = document.getElementById(ids.messageListScroll);
    listWrap.scrollTop = listWrap.scrollHeight;
  },
  updateMessageInput: function() {
    window.setTimeout(function() {
      var messageInput = document.getElementById(ids.messageInput);
      var messageInputLength = document.getElementById(ids.messageInputLength);
      var messageInputCapacity = document.getElementById(ids.messageInputCapacity);
      var length = messageInput.value.length;
      messageInputLength.innerHTML = length;
      messageInputCapacity.innerHTML = length + (160 - (length % 160));
      messageInput.style.height = "1px";
      messageInput.style.height = messageInput.scrollHeight + "px";
    }, 0);
  }
};

var api = {
  smsListing: function() {
    var that = this;
    self.port.on('receiveSMS', function(data) {
      var conversations = dom.parseListingHTML(data.response.html, data.response.json);

      if (globals.currentConversation !== null) {
        for (var id in views.conversationView.conversations) {
          if (views.conversationView.conversations[id].hasContact(globals.currentConversation.contact)) {
            views.conversationView.conversations[id].absorb(globals.currentConversation);
            globals.currentConversation = views.conversationView.conversations[id];
          }
        }
      }

      views.conversationView.populateConversationPage(data.page, conversations, data.replace, data.notify);
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
      self.port.emit('setRnrKey', globals.rnrKey);
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
  },
  updateUnreadCount: function() {
    self.port.on('updateUnreadCount', function(count) {
      document.getElementById(ids.unreadCount).innerHTML = count;
    });
  }
};

var detailsView = {
  hide: function() {
    console.log("called details view hide");
    var wrap = document.getElementById(ids.wrap);
    views.conversationView.empty();
    views.conversationView.resetPageLength();
    if (wrap.classList.contains(classNames.detailsView)) {
      wrap.classList.remove(classNames.detailsView);
    } else {
      return false;
    }
  }
}

window.onload = function() {
  views.conversationView = new ConversationsView();

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
  api.updateUnreadCount();
};
