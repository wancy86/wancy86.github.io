/*
https://wip.maxprocessing.com/WIP_WorkLogEntry.max?AJAX_ACTION=GetTaskInfo&TaskId=55796&t=1502669746127

{
    "TaskName": "CAU - QA Payment Error Message received",
    "ProjectName": "Allianz Global Corporate & Specialty (AGCS)",
    "UserName": "Xiaocong Xu",
    "StatusType": "Closed - Uploaded UAT (Waiting Client Approval)",
    "TimeEstimated": "480 (min)",
    "TimeSpend": "257 (min)",
    "TimeRemaining": "223 (min)",
    "TaskError": "0"
}
*/

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
window.arr = [];
for (var i = wips.length - 1; i >= 0; i--) {
  var wip = wips[i];
  var lastone = (i === 0) ? 1 : 0;
  getItemInfo(wip, lastone);
}
};

wips=[55796, 56581, 57629, 57731, 57933, 57947, 57948, 57956, 57960, 57966, 57971, 57972, 57973, 57974,57855,];
getItemsInfo(wips);

wips=[57991, 58029, 58025, 28036,];
getItemsInfo(wips);

getItemsInfo([ 57731, 57933, 57947, 57966,  57972,  57974,57855,]);
