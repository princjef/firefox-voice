var ConversationsView = function() {
  this.conversations = {};
  this.requestedPageCount = 1;
  this.displayedPageCount = 0;
  this.tempPageData = {};

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

ConversationsView.prototype.populateConversationPage = function(page, conversations) {
  if (page <= this.displayedPageCount + 1 && conversations !== null && conversations !== undefined) {
    console.log("populating conversations page", page);
    for (var key in conversations) {
      var conversation = conversations[key];
      this.conversations[key] = conversation;
      var element = conversation.newElement(globals.rnrKey);
      this.list.appendChild(element);
      console.log("added conversation");
    }
    this.displayedPageCount = page;
    if (this.displayedPageCount >= 5) this.loadMore.classList.add('no-display');
    this.tempPageData[page] = undefined;
    if (page === this.requestedPageCount) {
      this.loadMore.classList.remove('loading');
    }
    this.populateConversationPage(page + 1, this.tempPageData[page + 1]);
  }
};

ConversationsView.prototype.empty = function() {
  console.log("called empty");
  self.port.emit('updatePageCount', 1);
  var conversations = this.list.getElementsByClassName(classNames.conversation);
  for (var i = conversations.length - 1; i >= 0; i--) {
    console.log("removing conversation");
    conversations[i].remove();
  }
  this.requestedPageCount = 1;
  this.displayedPageCount = 0;
  this.loadMore.classList.remove('no-display');
};
