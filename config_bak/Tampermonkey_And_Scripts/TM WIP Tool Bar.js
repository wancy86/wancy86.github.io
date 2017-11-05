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
  
  html += '    <select style="width: 200px;" id="ChinaTeamAssign" title="Please select developer." tabindex="0" size="1" name="ChinaTeamAssign" class="">';
  html += '        <option value="-1">Select Developer...</option>';
  html += '        <option style="background-color: #F3F781" value="396" title="Please select developer.">Eric Chen</option>';
  html += '        <option style="background-color: #F3F781" value="469" title="Please select developer.">Nangen Ding</option>';
  html += '        <option style="background-color: #F3F781" value="473" title="Please select developer.">Lucas Hu</option>';
  html += '        <option style="background-color: #F3F781" value="500" title="Please select developer.">Xiaocong Xu</option>';
  html += '        <option style="background-color: #F3F781" value="534" title="Please select developer.">Wendy Li</option>';
  html += '        <option style="background-color: #F3F781" value="129" title="Please select developer.">Mark Wan</option>';
  html += '        <option style="background-color: #F3F781" value="441" title="Please select developer.">Rich Li</option>';
  html += '        <option style="background-color: #F3F781" value="462" title="Please select developer.">Frank Huang</option>';
  html += '        <option style="background-color: #F3F781" value="387" title="Please select developer.">Abel Zhuzuoxin</option>';
  html += '        <option style="background-color: #F3F781" value="533" title="Please select developer.">Alan Liu</option>';
  html += '        <option style="background-color: #F3F781" value="512" title="Please select developer.">Chenghang Luo</option>';
  html += '        <option style="background-color: #F3F781" value="166" title="Please select developer.">Lion Chen</option>';
  html += '        <option style="background-color: #F3F781" value="232" title="Please select developer.">Miles Yao</option>';
  html += '        <option style="background-color: #F3F781" value="332" title="Please select developer.">Purk Wu</option>';
  html += '        <option style="background-color: #F3F781" value="110" title="Please select developer.">Ying Wang</option>';
  html += '        <option style="background-color: #F3F781" value="37" title="Please select developer. (Team Leader)">Simon Qu ♥</option>';
  html += '    </select>';
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

  $('#ChinaTeamAssign').die('change').live('change', function() {
    if ($('#AssignCR').length && $('#AssignedToDev').length) {
        $('#AssignCR').val(129);
        $('#AssignedToDev').val($('#ChinaTeamAssign').val());
        $('#ChinaTeamAssign').val('');
        $('#Save').click();
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
