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
        specialPage: 'DiscussionsForm'
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

    ftd.initForm = function (options) {

    };
    
    // Only load the form on the page when the div (with ID) exists
    ftd.options.forEach(function(formOptions) {
        if (!formOptions.id) return;
        if (formOptions.specialPage) {
            if (mw.config.get('wgCanonicalNamespace') === 'Special' && 
                mw.config.get('wgPageName') === formOptions.specialPage) {
                console.log('Form loaded on Special page: ' + formOptions.id);
            }
        }
        if ($('#FormToDiscussions-' + formOptions.id).length !== 0) {
            console.log('Form loaded in div: ' + formOptions.id);
            ftd.initForm(formOptions);
        }
    });
});