$.fn.V = function(value) {
    if (!value && value != '') {
        return false
    };

    if ($(this).is(":text") || $(this).is("textarea")) {
        $(this).val(value);
        $(this).blur();
        return;
    }

    if ($(this).is("select")) {
        $(this).val(value);
        $(this).change();
        return;
    }

    if ($(this).is(":radio") || $(this).is(":checkbox")) {
        if (($(this).val() == "1" || $(this).val() == "0") && (value == "True" || value == "False")) {
            value = value == "True" ? 1 : 0;
        }
        if ($(this).val() == value) {
            $(this).attr("checked", true);
        } else {
            $(this).removeAttr("checked");
        }
        $(this).change();
    }

    if ($(this).is("label")) {
        $(this).html(value);
        return;
    }

    if ($(this).is("td")) {
        $(this).text(value);
        return;
    }
};

$.fn.param = function(obj) {
    if (obj) {
        if (typeof obj == "string")
            obj = jsonParse(obj)[0];
        for (var prop in obj) {
            $('[name=' + prop + ']', this).each(function() {
                $(this).V(obj[prop]);
            });
        }

    } else {
        var param = '';
        this.find("input[type=text]").each(function() {
            if (!$(this).is(":visible") || !$(this).parentsUntil("#middle").is(":visible")) return;
            param = param + "&" + this.name + '=' + encodeURIComponent($(this).val());
        });

        this.find("textarea").each(function() {
            if (!$(this).is(":visible") || !$(this).parentsUntil("#middle").is(":visible")) return;
            param = param + "&" + this.name + '=' + encodeURIComponent($(this).val());
        });

        this.find("select").each(function() {
            if (!$(this).is(":visible") || !$(this).parentsUntil("#middle").is(":visible")) return;
            param = param + "&" + this.name + '=' + encodeURIComponent($(this).val());
        });

        this.find("input[type=checkbox]").each(function() {
            if (!$(this).is(":visible") || !$(this).parentsUntil("#middle").is(":visible")) return;
            param = param + "&" + this.name + '=' + ($(this).is(":checked") ? 1 : 0);
        });

        this.find("input[type=radio]").each(function() {
            if (!$(this).is(":visible") || !$(this).parentsUntil("#middle").is(":visible")) return;
            if ($(this).is(":checked")) {
                param = param + "&" + this.name + '=' + $(this).val();
            }
        });

        return param;
    }
};

$.fn.Caps = function() {
    this.blur(function() {
        var self = $(this);
        self.val(self.val().toUpperCase());

    });

    this.change(function() {
        var self = $(this);
        self.val(self.val().toUpperCase());

    });
}


$.fn.Int = function() {
    this.each(function() {
        $(this).attr("maxlength", 9);
        AddComma(this);
        $(this).unbind("change", AddComma).bind("change", this, AddComma)
            .unbind("blur", AddComma).bind("blur", this, AddComma)
            .unbind("focus", RemoveComma).bind("focus", this, RemoveComma)
            .unbind("keydown", Filter).bind("keydown", this, Filter);
    });

    function AddComma(me) {
        var self = $(me.data || me);
        var value = self.val().replace(/[^\d]/g, '')
            .replace(/(?=(?!\b)(?:\d{3})+(?!\d))/g, ',')

        self.val(value);
    }

    function RemoveComma(me) {
        var self = $(me.data || me);
        var value = self.val().replace(/[^\d]/g, '');
        self.val(value);
    }

    function Filter(me) {
        if (me.keyCode >= 48 && me.keyCode <= 57) {
            return true;
        }

        if (me.keyCode >= 96 && me.keyCode <= 105) {
            return true;
        }

        if (me.keyCode == 8) {
            //back
            return true;
        }

        if (me.keyCode == 9) {
            //Tab
            return true;
        }

        if (me.keyCode >= 37 && me.keyCode <= 40) {
            //direction key
            return true;
        }
        if (me.keyCode == 46) {
            //Delete
            return true;
        }



        if (me.keyCode == 189 || me.keyCode == 109) {
            //-
            return true;
        }

        if (me.ctrlKey && me.keyCode == 67) {
            //Ctrl+C
            return true;
        }

        if (me.ctrlKey && me.keyCode == 86) {
            //Ctrl+V
            return true;
        }

        return false;
    }
};

$.fn.RoundToThousand = function() {
    this.each(function() {
        RoundToThousand(this);
        $(this).unbind("change", RoundToThousand).bind("change", this, RoundToThousand).Int();
    });

    function RoundToThousand(me) {
        var self = $(me.data || me);
        var value = self.val().replace(/[^\d]/g, '');
        if (value > '') {
            var thousand = parseInt(value) / 1000;
            if (thousand > 0 && thousand < 1) thousand = 1;
            self.val(Math.round(thousand) * 1000);
        }

    }
}

$.fn.Options = function(textList, valueList) {
    this.each(function() {
        for (var i = 0; i < textList.length; i++) {
            $(this).append('<option value="' + (typeof valueList != 'undefined' ? valueList[i] : textList[i]) + '">' + textList[i] + '</option>');
        }
    });
}

