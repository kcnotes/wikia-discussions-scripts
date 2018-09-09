/* global require, console */
/**
 * <nowiki>
 * FormToDiscussions
 * A way of creating a form that posts to Discussions. 
 * Designed to be easy to create your own special form for your custom needs!
 * 
 * Please test this script on a test wiki before implementing it on your own.
 * 
 * Usage: 
 * Coming soon
 * @author Noreplyz
 */

window.formToDiscussions = [
    {
        id: 'test',
        specialPage: 'DiscussionsForm',
        specialPageTitle: 'Interlanguage link requests',
        form: '<p>From wiki: {{#input}}wikiFrom|community{{/input}}</p>' + 
              '<p>To wiki: {{#input}}wikiTo|de.community{{/input}}</p>' + 
              '<p>Comment: {{#textarea}}comment|Enter a comment here --> & gl{{/textarea}}</p>',
        format: 'Insert Discussions format here'
    }

];

require([
    'wikia.window',
    'jquery',
    'mw',
    'wikia.mustache'
], function (window, $, mw, Mustache) {
    'use strict';
    // Load form in places where it is required
    var ftd = {};
    ftd.options = window.formToDiscussions;
    if (ftd.options.length === 0) return;

    var mustacheFormElements = {
        // {{#input}}id|placeholder{{/input}}
        input: function() {
            return function(text) {
                text = text.trim();
                if (text === '')
                    return 'Parse error: &lt;input&gt; tag had no ID.<br/>';

                var params = text.split('|'),
                    id = mw.html.escape(params[0]),
                    placeholder = '';
                
                if (params.length === 2)
                    placeholder = mw.html.escape(params[1]);
                
                return '<input class="FTD-input" id="' + id + '" placeholder="' + placeholder + '" />';
            };
        },

        // {{#textarea}}id|placeholder{{/textarea}}
        textarea: function () {
            return function (text) {
                text = text.trim();
                if (text === '')
                    return 'Parse error: &lt;input&gt; tag had no ID.<br/>';

                var params = text.split('|'),
                    id = mw.html.escape(params[0]),
                    placeholder = '';

                if (params.length === 2)
                    placeholder = mw.html.escape(params[1]);

                return '<textarea class="FTD-input" id="' + id + '" placeholder="' + placeholder + '" />';
            };
        },
    };

    /**
     * Parses the Mustache template
     * @param {*} rawForm 
     */
    ftd.parseForm = function(rawForm) {
        return Mustache.render(rawForm, mustacheFormElements);
    };

    /**
     * Embeds a form into the div
     * @param {Object} options options for the form to be placed
     */
    ftd.initForm = function (options) {
        var location = $('#FormToDiscussions-' + options.id);
        console.log(options);
        var parsedForm = ftd.parseForm(options.form);
        location.append(parsedForm);
    };
    
    /**
     * Start the script - calls loadForm on all forms that 
     * should exist on the current page
     */
    ftd.init = function () {
        // Only load the form on the page when the div (with ID) exists
        // If it isn't a special page, insert multiple forms
        ftd.options.forEach(function (formOptions) {
            if (!formOptions.id || !formOptions.form) {
                console.warn('FormToDiscussions: You must provide an ID and the form code to use this script.');
                return;
            }
            // For special pages, make some interface changes
            if (formOptions.specialPage) {
                if (mw.config.get('wgCanonicalNamespace') === 'Special' && mw.config.get('wgTitle') === formOptions.specialPage) {
                    if (!formOptions.specialPageTitle) {
                        formOptions.specialPageTitle = 'Post to Discussions';
                    }
                    $('h1.page-header__title').text(formOptions.specialPageTitle);
                    document.title = formOptions.specialPageTitle + ' | ' + mw.config.get('wgSiteName') + ' | FANDOM powered by Wikia';
                    $('#WikiaArticle').empty().append($('<div/>', {
                        id: 'FormToDiscussions-' + formOptions.id
                    }));
                }
            }
            // Load the (latest) form
            if ($('#FormToDiscussions-' + formOptions.id).length !== 0) {
                ftd.initForm(formOptions);
            }
        });
    };

    ftd.init();
});