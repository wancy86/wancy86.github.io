define('ValidatorContainer', ['jQuery', 'Utilities', 'PageHelper', 'Formatting'], function($, Utilities, PageHelper, Formatting) {
    var Validator = new function() {
        var logClassName = "Validator.";

        function iLog(Place, Message, Type, Silent) {
            Log.Add(logClassName + Place, Message, Type, Silent);
        }

        function GetErrors(html) {
            try {
                iLog("GetErrors", "Called");

                var errors = new Array();
                var radios = new Array();
                var ser = Utilities.Serialize(html);
                $(html).find(".component:has(>span.required)").each(function() {
                    var ref = $(this).attr("ref");
                    var span = $(this).find(">span");
                    var inp;
                    var em = null;
                    switch (ref) {
                        case "EditorText":
                            inp = $(this).find("input");
                            if (Utilities.Trim(inp.val()).length == 0)
                                em = "Field '" + span.text() + "' must be entered. Click to fix.";
                            break;
                        case "EditorMemo":
                            inp = $(this).find("textarea");
                            if (Utilities.Trim(inp.val()).length == 0)
                                em = "Text field '" + span.text() + "' must be entered. Click to fix.";
                            break;
                        case "EditorDropDown":
                            inp = $(this).find("select");
                            if (inp.val() == "-1")
                                em = "An option '" + span.text() + " must be selected. Click to fix.";
                            break;
                        case "EditorRadio":
                            inp = $(this).find("input");
                            var name = inp.attr("name");
                            if ($.inArray(name, radios) == -1 && ser.indexOf(name + "=") == -1) {
                                radios.push(name);
                                var s = "";
                                $('[name=' + name + ']').parent().find('span').each(function() {
                                    s += $(this).text() + ', ';
                                });
                                em = "At least one option (" + s.slice(0, s.length - 2) + ") must be selected. Click to fix.";
                            }
                            break;
                        case "EditorCheckBox":
                            inp = $(this).find("input");
                            if (!inp[0].checked)
                                em = "Check box '" + span.text() + "' must be selected. Click to fix.";
                            break;
                    } //<-- end switch statement

                    if (em != null && !inp.attr("disabled") && !inp.attr("readonly") && inp.is(':visible')) {
                        var ctrl = PageHelper.GetEditorComponent(this);
                        ctrl.ErrorStatus(true);
                        var err = new ValidationError(em, ctrl);
                        errors.push(err);
                    }
                });

                return errors;
            } catch (err) {
                iLog("GetErrors", err, Log.Type.Error);
            }
        }

        function ErrorTable(errors) {
            try {
                iLog("ErrorTable", "Called");

                var ol = $("<ol class='ValidationErrors'/>");
                for (var i = 0; i < errors.length; i++) {
                    var li = $("<li/>");
                    li.text(errors[i].Message);
                    li.data("elementObj", errors[i].Control.GetControl());
                    li.bind("click", function() {
                        var ctrl = $(this).data("elementObj");
                        Global.ScrollToElement(ctrl, 500, function() {
                            var obj = PageHelper.GetEditorComponent(ctrl);
                            if (obj.SetFocus)
                                obj.SetFocus();
                        });
                    });
                    ol.append(li);
                }
                return ol;
            } catch (err) {
                iLog("ErrorTable", err, Log.Type.Error);
            }
        }

        function ShowErrors(table, html) {
            try {
                iLog("ShowErrors", "Called");

                var c = $(html).find(".ValidationContainer");
                if (!c.length)
                    c = $(".ValidationContainer");
                if (!c.length) {
                    iLog("ShowErrors", "ValidationContainer could not be found", Log.Type.Warning);
                    return;
                }

                // Show it in the last container
                var ctrl = PageHelper.GetEditorComponent(c[c.length - 1]);
                ctrl.Show(table);
                Global.ScrollToElement(ctrl.GetControl());
            } catch (err) {
                iLog("ShowErrors", err, Log.Type.Error);
            }
        }

        function HideErrors() {
            try {
                iLog("HideErrors", "Called");

                $(".ValidationContainer").each(function() {
                    var ctrl = PageHelper.GetEditorComponent(this);
                    ctrl.Hide();
                });
            } catch (err) {
                iLog("HideErrors", err, Log.Type.Error);
            }
        }

        return {

            Validate: function(html, noDisplay) {
                try {
                    iLog("Validate", "Called");

                    var errors = GetErrors(html);
                    if (errors.length) {
                        var eFn = CustomScript.onValidationErrors || MP.Events.onValidationErrors || $.noop;
                        eFn(errors);
                    } else {
                        HideErrors();
                        return true;
                    }

                    if (!noDisplay) {
                        var table = ErrorTable(errors);
                        ShowErrors(table, html);
                    }
                    return false;
                } catch (err) {
                    iLog("Validate", err, Log.Type.Error);
                }
            }
        };
    };

    function ValidationError(message, control) {
        this.Message = message;
        this.Control = control;
    }

    Validator.Filters = (function() {
        function Convert(Value, dtype) {
            dtype = dtype ? dtype.toUpperCase() : "STRING";

            switch (dtype) {
                case "DATE":
                    try {
                        return new Date(Value).getTime();
                    } catch (err) {
                        throw "Could not convert '" + Value + "' to a date";
                    }
                    break;
                case "FLOAT":
                case "MONEY":
                    try {
                        var val = Value.replace(/[^0-9\.-]/g, ""); // replace any non-numeric characters
                        return parseFloat(val);
                    } catch (err) {
                        throw "Could not convert '" + Value + "' to a floating decimal point number";
                    }
                    break;
                case "INTEGER":
                    try {
                        var val = Value.replace(/[^0-9\.-]/g, ""); // replace any non-numeric characters
                        return parseInt(val, 10);
                    } catch (err) {
                        throw "Could not convert '" + Value + "' to an integer";
                    }
                    break;
                case "STRING":
                    return Value;
                    break;
            }
        }

        function Display(Value, dtype) {
            dtype = dtype ? dtype.toUpperCase() : "STRING";

            switch (dtype) {
                case "DATE":
                    var d = new Date(Value);
                    return d.toString("MM/dd/yyyy");
                    break;
                case "FLOAT":
                    var v = Value.toString();
                    return isNaN(v) ? '0' : v;
                    break;
                case "INTEGER":
                    var v = Value.toString();
                    return isNaN(v) ? '0' : v;
                    break;
                case "MONEY":
                    var v = Value.toString();
                    return isNaN(v) ? '0' : Utilities.ToMoney(v);
                    break;
                case "STRING":
                    return Value;
                    break;
            }
        }

        return {

            DATE: {
                name: 'Date',
                filter: function(Value, dtype, param) {
                    var val = Value.replace(/[^0-9]/g, "/"); // replace any separators with /
                    val = Utilities.ReplaceAll(val, "//", "/"); // get rid of all double pipes
                    param = param || "MM/dd/yyyy";

                    if (val.indexOf("/") == -1) {
                        switch (val.length) {
                            case 1: // 6 - 4/6/03
                                var d = new Date().moveToFirstDayOfMonth().addDays(parseInt(val) - 1);
                                val = d.toString(param);
                                break;
                            case 2: // 26 - 2/6/03 or 4/26/03
                                var d = new Date(),
                                    i = parseInt(val) - 1,
                                    t = d.getDate() - 1;
                                if (i <= t)
                                    d = d.moveToFirstDayOfMonth().addDays(i);
                                else
                                    d.set({ month: parseInt(val.charAt(0)) - 1, day: parseInt(val.charAt(1)) });
                                val = d.toString(param);
                                break;
                            case 3: // 113 - 1103 - 1/1/03
                                val = val.insert([2], "0");
                                val = val.insert([1, 2], "/");
                                break;
                            case 4: // 1103 - 1/1/03
                                val = val.insert([1, 2], "/");
                                break;
                            case 5: // 31103 - 3/11/03
                                val = val.insert([1, 3], "/");
                                break;
                            case 6: // 111103 - 11/11/03
                                val = val.insert([2, 4], "/");
                                break;
                            case 7: // 1112003 - 1/11/2003
                                val = val.insert([1, 3], "/");
                                break;
                            case 8: // 11112003 - 11/11/2003
                                val = val.insert([2, 4], "/");
                                break;
                            default:
                                throw "The date could not be formatted";
                        }
                    }
                    var p = param != "MM/dd/yyyy" ? param : null;
                    if (Utilities.IsDate(val, p)) {
                        var d = new Date.parse(val);
                        return d.toString(param);
                    } else
                        throw "The date must be a valid date in '" + param.toUpperCase() + "' format";
                }
            },
            EMAIL: {
                name: 'Email address',
                filter: function(Value, dtype, param) {
                    var e = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
                    if (e.test(Value))
                        return Value;
                    else
                        throw "The email address is invalid";
                }
            },
            EMAILS: {
                name: 'Email address list',
                filter: function(Value, dtype, param) {
                    var v = Value.replace(/ /g, '').replace(/,/g, ';');
                    var e = /^(([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4}))((;(([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})))*)(;{0,1})$/;
                    if (e.test(v))
                        return v;
                    else
                        throw "The email address list is invalid";
                }
            },
            EQUAL: {
                name: 'Equal-to',
                filter: function(Value, dtype, param) {
                    var v = Convert(Value, dtype);
                    var p = Convert(param, dtype);
                    if (v == p)
                        return Value;
                    else
                        throw "The values are not equal";
                }
            },
            FLOAT: {
                name: 'Floating-point number',
                filter: function(Value, dtype, param) {
                    var err = "Only floating decimal point numbers are accepted";
                    var v = Value.replace(/[^0-9\.-]/g, ""); // replace any non-numeric characters
                    if (v.length == 0)
                        throw err;

                    var fl = Convert(v, "FLOAT");
                    if (isNaN(fl))
                        throw err;

                    //param: blank = default 2 digits, 3 = # of digits, or { "digits": 3, "trailingZeros": true/false }
                    var pObj = Utilities.ConvertToJSONObject(param, 'digits');
                    var res = fl.toFixed(pObj.digits || 2);
                    if (!/(0|false)/i.test(pObj.trailingZeros))
                        return res;
                    else
                        return parseFloat(res);

                    /*
                    var err = "Only floating decimal point numbers are accepted";
                    var v = Value.replace(/[^0-9\.-]/g, ""); // replace any non-numeric characters
                    if (v.length == 0)
                        throw err;
                    
                    var fl = Convert(v, "FLOAT");
                    if (isNaN(fl))
                        throw err;
                    
                    return fl.toFixed(param || 2);
                    */
                }
            },
            GREATERTHAN: {
                name: 'Greater-than',
                filter: function(Value, dtype, param) {
                    var v = Convert(Value, dtype);
                    var p = Convert(param, dtype);
                    if (v > p)
                        return Value;
                    else
                        throw Display(v, dtype) + " must be greater than " + Display(p, dtype);
                }
            },
            GREATERTHANEQUALS: {
                name: 'Greater-than-or-equal-to',
                filter: function(Value, dtype, param) {
                    var v = Convert(Value, dtype);
                    var p = Convert(param, dtype);
                    if (v >= p)
                        return Value;
                    else
                        throw Display(v, dtype) + " must be greater than or equal to " + Display(p, dtype);
                }
            },
            INTEGER: {
                name: 'Integer',
                filter: function(Value, dtype, param) {
                    var err = "Only integer values are accepted";

                    var v = Value.replace(/[^0-9\.-]/g, ""); // replace any non-numeric characters
                    if (v.length == 0)
                        throw err;

                    var fl = Convert(v, "INTEGER");
                    if (isNaN(fl))
                        throw err;

                    return fl.toString();
                }
            },
            LESSTHAN: {
                name: 'Less-than',
                filter: function(Value, dtype, param) {
                    var v = Convert(Value, dtype);
                    var p = Convert(param, dtype);
                    if (v < p)
                        return Value;
                    else
                        throw Display(v, dtype) + " must be less than " + Display(p, dtype);
                }
            },
            LESSTHANEQUALS: {
                name: 'Less-than-or-equal-to',
                filter: function(Value, dtype, param) {
                    var v = Convert(Value, dtype);
                    var p = Convert(param, dtype);
                    if (v <= p)
                        return Value;
                    else
                        throw Display(v, dtype) + " must be less than or equal to " + Display(p, dtype);
                }
            },
            PHONE: {
                name: 'Phone number',
                filter: function(Value, dtype, param) {
                    Value = Value.replace(/x/g, "|"); // extensions will almost always contain the letter x, so replace x with |
                    Value = Value.replace(/[^0-9|]/g, "");
                    var ext = "";
                    var i = Value.lastIndexOf("|");
                    if (i > -1) {
                        ext = Value.substring(i + 1);
                        Value = Value.substring(0, i);
                    }
                    switch (Value.length) {
                        case 7:
                            Value = Value.substring(0, 3) + "-" + Value.substring(3);
                            break;
                        case 10:
                            Value = "(" + Value.substring(0, 3) + ") " + Value.substring(3, 6) + "-" + Value.substring(6);
                            break;
                        case 11:
                            Value = Value.substring(0, 1) + " (" + Value.substring(1, 4) + ") " + Value.substring(4, 7) + "-" + Value.substring(7);
                            break;
                        default:
                            throw "The phone number is invalid";
                    }
                    if (ext.length > 0)
                        Value += " x " + ext;
                    return Value;
                }
            },
            SSN: {
                name: 'Social security number',
                filter: function(Value, dtype, param) {
                    var val = Value.replace(/[^0-9]/g, ""); // remove any non-numeric characters
                    if (val.length == 9)
                        val = val.substring(0, 3) + "-" + val.substring(3, 5) + "-" + val.substring(5);
                    var _exp = /^[0-9]{3}[\- ]?[0-9]{2}[\- ]?[0-9]{4}$/;
                    if (_exp.test(val))
                        return val;
                    else
                        throw "The social security number is invalid";
                }
            },
            FEIN: {
                name: 'Federal employer ID',
                filter: function(Value, dtype, param) {
                    var val = Value.replace(/[^0-9]/g, ""); // remove any non-numeric characters
                    if (val.length == 9)
                        val = val.substring(0, 2) + "-" + val.substring(2);
                    var _exp = /^[0-9]{2}[\- ]?[0-9]{7}$/;
                    if (_exp.test(val))
                        return val;
                    else
                        throw "The federal employer identification number is invalid";
                }
            },
            STATE: {
                name: 'State postal code',
                filter: function(Value, dtype, param) {
                    Value = Value.toUpperCase();
                    if (Value == "INT")
                        return Value;
                    var _exp = /[A-Z]{2}/g;
                    if (!_exp.test(Value))
                        throw "The state code must be two letters";
                    var states = "AL AK AZ AR CA CO CT DC DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR VI GU";
                    _exp = new RegExp(Value, "g");
                    if (states.search(_exp) > -1)
                        return Value;
                    else
                        throw "The state code is invalid";
                }
            },
            TIME: {
                name: 'Time',
                filter: function(Value, dtype, param) {
                    var val = Value.toUpperCase();
                    val = val.replace(/[^0-9AM:PM]/g, "");
                    var end = null;
                    if (val.indexOf("AM") > -1)
                        end = "AM";
                    else if (val.indexOf("PM") > -1)
                        end = "PM";
                    if (end == null)
                        throw "Times must include AM or PM";
                    val = val.replace(/\s/g, "");
                    // expression does not end with /g so that only the first match is returned, or null if not found
                    var _exp = /\d{1,2}:\d{2}/;
                    var ma = val.match(_exp);
                    if (ma == null)
                        throw "Times must be formatted HH:MM AM/PM";
                    if (typeof ma == "object")
                        ma = ma[0];
                    var s = ma.split(":");
                    var h = parseInt(s[0], 10);
                    var m = parseInt(s[1], 10);
                    if (h > 12)
                        throw "The hour must be less than or equal to 12";
                    if (h == 0)
                        throw "The hour must be greater than 0";
                    if (m > 59)
                        throw "The minute must be less than 60";
                    if (m < 10)
                        m = "0" + m.toString();
                    return h + ":" + m + " " + end;
                }
            },
            ZIPCODE: {
                name: 'ZIP code',
                filter: function(Value, dtype, param) {
                    var val = Value.replace(/[^0-9]/g, ""); // replace any non-numeric characters
                    switch (val.length) {
                        case 5:
                            return val;
                            break;
                        case 9:
                            return val.substring(0, 5) + "-" + val.substring(5);
                            break;
                        default:
                            throw "The ZIP code must be 5 or 9 digits for zip + 4 codes";
                    }
                }
            },
            PASSWORD: {
                name: 'Password',
                filter: function(Value, dtype, param) {
                    return Value;
                }
            },
            MONEY: {
                name: 'Monetary value (money)',
                filter: {
                    attach: function($element, dtype, param) {
                        var v1 = Formatting.formatFieldAsMoney($element);
                        var v2 = Formatting.stripNonNumericalCharacters(v1);
                        $element.data('submit-value', v2);

                        $element.bind('focus.money-filter', function() {
                            var v1 = $element.val();
                            var v2 = Formatting.stripNonNumericalCharacters(v1);
                            if (v1 != v2)
                                $element.val(v2);
                            $element.data('submit-value', v2);
                        });
                        $element.bind('blur.money-filter', function() {
                            var v1 = Formatting.formatFieldAsMoney($element);
                            var v2 = Formatting.stripNonNumericalCharacters(v1);
                            $element.data('submit-value', v2);
                        });
                    },
                    detach: function($element, dtype, param) {
                        $element.unbind('.money-filter');
                    }
                }
            },
            CUSTOMEXPRESSION: {
                name: 'Custom expression',
                filter: function(Value, dtype, param) {
                    //param: ^[A-z]+$ or {"pattern": "^[A-z]+$", "modifiers": "ig", "message": "Only letters allowed!"}
                    var ptr = param,
                        mdf = '',
                        msg = '',
                        obj = Utilities.ConvertToJSONObject(param, 'pattern');
                    if (obj) {
                        ptr = obj.pattern;
                        mdf = obj.modifiers;
                        msg = obj.message;
                    }
                    if (!ptr)
                        return Value;

                    var exp = new RegExp(ptr, mdf);
                    if (exp.test(Value))
                        return Value;
                    else
                        throw msg || "The information is formatted incorrectly";
                }
            },
            CUSTOMFUNCTION: {
                name: 'Custom function',
                filter: function(Value, dtype, param) {
                    if (param.indexOf("()") == -1)
                        throw 'Call "' + param + '" with no parameters!';

                    var val = Value.replace(/"/g, '\\"');
                    var fn = param.replace('()', '("' + val + '", "' + dtype + '")');

                    return eval(fn);
                }
            }
        };
    }());

    return Validator;
});