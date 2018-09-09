/*jshint
    browser:true, camelcase:true, curly:true, eqeqeq:true, forin:true,
    immed:true, indent:4, jquery:true, latedef:true, newcap:true,
    noarg:true, noempty:true, nonew:true, onevar:true, plusplus:true,
    quotmark:single, strict:true, trailing:true, undef:true, unused:true
*/

// DiscussionsRC
// RC-like feed for Discussions
// @author Noreplyz
// @version 0.3
// Work in progress!

;(function($, mw, Mustache) {
   'use strict';

   // Loads or checks for DiscussionsRC
   if (window.discRC) {
      return;
   }
   if (mw.config.get('wgPageName') === 'Special:DiscussionsRC') {
      $('h1.page-header__title').text('DiscussionsRC');
      document.title = 'DiscussionsRC | ' + mw.config.get('wgSiteName') + ' | FANDOM powered by Wikia';
      $('#WikiaArticle').empty().append($('<div/>', {id: 'discrc'}));
   }
   if (!$('#discrc').length) {
      return;
   }
   var discRC = {};
   discRC.wikis = [];
   discRC.entries = [];
   var dRCAPI = {};

   // API request for wiki variables
   dRCAPI.getWikiVariables = function(wiki, timeout) {
      return $.ajax({
         url: 'https://' + wiki + '.wikia.com/api.php',
         type: 'GET',
         format: 'json',
         dataType: 'jsonp',
         crossDomain: 'true',
         timeout: timeout ? timeout : 5000,
         xhrFields: {
            withCredentials: true
         },
         data: {
            action: 'query',
            meta: 'siteinfo',
            siprop: ['general', 'variables'].join('|'),
            format:'json'
         }
      });
   };

   // Returns API request for list of posts from Discussions
   dRCAPI.getPosts = function(cityId, limit, page, reported, viewableOnly) {
      return $.ajax({
         url: 'https://services.wikia.com/discussion/' + cityId + '/posts',
         type: 'GET',
         format: 'json',
         crossDomain: 'true',
         xhrFields: {
            withCredentials: true
         },
         data: {
            limit: limit,
            page: page,
            responseGroup: 'small',
            reported: reported,
            viewableOnly: viewableOnly
         }
      });
   };

   // Returns API request for list of posts in a thread from Discussions
   dRCAPI.getThread = function(cityId, threadId, page, limit, viewableOnly) {
      return $.ajax({
         url: 'https://services.wikia.com/discussion/' + cityId + '/threads/' + threadId,
         type: 'GET',
         format: 'json',
         crossDomain: 'true',
         xhrFields: {
            withCredentials: true
         },
         data: {
            limit: limit,
            page: page,
            responseGroup: 'full',
            sortDirection: 'ascending',
            sortKey: 'creation_date',
            viewableOnly: viewableOnly
         }
      });
   };

   // Mustache templates
   discRC.templates = {
      // Individual RC entry
      rcEntry: '<li class="drc-entry">' + 
         '{{^singleWiki}}{{wiki.wiki}} . . {{/singleWiki}}' + 
         '{{#title}}<span class="drc-new" title="New post">N</span>{{/title}}{{^title}}<span class="drc-reply" title="New reply">R</span>{{/title}} . . ' +
         '(<span class="drc-view" data-city="{{wiki.id}}" data-thread="{{threadId}}"><a>view</a></span>) . . ' +
         '<span class="drc-title">{{#title}}<a href="//{{wiki.wiki}}.wikia.com/d/p/{{threadId}}">{{title}}{{/title}}{{^title}}<a href="//{{wiki.wiki}}.wikia.com/d/p/{{threadId}}/r/{{id}}">{{threadtitle}}{{/title}}</a></span> ' + 
         'on <span class="drc-forumname"><a href="//{{wiki.wiki}}.wikia.com/d/f?catId={{forumId}}">{{forumName}}</a></span>; ' + 
         '<span class="drc-timestamp">{{creationDate.dateString}}</span> . . ' + 
         '<span class="drc-creator"><a href="//{{wiki.wiki}}.wikia.com/wiki/User:{{createdBy.name}}">{{createdBy.name}}</a></span> '+ 
         '<span class="mw-usertoollinks">(<a href="//{{wiki.wiki}}.wikia.com/wiki/User talk:{{createdBy.name}}">wall</a> | <a href="//{{wiki.wiki}}.wikia.com/wiki/Special:Contributions/{{createdBy.name}}">contribs</a> | <a href="//{{wiki.wiki}}.wikia.com/d/u/{{createdBy.id}}">posts</a> | <a href="//{{wiki.wiki}}.wikia.com/wiki/Special:Block/{{createdBy.name}}">block</a>)</span> . . ' + 
         '<span class="drc-snippet">({{truncatedContent}})</span>' + 
         '</li>',
      mainPost: '<h2>{{post.title}}</h2>' +
            '<div class="drc-post-dlink"><a href="//{{wiki.wiki}}.wikia.com/d/p/{{post.id}}">View in Discussions ></a></div>' +
            '<div class="drc-post">' +
            '<div class="drc-post-avatar"><img src="{{post.createdBy.avatarUrl}}"/></div><div class="drc-post-author">{{post.createdBy.name}}' +
            ' &bull; <a href="//{{wiki.wiki}}.wikia.com/wiki/Special:Contributions/{{post.createdBy.name}}">contribs</a> &bull; <a href="//{{wiki.wiki}}.wikia.com/d/u/{{post.createdBy.id}}">posts</a></div>' +
            '<div class="drc-post-date">{{date}}</div>' +
            '<div class="drc-post-content">{{post.rawContent}}</div>' +
            '<div class="drc-post-category">in <a href="//{{wiki.wiki}}.wikia.com/d/f?catId={{post.forumId}}">{{post.forumName}}</a></div>' +
         '</div>',
      postReply: '<div class="drc-post-reply">' +
            '<div class="drc-post-avatar"><img src="{{post.createdBy.avatarUrl}}" /></div><div class="drc-post-author">{{post.createdBy.name}}' +
            ' &bull; <a href="//{{wiki.wiki}}.wikia.com/wiki/Special:Contributions/{{post.createdBy.name}}">contribs</a> &bull; <a href="//{{wiki.wiki}}.wikia.com/d/u/{{post.createdBy.id}}">posts</a></div>' +
            '<div class="drc-post-date"><a href="//{{wiki.wiki}}.wikia.com/d/p/{{post.threadId}}/r/{{post.id}}">{{date}}</a></div>' +
            '<div class="drc-post-content">{{post.rawContent}}</div>' +
         '</div>'
   };

   // Render a template using Mustache
   discRC.render = function(template, args) {
      return $(
         Mustache.render(template, args)
      );
   };

   /**
    * Truncate a string over a given length and add ellipsis if necessary
    * @param {string}  str - string to be truncated
    * @param {integer} limit - max length of the string before truncating
    * @return {string} truncated string
    */
   discRC.truncate = function(str, limit) {
      return (str.length < limit) ? str : str.substring(0, limit).replace(/.$/gi, '...');
   };

   // Pad numbers if 0-9 with an extra 0
   discRC.timePad = function(n) {
      return (n < 10) ? '0' + n : n;
   };

   // Loads posts and places them into discRC.entries
   discRC.generatePosts = function(wikis, page) {
      var promises = [];
      $.each(wikis, function(i, wiki) {
         var promise = dRCAPI.getPosts(wiki.id, 100, page, false, true).done(function(data) {
            if (data._embedded['doc:posts'].length > 0) {
               $.each(data._embedded['doc:posts'], function(i, post) {
                  var postDate = new Date(post.creationDate.epochSecond * 1000);
                  post.creationDate.dateString = discRC.timePad(postDate.getHours()) + ':' + discRC.timePad(postDate.getMinutes());
                  post.truncatedContent = discRC.truncate(post.rawContent, 50);
                  if (post.title === null) {
                     post.threadtitle = post._embedded.thread[0].title;
                  }
                  post.wiki = wiki;
                  post.singleWiki = wikis.length === 1;
                  discRC.entries.push({
                     time: postDate,
                     entry: discRC.render(discRC.templates.rcEntry, post)
                  });
               });
            } else {
               $('#discrc').prepend('Discussions is not available on the wiki ' + encodeURIComponent(wiki.wiki) + ' or there are no posts.');
            }
         }).fail(function() {
            $('#discrc').prepend('Discussions is not available on the wiki <b>' + encodeURIComponent(wiki.wiki) + '.wikia.com.</b>');
         });
         promises.push(promise);
      });
      $.when.apply(null, promises).then(function() {
         discRC.showAllPosts();
      });
   };

   // Shows all posts that have been stored in discRC.entries
   discRC.showAllPosts = function() {
      $('#discrc').append('<ul id="discrc-list"></ul>');
      discRC.entries.sort(function(a, b) {
         return a.time > b.time ? -1 : 1;
      });
      var currDate = new Date(1900, 1, 1);
      $.each(discRC.entries, function(i, e) {
         if (currDate.getDate() !== e.time.getDate() ||
             currDate.getMonth() !== e.time.getMonth() || 
             currDate.getFullYear() !== e.time.getFullYear()) {
            $('#discrc-list').append('<h2>' + e.time.getDate() + ' ' + wgMonthNames[e.time.getMonth() + 1] + ' ' + e.time.getFullYear() + '</h2>');
         }
         $('#discrc-list').append(e.entry);
         currDate = e.time;
      });
   };

   // Click events
   // @pre data-city is always a valid city ID
   discRC.events = function() {
      $('#discrc').on('click', '.drc-view', function() {
         var cityId = $(this).attr('data-city');
         var wiki = discRC.wikis.filter(function(wiki) {
            return wiki.id === cityId;
         })[0];
         var threadId = $(this).attr('data-thread');
         dRCAPI.getThread(cityId, threadId, 0, 100, false).then(function(thread) {
            // Format the date
            var date = new Date(thread.creationDate.epochSecond * 1000);
            date = discRC.timePad(date.getHours()) + ':' + discRC.timePad(date.getMinutes()) + ', ' + date.getDate() + ' ' + wgMonthNames[date.getMonth() + 1] + ' ' + date.getFullYear();
            // Fix avatar
            if (!thread.createdBy.avatarUrl) {
               thread.createdBy.avatarUrl = 'https://images.wikia.com/messaging/images/1/19/Avatar.jpg';
            }
            // Place into box
            $('#drc-view-post-' + threadId).append(
               discRC.render(
                  discRC.templates.mainPost, {
                     post: thread,
                     wiki: wiki,
                     date: date
                  }
               )
            );
            // For each post, put into box as well
            $.each(thread._embedded['doc:posts'], function(i, post) {
               // Format date
               var date = new Date(post.creationDate.epochSecond * 1000);
               date = discRC.timePad(date.getHours()) + ':' + discRC.timePad(date.getMinutes()) + ', ' + date.getDate() + ' ' + wgMonthNames[date.getMonth() + 1] + ' ' + date.getFullYear();
               // Fix avatar
               if (!post.createdBy.avatarUrl) {
                  post.createdBy.avatarUrl = 'https://images.wikia.com/messaging/images/1/19/Avatar.jpg';
               }
               $('#drc-view-post-' + threadId).append(
                  discRC.render(discRC.templates.postReply, {
                     post: post,
                     wiki: wiki,
                     date: date
                  })
               );
            });
         });
         $.showCustomModal('', '<div id="drc-view-post-' + threadId + '"></div>' , {
            id: 'drc-view-post',
            width: 600,
            buttons: []
         });
      });
   };

   // Loads wiki variables, checks if wikis have Discussions and
   // starts generating posts for each wiki
   discRC.init = function() {
      $('#discrc').empty();
      var loadWikiList = $('#discrc').data('wiki');
      var wikiLoadPromises = [];
      if (loadWikiList) {
         $.each(loadWikiList.split(','), function(i, wiki) {
            var promise = dRCAPI.getWikiVariables(wiki).done(function(data) {
               discRC.wikis.push({
                  id: $.grep(data.query.variables, function(e) {return e.id === 'wgCityId';})[0]['*'],
                  wiki: data.query.general.server.match(/\/\/(.*?)\.wikia\.com/)[1],
                  name: data.query.general.sitename
               });
            }).fail(function() {
               $('#discrc').prepend('An error occurred: Wiki <b>' + encodeURIComponent(wiki) + '.wikia.com</b> not found.<br/>');
            });
            wikiLoadPromises.push(promise);
         });
      } else {
         discRC.wikis.push({
            id: mw.config.get('wgCityId'),
            wiki: mw.config.get('wgServer').match(/\/\/(.*?)\.wikia\.com/)[1],
            name: mw.config.get('wgSiteName')
         });
      }
      // importStylesheetPage('MediaWiki:DiscussionsRC.css');

      $.when.apply(null, wikiLoadPromises).always(function() {
         discRC.generatePosts(discRC.wikis, 0);
         discRC.events();
      })
   };

   discRC.init();

   window.discRC = discRC;
})(jQuery, mediaWiki, Mustache);