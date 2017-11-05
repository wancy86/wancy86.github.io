// ==UserScript==
// @name         Auto Reload QA
// @namespace    AGCS
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://www.maxprocessing.com:5702/login.max?preprocess=true
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var html = '';
    html += '<div style="top: 0px;left: 0px;height:30px;margin-top:30px;">';
    html += '    <input type="text" id="pageName">';
    html += '    <button type="button" id="linkToPage">Reload</button>';
    html += '</div>';

    setTimeout(function() {
      $('#outerBanner').html('').append(html);
    }, 1000);

    $('#linkToPage').die().live('click', function() {
      var pageName = $('#pageName').val().trim();
      if (pageName === '') {
        pageName = $('#middle').attr('vrmname');
      }
      console.log(pageName);
      Communication.LinkRequest(pageName + '.max');
    });

    $('#pageName').die().live('keypress', function(event) {
      if (event.which == '13') {
        $('#linkToPage').click();
      }
    });
    // Your code here...
})();