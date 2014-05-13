# Firefox Voice

This is a [Google Voice](http://google.com/voice) add-on for the Firefox web browser designed to enable texting and viewing of text messages without needing to use the website.

In order for the add-on to function properly, you must be signed into a Google account that has Google Voice set up. If you do not have this set-up, you will be prompted to log in when you try to open the add-on.

**GitHub Repository: ** [https://github.com/princjef/firefox-voice/](https://github.com/princjef/firefox-voice/)

**Issues: ** [https://github.com/princjef/firefox-voice/issues](https://github.com/princjef/firefox-voice/issues)

## Features

### Current

* View recent conversations from Google Voice
* Text directly from the add-on
* HTML5 notifications of new text messages
* Search contacts or text non-contact phone number
* Mark conversations read from the add-on

### Future

* Start a phone call directly from the add-on
* Mark conversations unread from the add-on
* Archive conversations from the add-on
* Delete conversations from the add-on
* Collapse conversations by contact name

## Compatibility/Robustness

Unlike many Google services, Google Voice does not have an official public API. As a result, this add-on has to parse much of its information from the HTML of the Google Voice website. The HTML for the core content of the site has not changed appreciably for a while, so this is relatively safe for the moment. However, should Google decide to make an update to the site, this add-on will likely break until I can adjust it to the update.

## Contributing/Error Reporting

If you notice problems with any of the features of the add-on, please submit a bug in the [issues area](https://github.com/princjef/firefox-voice/issues) of the add-on's GitHub repository. I will do my best to remedy them as quickly as possible.

If you would like to contribute bugfixes or new features to the add-on, feel free to fork the [GitHub repository](https://github.com/princjef/firefox-voice/) and submit a pull request with your changes.
