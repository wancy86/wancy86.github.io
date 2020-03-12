// ==UserScript==
// @name         WIP Helper
// @namespace    https://wip.maxprocessing.com
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include        /^https?:\/\/139.146.176.236/
// @include        /^https?:\/\/10.19.1.185/
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

    var html = `
<div style="top: 0px;left: 0px;min-height:60px;margin-top:30px;">
    <select id="RecentWIP">
        <option value="-1">Select WIP...</option>
    </select>
    <input type="text" id="TaskId" placeholder="WIP Number" style="with:60px;">
    <button type="button" id="editTask">GO</button>
    <select style="width: 130px;" id="ChinaTeamAssign" title="Please select developer." tabindex="0" size="1" name="ChinaTeamAssign" class="">
        <option value="-1">Select User...</option>
        <option style="background-color: #F3F781" value="129" title="Please select developer.">1. Mark Wan</option>
        <option style="background-color: #F3F781" value="55" title="Please select developer.">2. Jeremiah</option>
        <option style="background-color: #F3F781" value="396" title="Please select developer.">3. Eric Chen</option>
        <option style="background-color: #F3F781" value="473" title="Please select developer.">4. Lucas Hu</option>
        <option style="background-color: #F3F781" value="232" title="Please select developer.">5. Miles Yao</option>
        <option style="background-color: #F3F781" value="332" title="Please select developer.">6. Purk Wu</option>
        <option style="background-color: #F3F781" value="166" title="Please select developer.">7. Lion Chen</option>
        <option style="background-color: #F3F781" value="387" title="Please select developer.">8. Abel Zhuzuoxin</option>
        <option style="background-color: #F3F781" value="533" title="Please select developer.">9. Alan Liu</option>
    </select>
    <!--Report-->
    <button type="button" id="showHistoryTool">History Tool</button>
    <button type="button" id="showReportTool">Report Tool</button>
    <div id="ReportToolDiv" class="hideTR">
        <div style="display:flex;justify-content:center;">
            <div style="display: flex;flex-direction: column;align-items: center;width: 900px;">
                <div id="WIPlists" style="width: 100%;display: flex;flex-direction: row;justify-content: space-between;">
                    <textarea name="" id="" cols="" rows="5" style="width: 100%;"></textarea>
                </div>
                <div style="align-self: flex-end;margin-top: 5px;">
                    <button id="getReport">Get Report</button>
                    <!--<button id="copyReport" >Copy Report</button>-->
                </div>
                <div id="reprotHtml" style="width: 100%;margin-top: 5px;min-height: 60px;border: 1px solid #CCC;background-color:#FFF;align-items:flex-start;text-align:left;">
                </div>
            </div>
        </div>
    </div>
    <!--History-->
    <div id="HistoryToolDiv" class="hideTR">
        <div style="display:flex;justify-content:center;">
            <div style="display: flex;flex-direction: column;align-items: center;width: 900px;">
                <div style="align-self: flex-end;margin-top: 5px;">
                    <button id="getHistory">Get History</button>
                </div>
                <div id="historyHtml" style="width: 100%;margin-top: 5px;min-height: 60px;border: 1px solid #CCC;background-color:#FFF;align-items:flex-start;text-align:left;">
                </div>
            </div>
        </div>
    </div>
</div>
<style>
.hideTR {
    display: none;
}
</style>
`;

    // setTimeout(function() {
    $('#shell').before(html);
    $('#contactinfo').css('padding', '10px 0');
    // }, 200);

    $('#RecentWIP').die().live('change', function() {
        if ($(this).val() != '-1') {
            $('#TaskId').val($(this).val());
            $('#editTask').click();
        }
    });

    window.RecentWIPs = localStorage.getItem('RecentWIPs');
    if (window.RecentWIPs) {
        window.RecentWIPs = window.RecentWIPs.split(',');
    } else {
        window.RecentWIPs = [];
    }

    redrawRecentWIP();

    function redrawRecentWIP(TaskId) {
        if (TaskId) {
            if (window.RecentWIPs.includes(TaskId)) {
                window.RecentWIPs.splice(window.RecentWIPs.indexOf(TaskId), 1);
            }
            window.RecentWIPs.unshift(TaskId);
            window.RecentWIPs = window.RecentWIPs.slice(0, 20);
            localStorage.setItem('RecentWIPs', window.RecentWIPs);
        }

        var opts = '<option value="-1">Select WIP...</option>';
        window.RecentWIPs.map(function(value, index) {
            opts += `<option value="${value}">${value}</option>`;
        })
        $('#RecentWIP').html('').html(opts);
    }

    $('#editTask').die().live('click', function() {
        var TaskId = $('#TaskId').val().trim();
        $('#TaskId').val(TaskId);
        if (/\d{5}/.test(TaskId) == false) {
            $('#TaskId').val('');
            return false;
        }

        redrawRecentWIP(TaskId);

        if (TaskId !== '') {
            console.log(TaskId);
            Communication.CustomRequest('WIP_MainMenu.max?preprocess=true', function() {
                Communication.LinkRequest('WIP_ItemEdit.max?TaskId=' + TaskId + '&t=' + ((new Date()).getTime()));
            });
        }
    });

    // ------------------------------------------------Assign
    $('#ChinaTeamAssign').die('change').live('change', function() {
        //WIP_OVERVIEW
        if ($('#middle').attr('vrmname') == "WIP_OVERVIEW") {
            $('#UserID').val($('#ChinaTeamAssign').val());
            $('#UserID').change();
            return;
        }

        // WIP_ITEMEDIT
        if ($('#middle').attr('vrmname') == "WIP_ITEMEDIT") {
            $('#AssignCR').val(55); // 129 Mark, 55 Jeremiah
            $('#AssignedToDev').val($('#ChinaTeamAssign').val());
            $('#ChinaTeamAssign').val('');
            $('#WorkflowStepId').val(19);
            $('#StatusTypeId').val(3);
            if ($('#StartDate').val() == '') {
                $('#StartDate').val((new Date()).toLocaleDateString());
            }
            if($('#EstimatedDuration').val()=='0' || $('#EstimatedDuration').val()==''){
                $('#EstimatedDuration').val(480);
            }
            $('#Save').click();
        }

    });

    $('#TaskId').die().live('keypress', function(event) {
        if (event.which == '13') {
            $('#editTask').click();
        }
    });

    // ----------------------------------------------------------------------------------Reprot
    // get report
    $('#showReportTool').die().live('click', function(event) {
        $('#ReportToolDiv').toggleClass('hideTR');
        $('#WIPlists textarea:eq(0)').html((localStorage.getItem('WIPTA_0')||'').split(',').join(' '));
        if($('#middle').attr('vrmname') != 'WIP_OVERVIEW' && $('#middle').attr('vrmname') != 'WIP_ItemEdit'){
           Communication.LinkRequest('WIP_OverView.max');
        }
    });

    // textarea change event
    $('#WIPlists textarea').die().live('change', function(event) {
        // format date, trim space
        var ls = $(this).val();
        var wipreg = /[1-9]\d{4}/mg;
        var r = ls.match(wipreg);
        r.sort();
        var b = [];
        r.forEach( function(element, index) {
            if(b.indexOf(element)<0){
                b.push(element)
            }
        });
        ls = b.join(' ');
        $(this).val(ls);

        var index = $('#WIPlists textarea').index($(this));
        console.log('xxx: ', index);
        var storageID = 'WIPTA_' + index;

        var lsarr = ls.split(' ')
        console.log('lsarr: ', lsarr);
        lsarr = lsarr.map(function(v) {
            return v.trim();
        });
        lsarr = lsarr.filter(function(v) {
            var reg = /^\d{5}$/;
            return reg.test(v);
        });

        // update localStorage
        localStorage.setItem(storageID, lsarr);
        localStorage.setItem('WIPTA_NUM', $('#WIPlists textarea').length);
        $(this).val(lsarr.join(' '));
    });

    $('#getReport').die().live('click', function(event) {
        $('#reprotHtml').html('');
        var WIPTA_NUM = localStorage.getItem('WIPTA_NUM') || 0;
        for (var i = 0; i < WIPTA_NUM; i++) {
            var storageID = 'WIPTA_' + i;
            var wips = localStorage.getItem(storageID);
            if(!wips) continue;
            console.log(storageID,wips);
            // array auto convert to join with ,
            getItemsInfo2(wips.split(','));
        }
    });

    // ----------------------------------------------Histoty tab
    $('#showHistoryTool').die().live('click', function(event) {
        $('#HistoryToolDiv').toggleClass('hideTR');
        $('#historyHtml').html('');
    });
    $('#getHistory').die().live('click', function(event) {
        var hisdata = {
            AJAX_ACTION: 'Tab_History',
            Current_USRID: 129,
            TaskID: $("#TaskId").val(),
            t: (new Date()).getTime()
        }
        Communication.CustomRequest('https://wip.maxprocessing.com/WIP_OverViewAjax.max?' + $.param(hisdata), function(resp) {
            $('#historyHtml').html(resp);
        });
    });

    // ----------------------------------------------get report info for WIP
    function getItemsInfo2(wips) {
        Global.ShowProgress();
        var arr = [];
        var ps = [];
        wips.forEach(function(wip, index) {
            var p = new Promise(function(resolve, reject) {
                Communication.CustomRequest('WIP_WorkLogEntry.max?AJAX_ACTION=GetTaskInfo&TaskId=' + wip, function(resp) {
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

        var colorArr = {
            'Incomplete Requirements': '#ead308',
            'Open': '#ead308',
            'Assigned': '#03A9F4',
            'In Progress': '#ff9800',
            'On Hold': '#17de1f',
            'On Hold - Pending Other Item': '#17de1f',
            'On Hold - Need More Info': '#17de1f',
            'On Hold - Client Requested': '#17de1f',
            'Code Review': '#17de1f',
            'CR Return': '#17de1f',
            'CR Rejection': '#FF0000',
            'CR Approved': '#17de1f',
            'QA R1': '#17de1f',
            'QA R1 Approved': '#17de1f',
            'QA R1 Rejection': '#FF0000',
            'QA Return': '#FF0000',
            'QA': '#17de1f',
            'QA Approved': '#17de1f',
            'QA Rejection': '#FF0000',
            'Client Rejection': '#FF0000',
            'Client Rejection (Live)': '#FF0000',
            'Client Rejection (TBT)': '#FF0000',
            'Client Rejection (Test)': '#FF0000',
            'Client Rejection (UAT)': '#FF0000',
            'Closed - In Client Review (Waiting Client Approval)': '#17de1f',
            'Closed - Client Approved': '#17de1f',
            'Closed - Client Approved (Need to Upload Live)': '#17de1f',
            'Closed - Client Approved (Need to Upload to TBT)': '#17de1f',
            'Closed - Client Approved (Need to Upload to UAT)': '#17de1f',
            'Closed - Client Approved Uploaded Live': '#17de1f',
            'Closed - Client Requested': '#17de1f',
            'Closed - Code Delivered': '#17de1f',
            'Closed - Duplicate': '#17de1f',
            'Closed - Uploaded Live (Waiting Client Approval)': '#17de1f',
            'Closed - Uploaded TBT (Waiting Client Approval)': '#17de1f',
            'Closed - Uploaded Test (Waiting Client Approval)': '#17de1f',
            'Closed - Uploaded UAT (Waiting Client Approval)': '#17de1f',
            'CR Rejection - Invalid': '#FF0000',
            'QA R1 Rejection - Invalid': '#FF0000',
            'QA Rejection - Invalid': '#FF0000',
            'Client Rejection - Invalid': '#FF0000',
            'Client Rejection (Test) - Invalid': '#FF0000',
            'Client Rejection (TBT) - Invalid': '#FF0000',
            'Client Rejection (UAT) - Invalid': '#FF0000',
            'Client Rejection (Live) - Invalid': '#FF0000'
        }

        var userColor = {
            'Mark (WanXi) Xiao': '#5967e4',
            'Jeremiah': '#2196F3',
            'Eric (ZhiChao) Chen': '#f058ff',
            'Lucas (Weihong) Hu': '#10e8e2',
            'Miles (Guanwei) Yao': '#8BC34A',
            'Purk (Fan) Wu': '#c58e35',
            'Lion Chen': '#2196F3',
            'Abel Zhuzuoxin': '#2196F3',
            'Alan Liu': '#2196F3'
        }

        Promise.all(ps).then(function() {
            // arr.sort(function(a, b) { return a.StatusType == b.StatusType ? 0 : (a.StatusType > b.StatusType ? 1 : -1) });
            arr.sort(function(a, b) { return a.UserName == b.UserName ? 0 : (a.UserName > b.UserName ? 1 : -1) });
            var repstr = '\n';
            arr.forEach(function(item, index) {
                repstr += `<p style="margin:0px 5px;">${index+1}. ${item.WIP} ${item.TaskName} <br><span style="color:${userColor[item.UserName]};">${item.UserName} </span> <span style="color:${colorArr[item.StatusType]};">${item.StatusType} </span></p>`;
            });
            console.log('repstr:',repstr);
            $('#reprotHtml').html($('#reprotHtml').html()+'\n'+repstr);
            Global.HideProgress();
        });
    }

    $('#copyReport').die().live('click', function(event) {
        // copy to clipboard
        selectText("reprotHtml");
        document.execCommand('copy');
    });

    function selectText(element) {
    var text = document.getElementById(element);
        var range;
    if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) {
        var selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        alert("none");
    }
}

    // ----------------------------------------------------------------------------------
    // helper functions
    window.getItemsInfo = function(wips) {
        if($('#middle').attr('vrmname') != 'WIP_OverView')
          Communication.LinkRequest('WIP_OverView.max');

        var arr = [];
        var ps = [];
        wips.forEach(function(wip, index) {
            var p = new Promise(function(resolve, reject) {
                Communication.CustomRequest('WIP_WorkLogEntry.max?AJAX_ACTION=GetTaskInfo&TaskId=' + wip, function(resp) {
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
