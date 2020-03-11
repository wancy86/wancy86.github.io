// ==UserScript==
// @name         WIP助手
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://wip.maxprocessing.com/login.max?*
// @grant        none
// ==/UserScript==
(function() {
    'use strict';

    function createItem(v) {
        var item = $('<div style="position: relative; display: inline;">\
                <input style="width: 60px;" type="text"></input>\
                <button>+</button>\
                <button>-</button>\
            </div>');
        if (v) {
            item.find('input').val(v);
        }
        item.find('button:contains(+)').bind('click', function() {
            $(this).closest('div').after(createItem());
            $('[category=saveItems]').fadeIn('slow');
        });
        item.find('button:contains(-)').bind('click', function() {
            $(this).closest('div').remove();
            $('[category=saveItems]').fadeIn('slow');
        });
        return item;
    }

    function saveItem() {
        localStorage.clear();
        $('[category=item_list]').find('input').each(function(index) {
            var value = $.trim($(this).val());
            if (value) {
                $(this).val(value);
                localStorage.setItem(index, value);
            } else {
                $(this).closest('div').remove();
            }
        });
    }



    function displayReport(itemList) {
        var reportContainer = '<div style="position: fixed;left: 80px;top: 40px;width: 1000px;height: 800px;z-index: 100;background-color: white;" > <iframe style="width: 1000px; height: 800px;" id="reportIframe"></iframe> <div><button category="closeReport">关闭 </button></div></div>';
        var style = '<style> @font-face {font-family: 宋体; panose-1: 2 1 6 0 3 1 1 1 1 1; } @font-face {font-family: "Cambria Math"; panose-1: 2 4 5 3 5 4 6 3 2 4; } @font-face {font-family: 等线; panose-1: 2 1 6 0 3 1 1 1 1 1; } @font-face {font-family: Calibri; panose-1: 2 15 5 2 2 2 4 3 2 4; } @font-face {font-family: "\@宋体"; panose-1: 2 1 6 0 3 1 1 1 1 1; } @font-face {font-family: "\@等线"; panose-1: 2 1 6 0 3 1 1 1 1 1; } p.MsoNormal, li.MsoNormal, div.MsoNormal {margin: 0cm; margin-bottom: .0001pt; text-align: justify; text-justify: inter-ideograph; font-size: 10.5pt; font-family: 等线; } a:link, span.MsoHyperlink {mso-style-priority: 99; color: #0563C1; text-decoration: underline; } a:visited, span.MsoHyperlinkFollowed {mso-style-priority: 99; color: #954F72; text-decoration: underline; } span.EmailStyle17 {mso-style-type: personal-compose; font-family: 等线; color: windowtext; } p.xxxxmsonormal, li.xxxxmsonormal, div.xxxxmsonormal {mso-style-name: x_xxxmsonormal; margin: 0cm; margin-bottom: .0001pt; font-size: 12.0pt; font-family: 宋体; } p.xxxxmsolistparagraph, li.xxxxmsolistparagraph, div.xxxxmsolistparagraph {mso-style-name: x_xxxmsolistparagraph; margin: 0cm; margin-bottom: .0001pt; font-size: 12.0pt; font-family: 宋体; } .MsoChpDefault {mso-style-type: export-only; font-family: 等线; } /* Page Definitions */ @page WordSection1 {size: 612.0pt 792.0pt; margin: 72.0pt 90.0pt 72.0pt 90.0pt; } div.WordSection1 {page: WordSection1; } ol {margin-bottom: 0cm; } ul {margin-bottom: 0cm; } </style>';
        var contentContainer = '<div class=WordSection1> <p class=xxxxmsonormal><span lang=EN-US style="font-size:10.5pt;font-family:等线;color:#212121">Hi Simon,<o:p></o:p></span></p> <p class=xxxxmsonormal><span lang=EN-US style="font-size:10.5pt;font-family:等线;color:#212121"><o:p>&nbsp;</o:p></span></p> <div category="content"></div> <p class=MsoNormal><span lang=EN-US><o:p>&nbsp;</o:p></span></p> <p class=MsoNormal><span lang=EN-US><o:p>&nbsp;</o:p></span></p> </div>';
        var projectLine = '<p class=xxxxmsonormal style="text-indent:21.0pt"><span lang=EN-US style="font-size:10.5pt;font-family:等线;color:#212121">{projectDesc}:</span><span lang=EN-US style="color:#212121"><o:p></o:p></span></p>';
        var itemLine = '<p class=xxxxmsolistparagraph category="{projectName}" style="margin-left:63.0pt"> <span lang=EN-US style="font-family:Calibri,sans-serif;color:#212121">{itemDesc}&nbsp;</span> <b><span lang=EN-US style="font-family:Calibri,sans-serif;color:#548235;mso-style-textfill-fill-color:#548235;mso-style-textfill-fill-alpha:100.0%">{itemStatus}</span></b> <span lang=EN-US style="font-family:Calibri,sans-serif;color:#212121"> <o:p></o:p></span></p>';
        $('body').append(reportContainer);
        $('button[category=closeReport]').bind('click', function() {
            $('#reportIframe', window.parent.document).closest('div').remove();
        });
        $($('#reportIframe')[0].contentWindow.document.head).append(style);
        var content = $(contentContainer);
        var projectList = [];
        itemList.sort(function(a, b) { return a.index - b.index; });
        $.each(itemList, function(key, item) {
            if (projectList.indexOf(item.projectName) == -1) {
                projectList.push(item.projectName);
            }
            content.find('div[category=content]').append(itemLine.replace('{itemDesc}', item.taskID + ':  ' + item.taskTitle).replace('{itemStatus}', item.StatusType).replace('{projectName}', item.projectName));
        });
        $.each(projectList, function(key, project) {

            content.find('div[category=content]>p[category=' + project + ']:eq(0)').before(projectLine.replace('{projectDesc}', project));
        });
        $($('#reportIframe')[0].contentWindow.document.body).append(content);

    }
    var dailyReportBtn = $('<button style="position: fixed;left: 10px;top: 10px;" category="getReport">获取日报</button><button style="position: fixed;left: 80px;top: 10px;display:none;" category="saveItems">保存items</button><input type="text" style="position: fixed;left: 160px;top: 10px;width:70px;" category="searchInput" /><button style="position: fixed;left: 230px;top: 10px;" category="searchItem">go</button><button style="position: fixed;left: 10px;top: 850px;" category="getFiles">获取文件列表</button>');


    var itemListContainer = $('<div style="position: fixed; left: 10px; top: 40px;width:120px;" category="item_list"></div>');

    $('body').append(dailyReportBtn).append(itemListContainer);

    function getReport() {
        var itemList = [];
        var goalCnt = $('[category=item_list]').find('input').length;
        var realCnt = 0;
        $('[category=item_list]').find('input').each(function(index) {

            var taskID = $(this).val();

            Communication.CustomRequest('WIP_WorkLogEntry.max?TaskId=' + taskID + '&AJAX_ACTION=GetTaskInfo&t=' + Math.random(), function(resp) {
                var result = jsonParse(resp);
                realCnt += 1;
                var projectName;
                switch (result.ProjectName) {
                    case 'Olympus Insurance Company (OIC)':
                        projectName = 'OIC';
                        break;
                    case 'Legacy Insurance Services':
                        projectName = 'LIS';
                        break;
                    case 'Allianz Global Corporate & Specialty (AGCS)':
                        projectName = 'AGCS';
                        break;
                    case 'WEA Trust':
                        projectName = 'WEA';
                        break;
                    case 'Chautauqua (CHA)':
                        projectName = 'CHA';
                        break;
                }
                var StatusType = result.StatusType;
                var taskTitle = result.TaskName;
                itemList.push({ index: index, taskID: taskID, projectName: projectName, StatusType: StatusType, taskTitle: taskTitle });
                console.log(index, taskID, projectName, StatusType, taskTitle);
                if (realCnt >= goalCnt) {
                    displayReport(itemList);
                }
            });
        });
    }

    $('[category=getReport]').bind('click', function() {

        saveItem();
        if ($('#middle').attr('vrmname') == 'WIP_ITEMEDIT') {
            $.ajax({
                url: '/WIP_MainMenu.max',
                type: 'POST',
                cache: false,
                async: false,
                data: {
                    id: Communication.SessionID,
                    preprocess: true
                },
                success: function(msg) {
                    getReport();
                }
            });
        } else {
            getReport();
        }
    });

    $('[category=saveItems]').bind('click', function() {

        $(this).fadeOut('slow');
        saveItem();
    });

    $('[category=searchItem]').bind('click', function() {
        if ($('[category=searchInput]').val() == '' || !$('[category=searchInput]').val()) return;
        if ($('#middle').attr('vrmname') == 'WIP_ITEMEDIT') {
            $.ajax({
                url: '/WIP_MainMenu.max',
                type: 'POST',
                cache: false,
                async: false,
                data: {
                    id: Communication.SessionID,
                    preprocess: true
                },
                success: function(msg) {
                    Communication.LinkRequest('https://wip2.maxprocessing.com/WIP_ItemEdit.max?t=' + (new Date().getTime()) + '&TaskId=' + $('[category=searchInput]').val());
                }
            });
        } else {
            Communication.LinkRequest('https://wip2.maxprocessing.com/WIP_ItemEdit.max?t=' + (new Date().getTime()) + '&TaskId=' + $('[category=searchInput]').val());
        }
    });

    $('[category=getFiles]').bind('click', function() {

        var fl = '';
        $('#TAB_BOX_DESCR table:eq(2) tbody tr').each(function() {
            var file = $(this).find('td').eq(0).html();
            var version = $(this).find('td').eq(1).html();
            fl += file + ' ' + version + '\n';
        });
        console.log(fl);
    });

    $('[category=item_list]').append(createItem(''));
    var task_list = [];
    for (var i = localStorage.length - 1; i >= 0; i--) {
        task_list.push({ index: localStorage.key(i), item: localStorage.getItem(localStorage.key(i)) });

    }
    task_list.sort(function(a, b) { return a.index - b.index; });
    $.each(task_list, function(index, task) {

        $('[category=item_list]').append(createItem(task.item));
    });
    // Your code here...
})();