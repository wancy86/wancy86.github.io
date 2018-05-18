/*
This script provides commonly used utility functions
 */
define('Utilities', ['jQuery', 'Formatting'], function($, Formatting) {
    Array.prototype.reset = function() {
        for (var i = 0; i < this.length; i++)
            this[i] = null;
    };
    Array.prototype.toPipeString = function() {
        var str = "";
        for (var i = 0; i < this.length; i++) {
            str += this[i] + "|";
        }
        return str.substring(0, str.length - 1);
    };
    String.prototype.beginsWith = function(str) {
        var L = str.length;
        var begin = this.substring(0, L);
        return (begin == str);
    };
    String.prototype.endsWith = function(str) {
        var L = str.length;
        var end = this.substring(this.length - L);
        return (end == str);
    };
    String.prototype.removeLastChar = function() {
        return this.substring(0, this.length - 1);
    };
    String.prototype.removeFirstChar = function() {
        return this.substring(1);
    };
    String.prototype.insert = function(pos, str) {
        if (typeof pos == "object") {
            var ret = "";
            var lp = 0;
            for (var i = 0; i < pos.length; i++) {
                var p = pos[i];
                ret += this.substring(lp, p) + str;
                lp = p;
            }
            ret += this.substring(lp);
            return ret;
        }
        return this.substring(0, pos) + str + this.substring(pos);
    };

    // Add new functions to jQuery here
    jQuery.fn.outerHTML = function() {
        try {
            if (this[0].outerHTML)
                return this[0].outerHTML;
            // TODO: if not IE then this code must return the equivalent of outerHTML - needs testing
            return $('<div>').append(this.eq(0).clone(true)).html();
        } catch (err) {
            Log.Add("jQuery.fn.outerHTML", err, Log.Type.Error);
        }
    };

    // This returns correct input values which $.outerHTML() does not! Performance penalty!
    var oldOuterHTML = $.fn.outerHTML;
    jQuery.fn.formOuterHTML = function() {
        if (arguments.length)
            return oldOuterHTML.apply(this, arguments);
        $("input,button", this).each(function() {
            this.setAttribute('value', this.value);
        });
        $("textarea", this).each(function() {
            $(this).text(this.value);
        });
        return oldOuterHTML.apply(this);
    };

    // This returns correct input values which $.html() does not! Performance penalty!
    var oldHTML = $.fn.html;
    $.fn.formHTML = function() {
        if (arguments.length)
            return oldHTML.apply(this, arguments);
        $("input,button", this).each(function() {
            this.setAttribute('value', this.value);
        });
        $("textarea", this).each(function() {
            $(this).text(this.value);
        });

        /* LK: we do not need to save values of the following inputs!
        $("input:radio,input:checkbox", this).each(function() {
            if (this.checked) this.setAttribute('checked', 'checked');
            else this.removeAttribute('checked');
        });
        $("option", this).each(function() {
            if (this.selected) this.setAttribute('selected', 'selected');
            else this.removeAttribute('selected');
        });
        */
        return oldHTML.apply(this);
    };

    // Add :focus selector introduced later in jQuery 1.6
    $.expr[":"].focus = function(elem) {
        return elem === document.activeElement && (elem.type || elem.href);
    };

    // Dialog modal result types, the value is used as a class when displayed
    var ModalResultType = new function() {
        this.Ok = "-Dialog-Returned-OK-";
        this.Cancel = "-Dialog-Returned-Cancel-";
        this.Yes = "-Dialog-Returned-Yes-";
        this.No = "-Dialog-Returned-No-";
        this.Empty = "-Dialog-Returned-Empty-String";
    };

    Utilities = new function(undefined) {
        var logClassName = "Utils.";

        try {
            function iLog(Place, Message, Type, Silent) {
                Log.Add(logClassName + Place, Message, Type, Silent);
            }
            /* Prevent Page Refresh Helper */
            function nocontextmenu() {
                try {
                    event.cancelBubble = true;
                    event.returnValue = false;
                    return false;
                } catch (err) {
                    iLog("nocontextmenu", err, Log.Type.Error);
                }
            }

            function norightclick(e) {
                try {
                    if (window.Event) {
                        if (e.which != 1)
                            return false;
                    } else if (event.button != 1) {
                        event.cancelBubble = true;
                        event.returnValue = false;
                        return false;
                    }
                } catch (err) {
                    iLog("norightclick", err, Log.Type.Error);
                }
            }

            function onKeyDown() {
                try {
                    if ((event.altKey) || ((event.ctrlKey) && ((event.keyCode == 78) || (event.keyCode == 82)) || (event.keyCode == 116) || (event.keyCode == 122))) {
                        event.keyCode = 0;
                        event.returnValue = false;
                    }
                } catch (err) {
                    iLog("onKeyDown", err, Log.Type.Error);
                }
            }
            /* End Prevent Page Refresh Helper */

            function G() {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
            }

            return {

                /* PUBLIC METHODS */

                MakeGUID: function() {
                    return (G() + G() + "-" + G() + "-" + G() + "-" + G() + "-" + G() + G() + G()).toUpperCase();
                },
                GetXmlString: function(xmlDocument) {
                    if (typeof xmlDocument.xml !== 'undefined') {
                        return xmlDocument.xml;
                    }
                    return (new XMLSerializer()).serializeToString(xmlDocument);
                },
                // formats an array for .droppable accept selector
                GetAcceptedComponents: function(AcceptArray) {
                    try {
                        var _accept = "";
                        for (var i = 0; i < AcceptArray.length; i++)
                            _accept += "img[ref='" + AcceptArray[i] + "'],";
                        _accept = _accept.substring(0, _accept.length - 1);
                        return _accept;
                    } catch (err) {
                        iLog("GetAcceptedComponents", err, Log.Type.Error);
                    }
                },
                // returns the current time formatted "0h:0m:0s:00ms"
                GetFormattedTime: function() {
                    try {
                        var d = new Date();
                        var t = this.PadNumber(d.getHours()) + ":" + this.PadNumber(d.getMinutes()) + ":" + this.PadNumber(d.getSeconds()) + ":" + this.PadNumber(d.getMilliseconds(), 4);
                        return t;
                    } catch (err) {
                        iLog("GetFormattedTime", err, Log.Type.Error);
                    }
                },
                GetTimeDifference: function(Date1, Date2) {
                    var d1 = Date1.getTime();
                    var d2 = Date2.getTime();
                    return d2 - d1;
                },
                FilterScript: function(Script) {
                    try {
                        var s = "";
                        for (var j = 0; j < Script.length; j++) {
                            var character = Script.substring(j, j + 1);
                            var code = character.charCodeAt(0);
                            if (code != 10)
                                s += character;
                        }
                        return s;
                    } catch (err) {
                        iLog("FilterScript", err, Log.Type.Error);
                    }
                },
                Format: function(str, params) {
                    try {
                        for (var i = 0; i < params.length; i++) {
                            str = str.replace("{" + i + "}", params[i]);
                        }
                        return str;
                    } catch (err) {
                        iLog("Format", err, Log.Type.Error);
                    }
                },
                // pads numbers with zero to the specified length [default padding = 2]
                PadNumber: function(num, padd) {
                    try {
                        if (padd == null)
                            padd = 2;
                        var m = "1000000000000000";
                        var c = "0000000000000000";
                        var n = parseInt(m.substring(0, padd), 10);
                        if (num >= n)
                            return num;
                        var l = num.toString().length;
                        var b = c.substring(0, padd - l);
                        return b + num.toString();
                    } catch (err) {
                        iLog("PadNumber", err, Log.Type.Error);
                    }
                },
                ParseXML: function(xml) {
                    if (window.ActiveXObject && window.GetObject) {
                        var dom = new ActiveXObject('Microsoft.XMLDOM');
                        dom.loadXML(xml);
                        return dom;
                    }
                    if (window.DOMParser)
                        return new DOMParser().parseFromString(xml, 'text/xml');
                    throw new Error('No XML parser available');
                },
                PreventRefresh: function() {
                    try {
                        document.oncontextmenu = nocontextmenu;
                        document.onmousedown = norightclick;
                        if (Browser.IsFirefox()) {
                            document.addEventListener("keydown", onKeyDown, false);
                        } else {
                            document.attachEvent("onkeydown", onKeyDown);
                        }
                        if (window.Event)
                            document.captureEvents(Event.MOUSEUP);
                    } catch (err) {
                        iLog("PreventRefresh", err, Log.Type.Error);
                    }
                }, // prompts the user for a control name and ensures it doesn't already exist
                PromptForName: function(unique, caption) {
                    try {
                        caption = caption || "Please enter the control name";
                        var n = prompt(caption, "");
                        if (n == null)
                            return Utilities.ModalResult.Cancel;
                        n = this.Trim(n);
                        if (n == "")
                            return Utilities.ModalResult.Empty;

                        if (unique) {
                            if ($("#" + n).length > 0) {
                                iLog("PromptForName", "The name '" + n + "' is already being used!", Log.Type.Warning);
                                return false;
                            }
                        }
                        return n;
                    } catch (err) {
                        iLog("PromptForName", err, Log.Type.Error);
                    }
                },
                ReplaceAll: function(str, fnd, val) {
                    try {
                        if (str == null)
                            return null;
                        if (typeof str != "string")
                            return "";
                        while (str.indexOf(fnd) > -1) {
                            str = str.replace(fnd, val);
                        }
                        return str;
                    } catch (err) {
                        iLog("ReplaceAll", err, Log.Type.Error);
                    }
                },
                Serialize: function(HTML) {
                    try {
                        var toReturn = [];
                        var els = $(HTML).find(':input').get();
                        $.each(els, function() {
                            if (this.name && !this.disabled && (this.checked || /select|textarea/i.test(this.nodeName) || /text|hidden|password/i.test(this.type))) {
                                var $this = $(this);
                                var n = encodeURIComponent(this.name);
                                var v;

                                // Add the element's modified submit value or it's real visible value
                                if ($this.data('submit-value'))
                                    v = $this.data('submit-value');
                                else
                                    v = $this.val();
                                toReturn.push(n + "=" + encodeURIComponent(v));

                                if ($this.attr('sMask')) {
                                    toReturn.push(n + "-sMask=" + encodeURIComponent($this.attr('sMask')));
                                    toReturn.push(n + "-sValue=" + encodeURIComponent($this.attr('sValue')));
                                }
                            }
                        });
                        // Get the data of CKEditor
                        $(HTML).find("div[ref='EditorMemo']").each(function() {
                            if ($(this).attr("EditHTML") == "true") {
                                var id, i, data;
                                id = $(this).find('div.ckEditorDiv').attr("id");
                                if (id) {
                                    // New correct way, all entered data preserved!
                                    data = Global.GetCKEditorDataByID(id);
                                    id = encodeURIComponent(id);
                                    data = encodeURIComponent(data);
                                    toReturn.push(id + "=" + data);
                                } else {
                                    // Old buggy way, passible loss of entered data due incorrect escape!
                                    id = $(this).find("textarea").attr("id");
                                    data = Global.GetCKEditorDataByID(id);
                                    id = encodeURIComponent(id);
                                    data = encodeURIComponent(data);
                                    for (i = 0; i < toReturn.length; i++) {
                                        if (toReturn[i].beginsWith(id)) {
                                            toReturn[i] = id + "=" + data;
                                            break;
                                        }
                                    }
                                }
                            }
                        });
                        var ret = toReturn.join("&").replace(/%20/g, "+");
                        ret += TransferListHelper.Serialize(HTML);
                        // serialize the transfer lists
                        return ret;
                    } catch (err) {
                        iLog("Serialize", err, Log.Type.Error);
                    }
                },
                SortSelect: function(sel) {
                    try {
                        sel = $(sel)[0];
                        for (var i = 0; i < sel.options.length; i++) {
                            var a = sel.options[i];
                            var move = true;
                            for (var j = 0; j < sel.options.length; j++) {
                                if (j != i && move == true) {
                                    var b = sel.options[j];
                                    if ($(a).text() < $(b).text()) {
                                        $(a).remove().insertBefore($(b));
                                        move = false;
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        iLog("SortSelect", err, Log.Type.Error);
                    }
                },
                SnapTo: function(num, snapTo, goUp) {
                    if (goUp)
                        return num - (num % snapTo) + snapTo;
                    else
                        return num - (num % snapTo);
                },
                ToNumber: function(str) {
                    try {
                        var i = parseInt(str, 10);
                        if (isNaN(i))
                            return 0;
                        else
                            return i;
                    } catch (err) {
                        iLog("ToNumber", err, Log.Type.Error);
                    }
                },
                ToMoney: function(num) {
                    try {
                        if (typeof num == 'string')
                            return Formatting.formatTextAsMoney(num);
                        else
                            return Formatting.formatFieldAsMoney(num);
                    } catch (err) {
                        iLog("ToMoney", err, Log.Type.Error);
                    }
                },
                MoneyToNumber: function(str) {
                    try {
                        var s = Formatting.stripNonNumericalCharacters(str);
                        var f = parseFloat(s);
                        if (isNaN(f))
                            return 0;
                        else
                            return f;
                    } catch (err) {
                        iLog("MoneyToNumber", err, Log.Type.Error);
                    }
                },
                // Reads the properties of an object and displays them as name = value pairs
                ToString: function(IComponent, wrapped, currDepth) {
                    currDepth = currDepth || 0;
                    if (currDepth > 20)
                        return "null";

                    currDepth++;
                    var _str = "";
                    if (!wrapped)
                        _str = "{\n";
                    $.each(IComponent, function(field, val) {
                        if (Utilities.IsObject(val))
                            _str += "\"" + field + "\": " + Utilities.ToString(val, false, currDepth) + ",";
                        else {
                            switch (typeof val) {
                                case "boolean":
                                    _str += "\"" + field + "\":" + val + ",";
                                    break;
                                case "string":
                                    _str += "\"" + field + "\":\"" + val + "\",";
                                    break;
                                case "number":
                                    _str += "\"" + field + "\":" + val + ",";
                                    break;
                                default:
                                    _str += "\"" + field + "\": \"" + val + "\",";
                                    break;
                            }
                            _str += "\n";
                        }
                    });
                    if (!wrapped)
                        _str += "\n}";
                    _str = _str.replace(/,\s{0,}\}/g, "\n}");
                    return _str;
                },
                toProperCase: function(s) {
                    return s.toLowerCase().replace(/\b((m)(a?c))?(\w)/g,
                        function($1, $2, $3, $4, $5) {
                            if ($2)
                                return $3.toUpperCase() + $4 + $5.toUpperCase();
                            else
                                return $1.toUpperCase();
                        }
                    );
                },
                Trim: function(str) {
                    if (str) {
                        return str.replace(/^\s+|\s+$/g, "");
                    } else {
                        return "";
                    }
                },
                RemoveWhiteSpaces: function(str) {
                    if (str) {
                        return str.replace(/\s+/g, " ");
                    } else {
                        return "";
                    }
                }, // returns true if o is an object
                IsObject: function(o) {
                    try {
                        return (o && "object" == typeof o) || Utilities.IsFunction(o);
                    } catch (err) {
                        iLog("IsObject", err, Log.Type.Error);
                    }
                }, // returns true if o is a function
                IsFunction: function(o) {
                    try {
                        return "function" == typeof o;
                    } catch (err) {
                        iLog("IsFunction", err, Log.Type.Error);
                    }
                },
                IsNumber: function(o) {
                    try {
                        return "number" == typeof o;
                    } catch (err) {
                        iLog("IsNumber", err, Log.Type.Error);
                    }
                },
                IsDate: function(DateStr, FormatStr) {
                    try {
                        if (FormatStr)
                            var d = new Date.parseExact(DateStr, FormatStr);
                        else
                            var d = new Date.parse(DateStr);
                        return !isNaN(d.getTime());
                    } catch (err) {
                        return false;
                    }
                },
                IdentifyChildren: function(element) {
                    var arr = [];
                    var el = $(element);

                    try {
                        var children = el.find('[id]');
                        children.each(function() {
                            arr.push($(this).attr('id') || $(this).attr('name'));
                        });
                    } catch (err) {}

                    var n = el.attr('id') || el.attr('name');
                    return n + '[' + arr.join() + ']';
                },
                ConvertToJSONObject: function(jsonStr, keyName) {
                    if (Utilities.IsObject(jsonStr))
                        return jsonStr;

                    var strToObj = function(s) {
                        try {
                            return $.parseJSON(s);
                        } catch (err) {
                            return null;
                        }
                    };

                    var re = /^\{(.*)\}$/;
                    if (re.test(jsonStr.trim()))
                        return strToObj(jsonStr.trim());

                    jsonStr = jsonStr.replace(/"/g, '\\"');
                    jsonStr = '{"' + keyName + '" : "' + jsonStr + '"}';
                    return strToObj(jsonStr);
                },
                ConvertToOptions: function(obj) {
                    var makeOption = function(data) {
                        if (data instanceof $)
                            return data;

                        return $('<option/>')
                            .attr('value', data.value || '')
                            .attr('title', data.title || '')
                            .text(data.text || '');
                    };

                    var parseOption = function(opt) {
                        if (typeof opt === 'string') {
                            return {
                                text: opt,
                                value: opt
                            };
                        } else if (opt instanceof $) {
                            return opt;
                        } else if (typeof opt === 'object') {
                            return opt;
                        } else {
                            throw new TypeError('Option items must be strings, arrays, or jQuery elements');
                        }
                    };

                    var $options = $([]);
                    if (obj instanceof Array || obj instanceof $) {
                        $.each(obj, function(i, opt) {
                            $options = $options.add(makeOption(parseOption(opt)));
                        });
                    } else if (typeof obj === 'object') {
                        // WTB Object.keys with Array#forEach.
                        var key;
                        for (key in obj) {
                            if (!Object.prototype.hasOwnProperty.call(obj, key))
                                continue;

                            $options = $options.add(makeOption($.extend(parseOption(obj[key]), { value: key })));
                        };
                    } else {
                        throw new TypeError('Option container must be an array or object');
                    }

                    return $options;
                }
            };
        } catch (err) {
            iLog("Main", err, Log.Type.Error);
        }
    };

    Utilities.ModalResult = ModalResultType;

    return Utilities;
});