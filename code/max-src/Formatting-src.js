define('Formatting', ['jQuery'], function($) {
    var joinNumber = function(integer, fractions) {
        if (fractions === '')
            return integer;
        else
            return integer + '.' + fractions;
    };

    var stripNonNumericalCharacters = function(text) {
        var s = text.replace(/[^-\d\.]/g, "");
        return isNaN(parseFloat(s)) ? '' : '' + parseFloat(s);
    };

    var formatNumberWithCommas = function(amountString) {
        var parts = amountString.split('.');
        var integer = parts[0].replace(/(\d{1,3})(?=(\d{3})+$)/g, '$1,');
        var fractions = parts.slice(1).join('');

        if (parts.length > 1)
            return integer + '.' + fractions;
        else
            return integer;
    };

    var formatText = function(text) {
        var s = stripNonNumericalCharacters(text);
        s = formatNumberWithCommas(s);
        var i = parseFloat(s);
        if (i < 0)
            return s.insert(1, '$');
        else
            return '$' + s;
    };

    var formatTextAsMoney = function(text) {
        text = $.trim(text);
        if (text) {
            //Remove incorrect negative symbols first
            var v1 = text.slice(0, 1);
            var v2 = text.slice(1);
            v2 = v2.replace(/-/g, "");
            text = formatText(v1 + v2);
        } else {
            text = "";
        }

        var parts = text.split('.');
        var integer = parts[0] || '';
        var fractions = parts[1] || '';

        if (fractions.length !== 0 && fractions.length !== 2) {
            fractions = fractions + '00';
            fractions = fractions.substr(0, 2);
        }

        return joinNumber(integer, fractions);
    };

    var formatFieldAsMoney = function($field) {
        var v1 = $.trim($field.val());
        var v2 = "";
        if (v1) {
            v2 = formatTextAsMoney(v1);
            if (v1 == v2)
                return v2;
        };

        $field.val(v2);
        return v2;
    };

    return {
        formatFieldAsMoney: formatFieldAsMoney,
        formatTextAsMoney: formatTextAsMoney,
        stripNonNumericalCharacters: stripNonNumericalCharacters
    };
});