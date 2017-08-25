// ==UserScript==
// @name         WIP Tool Bar
// @namespace    https://wip.maxprocessing.com
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://wip.maxprocessing.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  setTimeout(function() {
    $('#UserName').val('mwan');
    $('#password').val('123123123');
    $('#Login').click();
  }, 1000);


  var html = '';
  html += '<div style="top: 0px;left: 0px;height:60px;">';
  html += '    <input type="text" id="TaskId">';
  html += '    <button type="button" id="editTask">GO</button>';
  html += '</div>';

  setTimeout(function() {
    $('#top').html('').append(html);
    $('#contactinfo').html('');
  }, 3000);


  $('#editTask').die().live('click', function() {
    var TaskId = $('#TaskId').val().trim();
    if (TaskId !== '') {
      console.log(TaskId);
      Communication.CustomRequest('WIP_MainMenu.max?preprocess=true', function() {
        Communication.LinkRequest('WIP_ItemEdit.max?TaskId=' + TaskId + '&t=' + ((new Date()).getTime()));
      });
    }
  });

  $('#TaskId').die().live('keypress', function(event) {
    if (event.which == '13') {
      $('#editTask').click();
    }
  });

  // Your code here...
  window.getItemInfo = function(wip, lastone) {
    Communication.CustomRequest('https://wip.maxprocessing.com/WIP_WorkLogEntry.max?AJAX_ACTION=GetTaskInfo&TaskId=' + wip, function(resp) {
      var info = $.parseJSON(resp);
      var data = {
        UserName: info.UserName,
        WIP: wip,
        StatusType: info.StatusType,
        TaskName: info.TaskName
      };
      window.arr.push(data);
      if (lastone) {
        window.arr.sort(function(a, b) {
          var aa = a.UserName;
          var bb = b.UserName;
          return aa > bb ? 1 : (aa == bb ? 0 : -1);
        });
        console.log(window.arr);
      }
    });
  };

  window.getItemsInfo = function(wips) {
        Communication.LinkRequest('https://wip.maxprocessing.com/WIP_OverView.max?preprocess=true');
        window.arr = [];
        for (var i = wips.length - 1; i >= 0; i--) {
          var wip = wips[i];
          var lastone = (i === 0) ? 1 : 0;
          getItemInfo(wip, lastone);
        }
  };
})();




