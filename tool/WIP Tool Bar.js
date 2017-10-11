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
  }, 500);

  var html = '';
  html += '<div style="top: 0px;left: 0px;height:60px;margin-top:30px;">';
  html += '    <input type="text" id="TaskId">';
  html += '    <button type="button" id="editTask">GO</button>';
  html += '</div>';

  setTimeout(function() {
    $('#top').html('').append(html);
    $('#contactinfo').html('');
  }, 4000);

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
      //console.log(info);
      var data = {
        StatusType: info.StatusType,
        WIP: wip,
        UserName: info.UserName,
        TaskName: info.TaskName
      };
      window.arr.push(data);
      if (lastone) {
        window.arr.sort(function(a, b) {
          var aa = a.StatusType;
          var bb = b.StatusType;
          return aa > bb ? 1 : (aa == bb ? 0 : -1);
        });
        console.log(window.arr);
        // var str = '';
        // for (var i = 0; i < window.arr.length; i++) {
        //   str += 'wip: ' + arr[i].wip + ', ' + 'StatusType: ' + arr[i].StatusType + ', ' + 'UserName: ' + arr[i].UserName + ', ' + 'TaskName: ' + arr[i].TaskName + '\n';
        // }
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
