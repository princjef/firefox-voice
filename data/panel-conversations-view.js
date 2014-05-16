var ConversationsView = function() {
  this.conversations = {};
  this.requestedPageCount = 1;
  this.displayedPageCount = 0;
  this.tempPageData = {};
  this.tempConversations = {};

  this.list = document.getElementById(ids.conversationListing);
  this.loadMore = document.getElementById(ids.loadMoreConversations);

  var that = this;
  this.loadMore.addEventListener('click', function() {
    that.loadConversations(that.requestedPageCount + 1);
    this.classList.add('loading');
  });

  self.port.on('clearConversations', function() {
    that.empty();
  });
};

ConversationsView.prototype.loadConversations = function(maxPage) {
  self.port.emit('updatePageCount', maxPage);
  for (var page = this.requestedPageCount + 1; page <= maxPage; page++) {
    self.port.emit('requestSMS', page);
  }
  this.requestedPageCount = maxPage;
};

ConversationsView.prototype.populateConversationPage = function(page, conversations, replace, notify) {
  if (conversations !== null && conversations !== undefined) {

    // Populate temp conversations
    for (var key in conversations) {
      this.tempConversations[key] = conversations[key];
    }

    // Update information
    this.displayedPageCount = page;
    this.tempPageData[page] = undefined;

    // If this is the last page, populate
    if (page === this.requestedPageCount) {
      this.loadMore.classList.remove('loading');
      if (notify) this.newMessageNotification();
      if (replace) {
        this.conversations = {};
        this.emptyList();
      }

      for (var key in this.tempConversations) {
        this.conversations[key] = this.tempConversations[key];
        var element = this.conversations[key].newElement(globals.rnrKey);
        this.list.appendChild(element);
      }

      this.tempConversations = {};
    } else if (page <= this.displayedPageCount + 1) {
      this.populateConversationPage(page + 1, this.tempPageData[page + 1], replace, notify);
    }
  }
};

ConversationsView.prototype.newMessageNotification = function() {
  for (var id in this.tempConversations) {
    var conversation = this.tempConversations[id];
    if (!conversation.isRead) {
      if (this.conversations === null ||
          this.conversations === undefined ||
          this.conversations[id] === undefined ||
          this.conversations[id].isRead ||
          conversation.messages.length > this.conversations[id].messages.length
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
        if (sentNotification) {
          break;
        }
      }
    }
  }
};

ConversationsView.prototype.emptyList = function() {
  var conversations = this.list.getElementsByClassName(classNames.conversation);
  for (var i = conversations.length - 1; i >= 0; i--) {
    conversations[i].remove();
  }
};

ConversationsView.prototype.empty = function() {
  this.displayedPageCount = 0;
};

ConversationsView.prototype.resetPageLength = function() {
  self.port.emit('updatePageCount', 1);
  this.requestedPageCount = 1;
};