$.fn.SetReadOnly = function(isReadonly) {
    var isReadonly = (typeof isReadonly == 'undefined') ? true : isReadonly;
    if (this.is("select")) {
        var v = this.find("option:selected").clone();
        if (isReadonly) {
            if (!this.attr("opts")) {
                this.attr("opts", this.html());
            }
            this.html('').append(v);
        } else {
            this.html('').append($(this.attr("opts"))).val(v.val());
        }
    } else if (this.is(":checkbox")) {
        this.unbind();
        if (isReadonly) {
            this.click(function() {
                return false;
            });
        }
    } else if (this.is(":radio")) {
        var name = this.attr('name');
        $(":radio[name=" + name + "]").each(function() {
            $(this).unbind();
            if (isReadonly) {
                $(this).click(function() {
                    return false;
                });
            }
        });
    } else {
        if (isReadonly) {
            this.attr("readonly", true);
        } else {
            this.removeAttr("readonly");
        }
    }

    return this;
}


$.fn.Lockdown = function(lock) {
    var lock = typeof(lock) == 'undefined' ? true : lock;
    if (lock) {
        if ($(this).is("select")) {
            $(this).css('color', '#666');
            $(this).before('<div name="mask_layer" style="width:' + $(this).width() + 'px;height:' + $(this).height() + 'px;position:absolute;background-color:#666;opacity:.10;"></div>');
        } else {
            var n = $(this).attr("name");
            var v = $(this).val();
            var es = $(this);

            if ($(this).is(":radio") || $(this).is(":checkbox")) {
                es = $("[name=" + n + "]").not(":hidden")
                v = $("[name=" + n + "]:checked").val();
            }

            $("input:hidden[name=" + n + "]").remove();
            if (lock && typeof(v) != 'undefined') {
                var c = $('<input type=hidden>');
                c.attr("name", n);
                c.val(v);
                $(this).parent().append(c);
            }
            es.each(function() {
                $(this).attr("disabled", lock);
            });
        }
    } else {
        $(this).css('color', 'black');
        $(this).parent().find('div[name=mask_layer]').remove();
    }


    return this;
}

$.fn.Reset = function() {
    var container = $(this);
    var name = $(this).attr("name");
    $(this).find(":input:not(button)").each(function() {
        if ($(this).is("select") || $(this).is(":text") || $(this).is("textarea")) {
            $(this).val('');
        } else if ($(this).is(":radio") || $(this).is(":checkbox")) {
            $(this).removeAttr("checked");
        }
    });
    return $(this);
}


$.fn.param_obj = function(obj) {
    if (obj) {
        if (typeof obj == "string")
            obj = jsonParse(obj)[0];
        for (var prop in obj) {
            $('[name=' + prop + ']', this).each(function() {
                $(this).V(obj[prop]);
            });
        }

    } else {
        var param = {};
        this.find("input[type=text]").each(function() {
            if (!$(this).is(":visible") || !$(this).parentsUntil("#middle").is(":visible")) return;
            param[this.name] = encodeURIComponent($(this).val());
        });

        this.find("textarea").each(function() {
            if (!$(this).is(":visible") || !$(this).parentsUntil("#middle").is(":visible")) return;
            param[this.name] = encodeURIComponent($(this).val());
        });

        this.find("select").each(function() {
            if (!$(this).is(":visible") || !$(this).parentsUntil("#middle").is(":visible")) return;
            param[this.name] = encodeURIComponent($(this).val());
        });

        this.find("input[type=checkbox]").each(function() {
            if (!$(this).is(":visible") || !$(this).parentsUntil("#middle").is(":visible")) return;
            param[this.name] = ($(this).is(":checked") ? 1 : 0);
        });

        this.find("input[type=radio]").each(function() {
            if (!$(this).is(":visible") || !$(this).parentsUntil("#middle").is(":visible")) return;
            if ($(this).is(":checked")) {
                param[this.name] = $(this).val();
            }
        });

        return param;
    }
};

Number.prototype.toCurrencyString = function() {
    return this.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,")
};
String.prototype.toCurrencyValue = function() {
    var e = /,/gi;
    return this.replace("$", "").replace(e, "")
}
String.prototype.right = function(len) {
    return this.substr(this.length-(len||0));
}

String.prototype.left = function(len) {
    return this.substr(0,(len||this.length));
}

$.fn.updateFilter = function(filterType, paramVal) {
    // filter="DATE|GREATERTHANEQUALS|LESSTHANEQUALS|" 
    // param="|01/01/1900|01/01/2100|" 
    // dtype="|DATE|DATE
    try {
        var div = this.parent('div');
        var filter = div.attr('filter').split('|');
        var param = div.attr('param').split('|');
        var index = filter.indexOf(filterType);
        if (index > -1) {
            param[index] = paramVal;
            param = param.join('|');
            div.attr('param', param);
        }
    } catch (e) {
        console.log(e);
    }
}
