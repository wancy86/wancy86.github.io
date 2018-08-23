// ==UserScript==
// @name         Auto Reload
// @namespace    AGCS
// @version      0.1
// @description  try to take over the world!
// @author       Mark Xiao
// @include        /^https?:\/\/localhost:\d{4}/login.max/
// @include        /^https?:\/\/www.maxprocessing.com:\d{4}/login.max/
// @include        /^https?:\/\/139.146.162.176/login.max/
// require      https://cdn.bootcss.com/jquery/1.7.2/jquery.min.js
// @grant        none
// ==/UserScript==

(function() {
  // auto login
  setTimeout(function(){
      console.log(111);
      if(!!$(':input[name=username]').val() && !!$(':input[name=password]').val())
      $('#producer').click();
      console.log(123);
  },1500);

  var html = `
              <div style="top: 0px;left: 0px;height:30px;margin-top:30px;">
                  <select name="rule" id="rule"></select>
                  <input type="text" id="pageName">
                  <button type="button" id="linkToPage">Reload</button>
                  <button type="button" id="resetTime" style="width:40px;">0</button>
              </div>`;

  setTimeout(function() {
      $('#slideout').before(html);

      var rules = [
          'Select VRM',
          'CA_Q_BasInfo',
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
      var pageName = $('#pageName').val().trim();
      if (pageName === '') {
          pageName = $('#middle').attr('vrmname');
      }
      console.log(pageName);
      Communication.LinkRequest(pageName + '.max');
      $('#resetTime').html('0');

      if(window.countTime)clearInterval(window.countTime);
      window.countTime = setInterval(function(){
          $('#resetTime').html(parseInt($('#resetTime').html())+1);
      },1000);

  });

  $('#resetTime').die().live('click', function(){
      clearInterval(window.countTime);
  });

  $('#pageName').die().live('keypress', function(event) {
      if (event.which == '13') {
          $('#linkToPage').click();
      }
  });

  // Your code here...
  window.eft = function(){
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
  }
})();