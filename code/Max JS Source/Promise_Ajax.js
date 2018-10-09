maxajax = function(options) {
    // url, data, success
    return new Promise(function(resolve, reject) {
        var replaceID = function(resp) {
            options.success(resp);
            resolve();
        }
        Communication.CustomRequest(options.url, replaceID, null, $.param(options.data));
    })
}

// example
maxajax({
        url: 'CA_Q_BasInfo.max',
        data: {
            AJAX_ACTION: 'GetBusinessIndustryBySICCode',
            SICCode: 8748
        },
        success: function(resp) {
            console.log(resp);
            console.log('done1');
        }
    })
    .then(function() {
        console.log('done2');
    }).then(function() {
        console.log('done3');
    })
