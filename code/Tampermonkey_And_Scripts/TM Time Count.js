// ==UserScript==
// @name         Loading Time Count
// @namespace    AGCS
// @version      0.1
// @description  try to take over the world!
// @author       Mark Xiao
// @include        /^https?:\/\/localhost:\d{4}/login.max/
// @include        /^https?:\/\/www.maxprocessing.com:\d{4}/login.max/
// @include        /^https?:\/\/139.146.162.176/login.max/
// @include        /^https?:\/\/10.95.254.80/login.max/
// @include        /^https?:\/\/pcserver:5702/login.max/
// @include        /^https?:\/\/agcs-qa.maxprocessing.com/
// require      https://cdn.bootcss.com/jquery/1.7.2/jquery.min.js
// @grant        none
// ==/UserScript==

(function() {  
    // Spinner time count
    setTimeout(function() {
        if (!window.NewShowProgress) {
            window.ShowProgress = Global.ShowProgress;
            window.NewShowProgress = function() {
                window.ShowProgress();
                // console.log('ShowProgress: ',1);
                if (!window.spinCt) {
                    $('#spinner-graphic').html('<p id="spinCt" style="font-size:24px">0</p>');
                    window.spinCt = setInterval(function() {
                        var t = parseInt($('#spinCt').html());
                        $('#spinCt').html(++t);
                    }, 1000);
                }
            }
            Global.ShowProgress = window.NewShowProgress;
        }

        if (!window.NewHideProgress) {
            window.HideProgress = Global.HideProgress;
            window.NewHideProgress = function() {
                window.HideProgress();
                // console.log('HideProgress: ',1);
                console.log('Time counting: ', $('#spinCt').html());
                $('#spinner-graphic').html('');
                clearInterval(window.spinCt);
                delete window.spinCt;
            }
            Global.HideProgress = window.NewHideProgress;
        }

    }, 5000);

})();