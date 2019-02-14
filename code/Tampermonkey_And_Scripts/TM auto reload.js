// ==UserScript==
// @name         Auto Reload
// @namespace    AGCS
// @version      0.1
// @description  try to take over the world!
// @author       Mark Xiao
// @include        /^https?:\/\/localhost:\d{4}/login.max/
// @include        /^https?:\/\/www.maxprocessing.com:\d{4}/login.max/
// @include        /^https?:\/\/139.146.162.176/login.max/
// @include        /^https?:\/\/10.95.254.80/login.max/
// @include        /^https?:\/\/10.19.20.212/login.max/
// @include        /^https?:\/\/pcserver:5702/login.max/
// @include        /^https?:\/\/agcs-qa.maxprocessing.com/
// require      https://cdn.bootcss.com/jquery/1.7.2/jquery.min.js
// @grant        none
// ==/UserScript==

(function() {
    // auto login
    setTimeout(function() {
        if (!!$(':input[name=username]').val() && !!$(':input[name=password]').val())
            $('#producer').click();
    }, 1500);

    var html = `
              <div style="top: 0px;left: 0px;height:30px;margin-top:30px;">
                  <select name="rule" id="rule"></select>
                  <input type="text" id="pageName"/>
                  <button type="button" id="linkToPage">Reload</button>
                  <button type="button" id="resetTime" style="width:40px;">0</button>
                  <input type="text" id="MaxCode"/>
                  <button type="button" id="MaxSearch">Search</button>
                  <input type="text" id="RECID" style="width:60px;" placeholder="RECID"/>
              </div>`;

    setTimeout(function() {
        $('#slideout').before(html);

        var rules = [
            'Select VRM',
            'CA_Q_BasInfo',
            'CA_Q_UM_UIM_Detail',
            'CA_Q_RateResult',
            'CA_Q_Disclosure',
            'wc_q_result',
            'wc_q_disclosure',
            'BOP_Q_Disclosure',
            'ReoccuringPayment_Entry',
            'CA_Q_CompositeRating',
            'CA_Q_Coverage',
            'CA_Q_Payments',
            'agtcomm_history',
            'CreateQuoteBills',
            'dts_test',
        ];
        var opt = '';
        for (let r of rules) {
            opt += '<option value="' + r + '">' + r + '</option>';
        }
        $('#rule').append(opt);

    }, 500);

    $('#rule').die().live('change', function() {
        var v = $(this).val();
        if (v != 'Select VRM') {
            $('#pageName').val(v);
        }
    });

    $('#linkToPage').die().live('click', function() {
        $('#rule').removeAttr('disabled');
        var pageName = $('#pageName').val().trim();
        if (pageName === '') {
            pageName = $('#middle').attr('vrmname');
        }
        console.log(pageName);
        Communication.LinkRequest(pageName + '.max');
        $('#resetTime').html('0');

        if (window.countTime) {
            clearInterval(window.countTime);
        }
        window.countTime = setInterval(function() {
            $('#resetTime').html(parseInt($('#resetTime').html()) + 1);
            if (window.countTime && parseInt($('#resetTime').html()) > 999) {
                clearInterval(window.countTime);
            }
        }, 1000);
    });

    $('#resetTime').die().live('click', function() {
        clearInterval(window.countTime);
    });

    $('#pageName').die().live('keypress', function(event) {
        if (event.which == '13') {
            $('#linkToPage').click();
        }
    });

    $('#MaxSearch').die().live('click', function(event) {
        var code = $('#MaxCode').val().split('-')[0];
        var data = {
            Code: code,
            Status: '-1',
            Agency: '-1',
            sLOB_ID: '-1',
            SubmitAct: 'Search'
        }
        Communication.LinkRequest(`POLICY_SEARCH.max?code=${code}`);
        setTimeout(function() {
            Communication.CustomRequest('POLICY_SEARCH.max?' + $.param(data), function(resp) {
                Communication.LinkRequest(`Policy_Search_Result.max?code=${code}`);
            })
        }, 500);

    });

    $('#MaxCode').die().live('keypress', function(event) {
        if (event.which == '13') {
            $('#MaxSearch').click();
        }
    });

    // Your code here...
    window.eft = function() {
        $('#EC_AccountNumber').val('12345678901234');
        $('#EC_RoutingNumber').val('490000018');
        $('#EC_BankName').val('BOC');
        $('#EC_BankState').val('NY');

        $('#PPP_Email').val('mwan@maxprocessing.com');
        $('#MemberName').val('mark wan');
        $('#check_name').val('mark wan');
        $('#Bill_Address1').val('5601 Shadow Shore Pl');
        $('#Bill_Address2').val('');
        $('#Bill_City').val('Gulf Breeze');
        $('#Bill_State').val('FL');
        $('#Bill_Zip').val('32563-9645');
        $(':radio[name=ec_AccType]').eq(0).attr('checked', 1);
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

    // get RECID when search
    $(document).delegate("#resulttable a", "click", function() {
        $(this).attr('onclick')
        $('#RECID').val($(this).attr('onclick').toString().split('&')[1].replace('RECID=', ''))
    });


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

    }, 10000);

})();