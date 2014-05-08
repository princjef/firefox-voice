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
  newConversationClick: function() {
    document.getElementById(ids.newConversationButton).addEventListener('click', function() {
      console.log("Clicked new conversation button");
      globals.findingContact = !globals.findingContact;
      document.getElementById(ids.wrap).classList.toggle("find-contact");
      document.getElementById(ids.newConversationInput).focus();
    });
  },
  contactTypeahead: function() {
    var contactInput = document.getElementById(ids.newConversationInput);
    var typeaheadContacts = document.getElementsByClassName(classNames.contactTypeaheadElement);

    var typeahead = function() {
      window.setTimeout(function() {
        var value = contactInput.value.toLowerCase();
        if (value !== globals.oldContactInputValue) {
          globals.oldContactInputValue = value;
          var numValue = value.replace(/\.|-|\s/g, "");
          var firstElement = true;

          for (var i = 0; i < typeaheadContacts.length; i++) {
            var contact = typeaheadContacts.item(i);
            if (contact.dataset.name.toLowerCase().contains(value) ||
                contact.dataset.phoneNumber.contains(numValue) ||
                contact.dataset.displayNumber.contains(value)
            ) {
              contact.classList.remove('hidden');
              contact.classList.add('visible');
              if (firstElement) {
                contact.classList.add('selected');
                firstElement = false;
              } else {
                contact.classList.remove('selected');
              }
            } else {
              contact.classList.add('hidden');
              contact.classList.remove('visible');
              contact.classList.remove('selected');
            }
          }
        }
      }, 0);
    };

    contactInput.addEventListener('change', typeahead);
    contactInput.addEventListener('cut', typeahead);
    contactInput.addEventListener('paste', typeahead);
    contactInput.addEventListener('drop', typeahead);
    contactInput.addEventListener('keydown', typeahead);
  },
  arrowKeys: function() {
    document.getElementById(ids.newConversationInput).addEventListener('keydown', function(event) {
      var getSelectedIndex = function(elements) {
        for (var i = 0; i < elements.length; i++) {
          if (elements.item(i).classList.contains('selected')) {
            return i;
          }
        }
        return null;
      };

      var selectedElement = null;

      if (event.keyCode === 38 || event.keyCode === 40) {  // Up/down Arrow
        var visibleElements = document.querySelectorAll('.typeahead-element.visible');
        var index = getSelectedIndex(visibleElements);
        if (index !== null) {
          visibleElements.item(index).classList.remove('selected');
        }

        var newIndex;
        if (event.keyCode === 38) {  // Up arrow
          newIndex = ((index === null || index <= 0) ? (visibleElements.length - 1) : (index - 1));
        } else {  // Down arrow
          newIndex = ((index === null || index >= visibleElements.length - 1) ? 0 : (index + 1));
        }

        visibleElements.item(newIndex).classList.add('selected');
        selectedElement = visibleElements.item(newIndex);
        event.stopPropagation();
        event.preventDefault();

      } else if (event.keyCode === 13) { // Enter
        var selectedElement = document.querySelectorAll('.typeahead-element.visible.selected')[0];
        api.selectContact(selectedElement);
      }

      if (selectedElement !== null) {
        var typeahead = document.getElementById(ids.contactTypeaheadWrap);
        // console.log("OutScroll", typeahead.scrollTop, "OutHeight", typeahead.offsetHeight, "InScroll", selectedElement.offsetTop, "InHeight", selectedElement.offsetHeight);
        if (selectedElement.offsetTop < typeahead.scrollTop) {
          var scroll = selectedElement.offsetTop;
          typeahead.scrollTop = scroll;
        } else if (selectedElement.offsetTop + selectedElement.offsetHeight > typeahead.scrollTop + typeahead.offsetHeight) {
          var scroll = (selectedElement.offsetTop + selectedElement.offsetHeight - typeahead.offsetHeight);
          typeahead.scrollTop = scroll;
        }
      }
    });
  },
  typeaheadSelect: function() {
    console.log("Called typeaheadSelect");
    var typeaheadElements = document.getElementsByClassName(classNames.contactTypeaheadElement);

    console.log("Typeahead Elements Length", typeaheadElements.length);
    for (var i = 0; i < typeaheadElements.length; i++) {
      typeaheadElements.item(i).addEventListener('mouseenter', function(event) {
        for (var j = 0; j < typeaheadElements.length; j++) {
          typeaheadElements.item(j).classList.remove('selected');
        }
        this.classList.add('selected');
      });

      typeaheadElements.item(i).addEventListener('click', function(event) {
        api.selectContact(this);
      });
    }
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
  },
  populateTypeahead: function() {
    var typeahead = document.getElementById(ids.contactTypeahead);
    typeahead.innerHTML = "";

    globals.user.rankedContacts.forEach(function(contactId) {
      var contactInfo = globals.user.contacts[contactId];
      var contact = document.createElement('li');
      contact.classList.add('typeahead-element');
      contact.classList.add('visible');
      contact.dataset.contactId = contactInfo.contactId;
      contact.dataset.phoneNumber = contactInfo.phoneNumber;
      contact.dataset.displayNumber = contactInfo.displayNumber;
      contact.dataset.name = contactInfo.name;

      var name = document.createElement('span');
      name.innerHTML = contactInfo.name + " ";
      contact.appendChild(name);

      var phone = document.createElement('span');
      phone.classList.add('grey');
      phone.innerHTML = contactInfo.displayNumber;
      contact.appendChild(phone);

      typeahead.appendChild(contact);
    });

    handlers.typeaheadSelect();
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
      dom.populateTypeahead();
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
  },
  selectContact: function(element) {
    var contactId = element.dataset.contactId;
    var key = "";
    for (var id in globals.conversations) {
      if (globals.conversations[id].contact.phoneNumber === element.dataset.phoneNumber) {
        key = id;
        break;
      }
    }

    if (key === "") {
      globals.conversations[""] = {
        id: "",
        isRead: true,
        timestamp: "",
        relativeTime: "",
        contact: {
          name: element.dataset.name,
          displayNumber: element.dataset.displayNumber,
          phoneNumber: element.dataset.phoneNumber,
          imageUrl: ""
        },
        messages: []
      };
    }

    dom.populateConversationDetails(key);
    document.getElementById(ids.wrap).classList.add(classNames.detailsView);
  }
};

window.onload = function() {
  handlers.backButton();
  handlers.sendMessage();
  handlers.messageInputChange();
  handlers.newConversationClick();
  handlers.contactTypeahead();
  handlers.arrowKeys();
  api.smsListing();
  api.globalData();
  api.updateMessageTime();
};
