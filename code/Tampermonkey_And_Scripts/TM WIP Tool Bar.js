// ==UserScript==
// @name         WIP Tool Bar
// @namespace    https://wip.maxprocessing.com
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include        /^https?:\/\/139.146.176.236/
// @include        /^https?:\/\/wip.maxprocessing.com/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    setTimeout(function() {
        $('#UserName').val('mwan');
        $('#password').val('123123123');
        $('#Login').click();
    }, 1000);

    var html =
        `
  <div style="top: 0px;left: 0px;height:60px;margin-top:30px;">
      <select id="RecentWIP">
        <option value="-1">Select WIP...</option>
      </select>  
      <input type="text" id="TaskId" placeholder="WIP Number">
      <button type="button" id="editTask">GO</button>
      <select style="width: 200px;" id="ChinaTeamAssign" title="Please select developer." tabindex="0" size="1" name="ChinaTeamAssign" class="">
          <option value="-1">Select Developer...</option>
          <option style="background-color: #F3F781" value="129" title="Please select developer.">Mark Wan</option>
          <option style="background-color: #F3F781" value="500" title="Please select developer.">Nash Xu</option>
          <option style="background-color: #F3F781" value="396" title="Please select developer.">Eric Chen</option>
          <option style="background-color: #F3F781" value="473" title="Please select developer.">Lucas Hu</option>
          <option style="background-color: #F3F781" value="469" title="Please select developer.">Deane Ding</option>
          <option style="background-color: #F3F781" value="387" title="Please select developer.">Abel Zhuzuoxin</option>
          <option style="background-color: #F3F781" value="533" title="Please select developer.">Alan Liu</option>
          <option style="background-color: #F3F781" value="512" title="Please select developer.">Tim Luo</option>
          <option style="background-color: #F3F781" value="166" title="Please select developer.">Lion Chen</option>
          <option style="background-color: #F3F781" value="232" title="Please select developer.">Miles Yao</option>
          <option style="background-color: #F3F781" value="332" title="Please select developer.">Purk Wu</option>
          <option style="background-color: #F3F781" value="110" title="Please select developer.">Ying Wang</option>
          <option style="background-color: #F3F781" value="37" title="Please select developer. (Team Leader)">Simon Qu ♥</option>
      </select>
  </div>
  `;

    setTimeout(function() {
        $('#shell').before(html);
        $('#contactinfo').css('padding', '10px 0');
    }, 200);

    $('#RecentWIP').die().live('change', function() {
        if ($(this).val() != '-1') {
            $('#editTask').click();
        }
    });


    window.RecentWIPs = [];
    function redrawRecentWIP(){
        var opts = '<option value="-1">Select WIP...</option>';
        window.RecentWIPs.map(function (value, index) {
            opts += `<option value="${value}">${value}</option>`;
        })
        $('#RecentWIP').html('').html(opts);
    }

    $('#editTask').die().live('click', function() {
        var TaskId = $('#TaskId').val().trim();
        $('#TaskId').val(TaskId);

        window.RecentWIPs = window.RecentWIPs.reverse();
        window.RecentWIPs.push(TaskId);
        window.RecentWIPs = window.RecentWIPs.reverse();
        window.RecentWIPs = window.RecentWIPs.slice(0,10);
        redrawRecentWIP();

        if (TaskId !== '') {
            console.log(TaskId);
            Communication.CustomRequest('WIP_MainMenu.max?preprocess=true', function() {
                Communication.LinkRequest('WIP_ItemEdit.max?TaskId=' + TaskId + '&t=' + ((new Date()).getTime()));
            });
        }
    });

    $('#ChinaTeamAssign').die('change').live('change', function() {
        //WIP_OVERVIEW
        if ($('#middle').attr('vrmname') == "WIP_OVERVIEW") {
            $('#UserID').val($('#ChinaTeamAssign').val());
            $('#UserID').change();
            return;
        }

        // WIP_ITEMEDIT
        if ($('#middle').attr('vrmname') == "WIP_ITEMEDIT") {
            $('#AssignCR').val(129);
            $('#AssignedToDev').val($('#ChinaTeamAssign').val());
            $('#ChinaTeamAssign').val('');
            $('#WorkflowStepId').val(19);
            $('#StatusTypeId').val(3);
            if ($('#StartDate').val() == '') {
                $('#StartDate').val((new Date()).toLocaleDateString());
            }
            $('#Save').click();
        }

    });

    $('#TaskId').die().live('keypress', function(event) {
        if (event.which == '13') {
            $('#editTask').click();
        }
    });

    window.getItemsInfo = function(wips) {
        Communication.LinkRequest('https://wip.maxprocessing.com/WIP_OverView.max');

        var arr = [];
        var ps = [];
        wips.forEach(function(wip, index) {
            var p = new Promise(function(resolve, reject) {
                Communication.CustomRequest('https://wip.maxprocessing.com/WIP_WorkLogEntry.max?AJAX_ACTION=GetTaskInfo&TaskId=' + wip, function(resp) {
                    var info = $.parseJSON(resp);
                    var data = {
                        WIP: wip,
                        StatusType: info.StatusType,
                        UserName: info.UserName,
                        TaskName: info.TaskName
                    };
                    arr.push(data);
                    resolve();
                });
            })
            ps.push(p);
        });

        Promise.all(ps).then(function() {
            arr.sort(function(a, b) { return a.StatusType == b.StatusType ? 0 : (a.StatusType > b.StatusType ? 1 : -1) });
            //QA Upload
            var qastr = '\n',
                statusstr = '\n',
                usestr = '\n';
            arr.forEach(function(item, index) {
                qastr += `WIP# ${item.WIP}: ${item.TaskName}\n`;
                statusstr += `${item.WIP} - ${item.StatusType} - ${item.TaskName}\n`;
                usestr += `${item.WIP} - ${item.StatusType} - ${item.UserName} - ${item.TaskName}\n`;
            });
            console.log('\n\nQA Upload: ', qastr);
            console.log('\n\nItem Status: ', statusstr);
            console.log('\n\nUser Item List: ', usestr);
        });
    };


    window.checkTest = function() {
        // check all file checkbox
        $(':checkbox[title="Please check here if this file has been uploaded to the test environment."]').each(function() {
            $(this).attr('checked', 1);
            CustomScript.setUpTest(this);
        });
    }
    window.checkUAT = function() {
        $(':checkbox[title="Please check here if this file has been uploaded to the UAT environment."]').each(function() {
            $(this).attr('checked', 1);
            CustomScript.setUpUAT(this);
        });
    };

    window.listFile = function() {
        var fl = '',
            fl2 = '';
        $('#tbw_div_UplList1 tbody tr').each(function() {
            var file = $(this).find('td :input').eq(0).val();
            var version = $(this).find('td :input').eq(1).val();
            fl += file + ' ' + version + '\n';
            fl2 += file + '\n';
        });
        console.log(fl);
        console.log(fl2);
    };
    window.lk = window.listFile;

    window.logrep = () => {
        $('#sREP_ID').val(81);
        $('#sREP_ID').change();

        setTimeout(() => {
            var start = new Date();
            start.setDate(1);
            var end = new Date();
            end.addMonths(1);
            end.setDate(0);
            $('#sRPT_ID').val(3);
            $('#sAHR_EmailAddress').val('mwan@maxprocessing.com');
            $('#Par_48').val(129)
            $('#Par_49').val(start.toLocaleDateString());
            $('#Par_50').val(end.toLocaleDateString());
            $('#Save').click();
        }, 1000);
    }

    setTimeout(function() {
        window.maxajax = function(options) {
            // url, data, success
            return new Promise(function(resolve, reject) {
                var replaceID = function(resp) {
                    options.success(resp);
                    resolve();
                }
                Communication.CustomRequest(options.url, replaceID, null, $.param(options.data));
            })
        }
    }, 10000);
})();