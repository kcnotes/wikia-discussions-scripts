/* global require, console */
/**
 * <nowiki>
 * FormToDiscussions
 * A way of creating a form that posts to Discussions. 
 * Designed to be easy to create your own special form for your custom needs!
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
        form: 'Insert form here',
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


    /**
     * Embeds a form into the div
     * @param {Object} options options for the form to be placed
     */
    ftd.initForm = function (options) {
        var location = $('#FormToDiscussions-' + options.id);
        console.log(options);
        location.append(options.form);
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
    }

    ftd.init();
});