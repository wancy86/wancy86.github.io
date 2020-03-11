define("MP", ["ContextMenu", "Editor", "Communication", "PageHelper", "RuleHelper", "HtmlEditor", "Browser", "VrmScript"], function(e, t, r, o, i, n, a, s) {
    var l = new function(e) {
        var t = {};
        return {
            StingrayJsVersion: "3.3.0.2",
            Initialize: function(e) {
                $.extend(t, e),
                l.Tools.Initialize(t),
                l.WebSocket.Initialize(t.webSocket)
            },
            Modules: {
                description: "Various modules/objects"
            },
            Types: {
                description: "Type definitions"
            },
            Components: {
                description: "Screen components"
            },
            Constructors: {
                description: "Reusable constructor functions"
            },
            Editor: {
                description: "Editor tools"
            },
            Events: {
                description: "Core events"
            }
        }
    }
      , c = new function() {
        function e(e, t, r, o) {
            Log.Add("WebSocket." + e, t, r, o)
        }
        function t(e) {
            this.app = e.toLowerCase(),
            this.onMessage,
            this.onOpen,
            this.onClose,
            this.onError
        }
        function o(e, t) {
            this.app = e.toLowerCase(),
            this.text = t
        }
        function i(e, t) {
            if (l.Tools.jqxNotificationsEnabled()) {
                jQ("<div/>").html(t.message).jqxNotification({
                    autoOpen: !0,
                    autoClose: !1,
                    template: e
                });
                C && C.length || (C = jQ(".jqx-notification-container"),
                C.addClass("aboveSpinner"))
            } else
                jAlert(t.message, t.title)
        }
        function n(t, r, o) {
            if (t)
                try {
                    t(r, o)
                } catch (t) {
                    e("executeCB", t, Log.Type.Error, !0)
                }
        }
        function s(e) {
            var t = new o("system","");
            try {
                t = $.parseJSON(e),
                t.app = t.app.toLowerCase()
            } catch (r) {
                t.text = e
            }
            return t
        }
        function d(t) {
            var r = t.config || "{}";
            try {
                r = r.replace(/&(quot);/g, '"'),
                r = $.parseJSON(r)
            } catch (t) {
                r = {},
                e("getConfig", t, Log.Type.Error, !0)
            }
            return r
        }
        function u(e) {
            var t = d(e)
              , r = t.showAs || "alert-dlg";
            if (r = r.toLowerCase(),
            t.message = e.text || t.message,
            t.message) {
                switch (r) {
                case "custom-dlg":
                    Global.ShowErrorMessage(t.message, t.title || "System Message", null, t.width);
                    break;
                case "confirm-dlg":
                    jConfirm(t.message, t.title, function(t) {
                        e = $.extend(e, {
                            answer: t
                        }),
                        c.Send(e.app, e)
                    });
                    break;
                case "prompt-dlg":
                    jPrompt(t.message, t.value, t.title, function(t) {
                        e = $.extend(e, {
                            answer: t
                        }),
                        c.Send(e.app, e)
                    });
                    break;
                case "info-ntf":
                    i("info", t);
                    break;
                case "success-ntf":
                    i("success", t);
                    break;
                case "warning-ntf":
                    i("warning", t);
                    break;
                case "danger-ntf":
                    i("error", t);
                    break;
                default:
                    jAlert(t.message, t.title)
                }
                return !0
            }
        }
        function p() {
            y || (h(),
            y = setInterval(h, T.autoReconnectMS || 3e4))
        }
        function h() {
            if (!m && c.Count() && r.SessionOK()) {
                e("Reconnecting", c.Count() + " sockets");
                var t = T.ssl ? "wss://" : "ws://";
                m = new WebSocket(t + T.host + ":" + T.port + "/sgc/auth/url/" + r.SessionID + "/H"),
                m.onopen = function(e) {
                    r.SessionOK() && $.each(v, function() {
                        n(this.onOpen, e, this)
                    })
                }
                ,
                m.onclose = function(e) {
                    r.SessionOK() && ($.each(v, function() {
                        n(this.onClose, e, this)
                    }),
                    m = null)
                }
                ,
                m.onmessage = function(e) {
                    if (r.SessionOK()) {
                        var t = s(e.data);
                        $.each(v, function() {
                            t.app == this.app && n(this.onMessage, t, this)
                        })
                    }
                }
                ,
                m.onerror = function(e) {
                    if (r.SessionOK() && e.data) {
                        var t = s(e.data);
                        $.each(v, function() {
                            t.app == this.app && n(this.onError, t, this)
                        })
                    }
                }
            }
        }
        function f(e) {
            e = e.toLowerCase();
            var t = -1;
            return $.each(v, function(r, o) {
                o.app == e && (t = r)
            }),
            t
        }
        function g() {
            m.close(),
            m = null,
            v = []
        }
        try {
            var m, y, C, v = [], E = a.ParseURL(), T = {
                host: E.hostname,
                port: 5711,
                autoReconnectMS: 3e4,
                systemApplication: "",
                ssl: !1
            };
            return {
                Initialize: function(e) {
                    $.extend(T, e),
                    T.host || (T.host = E.hostname),
                    T.systemApplication && c.Add(T.systemApplication, {
                        onMessage: u
                    })
                },
                Remove: function(t) {
                    if (t) {
                        var r = f(t);
                        r > -1 && (e("Removing", t),
                        v.splice(r, 1),
                        c.Count() || g())
                    }
                },
                Count: function() {
                    return v.length
                },
                Find: function(e) {
                    if (e) {
                        var t = f(e);
                        return t > -1 ? v[t] : void 0
                    }
                },
                Close: function(t) {
                    try {
                        t ? (e("Closing", t + " socket"),
                        c.Remove(t)) : (e("Closing", c.Count() + " sockets"),
                        g())
                    } catch (t) {
                        e("Close", t, Log.Type.Error, !0)
                    }
                },
                Send: function(t, r) {
                    try {
                        if (!t)
                            return;
                        var i = c.Find(t)
                          , n = new o(t);
                        return i && (e("Send", "to " + t),
                        Utilities.IsString(r) ? n.text = r : $.extend(n, r),
                        m.send(JSON.stringify(n))),
                        i
                    } catch (t) {
                        e("Send", t, Log.Type.Error, !0)
                    }
                },
                Add: function(r, o) {
                    try {
                        if (!r)
                            return;
                        var i = c.Find(r);
                        return i || (i = new t(r,o),
                        $.extend(i, o),
                        v.push(i),
                        e("Added", r + " (" + c.Count() + ")")),
                        p(),
                        i
                    } catch (t) {
                        e("Add", t, Log.Type.Error, !0)
                    }
                }
            }
        } catch (t) {
            e("Main", t, Log.Type.Error)
        }
    }
    ;
    l.WebSocket = c;
    var d = new function() {
        function c(e, t, r, o) {
            Log.Add("Tools." + e, t, r, o)
        }
        function p(e) {
            var t = $("#shell")
              , r = X.Editor.toolBars;
            r.developer.position.left = t.offset().left + t.width() + 40,
            r.page.position.left = t.offset().left - 50,
            r.process.position.left = t.offset().left + t.width() - 20,
            r.bootstrap.position.left = t.offset().left - 50,
            $.extend(!0, d.Config, X, e)
        }
        function f(e, t, r, o) {
            var i = z.find("#" + e);
            t ? (i.length || (i = $(r).attr("id", e),
            D ? D.after(i) : z.append(i),
            o && i.bind("click", o)),
            D = i) : i.remove()
        }
        function g() {
            try {
                if (c("updateToolbar", "Called"),
                !R)
                    return;
                var e = d.Config.Editor.toolBars.developer;
                R.css("left", e.position.left + "px").css("top", e.position.top + "px").data("lastLeft", e.position.left).data("lastTop", e.position.top),
                e.width && R.css("width", e.width + "px")
            } catch (e) {
                c("updateToolbar", e, Log.Type.Error)
            }
        }
        function m() {
            try {
                if (c("initToolbar", "Called"),
                R)
                    return;
                R = $('<div id="DevToolBar" class="verticalToolbar aboveSpinner"/>'),
                $("#bottom").after(R),
                z = $('<div class="toolbarSection">'),
                R.append(z),
                R.draggable({
                    cancel: "img",
                    start: function(e, t) {
                        Global.DisableHighlightingInChrome(!0)
                    },
                    stop: function(e, t) {
                        Global.DisableHighlightingInChrome(!1),
                        Global.UpdateLastPosition(R, t)
                    }
                }).resizable({
                    start: function() {
                        Global.DisableHighlightingInChrome(!0)
                    },
                    stop: function(e, t) {
                        Global.DisableHighlightingInChrome(!1)
                    }
                }).disableSelection(),
                $(window).bind("scroll.DevToolBar", function() {
                    R.is(":visible") && R.css("top", R.data("lastTop") + $(document).scrollTop() + "px")
                })
            } catch (e) {
                c("initToolbar", e, Log.Type.Error)
            }
        }
        function y() {
            var e = $("#SelectLanguageDlg");
            e.remove()
        }
        function C(e) {
            d.Config.loggingEnabled && Log.Show(e)
        }
        function v(e) {
            d.Config.reqlistEnabled && ReqList.Show(e)
        }
        function E(e) {
            d.Config.watchlistEnabled && WatchList.Show(e)
        }
        function T(e) {
            d.Config.ajaxEnabled && AjaxTab.Show(e)
        }
        function b() {
            t.Enabled && h.Show()
        }
        function S(e) {
            var t = $("#shell")
              , r = "30px";
            if (e)
                e = e.toLowerCase();
            else {
                e = d.Config.Editor.html.pageLayout,
                e = e.toLowerCase();
                var o = ["middle", "left", "right"]
                  , i = $.inArray(e, o);
                i >= 0 && i <= 1 ? i++ : i = 0,
                e = o[i]
            }
            switch (d.Config.Editor.html.pageLayout = e,
            e) {
            case "left":
                t.css("margin-left", r),
                t.css("margin-right", "auto");
                break;
            case "right":
                t.css("margin-left", "auto"),
                t.css("margin-right", r);
                break;
            default:
                t.css("margin-left", "auto"),
                t.css("margin-right", "auto")
            }
        }
        function L() {
            var e = o.ValidatePage() + i.ValidatePage();
            e ? jAlert("There are some warnings on this page. Please view details in the logging pane.<p>" + e + "</p>", "Page validation") : jAlert("No problems found. Page seem OK.", "Page validation")
        }
        function w() {
            function e(e) {
                if (e) {
                    T.find("option:selected").removeAttr("selected"),
                    T.find("option[value=" + e + "]").attr("selected", "selected");
                    var t = n(e);
                    $("#dtbLngs").attr("src", t.img)
                }
            }
            function i() {
                b.dialog("close")
            }
            function n(e) {
                var t = e.toLowerCase()
                  , r = $.grep(j, function(e, r) {
                    return e.abr == t
                });
                if (1 == r.length)
                    return r[0]
            }
            function a(e, t, r, o, i) {
                var n = {
                    abr: e,
                    txt: t,
                    img: r,
                    sel: o || !1
                };
                return Utilities.IsNumber(i) ? j.insert(i, n) : j.push(n),
                n
            }
            function s(e, t) {
                return $("button:contains(" + e + ")", t)
            }
            function l() {
                var e = T.find("option:selected");
                if (1 != e.length)
                    return void jAlert("Only a single language can be selected");
                var t = $(e[0]).val();
                return n(t)
            }
            function c() {
                var e = l();
                if (e) {
                    i();
                    var t = function(t) {
                        var r = $.parseJSON(t);
                        r.success ? (B.attr("src", e.img),
                        jAlert("Language will change with your next action.")) : jAlert("Selected language failed to load. Please try again.")
                    };
                    r.UserLanguage = e.abr,
                    r.CustomRequest("icontray.max?action=UpdateUserLanguage&Abbr=" + e.abr, t)
                }
            }
            function p() {
                var e = function(e) {
                    var t = $("<option/>").attr("value", e.abr).text(e.txt + " [" + e.abr + "]");
                    return e.sel && t.attr("selected", "selected"),
                    t
                }
                  , t = $([]);
                return $.each(j, function(r, o) {
                    t = t.add(e(o))
                }),
                t
            }
            function h() {
                var o = function(o) {
                    j = $.parseJSON(o),
                    t.Enabled && a("#l", "Language variables", "../../images/dev-lng-vars.png", !1, 0),
                    T.html(p()),
                    T.focus(),
                    e(t.Enabled ? u.CurrAbbreviation() : r.UserLanguage)
                };
                r.CustomRequest("icontray.max?action=ReloadLanguages", o)
            }
            function f() {
                var t = l();
                t && (u.Switch(t.abr),
                e(t.abr))
            }
            function g() {
                jConfirm("This will create all missing #L language variables!\nAre you sure?", "Confirm Creation", function(t) {
                    t && (e("#l"),
                    u.Switch("#l"),
                    u.RebuildVars(!1))
                })
            }
            function m() {
                var t = l();
                t && "#l" != t.abr && jConfirm("You are about to delete selected language!\nAre you sure?", "Confirm Delete", function(o) {
                    o && (r.CustomRequest("admintabs.max?action=DeleteLanguage&Abbr=" + t.abr),
                    u.Switch("#l"),
                    u.Delete(t.abr),
                    T.find("option:selected").remove(),
                    e("#l"))
                })
            }
            function y() {
                function e() {
                    for (var e = u.Languages(), t = e[U], r = k.localdata, o = 0; o < r.length; o++) {
                        var i = r[o];
                        t.elms[i.id] = {
                            c: i.capt,
                            t: i.tit,
                            h: i.hlp
                        }
                    }
                    u.Languages(e),
                    s.dialog("close")
                }
                function t() {
                    s.dialog("close")
                }
                function r() {
                    return [{
                        name: "id",
                        type: "integer"
                    }, {
                        name: "inp",
                        type: "string"
                    }, {
                        name: "capt",
                        type: "string"
                    }, {
                        name: "tit",
                        type: "string"
                    }, {
                        name: "hlp",
                        type: "string"
                    }]
                }
                function i() {
                    return [{
                        text: "ID",
                        datafield: "id",
                        width: "4%",
                        editable: !1
                    }, {
                        text: "Input",
                        datafield: "inp",
                        width: "20%",
                        editable: !1
                    }, {
                        text: "Caption",
                        datafield: "capt",
                        width: "20%",
                        editable: !0
                    }, {
                        text: "Title",
                        datafield: "tit",
                        width: "40%",
                        editable: !0
                    }, {
                        text: "Help Link",
                        datafield: "hlp",
                        width: "16%",
                        editable: !0
                    }]
                }
                function n(e) {
                    U = e;
                    var t = u.Languages()
                      , r = t[U]
                      , i = $("#rightColumn")
                      , n = [];
                    for (var a in r.elms) {
                        var s = r.elms[a]
                          , l = i.find('[mp-id="' + a + '"]');
                        if (l.length) {
                            var c = o.GetEditorComponent(l)
                              , d = c.refClassName
                              , p = "";
                            $.inArray(d, ["ValidCont", "ScriptCont", "EditableContent"]) == -1 && (!p && c.GetID && (p = c.GetID()),
                            !p && c.GetName && (p = c.GetName()),
                            p = p + " [" + d + "]",
                            n.push({
                                id: a,
                                inp: p,
                                capt: s.c,
                                tit: s.t,
                                hlp: s.h
                            }))
                        }
                    }
                    return n
                }
                var a = l();
                if (a) {
                    N.dialog("close"),
                    u.CurrAbbreviation() != a.abr && u.Switch(a.abr, a.txt);
                    var s = $("#EditLanguagesDlg");
                    if (s.length)
                        k.localdata = n(a.abr);
                    else {
                        var c = {
                            Cancel: t,
                            Apply: e
                        };
                        s = $('<div id="EditLanguagesDlg"></div>'),
                        s.html('<div><div id="jqxLngs"/></div>'),
                        s.dialog({
                            width: 900,
                            height: 600,
                            autoOpen: !1,
                            closeOnEscape: !1,
                            resizable: !0,
                            modal: !0,
                            buttons: c,
                            dialogClass: "clientDialog",
                            title: "Language Editor",
                            open: function() {
                                H.jqxGrid({
                                    height: s.height() - 5
                                })
                            },
                            close: function() {
                                N.dialog("open")
                            },
                            resizeStop: function() {
                                H.jqxGrid({
                                    height: s.height() - 5
                                })
                            }
                        }),
                        k = {
                            localdata: n(a.abr),
                            datatype: "array",
                            updaterow: function(e, t, r) {
                                k.localdata[e] = t,
                                r(!0)
                            },
                            datafields: r()
                        },
                        F = new jQ.jqx.dataAdapter(k),
                        H = jQ("#jqxLngs").jqxGrid({
                            width: "100%",
                            height: "100%",
                            source: F,
                            editable: !0,
                            enabletooltips: !0,
                            columnsresize: !0,
                            sortable: !0,
                            editMode: "click",
                            columns: i()
                        })
                    }
                    s.dialog("option", "title", "Language Editor - " + a.txt + " [" + a.abr + "]"),
                    s.dialog("open"),
                    H.jqxGrid("updatebounddata")
                }
            }
            function C() {
                var e = l();
                e && "#l" != e.abr && jPrompt("Please enter a new name", e.txt, "Re-name Language", function(t) {
                    t && (u.Rename(e.abr, t),
                    e.txt = t,
                    T.find("option:selected").html(t + " [" + e.abr + "]"),
                    r.CustomRequest("admintabs.max?action=UpdateLanguage&Abbr=" + e.abr + "&Name=" + encodeURIComponent(t)))
                })
            }
            function v() {
                var e = l();
                e && "#l" != e.abr && jConfirm("This will copy the active language to the selected language!\nAre you sure?", "Confirm Copy", function(t) {
                    t && (u.Copy(e.abr),
                    u.Switch(e.abr))
                })
            }
            function E() {
                jPrompt("Please enter an abbreviation and name.\nThe new language will inherit values from the active language.", "sp,Spanish", "New language", function(t) {
                    if (t) {
                        var o = t.split(",");
                        if (2 != o.length)
                            return void jAlert("Abbreviation must be comma separated from the name!");
                        var i = o[0].trim().toLowerCase()
                          , s = o[1].trim();
                        if (!i || !s)
                            return void jAlert("Both abbreviation and name must be entered!");
                        if ("#l" == i)
                            return void jAlert("Abbreviation RAW already exists!");
                        r.CustomRequest("admintabs.max?action=AddLanguage&Abbr=" + i + "&Name=" + encodeURIComponent(s));
                        var l = n(i);
                        l ? (u.Rename(i, s),
                        l.txt = s,
                        e(i),
                        T.find("option:selected").html(s + " [" + i + "]")) : (u.Copy(i, s),
                        a(i, s, "../../images/dev-lng-new.png"),
                        T.append($("<option></option>").val(i).html(s + " [" + i + "]")),
                        e(i)),
                        u.Switch(i)
                    }
                })
            }
            if (!d.Config.multilingual)
                return void jAlert("This system is not configured for multiple languages.");
            var T, b = $("#SelectLanguageDlg");
            if (!b.length) {
                var S, L, w;
                t.Enabled ? (S = {
                    "#L": g,
                    Edit: y,
                    Copy: v,
                    Rename: C,
                    Delete: m,
                    Add: E
                },
                L = f,
                w = 400) : (S = {
                    Close: i,
                    Select: c
                },
                L = c,
                w = 220),
                T = $('<select id="LanguageListDD" multiple=""></select>'),
                T.bind("dblclick", L).bind("keydown", function(e) {
                    e.keyCode == $.ui.keyCode.ENTER && L()
                }),
                b = $('<div id="SelectLanguageDlg"></div>'),
                b.html(T),
                b.dialog({
                    width: w,
                    height: 200,
                    autoOpen: !1,
                    closeOnEscape: !0,
                    resizable: !0,
                    modal: !t.Enabled,
                    buttons: S,
                    dialogClass: "clientDialog",
                    title: "Languages",
                    dragStop: function(e, t) {
                        Global.UpdateLastPosition(b, t)
                    },
                    open: function() {
                        Global.UpdateLastPosition(b),
                        t.Enabled || d.ToolsInForeground(!1),
                        T.find("option").length || h(),
                        T.focus()
                    },
                    close: function() {
                        t.Enabled || d.ToolsInForeground(!0)
                    }
                }),
                N = b,
                t.Enabled && $(window).bind("scroll.pinLanguageDlg", function() {
                    var e = b.parent();
                    e.is(":visible") && e.css("top", b.data("lastTop") + $(document).scrollTop() + "px")
                })
            }
            b.dialog("open");
            var G = $(".ui-dialog-buttonpane", b.parent());
            s("Load", G).attr("title", "This will make the selected language the active language"),
            s("Add", G).attr("title", "This will add a new language that will inherit values from the active language"),
            s("Rename", G).attr("title", "This will rename the selected language"),
            s("Copy", G).attr("title", "This will copy the active language to a selected language in the list"),
            s("Edit", G).attr("title", "This will open selected language in a language editor"),
            s("#L", G).attr("title", "This will create all missing #L language variables")
        }
        function G() {
            var e, o = function(t) {
                t && (q = t);
                var r = d.VRMName.toLowerCase();
                e.html(q),
                e.val([r]),
                e.focus()
            }, i = function() {
                var t = e.find("option:selected");
                return 1 != t.length ? void jAlert("Only a single VRM page can be open!") : $(t[0]).val()
            }, n = function() {
                r.CustomRequest("admintabs.max?action=ReloadPages", o)
            }, a = function() {
                var e = i();
                e && (p.dialog("close"),
                d.VRMName = e,
                !t.Standalone && d.Config.Editor.openInTab ? r.OpenTab("vrmEditor.html?id=" + r.SessionID + "&templateName=" + e) : r.EditorRequest(e))
            }, s = function() {
                var e = i();
                e && (p.dialog("close"),
                d.VRMName = e,
                !t.Standalone && d.Config.Editor.openInTab ? r.OpenTab("vrmEditor.html?id=" + r.SessionID + "&ro=1&templateName=" + e) : r.EditorRequest(e, !0))
            }, l = function() {
                function t() {
                    var t = o.find("#nvName").val()
                      , i = o.find("input[name=nvType]:checked").val();
                    t && i && (d.VRMName = t,
                    r.EditorCreateNew(t, i + ".vrm"),
                    e.html(""))
                }
                p.dialog("close");
                var o = $("#NewVrmDlg");
                if (!o.length) {
                    o = $('<div id="NewVrmDlg" style="text-align: left;"><label for="nvName">VRM name:</label><input type="text" id="nvName" value=""/></div>');
                    var i = $("<p/>").appendTo(o);
                    i.append('<input type="radio" name="nvType" id="nvAbsolute" value="absolute" checked/><label for="nvAbsolute">Absolute positioned page</label><br/>'),
                    d.Config.bootstrapEnabled && i.append('<input type="radio" name="nvType" id="nvBootstrap" value="bootstrap"/><label for="nvBootstrap">Bootstrap page</label><br/>'),
                    i.append('<input type="radio" name="nvType" id="nvEmpty" value="empty"/><label for="nvEmpty">Other (raw editing only)</label><br/>');
                    var n = {
                        Create: function() {
                            t(),
                            o.dialog("close")
                        }
                    };
                    o.dialog({
                        width: 300,
                        autoOpen: !1,
                        closeOnEscape: !0,
                        modal: !0,
                        buttons: n,
                        title: "New VRM",
                        open: function() {
                            o.find("#nvName").focus().select()
                        }
                    }),
                    o.keypress(function(e) {
                        e.keyCode == $.ui.keyCode.ENTER && t()
                    })
                }
                o.dialog("open")
            }, u = function() {
                var t = i();
                t && (p.dialog("close"),
                jPrompt("Please enter a new name", t, "Copy a VRM page", function(o) {
                    if (null != o) {
                        var i = function(t) {
                            try {
                                if (t = $.parseJSON(t),
                                !Utilities.IsObject(t))
                                    throw "Bad response! Expected object!";
                                if (t.newPage) {
                                    var o = t.newPage;
                                    return c("CopyPage", "New " + o + ".vrm & " + o + ".sql files created.", Log.Type.Debug),
                                    d.VRMName = o,
                                    r.EditorRequest(o),
                                    void e.html("")
                                }
                                if (t.error)
                                    return void jAlert(t.error);
                                throw "Bad response! No page or error!"
                            } catch (e) {
                                c("CopyPage", e, Log.Type.Error)
                            }
                        }
                          , n = $.param({
                            oldPage: t,
                            newPage: o
                        });
                        r.CustomRequest("admintabs.max?action=CopyPage", i, null, n)
                    }
                }))
            }, p = $("#SelectPageToEditDlg");
            if (!p.length) {
                e = $('<select id="VrmPageListDD" multiple=""></select>'),
                e.bind("dblclick", a).bind("keydown", function(e) {
                    e.keyCode == $.ui.keyCode.ENTER && a()
                }),
                p = $('<div id="SelectPageToEditDlg"></div>'),
                p.html(e);
                var h = {
                    Reload: n,
                    New: l,
                    Copy: u,
                    Edit: a,
                    View: s
                };
                p.dialog({
                    width: 350,
                    height: 400,
                    autoOpen: !1,
                    closeOnEscape: !0,
                    resizable: !0,
                    modal: !0,
                    buttons: h,
                    dialogClass: "clientDialog",
                    title: "Select a VRM page",
                    open: function() {
                        d.ToolsInForeground(!1),
                        e.find("option").length ? o() : n()
                    },
                    close: function() {
                        d.ToolsInForeground(!0)
                    }
                })
            }
            p.dialog("open")
        }
        function A() {
            var e = function(e) {
                o.dialog("close");
                var t = d.Config.Editor;
                $(document);
                if (e)
                    t = X,
                    $.extend(!0, d.Config, t);
                else {
                    t.openInTab = $("#openInTab", o)[0].checked;
                    var i = R;
                    i.length && (t.toolBars.developer.position.left = i.data("lastLeft"),
                    t.toolBars.developer.position.top = i.data("lastTop"),
                    t.toolBars.developer.width = Utilities.ToNumber(i.width())),
                    i = $("#RuleToolbar"),
                    i.length && (t.toolBars.process.position.left = i.data("lastLeft"),
                    t.toolBars.process.position.top = i.data("lastTop"),
                    t.toolBars.process.width = Utilities.ToNumber(i.width())),
                    i = $("#ComponentToolbar"),
                    i.length && (t.toolBars.page.position.left = i.data("lastLeft"),
                    t.toolBars.page.position.top = i.data("lastTop"),
                    t.toolBars.page.width = Utilities.ToNumber(i.width())),
                    i = $("#BootstrapToolbar"),
                    i.length && (t.toolBars.bootstrap.position.left = i.data("lastLeft"),
                    t.toolBars.bootstrap.position.top = i.data("lastTop"),
                    t.toolBars.bootstrap.width = Utilities.ToNumber(i.width()));
                    var n = function(e, t) {
                        t.data("lastLeft") && t.data("lastTop") && (e.position.left = t.data("lastLeft"),
                        e.position.top = t.data("lastTop"),
                        e.size.width = Utilities.ToNumber(t.parent().width()),
                        e.size.height = Utilities.ToNumber(t.parent().height()))
                    };
                    i = $("#LoggingDiv"),
                    i.length && n(t.tabs.logging, i),
                    i = $("#ReqListDiv"),
                    i.length && n(t.tabs.reqList, i),
                    i = $("#WatchListDiv"),
                    i.length && n(t.tabs.watchList, i),
                    i = $("#AjaxDiv"),
                    i.length && n(t.tabs.ajax, i),
                    i = $("#SandboxDiv"),
                    i.length && n(t.tabs.sandbox, i)
                }
                var a = 'Cfg="Editor":' + encodeURIComponent(JSON.stringify(t))
                  , s = "admintabs.max?action=SaveConfig";
                r.CustomRequest(s, null, null, a)
            }
              , o = $("#SaveConfigurationDlg");
            if (!o.length) {
                o = $('<div id="SaveConfigurationDlg"></div>');
                var i = o.html('<p>You can either save your current configuration or reset to the default settings.<p/><p>In order to see the default setting you must re-login.</p><p id="userPreferences"></p>')
                  , n = $("#userPreferences", i);
                n.append('<input type="checkbox" id="openInTab" value="1"/><label for="openInTab">Open editors in new tab</label><br/>');
                var a = {
                    "Reset to default": function() {
                        e(!0)
                    },
                    "Save current": function() {
                        e(!1)
                    }
                };
                o.dialog({
                    width: 370,
                    autoOpen: !1,
                    closeOnEscape: !0,
                    resizable: !1,
                    modal: !0,
                    buttons: a,
                    dialogClass: "clientDialog",
                    title: "Save User Preferences",
                    open: function() {
                        t.Enabled || d.ToolsInForeground(!1),
                        $("#openInTab", o)[0].checked = d.Config.Editor.openInTab
                    },
                    close: function() {
                        t.Enabled || d.ToolsInForeground(!0)
                    }
                })
            }
            o.dialog("open")
        }
        function P(e) {
            e = e ? e : "",
            jAlert(e + l.StingrayJsVersion)
        }
        function x() {
            r.SessionOK() && (r.CustomRequest("icontray.max?action=workflow", function(e) {
                "none" != e ? O.attr("src", "../../images/32px-Crystal_Clear_app_access_" + e + ".png") : O.css("display", "none")
            }),
            setTimeout(x, 1e3 * V))
        }
        function M(e) {
            function o(e, t) {
                return Log.Debug(t + " canceled!"),
                !1
            }
            c("shortcuts", "Called");
            var i = Mousetrap;
            i && (i.reset(),
            i.bind("backspace", o),
            e ? (i.bind("ctrl+s", function() {
                return PropertyEd.QuickSave(),
                !1
            }),
            i.bind("ctrl+q", function() {
                PropertyEd.Close()
            }),
            i.bind("ctrl+c", function() {
                t.Copy(!1)
            }),
            i.bind("ctrl+x", function() {
                t.Copy(!0)
            }),
            i.bind("ctrl+v", function() {
                t.Paste()
            }),
            i.bind("ctrl+shift+f", function() {
                t.Search()
            }),
            i.bind("ctrl+z", function() {
                t.Undo()
            }),
            i.bind("ctrl+y", function() {
                t.Redo()
            }),
            i.bind("del", function() {
                t.Delete()
            }),
            i.bind("ctrl+h", function() {
                return n.EditHTML(),
                !1
            }),
            i.bind("ctrl+p", function() {
                return t.ShowProperties(),
                !1
            }),
            i.bind("f1", t.ShowHelp),
            i.bind("ctrl+a", function() {
                return t.Select("all")
            }),
            i.bind("ctrl+b", function() {
                return t.Select("below")
            }),
            i.bind("ctrl+r", function() {
                return t.Select("right")
            }),
            i.bind("ctrl+f5", o),
            i.bind("f5", o)) : (i.bind("ctrl+l", function() {
                return r.EditorRequest(),
                !1
            }),
            i.bind("ctrl+o", function() {
                return G(),
                !1
            })))
        }
        try {
            var R, D, I, N, k, F, H, B, U, O, V, q, z = null, j = [], W = document.title, X = {
                bootstrapEnabled: !0,
                Editor: {
                    openInTab: !0,
                    html: {
                        snap: [5, 5],
                        pageLayout: "middle"
                    },
                    ace: {
                        enabled: !0,
                        theme: "chrome",
                        codeTips: !1,
                        wordWrap: !1
                    },
                    property: {
                        pinned: !1
                    },
                    toolBars: {
                        developer: {
                            width: 0,
                            position: {
                                left: 0,
                                top: 100
                            }
                        },
                        page: {
                            width: 0,
                            position: {
                                left: 0,
                                top: 100
                            }
                        },
                        process: {
                            width: 0,
                            position: {
                                left: 0,
                                top: 100
                            }
                        },
                        bootstrap: {
                            width: 0,
                            position: {
                                left: 0,
                                top: 100
                            }
                        }
                    },
                    tabs: {
                        logging: {
                            pinned: !1,
                            viewStyle: "float",
                            position: {
                                left: "center",
                                top: "middle"
                            },
                            size: {
                                width: 600,
                                height: 400
                            }
                        },
                        reqList: {
                            pinned: !1,
                            filter: "",
                            viewStyle: "float",
                            showAll: !1,
                            filterVars: !1,
                            position: {
                                left: "center",
                                top: "middle"
                            },
                            size: {
                                width: 600,
                                height: 400
                            }
                        },
                        watchList: {
                            pinned: !1,
                            filter: "",
                            viewStyle: "float",
                            position: {
                                left: "center",
                                top: "middle"
                            },
                            size: {
                                width: 600,
                                height: 400
                            }
                        },
                        ajax: {
                            pinned: !1,
                            viewStyle: "float",
                            position: {
                                left: "center",
                                top: "middle"
                            },
                            size: {
                                width: 600,
                                height: 400
                            }
                        },
                        process: {
                            extendBy: 500
                        },
                        sandbox: {
                            pinned: !1,
                            position: {
                                left: "center",
                                top: "middle"
                            },
                            size: {
                                width: 600,
                                height: 400
                            }
                        }
                    }
                }
            };
            return {
                description: "Debugging tools",
                Initialized: !1,
                Enabled: !1,
                VRMName: "",
                Config: {},
                ConfigUpdate: function(e) {
                    try {
                        e = $.parseJSON(e),
                        $.extend(this.Config, e),
                        this.ShowToolbar()
                    } catch (e) {
                        c("ConfigUpdate", e, Log.Type.Error)
                    }
                },
                ShowToolbar: function() {
                    try {
                        var e, r = this.Config;
                        if (!this.Initialized || r.isEditor)
                            return;
                        y(),
                        M(t.Enabled),
                        e = r.loggingEnabled,
                        f("dtbLog", e, '<img title="Open a Log Viewer" src="../../images/dev-logging.png" />', function() {
                            C()
                        }),
                        e = r.reqlistEnabled,
                        f("dtbRL", e, '<img title="Open a ReqList Viewer" src="../../images/dev-reqlist.png" />', function() {
                            v()
                        }),
                        e = !t.Enabled && r.watchlistEnabled,
                        f("dtbWL", e, '<img title="Open a WatchList Viewer" src="../../images/dev-watchlist.png" />', function() {
                            E()
                        }),
                        e = !t.Enabled && r.ajaxEnabled,
                        f("dtbAjax", e, '<img title="Open an Ajax Viewer" src="../../images/dev-ajax.png" />', function() {
                            T()
                        }),
                        e = !0,
                        f("dtbPos", e, '<img title="Toggle Page Layout" src="../../images/dev-layout.png" />', function() {
                            S()
                        }),
                        e = !t.Enabled,
                        f("dtbSel", e, '<img title="Select a page to edit" src="../../images/dev-select.png" />', function() {
                            G()
                        }),
                        e = t.Enabled && r.multilingual,
                        f("dtbLngs", e, '<img title="Select a language" src="../../images/dev-lng-vars.png" />', function() {
                            w()
                        }),
                        e = JSON && JSON.stringify,
                        f("dtbCfg", e, '<img title="Save current configuration and layout" src="../../images/dev-config.png" />', function() {
                            A()
                        }),
                        e = t.Enabled,
                        f("dtbSrch", e, '<img title="Find on the page" src="../../images/dev-search.png" />', function() {
                            t.Search()
                        }),
                        e = t.Enabled,
                        f("dtbVal", e, '<img title="Validate this page" src="../../images/dev-validation.png" />', function() {
                            L()
                        }),
                        e = t.Enabled,
                        f("dtbSand", e, '<img title="Sandbox" src="../../images/dev-sandbox.png" />', function() {
                            b()
                        }),
                        e = t.Enabled && !t.LockedBy,
                        f("dtbQSave", e, '<img title="Save without leaving the editor (Quick save)" src="../../images/dev-quick.png" />', function() {
                            PropertyEd.QuickSave()
                        }),
                        e = t.Enabled && !t.LockedBy,
                        f("dtbFSave", e, '<img title="Save and exit (Full save)" src="../../images/dev-save.png" />', function() {
                            PropertyEd.Save()
                        }),
                        e = t.Enabled,
                        f("dtbExit", e, '<img title="Exit without saving the page (Cancel editing)" src="../../images/dev-exit.png" />', function() {
                            PropertyEd.Close()
                        }),
                        e = !t.Enabled,
                        f("dtbVer", e, '<img title="Show version" src="../../images/dev-version.png" />', function() {
                            P("Client Version: ")
                        }),
                        R.toggleClass("aboveSpinner", !t.Enabled)
                    } catch (e) {
                        c("ShowToolbar", e, Log.Type.Error)
                    }
                },
                Initialize: function(t) {
                    try {
                        var o = $("#DeveloperTabs");
                        if (!o.length || !o.find("div").is(":visible"))
                            return;
                        o.tabs(),
                        r.EnableSessionTimer = !1,
                        p(t),
                        Log.Initialize(),
                        ReqList.Initialize(),
                        WatchList.Initialize(),
                        AjaxTab.Initialize(),
                        e.Initialize(),
                        RulesMaker.Initialize(),
                        s.Initialize(),
                        n.Initialize(),
                        h.Initialize(),
                        m(),
                        g(),
                        S(this.Config.Editor.html.pageLayout),
                        I = $("#vrmName", "#bottom"),
                        this.Enabled = !0,
                        this.Initialized = !0,
                        this.ShowToolbar()
                    } catch (e) {
                        c("Initialize", e, Log.Type.Error)
                    }
                },
                AceEnabled: function() {
                    return !a.IsMSIE() && window.ace && this.Config.Editor.ace.enabled
                },
                jqxGridsEnabled: function() {
                    var e = window.jQ && window.jqxGrid;
                    return e || c("jqxGrid", "jQX grid widget is missing or incorrectly installed.", Log.Type.Warning),
                    e
                },
                jqxNotificationsEnabled: function() {
                    var e = window.jQ && window.jqxNotification;
                    return e || c("jqxNotification", "jQX notification widget is missing or incorrectly installed.", Log.Type.Warning),
                    e
                },
                EditorEnabled: function() {
                    return this.Config.editorEnabled
                },
                ToolsInForeground: function(e) {
                    $("#DevToolBar").toggleClass("aboveSpinner", e),
                    $("#LoggingDiv").parent().toggleClass("aboveSpinner", e),
                    $("#ReqListDiv").parent().toggleClass("aboveSpinner", e),
                    $("#WatchListDiv").parent().toggleClass("aboveSpinner", e),
                    $("#AjaxDiv").parent().toggleClass("aboveSpinner", e)
                },
                ShowVrmName: function(e) {
                    if (this.Initialized && e) {
                        d.VRMName = e;
                        var r = e.toUpperCase();
                        t.Enabled ? (I.html("Editing - " + r),
                        document.title = "Editing - " + r) : (I.html("Showing - " + r),
                        document.title = W)
                    }
                },
                ShowLanguages: function() {
                    w()
                },
                InitLanguages: function(e) {
                    B = $(e),
                    r.SessionOK() && B.length && r.CustomRequest("icontray.max?action=GetUserLanguage", function(e) {
                        var t = $.parseJSON(e);
                        t.abr && (r.UserLanguage = t.abr,
                        B.attr("src", t.img))
                    })
                },
                InitWorkflow: function(e, t) {
                    O = $(e),
                    V = t || 300,
                    O.length && x()
                }
            }
        } catch (e) {
            c("Main", e, Log.Type.Error)
        }
    }
    ;
    l.Tools = d;
    var u = new function() {
        function e(e, t, r, o) {
            Log.Add("LngMgr." + e, t, r, o)
        }
        function t(e) {
            return E[e]
        }
        function r(e, t) {
            return e.elms[t]
        }
        function i(e, t, r, o, i) {
            var n = new y(r,o,i);
            return e.elms[t] = n,
            n
        }
        function n(e, t) {
            var n = o.GetComponentID(t.GetControl())
              , a = r(e, n)
              , s = ""
              , l = ""
              , c = "";
            t.GetCaption && (s = t.GetCaption()),
            t.GetTooltip && (l = t.GetTooltip()),
            t.GetHelpLink && (c = t.GetHelpLink()),
            a ? (a.c = s,
            a.t = l,
            a.h = c) : a = i(e, n, s, l, c)
        }
        function a(e) {
            return $.inArray(e, ["ValidCont", "ScriptCont", "EditableContent"]) == -1
        }
        function s(e) {
            $(".component", "#rightColumn").each(function() {
                var t = o.GetEditorComponent(this);
                a(t.refClassName) && n(e, t)
            })
        }
        function l(e, t) {
            var n = o.GetComponentID(t.GetControl())
              , a = r(e, n)
              , s = ""
              , l = ""
              , c = "";
            a ? (s = a.c,
            l = a.t,
            c = a.h) : a = i(e, n, s, l, c),
            t.SetCaption && t.SetCaption(s),
            t.SetTooltip && t.SetTooltip(l),
            t.SetHelpLink && t.SetHelpLink(c)
        }
        function c(e) {
            e = e || T,
            $(".component", "#rightColumn").each(function() {
                var t = o.GetEditorComponent(this);
                a(t.refClassName) && l(e, t)
            })
        }
        function p(e) {
            var t = u.Add("#l", "Language variables");
            return t.elms = {},
            $(".component", "#rightColumn").each(function() {
                var r = o.GetEditorComponent(this);
                if (a(r.refClassName)) {
                    var n, s, l, c, d = o.GetComponentID(r.GetControl());
                    !n && r.GetID && (n = r.GetID()),
                    !n && r.GetName && (n = r.GetName()),
                    n || (n = d),
                    e || (r.GetCaption && (s = r.GetCaption()),
                    r.GetTooltip && (l = r.GetTooltip()),
                    r.GetHelpLink && (c = r.GetHelpLink())),
                    s = s || "#L" + n + "-Caption#",
                    l = l || "#L" + n + "-ToolTip#",
                    c = c || "#L" + n + "-HelpLink#",
                    i(t, d, s, l, c)
                }
            }),
            t
        }
        function h(t, r) {
            try {
                e("SwitchFromTo", "Called"),
                $(".component", "#rightColumn").each(function() {
                    var e = o.GetEditorComponent(this);
                    a(e.refClassName) && (n(t, e),
                    l(r, e))
                }),
                T = r
            } catch (t) {
                e("SwitchFromTo", t, Log.Type.Error)
            }
        }
        function f(e) {
            for (var t in E) {
                var r = E[t];
                r.elms[e] = null,
                delete r.elms[e]
            }
        }
        function g() {
            var e = $("#rightColumn")
              , t = u.Get("#l");
            for (var r in t.elms) {
                var o = '[mp-id="' + r + '"]';
                e.find(o).length || f(r)
            }
        }
        function m(e, t, r) {
            this.abbr = e,
            this.name = t,
            this.elms = r || {}
        }
        function y(e, t, r) {
            this.c = e,
            this.t = t,
            this.h = r
        }
        function C() {
            E = {},
            b = null,
            T = null,
            S = !1
        }
        function v() {
            var e = [];
            for (var r in E)
                "#l" != r && e.push(r);
            var o = e.join(",");
            jPrompt("This page seem to be multi-lingual but your system is not.\nKeep one of the listed language to translate this page into", o, "Confirm Translation", function(e) {
                if (null != e) {
                    var r = t(e);
                    r ? (T = t("#l"),
                    u.Switch(r.abbr),
                    C()) : setTimeout(v, 10)
                }
            })
        }
        try {
            var E = {}
              , T = null
              , b = null
              , S = !1
              , L = null;
            return {
                description: "Language Manager",
                Load: function(r) {
                    S = !1;
                    try {
                        if (Utilities.IsString(r) && (r = $.parseJSON(r)),
                        E = r || {},
                        L = E,
                        S = !0,
                        d.Config.multilingual) {
                            var o = t("#l");
                            o ? (b = o,
                            T = o) : (T = this.Copy("en", "English"),
                            b = this.RebuildVars(!0),
                            this.Switch("#l"))
                        } else
                            this.Count() < 2 ? C() : v()
                    } catch (t) {
                        e("Load", t, Log.Type.Error, !0)
                    }
                    return E
                },
                Save: function() {
                    if (!S)
                        return "{}";
                    try {
                        this.Switch("#l"),
                        g()
                    } catch (t) {
                        e("Save", t, Log.Type.Error, !0),
                        E = L
                    }
                    return JSON.stringify(E)
                },
                Count: function() {
                    var e = 0;
                    for (var t in E)
                        e++;
                    return e
                },
                CurrAbbreviation: function() {
                    return T.abbr
                },
                CurrName: function() {
                    return T.name
                },
                Exists: function(e) {
                    if (!S)
                        return !1;
                    var r = t(e);
                    return Utilities.IsObject(r)
                },
                Rename: function(e, t) {
                    if (!S)
                        return null;
                    var r = this.Add(e, t);
                    return r.name = t,
                    r
                },
                Delete: function(e) {
                    if (S)
                        for (var t in E)
                            if (t == e)
                                return E[t] = null,
                                void delete E[t]
                },
                Add: function(e, r) {
                    if (!S)
                        return null;
                    var o = t(e);
                    return o || (o = new m(e,r),
                    E[e] = o),
                    o
                },
                Get: function(e, t) {
                    if (S)
                        return this.Add(e, t)
                },
                Switch: function(e, t) {
                    if (!S)
                        return null;
                    var r = this.Add(e, t);
                    return h(T, r),
                    r
                },
                Languages: function(e) {
                    return S ? e && Utilities.IsObject(e) ? (E = e,
                    void c()) : E : null
                },
                RebuildVars: function(e) {
                    if (S)
                        return b = p(e),
                        c(),
                        b
                },
                Copy: function(e, t) {
                    if (!S)
                        return null;
                    var r = this.Add(e, t);
                    return s(r),
                    r
                }
            }
        } catch (t) {
            e("Main", t, Log.Type.Error)
        }
    }
    ;
    l.LanguageMgr = u;
    var p = function(e, t) {
        function r(e, t, r, o) {
            Log.Add("AceEditor." + e, t, r, o)
        }
        function o(e, t) {
            return void 0 == e ? a ? a.getValue() : s.val() : void (a ? a.setValue(e, t) : s.val(e))
        }
        function i(e, t) {
            s = $(e),
            c = t || {},
            a = Global.ConvertToAceEditor(s, c),
            a || s.css(c.styles || {}),
            o(c.value)
        }
        function n() {
            return a ? $(a.container) : $(s)
        }
        try {
            var a, s, c;
            l.Tools.AceEnabled();
            return i(e, t),
            {
                Value: function(e, t) {
                    return o(e, t)
                },
                Resize: function() {
                    a && a.resize()
                },
                Height: function(e) {
                    var t = n();
                    return void 0 == e ? t.height() : (t.height(e),
                    void this.Resize())
                },
                Width: function(e) {
                    var t = n();
                    return void 0 == e ? t.width() : (t.width(e),
                    void this.Resize())
                },
                Remove: function() {
                    a && a.destroy(),
                    a = null,
                    s = null
                },
                ReadOnly: function(e) {
                    return void 0 == e ? a ? a.getReadOnly() : s.attr("disabled") : void (a ? a.setReadOnly(e) : s.attr("disabled", e))
                },
                Focus: function() {
                    a ? a.focus() : s.focus()
                },
                ScrollToLine: function(e) {
                    a ? (a.scrollToRow(e),
                    a.gotoLine(e + 1, 0)) : s.scrollTop(e + 1)
                }
            }
        } catch (e) {
            r("Main", e, Log.Type.Error)
        }
    };
    l.Constructors.AceEditor = p;
    var h = new function(e) {
        function t(e, t, r, o) {
            Log.Add("Sandbox." + e, t, r, o)
        }
        function o() {
            s = l.Tools.Config.Editor.tabs.sandbox
        }
        function i() {
            var e = $(".ui-dialog-buttonpane", p.parent())
              , t = function(t) {
                return $("button:contains(" + t + ")", e)
            };
            s.pinned ? t("Pin").html("Unpin") : t("Unpin").html("Pin")
        }
        function n() {
            var e = "../../help/advanced.htm"
              , t = "width=800,height=800,scrollbars=yes,resizable=yes,toolbar=no,location=no,menubar=no,status=no";
            window.open(e, "StingrayHelp", t)
        }
        try {
            var a, s, c, d, u, p = null, f = !1;
            return {
                Enabled: !1,
                Initialized: !1,
                Show: function(e) {
                    this.Initialized && p.dialog("open")
                },
                Hide: function() {
                    this.Initialized && p.dialog("close")
                },
                Pin: function(t) {
                    t == e ? s.pinned = !s.pinned : s.pinned = t,
                    i(),
                    s.pinned ? $(window).bind("scroll.pinSandboxDiv", function() {
                        var e = p.parent();
                        e.is(":visible") && e.css("top", p.data("lastTop") + $(document).scrollTop() + "px")
                    }) : $(window).unbind("scroll.pinSandboxDiv")
                },
                Execute: function() {
                    try {
                        a.tabs("select", 2),
                        u.Value("Processing..."),
                        u.ScrollToLine(0);
                        var e = "&sb-code=" + encodeURIComponent(c.Value())
                          , o = "&sb-vars=" + encodeURIComponent(d.Value())
                          , i = "admintabs.max?action=ExecuteScript"
                          , n = function(e) {
                            u.Value(e),
                            u.ScrollToLine(0)
                        };
                        r.CustomRequest(i, n, null, e + o)
                    } catch (e) {
                        t.Add("Execute", e, Log.Type.Error)
                    }
                },
                Initialize: function() {
                    try {
                        if (h.Initialized)
                            return;
                        o(),
                        p = $("#SandboxDiv"),
                        a = $("#cs-tabs", p);
                        var e = {
                            Execute: h.Execute,
                            Help: n,
                            Pin: function() {
                                h.Pin()
                            }
                        };
                        p.dialog({
                            title: "Sandbox",
                            width: s.size.width,
                            height: s.size.height,
                            minWidth: 400,
                            minHeight: 300,
                            position: [s.position.left, s.position.top],
                            autoOpen: !1,
                            closeOnEscape: !1,
                            modal: !1,
                            buttons: e,
                            resizeStart: function() {
                                Global.DisableHighlightingInChrome(!0)
                            },
                            resizeStop: function() {
                                Global.DisableHighlightingInChrome(!1),
                                c.Height(a.height() - 90),
                                d.Height(a.height() - 90),
                                u.Height(a.height() - 75)
                            },
                            dragStart: function(e, t) {
                                Global.DisableHighlightingInChrome(!0)
                            },
                            dragStop: function(e, t) {
                                Global.DisableHighlightingInChrome(!1),
                                Global.UpdateLastPosition(p, t)
                            },
                            open: function(e) {
                                i(),
                                p.data("lastLeft") && p.data("lastTop") ? p.dialog("option", {
                                    position: [p.data("lastLeft"), p.data("lastTop")]
                                }) : Global.UpdateLastPosition(p),
                                f || (a.tabs(),
                                c = new l.Constructors.AceEditor($("#ta-ss", a),{
                                    language: "server script",
                                    focus: !0
                                }),
                                c.Height(a.height() - 90),
                                d = new l.Constructors.AceEditor($("#ta-vars", a),{
                                    language: "text",
                                    focus: !1
                                }),
                                d.Height(a.height() - 90),
                                u = new l.Constructors.AceEditor($("#ta-resp", a),{
                                    language: "text",
                                    focus: !1
                                }),
                                u.Height(a.height() - 75),
                                f = !0)
                            }
                        }),
                        h.Pin(s.pinned || !1),
                        h.Initialized = !0
                    } catch (e) {
                        t.Add("Initialize", e, Log.Type.Error)
                    }
                }
            }
        } catch (e) {
            t("Main", e, Log.Type.Error)
        }
    }
    ;
    return l.Editor.Sandbox = h,
    l
}),
window.CustomScript = window.CustomScript || {},
define("Log", ["Editor"], function(e) {
    var t = new function() {
        this.Error = "error",
        this.Info = "info",
        this.Warning = "warning",
        this.Debug = "debug",
        this.Search = "search"
    }
      , r = new function(e) {
        function o(e) {
            m++;
            var t = $("<tr/>");
            t.append("<td class='index'>" + m + "</td>"),
            t.append("<td class='time'>" + e.Time + "</td>"),
            t.append("<td class='source'>" + e.Source + "</td>");
            var r = $("<td class='" + e.Type + "' />");
            return r.append(e.Message),
            t.append(r),
            t
        }
        function i(e, t, r) {
            this.Source = e,
            this.Message = t,
            this.Time = Utilities.GetFormattedTime(),
            this.Type = r
        }
        function n() {
            m = 0,
            g && g.empty().remove(),
            g = $('<table class="Logging"><tr><th>ID</th><th>Time</th><th>Source</th><th>Message</th></tr></table>'),
            p.append(g),
            $("#dtbLog").removeClass("error warning debug search")
        }
        function a() {
            m < 3e3 || m % 100 == 0 && g.find("tr:gt(0):lt(101)").empty().remove()
        }
        function s() {
            h = MP.Tools.Config.Editor.tabs.logging,
            h.size || (h.size = {
                width: 600,
                height: 400
            })
        }
        function l() {
            r.Enabled ? f.dialog("option", "title", "Log viewer") : f.dialog("option", "title", "Log viewer - Disabled");
            var e = $(".ui-dialog-buttonpane", f.parent())
              , t = function(t) {
                return $("button:contains(" + t + ")", e)
            };
            r.Enabled ? t("Enable").html("Disable") : t("Disable").html("Enable"),
            h.pinned ? t("Pin").html("Unpin") : t("Unpin").html("Pin"),
            u == d ? t("Tab View").html("View Here") : t("View Here").html("Tab View")
        }
        function c(e) {
            if (!Utilities.IsObject(e))
                return e;
            var t;
            return t = e.message ? e.message : e.Message.description,
            t += " [",
            e.fileName && (t += e.fileName + ", "),
            e.lineNumber && (t += e.lineNumber + ", "),
            t += e.EntryID ? e.EntryID : m,
            t += "]"
        }
        var d, u, p, h, f = null, g = null, m = 0, y = new Date;
        return {
            Enabled: !1,
            Initialized: !1,
            Debug: function(e) {
                this.Add("DEBUG", e, t.Debug)
            },
            Add: function(r, n, s, l) {
                if (s = s || t.Info,
                l = l || !1,
                this.Initialized) {
                    if (this.Enabled && p.is(":visible") || $.inArray(s, [t.Error, t.Warning, t.Debug, t.Search]) > -1) {
                        a();
                        var d = ""
                          , u = Utilities.IsObject(n);
                        s == t.Search && u ? (d = $("<a>Locate</a>"),
                        d.bind("click", function() {
                            var e;
                            if (n.GetControl)
                                e = n.GetControl();
                            else {
                                e = n.Icon.GetImage();
                                var t = e.parent().attr("ID");
                                RulesMaker.SetCurrentProcess(t)
                            }
                            Global.ScrollToElement(e, null, function() {
                                Global.ShakeElement(e)
                            })
                        }),
                        n.HighlightAsFound(!0)) : d = c(n);
                        var h = new i(r,d,s);
                        g.append(o(h)),
                        h.Type != t.Info && $("#dtbLog").toggleClass(h.Type, !0)
                    }
                    if (s == t.Error && !l)
                        throw n
                } else {
                    if (s != t.Error)
                        return;
                    window.console != e && window.console.log != e && console.log(r, " Error: ", n);
                    var f = new Date
                      , m = new Date(f - y);
                    if (m > 2e3 && $.inArray(r, ["Comm.CustomRequest", "Comm.SerialRequest", "Comm.LinkRequest"]) == -1) {
                        y = f;
                        var C = "ReqList=" + ReqList.GetList()
                          , v = $("#middle").attr("VRMName")
                          , d = c(n)
                          , E = "Logging.max?action=log&Source=" + r + " (" + Global.Version() + ")&VRMName=" + v + "&Message=" + d;
                        Communication.CustomRequest(E, null, null, C)
                    }
                }
            },
            ClearTab: function() {
                this.Initialized && (n(),
                this.Add("Log.ClearTab", "Called"))
            },
            Show: function(e) {
                this.Initialized && (f.dialog("open"),
                e && !this.Enabled && this.Switch())
            },
            Hide: function() {
                this.Initialized && f.dialog("close")
            },
            Switch: function() {
                this.Enabled = !this.Enabled,
                l()
            },
            Pin: function(t) {
                t == e ? h.pinned = !h.pinned : h.pinned = t,
                l(),
                h.pinned ? $(window).bind("scroll.pinLogDiv", function() {
                    var e = f.parent();
                    e.is(":visible") && e.css("top", f.data("lastTop") + $(document).scrollTop() + "px")
                }) : $(window).unbind("scroll.pinLogDiv")
            },
            MoveTo: function(e) {
                e = e ? e.toLowerCase() : u == f ? "tab" : "float",
                h.viewStyle = e;
                var t = p.detach()
                  , o = 'This view is inactive. You can either <a class="activateViewLink">activate this view</a> or <a class="goToViewLink">go to the other view</a>.';
                "tab" == e ? (u = d,
                this.Hide(),
                f.html(o),
                f.find(".activateViewLink").bind("click", function() {
                    r.MoveTo("float")
                }),
                f.find(".goToViewLink").bind("click", function() {
                    r.Hide(),
                    Global.ScrollToElement($("#LoggingLink"))
                }),
                d.html(""),
                t.appendTo(d),
                this.Initialized && Global.ScrollToElement($("#LoggingLink"))) : (u = f,
                d.html(o),
                d.find(".activateViewLink").bind("click", function() {
                    r.MoveTo("tab")
                }),
                d.find(".goToViewLink").bind("click", function() {
                    r.Show(),
                    Global.ScrollToElement(f.parent())
                }),
                f.html(""),
                t.appendTo(f)),
                l()
            },
            Initialize: function() {
                try {
                    if (!MP.Tools.Config.loggingEnabled || this.Initialized)
                        return;
                    s(),
                    d = $("#LoggingTab"),
                    f = $("#LoggingDiv"),
                    f.length || (f = $('<div id="LoggingDiv"><div class="toolWrapper"></div></div>')),
                    p = f.find(".toolWrapper"),
                    u = f;
                    var e = {
                        Clear: function() {
                            r.ClearTab()
                        },
                        Enable: function() {
                            r.Switch()
                        },
                        Pin: function() {
                            r.Pin()
                        },
                        "Tab View": function() {
                            r.MoveTo()
                        }
                    };
                    f.dialog({
                        width: h.size.width,
                        height: h.size.height,
                        position: [h.position.left, h.position.top],
                        minWidth: 300,
                        minHeight: 200,
                        autoOpen: !1,
                        closeOnEscape: !1,
                        modal: !1,
                        buttons: e,
                        dialogClass: "aboveSpinner",
                        resizeStart: function() {
                            Global.DisableHighlightingInChrome(!0)
                        },
                        resizeStop: function() {
                            Global.DisableHighlightingInChrome(!1)
                        },
                        dragStart: function(e, t) {
                            Global.DisableHighlightingInChrome(!0)
                        },
                        dragStop: function(e, t) {
                            Global.DisableHighlightingInChrome(!1),
                            Global.UpdateLastPosition(f, t)
                        },
                        open: function(e) {
                            l(),
                            f.data("lastLeft") && f.data("lastTop") ? f.dialog("option", {
                                position: [f.data("lastLeft"), f.data("lastTop")]
                            }) : Global.UpdateLastPosition(f)
                        }
                    }),
                    n(),
                    this.MoveTo(h.viewStyle),
                    this.Pin(h.pinned || !1),
                    this.Initialized = !0
                } catch (e) {
                    this.Add("Initialize", e, t.Error)
                }
            }
        }
    }
    ;
    return r.Type = t,
    r
}),
TransferListHelper = new function() {
    function e(e, t, r, o) {
        Log.Add(i + e, t, r, o)
    }
    function t(e, t) {
        this.Left = e,
        this.Right = t
    }
    function r(r) {
        try {
            e("GetLists", "Called");
            var o = $(r).parents(".StaticContainer")
              , i = $(o).find("select")[0]
              , n = $(o).find("select")[1];
            return new t($(i),$(n))
        } catch (t) {
            e("GetLists", t, Log.Type.Error)
        }
    }
    function o(t, r, o) {
        try {
            e("TransferSelected", "Called");
            for (var i = [], n = 0; n < t[0].options.length; n++) {
                var a = t[0].options[n];
                (a.selected || o) && i.push(a)
            }
            for (var n = 0; n < i.length; n++) {
                var a = i[n];
                $(a).remove().appendTo(r),
                $(a).removeAttr("selected")
            }
            Utilities.SortSelect(t),
            Utilities.SortSelect(r)
        } catch (t) {
            e("TransferSelected", t, Log.Type.Error)
        }
    }
    var i = "TrfListHelper.";
    return {
        MoveSelectedLeft: function(t) {
            try {
                e("MoveSelectedLeft", "Called");
                var i = r(t);
                o(i.Right, i.Left, !1)
            } catch (t) {
                e("MoveSelectedLeft", t, Log.Type.Error)
            }
        },
        MoveSelectedRight: function(t) {
            try {
                e("MoveSelectedRight", "Called");
                var i = r(t);
                o(i.Left, i.Right, !1)
            } catch (t) {
                e("MoveSelectedRight", t, Log.Type.Error)
            }
        },
        MoveAllLeft: function(t) {
            try {
                e("MoveAllLeft", "Called");
                var i = r(t);
                o(i.Right, i.Left, !0)
            } catch (t) {
                e("MoveAllLeft", t, Log.Type.Error)
            }
        },
        MoveAllRight: function(t) {
            try {
                e("MoveAllRight", "Called");
                var i = r(t);
                o(i.Left, i.Right, !0)
            } catch (t) {
                e("MoveAllRight", t, Log.Type.Error)
            }
        },
        Serialize: function(t) {
            try {
                e("Serialize", "Called");
                var r = "";
                return $(t).find(".component").each(function() {
                    null != $(this).attr("TransferList") && $(this).find("select").each(function() {
                        var e = $(this).attr("name");
                        r += "&" + e + "_count=" + $(this)[0].options.length;
                        for (var t = 0; t < $(this)[0].options.length; t++) {
                            var o = $(this)[0].options[t];
                            r += "&" + e + "_" + t + "=" + $(o).attr("value")
                        }
                    })
                }),
                r
            } catch (t) {
                e("Serialize", t, Log.Type.Error)
            }
        }
    }
}
,
define("Storage", [], function() {
    function e(e) {
        function t(e, t, r, i) {
            Log.Add(o + e, t, r, i)
        }
        function r(e, t) {
            this.Component = e,
            this.ID = t,
            this.Destroy = function() {
                this.Component = null,
                this.ID = null
            }
        }
        try {
            e = e || "";
            var o = e + "Storage."
              , i = [];
            this.ID = e,
            this.AddComponent = function(e, o) {
                try {
                    if (t("AddComponent", "ID=" + o),
                    !this.GetComponent(o)) {
                        var n = new r(e,o);
                        i.push(n)
                    }
                } catch (e) {
                    t("AddComponent", e, Log.Type.Error)
                }
            }
            ,
            this.GetComponent = function(e) {
                try {
                    for (var r = 0; r < i.length; r++)
                        if (i[r].ID == e)
                            return i[r].Component;
                    return null
                } catch (e) {
                    t("GetComponent", e, Log.Type.Error)
                }
            }
            ,
            this.GetCount = function() {
                return i.length
            }
            ,
            this.GetItemArray = function() {
                try {
                    t("GetItemArray", "Called");
                    for (var e = [], r = 0; r < i.length; r++)
                        e.push(i[r].Component);
                    return e
                } catch (e) {
                    t("GetItemArray", e, Log.Type.Error)
                }
            }
            ,
            this.GetIdArray = function(e) {
                try {
                    t("GetIdArray", "Called");
                    for (var r, o = [], n = 0; n < i.length; n++)
                        r = i[n].ID,
                        e && (r = parseInt(r)),
                        o.push(r);
                    return o
                } catch (e) {
                    t("GetIdArray", e, Log.Type.Error)
                }
            }
            ,
            this.Remove = function(e) {
                try {
                    t("Remove", "ID=" + e);
                    for (var r = 0; r < i.length; r++)
                        if (i[r].ID == e)
                            return i[r].Destroy(),
                            i[r] = null,
                            void i.splice(r, 1)
                } catch (e) {
                    t("Remove", e, Log.Type.Error)
                }
            }
            ,
            this.Reset = function() {
                try {
                    t("Reset", i.length + " items");
                    for (var e = 0; e < i.length; e++)
                        i[e].Destroy(),
                        i[e] = null;
                    i = []
                } catch (e) {
                    t("Reset", e, Log.Type.Error)
                }
            }
        } catch (e) {
            t("Main", e, Log.Type.Error)
        }
    }
    return e
}),
define("Editor", ["PageHelper", "RuleHelper", "ContextMenu", "IconMover", "IconConnector", "RuleStorage", "HtmlEditor", "Bootstrap", "VrmScript"], function(e, t, r, o, i, n, a, s, l) {
    var c = new function() {
        function d(e, t, r, o) {
            Log.Add(g + e, t, r, o)
        }
        function u() {
            switch (r.ActiveEditor) {
            case "html":
                return e;
            case "bootstrap":
                return s;
            case "preproc":
                return RulesMaker;
            case "postproc":
                return RulesMaker
            }
        }
        function p(e) {
            e && (f = e),
            f && (MP.Tools.Initialized ? f() : setTimeout(p, 100))
        }
        function h(e, t, a) {
            c.VRMName = e,
            c.LockedBy = t,
            m = Global.DetachElements($(".HideInEditor").children()),
            div = $("#preproc, #postproc");
            var s = !1
              , l = div;
            div.delegate(".icon", "dblclick", function(e) {
                e.stopPropagation(),
                RulesMaker.ShowProperties(this)
            }),
            div.delegate(".icon", "mousedown", function(e) {
                try {
                    s = !0,
                    c.DisableSelectibleInIE(l, !0);
                    var t = $(this).attr("id");
                    o.Load(t),
                    o.Enable(),
                    1 == e.which && r.Hide();
                    var i = n.GetComponent(t);
                    i.Icon.SetIconMover(o)
                } catch (e) {
                    d("MouseDown", e, Log.Type.Error)
                }
            }),
            div.delegate(".icon", "mouseup", function(e) {
                try {
                    s = !1;
                    var t = $(this)
                      , r = t.attr("id");
                    3 == e.which && RulesMaker.SelectThisOnlyIfNotSelected(r),
                    i.IconClicked(r, e),
                    o.Reset();
                    var a = n.GetComponent(r);
                    a.SetX(t.position().left),
                    a.SetY(t.position().top),
                    c.DisableSelectibleInIE(l, !1)
                } catch (e) {
                    d("MouseUp", e, Log.Type.Error)
                }
            }),
            div.bind("mousedown", function(e) {
                try {
                    if (r.UpdatePossition(e, RulesMaker.CurrentProcess),
                    s)
                        return !1;
                    r.Hide(),
                    i.CanvasClicked(e)
                } catch (e) {
                    d("MouseDown", e, Log.Type.Error)
                }
            }),
            div.selectable({
                filter: "img",
                selected: function(e, t) {
                    var r = $(t.selected).attr("id");
                    RulesMaker.AddSelected(r)
                },
                start: function(e, t) {
                    Global.DisableHighlightingInChrome(!0),
                    RulesMaker.ClearSelected()
                },
                stop: function(e, t) {
                    Global.DisableHighlightingInChrome(!1)
                }
            }),
            c.Enabled = !0,
            MP.Tools.ToolsInForeground(!1),
            MP.Tools.ShowToolbar(),
            MP.Tools.ShowVrmName(e),
            p(a)
        }
        try {
            var f, g = "Editor.", m = [];
            return {
                Enabled: !1,
                Standalone: !1,
                VRMName: "",
                VRMPath: "",
                LockedBy: "",
                Delete: function() {
                    d("Delete", "Called");
                    var e = u();
                    e && e.DeleteSelection()
                },
                Copy: function(e) {
                    d("Copy", "Called");
                    var t = u();
                    t && t.Copy(e)
                },
                Paste: function() {
                    d("Paste", "Called");
                    var e = u();
                    e && e.Paste()
                },
                Undo: function() {
                    d("Undo", "Called");
                    var e = u();
                    e && e.Undo()
                },
                Redo: function() {
                    d("Redo", "Called");
                    var e = u();
                    e && e.Redo()
                },
                Clear: function() {
                    d("Clear", "Called"),
                    a.ClearUndo(),
                    RulesMaker.ClearUndo(),
                    l.Clear(),
                    window.CustomScript = {}
                },
                ClearSearch: function() {
                    a.Search(),
                    t.Search(),
                    l.Search()
                },
                Search: function() {
                    function e() {
                        var e = $("#SearchFW", r).val()
                          , o = {
                            caseSens: $("#SearchCS", r)[0].checked,
                            wholeWord: $("#SearchWW", r)[0].checked,
                            regExpr: $("#SearchRE", r)[0].checked
                        };
                        a.Search(e, o),
                        t.Search(e, o),
                        l.Search(e, o)
                    }
                    var r = $("#SearchForDlg");
                    if (!r.length) {
                        r = $('<div id="SearchForDlg" style="text-align: left;"><label for="SearchFW">Find What:</label><input type="text" id="SearchFW" value=""/></div>');
                        var o = $("<p/>").appendTo(r);
                        o.append('<input type="checkbox" id="SearchCS" value="1"/><label for="SearchCS">Case sensitive</label><br/>'),
                        o.append('<input type="checkbox" id="SearchWW" value="1"/><label for="SearchWW">Whole word</label><br/>'),
                        o.append('<input type="checkbox" id="SearchRE" value="1"/><label for="SearchRE">Regular expression</label><br/>');
                        var i = {
                            Search: function(t) {
                                e(),
                                r.dialog("close")
                            },
                            Clear: function() {
                                c.ClearSearch(),
                                r.dialog("close")
                            }
                        };
                        r.dialog({
                            width: 210,
                            autoOpen: !1,
                            closeOnEscape: !0,
                            modal: !0,
                            buttons: i,
                            title: "Find",
                            open: function() {
                                r.find("#SearchFW").focus().select()
                            }
                        }),
                        r.keypress(function(t) {
                            t.keyCode == $.ui.keyCode.ENTER && e()
                        })
                    }
                    r.dialog("open")
                },
                BuildComponent: function(t, r, o) {
                    try {
                        null == t && d("BuildComponent", "The Template control passed in did not specify a ref attribute", Log.Type.Error);
                        var i = e.CreateEditorComponent(t)
                          , n = $(r);
                        if (i) {
                            if (i.AppendTo(n),
                            i.Refresh(),
                            o) {
                                var a = MP.Tools.Config.Editor.html.snap;
                                i.SetLeft(Utilities.SnapTo(o.left - 5, a[0])),
                                i.SetTop(Utilities.SnapTo(o.top - 25, a[1]))
                            }
                            n.parents(".component").removeClass("droppable-hover")
                        }
                    } catch (e) {
                        d("BuildComponent", e, Log.Type.Error)
                    }
                },
                DisableSelectibleInIE: function(e, t) {
                    Browser.IsMSIE() && (t ? e.selectable("disable") : e.selectable("enable"))
                },
                DisableEditor: function() {
                    try {
                        if (!this.Enabled)
                            return;
                        d("DisableEditor", "Called"),
                        Global.ReattachElements(m),
                        div = $("#preproc, #postproc"),
                        div.undelegate(".icon").unbind("mousedown").selectable("destroy"),
                        this.Enabled = !1,
                        MP.Tools.ToolsInForeground(!0),
                        MP.Tools.ShowToolbar(),
                        MP.Tools.ShowVrmName(this.VRMName),
                        c.Standalone && $("#dtbSel").click()
                    } catch (e) {
                        d("DisableEditor", e, Log.Type.Error)
                    }
                },
                EnableEditor: function(e, t, r, o, i) {
                    try {
                        if (this.Enabled)
                            return;
                        if (d("EnableEditor", "Called"),
                        e = e || this.VRMName,
                        i)
                            return h(e, t, o),
                            void jAlert(t, "View mode");
                        if (t)
                            return void jConfirm(t + "<br>Click VIEW to continue in view mode or UNLOCK to unlock this page.", "Locked VRM", function(r) {
                                r ? h(e, t, o) : (Communication.CustomRequest("admintabs.max?action=UnlockVRM&vrmName=" + e),
                                h(e, "", o))
                            }, {
                                okButton: "VIEW",
                                cancelButton: "UNLOCK"
                            });
                        h(e, "", o),
                        r && jAlert(r, "Lint Messages")
                    } catch (e) {
                        d("EnableEditor", e, Log.Type.Error)
                    }
                },
                HideProperties: function() {
                    try {
                        d("HideProperties", "Called"),
                        PropertyEd.Hide()
                    } catch (e) {
                        d("HideProperties", e, Log.Type.Error)
                    }
                },
                ShowProperties: function(e) {
                    try {
                        d("ShowProperties", "Called");
                        var t = u();
                        t && t.ShowProperties(e)
                    } catch (e) {
                        d("ShowProperties", e, Log.Type.Error)
                    }
                },
                GetProperties: function() {
                    try {
                        var t = e.GetEditorComponent();
                        return t.GetProperties()
                    } catch (e) {
                        d("GetProperties", e, Log.Type.Error)
                    }
                },
                ShowAceEditorForm: function(e, t, r, o, i, n) {
                    var a, s = $('<div id="AceEditorDlg"><div class="toolWrapper"><div class="noWrap">' + r + '</div><textarea class="dialogTextarea"/></div></div>'), l = $(".toolWrapper", s), c = {
                        Cancel: function(e) {
                            s.dialog("close")
                        },
                        Apply: function(e) {
                            if (o) {
                                i = null;
                                var t = a.Value();
                                o(t)
                            }
                            s.dialog("close")
                        }
                    };
                    n = $.extend({
                        language: "html",
                        focus: !0,
                        value: e
                    }, n),
                    s.dialog({
                        width: 700,
                        height: 500,
                        minWidth: 400,
                        minHeight: 300,
                        autoOpen: !1,
                        closeOnEscape: !1,
                        modal: !0,
                        buttons: c,
                        title: t,
                        resizeStart: function() {
                            Global.DisableHighlightingInChrome(!0)
                        },
                        resizeStop: function() {
                            Global.DisableHighlightingInChrome(!1),
                            a.Height(l.height() - 35)
                        },
                        dragStart: function() {
                            Global.DisableHighlightingInChrome(!0)
                        },
                        dragStop: function() {
                            Global.DisableHighlightingInChrome(!1)
                        },
                        close: function() {
                            a.Remove(),
                            i && i(e),
                            s.remove()
                        },
                        beforeclose: function(e) {
                            if (e.srcElement)
                                return jConfirm("Are you sure to discard all changes?", "Cancel edit", function(e) {
                                    e && s.dialog("close")
                                }),
                                !1
                        },
                        open: function() {
                            a = new MP.Constructors.AceEditor($(".dialogTextarea", s),n),
                            a.Height(l.height() - 35)
                        }
                    }),
                    s.dialog("open")
                },
                GetAcceptedComponents: function(e) {
                    try {
                        for (var t = "", r = 0; r < e.length; r++)
                            t += "img[ref='" + e[r] + "'],";
                        return t = t.substring(0, t.length - 1)
                    } catch (e) {
                        d("GetAcceptedComponents", e, Log.Type.Error)
                    }
                },
                ShowHelp: function() {
                    try {
                        d("ShowHelp", "Called");
                        var e = "width=800,height=800,scrollbars=yes,resizable=yes,toolbar=no,location=no,menubar=no,status=no"
                          , t = "../../help/menu.html?id=" + Communication.SessionID;
                        return window.open(t, "EditorHelp", e),
                        !1
                    } catch (e) {
                        d("ShowHelp", e, Log.Type.Error)
                    }
                },
                Select: function(e) {
                    try {
                        d("Select", "Called");
                        var t = u();
                        return t && t.Select(e),
                        !1
                    } catch (e) {
                        d("Select", e, Log.Type.Error)
                    }
                }
            }
        } catch (e) {
            d("Main", e, Log.Type.Error)
        }
    }
    ;
    return c
}),
define("PropertyFields", ["page/comp/ValidatorContainer"], function(e) {
    var t, r, o = {
        "": ""
    }, i = function(e) {
        var t = $(e.target)
          , r = t.find("option:selected")
          , o = r.attr("title")
          , i = t.parents("tr").first();
        i.find("[name=Param]");
        jQ(i.get(0)).jqxTooltip({
            content: o,
            trigger: "click",
            autoHideDelay: 1e4,
            showArrow: !1,
            theme: "editor"
        })
    };
    for (t in e.Filters)
        Object.prototype.hasOwnProperty.call(e.Filters, t) && (r = e.Filters[t],
        o[t] = {
            text: r.name,
            title: r.description
        });
    var n = {
        EditorTextFilters: {
            label: "Filters",
            description: "Data filters",
            type: "multi",
            data: [{
                name: "Filter",
                label: "Filter",
                type: "select",
                data: o,
                onClick: i
            }, {
                name: "DType",
                label: "Type",
                type: "select",
                data: ",DATE,FLOAT,INTEGER,STRING,MONEY".split(",")
            }, {
                name: "Param",
                label: "Parameter",
                type: "text",
                sizeHint: "wide"
            }]
        },
        Borderless: {
            label: "Borderless",
            description: "Whether the control shows a border",
            type: "checkbox",
            live: !0
        },
        Caption: {
            label: "Caption",
            description: "The caption of the component",
            type: "text",
            live: !0,
            sizeHint: "wide"
        },
        HtmlBody: {
            label: "HTML body",
            description: "The HTML body of the component",
            type: "text",
            live: !1,
            sizeHint: "large",
            language: "html"
        },
        Checked: {
            label: "Checked",
            description: "Whether or not the component is checked",
            type: "text",
            live: !0,
            sizeHint: "small"
        },
        ClassSelect: {
            label: "Class",
            description: "A single CSS class",
            type: "select",
            data: ["Default", "PageTitle", "DefaultBold", "Required", "RequiredBold", "Extended", "ExtendedBold", "RequiredExtended", "RequiredExtendedBold", "InfoColor", "AttentionColor"],
            live: !0
        },
        ClassText: {
            label: "Class",
            description: "List of CSS classes",
            type: "text",
            sizeHint: "wide",
            live: !0
        },
        SvrCondition: {
            label: "Server Condition",
            description: "A server side script condition for the element to be delivered or not",
            type: "text",
            sizeHint: "wide"
        },
        CliCondition: {
            label: "Client Condition",
            description: "A client side JS condition for the element to be initially shown or not",
            type: "text",
            sizeHint: "wide"
        },
        DefaultButton: {
            label: "Default",
            description: "Check to invoke the click event on enter key press on any element of the parent Static Container",
            type: "checkbox",
            live: !1
        },
        EditHTML: {
            label: "Edit HTML",
            description: "Replaces the text area with an html editor",
            type: "checkbox",
            live: !1
        },
        Spellcheck: {
            label: "Spellcheck",
            description: "Enables the text area to be spellchecked",
            type: "checkbox",
            live: !1
        },
        Flipped: {
            label: "Flipped",
            description: "Flip input's side",
            type: "checkbox",
            live: !0
        },
        Height: {
            label: "Height",
            description: "The height of the component",
            type: "text",
            sizeHint: "small",
            live: !0
        },
        ID: {
            label: "ID",
            description: "The ID of the component",
            type: "text"
        },
        Left: {
            label: "Left",
            description: "The left position of the component",
            type: "text",
            live: !0,
            sizeHint: "small"
        },
        MaxLength: {
            label: "Maximum length",
            description: "The maximum number of characters allowed",
            type: "text",
            live: !0,
            sizeHint: "small"
        },
        MultiSelect: {
            label: "Multiselect",
            description: "Allows multiple items to be selected at same time",
            type: "checkbox",
            live: !0
        },
        Name: {
            label: "Name",
            description: "The name of the component",
            type: "text"
        },
        Type: {
            label: "Type",
            description: "The type of the input [text, password, number, email, tel, search, color, range, url, date, time, week]",
            type: "select",
            data: ["text", "password", "number", "email", "tel", "search", "color", "range", "url", "date", "time", "week"],
            live: !1
        },
        OnClick: {
            label: "On click",
            description: "The javascript that executes when the component is clicked",
            type: "text"
        },
        Options: {
            label: "Options",
            description: "The variable that fills the dropdown options",
            type: "text",
            sizeHint: "wide"
        },
        Required: {
            label: "Required",
            description: "If the component requires input",
            type: "checkbox",
            live: !0
        },
        Secure: {
            label: "Secure",
            description: 'Secure input with masked value. Use function "SecureVarForDisplay" to set the mask',
            type: "checkbox",
            live: !1
        },
        Watchpoint: {
            label: "Watch Point",
            description: "Set a watchpoint which will cause Stingray to send all ReqList changes back to the editor",
            type: "checkbox",
            live: !0
        },
        Scripts: {
            label: "Scripts",
            description: "Javascript functions that will be made available on this page",
            type: "text",
            live: !1,
            sizeHint: "large",
            language: "javascript"
        },
        ScriptFunctions: {
            label: "Script functions",
            description: "User functions",
            type: "multi",
            data: [{
                name: "Name",
                label: "Event",
                type: "select",
                data: {
                    BLUR: {
                        text: "Blur/unfocus"
                    },
                    CHANGE: {
                        text: "Change/edit"
                    },
                    CLICK: {
                        text: "Click"
                    },
                    DBLCLICK: {
                        text: "Double-click"
                    },
                    FOCUS: {
                        text: "Focus"
                    },
                    MOUSEDOWN: {
                        text: "Mouse button down"
                    },
                    MOUSEMOVE: {
                        text: "Mouse move"
                    },
                    MOUSEOUT: {
                        text: "Mouse move out"
                    },
                    MOUSEOVER: {
                        text: "Mouse move over"
                    },
                    MOUSEUP: {
                        text: "Mouse button up"
                    },
                    KEYPRESS: {
                        text: "Key Press"
                    },
                    KEYUP: {
                        text: "Key Up"
                    },
                    KEYDOWN: {
                        text: "Key Down"
                    }
                }
            }, {
                name: "Body",
                label: "Handler",
                type: "text",
                sizeHint: "wide"
            }]
        },
        Size: {
            label: "Size",
            description: "The size attribute of an input",
            type: "text",
            sizeHint: "small",
            live: !0
        },
        Style: {
            label: "Style",
            description: "Styles applied to the component",
            type: "text",
            live: !0,
            sizeHint: "wide"
        },
        TabIndex: {
            label: "Tab index",
            description: "The tab index of the component",
            type: "text",
            live: !1,
            sizeHint: "small"
        },
        Tags: {
            label: "Tags",
            description: "Attributes without value (eg. disabled, readonly, checked...) added to the input element",
            type: "text",
            live: !0
        },
        Target: {
            label: "Target",
            description: "The stingray target div that will receive the rendered template html",
            type: "text",
            sizeHint: "wide"
        },
        Top: {
            label: "Top",
            description: "The top position of the component",
            type: "text",
            live: !0,
            sizeHint: "small"
        },
        Tooltip: {
            label: "Tooltip",
            description: "The tooltip that displays above a component",
            type: "text",
            live: !0,
            sizeHint: "wide"
        },
        HelpLink: {
            label: "Help Link",
            description: "URL address to a HTML help document",
            type: "text",
            live: !1,
            sizeHint: "wide"
        },
        Validate: {
            label: "Validate",
            description: "If the button should validate the page",
            type: "checkbox",
            live: !0
        },
        Value: {
            label: "Value",
            description: "The value of the component",
            type: "text",
            live: !0,
            sizeHint: "small"
        },
        ValueLessAttrs: {
            label: "Valueless attributes",
            description: "Components valueless attributes",
            type: "text",
            live: !0,
            sizeHint: "wide"
        },
        Width: {
            label: "Width",
            description: "The width of the component",
            type: "text",
            live: !0,
            sizeHint: "small"
        },
        EventVRM: {
            label: "Event VRM",
            description: "The VRM [with params] to be called by Ajax",
            type: "text"
        },
        Event: {
            label: "Event",
            description: "The event that fires the ajax post",
            type: "select"
        },
        AjaxEnabled: {
            label: "Ajax enabled",
            description: "Whether the ajax post feature is enabled",
            type: "checkbox"
        },
        Comment: {
            label: "Comment",
            description: "Comment describing purpose of this component and its code displayed in its title and hint",
            type: "text",
            live: !1,
            sizeHint: "wide"
        },
        CompiledScriptFunction: {
            label: "Function",
            description: "Script Function",
            type: "csf",
            data: []
        },
        SCRIPT: {
            label: "Script",
            description: "Script code",
            type: "text",
            sizeHint: "large",
            language: "server script"
        },
        Language: {
            label: "Language",
            description: "The type of language the script is written in",
            type: "select",
            live: !1,
            data: ["Server Script"]
        },
        SqlTrnName: {
            label: "Name",
            description: "A unique name of SQL transaction",
            type: "text"
        },
        SqlTrnType: {
            label: "Type",
            description: "The type of needed SQL transaction",
            type: "select",
            live: !1,
            data: ["Begin", "Commit", "Rollback"]
        },
        ErrorMessage: {
            label: "Error message",
            description: "The error message that will be displayed to the user",
            type: "text",
            sizeHint: "large"
        },
        J1: {
            label: "J1",
            description: "The Component that is called by default",
            type: "text"
        },
        J2: {
            label: "J2",
            description: "The Component that is called on a false condition",
            type: "text"
        },
        MathParams: {
            label: "Math parameters",
            description: "Math Properties",
            type: "multi",
            data: [{
                name: "Name",
                label: "Name",
                type: "text",
                sizeHint: "small"
            }, {
                name: "Format",
                label: "Format",
                type: "select",
                data: "INTEGER,LONGDATETIME,LONGDATETIMEAMPM,SHORTDATE,ROUND,FLOAT".split(",")
            }, {
                name: "Value",
                label: "Param value",
                type: "text",
                sizeHint: "wide"
            }]
        },
        Query: {
            label: "Query",
            description: "A SQL query",
            type: "text",
            sizeHint: "large",
            language: "sql"
        },
        QueryParams: {
            label: "Parameters",
            description: "Set Query Parameters",
            type: "multi",
            data: [{
                name: "Name",
                label: "Name",
                type: "text",
                sizeHint: "small"
            }, {
                name: "Type",
                label: "Type",
                type: "select",
                data: "BOOLEAN,CURRENCY,DATETIME,FLOAT,INTEGER,STRING,SECURE".split(",")
            }, {
                name: "Value",
                label: "Value",
                type: "text",
                sizeHint: "wide"
            }]
        },
        RuleName: {
            label: "Rule name",
            description: "The vrm to be called",
            type: "text"
        },
        SetParams: {
            label: "ReqList Variables",
            description: "Set ReqList Variables",
            type: "multi",
            data: [{
                name: "Name",
                label: "Name",
                type: "text",
                sizeHint: "small"
            }, {
                name: "Value",
                label: "Value",
                type: "text",
                sizeHint: "wide"
            }]
        },
        X: {
            label: "X",
            description: "The left coordinate of the component",
            type: "text",
            live: !0
        },
        Y: {
            label: "Y",
            description: "The top coordinate of the component",
            type: "text",
            live: !0
        }
    };
    return n
}),
define("Utilities", ["Formatting"], function(e) {
    Array.prototype.reset = function() {
        for (var e = 0; e < this.length; e++)
            this[e] = null
    }
    ,
    Array.prototype.insert = function(e, t) {
        this.splice(e, 0, t)
    }
    ,
    Array.prototype.toPipeString = function() {
        for (var e = "", t = 0; t < this.length; t++)
            e += this[t] + "|";
        return e.substring(0, e.length - 1)
    }
    ,
    String.prototype.beginsWith = function(e) {
        var t = e.length
          , r = this.substring(0, t);
        return r == e
    }
    ,
    String.prototype.endsWith = function(e) {
        var t = e.length
          , r = this.substring(this.length - t);
        return r == e
    }
    ,
    String.prototype.removeLastChar = function() {
        return this.substring(0, this.length - 1)
    }
    ,
    String.prototype.removeFirstChar = function() {
        return this.substring(1)
    }
    ,
    String.prototype.insert = function(e, t) {
        if ("object" == typeof e) {
            for (var r = "", o = 0, i = 0; i < e.length; i++) {
                var n = e[i];
                r += this.substring(o, n) + t,
                o = n
            }
            return r += this.substring(o)
        }
        return this.substring(0, e) + t + this.substring(e)
    }
    ,
    "function" != typeof String.prototype.trim && (String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, "")
    }
    );
    var t = new function() {
        this.Ok = "-Dialog-Returned-OK-",
        this.Cancel = "-Dialog-Returned-Cancel-",
        this.Yes = "-Dialog-Returned-Yes-",
        this.No = "-Dialog-Returned-No-",
        this.Empty = "-Dialog-Returned-Empty-String"
    }
    ;
    return Utilities = new function(t) {
        function r(e, t, r, o) {
            Log.Add(s + e, t, r, o)
        }
        function o() {
            try {
                return event.cancelBubble = !0,
                event.returnValue = !1,
                !1
            } catch (e) {
                r("nocontextmenu", e, Log.Type.Error)
            }
        }
        function i(e) {
            try {
                if (window.Event) {
                    if (1 != e.which)
                        return !1
                } else if (1 != event.button)
                    return event.cancelBubble = !0,
                    event.returnValue = !1,
                    !1
            } catch (e) {
                r("norightclick", e, Log.Type.Error)
            }
        }
        function n() {
            try {
                (event.altKey || event.ctrlKey && (78 == event.keyCode || 82 == event.keyCode) || 116 == event.keyCode || 122 == event.keyCode) && (event.keyCode = 0,
                event.returnValue = !1)
            } catch (e) {
                r("onKeyDown", e, Log.Type.Error)
            }
        }
        function a() {
            return (65536 * (1 + Math.random()) | 0).toString(16).substring(1)
        }
        var s = "Utils.";
        try {
            return {
                SafeStrCompare: function(e, t) {
                    try {
                        return e.localeCompare(t)
                    } catch (r) {
                        return e < t ? -1 : e > t ? 1 : 0
                    }
                },
                MakeRegExp: function(e, t) {
                    var r = "";
                    if (t)
                        if (t.regExpr) {
                            var o = e.lastIndexOf("/");
                            if (o > -1) {
                                var i = e;
                                e = i.substring(0, o),
                                r = i.substring(o + 1)
                            }
                        } else
                            t.caseSens || (r = "i"),
                            t.wholeWord && (e = "\\b" + e + "\\b");
                    return new RegExp(e,r)
                },
                MakeGUID: function() {
                    return (a() + a() + "-" + a() + "-" + a() + "-" + a() + "-" + a() + a() + a()).toUpperCase()
                },
                GetXmlString: function(e) {
                    var t = e instanceof $ ? e[0] : e;
                    return t.xml ? t.xml : (new XMLSerializer).serializeToString(t)
                },
                GetFormattedTime: function() {
                    try {
                        var e = new Date
                          , t = this.PadNumber(e.getHours()) + ":" + this.PadNumber(e.getMinutes()) + ":" + this.PadNumber(e.getSeconds()) + "." + this.PadNumber(e.getMilliseconds(), 3);
                        return t
                    } catch (e) {
                        r("GetFormattedTime", e, Log.Type.Error)
                    }
                },
                GetTimeDifference: function(e, t) {
                    var r = e.getTime()
                      , o = t.getTime();
                    return o - r
                },
                FilterScript: function(e) {
                    try {
                        for (var t = "", o = 0; o < e.length; o++) {
                            var i = e.substring(o, o + 1)
                              , n = i.charCodeAt(0);
                            10 != n && (t += i)
                        }
                        return t
                    } catch (e) {
                        r("FilterScript", e, Log.Type.Error)
                    }
                },
                Format: function(e, t) {
                    try {
                        for (var o = 0; o < t.length; o++)
                            e = e.replace("{" + o + "}", t[o]);
                        return e
                    } catch (e) {
                        r("Format", e, Log.Type.Error)
                    }
                },
                PadNumber: function(e, t) {
                    try {
                        t = t || 2;
                        var o = "0000000000000000" + e;
                        return o.substr(o.length - t)
                    } catch (e) {
                        r("PadNumber", e, Log.Type.Error)
                    }
                },
                ParseXML: function(e) {
                    if (window.ActiveXObject && window.GetObject) {
                        var t = new ActiveXObject("Microsoft.XMLDOM");
                        return t.loadXML(e),
                        t
                    }
                    if (window.DOMParser)
                        return (new DOMParser).parseFromString(e, "text/xml");
                    throw new Error("No XML parser available")
                },
                PreventRefresh: function() {
                    try {
                        if (document.oncontextmenu = o,
                        document.onmousedown = i,
                        window.Event && document.captureEvents(Event.MOUSEUP),
                        document.addEventListener)
                            return void document.addEventListener("keydown", n, !1);
                        if (document.attachEvent)
                            return void document.attachEvent("onkeydown", n)
                    } catch (e) {
                        r("PreventRefresh", e, Log.Type.Error)
                    }
                },
                PromptForName: function(e, t) {
                    try {
                        t = t || "Please enter the control name";
                        var o = prompt(t, "");
                        return null == o ? Utilities.ModalResult.Cancel : (o = this.Trim(o),
                        "" == o ? Utilities.ModalResult.Empty : e && $("#" + o).length > 0 ? (r("PromptForName", "The name '" + o + "' is already being used!", Log.Type.Warning),
                        !1) : o)
                    } catch (e) {
                        r("PromptForName", e, Log.Type.Error)
                    }
                },
                ReplaceAll: function(e, t, o) {
                    try {
                        if (!e)
                            return "";
                        var i = new RegExp(t,"g");
                        return e.replace(i, o)
                    } catch (e) {
                        r("ReplaceAll", e, Log.Type.Error)
                    }
                },
                Serialize: function(e) {
                    try {
                        var t = []
                          , o = $(e).find(":input").get();
                        $.each(o, function() {
                            if (this.name && !this.disabled && !/button/i.test(this.type)) {
                                if (!this.checked && /checkbox|radio/i.test(this.type))
                                    return;
                                var e = $(this)
                                  , r = encodeURIComponent(this.name)
                                  , o = e.data("submit-type")
                                  , i = e.val();
                                switch (o) {
                                case "MONEY":
                                    i = Utilities.MoneyToNumber(i),
                                    i && t.push(r + "=" + encodeURIComponent(i));
                                    break;
                                case "MASK":
                                    t.push(r + "=" + encodeURIComponent(i)),
                                    t.push(r + "-sMask=" + encodeURIComponent(e.attr("sMask"))),
                                    t.push(r + "-sValue=" + encodeURIComponent(e.attr("sValue")));
                                    break;
                                default:
                                    i && t.push(r + "=" + encodeURIComponent(e.val()))
                                }
                            }
                        }),
                        $(e).find("div[ref='EditorMemo']").each(function() {
                            if ("true" == $(this).attr("EditHTML")) {
                                var e = $(this).find("div.ckEditorDiv")
                                  , r = String.fromCharCode(183)
                                  , o = Global.GetCKEditorValue(e);
                                null == o && (e = $(this).find("textarea"),
                                o = Global.GetCKEditorValue(e)),
                                null == o && (o = e.val());
                                var i = encodeURIComponent(e.attr("id"));
                                o = encodeURIComponent(o),
                                t.push(i + r + "=" + o)
                            }
                        });
                        var i = t.join("&").replace(/%20/g, "+");
                        return i += TransferListHelper.Serialize(e)
                    } catch (e) {
                        r("Serialize", e, Log.Type.Error)
                    }
                },
                SortSelect: function(e) {
                    try {
                        e = $(e);
                        var t = Global.DetachElements(e.find("option"));
                        t.sort(function(e, t) {
                            return Utilities.SafeStrCompare($(e.element).text(), $(t.element).text())
                        }),
                        Global.ReattachElements(t)
                    } catch (e) {
                        r("SortSelect", e, Log.Type.Error)
                    }
                },
                SnapTo: function(e, t) {
                    var r = e / t % 1;
                    if (0 == r)
                        return e;
                    var o = e % t;
                    return r > 0 && r < .5 ? e - o : e - o + t
                },
                ToNumber: function(e) {
                    try {
                        var t = parseInt(e, 10);
                        return isNaN(t) ? 0 : t
                    } catch (e) {
                        r("ToNumber", e, Log.Type.Error)
                    }
                },
                ToMoney: function(t) {
                    try {
                        return Utilities.IsString(t) ? e.formatTextAsMoney(t) : Utilities.IsNumber(t) ? e.formatTextAsMoney(t.toString()) : e.formatFieldAsMoney(t)
                    } catch (e) {
                        r("ToMoney", e, Log.Type.Error)
                    }
                },
                MoneyToNumber: function(t) {
                    try {
                        var o = e.stripNonNumericalCharacters(t)
                          , i = parseFloat(o);
                        return isNaN(i) ? 0 : i
                    } catch (e) {
                        r("MoneyToNumber", e, Log.Type.Error)
                    }
                },
                ToString: function(e, t, r) {
                    if (r = r || 0,
                    r > 20)
                        return "null";
                    r++;
                    var o = "";
                    return t || (o = "{\n"),
                    $.each(e, function(e, t) {
                        if (Utilities.IsObject(t))
                            o += '"' + e + '": ' + Utilities.ToString(t, !1, r) + ",";
                        else {
                            switch (typeof t) {
                            case "boolean":
                                o += '"' + e + '":' + t + ",";
                                break;
                            case "string":
                                o += '"' + e + '":"' + t + '",';
                                break;
                            case "number":
                                o += '"' + e + '":' + t + ",";
                                break;
                            default:
                                o += '"' + e + '": "' + t + '",'
                            }
                            o += "\n"
                        }
                    }),
                    t || (o += "\n}"),
                    o = o.replace(/,\s{0,}\}/g, "\n}")
                },
                toProperCase: function(e) {
                    return e.toLowerCase().replace(/\b((m)(a?c))?(\w)/g, function(e, t, r, o, i) {
                        return t ? r.toUpperCase() + o + i.toUpperCase() : e.toUpperCase()
                    })
                },
                Trim: function(e) {
                    return e ? e.trim() : ""
                },
                RemoveWhiteSpaces: function(e) {
                    return e ? e.replace(/\s+/g, " ") : ""
                },
                IsObject: function(e) {
                    return e && "object" == typeof e || Utilities.IsFunction(e)
                },
                IsFunction: function(e) {
                    return "function" == typeof e
                },
                IsNumber: function(e) {
                    return "number" == typeof e
                },
                IsString: function(e) {
                    return "string" == typeof e
                },
                IsDate: function(e, t) {
                    try {
                        if (t)
                            var r = new Date.parseExact(e,t);
                        else
                            var r = new Date.parse(e);
                        return !isNaN(r.getTime())
                    } catch (e) {
                        return !1
                    }
                },
                IdentifyChildren: function(e) {
                    var t = []
                      , r = $(e);
                    try {
                        var o = r.find("[id]");
                        o.each(function() {
                            t.push($(this).attr("id") || $(this).attr("name"))
                        })
                    } catch (e) {}
                    var i = r.attr("id") || r.attr("name");
                    return i + "[" + t.join() + "]"
                },
                ConvertToJSONObject: function(e, t) {
                    if (Utilities.IsObject(e))
                        return e;
                    var r = e + ""
                      , o = {}
                      , i = /^\{(\S|\s)*\}$/;
                    if (r = r.trim(),
                    i.test(r))
                        try {
                            o = $.parseJSON(r)
                        } catch (e) {
                            o = null
                        }
                    else
                        o[t] = e;
                    return o
                },
                ConvertToOptions: function(e) {
                    var t = function(e) {
                        return e instanceof $ ? e : $("<option/>").attr("value", e.value || "").attr("title", e.title || "").text(e.text || "")
                    }
                      , r = function(e) {
                        if ("string" == typeof e)
                            return {
                                text: e,
                                value: e
                            };
                        if (e instanceof $)
                            return e;
                        if ("object" == typeof e)
                            return e;
                        throw new TypeError("Option items must be strings, arrays, or jQuery elements")
                    }
                      , o = $([]);
                    if (e instanceof Array || e instanceof $)
                        $.each(e, function(e, i) {
                            o = o.add(t(r(i)))
                        });
                    else {
                        if ("object" != typeof e)
                            throw new TypeError("Option container must be an array or object");
                        var i;
                        for (i in e)
                            Object.prototype.hasOwnProperty.call(e, i) && (o = o.add(t($.extend(r(e[i]), {
                                value: i
                            }))))
                    }
                    return o
                }
            }
        } catch (e) {
            r("Main", e, Log.Type.Error)
        }
    }
    ,
    Utilities.ModalResult = t,
    Utilities
}),
define("Formatting", [], function() {
    var e = function(e, t) {
        return "" === t ? e : e + "." + t
    }
      , t = function(e) {
        return e.replace(/[^-\d\.]/g, "")
    }
      , r = function(e) {
        var t = e.split(".")
          , r = t[0].replace(/(\d{1,3})(?=(\d{3})+$)/g, "$1,")
          , o = t.slice(1).join("");
        return t.length > 1 ? r + "." + o : r
    }
      , o = function(e) {
        var o = t(e);
        o = r(o);
        var i = parseFloat(o);
        return i < 0 ? o.insert(1, "$") : "$" + o
    }
      , i = function(t) {
        if (t = $.trim(t)) {
            var r = t.slice(0, 1)
              , i = t.slice(1);
            i = i.replace(/-/g, ""),
            t = o(r + i)
        } else
            t = "";
        var n = t.split(".")
          , a = n[0] || ""
          , s = n[1] || "";
        return 0 !== s.length && 2 !== s.length && (s += "00",
        s = s.substring(0, 2)),
        e(a, s)
    }
      , n = function(e) {
        var t = $.trim(e.val())
          , r = "";
        return t && (r = i(t),
        t == r) ? r : (e.val(r),
        r)
    };
    return {
        formatFieldAsMoney: n,
        formatTextAsMoney: i,
        stripNonNumericalCharacters: t
    }
}),
define("page/comp/ValidatorContainer", ["Utilities", "PageHelper", "Formatting"], function(Utilities, PageHelper, Formatting) {
    function ValidationError(e, t) {
        this.Message = e,
        this.Control = t
    }
    var Validator = new function() {
        function e(e, t, r, o) {
            Log.Add(n + e, t, r, o)
        }
        function t(t) {
            try {
                e("GetErrors", "Called");
                var r = []
                  , o = [];
                return $(t).find(".component").each(function() {
                    var e = $(this).find("> :input")
                      , t = "";
                    if (1 == e.length && !e.attr("disabled") && !e.attr("readonly") && e.is(":visible")) {
                        var i = PageHelper.GetEditorComponent(this);
                        if (i) {
                            if (i.GetRequired && i.GetRequired()) {
                                var n = PageHelper.GetComponentRef(this)
                                  , a = $(this).find(">span");
                                switch (n) {
                                case "EditorText":
                                    0 == Utilities.Trim(e.val()).length && (t = "Field '" + a.text() + "' must be entered. Click to fix.");
                                    break;
                                case "EditorMemo":
                                    0 == Utilities.Trim(e.val()).length && (t = "Text field '" + a.text() + "' must be entered. Click to fix.");
                                    break;
                                case "EditorDropDown":
                                    "-1" == e.val() && (t = "An option '" + a.text() + "' must be selected. Click to fix.");
                                    break;
                                case "EditorRadio":
                                    var s = e.attr("name")
                                      , l = "input:radio[name=" + s + "]";
                                    if ($.inArray(s, o) == -1 && !$(l + ":checked").length) {
                                        o.push(s);
                                        var c = "";
                                        $(l).parent().find("span").each(function() {
                                            c += $(this).text() + ", "
                                        }),
                                        t = "At least one option (" + c.slice(0, c.length - 2) + ") must be selected. Click to fix."
                                    }
                                    break;
                                case "EditorCheckBox":
                                    e[0].checked || (t = "Check box '" + a.text() + "' must be selected. Click to fix.")
                                }
                            }
                            !t && i.FilterInput && (t = i.FilterInput(!0))
                        }
                        t && (i.HighlightAsError(!0),
                        t = new ValidationError(t,i),
                        r.push(t))
                    }
                }),
                r
            } catch (t) {
                e("GetErrors", t, Log.Type.Error)
            }
        }
        function r(t) {
            try {
                e("ErrorTable", "Called");
                for (var r = $("<ol class='ValidationErrors'/>"), o = 0; o < t.length; o++) {
                    var i = $("<li/>");
                    i.text(t[o].Message),
                    i.data("elementObj", t[o].Control.GetControl()),
                    i.bind("click", function() {
                        var e = $(this).data("elementObj");
                        Global.ScrollToElement(e, null, function() {
                            Global.ShakeElement(e);
                            var t = PageHelper.GetEditorComponent(e);
                            t.SetFocus && t.SetFocus()
                        })
                    }),
                    r.append(i)
                }
                return r
            } catch (t) {
                e("ErrorTable", t, Log.Type.Error)
            }
        }
        function o(t, r) {
            try {
                e("ShowErrors", "Called");
                var o = $(r).find(".ValidationContainer");
                if (o.length || (o = $(".ValidationContainer")),
                !o.length)
                    return void e("ShowErrors", "ValidationContainer could not be found", Log.Type.Warning);
                var i = PageHelper.GetEditorComponent(o[o.length - 1]);
                i.Show(t),
                Global.ScrollToElement(i.GetControl())
            } catch (t) {
                e("ShowErrors", t, Log.Type.Error)
            }
        }
        function i() {
            try {
                e("HideErrors", "Called"),
                $(".ValidationContainer").each(function() {
                    var e = PageHelper.GetEditorComponent(this);
                    e.Hide()
                })
            } catch (t) {
                e("HideErrors", t, Log.Type.Error)
            }
        }
        var n = "Validator.";
        return {
            Validate: function(n, a) {
                try {
                    e("Validate", "Called");
                    var s = t(n);
                    if (!s.length)
                        return i(),
                        !0;
                    if (!a) {
                        var l = r(s);
                        o(l, n)
                    }
                    var c = window.CustomScript.onValidationErrors || MP.Events.onValidationErrors || $.noop;
                    return c(s),
                    !1
                } catch (t) {
                    e("Validate", t, Log.Type.Error)
                }
            }
        }
    }
    ;
    return Validator.Filters = function() {
        function Convert(e, t) {
            switch (t = t ? t.toUpperCase() : "STRING") {
            case "DATE":
                try {
                    return new Date(e).getTime()
                } catch (t) {
                    throw "Could not convert '" + e + "' to a date"
                }
                break;
            case "FLOAT":
            case "MONEY":
                try {
                    var r = e.replace(/[^0-9\.-]/g, "");
                    return parseFloat(r)
                } catch (t) {
                    throw "Could not convert '" + e + "' to a floating decimal point number"
                }
                break;
            case "INTEGER":
                try {
                    var r = e.replace(/[^0-9\.-]/g, "");
                    return parseInt(r, 10)
                } catch (t) {
                    throw "Could not convert '" + e + "' to an integer"
                }
                break;
            case "STRING":
                return e
            }
        }
        function Display(e, t) {
            switch (t = t ? t.toUpperCase() : "STRING") {
            case "DATE":
                var r = new Date(e);
                return r.toString("MM/dd/yyyy");
            case "FLOAT":
            case "INTEGER":
                var o = e.toString();
                return isNaN(o) ? "0" : o;
            case "MONEY":
                var o = e.toString();
                return isNaN(o) ? "0" : Utilities.ToMoney(o);
            case "STRING":
                return e
            }
        }
        function executeCallback(fnCB, val, dtype, element) {
            return fnCB && (fnCB = eval(fnCB),
            val = fnCB.call(null, val, dtype, element)),
            val
        }
        var dlStates = {
            AL: {
                rule: "^\\d{1,7}$",
                desc: "1-7 Numeric"
            },
            AK: {
                rule: "^\\d{1,7}$",
                desc: "1-7 Numbers"
            },
            AZ: {
                rule: "(^[A-Z]{1}\\d{1,8}$)|(^[A-Z]{2}\\d{2,5}$)|(^\\d{9}$)",
                desc: "1 Alpha + 1-8 Numeric, 2 Alpha + 2-5 Numeric, 9 Numeric"
            },
            AR: {
                rule: "^\\d{4,9}$",
                desc: "4-9 Numeric"
            },
            CA: {
                rule: "^[A-Z]{1}\\d{7}$",
                desc: "1 Alpha + 7 Numeric"
            },
            CO: {
                rule: "(^\\d{9}$)|(^[A-Z]{1}\\d{3,6}$)|(^[A-Z]{2}\\d{2,5}$)",
                desc: "9 Numeric, 1 Alpha + 3-6 Numeric, 2 Alpha + 2-5 Numeric"
            },
            CT: {
                rule: "^\\d{9}$",
                desc: "9 Numeric"
            },
            DE: {
                rule: "^\\d{1,7}$",
                desc: "1-7 Numeric"
            },
            DC: {
                rule: "(^\\d{7}$)|(^\\d{9}$)",
                desc: "7 Numeric, 9 Numeric"
            },
            FL: {
                rule: "^[A-Z]{1}\\d{12}$",
                desc: "1 Alpha + 12 Numeric"
            },
            GA: {
                rule: "^\\d{7,9}$",
                desc: "7-9 Numeric"
            },
            GU: {
                rule: "^[A-Z]{1}\\d{14}$",
                desc: "1 Alpha + 14 Numeric"
            },
            HI: {
                rule: "(^[A-Z]{1}\\d{8}$)|(^\\d{9}$)",
                desc: "1 Alpha + 8 Numeric, 9 Numeric"
            },
            ID: {
                rule: "(^[A-Z]{2}\\d{6}[A-Z]{1}$)|(^\\d{9}$)",
                desc: "2 Alpha + 6 Numeric + 1 Alpha, 9 Numeric"
            },
            IL: {
                rule: "^[A-Z]{1}\\d{11,12}$",
                desc: "1 Alpha + 11-12 Numeric"
            },
            IN: {
                rule: "(^[A-Z]{1}\\d{9}$)|(^\\d{9,10}$)",
                desc: "1 Alpha + 9 Numeric, 9-10 Numeric"
            },
            IA: {
                rule: "^(\\d{9}|(\\d{3}[A-Z]{2}\\d{4}))$",
                desc: "9 Numeric, 3 Numeric + 2 Alpha + 4 Numeric"
            },
            KS: {
                rule: "(^([A-Z]{1}\\d{1}){2}[A-Z]{1}$)|(^[A-Z]{1}\\d{8}$)|(^\\d{9}$)",
                desc: "1 Alpha + 1 Numeric + 1 Alpha + 1 Numeric + 1 Alpha, 1 Alpha + 8 Numeric, 9 Numeric"
            },
            KY: {
                rule: "(^[A-Z]{1}\\d{8,9}$)|(^\\d{9}$)",
                desc: "1 Alpha + 8-9 Numeric, 9 Numeric"
            },
            LA: {
                rule: "^\\d{1,9}$",
                desc: "1-9 Numeric"
            },
            ME: {
                rule: "(^\\d{7,8}$)|(^\\d{7}[A-Z]{1}$)",
                desc: "7-8 Numeric, 7 Numeric + 1 Alpha"
            },
            MD: {
                rule: "^[A-Z]{1}\\d{12}$",
                desc: "1Alpha+12Numeric"
            },
            MA: {
                rule: "(^[A-Z]{1}\\d{8}$)|(^\\d{9}$)",
                desc: "1 Alpha + 8 Numeric, 9 Numeric"
            },
            MI: {
                rule: "(^[A-Z]{1}\\d{10}$)|(^[A-Z]{1}\\d{12}$)",
                desc: "1 Alpha + 10 Numeric, 1 Alpha + 12 Numeric"
            },
            MN: {
                rule: "^[A-Z]{1}\\d{12}$",
                desc: "1 Alpha + 12 Numeric"
            },
            MS: {
                rule: "^\\d{9}$",
                desc: "9 Numeric"
            },
            MO: {
                rule: "(^[A-Z]{1}\\d{5,9}$)|(^[A-Z]{1}\\d{6}[R]{1}$)|(^\\d{8}[A-Z]{2}$)|(^\\d{9}[A-Z]{1}$)|(^\\d{9}$)",
                desc: "1 Alpha + 5-9 Numeric, 1 Alpha + 6 Numeric + 'R', 8 Numeric + 2 Alpha, 9 Numeric + 1 Alpha, 9 Numeric"
            },
            MT: {
                rule: "(^[A-Z]{1}\\d{8}$)|(^\\d{13}$)|(^\\d{9}$)|(^\\d{14}$)",
                desc: "1 Alpha + 8 Numeric, 13 Numeric, 9 Numeric, 14 Numeric"
            },
            NE: {
                rule: "^\\d{1,7}$",
                desc: "1-7 Numeric"
            },
            NV: {
                rule: "(^\\d{9,10}$)|(^\\d{12}$)|(^[X]{1}\\d{8}$)",
                desc: "9 Numeric, 10 Numeric, 12 Numeric, 'X' + 8 Numeric"
            },
            NH: {
                rule: "^\\d{2}[A-Z]{3}\\d{5}$",
                desc: "2 Numeric + 3 Alpha + 5 Numeric"
            },
            NJ: {
                rule: "^[A-Z]{1}\\d{14}$",
                desc: "1 Alpha + 14 Numeric"
            },
            NM: {
                rule: "^\\d{8,9}$",
                desc: "8 Numeric, 9 Numeric"
            },
            NY: {
                rule: "(^[A-Z]{1}\\d{7}$)|(^[A-Z]{1}\\d{18}$)|(^\\d{8}$)|(^\\d{9}$)|(^\\d{16}$)|(^[A-Z]{8}$)",
                desc: "1 Alpha + 7 Numeric, 1 Alpha + 18 Numeric, 8 Numeric, 9 Numeric, 16 Numeric, 8 Alpha"
            },
            NC: {
                rule: "^\\d{1,12}$",
                desc: "1-12 Numeric"
            },
            ND: {
                rule: "(^[A-Z]{3}\\d{6}$)|(^\\d{9}$)",
                desc: "3 Alpha + 6 Numeric, 9 Numeric"
            },
            OH: {
                rule: "(^[A-Z]{1}\\d{4,8}$)|(^[A-Z]{2}\\d{3,7}$)|(^\\d{8}$)",
                desc: "1 Alpha + 4-8 Numeric, 2 Alpha + 3-7 Numeric, 8 Numeric"
            },
            OK: {
                rule: "(^[A-Z]{1}\\d{9}$)|(^\\d{9}$)",
                desc: "1 Alpha + 9 Numeric, 9 Numeric"
            },
            OR: {
                rule: "^\\d{1,9}$",
                desc: "1-9 Numeric"
            },
            PA: {
                rule: "^\\d{8}$",
                desc: "8 Numeric"
            },
            PR: {
                rule: "(^\\d{9}$)|(^\\d{5,7}$)",
                desc: "5-7 Numeric, 9 Numeric"
            },
            RI: {
                rule: "^(\\d{7}$)|(^[A-Z]{1}\\d{6}$)",
                desc: "7 Numeric, 1 Alpha + 6 Numeric"
            },
            SC: {
                rule: "^\\d{5,11}$",
                desc: "5-11 Numeric"
            },
            SD: {
                rule: "(^\\d{6,10}$)|(^\\d{12}$)",
                desc: "6-10 Numeric, 12 Numeric"
            },
            TN: {
                rule: "^\\d{7,9}$",
                desc: "7-9 Numeric"
            },
            TX: {
                rule: "^\\d{7,8}$",
                desc: "7-8 Numeric"
            },
            UT: {
                rule: "^\\d{4,10}$",
                desc: "4-10 Numeric"
            },
            VT: {
                rule: "(^\\d{8}$)|(^\\d{7}[A]$)",
                desc: "8 Numeric, 7 Numeric + 'A'"
            },
            VA: {
                rule: "(^[A-Z]{1}\\d{8,11}$)|(^\\d{9}$)",
                desc: "1 Alpha + 8 Numeric, 1 Alpha + 9 Numeric, 1 Alpha + 10 Numeric, 1 Alpha + 11 Numeric, 9 Numeric"
            },
            WA: {
                rule: "^(?=.{12}$)[A-Z]{1,7}[A-Z0-9\\*]{4,11}$",
                desc: "1-7 Alpha + any combination of Alpha, Numeric, and * for a total of 12 characters"
            },
            WV: {
                rule: "(^\\d{7}$)|(^[A-Z]{1,2}\\d{5,6}$)",
                desc: "7 Numeric, 1-2 Alpha + 5-6 Numeric"
            },
            WI: {
                rule: "^[A-Z]{1}\\d{13}$",
                desc: "1 Alpha + 13 Numeric"
            },
            WY: {
                rule: "^\\d{9,10}$",
                desc: "9-10 Numeric"
            },
            default: {
                rule: "^[0-9A-Z]{4,9}$",
                desc: "4-9 Alpha Numeric"
            }
        };
        return {
            DATE: {
                name: "Date",
                description: 'Blank, format string or {"format": "MM/dd/yyyy", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "format");
                    if (!o)
                        throw "Error in validation!";
                    var i = e.replace(/[^0-9]/g, "/");
                    i = Utilities.ReplaceAll(i, "//", "/");
                    try {
                        if (o.format = o.format || "MM/dd/yyyy",
                        i.indexOf("/") == -1)
                            switch (i.length) {
                            case 1:
                                var n = (new Date).moveToFirstDayOfMonth().addDays(parseInt(i) - 1);
                                i = n.toString(o.format);
                                break;
                            case 2:
                                var n = new Date
                                  , a = parseInt(i) - 1
                                  , s = n.getDate() - 1;
                                a <= s ? n = n.moveToFirstDayOfMonth().addDays(a) : n.set({
                                    month: parseInt(i.charAt(0)) - 1,
                                    day: parseInt(i.charAt(1))
                                }),
                                i = n.toString(o.format);
                                break;
                            case 3:
                                i = i.insert([2], "0"),
                                i = i.insert([1, 2], "/");
                                break;
                            case 4:
                                i = i.insert([1, 2], "/");
                                break;
                            case 5:
                                i = i.insert([1, 3], "/");
                                break;
                            case 6:
                                i = i.insert([2, 4], "/");
                                break;
                            case 7:
                                i = i.insert([1, 3], "/");
                                break;
                            case 8:
                                i = i.insert([2, 4], "/");
                                break;
                            default:
                                throw "The date could not be formatted"
                            }
                        var l = "MM/dd/yyyy" != o.format ? o.format : null;
                        if (!Utilities.IsDate(i, l))
                            throw "The date must be a valid date in '" + o.format.toUpperCase() + "' format";
                        var n = new Date.parse(i);
                        return i = executeCallback(o.pass, n.toString(o.format), t)
                    } catch (e) {
                        throw i = executeCallback(o.fail, i, t),
                        o.message || "Only floating decimal point numbers are accepted"
                    }
                }
            },
            EMAIL: {
                name: "Email address",
                description: 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "param");
                    if (!o)
                        throw "Error in validation!";
                    var i = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    if (i.test(e))
                        return e = executeCallback(o.pass, e, t);
                    throw e = executeCallback(o.fail, e, t),
                    o.message || "The email address is invalid"
                }
            },
            EMAILS: {
                name: "Email address list",
                description: 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "param");
                    if (!o)
                        throw "Error in validation!";
                    e = e.replace(/ /g, "").replace(/,/g, ";");
                    var i = /^(([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,63}))((;(([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,63})))*)(;{0,1})$/;
                    if (i.test(e))
                        return e = executeCallback(o.pass, e, t);
                    throw e = executeCallback(o.fail, e, t),
                    o.message || "The email address list is invalid"
                }
            },
            EQUAL: {
                name: "Equal-to",
                description: 'Value of selected type, or {"value": "50", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "value");
                    if (!o)
                        throw "Error in validation!";
                    var i = Convert(e, t)
                      , n = Convert(o.value, t);
                    if (i == n)
                        return e = executeCallback(o.pass, e, t);
                    throw e = executeCallback(o.fail, e, t),
                    o.message || "The values are not equal"
                }
            },
            FLOAT: {
                name: "Floating-point number",
                description: 'Blank, number of digits, or {"digits": "2", "trailingZeros": "true", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "digits");
                    if (!o)
                        throw "Error in validation!";
                    try {
                        var i = e.replace(/[^0-9\.-]/g, "");
                        if (!i.length)
                            throw "!";
                        var n = Convert(i, "FLOAT");
                        if (isNaN(n))
                            throw "!";
                        return e = n.toFixed(o.digits || 2),
                        e = /(0|false)/i.test(o.trailingZeros) ? executeCallback(o.pass, parseFloat(e), t) : executeCallback(o.pass, e, t)
                    } catch (r) {
                        throw e = executeCallback(o.fail, e, t),
                        o.message || "Only floating decimal point numbers are accepted"
                    }
                }
            },
            GREATERTHAN: {
                name: "Greater-than",
                description: 'Value of selected type, or {"value": "50", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "value");
                    if (!o)
                        throw "Error in validation!";
                    var i = Convert(e, t)
                      , n = Convert(o.value, t);
                    if (i > n)
                        return e = executeCallback(o.pass, e, t);
                    throw e = executeCallback(o.fail, e, t),
                    o.message || Display(i, t) + " must be greater than " + Display(n, t)
                }
            },
            GREATERTHANEQUALS: {
                name: "Greater-than-or-equal-to",
                description: 'Value of selected type, or {"value": "50", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "value");
                    if (!o)
                        throw "Error in validation!";
                    var i = Convert(e, t)
                      , n = Convert(o.value, t);
                    if (i >= n)
                        return e = executeCallback(o.pass, e, t);
                    throw e = executeCallback(o.fail, e, t),
                    o.message || Display(i, t) + " must be greater than or equal to " + Display(n, t)
                }
            },
            INTEGER: {
                name: "Integer",
                description: 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "param");
                    if (!o)
                        throw "Error in validation!";
                    try {
                        var i = e.replace(/[^0-9\.-]/g, "");
                        if (!i.length)
                            throw "!";
                        var n = Convert(i, "INTEGER");
                        if (isNaN(n))
                            throw "!";
                        return e = executeCallback(o.pass, n.toString(), t)
                    } catch (r) {
                        throw e = executeCallback(o.fail, e, t),
                        o.message || "Only integer values are accepted"
                    }
                }
            },
            LESSTHAN: {
                name: "Less-than",
                description: 'Value of selected type, or {"value": "50", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "value");
                    if (!o)
                        throw "Error in validation!";
                    var i = Convert(e, t)
                      , n = Convert(o.value, t);
                    if (i < n)
                        return e = executeCallback(o.pass, e, t);
                    throw e = executeCallback(o.fail, e, t),
                    o.message || Display(i, t) + " must be less than " + Display(n, t)
                }
            },
            LESSTHANEQUALS: {
                name: "Less-than-or-equal-to",
                description: 'Value of selected type, or {"value": "50", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "value");
                    if (!o)
                        throw "Error in validation!";
                    var i = Convert(e, t)
                      , n = Convert(o.value, t);
                    if (i <= n)
                        return e = executeCallback(o.pass, e, t);
                    throw e = executeCallback(o.fail, e, t),
                    o.message || Display(i, t) + " must be less than or equal to " + Display(n, t)
                }
            },
            PHONE: {
                name: "Phone number",
                description: 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "param");
                    if (!o)
                        throw "Error in validation!";
                    var i = e.replace(/x/g, "|");
                    i = i.replace(/[^0-9|]/g, "");
                    var n = ""
                      , a = i.lastIndexOf("|");
                    switch (a > -1 && (n = i.substring(a + 1),
                    i = i.substring(0, a)),
                    i.length) {
                    case 7:
                        i = i.substring(0, 3) + "-" + i.substring(3);
                        break;
                    case 10:
                        i = "(" + i.substring(0, 3) + ") " + i.substring(3, 6) + "-" + i.substring(6);
                        break;
                    case 11:
                        i = i.substring(0, 1) + " (" + i.substring(1, 4) + ") " + i.substring(4, 7) + "-" + i.substring(7);
                        break;
                    default:
                        throw i = executeCallback(o.fail, i, t),
                        o.message || "The phone number is invalid"
                    }
                    return n.length && (i += " x " + n),
                    i = executeCallback(o.pass, i, t)
                }
            },
            SSN: {
                name: "Social security number",
                description: 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "param");
                    if (!o)
                        throw "Error in validation!";
                    var i = e.replace(/[^0-9]/g, "");
                    9 == i.length && (i = i.substring(0, 3) + "-" + i.substring(3, 5) + "-" + i.substring(5));
                    var n = /^[0-9]{3}[\- ]?[0-9]{2}[\- ]?[0-9]{4}$/;
                    if (n.test(i))
                        return i = executeCallback(o.pass, i, t);
                    throw i = executeCallback(o.fail, i, t),
                    o.message || "The social security number is invalid"
                }
            },
            FEIN: {
                name: "Federal employer ID",
                description: 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "param");
                    if (!o)
                        throw "Error in validation!";
                    var i = e.replace(/[^0-9]/g, "");
                    9 == i.length && (i = i.substring(0, 2) + "-" + i.substring(2));
                    var n = /^[0-9]{2}[\- ]?[0-9]{7}$/;
                    if (n.test(i))
                        return i = executeCallback(o.pass, i, t);
                    throw i = executeCallback(o.fail, i, t),
                    o.message || "The federal employer identification number is invalid"
                }
            },
            DLN: {
                name: "Driver license number",
                description: 'state string, jQuery selector for input/select, or {"state":"FL/#input", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "state");
                    if (!o)
                        throw "Error in validation!";
                    var i = e
                      , n = o.state;
                    2 != n.length && (n = $(n).val()),
                    n = n.toUpperCase();
                    var a = dlStates[n];
                    a || (a = dlStates.default);
                    var s = new RegExp(a.rule,"i");
                    if (s.test(i))
                        return i = executeCallback(o.pass, i, t);
                    throw i = executeCallback(o.fail, i, t),
                    o.message || "The driver license number is invalid"
                }
            },
            STATE: {
                name: "State postal code",
                description: 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "param");
                    if (!o)
                        throw "Error in validation!";
                    var i = e.toUpperCase();
                    try {
                        if ("INT" == i)
                            return i;
                        var n = /[A-Z]{2}/g;
                        if (!n.test(i))
                            throw "The state code must be two letters";
                        var a = "AL AK AZ AR CA CO CT DC DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR VI GU";
                        if (n = new RegExp(i,"g"),
                        a.search(n) == -1)
                            throw "The state code is invalid";
                        return i = executeCallback(o.pass, i, t)
                    } catch (e) {
                        throw i = executeCallback(o.fail, i, t),
                        o.message || e.message
                    }
                }
            },
            TIME: {
                name: "Time",
                description: 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "param");
                    if (!o)
                        throw "Error in validation!";
                    var i = e.toUpperCase();
                    try {
                        i = i.replace(/[^0-9AM:PM]/g, "");
                        var n;
                        if (i.indexOf("AM") > -1 ? n = "AM" : i.indexOf("PM") > -1 && (n = "PM"),
                        !n)
                            throw "Times must include AM or PM";
                        i = i.replace(/\s/g, "");
                        var a = /\d{1,2}:\d{2}/
                          , s = i.match(a);
                        if (null == s)
                            throw "Times must be formatted HH:MM AM/PM";
                        "object" == typeof s && (s = s[0]);
                        var l = s.split(":")
                          , c = parseInt(l[0], 10)
                          , d = parseInt(l[1], 10);
                        if (c > 12)
                            throw "The hour must be less than or equal to 12";
                        if (0 == c)
                            throw "The hour must be greater than 0";
                        if (d > 59)
                            throw "The minute must be less than 60";
                        return d < 10 && (d = "0" + d.toString()),
                        i = executeCallback(o.pass, c + ":" + d + " " + n, t)
                    } catch (e) {
                        throw i = executeCallback(o.fail, i, t),
                        o.message || e.message
                    }
                }
            },
            ZIPCODE: {
                name: "ZIP code",
                description: 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "param");
                    if (!o)
                        throw "Error in validation!";
                    var i = e.replace(/[^0-9]/g, "");
                    switch (i.length) {
                    case 5:
                        i = executeCallback(o.pass, i, t);
                        break;
                    case 9:
                        i = executeCallback(o.pass, i.substring(0, 5) + "-" + i.substring(5), t);
                        break;
                    default:
                        throw i = executeCallback(o.fail, i, t),
                        o.message || "The ZIP code must be 5 or 9 digits for zip + 4 codes"
                    }
                    return i
                }
            },
            PASSWORD: {
                name: "Password",
                description: 'Blank or {"pass": "CustomScript.pass"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "param");
                    if (!o)
                        throw "Error in validation!";
                    return e = executeCallback(o.pass, e, t)
                }
            },
            MONEY: {
                name: "Monetary value (money)",
                description: 'Blank or {"message": "Failed!", "focus": "CustomScript.focus", "blur": "CustomScript.blur"}',
                filter: {
                    attach: function(e, t, r) {
                        var o = Utilities.ConvertToJSONObject(r, "param");
                        if (!o)
                            throw "Error in validation!";
                        var i = Formatting.formatFieldAsMoney(e)
                          , n = Formatting.stripNonNumericalCharacters(i);
                        e.data("submit-value", n),
                        e.data("submit-type", "MONEY"),
                        e.bind("focus.money-filter", function() {
                            var r, i = e.val();
                            r = o.focus ? executeCallback(o.focus, i, t, e) : Formatting.stripNonNumericalCharacters(i),
                            i != r && e.val(r),
                            e.data("submit-value", r)
                        }),
                        e.bind("blur.money-filter", function() {
                            var r, i;
                            o.blur ? (r = e.val(),
                            i = executeCallback(o.blur, r, t, e)) : (r = Formatting.formatFieldAsMoney(e),
                            i = Formatting.stripNonNumericalCharacters(r)),
                            e.data("submit-value", i)
                        })
                    },
                    detach: function(e, t, r) {
                        e.unbind(".money-filter")
                    }
                }
            },
            CUSTOMEXPRESSION: {
                name: "Custom expression",
                description: '^[A-z]+$ or {"pattern": "^[A-z]+$", "modifiers": "ig", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "pattern");
                    if (!o || !o.pattern)
                        throw "Wrong validation expression pattern!";
                    var i = new RegExp(o.pattern,o.modifiers);
                    if (i.test(e))
                        return e = executeCallback(o.pass, e, t);
                    throw e = executeCallback(o.fail, e, t),
                    o.message || "The information is formatted incorrectly"
                }
            },
            CUSTOMFUNCTION: {
                name: "Custom function",
                description: 'CustomScript.myValFn or {"function": "CustomScript.myValFn"}',
                filter: function(e, t, r) {
                    var o = Utilities.ConvertToJSONObject(r, "function");
                    if (!o || !o.function)
                        throw "Missing validation function!";
                    var i = o.function.replace(/[\(\)\;]/g, "")
                      , n = executeCallback(i, e, t);
                    return n
                }
            }
        }
    }(),
    Validator
}),
define("AjaxTab", [], function() {
    var e = new function(t) {
        function r(e, t, r, o) {
            Log.Add(h + e, t, r, o)
        }
        function o() {
            try {
                y = 0,
                g.find("div").remove(),
                m.find("div").remove()
            } catch (e) {
                r("Clear", e, Log.Type.Error)
            }
        }
        function i(e) {
            try {
                r("SetBackground", "Called");
                var t = $(e).attr("iID");
                g.find("div[iID='" + t + "']").css("background-color", "#ddd"),
                m.find("div[iID='" + t + "']").css("background-color", "#ddd")
            } catch (e) {
                r("SetBackground", e, Log.Type.Error)
            }
        }
        function n() {
            try {
                r("ResetBackgrounds", "Called"),
                g.find("div").css("background-color", "#fff"),
                m.find("div").css("background-color", "#fff")
            } catch (e) {
                r("ResetBackgrounds", e, Log.Type.Error)
            }
        }
        function a() {
            y > 10 && y % 5 == 0 && (g.find("div:lt(5)").remove(),
            m.find("div:lt(5)").remove())
        }
        function s() {
            p = MP.Tools.Config.Editor.tabs.ajax,
            p.size || (p.size = {
                width: 600,
                height: 400
            })
        }
        function l() {
            e.Enabled ? f.dialog("option", "title", "Ajax viewer") : f.dialog("option", "title", "Ajax viewer - Disabled");
            var t = $(".ui-dialog-buttonpane", f.parent())
              , r = function(e) {
                return $("button:contains(" + e + ")", t)
            };
            e.Enabled ? r("Enable").html("Disable") : r("Disable").html("Enable"),
            p.pinned ? r("Pin").html("Unpin") : r("Unpin").html("Pin"),
            d == c ? r("Tab View").html("View Here") : r("View Here").html("Tab View")
        }
        try {
            var c, d, u, p, h = "AjaxTab.", f = null, g = null, m = null, y = 0, C = "", v = "";
            return {
                Enabled: !1,
                Initialized: !1,
                AddCommand: function(e) {
                    try {
                        if (C = e,
                        !this.Enabled || !u.is(":visible"))
                            return;
                        a(),
                        y++;
                        var t = "<span class='time'>[" + y + "] " + Utilities.GetFormattedTime() + "</span> <br/>"
                          , o = $("<div/>");
                        o.attr("iID", y),
                        o.text(e),
                        o.prepend(t),
                        o.addClass("item"),
                        o.click(function() {
                            n(),
                            i(this)
                        }),
                        g.append(o)
                    } catch (e) {
                        r("AddCommand", e, Log.Type.Error, !0)
                    }
                },
                AddResponse: function(e, t) {
                    try {
                        if (v = e,
                        !this.Enabled || !u.is(":visible"))
                            return;
                        var o = $(e).find("stingray>errorcode").text();
                        "0101" == o ? e = "An empty response due empty callback" : (e = Utilities.GetXmlString(e),
                        t && (e = t + "\n" + e));
                        var a = "<span class='time'>[" + y + "] " + Utilities.GetFormattedTime() + "</span> <br/>"
                          , s = $("<div/>");
                        s.attr("iID", y),
                        s.text(e),
                        s.prepend(a),
                        s.addClass("item"),
                        s.click(function() {
                            n(),
                            i(this)
                        }),
                        m.append(s)
                    } catch (e) {
                        r("AddResponse", e, Log.Type.Error, !0)
                    }
                },
                ClearTab: function() {
                    this.Initialized && (r("ClearTab", "Called"),
                    o())
                },
                Show: function(e) {
                    this.Initialized && (f.dialog("open"),
                    e && !this.Enabled && this.Switch())
                },
                Hide: function() {
                    this.Initialized && f.dialog("close")
                },
                Switch: function() {
                    this.Enabled = !this.Enabled,
                    l(),
                    0 == y && (this.AddCommand(C),
                    this.AddResponse(v))
                },
                Pin: function(e) {
                    e == t ? p.pinned = !p.pinned : p.pinned = e,
                    l(),
                    p.pinned ? $(window).bind("scroll.pinAjaxDiv", function() {
                        var e = f.parent();
                        e.is(":visible") && e.css("top", f.data("lastTop") + $(document).scrollTop() + "px")
                    }) : $(window).unbind("scroll.pinAjaxDiv")
                },
                MoveTo: function(t) {
                    t = t ? t.toLowerCase() : d == f ? "tab" : "float",
                    p.viewStyle = t;
                    var r = u.detach()
                      , o = 'This view is inactive. You can either <a class="activateViewLink">activate this view</a> or <a class="goToViewLink">go to the other view</a>.';
                    "tab" == t ? (d = c,
                    this.Hide(),
                    f.html(o),
                    f.find(".activateViewLink").bind("click", function() {
                        e.MoveTo("float")
                    }),
                    f.find(".goToViewLink").bind("click", function() {
                        e.Hide(),
                        Global.ScrollToElement($("#AjaxLink"))
                    }),
                    c.html(""),
                    r.appendTo(c),
                    this.Initialized && Global.ScrollToElement($("#AjaxLink"))) : (d = f,
                    c.html(o),
                    c.find(".activateViewLink").bind("click", function() {
                        e.MoveTo("tab")
                    }),
                    c.find(".goToViewLink").bind("click", function() {
                        e.Show(),
                        Global.ScrollToElement(f.parent())
                    }),
                    f.html(""),
                    r.appendTo(f)),
                    l()
                },
                Initialize: function() {
                    try {
                        if (!MP.Tools.Config.ajaxEnabled || this.Initialized)
                            return;
                        r("Initialize", "Called"),
                        s(),
                        c = $("#AjaxTab"),
                        f = $("#AjaxDiv"),
                        f.length || (f = $('<div id="AjaxDiv" style="text-align: left;"><div class="toolWrapper"><div id="Commands"/><div id="Responses"/></div></div>')),
                        g = f.find("#Commands"),
                        m = f.find("#Responses"),
                        u = f.find(".toolWrapper"),
                        d = f;
                        var t = {
                            Clear: function() {
                                e.ClearTab()
                            },
                            Enable: function() {
                                e.Switch()
                            },
                            Pin: function() {
                                e.Pin()
                            },
                            "Tab View": function() {
                                e.MoveTo()
                            }
                        };
                        f.dialog({
                            width: p.size.width,
                            height: p.size.height,
                            position: [p.position.left, p.position.top],
                            minWidth: 300,
                            minHeight: 200,
                            autoOpen: !1,
                            closeOnEscape: !1,
                            modal: !1,
                            buttons: t,
                            dialogClass: "aboveSpinner",
                            resizeStart: function() {
                                Global.DisableHighlightingInChrome(!0)
                            },
                            resizeStop: function() {
                                Global.DisableHighlightingInChrome(!1)
                            },
                            dragStart: function() {
                                Global.DisableHighlightingInChrome(!0)
                            },
                            dragStop: function(e, t) {
                                Global.DisableHighlightingInChrome(!1),
                                Global.UpdateLastPosition(f, t)
                            },
                            open: function(e) {
                                l(),
                                f.data("lastLeft") && f.data("lastTop") ? f.dialog("option", {
                                    position: [f.data("lastLeft"), f.data("lastTop")]
                                }) : Global.UpdateLastPosition(f)
                            }
                        }),
                        this.MoveTo(p.viewStyle),
                        this.Pin(p.pinned || !1),
                        this.Initialized = !0
                    } catch (e) {
                        r("Initialize", e, Log.Type.Error)
                    }
                }
            }
        } catch (e) {
            r("Main", e, Log.Type.Error)
        }
    }
    ;
    return e
}),
define("ReqList", ["Utilities"], function(e) {
    var t = new function(r) {
        function o(e, t, r, o) {
            Log.Add(m + e, t, r, o)
        }
        function i(e, t) {
            this.Name = e,
            this.Value = t
        }
        function n(e) {
            v++;
            var t = $("<tr/>");
            return t.append("<td class='index'>" + v + "</td>"),
            t.append("<td class='name'>" + e.Name + "</td>"),
            "VRM-PG" == e.Name ? t.append("<td class='wpValue'>" + e.Value + "</td>") : (t.append("<td class='value'><code class='ReqList'/></td>"),
            t.find("code").text(e.Value)),
            t
        }
        function a() {
            v = 0,
            C && C.empty().remove(),
            C = $('<table class="ReqList"><tr><th>ID</th><th>Name</th><th>Value</th></tr></table>'),
            f.append(C)
        }
        function s(e) {
            if (!g.filterVars)
                return !0;
            for (var t = g.filter.split(" "), r = 0; r < t.length; r++) {
                var o = new RegExp(t[r],"i");
                if (e.search(o) > -1)
                    return !0
            }
            return !1
        }
        function l(e, r, i) {
            try {
                if (!e)
                    return;
                if ($.inArray(r, t.ExcludeVRMs) > -1)
                    return;
                o("Display", "Called");
                var n = Communication.InitialRequest;
                if (n && (E = i,
                T = r),
                !t.Enabled || !f.is(":visible"))
                    return;
                if (n)
                    g.showAll || a(),
                    t.Add("VRM-PG", r);
                else if (t.Add("VRM-PG", r),
                !g.showAll)
                    return;
                for (var l = $(e).text(), d = l.split(/\|{2}/g), u = 0; u < d.length; u++) {
                    var p = d[u]
                      , h = p.indexOf("=")
                      , m = p.substring(0, h)
                      , y = p.substring(h + 1);
                    s(m) && t.Add(m, y)
                }
                c(),
                g.filterVars || t.FilterBy()
            } catch (e) {
                o("Display", e, Log.Type.Error)
            }
        }
        function c() {
            var e = C.find("tr").length;
            if (e > 1e3) {
                var t = e - 1e3;
                C.find("tr:gt(0):lt(" + t.toString() + ")").empty().remove()
            }
        }
        function d() {
            g = MP.Tools.Config.Editor.tabs.reqList
        }
        function u() {
            var e = $(".ui-dialog-buttonpane", y.parent())
              , r = function(t) {
                return $("button:contains(" + t + ")", e)
            };
            t.Enabled ? r("Enable").html("Disable") : r("Disable").html("Enable"),
            g.pinned ? r("Pin").html("Unpin") : r("Unpin").html("Pin"),
            h == p ? r("Tab View").html("View Here") : r("View Here").html("Tab View"),
            g.showAll ? r("All VRMs").html("1st VRM").attr("title", "Click here to display ReqList of the initial response only.") : r("1st VRM").html("All VRMs").attr("title", "Click here to display ReqList of all responses."),
            g.filterVars ? r("Filter ON").html("Filter OFF").attr("title", "Click here to hide filtered variables allowing their recovery within less ReqLists.") : r("Filter OFF").html("Filter ON").attr("title", "Click here to permanently remove filtered variables allowing more ReqLists to be shown.");
            var o = "";
            t.Enabled ? (o += g.filterVars ? " - Filter ON" : "",
            o += g.showAll ? "" : " - 1st VRM Only") : o = " - Disabled",
            y.dialog("option", "title", "ReqList viewer" + o)
        }
        try {
            var p, h, f, g, m = "ReqList.", y = null, C = null, v = 0, E = "", T = "";
            return {
                Enabled: !1,
                Initialized: !1,
                ExcludeVRMs: ["ICONTRAY"],
                GetList: function() {
                    return E ? e.GetXmlString(E) : "No ReqList"
                },
                Load: function(e) {
                    try {
                        if (!this.Initialized || !e)
                            return;
                        o("Load", "Called");
                        var t = $(e).find("stingray")
                          , r = t.find("errorcode").text();
                        if ("0101" == r)
                            return;
                        var i = t.find("vrmname").text()
                          , n = t.find("reqlist");
                        l(n, i, e)
                    } catch (e) {
                        o("Load", e, Log.Type.Error, !0)
                    }
                },
                Add: function(e, t) {
                    try {
                        if (!this.Initialized)
                            return null;
                        var r = new i(e,t)
                          , a = n(r);
                        return C.append(a),
                        a
                    } catch (e) {
                        o("Add", e, Log.Type.Error)
                    }
                },
                ClearTab: function() {
                    this.Initialized && (o("ClearTab", "Called"),
                    a())
                },
                Show: function(e) {
                    this.Initialized && (y.dialog("open"),
                    e && !this.Enabled && this.Switch())
                },
                Hide: function() {
                    this.Initialized && y.dialog("close")
                },
                Switch: function() {
                    this.Enabled = !this.Enabled,
                    u(),
                    0 == v && this.Load(E)
                },
                Pin: function(e) {
                    e == r ? g.pinned = !g.pinned : g.pinned = e,
                    u(),
                    g.pinned ? $(window).bind("scroll.pinReqListDiv", function() {
                        var e = y.parent();
                        e.is(":visible") && e.css("top", y.data("lastTop") + $(document).scrollTop() + "px")
                    }) : $(window).unbind("scroll.pinReqListDiv")
                },
                MoveTo: function(e) {
                    e = e ? e.toLowerCase() : h == y ? "tab" : "float",
                    g.viewStyle = e;
                    var r = f.detach()
                      , o = 'This view is inactive. You can either <a class="activateViewLink">activate this view</a> or <a class="goToViewLink">go to the other view</a>.';
                    "tab" == e ? (h = p,
                    this.Hide(),
                    y.html(o),
                    y.find(".activateViewLink").bind("click", function() {
                        t.MoveTo("float")
                    }),
                    y.find(".goToViewLink").bind("click", function() {
                        t.Hide(),
                        Global.ScrollToElement($("#ReqListLink"))
                    }),
                    p.html(""),
                    r.appendTo(p),
                    this.Initialized && Global.ScrollToElement($("#ReqListLink"))) : (h = y,
                    p.html(o),
                    p.find(".activateViewLink").bind("click", function() {
                        t.MoveTo("tab")
                    }),
                    p.find(".goToViewLink").bind("click", function() {
                        t.Show(),
                        Global.ScrollToElement(y.parent())
                    }),
                    y.html(""),
                    r.appendTo(y)),
                    u()
                },
                ShowWhat: function(e) {
                    e == r ? g.showAll = !g.showAll : g.showAll = e,
                    u()
                },
                FilterVars: function(e) {
                    e == r ? g.filterVars = !g.filterVars : g.filterVars = e,
                    u()
                },
                Initialize: function() {
                    try {
                        if (!MP.Tools.Config.reqlistEnabled || this.Initialized)
                            return;
                        o("Initialize", "Called"),
                        d(),
                        p = $("#ReqListTab"),
                        y = $("#ReqListDiv"),
                        y.length || (y = $('<div id="ReqListDiv"><div class="toolWrapper"></div></div>')),
                        f = y.find(".toolWrapper"),
                        h = y;
                        var e = {
                            Clear: function() {
                                t.ClearTab()
                            },
                            Enable: function() {
                                t.Switch()
                            },
                            Pin: function() {
                                t.Pin()
                            },
                            "Tab View": function() {
                                t.MoveTo()
                            },
                            "All VRMs": function() {
                                t.ShowWhat()
                            },
                            "Filter OFF": function() {
                                t.FilterVars()
                            }
                        };
                        y.dialog({
                            width: g.size.width,
                            height: g.size.height,
                            position: [g.position.left, g.position.top],
                            minWidth: 380,
                            minHeight: 200,
                            autoOpen: !1,
                            closeOnEscape: !1,
                            modal: !1,
                            buttons: e,
                            dialogClass: "aboveSpinner",
                            resizeStart: function() {
                                Global.DisableHighlightingInChrome(!0)
                            },
                            resizeStop: function() {
                                Global.DisableHighlightingInChrome(!1)
                            },
                            dragStart: function() {
                                Global.DisableHighlightingInChrome(!0)
                            },
                            dragStop: function(e, t) {
                                Global.DisableHighlightingInChrome(!1),
                                Global.UpdateLastPosition(y, t)
                            },
                            open: function(e) {
                                u(),
                                y.data("lastLeft") && y.data("lastTop") ? y.dialog("option", {
                                    position: [y.data("lastLeft"), y.data("lastTop")]
                                }) : Global.UpdateLastPosition(y)
                            }
                        }),
                        y.find("#edReqListFilter").val(g.filter).bind("keyup", function(e) {
                            t.UpdateFilter(e.target.value),
                            t.FilterBy()
                        }),
                        a(),
                        this.MoveTo(g.viewStyle),
                        this.Pin(g.pinned || !1),
                        this.Initialized = !0
                    } catch (e) {
                        o("Initialize", e, MP.Types.Log.Error)
                    }
                },
                UpdateFilter: function(t) {
                    var r = $.trim(t);
                    r = e.RemoveWhiteSpaces(r),
                    g.filter = r
                },
                FilterBy: function() {
                    try {
                        o("FilterBy", "Called: " + g.filter);
                        var e = C.find("tr td.name").parent();
                        if (g.filter)
                            for (var t = g.filter.split(" "), r = 0; r < e.length; r++) {
                                var i = $(e[r])
                                  , n = i.find("td.name").text()
                                  , a = "VRM-PG" == n;
                                if (!a)
                                    for (var s = 0; s < t.length; s++) {
                                        var l = new RegExp(t[s],"i");
                                        if (n.search(l) > -1) {
                                            a = !0;
                                            break
                                        }
                                    }
                                a ? i.show() : i.hide()
                            }
                        else
                            e.show()
                    } catch (e) {
                        o("FilterBy", e, Log.Type.Error, !0)
                    }
                }
            }
        } catch (e) {
            o("Main", e, Log.Type.Error)
        }
    }
    ;
    return t
}),
define("WatchList", ["Utilities"], function(e) {
    var t = new function(r) {
        function o(e, t, r, o) {
            Log.Add(g + e, t, r, o)
        }
        function i(e, t, r) {
            this.NewBP = r,
            this.Name = e,
            this.Value = t
        }
        function n(e) {
            var t = $("<tr/>");
            return e.NewBP ? (C = 0,
            t.append("<td class='wpIndex'></td>"),
            t.append("<td class='wpName'></td>"),
            t.append("<td class='wpValue'>" + e.Value + "</td>")) : (C++,
            t.append("<td class='index'>" + C + "</td>"),
            t.append("<td class='name'>" + e.Name + "</td>"),
            t.append("<td class='value'><code class='ReqList'/></td>"),
            t.find("code").text(e.Value)),
            t
        }
        function a() {
            C = 0,
            y && y.empty().remove(),
            y = $('<table class="ReqList"><tr><th>ID</th><th>Name</th><th>Value</th></tr></table>'),
            h.append(y)
        }
        function s(e, t, r) {
            try {
                var a = new i(e,t,r);
                y.append(n(a))
            } catch (e) {
                o("Add", e, Log.Type.Error)
            }
        }
        function l(e, r, i) {
            try {
                if (!e)
                    return !1;
                o("Display", "Called");
                var n = $(e).text();
                if (!n)
                    return !1;
                var l = $.parseJSON(n);
                if (0 == l.length)
                    return !1;
                if (v = i,
                E = r,
                !t.Enabled || !h.is(":visible"))
                    return !1;
                a();
                for (var c = 0; c < l.length; c++) {
                    var d = l[c];
                    s("", d.n, !0);
                    for (var u = 0; u < d.v.length; u++) {
                        var p = d.v[u];
                        s(p.n, p.v, !1)
                    }
                }
                return !0
            } catch (e) {
                o("Display", e, Log.Type.Error);
            }
        }
        function c() {
            f = MP.Tools.Config.Editor.tabs.watchList,
            f.size || (f.size = {
                width: 600,
                height: 400
            })
        }
        function d() {
            t.Enabled ? m.dialog("option", "title", "WatchList viewer") : m.dialog("option", "title", "WatchList viewer - Disabled");
            var e = $(".ui-dialog-buttonpane", m.parent())
              , r = function(t) {
                return $("button:contains(" + t + ")", e)
            };
            t.Enabled ? r("Enable").html("Disable") : r("Disable").html("Enable"),
            f.pinned ? r("Pin").html("Unpin") : r("Unpin").html("Pin"),
            p == u ? r("Tab View").html("View Here") : r("View Here").html("Tab View")
        }
        try {
            var u, p, h, f, g = "WatchList.", m = null, y = null, C = 0, v = "", E = "";
            return {
                Enabled: !1,
                Initialized: !1,
                GetList: function() {
                    return v ? e.GetXmlString(v) : "No WatchList"
                },
                Load: function(e) {
                    try {
                        if (!this.Initialized || !e)
                            return;
                        o("Load", "Called");
                        var t = $(e).find("stingray")
                          , r = t.find("vrmname").text()
                          , i = t.find("watchlist");
                        l(i, r, e) && this.AutoFilter()
                    } catch (e) {
                        o("Load", e, Log.Type.Error, !0)
                    }
                },
                ClearTab: function() {
                    this.Initialized && (o("ClearTab", "Called"),
                    a())
                },
                Show: function(e) {
                    this.Initialized && (m.dialog("open"),
                    e && !this.Enabled && this.Switch())
                },
                Hide: function() {
                    this.Initialized && m.dialog("close")
                },
                Switch: function() {
                    this.Enabled = !this.Enabled,
                    d(),
                    0 == C && this.Load(v)
                },
                Pin: function(e) {
                    e == r ? f.pinned = !f.pinned : f.pinned = e,
                    d(),
                    f.pinned ? $(window).bind("scroll.pinWatchListDiv", function() {
                        var e = m.parent();
                        e.is(":visible") && e.css("top", m.data("lastTop") + $(document).scrollTop() + "px")
                    }) : $(window).unbind("scroll.pinWatchListDiv")
                },
                MoveTo: function(e) {
                    e = e ? e.toLowerCase() : p == m ? "tab" : "float",
                    f.viewStyle = e;
                    var r = h.detach()
                      , o = 'This view is inactive. You can either <a class="activateViewLink">activate this view</a> or <a class="goToViewLink">go to the other view</a>.';
                    "tab" == e ? (p = u,
                    this.Hide(),
                    m.html(o),
                    m.find(".activateViewLink").bind("click", function() {
                        t.MoveTo("float")
                    }),
                    m.find(".goToViewLink").bind("click", function() {
                        t.Hide(),
                        Global.ScrollToElement($("#WatchListLink"))
                    }),
                    u.html(""),
                    r.appendTo(u),
                    this.Initialized && Global.ScrollToElement($("#WatchListLink"))) : (p = m,
                    u.html(o),
                    u.find(".activateViewLink").bind("click", function() {
                        t.MoveTo("tab")
                    }),
                    u.find(".goToViewLink").bind("click", function() {
                        t.Show(),
                        Global.ScrollToElement(m.parent())
                    }),
                    m.html(""),
                    r.appendTo(m)),
                    d()
                },
                Initialize: function() {
                    try {
                        if (!MP.Tools.Config.watchlistEnabled || this.Initialized)
                            return;
                        o("Initialize", "Called"),
                        c(),
                        u = $("#WatchListTab"),
                        m = $("#WatchListDiv"),
                        m.length || (m = $('<div id="WatchListDiv"><div class="toolWrapper"></div></div>')),
                        h = m.find(".toolWrapper"),
                        p = m;
                        var e = {
                            Clear: function() {
                                t.ClearTab()
                            },
                            Enable: function() {
                                t.Switch()
                            },
                            Pin: function() {
                                t.Pin()
                            },
                            "Tab View": function() {
                                t.MoveTo()
                            }
                        };
                        m.dialog({
                            width: f.size.width,
                            height: f.size.height,
                            position: [f.position.left, f.position.top],
                            minWidth: 300,
                            minHeight: 200,
                            autoOpen: !1,
                            closeOnEscape: !1,
                            modal: !1,
                            buttons: e,
                            dialogClass: "aboveSpinner",
                            resizeStart: function() {
                                Global.DisableHighlightingInChrome(!0)
                            },
                            resizeStop: function() {
                                Global.DisableHighlightingInChrome(!1)
                            },
                            dragStart: function() {
                                Global.DisableHighlightingInChrome(!0)
                            },
                            dragStop: function(e, t) {
                                Global.DisableHighlightingInChrome(!1),
                                Global.UpdateLastPosition(m, t)
                            },
                            open: function(e) {
                                d(),
                                m.data("lastLeft") && m.data("lastTop") ? m.dialog("option", {
                                    position: [m.data("lastLeft"), m.data("lastTop")]
                                }) : Global.UpdateLastPosition(m)
                            }
                        }),
                        m.find("#edWatchListFilter").val(f.filter).bind("keyup", function(e) {
                            var r = e.target.value;
                            f.filter = r,
                            t.FilterBy(r)
                        }),
                        a(),
                        this.MoveTo(f.viewStyle),
                        this.Pin(f.pinned || !1),
                        this.Initialized = !0
                    } catch (e) {
                        o("Initialize", e, Log.Type.Error)
                    }
                },
                AutoFilter: function() {
                    var e = $("#edWatchListFilter").val();
                    e && this.FilterBy(e)
                },
                FilterBy: function(t) {
                    try {
                        t = $.trim(t),
                        t = e.RemoveWhiteSpaces(t),
                        o("FilterBy", "Called: " + t);
                        var r = y.find("tr td.name").parent();
                        if (t)
                            for (var i = t.split(" "), n = 0; n < r.length; n++) {
                                var a = $(r[n])
                                  , s = a.find("td.name").text()
                                  , l = !1;
                                $.each(i, function(e, t) {
                                    var r = new RegExp(t,"i");
                                    if (s.search(r) > -1)
                                        return void (l = !0)
                                }),
                                l ? a.show() : a.hide()
                            }
                        else
                            r.show()
                    } catch (e) {
                        o("FilterBy", e, Log.Type.Error, !0)
                    }
                }
            }
        } catch (e) {
            o("Main", e, Log.Type.Error)
        }
    }
    ;
    return t
}),
define("Communication", ["page/comp/ValidatorContainer", "Utilities", "PageHelper", "RuleHelper", "Editor", "ReqList", "HtmlEditor", "ContextMenu", "VrmScript"], function(Validator, Utilities, PageHelper, RuleHelper, Editor, ReqList, HtmlEditor, ContextMenu, VrmScript) {
    var Communication = new function(undefined) {
        function iLog(e, t, r, o) {
            Log.Add("Comm." + e, t, r, o)
        }
        function Request() {
            this.async = !0,
            this.cache = !1,
            this.initialRequest = !1,
            this.method = "POST",
            this.data = null,
            this.id = "",
            this.host = "../../",
            this.template = "",
            this.timeout = 18e4,
            this.dataType = "xml",
            this.url = null,
            this.requestType = "",
            this.done = $.noop,
            this.fail = $.noop
        }
        function GetValueFromURL(e, t) {
            return decodeURIComponent((new RegExp("[?|&]" + t + "=([^&;]+?)(&|#|;|$)","i").exec(e) || [, ""])[1].replace(/\+/g, "%20")) || null
        }
        function EnsureFooterSeparator(e) {
            e.find("#FooterSeparator").length || e.append("<div id='FooterSeparator'></div>")
        }
        function initAfterLogin(e) {
            var t = Communication.SessionID;
            e && (Communication.SessionID = e,
            t || Communication.LinkRequest("icontray.max", "IconTray", !0))
        }
        function UpdateSessionFromURL(e) {
            e && initAfterLogin(GetValueFromURL(e, "id"))
        }
        function UpdateSessionFromXML(e) {
            if (e) {
                var t = $(e).find("stingray");
                initAfterLogin(t.find("id").text());
                var r = t.find("debug").text();
                r && r != lastDebug && (lastDebug = r,
                MP.Tools.ConfigUpdate(r));
                var o = t.find("vrmname").text().toLowerCase();
                if (o && !($.inArray(o, ["na", "ajax", "titletop", "icontray", "mainfooter", "topmenu", "admintabs", "tablewalker"]) > -1) && Communication.InitialRequest && Communication.VRMName != o) {
                    Communication.VRMName = o,
                    MP.Tools.ShowVrmName(o);
                    var i = t.find("html").text();
                    HtmlEditor.Show(i)
                }
            }
        }
        function UpdateEditorFromXML(e) {
            if (e && $(e).length) {
                e = $(e);
                var t, r, o;
                return null != e.find("stingray")[0] ? (t = e.find("stingray"),
                r = t.find("vrmname").text(),
                o = t.find("vrmpath").text(),
                "success" == t.find("status").text() && (t = t.find("vrm"))) : (t = e.find("vrm"),
                r = t.find("function>fn").text()),
                r && (Editor.VRMName = r),
                o && (Editor.VRMPath = o),
                t
            }
        }
        function replaceSection(e, t) {
            try {
                iLog("replaceSection", "Called");
                var r = vrmEdit.context
                  , o = r.createCDATASection(e)
                  , i = r.createElement(t);
                $(i).append(o);
                var n = vrmEdit.find(t)[0];
                n ? vrmEdit[0].replaceChild(i, n) : vrmEdit[0].appendChild(i)
            } catch (e) {
                iLog("replaceSection", e, Log.Type.Error)
            }
        }
        function ExecuteCallback(e) {
            try {
                iLog("ExecuteCallback", "Called");
                var t = $(e).find("stingray>callback").text();
                1 == t && (Communication.SerialRequest($('<div VRMName="callback"/>'), "CALLBACK"),
                iLog("ExecuteCallback", "Requested", Log.Type.Info))
            } catch (e) {
                iLog("ExecuteCallback", e, Log.Type.Error)
            }
        }
        function RemoveOldCKEditors() {
            try {
                for (var e in CKEDITOR.instances) {
                    var t = CKEDITOR.instances[e];
                    $("#" + t.name).length || t.destroy()
                }
            } catch (e) {
                iLog("RemoveOldCKEditors", e, Log.Type.Error)
            }
        }
        function editorUpdate(e) {
            Global.ShowProgress();
            var t = e ? "1" : "0"
              , r = MP.LanguageMgr.Save()
              , o = HtmlEditor.Save()
              , i = VrmScript.Save();
            replaceSection(o, "html"),
            replaceSection(r, "languages"),
            replaceSection(i, "scripts"),
            vrmEdit.find("function>lockedBy").text("");
            var n = Utilities.GetXmlString(vrmEdit);
            n = PageHelper.CleanVrmAfterEditor(n);
            var a = new Request
              , s = vrmEdit;
            a.requestType = "Editor Update Request",
            a.template = "savetemplate.max",
            a.id = Communication.SessionID,
            a.data = "templatename=" + Editor.VRMName + "&path=" + Editor.VRMPath + "&QuickSave=" + t + "&vrm=" + n,
            a.onSuccess = function(t) {
                Global.HideProgress();
                var r = $(t).find("stingray")
                  , i = r.find("status").text()
                  , n = r.find("html").text();
                if ("success" == i)
                    iLog("EditorUpdate", n, Log.Type.Info),
                    e ? (Editor.EnableEditor(),
                    HtmlEditor.Load(),
                    RulesMaker.Enable()) : (RulesMaker.Disable(),
                    ContextMenu.RemoveAll(),
                    Communication.MakeAllCompsDefault($("#middle"), !0, !1, !1),
                    HtmlEditor.Clear(o),
                    Editor.Clear(),
                    Editor.DisableEditor());
                else {
                    iLog("EditorUpdate", "Failed! " + n, Log.Type.Error, !0),
                    vrmEdit = s,
                    Editor.EnableEditor(),
                    HtmlEditor.Load(),
                    RulesMaker.Enable();
                    var a = r.find("errorcomponent").text()
                      , l = r.find("errorprocess").text();
                    RulesMaker.HandleServerError(l, a, n)
                }
            }
            ,
            a.onError = function(e, t) {
                iLog("EditorUpdate", "Failed! " + e, Log.Type.Error, !0),
                Global.HideProgress(),
                vrmEdit = s,
                Editor.EnableEditor(),
                HtmlEditor.Load(),
                RulesMaker.Enable(),
                Global.ShowErrorMessage("<h3>Update of VRM Page Failed</h3><p>Please diagnose the problem using the information found in the 'Ajax' and 'Logging' tabs.</p>")
            }
            ,
            Communication.ProcessRequest(a)
        }
        try {
            var vrmEdit = null
              , notifiedTimeout = !1
              , lastDebug = ""
              , loggedOut = "LOGGED OUT";
            return {
                SessionExpiration: 3600,
                ShowNotification: 120,
                EnableSessionTimer: !0,
                LastPageTransition: null,
                VRMName: "",
                SessionID: "",
                InitialRequest: !1,
                UserLanguage: "",
                StartSessionTimer: function(e, t) {
                    iLog("StartSessionTimer", "Called"),
                    e && (Communication.SessionExpiration = e),
                    t && (Communication.ShowNotification = t),
                    setTimeout("Communication.CheckTimeout()", 1e3)
                },
                ResetTimeout: function() {
                    iLog("ResetTimeout", "Called"),
                    notifiedTimeout = !1,
                    Communication.LastPageTransition = new Date
                },
                SessionOK: function() {
                    return Communication.SessionID && Communication.SessionID != loggedOut
                },
                LogOff: function() {
                    iLog("LogOff", "Called"),
                    notifiedTimeout = !1,
                    Communication.LinkRequest("logoff.max"),
                    Communication.SessionID = loggedOut
                },
                ShowTimeRemaining: function() {
                    if (notifiedTimeout) {
                        iLog("ShowTimeRemaining", "Called");
                        var e = Communication.LastPageTransition.getTime()
                          , t = (new Date).getTime()
                          , r = (t - e) / 1e3
                          , o = ""
                          , i = Communication.SessionExpiration - Math.round(r);
                        if (i < 60)
                            $("#ExpirationNoticeTimer").text(i + " seconds");
                        else {
                            var n = Math.floor(i / 60);
                            e = i % 60,
                            o = n > 1 ? n + " minutes and " + e + " seconds" : n + " minute and " + e + " seconds",
                            $("#ExpirationNoticeTimer").text(o)
                        }
                        return setTimeout("Communication.ShowTimeRemaining()", 1e3),
                        o
                    }
                },
                TimeoutDialogClosed: function() {
                    notifiedTimeout && (iLog("TimeoutDialogClosed", "Called"),
                    Communication.ResetTimeout())
                },
                CheckTimeout: function() {
                    if (Communication.LastPageTransition && Communication.EnableSessionTimer) {
                        var e = Communication.LastPageTransition.getTime()
                          , t = (new Date).getTime()
                          , r = (t - e) / 1e3
                          , o = Communication.SessionExpiration - Math.round(r);
                        if (setTimeout("Communication.CheckTimeout()", 1e3),
                        r > Communication.SessionExpiration - Communication.ShowNotification && !notifiedTimeout) {
                            var i = $("<div/>");
                            i.append("<h3>Your session is about to expire</h3><p>Due to system inactivity your session is about to expire.</p> <p>You will be automatically logged off in <span id='ExpirationNoticeTimer'></span>.</p><p>&nbsp;</p>"),
                            i.append("<p><input type='button' onclick='Communication.ResetTimeout(); Global.HideMessage();' value='Continue Using System'> &nbsp; <input type='button' onclick='Communication.LogOff(); Global.HideMessage();' value='Log Off'></p>"),
                            $("#ModalWindow").bind("dialogclose", function() {
                                Communication.TimeoutDialogClosed(),
                                $("#ModalWindow").unbind("dialogclose")
                            }),
                            Global.ShowMessage(i),
                            setTimeout("Communication.ShowTimeRemaining()", 1e3),
                            notifiedTimeout = !0
                        }
                        o <= 0 && (Communication.LogOff(),
                        Global.HideMessage(),
                        Communication.ResetTimeout())
                    }
                },
                EditorCreateNew: function(e, t) {
                    try {
                        if (Global.InProgress())
                            return;
                        iLog("EditorCreateNew", "Called"),
                        Global.ShowProgress();
                        var r = new Request;
                        r.requestType = "Editor Create New Request",
                        r.template = "createtemplate.max",
                        r.id = Communication.SessionID,
                        r.data = "vrmName=" + e + "&vrmTemplate=" + t,
                        r.onSuccess = function(t) {
                            iLog("EditorCreateNew", "Success", Log.Type.Info),
                            Global.HideProgress();
                            var r = $(t).find("stingray>html").text();
                            if (r)
                                return void Global.ShowErrorMessage(r);
                            vrmEdit = UpdateEditorFromXML(t);
                            var o = vrmEdit.find("html").text()
                              , i = vrmEdit.find("function>fn").text();
                            Editor.EnableEditor(i, "", "", function() {
                                Editor.Clear(),
                                RulesMaker.Load(vrmEdit),
                                HtmlEditor.Load(o),
                                MP.LanguageMgr.Load("")
                            }),
                            iLog("EditorCreateNew", "New " + e + ".vrm & " + e + ".sql files created.", Log.Type.Debug),
                            ExecuteCallback(vrmEdit)
                        }
                        ,
                        r.onError = function(e, t) {
                            iLog("EditorCreateNew", "Failed! " + e, Log.Type.Error, !0),
                            Global.HideProgress(),
                            Global.ShowErrorMessage("<h3>Creating New VRM Page Failed</h3><p>Please diagnose the problem using the information found in the 'Ajax' and 'Logging' tabs.</p>")
                        }
                        ,
                        Communication.ProcessRequest(r)
                    } catch (e) {
                        iLog("EditorCreateNew", e, Log.Type.Error),
                        Global.HideProgress()
                    }
                },
                EditorRequest: function(e, t, r) {
                    try {
                        if (Global.InProgress())
                            return;
                        if (iLog("EditorRequest", "Called"),
                        !e)
                            return void jAlert("No VRM provided! Nothing to edit.");
                        Global.ShowProgress();
                        var o = new Request;
                        o.requestType = "Editor Request",
                        o.template = "edittemplate.max",
                        o.id = Communication.SessionID,
                        o.data = "templateName=" + e,
                        t && (o.data += "&readOnly=1"),
                        o.onSuccess = function(e) {
                            iLog("EditorRequest", "Success", Log.Type.Info),
                            Global.HideProgress();
                            var o = $(e).find("stingray>html").text();
                            if (o)
                                return void Global.ShowErrorMessage(o);
                            vrmEdit = UpdateEditorFromXML(e);
                            var i = vrmEdit.find("html").text()
                              , n = vrmEdit.find("function>fn").text()
                              , a = vrmEdit.find("function>lockedBy").text()
                              , s = vrmEdit.find("function>lintMsg").text()
                              , l = vrmEdit.find("languages").text()
                              , c = vrmEdit.find("scripts").text();
                            Editor.EnableEditor(n, a, s, function() {
                                Editor.Clear(),
                                RulesMaker.Load(vrmEdit),
                                HtmlEditor.Load(i),
                                VrmScript.Load(c),
                                MP.LanguageMgr.Load(l),
                                r && (Editor.Standalone = r)
                            }, t),
                            ExecuteCallback(vrmEdit)
                        }
                        ,
                        o.onError = function(e, t) {
                            iLog("EditorRequest", "Failed! " + e, Log.Type.Error, !0),
                            Global.HideProgress(),
                            Global.ShowErrorMessage("<h3>Requesting VRM Page Failed</h3><p>Please diagnose the problem using the information found in the 'Ajax' and 'Logging' tabs.</p>")
                        }
                        ,
                        Communication.ProcessRequest(o)
                    } catch (e) {
                        iLog("EditorRequest", e, Log.Type.Error),
                        Global.HideProgress()
                    }
                },
                CloseEditor: function() {
                    try {
                        iLog("CloseEditor", "Called"),
                        PropertyEd.Hide(),
                        RulesMaker.Disable(),
                        ContextMenu.RemoveAll(),
                        Editor.DisableEditor(),
                        Global.ShowProgress();
                        var e = new Request;
                        e.requestType = "Editor Close Request",
                        e.template = "closetemplate.max",
                        e.id = Communication.SessionID,
                        e.data = "templatename=" + Editor.VRMName + "&path=" + Editor.VRMPath,
                        e.onSuccess = function(e) {
                            Global.HideProgress(),
                            UpdateEditorFromXML(e);
                            var t = $(e).find("stingray")
                              , r = t.find("status").text()
                              , o = t.find("html").text();
                            "success" == r ? iLog("CloseEditor", o, Log.Type.Info) : (iLog("CloseEditor", "Failed! " + o, Log.Type.Error, !0),
                            Global.ShowErrorMessage("<h3>Closing VRM Page Failed</h3><p>" + o + "</p>")),
                            o = HtmlEditor.Save(),
                            Communication.MakeAllCompsDefault($("#middle"), !0, !1, !1),
                            HtmlEditor.Clear(o),
                            Editor.Clear()
                        }
                        ,
                        e.onError = function(e, t) {
                            iLog("CloseEditor", "Failed! " + e, Log.Type.Error, !0),
                            Global.HideProgress();
                            var r = HtmlEditor.Save();
                            Communication.MakeAllCompsDefault($("#middle"), !0, !1, !1),
                            HtmlEditor.Clear(r),
                            Editor.Clear()
                        }
                        ,
                        Communication.ProcessRequest(e)
                    } catch (e) {
                        iLog("CloseEditor", e, Log.Type.Error),
                        Global.HideProgress()
                    }
                },
                EditorUpdate: function(e) {
                    try {
                        if (iLog("EditorUpdate", "Called"),
                        PropertyEd.Hide(),
                        !e) {
                            var t = PageHelper.ValidatePage() + RuleHelper.ValidatePage();
                            if (t)
                                return void jConfirm("There are warnings on this page. You can find details in the logging pane.<p>" + t + "</p><p>Click cancel to make changes or OK to save, but ignoring warnings may result in QA rejection.</p>", "Page validation", function(e) {
                                    e && editorUpdate(!1)
                                })
                        }
                        editorUpdate(e)
                    } catch (e) {
                        iLog("EditorUpdate", e, Log.Type.Error),
                        Global.HideProgress()
                    }
                },
                ProcessRequest: function(e) {
                    try {
                        iLog("ProcessRequest", "Called"),
                        this.InitialRequest = e.initialRequest;
                        var t = e.url;
                        if (t || (t = e.host + e.template),
                        t.indexOf("t=") == -1) {
                            var r = new Date
                              , o = r.getTime().toString()
                              , i = "t=" + o;
                            t += t.indexOf("?") == -1 ? "?" + i : "&" + i
                        }
                        e.url = t,
                        t.indexOf("icontray.max") == -1 && this.ResetTimeout();
                        var n = "id=" + e.id;
                        this.UserLanguage && (n = n + "&csul=" + this.UserLanguage);
                        var a = e.data || "";
                        a && !a.beginsWith("&") && (a = "&" + a),
                        e.data = n + a,
                        AjaxTab.AddCommand(Utilities.ToString(e));
                        $.ajax({
                            url: e.url,
                            data: e.data,
                            cache: e.cache,
                            timeout: e.timeout,
                            processData: !0,
                            dataType: e.dataType,
                            type: e.method,
                            async: e.async,
                            success: function(t) {
                                ReqList.Load(t),
                                WatchList.Load(t),
                                AjaxTab.AddResponse(t),
                                e.onSuccess(t),
                                t = null
                            },
                            error: function(t, r, o) {
                                try {
                                    var i = "";
                                    try {
                                        i = Utilities.ToString(t)
                                    } catch (e) {
                                        i = "XMLHttpRequest failed to serialize: " + e.message,
                                        iLog("ProcessRequest", i, Log.Type.Error, !0)
                                    }
                                    var n = "Error: " + o + ", Status: " + r;
                                    AjaxTab.AddResponse(i, n),
                                    e.onError(n, t);
                                    var a = window.CustomScript.onCommunicationError || MP.Events.onCommunicationError || $.noop;
                                    a(n, t)
                                } catch (e) {
                                    iLog("ProcessRequest", e, Log.Type.Error)
                                }
                            }
                        })
                    } catch (e) {
                        iLog("ProcessRequest", e, Log.Type.Error)
                    }
                },
                CorrectUI: function(e) {
                    try {
                        iLog("CorrectUI", "Called");
                        for (var t = 0, e = $(e), r = e.find(".component"), o = 0; o < r.length; o++) {
                            var i = PageHelper.GetEditorComponent(r[o]);
                            if (i && i.CorrectUI && !i.Corrected && (i.CorrectUI(),
                            t++),
                            t > 99) {
                                setTimeout("Communication.CorrectUI('" + e.selector + "')", 1e3);
                                break
                            }
                        }
                        iLog("CorrectUI", "Corrected " + t + " components")
                    } catch (e) {
                        iLog("CorrectUI", e, Log.Type.Error)
                    }
                },
                MakeAllCompsDefault: function(target, clearScripts, customOnLoad, globalOnLoad) {
                    try {
                        var comps = target.find(".component");
                        if (iLog("MakeAllCompsDefault", "Loading " + comps.length + " components"),
                        comps.each(function() {
                            var e = PageHelper.GetEditorComponent(this);
                            e && e.DefaultMode(clearScripts)
                        }),
                        this.CorrectUI(target.selector),
                        RemoveOldCKEditors(),
                        Editor.Enabled)
                            return;
                        if (comps.each(function() {
                            var ctrl = PageHelper.GetEditorComponent(this);
                            if (ctrl) {
                                if (ctrl.GetCliCondition) {
                                    var s = ctrl.GetCliCondition();
                                    if (s)
                                        try {
                                            if (!eval(s)) {
                                                var par = ctrl.GetControl();
                                                par.hide()
                                            }
                                        } catch (e) {
                                            iLog("Client Condition", e, Log.Type.Error, !0)
                                        }
                                }
                                PageHelper.AddHelpLink(ctrl)
                            }
                        }),
                        globalOnLoad && window.GlobalScript.OnLoad) {
                            iLog("GlobalScript.OnLoad", "Called", Log.Type.Info);
                            try {
                                window.GlobalScript.OnLoad()
                            } catch (e) {
                                iLog("GlobalScript.OnLoad", e, Log.Type.Error, !MP.Tools.EditorEnabled())
                            }
                        }
                        if (customOnLoad && window.CustomScript.OnLoad) {
                            iLog("CustomScript.OnLoad", "Called", Log.Type.Info);
                            try {
                                window.CustomScript.OnLoad()
                            } catch (e) {
                                iLog("CustomScript.OnLoad", e, Log.Type.Error, !MP.Tools.EditorEnabled())
                            }
                            window.CustomScript.OnLoad = null
                        }
                    } catch (e) {
                        iLog("MakeAllCompsDefault", e, Log.Type.Error)
                    }
                },
                LinkRequest: function(e, t, r, o) {
                    try {
                        if (iLog("LinkRequest", "Called"),
                        !e)
                            return;
                        r || Global.ShowProgress(),
                        UpdateSessionFromURL(e);
                        var i = new Request;
                        Utilities.IsObject(o) && (i = $.extend(i, o)),
                        i.requestType = "Link Request",
                        i.id = Communication.SessionID,
                        i.id && (i.data = "preprocess=true"),
                        i.template = e,
                        i.initialRequest = !0,
                        i.onSuccess = function(e) {
                            Global.HideProgress(),
                            UpdateSessionFromXML(e);
                            var r = $(e).find("stingray")
                              , o = r.find("status").text()
                              , n = t || r.find("target").text()
                              , a = r.find("vrmname").text()
                              , s = r.find("html").text();
                            if ("success" == o) {
                                if (iLog("LinkRequest", a + " succeeded", Log.Type.Info),
                                n) {
                                    var l = $("#" + n);
                                    l.html(s),
                                    l.attr("VRMName", a);
                                    var c = $.inArray(a, ["ICONTRAY", "ADMINTABS"]) > -1;
                                    Communication.MakeAllCompsDefault(l, !c, !0, !c),
                                    "middle" == n && EnsureFooterSeparator(l),
                                    Global.Tooltips()
                                }
                                i.done(e)
                            } else {
                                var d = r.find("errorcode").text();
                                d = d || s,
                                iLog("LinkRequest", a + " failed: " + d, Log.Type.Error, !0),
                                i.fail(s, e, a),
                                Global.ShowErrorMessage(s)
                            }
                            ExecuteCallback(e)
                        }
                        ,
                        i.onError = function(e, t) {
                            iLog("LinkRequest", "Failed! " + e, Log.Type.Error, !0),
                            Global.HideProgress(),
                            i.fail(e, t)
                        }
                        ,
                        Communication.ProcessRequest(i)
                    } catch (e) {
                        iLog("LinkRequest", e, Log.Type.Error),
                        Global.HideProgress(),
                        i && i.fail(e.message, e)
                    }
                },
                SerialRequest: function(e, t, r, o, i) {
                    try {
                        iLog("SerialRequest", "Called");
                        var n = ""
                          , a = !1
                          , s = null;
                        if (Utilities.IsString(e)) {
                            var l = ""
                              , c = e;
                            e.indexOf("?") > -1 && (l = e.split("?"),
                            c = l[0],
                            n = l[1],
                            n.beginsWith("&") || (n = "&" + n)),
                            "#" != c.substring(0, 1) && (c = "#" + c),
                            e = $(c)
                        }
                        if (r) {
                            var d = $(r);
                            s = d.attr("name"),
                            a = "true" == d.attr("CauseValidation")
                        }
                        if (a && !Validator.Validate(e))
                            return !1;
                        o || Global.ShowProgress(r);
                        var u = new Request;
                        Utilities.IsObject(i) && (u = $.extend(u, i));
                        var p = $(e).attr("VRMName");
                        p || (p = $("#middle").attr("VRMName")),
                        u.template = p + ".max",
                        u.requestType = "Serial Request",
                        u.id = Communication.SessionID,
                        u.initialRequest = "CALLBACK" != t,
                        s ? u.data = "SubmitAct=" + s + n : u.data = n;
                        var h = Utilities.Serialize($(e));
                        return h.indexOf("=") > -1 && (u.data += u.data ? "&" + h : h),
                        u.onSuccess = function(e) {
                            try {
                                Global.HideProgress(),
                                UpdateSessionFromXML(e);
                                var t = $(e).find("stingray")
                                  , r = t.find("status").text()
                                  , o = t.find("target").text()
                                  , i = t.find("vrmname").text()
                                  , n = t.find("html").text();
                                if ("success" == r) {
                                    if (iLog("SerialRequest", i + " succeeded", Log.Type.Info),
                                    !o || "AdminTabs" == o && MP.Tools.Initialized)
                                        return;
                                    var a = $("#" + o);
                                    a.html(n),
                                    a.attr("VRMName", i);
                                    var s = $.inArray(i, ["ICONTRAY", "ADMINTABS"]) > -1;
                                    if (Communication.MakeAllCompsDefault(a, !s, !0, !s),
                                    "middle" == o && EnsureFooterSeparator(a),
                                    "menu" == o) {
                                        var l = $("#menu").find(">ul").find(">li");
                                        l.hover(function() {
                                            var e = $("<ul><li><a href='#'>test</a></li><li><a href='#'>test</a></li></ul>");
                                            $("menu").append(e),
                                            e.css("position", "absolute"),
                                            e.css("display", "block"),
                                            e.css("top", $(this).offset().top),
                                            e.css("left", $(this).offset().left)
                                        })
                                    }
                                    Global.Tooltips(),
                                    Global.RemoveAllSpellchecks(),
                                    u.done(e)
                                } else {
                                    var c = t.find("errorcode").text();
                                    "0101" != c && (c = c || n,
                                    iLog("SerialRequest", i + " failed: " + c, Log.Type.Error, !0),
                                    u.fail(n, e, i),
                                    Global.ShowErrorMessage(n))
                                }
                                ExecuteCallback(e)
                            } catch (e) {
                                iLog("SerialRequest", e, Log.Type.Error),
                                u.fail(e.message, e, i)
                            }
                        }
                        ,
                        u.onError = function(e, t) {
                            iLog("SerialRequest", "Failed! " + e, Log.Type.Error, !0),
                            Global.HideProgress(),
                            u.fail(e, t)
                        }
                        ,
                        Communication.ProcessRequest(u),
                        !0
                    } catch (e) {
                        iLog("SerialRequest", e, Log.Type.Error),
                        Global.HideProgress(),
                        u && u.fail(e.message, e)
                    }
                },
                OpenWindow: function(e, t, r) {
                    iLog("OpenWindow", e);
                    var o = this.UserLanguage;
                    o && (o = "&csul=" + o);
                    var i = "../../window.htm?id=" + this.SessionID + o + "&template=" + e.replace("?", "&");
                    return this.OpenTab(i, t, r)
                },
                OpenTab: function(e, t, r) {
                    return iLog("OpenTab", e),
                    this.ResetTimeout(),
                    window.open(e, t, r)
                },
                ModalWindow: function(e, t, r, o) {
                    try {
                        iLog("ModalWindow", "Called"),
                        UpdateSessionFromURL(e);
                        var i = new Request;
                        Utilities.IsObject(o) && (i = $.extend(i, o)),
                        i.requestType = "Modal Window Request",
                        i.id = Communication.SessionID,
                        i.data = "preprocess=true",
                        i.template = e,
                        i.onSuccess = function(e) {
                            var o = $(e).find("stingray")
                              , n = o.find("status").text()
                              , a = o.find("vrmname").text()
                              , s = o.find("html").text();
                            if ("success" == n)
                                iLog("ModalWindow", a + " succeeded", Log.Type.Info),
                                Global.ShowMessage(s, r, t),
                                Communication.MakeAllCompsDefault($("#ModalWindow"), !1, !0, !0),
                                Global.Tooltips(),
                                i.done(e);
                            else {
                                var l = o.find("errorcode").text();
                                l = l || s,
                                iLog("ModalWindow", a + " failed: " + l, Log.Type.Error, !0),
                                i.fail(s, e, a),
                                Global.ShowErrorMessage(s)
                            }
                        }
                        ,
                        i.onError = function(e, t) {
                            iLog("ModalWindow", "Failed! " + e, Log.Type.Error, !0),
                            i.fail(e, t)
                        }
                        ,
                        Communication.ProcessRequest(i)
                    } catch (e) {
                        iLog("ModalWindow", e, Log.Type.Error),
                        i && i.fail(e.message, e)
                    }
                },
                CustomRequest: function(e, t, r, o, i) {
                    try {
                        if (iLog("CustomRequest", "Called"),
                        r) {
                            var n = $(r).val();
                            n && (e += e.indexOf("?") == -1 ? "?" : "&",
                            e += "value=" + encodeURIComponent(n))
                        }
                        UpdateSessionFromURL(e);
                        var a = new Request;
                        Utilities.IsObject(i) && (a = $.extend(a, i)),
                        a.requestType = "Custom Request",
                        a.id = Communication.SessionID,
                        a.data = o,
                        a.template = e,
                        a.onSuccess = function(e) {
                            UpdateSessionFromXML(e);
                            var r = $(e).find("stingray")
                              , o = r.find("status").text()
                              , i = r.find("vrmname").text()
                              , n = r.find("html").text();
                            if ("success" == o) {
                                if (iLog("CustomRequest", i + " succeeded", Log.Type.Info),
                                t)
                                    if (Utilities.IsFunction(t))
                                        t(n);
                                    else {
                                        var s = $("#" + t);
                                        s.html(n),
                                        s.change()
                                    }
                                a.done(e)
                            } else {
                                var l = r.find("errorcode").text();
                                l = l || n,
                                iLog("CustomRequest", i + " failed: " + l, Log.Type.Error, !0),
                                a.fail(n, e, i),
                                Global.ShowErrorMessage(n)
                            }
                            ExecuteCallback(e)
                        }
                        ,
                        a.onError = function(e, t) {
                            iLog("CustomRequest", "Failed! " + e, Log.Type.Error, !0),
                            a.fail(e, t)
                        }
                        ,
                        Communication.ProcessRequest(a)
                    } catch (e) {
                        iLog("CustomRequest", e, Log.Type.Error),
                        a && a.fail(e.message, e)
                    }
                }
            }
        } catch (e) {
            iLog("Main", e, Log.Type.Error),
            request && request.fail(e.message, e)
        }
    }
    ;
    return Communication
}),
define("Browser", [], function() {
    var e = new function() {
        function e(e, r, o, i) {
            Log.Add(t + e, r, o, i)
        }
        try {
            var t = "Browser.";
            return {
                IsMSIE: function() {
                    return $.browser.msie || !1
                },
                IsSafari: function() {
                    return $.browser.safari && !/chrome/.test(navigator.userAgent.toLowerCase()) || !1
                },
                IsChrome: function() {
                    return $.browser.safari && /chrome/.test(navigator.userAgent.toLowerCase()) || !1
                },
                IsFirefox: function() {
                    return $.browser.mozilla || !1
                },
                IsValidBrowser: function() {
                    return !0
                },
                DetectExplorer: function() {
                    return navigator.userAgent
                },
                ParseURL: function(e) {
                    e = e || window.location.href;
                    var t, r, o, i = document.createElement("a"), n = {};
                    for (i.href = e,
                    t = i.search.replace(/^\?/, "").split("&"),
                    o = 0; o < t.length; o++)
                        r = t[o].split("="),
                        n[r[0].toLowerCase()] = r[1];
                    return {
                        protocol: i.protocol,
                        host: i.host,
                        hostname: i.hostname,
                        port: i.port,
                        pathname: i.pathname,
                        search: i.search,
                        searchObject: n,
                        hash: i.hash
                    }
                }
            }
        } catch (t) {
            e("Main", t, Log.Type.Error)
        }
    }
    ;
    return window.IsMSIE = e.IsMSIE,
    window.IsSafari = e.IsSafari,
    window.IsChrome = e.IsChrome,
    window.IsFirefox = e.IsFirefox,
    window.IsValidBrowser = e.IsValidBrowser,
    window.DetectExplorer = e.DetectExplorer,
    e
}),
define("PropertyFieldData", ["PropertyFields"], function(e) {
    var t = function(t, r) {
        "string" == typeof t && (t = e[t]),
        this.propertyField = t,
        this.options = r
    };
    return t.prototype.get = function() {
        return (this.options.getter || $.noop)()
    }
    ,
    t.prototype.set = function(e) {
        (this.options.setter || $.noop)(e)
    }
    ,
    t.prototype.isDisabled = function() {
        return !this.options.setter
    }
    ,
    t.prototype.language = function() {
        return this.propertyField.language
    }
    ,
    t.prototype.allowsLiveEditing = function() {
        return "undefined" != typeof this.propertyField.live && this.propertyField.live
    }
    ,
    t
}),
define("TokenTooltip", [], function() {
    if (window.ace) {
        var e, t = ace.require("ace/lib/dom"), r = ace.require("ace/lib/event"), o = ace.require("ace/range").Range, i = function(t) {
            t.tokenTooltip || (t.tokenTooltip = this,
            this.editor = t,
            t.tooltip = e || this.$init(),
            this.update = this.update.bind(this),
            this.onMouseMove = this.onMouseMove.bind(this),
            this.onMouseOut = this.onMouseOut.bind(this),
            r.addListener(t.renderer.scroller, "mousemove", this.onMouseMove),
            r.addListener(t.renderer.content, "mouseout", this.onMouseOut))
        };
        return function() {
            this.token = {},
            this.range = new o,
            this.update = function() {
                this.$timer = null;
                var t = this.editor.renderer;
                this.lastT - (t.timeStamp || 0) > 1e3 && (t.rect = null,
                t.timeStamp = this.lastT,
                this.maxHeight = innerHeight,
                this.maxWidth = innerWidth);
                var r = t.rect || (t.rect = t.scroller.getBoundingClientRect())
                  , i = (this.x + t.scrollLeft - r.left - t.$padding) / t.characterWidth
                  , n = Math.floor((this.y + t.scrollTop - r.top) / t.lineHeight)
                  , a = Math.round(i)
                  , s = {
                    row: n,
                    column: a,
                    side: i - a > 0 ? 1 : -1
                }
                  , l = this.editor.session
                  , c = l.screenToDocumentPosition(s.row, s.column)
                  , d = l.getTokenAt(c.row, c.column);
                if (d || l.getLine(c.row) || (d = {
                    type: "",
                    value: "",
                    state: l.bgTokenizer.getState(0)
                }),
                !d)
                    return l.removeMarker(this.marker),
                    e.style.display = "none",
                    void (this.isOpen = !1);
                this.isOpen || (e.style.display = "",
                this.isOpen = !0);
                var u = d.type;
                d.state && (u += "|" + d.state),
                d.merge && (u += "\n  merge"),
                d.stateTransitions && (u += "\n  " + d.stateTransitions.join("\n  ")),
                this.tokenText != u && (e.textContent = u,
                this.tooltipWidth = e.offsetWidth,
                this.tooltipHeight = e.offsetHeight,
                this.tokenText = u),
                this.updateTooltipPosition(this.x, this.y),
                this.token = d,
                l.removeMarker(this.marker),
                this.range = new o(c.row,d.start,c.row,d.start + d.value.length),
                this.marker = l.addMarker(this.range, "ace_bracket", "text")
            }
            ,
            this.onMouseMove = function(e) {
                this.x = e.clientX,
                this.y = e.clientY,
                this.isOpen && (this.lastT = e.timeStamp,
                this.updateTooltipPosition(this.x, this.y)),
                this.$timer || (this.$timer = setTimeout(this.update, 100))
            }
            ,
            this.onMouseOut = function(t) {
                for (var r = t && t.relatedTarget, o = t && t.currentTarget; r && (r = r.parentNode); )
                    if (r == o)
                        return;
                e.style.display = "none",
                this.editor.session.removeMarker(this.marker),
                this.$timer = clearTimeout(this.$timer),
                this.isOpen = !1
            }
            ,
            this.updateTooltipPosition = function(t, r) {
                var o = e.style;
                t + 10 + this.tooltipWidth > this.maxWidth && (t = innerWidth - this.tooltipWidth - 10),
                (r > .75 * innerHeight || r + 20 + this.tooltipHeight > this.maxHeight) && (r = r - this.tooltipHeight - 30),
                o.left = t + 10 + "px",
                o.top = r + 20 + "px"
            }
            ,
            this.$init = function() {
                e = document.documentElement.appendChild(t.createElement("div"));
                var r = e.style;
                return r.position = "fixed",
                r.display = "none",
                r.background = "lightyellow",
                r.borderRadius = "",
                r.border = "1px solid gray",
                r.padding = "1px",
                r.zIndex = 2001,
                r.fontFamily = "monospace",
                r.whiteSpace = "pre-line",
                e
            }
            ,
            this.destroy = function() {
                this.onMouseOut(),
                r.removeListener(this.editor.renderer.scroller, "mousemove", this.onMouseMove),
                r.removeListener(this.editor.renderer.content, "mouseout", this.onMouseOut),
                delete this.editor.tokenTooltip
            }
        }
        .call(i.prototype),
        i
    }
}),
define("PropertyEditorFactory", ["PropertyFieldData", "TokenTooltip"], function(e, t) {
    var r = []
      , o = {
        small: {
            width: 100
        },
        medium: {
            width: 250,
            height: "1.3em"
        },
        wide: {
            width: "96%",
            height: "1.3em"
        },
        large: {
            width: "96%",
            height: "15em"
        }
    }
      , i = {
        DestroyAceEditors: function() {
            $.each(r, function(e, t) {
                t.destroy(),
                t = null
            }),
            r = []
        },
        ResizeAceEditors: function() {
            var e = 0
              , t = -1;
            if ($.each(r, function(r, o) {
                var i = $(o.container);
                i.position().top > e && (e = i.position().top,
                t = r)
            }),
            t != -1) {
                $.each(r, function(e, t) {
                    var r = $(t.container);
                    r.height(200)
                });
                var o = r[t]
                  , i = $(o.container)
                  , n = i.parents("#PropertyDlg")
                  , a = i.parents(".PropertyEditorTable")
                  , s = n.height()
                  , l = a.height();
                s > l && i.height(s - l + 200),
                $.each(r, function(e, t) {
                    t.resize()
                })
            }
        },
        create: function(e) {
            var t = e.propertyField.type
              , r = i[t];
            if ("create" === t || "function" != typeof r)
                throw new Error("Bad property type: " + t);
            var o = r(e);
            return o.refresh(),
            o
        },
        text: function(e) {
            var t = e.propertyField.sizeHint;
            Object.prototype.hasOwnProperty.call(o, t) || (t = "medium");
            var n = $('<div class="noWrap"/>')
              , a = null
              , s = null;
            if ("large" === t && MP.Tools.AceEnabled())
                a = $("<div/>").appendTo(n),
                s = Global.ConvertToAceEditor(a, {
                    language: e.language()
                }),
                s && r.push(s);
            else {
                var l = "small" !== t;
                a = l ? $('<textarea class="ace_textarea"/>') : $('<input type="text"/>'),
                a.attr("name", e.propertyField.name || "").attr("title", e.propertyField.description || "").attr("disabled", e.isDisabled() ? "disabled" : "").css(o[t]).appendTo(n),
                l && MP.Tools.AceEnabled() && $("<div/>").attr("title", "Switch to advanced editor").addClass("ace_resize").appendTo(n).bind("click", function() {
                    $(this).hide(),
                    s = Global.ConvertToAceEditor(a, {
                        language: e.language(),
                        focus: !0
                    }),
                    s && r.push(s),
                    i.ResizeAceEditors()
                })
            }
            return refresh = function() {
                var t = e.get();
                s ? s.setValue(t, -1) : a.val(t)
            }
            ,
            save = function() {
                var t;
                t = s ? s.getValue() : a.val(),
                e.set(t)
            }
            ,
            e.allowsLiveEditing() && a.bind("keyup change", save),
            {
                $element: n,
                refresh: refresh,
                save: save
            }
        },
        multi: function(t) {
            var o = t.propertyField.data;
            if (!o)
                throw new Error("Property is missing spec: " + (t.propertyField.name || t.propertyField.label));
            var n = $("<table/>")
              , a = $("<thead/>").appendTo(n)
              , s = $("<tbody/>").appendTo(n)
              , l = $("<tfoot/>").appendTo(n)
              , c = $("<tr/>").appendTo(a);
            $.each(o, function(e, t) {
                $("<th/>").text(t.label).appendTo(c)
            });
            var d = []
              , u = []
              , p = function(t, r) {
                var o = new e(t,{
                    getter: function() {
                        return r[t.name]
                    },
                    setter: function(e) {
                        r[t.name] = e
                    }
                })
                  , n = i.create(o);
                return u.push({
                    item: r,
                    editor: n
                }),
                $("<td/>").append(n.$element)
            }
              , h = function(e) {
                var r, i = $("<tr/>");
                $.each(o, function(t, o) {
                    r = p(o, e).appendTo(i)
                }),
                r.css("width", "100%");
                var n = $('<td class="propertyBtns"/>').appendTo(i);
                $('<div class="deletePropertyBtn" title="Delete"/>').bind("click", function() {
                    jConfirm("Are you sure you want to delete this property?", "Confirm Delete", function(r) {
                        if (r) {
                            var o = $.inArray(e, d);
                            d.splice(o, 1),
                            $.each(u, function(t, r) {
                                r && r.item === e && (u[t] = null)
                            }),
                            u = $.grep(u, function(e) {
                                return null != e
                            });
                            var n = t.options.args.DeleteParam || $.noop;
                            n(o),
                            i.remove()
                        }
                    }, {
                        okButton: "Yes",
                        cancelButton: "No"
                    })
                }).appendTo(n);
                var a = r.find("div.ace_resize");
                return a.length && $(a).detach().appendTo(n),
                i
            }
              , f = function(e) {
                var r = e || {};
                d.push(r);
                var o = t.options.args.AddParam || $.noop;
                o(),
                h(r).appendTo(s)
            }
              , g = $("<tr/>").appendTo(l)
              , m = $("<td/>").attr("colspan", o.length + 1).appendTo(g);
            $('<img src="../../images/param-add.png" title="Add new" class="paramActions"/>').click(f).appendTo(m),
            "Set Query Parameters" == t.propertyField.description && MP.Tools.AceEnabled() && ($('<img src="../../images/param-link.png" title="Generate query parameters" class="paramActions"/>').click(function() {
                var e = r[0].getValue()
                  , t = e.match(/:(\w+)/g)
                  , o = C()
                  , i = 0;
                $.each(t, function(e, t) {
                    for (var r = t.replace(":", ""), n = r.toUpperCase(), a = !1, e = 0; e < o.length; e++)
                        if (o[e].Name.toUpperCase() == n) {
                            a = !0;
                            break
                        }
                    if (!a) {
                        var s = {
                            Name: r,
                            Type: "STRING",
                            Value: "#S" + r + "#"
                        };
                        f(s),
                        i++
                    }
                }),
                i && (e = 1 == i ? " parameter was" : " parameters were",
                jAlert(i + e + " added. Please verify their Types and Values are correct."))
            }).appendTo(m),
            $('<img src="../../images/query-validate.png" title="Validate query" class="paramActions"/>').click(function() {
                for (var e = C(), t = "", o = 0; o < e.length; o++)
                    t = t + "," + e[o].Name + "=" + e[o].Type;
                t = "&params=" + encodeURIComponent(t.substring(1));
                var i = "&query=" + encodeURIComponent(r[0].getValue())
                  , n = "admintabs.max?action=ValidateQuery"
                  , a = function(e) {
                    var t = {
                        Close: function() {
                            $(this).dialog("close")
                        }
                    };
                    Global.ShowMessage(e, 600, "Query Validator", null, t)
                };
                Communication.CustomRequest(n, a, null, i + t)
            }).appendTo(m));
            var y = function() {
                d = $.extend(!0, [], t.get()),
                u = [],
                s.empty(),
                $.each(d, function(e, t) {
                    h(t).appendTo(s)
                })
            }
              , C = function() {
                $.each(u, function(e, t) {
                    t && t.editor && t.editor.save()
                });
                var e = $.grep(d, function(e) {
                    return null !== e;
                });
                return e
            }
              , v = function() {
                var e = C();
                t.set(e)
            };
            return {
                $element: n,
                refresh: y,
                save: v
            }
        },
        checkbox: function(e) {
            var t = $("<input/>").attr("title", e.propertyField.description || "").attr("type", "checkbox")
              , r = function() {
                setTimeout(function() {
                    t.attr("checked", e.get() ? "checked" : "")
                }, 0)
            }
              , o = function() {
                e.set(t.is(":checked"))
            };
            return e.allowsLiveEditing() && t.bind("change", function() {
                o()
            }),
            {
                $element: t,
                refresh: r,
                save: o
            }
        },
        select: function(e) {
            var t = $("<select/>").attr("title", e.propertyField.description || "").append(Utilities.ConvertToOptions(e.propertyField.data || []));
            e.propertyField.onClick && t.bind("click", e.propertyField.onClick);
            var r = function() {
                t.val(e.get())
            }
              , o = function() {
                e.set(t.val())
            };
            return e.allowsLiveEditing() && t.bind("keydown keyup keypress change", function() {
                o()
            }),
            {
                $element: t,
                refresh: r,
                save: o
            }
        },
        csf: function(e) {
            var t = MP.Tools.Config.ScriptFunctions
              , n = $("<div/>")
              , a = []
              , s = []
              , l = []
              , c = 0
              , d = function(e) {
                if (s instanceof Array) {
                    var t = $.grep(s, function(t) {
                        return t.Name == e
                    });
                    return t.length > 0 ? t[0].Value : ""
                }
                return ""
            }
              , u = function(e) {
                return $.inArray(e.cat, ["record", "object", "array"]) > -1 ? "large" : "wide"
            }
              , p = function(e, t) {
                var s = $("<p/>").appendTo(n);
                e.value = d(e.name),
                s.append("<label>" + t + "</label></br>"),
                c++;
                var l = {
                    ID: "csf-" + e.name + "-" + c.toString(),
                    Name: e.name,
                    Value: e.value,
                    Input: null,
                    Language: ""
                };
                if (a.push(l),
                "procedure" != e.cat) {
                    var p = u(e)
                      , h = "large" == p;
                    if (h)
                        var f = $('<textarea class="ace_textarea"/>');
                    else
                        var f = $('<input type="text" class="ace_input"/>');
                    f.attr("id", l.ID).attr("title", e.label || "").val(e.value).css(o[p]).appendTo(s),
                    l.Input = f,
                    MP.Tools.AceEnabled() && $("<div/>").attr("title", "Switch to advanced editor").addClass("ace_resize").appendTo(s).bind("click", function() {
                        $(this).hide();
                        var e = Global.ConvertToAceEditor(f, {
                            language: l.Language,
                            focus: !0
                        });
                        e && (r.push(e),
                        l.Input = e,
                        i.ResizeAceEditors())
                    })
                }
            }
              , h = function() {
                n.find("p").remove(),
                a = [],
                c = 0
            }
              , f = function() {
                $.each(a, function(e, t) {
                    t.Input && t.Input.getValue ? t.Value = t.Input.getValue() : t.Value = $("#" + t.ID).val()
                })
            }
              , g = function(e) {
                try {
                    e = e || s[0].Name;
                    var r = null;
                    if ($.each(t, function(t, o) {
                        if (o.name == e)
                            return void (r = o)
                    }),
                    !r)
                        throw "Unknown function " + e + "!";
                    h(),
                    y.val(e);
                    var o = r.type ? "<br><br>return: " + r.type + ";" : "";
                    p(r, r.def + "<br><br>" + r.label + o),
                    s.splice(0, 1),
                    $.each(r.params, function(e, t) {
                        p(t, t.pass + " " + t.name + ": " + t.type + ";")
                    })
                } catch (e) {
                    iLog("makePropertis", e, Log.Type.Error)
                }
            }
              , m = function() {
                var e = function(e) {
                    return $("<option/>").attr("value", e.name).attr("title", e.def + "\n\n" + e.label).text(e.name)
                }
                  , r = $([]);
                return $.each(t, function(t, o) {
                    "0" != o.gear && (r = r.add(e(o)))
                }),
                r
            }
              , y = $("<select/>").attr("title", e.propertyField.description || "").append(m()).appendTo(n).change(function() {
                s = $.extend(!0, [], l),
                g($(this).val())
            });
            Utilities.SortSelect(y);
            var C = function() {
                s = $.extend(!0, [], e.get()),
                l = $.extend(!0, [], s),
                g()
            }
              , v = function() {
                f(),
                e.set(a)
            };
            return e.allowsLiveEditing() && y.bind("keydown keyup keypress change", function() {
                v()
            }),
            {
                $element: n,
                refresh: C,
                save: v
            }
        }
    };
    return i
}),
define("RuleXML", ["RuleStorage"], function(e) {
    var t = new function() {
        function r(e, t, r, i) {
            Log.Add(o + e, t, r, i)
        }
        var o = "RuleXML."
          , i = null;
        return {
            CurrentProcess: "",
            AddComponent: function(e) {
                try {
                    r("AddComponent", "Called"),
                    i.find(this.CurrentProcess).append(e)
                } catch (e) {
                    r("AddComponent", e, Log.Type.Error)
                }
            },
            AppendXML: function(e) {
                try {
                    var t = i.find(this.CurrentProcess);
                    t.append(e)
                } catch (e) {
                    r("AppendXML", e, Log.Type.Error)
                }
            },
            GetComponent: function(e) {
                try {
                    "number" != typeof e && (e = parseInt(e, 10));
                    var t = "";
                    return i.find(this.CurrentProcess + ">c").each(function() {
                        parseInt($(this).find(">n").text(), 10) == e && (t = Utilities.GetXmlString(this))
                    }),
                    t
                } catch (e) {
                    r("GetComponent", e, Log.Type.Error)
                }
            },
            DeleteComponent: function(e) {
                try {
                    r("DeleteComponent", "Called");
                    var t = null;
                    i.find(this.CurrentProcess + ">c").each(function() {
                        $(this).find(">n").text() == e && (t = this),
                        $(this).find("j").each(function() {
                            $(this).text() == e && $(this).text("")
                        })
                    }),
                    null != t && t.parentNode.removeChild(t)
                } catch (e) {
                    r("DeleteComponent", e, Log.Type.Error)
                }
            },
            Load: function(e) {
                r("Load", "Called"),
                e && (i = $(e))
            },
            GetFromComponent: function(t) {
                try {
                    "number" != typeof t && (t = parseInt(t, 10));
                    var o = null;
                    return i.find(this.CurrentProcess + ">c").each(function() {
                        var r = parseInt($(this).find("n").text(), 10);
                        $(this).find("j").each(function() {
                            var i = $(this).text();
                            i == t.toString() && (o = e.GetComponent(r))
                        })
                    }),
                    o
                } catch (e) {
                    r("GetFromComponent", e, Log.Type.Error)
                }
            },
            GetNewElement: function(e) {
                try {
                    return i.context.createElement(e)
                } catch (e) {
                    r("GetNewElement", e, Log.Type.Error)
                }
            },
            GetNewCDATA: function(e) {
                try {
                    return e = e || "",
                    i.context.createCDATASection(e)
                } catch (e) {
                    r("GetNewCDATA", e, Log.Type.Error)
                }
            },
            ReplaceCDATA: function(e, o) {
                try {
                    var i = $(e)[0].parentNode
                      , n = $(e)[0].nodeName
                      , a = t.GetNewCDATA(o)
                      , s = t.GetNewElement(n);
                    $(s).append(a),
                    i.replaceChild(s, $(e)[0])
                } catch (e) {
                    r("ReplaceCDATA", e, Log.Type.Error)
                }
            },
            FindFirstAvailableID: function() {
                try {
                    var t, o = -1;
                    do
                        o++,
                        t = e.GetComponent(o);
                    while (t);return o
                } catch (e) {
                    r("FindFirstAvailableID", e, Log.Type.Error)
                }
            },
            FindLastAvailableID: function() {
                try {
                    for (var t = e.GetIdArray(!0), o = -1, i = 0; i < t.length; i++)
                        t[i] > o && (o = t[i]);
                    return ++o
                } catch (e) {
                    r("FindLastAvailableID", e, Log.Type.Error)
                }
            },
            GetFunctionXML: function() {
                try {
                    return i.find("function")
                } catch (e) {
                    r("GetFunctionXML", e, Log.Type.Error)
                }
            },
            GetProcessXML: function() {
                try {
                    return i.find(this.CurrentProcess)
                } catch (e) {
                    r("GetProcessXML", e, Log.Type.Error)
                }
            },
            SetProcessXML: function(e) {
                try {
                    i.find(this.CurrentProcess).replaceWith($(e))
                } catch (e) {
                    r("SetProcessXML", e, Log.Type.Error)
                }
            }
        }
    }
    ;
    return t
}),
define("ContextMenuItems", [], function() {
    function e() {
        function e(e) {
            var t = e.find(">ul");
            return 0 == t.length && (t = $("<ul/>")),
            e.append(t),
            t
        }
        var t = $("<ul/>");
        this.Add = function(r, o, i) {
            var n = $("<li/>");
            if (n.text(r),
            o && n.click(o),
            i) {
                var a = e(i);
                a.append(n)
            } else
                t.append(n);
            return n
        }
        ,
        this.GetHTML = function() {
            return t
        }
    }
    return e
}),
define("ContextMenu", ["Storage"], function(e) {
    var t = new function() {
        function r(e, t, r, o) {
            Log.Add(a + e, t, r, o)
        }
        function o(e, r, o) {
            var i = o
              , n = e
              , a = r;
            this.Name = function() {
                return i
            }
            ,
            this.Attach = function() {
                $(n).each(function() {
                    this.oncontextmenu = function(e) {
                        return t.Show(a, e || window.event, i),
                        !1
                    }
                })
            }
            ,
            this.Detach = function() {
                $(n).each(function() {
                    this.oncontextmenu = null
                })
            }
        }
        function i(e) {
            e = $(e);
            var r = e.attr("ref")
              , o = [];
            switch (t.ActiveEditor) {
            case "html":
                o = ["EditableContent", "StaticContainer", "DynamicContainer"];
                break;
            case "bootstrap":
                o = ["bootstrapContent", "container", "row", "column", "div", "panel"];
                break;
            default:
                return $("#" + t.ActiveEditor)
            }
            if ($.inArray(r, o) > -1)
                return e;
            for (var i = e.parents("[ref]"), n = 0; n < i.length; n++)
                if (e = $(i[n]),
                r = e.attr("ref"),
                $.inArray(r, o) > -1)
                    return e;
            return $("[ref=bootstrapContent]")
        }
        var n, a = "ContMenu.", s = new e("Menu"), l = $("<div class='contextMenu'></div>"), c = !1;
        return {
            Initialized: !1,
            Enabled: !0,
            EventComponent: null,
            ActiveEditor: "",
            ActiveBox: $(),
            OffsetX: 0,
            OffsetY: 0,
            ScrollX: 0,
            ScrollY: 0,
            ClientX: 0,
            ClientY: 0,
            Initialize: function() {
                try {
                    if (this.Initialized)
                        return;
                    r("Initialize", "Called"),
                    n = "ui-activeBox",
                    $("body").append(l),
                    $("body").bind("click.contextMenu", function() {
                        t.Hide()
                    }),
                    this.Initialized = !0
                } catch (e) {
                    r("Initialize", e, Log.Type.Error)
                }
            },
            Add: function(e, t, i) {
                try {
                    r("Add", "Called"),
                    i = i || e;
                    var n = new o(e,t,i);
                    s.AddComponent(n, i),
                    n.Attach()
                } catch (e) {
                    r("Add", e, Log.Type.Error)
                }
            },
            Refresh: function() {
                try {
                    r("Refresh", "Called");
                    for (var e = s.GetItemArray(), t = 0; t < e.length; t++) {
                        var o = e[t];
                        o.Attach()
                    }
                } catch (e) {
                    r("Refresh", e, Log.Type.Error)
                }
            },
            Remove: function(e) {
                try {
                    r("Remove", "Called");
                    var t = s.GetComponent(e);
                    t && (t.Detach(),
                    s.Remove(e))
                } catch (e) {
                    r("Remove", e, Log.Type.Error)
                }
            },
            RemoveAll: function() {
                try {
                    r("RemoveAll", "Called");
                    for (var e = s.GetItemArray(), t = 0; t < e.length; t++) {
                        var o = e[t];
                        o.Detach()
                    }
                    s.Reset()
                } catch (e) {
                    r("RemoveAll", e, Log.Type.Error)
                }
            },
            Detach: function(e) {
                try {
                    r("Detach", "Called");
                    var t = s.GetComponent(e);
                    t && t.Detach()
                } catch (e) {
                    r("Remove", e, Log.Type.Error)
                }
            },
            DetachAll: function() {
                try {
                    r("DetachAll", "Called");
                    for (var e = s.GetItemArray(), t = 0; t < e.length; t++) {
                        var o = e[t];
                        o.Detach()
                    }
                } catch (e) {
                    r("DetachAll", e, Log.Type.Error)
                }
            },
            Attach: function(e) {
                try {
                    r("Attach", "Called");
                    var t = s.GetComponent(e);
                    t && t.Attach()
                } catch (e) {
                    r("Remove", e, Log.Type.Error)
                }
            },
            AttachAll: function() {
                try {
                    r("AttachAll", "Called");
                    for (var e = s.GetItemArray(), t = 0; t < e.length; t++) {
                        var o = e[t];
                        o.Attach()
                    }
                } catch (e) {
                    r("AttachAll", e, Log.Type.Error)
                }
            },
            Hide: function() {
                c && (r("Hide", "Called"),
                l.css("display", "none"),
                c = !1)
            },
            Show: function(e, t, o) {
                try {
                    this.Hide(),
                    r("Show", "Called");
                    var i = e();
                    return null != i && (this.UpdatePossition(t, o),
                    !!this.Enabled && (l.css("left", this.ClientX + this.ScrollX + "px"),
                    l.css("top", this.ClientY + this.ScrollY + "px"),
                    l.html(i),
                    l.css("display", "block"),
                    c = !0,
                    !0))
                } catch (e) {
                    r("Show", e, Log.Type.Error)
                }
            },
            UpdatePossition: function(e, t) {
                var r = e || window.event;
                this.ScrollX = document.body.scrollLeft || document.documentElement.scrollLeft,
                this.ScrollY = document.body.scrollTop || document.documentElement.scrollTop,
                this.ClientX = r.clientX,
                this.ClientY = r.clientY,
                t && (this.ActiveEditor = t);
                var o = r.target || r.srcElement;
                if (o != this.EventComponent && (this.ActiveBox.toggleClass(n, !1),
                this.EventComponent = o,
                this.ActiveBox = i(o),
                this.ActiveBox.toggleClass(n, !0)),
                r.offsetX && r.offsetY)
                    this.OffsetX = r.offsetX,
                    this.OffsetY = r.offsetY;
                else {
                    var a = $(this.EventComponent).offset();
                    this.OffsetX = Utilities.ToNumber(r.pageX - a.left),
                    this.OffsetY = Utilities.ToNumber(r.pageY - a.top)
                }
            },
            UpdateActiveEditor: function(e) {
                this.ClientX = 100,
                this.ClientY = 100,
                this.ActiveEditor = e || "preproc",
                this.ActiveBox.toggleClass(n, !1),
                this.ActiveBox = $("#" + this.ActiveEditor),
                this.ActiveBox.toggleClass(n, !0),
                this.EventComponent = this.ActiveBox[0]
            }
        }
    }
    ;
    return t
}),
define("PropertyEd", ["PropertyEditorFactory", "PropertyFieldData", "Communication", "Editor"], function(e, t, r, o) {
    var i = function(t) {
        this.reset(),
        this._div = $('<div id="PropertyDlg"/>'),
        this._table = $("<table/>").appendTo(this._div).addClass("PropertyEditorTable");
        var r, o = this, i = function() {
            r || (r = MP.Tools.Config.Editor.property)
        }, n = function(e) {
            e == t ? r.pinned = !r.pinned : r.pinned = e,
            a(),
            r.pinned ? $(window).bind("scroll.pinPropertyDiv", function() {
                var e = o._div.parent();
                e.is(":visible") && e.css("top", o._div.data("lastTop") + $(document).scrollTop() + "px")
            }) : $(window).unbind("scroll.pinPropertyDiv")
        }, a = function() {
            var e = $(".ui-dialog-buttonpane", o._div.parent())
              , t = function(t) {
                return $("button:contains(" + t + ")", e)
            };
            r.pinned ? t("Pin").html("Unpin") : t("Unpin").html("Pin")
        }, s = {
            Cancel: function() {
                o.revertAndClose()
            },
            Delete: function() {
                o.saveAndClose(),
                o.deleteCallback && o.deleteCallback.call(null)
            },
            Pin: function() {
                n()
            }
        };
        this._div.dialog({
            minWidth: 470,
            minHeight: 250,
            width: 650,
            autoOpen: !1,
            closeOnEscape: !0,
            modal: !1,
            buttons: s,
            resizeStart: function() {
                Global.DisableHighlightingInChrome(!0)
            },
            resizeStop: function() {
                Global.DisableHighlightingInChrome(!1),
                e.ResizeAceEditors()
            },
            dragStart: function() {
                Global.DisableHighlightingInChrome(!0)
            },
            dragStop: function(e, t) {
                Global.DisableHighlightingInChrome(!1),
                Global.UpdateLastPosition(o._div, t)
            },
            open: function(e, t) {
                a(),
                o._div.data("lastLeft") && o._div.data("lastTop") ? o._div.dialog("option", {
                    position: [o._div.data("lastLeft"), o._div.data("lastTop")]
                }) : Global.UpdateLastPosition(o._div, t)
            },
            close: function() {
                o.save(),
                o.reset()
            }
        }),
        i(),
        n(r.pinned || !1)
    };
    return i.prototype.iLog = function(e, t, r, o) {
        Log.Add("PropEditor.P." + e, t, r, o)
    }
    ,
    i.prototype.reset = function() {
        this.iLog("Reset", "Called"),
        this.editors = [],
        this.properties = [],
        this.originalValues = [],
        e.DestroyAceEditors()
    }
    ,
    i.prototype.show = function(t, r, o) {
        this.iLog("Show", "Called"),
        this.reset(),
        this.properties = t.slice(0),
        this.deleteCallback = r;
        var i = this
          , n = this._table.empty()
          , a = $("<tbody/>").appendTo(n)
          , s = this.editors = $.map(this.properties, function(t) {
            return e.create(t)
        });
        this.originalValues = function(e) {
            var t = [];
            return $.each(e, function(e, r) {
                t.push(r.get())
            }),
            t
        }(t),
        $.each(this.properties, function(e, t) {
            var r = t.propertyField
              , o = $("<th/>").text(r.label).addClass("PropertyEditorName")
              , i = $("<td/>").append(s[e].$element).addClass("PropertyEditorValue");
            if (s[e].$element.attr("title").match(/The name of the component/g)) {
                var n = s[e].$element;
                $(n).bind("focus", function() {
                    $(this).attr("oldname", $(this).val())
                }),
                $(n).bind("change", function() {
                    var e = $(this);
                    if (!e.val())
                        return e.val(e.attr("oldname")),
                        jAlert("Component name cannot be blank!", "Name Warning", function() {
                            e.focus(),
                            e.select()
                        }),
                        !1;
                    var t = [];
                    if ($('input[type!="radio"]').each(function() {
                        $(this).attr("id") && t.push($(this).attr("id"))
                    }),
                    $("select").each(function() {
                        $(this).attr("id") && t.push($(this).attr("id"))
                    }),
                    $.inArray(e.val(), t) > -1) {
                        var r = e.val();
                        return e.val(e.attr("oldname")),
                        jAlert("Component of name <b>" + r + "</b> already exists!<br>Please eneter another name.", "Name Warning", function() {
                            e.focus(),
                            e.select()
                        }),
                        !1
                    }
                })
            }
            i.find("textarea").removeAttr("disabled"),
            $("<tr/>").append(o, i).appendTo(a)
        });
        var l = i._div;
        l.dialog("option", "title", o || "Editor"),
        l.dialog("open");
        var c = $(window)
          , d = c.scrollTop()
          , u = d + c.height()
          , p = l.offset().top
          , h = p + l.height();
        (p < d || h > u) && l.dialog("option", "position", ["center", "center"]),
        e.ResizeAceEditors()
    }
    ,
    i.prototype.save = function() {
        if (0 != this.editors.length) {
            this.iLog("Save", "Called"),
            $(this.editors).each(function(e, t) {
                t.save()
            });
            var e = RulesMaker.GetCurrentComponent();
            e && e.UpdateWatchpoint()
        }
    }
    ,
    i.prototype.revertAndClose = function() {
        this.iLog("RevertAndClose", "Called"),
        this.revertChanges(),
        this.saveAndClose()
    }
    ,
    i.prototype.saveAndClose = function() {
        this.iLog("SaveAndClose", "Called"),
        this._div.dialog("close")
    }
    ,
    i.prototype.revertChanges = function() {
        this.iLog("RevertChanges", "Called");
        var e = this.originalValues;
        $(this.properties).each(function(t, r) {
            r.set(e[t])
        }),
        $(this.editors).each(function(e, t) {
            t.refresh()
        })
    }
    ,
    i.iLog = function(e, t, r, o) {
        Log.Add("PropEditor." + e, t, r, o)
    }
    ,
    i.Property = function(e, r, o, i) {
        return new t(e,{
            getter: r,
            setter: o,
            args: i
        })
    }
    ,
    i.GetInstance = function() {
        var e;
        return this.editor ? (e = this.editor,
        e.save()) : (e = new i,
        this.editor = e),
        e
    }
    ,
    i.Show = function() {
        this.iLog("Show", "Called");
        var e = this.GetInstance();
        return e.show.apply(e, arguments),
        e
    }
    ,
    i.Hide = function() {
        var e = this.GetInstance();
        return e.saveAndClose(),
        e
    }
    ,
    i.Close = function() {
        this.iLog("Close", "Called"),
        o.LockedBy ? r.CloseEditor() : jConfirm("Are you sure you want to exit without saving?", "Confirm Exit", function(e) {
            e && r.CloseEditor()
        })
    }
    ,
    i.Save = function() {
        !o.Enabled || o.LockedBy || Global.InProgress() || (this.iLog("Save", "Called"),
        r.EditorUpdate(!1))
    }
    ,
    i.QuickSave = function() {
        !o.Enabled || o.LockedBy || Global.InProgress() || (this.iLog("QuickSave", "Called"),
        r.EditorUpdate(!0))
    }
    ,
    i
}),
define("Global", ["Editor", "ReqList", "Log", "PageHelper"], function(e, t, r, o) {
    var i = new function() {
        function e(e, t, o, i) {
            r.Add(n + e, t, o, i)
        }
        function t(e, t) {
            if (e && e.selectorText) {
                if (Utilities.IsObject(t))
                    var r = t;
                else
                    var r = $.parseJSON(t);
                var o = e.selectorText.toLowerCase().replace(/'/g, '"')
                  , i = e.style;
                switch (o) {
                case "body":
                    i.backgroundColor = r.BodyBackground;
                    break;
                case "h1, h2, h3":
                case "h1":
                case "h2":
                case "h3":
                    i.color = r.HTagColor;
                    break;
                case "a":
                case "a:visited":
                case "a, a:visited":
                case ".validationerrors li":
                    i.color = r.Anchor;
                    break;
                case "a:hover":
                case ".validationerrors li:hover":
                    i.color = r.AnchorHover;
                    break;
                case ".sdata":
                case ".sheader":
                case "#shell":
                    i.backgroundColor = r.Shell;
                    break;
                case "#bottom":
                    i.backgroundColor = r.FootColor;
                    break;
                case ".required":
                    i.color = r.Required;
                    break;
                case ".notrequired":
                    i.color = r.NotRequired;
                    break;
                case "input, select, textarea":
                case ".editortext span":
                case ".editormemospan":
                case ".memospelldiv":
                    i.backgroundColor = r.InputBackground;
                    break;
                case 'input[type="button"]':
                    i.backgroundColor = r.ButtonBackground;
                    break;
                case ".staticcontainer h3, .dynamiccontainer h3, .validationcontainer h3, .scriptingcontainer h3":
                case ".staticcontainer h3":
                case ".dynamiccontainer h3":
                case ".validationcontainer h3":
                case ".scriptingcontainer h3":
                    i.color = r.ContainerHeadTextColor,
                    i.backgroundColor = r.ContainerHeadBackgroundColor;
                    break;
                case ".editorlabel label.pagetitle":
                    i.color = r.PageTitle;
                    break;
                case ".tablemaster tr":
                case ".tablemastersm tr":
                case ".ac_odd":
                    i.backgroundColor = r.TableRowColor;
                    break;
                case ".tablemaster tr.even":
                case ".tablemastersm tr.even":
                case ".ac_results":
                    i.backgroundColor = r.TableAlternateRowColor;
                    break;
                case ".tablemaster thead tr":
                case ".tablemastersm thead tr":
                    i.backgroundColor = r.TableHeadColor;
                    break;
                case "#menu":
                case "#menu ul ul ul a":
                    i.backgroundColor = r.MenuBackgroundColor;
                    break;
                case "#menu a":
                    i.backgroundColor = r.MenuBackgroundColor,
                    i.color = r.MenuTextColor,
                    i.borderColor = r.MenuBorderColorTop + " " + r.MenuBorderColorRight + " " + r.MenuBorderColorBottom + " " + r.MenuBorderColorLeft;
                    break;
                case "#menu a:hover":
                    i.color = r.MenuHoverColor;
                    break;
                case "#menu ul ul a":
                    i.backgroundColor = r.MenuBackgroundColor,
                    i.borderColor = r.MenuDropdownBorderColor
                }
            }
        }
        try {
            var n = "Global."
              , a = null
              , s = [];
            return {
                DisableTooltips: !1,
                FadingHelpLinks: !1,
                Version: function() {
                    return MP.StingrayJsVersion
                },
                ShowBarcodeDlg: function() {
                    jPrompt("Scan a barcode while the cursor is in this edit box\nWARNING: Any unsaved changes on current page will be lost!", "", "Barcode Scanner", function(e) {
                        e && Communication.LinkRequest("BarCode.max?" + $.param({
                            BC: e
                        }))
                    })
                },
                SetRequiredForAllElements: function(t, o) {
                    try {
                        for (var n = o.split(","), a = 0; a < n.length; a++)
                            i.GetControl($.trim(n[a])).SetRequired(t)
                    } catch (t) {
                        e("SetRequiredForAllElements", t, r.Type.Error)
                    }
                },
                RemoveAllSpellchecks: function() {
                    try {
                        if (!window.livespell)
                            return;
                        livespell.spellingProviders = []
                    } catch (t) {
                        e("RemoveAllSpellchecks", t, r.Type.Error)
                    }
                },
                AddSpellcheck: function(t) {
                    try {
                        if (!window.$Spelling)
                            return void jAlert("Spellcheck module not loaded!");
                        var o = $(t).parent();
                        o.children("span").hide(),
                        $Spelling.SpellCheckAsYouType(o.children("textarea")),
                        o.removeClass("EditorMemo").addClass("MemoSpellDiv"),
                        o.children(".livespell_textarea").css({
                            width: "100%",
                            height: "100%"
                        })
                    } catch (t) {
                        e("AddSpellcheck", t, r.Type.Error)
                    }
                },
                ConvertToInlineCKEditor: function(t) {
                    try {
                        var o = $(t)
                          , i = o.attr("id")
                          , n = o.attr("title")
                          , a = CKEDITOR.instances[i];
                        a && a.destroy(),
                        o.attr("contenteditable", !0),
                        o.addClass("ckEditor");
                        var s = {
                            removeButtons: "Anchor",
                            title: n,
                            toolbarGroups: [{
                                name: "document",
                                groups: ["mode", "document", "doctools"]
                            }, {
                                name: "clipboard",
                                groups: ["clipboard", "undo"]
                            }, {
                                name: "paragraph",
                                groups: ["list", "indent", "blocks", "align", "bidi"]
                            }, {
                                name: "links"
                            }, {
                                name: "insert"
                            }, {
                                name: "editing",
                                groups: ["find", "selection", "spellchecker"]
                            }, "/", {
                                name: "basicstyles",
                                groups: ["basicstyles", "cleanup"]
                            }, {
                                name: "styles"
                            }, {
                                name: "colors"
                            }]
                        };
                        return CKEDITOR.inline(i, s)
                    } catch (t) {
                        e("ConvertToInlineCKEditor", t, r.Type.Error, !0)
                    }
                },
                GetCKEditorValue: function(t) {
                    try {
                        var o, i = $(t).attr("id");
                        return i && (o = CKEDITOR.instances[i]),
                        o ? o.getData() : null
                    } catch (t) {
                        e("GetCKEditorValue", t, r.Type.Error)
                    }
                },
                ConvertToAceEditor: function(e, t) {
                    if (MP.Tools.AceEnabled()) {
                        t = $.extend({
                            language: "text",
                            focus: !1,
                            theme: "chrome",
                            styles: {}
                        }, t);
                        var r, o, i, n = function(e) {
                            return "server script" == e && (e = "pascal"),
                            "ace/mode/" + e
                        }, a = MP.Tools.Config.Editor.ace;
                        e.is("textarea") || e.is("input") ? (e.hide(),
                        r = e.parent(),
                        i = $("<div/>").css(t.styles).appendTo(r),
                        i = i.get(0),
                        o = ace.edit(i),
                        o.setValue(e.val(), -1)) : (r = e.parent().css(t.styles),
                        i = e.get(0),
                        o = ace.edit(i));
                        var s = ["chrome", "clouds", "crimson_editor", "dawn", "dreamweaver", "eclipse", "github", "solarized_light", "textmate", "tomorrow", "xcode", "clouds_midnight", "cobalt", "idle_fingers", "kr_theme", "merbivore", "merbivore_soft", "mono_industrial", "monokai", "pastel_on_dark", "solarized_dark", "tomorrow_night", "tomorrow_night_blue", "tomorrow_night_bright", "tomorrow_night_eighties", "twilight", "vibrant_ink", "ambiance", "chaos"]
                          , l = ["text", "sql", "javascript", "server script", "xml", "json", "html", "css"]
                          , c = "F1  -  Context help<br>F11  -  Toggle full screen<br>Alt-W  -  Toggle word wrap<br>Tab  -  Indent selection<br>Shift-Tab  -  Outdent selection<br>Alt-S  -  Remove doubled single quotes<br>Alt-D  -  Double single quotes<br>Ctrl-/  -  Toggle comment<br>Ctrl-L  -  Go to line number<br>Alt-L  -  Toggle fold<br>Alt-0  -  Fold all<br>Alt-Shift-0  -  Unfold all<br>Ctrl-F  -  Find<br>Ctrl-H  -  Replace<br>Ctrl-K  -  Find next<br>Ctrl-Shift-K  -  Find previous<br>Ctrl-P  -  Jump to matching end<br>Ctrl-Shift-P  -  Select to matching end<br>Ctrl-U  -  To uppercase<br>Ctrl-Shift-U  -  To lowercase<br>Ctrl-D  -  Remove line<br>Ctrl-Shift-D  -  Duplicate selection<br>Ctrl-Alt-S  -  Sort selected lines<br>Alt-Shift-Up  -  Copy lines up<br>Alt-Up  -  Move lines up<br>Alt-Shift-Down  -  Copy lines down<br>Alt-Down  -  Move lines down<br>Ctrl-[  -  Outdent line<br>Ctrl-]  -  Indent line<br>Ctrl-Up  -  Scroll up<br>Ctrl-Down  -  Scroll down<br>Ctrl-A  -  Select all<br>Alt-mouse  -  Select rectangle<br>Ctrl-Alt-E  -  Toggle recording<br>Ctrl-Shift-E  -  Replay macro";
                        o.session.setMode(n(t.language)),
                        o.session.setUseWrapMode(a.wordWrap),
                        o.setFontSize(14);
                        var d = $("<div/>").addClass("noWrap").appendTo(r);
                        $("<select/>").attr("title", "Change editor theme").addClass("ace_selector").append(Utilities.ConvertToOptions(s)).appendTo(d).change(function() {
                            var e = $(this).val();
                            a.theme = e,
                            o.setTheme("ace/theme/" + e)
                        }).val(a.theme || t.theme).change(),
                        $("<select/>").attr("title", "Change editor language").addClass("ace_selector").append(Utilities.ConvertToOptions(l)).appendTo(d).change(function() {
                            var e = $(this).val().toLowerCase();
                            o.session.setMode(n(e))
                        }).val(t.language);
                        var u = $("<div/>");
                        return u.addClass("ace_help"),
                        u.appendTo(d),
                        MP.Tools.jqxGridsEnabled() ? jQ(u.get(0)).jqxTooltip({
                            content: c,
                            autoHideDelay: 5e4,
                            theme: "editor"
                        }) : (c = Utilities.ReplaceAll(c, "<br>", "\n"),
                        u.attr("title", c)),
                        a.codeTips && (o.tokenTooltip = new TokenTooltip(o)),
                        t.focus && o.focus(),
                        o
                    }
                },
                GetCookie: function(t) {
                    try {
                        var o, i, n, a, s;
                        for (i = document.cookie.split("; "),
                        o = 0; o < i.length; o++)
                            if (n = i[o],
                            a = n.substring(0, n.indexOf("=")),
                            a = a.trim(),
                            a == t)
                                return s = n.substring(n.indexOf("=") + 1),
                                s = unescape(s)
                    } catch (t) {
                        e("GetCookie", t, r.Type.Error, !0)
                    }
                    return ""
                },
                SetCookie: function(t, o) {
                    try {
                        var i = new Date;
                        i.setDate(i.getDate() + 1),
                        document.cookie = t + "=" + escape(o) + "; expires=" + i.toUTCString()
                    } catch (t) {
                        e("SetCookie", t, r.Type.Error)
                    }
                },
                CheckWorkflow: function() {
                    e("CheckWorkflow", "Remove obsolete Global.CheckWorkflow function!", r.Type.Warning)
                },
                TooltipsClick: function() {
                    var e = $("#TooltipIcon")
                      , t = "0" == e.attr("status") ? "1" : "0";
                    Communication.CustomRequest("icontray.max?action=tooltips&status=" + t, function(t) {
                        var r = $(t);
                        e.attr("alt", r.attr("alt")),
                        e.attr("status", r.attr("status")),
                        e.attr("src", r.attr("src")),
                        i.Tooltips("1" == e.attr("status"))
                    }, null)
                },
                Tooltips: function(t) {
                    try {
                        void 0 == t ? t = i.DisableTooltips : i.DisableTooltips = t,
                        t ? $("*[oldtitle]").each(function() {
                            $(this).attr("title", $(this).attr("oldtitle")),
                            $(this).removeAttr("oldtitle")
                        }) : $("*[title]").each(function() {
                            $(this).attr("oldtitle", $(this).attr("title")),
                            $(this).removeAttr("title")
                        })
                    } catch (t) {
                        e("Tooltips", t, r.Type.Error)
                    }
                },
                DetachElements: function(e) {
                    e = $(e);
                    var t = [];
                    return $.each(e, function() {
                        var e = $(this)
                          , r = {
                            parent: e.parent(),
                            element: e.detach()
                        };
                        t.push(r)
                    }),
                    t
                },
                ReattachElements: function(e) {
                    $.each(e, function() {
                        this.element.appendTo(this.parent)
                    })
                },
                GetControl: function(t) {
                    try {
                        var i = $("*[name='" + t + "']")
                          , n = [];
                        return i.each(function() {
                            var e = $(this).parent(".component");
                            e.length && n.push(o.GetEditorComponent(e[0]))
                        }),
                        1 == n.length ? n[0] : n
                    } catch (t) {
                        e("GetControl", t, r.Type.Error)
                    }
                },
                MakeReadOnly: function(t) {
                    try {
                        var o = null;
                        o = null == typeof t || "undefined" == typeof t || "" == t ? $("#middle") : $(t),
                        inp = o.find(":checkbox, :radio, select").attr("disabled", !0),
                        inp = o.find(":text, textarea").attr("readonly", !0)
                    } catch (t) {
                        e("MakeReadOnly", t, r.Type.Error)
                    }
                },
                InProgress: function() {
                    return a && a.is(":visible")
                },
                ShowProgress: function(t) {
                    try {
                        t && $(t).blur(),
                        a || (a = $('<div id="spinnerOverlay"></div>').appendTo("body")),
                        a.show()
                    } catch (t) {
                        e("ShowProgress", t, r.Type.Error)
                    }
                },
                HideProgress: function() {
                    try {
                        a && a.hide()
                    } catch (t) {
                        e("HideProgress", t, r.Type.Error)
                    }
                },
                HideMessage: function() {
                    try {
                        $("#ModalWindow").dialog("close")
                    } catch (t) {
                        e("HideMessage", t, r.Type.Error)
                    }
                },
                ShowErrorMessage: function(e, t, r, o) {
                    t = t || "Error",
                    o = o || 800,
                    r = r || {
                        Close: function() {
                            $(this).dialog("close")
                        }
                    },
                    this.ShowMessage(e, o, t, null, r)
                },
                ShowMessage: function(t, o, i, n, a) {
                    try {
                        var l = $("#ModalWindow")
                          , c = function() {
                            var e = s.shift();
                            e && (l.dialog("option", "width", e.width),
                            l.dialog("option", "title", e.title),
                            l.dialog("option", "overlay", {
                                opacity: e.opacity,
                                background: e.color
                            }),
                            l.dialog("option", "buttons", e.buttons),
                            l.dialog("close"),
                            l.html($("<div/>").html(e.html)),
                            l.dialog("open"))
                        };
                        l.attr("dialoginit") || (s = [],
                        l.css("display", "block"),
                        l.dialog({
                            modal: !0,
                            autoOpen: !1
                        }),
                        l.attr("dialoginit", "true"),
                        l.bind("dialogclose", function() {
                            c()
                        })),
                        s.push({
                            html: t,
                            width: o || 960,
                            title: i || "",
                            opacity: n || .5,
                            color: "#000",
                            buttons: a || {}
                        }),
                        c()
                    } catch (t) {
                        e("ShowMessage", t, r.Type.Error)
                    }
                },
                ReloadStyles: function(e, o) {
                    if (e) {
                        o = o || "global.css,custom.css,tablewalker.css";
                        for (var i = o.split(","), n = $.parseJSON(e), a = Browser.IsFirefox() || Browser.IsChrome() || Browser.IsSafari(), s = document.styleSheets.length, l = 0; l < s; l++)
                            for (var c = 0; c < i.length; c++) {
                                var d = new RegExp(i[c] + "$","i");
                                try {
                                    var u = document.styleSheets[l].href;
                                    if (u && u.match(d)) {
                                        if (a)
                                            var p = document.styleSheets[l].cssRules;
                                        else
                                            var p = document.styleSheets[l].rules;
                                        if (p)
                                            for (var h = 0; h < p.length; h++)
                                                t(p[h], n);
                                        break
                                    }
                                } catch (e) {
                                    r.Add("ReloadStyles", e, r.Type.Error)
                                }
                            }
                    }
                },
                ShakeElement: function(e, t) {
                    t = t || 10;
                    var r = Utilities.ToNumber(e.css("left"))
                      , o = function() {
                        if (t--,
                        t) {
                            var i = t % 2 == 0 ? t : -t
                              , n = r + i;
                            e.css("left", n + "px"),
                            setTimeout(o, 50)
                        } else
                            e.css("left", r + "px")
                    };
                    o()
                },
                ScrollToElement: function(e, t, r) {
                    var o = Browser.IsSafari() ? "body" : "html";
                    $(o).animate({
                        scrollTop: e.offset().top
                    }, t || 500, r)
                },
                DisableHighlightingInChrome: function(e) {
                    Browser.IsChrome() && (e ? $(document).disableSelection() : $(document).enableSelection())
                },
                UpdateLastPosition: function(e, t) {
                    var r = $(document)
                      , o = t && t.position ? t.position : e.parent().offset();
                    e.data("lastTop", Utilities.ToNumber(o.top - r.scrollTop())),
                    e.data("lastLeft", Utilities.ToNumber(o.left - r.scrollLeft()))
                },
                SetClipboard: function(e) {
                    var t, r = !1, o = Utilities.IsString(e);
                    t = o ? $('<textarea class="clipboardCont"/>').val(e).appendTo("body") : $(e),
                    t.select();
                    try {
                        r = document.execCommand("copy")
                    } catch (e) {}
                    return o && t.remove(),
                    r
                },
                GetClipboard: function(e) {
                    var t = $(e)
                      , r = ""
                      , o = !t.length;
                    o && (t = $('<textarea class="clipboardCont"/>').appendTo("body")),
                    t.select();
                    try {
                        document.execCommand("paste") && (r = t.val())
                    } catch (e) {}
                    return o && t.remove(),
                    r
                }
            }
        } catch (t) {
            e("Main", t, r.Type.Error)
        }
    }
    ;
    return i
}),
define("RuleStorage", ["Storage"], function(e) {
    var t = new function() {
        function t(e, t, o, i) {
            Log.Add(r + e, t, o, i)
        }
        try {
            var r = "RuleStorage."
              , o = new e("Pre")
              , i = new e("Post")
              , n = null;
            this.AddComponent = function(e, r) {
                try {
                    n.AddComponent(e, r)
                } catch (e) {
                    t("AddComponent", e, Log.Type.Error)
                }
            }
            ,
            this.GetComponent = function(e) {
                try {
                    return n.GetComponent(e)
                } catch (e) {
                    t("GetComponent", e, Log.Type.Error)
                }
            }
            ,
            this.GetCount = function() {
                try {
                    return n.GetCount()
                } catch (e) {
                    t("GetCount", e, Log.Type.Error)
                }
            }
            ,
            this.GetCurrentStorage = function() {
                try {
                    return n
                } catch (e) {
                    t("GetCurrentStorage", e, Log.Type.Error)
                }
            }
            ,
            this.GetItemArray = function() {
                try {
                    return n.GetItemArray()
                } catch (e) {
                    t("GetItemArray", e, Log.Type.Error)
                }
            }
            ,
            this.GetIdArray = function(e) {
                try {
                    return n.GetIdArray(e)
                } catch (e) {
                    t("GetIdArray", e, Log.Type.Error)
                }
            }
            ,
            this.Remove = function(e) {
                try {
                    n.Remove(e)
                } catch (e) {
                    t("Remove", e, Log.Type.Error)
                }
            }
            ,
            this.Reset = function() {
                try {
                    n.Reset()
                } catch (e) {
                    t("Reset", e, Log.Type.Error)
                }
            }
            ,
            this.SetCurrentProcess = function(e) {
                n = "preproc" == e ? o : i
            }
            ,
            this.GetStorage = function(e) {
                return "preproc" == e ? o : i
            }
        } catch (e) {
            t("Main", e, Log.Type.Error)
        }
    }
    ;
    return t
}),
define("IconMover", ["RuleXML", "RuleStorage"], function(e, t) {
    var r = new function() {
        function r(e, t, r, i) {
            Log.Add(o + e, t, r, i)
        }
        var o = "IconMover.";
        return {
            Load: function(o) {
                try {
                    this.Ctrl = t.GetComponent(o),
                    this.Ctrl.OldEntry = this.Ctrl.GetIcon().GetEntryPoint(),
                    this.Ctrl.OldExit = this.Ctrl.GetIcon().GetExitPoint();
                    var i = e.GetFromComponent(o);
                    i && (this.FromJ1 = i.GetJ1() == this.Ctrl.GetID(),
                    this.From = i.GetIcon().GetExitPoint()),
                    this.Ctrl.GetJ1 && this.Ctrl.GetJ1() && (i = t.GetComponent(this.Ctrl.GetJ1()),
                    i && i.GetIcon ? this.J1 = i.GetIcon().GetEntryPoint() : this.J1 = null),
                    this.Ctrl.GetJ2 && this.Ctrl.GetJ2() && (i = t.GetComponent(this.Ctrl.GetJ2()),
                    i && i.GetIcon ? this.J2 = i.GetIcon().GetEntryPoint() : this.J2 = null)
                } catch (e) {
                    r("Load", e, Log.Type.Error)
                }
            },
            MoveSelected: function(e, r) {
                for (var o = RulesMaker.GetSelected(), i = 0; i < o.length; i++) {
                    var n = t.GetComponent(o[i]);
                    n.Icon.MoveBy(e, r)
                }
            },
            Reset: function() {
                this.Ctrl = null,
                this.From = null,
                this.FromJ1 = null,
                this.J1 = null,
                this.J2 = null,
                this.Enabled = !1
            },
            Enable: function() {
                this.Enabled = !0
            },
            Refresh: function() {
                try {
                    if (!this.Enabled)
                        return;
                    this.Ctrl.Icon.UpdateComment(),
                    RuleGraphics.ReDraw()
                } catch (e) {
                    r("Refresh", e, Log.Type.Error)
                }
            },
            Enabled: !1,
            Ctrl: null,
            J1: null,
            J2: null,
            From: null,
            FromJ1: null
        }
    }
    ;
    return r
}),
define("IconConnector", ["ContextMenu", "RuleStorage"], function(e, t) {
    var r = new function(r) {
        function o(e, t, r, o) {
            Log.Add(a + e, t, r, o)
        }
        var i, n, a = "IconConn.";
        return {
            Reset: function() {
                i = null,
                n && n.HighlightAsConnecting(!1),
                n = null,
                e.Enabled = !0
            },
            CanvasClicked: function(r) {
                try {
                    var i = r.which
                      , a = r.shiftKey;
                    if (o("CanvasClicked", "Btn=" + i),
                    !a || !n)
                        return void this.Reset();
                    switch (i) {
                    case 1:
                        var s = n.GetJ1()
                          , l = t.GetComponent(s);
                        this.DisConnect(n, l, n.SetJ1);
                        break;
                    case 3:
                        var c = n.GetJ2 || $.noop
                          , s = c()
                          , l = t.GetComponent(s);
                        this.DisConnect(n, l, n.SetJ2),
                        e.Enabled = !1
                    }
                } catch (e) {
                    o("CanvasClicked", e, Log.Type.Error)
                }
            },
            IconClicked: function(r, a) {
                try {
                    var s = a.which
                      , l = a.shiftKey;
                    if (o("IconClicked", "ID=" + r + ", Btn=" + s),
                    r == i)
                        return;
                    if (i && !l && n.HighlightAsConnecting(!1),
                    r && !l)
                        return n = t.GetComponent(r),
                        n.HighlightAsConnecting(!0),
                        void (i = r);
                    if (r && l) {
                        var c = t.GetComponent(r);
                        switch (s) {
                        case 1:
                            n && n.SetJ1 && this.Connect(n, c, n.SetJ1);
                            break;
                        case 3:
                            n && n.SetJ2 && this.Connect(n, c, n.SetJ2),
                            e.Enabled = !1
                        }
                    }
                } catch (e) {
                    o("IconClicked", e, Log.Type.Error)
                }
            },
            Connect: function(e, t, r) {
                o("Connect", "From: " + e.GetID() + " To: " + t.GetID());
                var i = t.GetID();
                if (e.GetJ2) {
                    var n, a;
                    r == e.SetJ2 ? (n = e.GetJ1(),
                    a = e.SetJ1) : (n = e.GetJ2(),
                    a = e.SetJ2),
                    i == n && this.DisConnect(e, t, a)
                }
                r(i),
                RuleGraphics.Refresh()
            },
            DisConnect: function(e, t, r) {
                e && t && o("Disconnect", "From: " + e.GetID() + " To: " + t.GetID()),
                r && r(""),
                RuleGraphics.Refresh()
            }
        }
    }
    ;
    return r.Reset(),
    r
}),
define("RuleIcon", ["IconMover", "RuleStorage"], function(e, t) {
    function r() {
        function r(e, t, r, o) {
            var i = "";
            c && (i = c.attr("id")),
            "" != i && (i += "."),
            Log.Add(i + l + e, t, r, o)
        }
        function o() {
            try {
                r("AddFeatures", "Called"),
                c.draggable({
                    containment: "parent",
                    grid: [32, 26],
                    start: function() {
                        Global.DisableHighlightingInChrome(!0),
                        a = null,
                        s = null
                    },
                    stop: function() {
                        Global.DisableHighlightingInChrome(!1);
                        for (var e = RulesMaker.GetSelected(), o = 0; o < e.length; o++) {
                            var i = e[o]
                              , n = t.GetComponent(i);
                            if (n)
                                try {
                                    var a = n.Icon.GetImage().position();
                                    n.SetX(a.left),
                                    n.SetY(a.top),
                                    n.Icon.UpdateComment()
                                } catch (e) {
                                    r("StopDragging", "Failed to update position of ID: " + i + ". Reason: " + e.message, Log.Type.Error, !0)
                                }
                            else
                                r("StopDragging", "Cannot locate component ID: " + i, Log.Type.Warning)
                        }
                        RuleGraphics.Refresh()
                    },
                    drag: function() {
                        var t = $(this)
                          , r = t.css("left")
                          , o = t.css("top");
                        if (a != r || s != o) {
                            if (a && s)
                                var i = parseInt(r, 10) - parseInt(a, 10)
                                  , n = parseInt(o, 10) - parseInt(s, 10);
                            else
                                var i = null
                                  , n = null;
                            a = r,
                            s = o;
                            var l = c.attr("id");
                            RulesMaker.IsSelected(l) || (RulesMaker.ClearSelected(),
                            RulesMaker.AddSelected(l)),
                            e.MoveSelected(i, n)
                        }
                    }
                })
            } catch (e) {
                r("AddFeatures", e, Log.Type.Error)
            }
        }
        function i() {
            try {
                var e = Utilities.ToNumber(c.css("top"))
                  , t = Utilities.ToNumber(c.css("left"))
                  , o = Utilities.ToNumber(c.width())
                  , i = t + parseInt(o / 2, 10)
                  , n = e;
                return new RuleGraphics.Point(i,n)
            } catch (e) {
                r("getEntryPoint", e, Log.Type.Error)
            }
        }
        function n() {
            try {
                var e = Utilities.ToNumber(c.css("top"))
                  , t = Utilities.ToNumber(c.css("left"))
                  , o = Utilities.ToNumber(c.width())
                  , i = Utilities.ToNumber(c.height())
                  , n = t + parseInt(o / 2, 10)
                  , a = e + i;
                return new RuleGraphics.Point(n,a)
            } catch (e) {
                r("getExitPoint", e, Log.Type.Error)
            }
        }
        try {
            var a, s, l = "RuleIcon.", c = null, d = null, u = null, p = null, h = null;
            this.Load = function(e) {
                try {
                    r("Load", "Called"),
                    h = e;
                    var t = h.GetID();
                    d = $("<div class='RuleIconComment' commentid='" + t + "'>"),
                    c = $("<img/>"),
                    c.attr("src", h.Src),
                    c.attr("id", t),
                    c.addClass("icon"),
                    c.css("top", h.GetY()),
                    c.css("left", h.GetX()),
                    c.css("position", "absolute"),
                    c.appendTo("<div/>"),
                    o()
                } catch (e) {
                    r("Load", e, Log.Type.Error)
                }
            }
            ,
            this.AppendTo = function(e) {
                try {
                    u = e,
                    u.append(c),
                    u.append(d),
                    this.UpdateComment()
                } catch (e) {
                    r("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Delete = function() {
                r("Delete", "Called"),
                u.find("div[commentid='" + c.attr("id") + "']").remove(),
                c.remove()
            }
            ,
            this.GetContainer = function() {
                try {
                    return u
                } catch (e) {
                    r("GetContainer", e, Log.Type.Error)
                }
            }
            ,
            this.GetEntryPoint = function() {
                try {
                    return i()
                } catch (e) {
                    r("GetEntryPoint", e, Log.Type.Error)
                }
            }
            ,
            this.GetExitPoint = function() {
                try {
                    return n()
                } catch (e) {
                    r("GetExitPoint", e, Log.Type.Error)
                }
            }
            ,
            this.GetImage = function() {
                return c
            }
            ,
            this.MoveBy = function(e, t) {
                var r = Utilities.ToNumber(c.css("left")) + e
                  , o = Utilities.ToNumber(c.css("top")) + t;
                this.MoveTo(r, o)
            }
            ,
            this.MoveTo = function(e, t) {
                c.css("left", e).css("top", t)
            }
            ,
            this.SetIconMover = function(e) {
                p = e
            }
            ,
            this.UpdateComment = function(e) {
                try {
                    var t, o = $.trim(h.GetComment()), i = o.substring(0).search(/[\n\r]/);
                    t = i > 0 && i < 25 ? o.substring(0, i) : o.length > 25 ? o.substring(0, 25) + "..." : o,
                    d.text(h.GetID() + ": " + t),
                    d.css("top", c.css("top")).css("left", c.css("left"));
                    var n = jQ(c[0]);
                    !e && o && Utilities.SafeStrCompare(o, t) ? (o = o.replace(/[\n\r]/g, "<br/>"),
                    n.jqxTooltip({
                        content: o,
                        showDelay: 1e3,
                        autoHideDelay: 5e4,
                        theme: "editor"
                    }),
                    d.css("color", "blue")) : (n.jqxTooltip("destroy"),
                    d.css("color", "black"))
                } catch (e) {
                    r("UpdateComment", e, Log.Type.Error)
                }
            }
        } catch (e) {
            r("Main", e, Log.Type.Error)
        }
    }
    return r
}),
define("RuleHelper", ["RuleIcon", "RuleStorage"], function(e, t) {
    var r, o = {
        CSF: "rules/comp/CompiledScriptFunction",
        SCRIPT: "rules/comp/Script",
        SQLTRN: "rules/comp/SqlTrn",
        ERROR: "rules/comp/Error",
        EXTERNAL: "rules/comp/External",
        IF: "rules/comp/If",
        INSERTUPDATEQUERY: "rules/comp/InsertUpdateQuery",
        MATH: "rules/comp/Math",
        SELECTQUERY: "rules/comp/SelectQuery",
        SET: "rules/comp/Set",
        TEMPLATE: "rules/comp/Template"
    }, i = [], n = [];
    for (r in o)
        o.hasOwnProperty(r) && (i.push(o[r]),
        n.push(r));
    var a = {};
    require(i, function() {
        for (var e = 0; e < n.length; ++e)
            a[n[e]] = arguments[e]
    });
    var s = new function() {
        function r(e, t, r, o) {
            Log.Add(i + e, t, r, o)
        }
        function o(e) {
            try {
                var t = $(e).find(">t").text();
                t.toUpperCase();
                var o = a[t]
                  , i = new o;
                return i.Load(e),
                i
            } catch (e) {
                r("loadComponent", "Most likely unknown type: " + t, Log.Type.Error, !0)
            }
        }
        var i = "RuleHelper.";
        try {
            return {
                Search: function(e, o) {
                    for (var i = ["preproc", "postproc"], n = 0; n < i.length; n++) {
                        var a = t.GetStorage(i[n]);
                        e ? r("Search", "Searching " + a.GetCount() + " " + i[n].toUpperCase() + " components for '" + e + "'", Log.Type.Debug) : r("Search", "Clearing", Log.Type.Info);
                        var s = a.GetItemArray();
                        $.each(s, function() {
                            var t = this;
                            try {
                                t.Search(e, o),
                                t.HighlightAsError(!1)
                            } catch (e) {
                                r("BadComponent", t, Log.Type.Search),
                                t.HighlightAsError(!0)
                            }
                        })
                    }
                },
                LoadComponents: function(i, n) {
                    try {
                        r("LoadComponents", "Called");
                        var a = $(n);
                        a.html(""),
                        $(i).find(">c").each(function() {
                            var r = o(this);
                            if (r) {
                                r.SetX(Utilities.SnapTo(r.GetX(), 32)),
                                r.SetY(Utilities.SnapTo(r.GetY(), 26));
                                var i = new e;
                                i.Load(r),
                                r.SetIcon(i),
                                i.AppendTo(a),
                                t.AddComponent(r, r.GetID()),
                                r.UpdateWatchpoint()
                            }
                        })
                    } catch (e) {
                        r("LoadComponents", e, Log.Type.Error)
                    }
                },
                ValidatePage: function() {
                    try {
                        s.Search();
                        for (var e = ["preproc", "postproc"], o = 0, i = 0, n = 0, a = 0, l = "", c = 0; c < e.length; c++) {
                            var d = t.GetStorage(e[c])
                              , u = d.GetItemArray();
                            r("ValidatePage", "Validating " + u.length + " " + e[c].toUpperCase() + " components", Log.Type.Debug),
                            $.each(u, function(e, t) {
                                var s = !1;
                                "IF" == t.Type && (t.GetJ1() && t.GetJ2() || (o++,
                                s = !0,
                                r(t.GetID() + ".BadConnection", t, Log.Type.Search))),
                                $.inArray(t.Type, ["ERROR", "TEMPLATE"]) > -1 && t.GetJ1() && (o++,
                                s = !0,
                                r(t.GetID() + ".BadConnection", t, Log.Type.Search)),
                                t.GetWatchpoint() && (n++,
                                r(t.GetID() + ".WatchpointSet", t, Log.Type.Search)),
                                t.GetComment() || (a++,
                                r(t.GetID() + ".NoComment", t, Log.Type.Search));
                                for (var l = !1, c = t.GetID(), d = 0; d < u.length; d++)
                                    if (u[d] != t && (u[d].GetJ1() == c || u[d].GetJ2 && u[d].GetJ2() == c)) {
                                        l = !0;
                                        break
                                    }
                                l || (i++,
                                s = !0,
                                r(t.GetID() + ".NotConnected", t, Log.Type.Search)),
                                t.HighlightAsError(s)
                            })
                        }
                        o && (l += "Wrong connections: " + o + "<br>"),
                        i > 2 && (l += "Not connected: " + parseInt(i - 2) + "<br>"),
                        n && (l += "Watch points set: " + n + "<br>"),
                        a && (l += "No component comments: " + a + "<br>"),
                        l && r("ValidatePage", "Discovered " + parseInt(o + i + n + a) + " possible problems!", Log.Type.Debug)
                    } catch (e) {
                        r("ValidatePage", e, Log.Type.Error)
                    }
                    return l
                },
                ComponentTypes: a
            }
        } catch (e) {
            r("Main", e, Log.Type.Error)
        }
    }
    ;
    return s
}),
define("Undo", [], function() {
    var e = function(e, t) {
        function r(e, t, r, o) {
            Log.Add(i + e, t, r, o)
        }
        function o(e, t, r) {
            this.value = e,
            this.callBack = t || n,
            this.parentID = r
        }
        var i = e + "Undo."
          , n = t
          , a = []
          , s = 0
          , l = this;
        this.ID = e,
        this.Clear = function() {
            a.reset(),
            a = [],
            s = 0
        }
        ,
        this.Add = function(e, t, r) {
            var i = new o(e,r,t);
            s < a.length && a.splice(s, a.length),
            a.push(i),
            a.length > 10 && a.shift(i),
            s = a.length
        }
        ,
        this.CanRedo = function() {
            return s < a.length - 1
        }
        ,
        this.CanUndo = function() {
            return s > 0
        }
        ,
        this.Undo = function() {
            try {
                if (!l.CanUndo())
                    return;
                s--;
                var e = a[s];
                e && e.callBack(e.value, e.parentID)
            } catch (e) {
                r("Undo", e, Log.Type.Error, !0)
            }
        }
        ,
        this.Redo = function() {
            try {
                if (!l.CanRedo())
                    return;
                s++;
                var e = a[s];
                e && e.callBack(e.value, e.parentID)
            } catch (e) {
                r("Redo", e, Log.Type.Error, !0)
            }
        }
    };
    return e
}),
define("RulesMaker", ["RuleHelper", "RuleStorage", "RuleXML", "ContextMenu", "ContextMenuItems", "Editor", "RuleIcon", "IconConnector", "Undo"], function(e, t, r, o, i, n, a, s, l) {
    var c = new function() {
        function d(e, t, r, o) {
            Log.Add(G + e, t, r, o)
        }
        function u(e) {
            try {
                d("AddFeatures", "Called")
            } catch (e) {
                d("AddFeatures", e, Log.Type.Error)
            }
        }
        function p(e) {
            try {
                d("RemoveFeatures", "Called"),
                e = $(e)
            } catch (e) {
                d("RemoveFeatures", e, Log.Type.Error)
            }
        }
        function h() {
            try {
                var e, t = new i;
                e = t.Add("Edit >"),
                t.Add("Copy [Ctrl+C]", function() {
                    c.Copy(!1)
                }, e),
                t.Add("Cut [Ctrl+X]", function() {
                    c.Copy(!0)
                }, e),
                t.Add("Paste [Ctrl+V]", function() {
                    c.Paste()
                }, e),
                t.Add("Copy (export)", function() {
                    c.Export(!1)
                }, e),
                t.Add("Cut (export)", function() {
                    c.Export(!0)
                }, e),
                t.Add("Paste (import)", function() {
                    c.Import()
                }, e),
                e = t.Add("Select >"),
                t.Add("All [Ctrl+A]", function() {
                    n.Select("all")
                }, e),
                t.Add("Below [Ctrl+B]", function() {
                    n.Select("below")
                }, e),
                t.Add("Right [Ctrl+R]", function() {
                    n.Select("right")
                }, e),
                t.Add("Above", function() {
                    n.Select("above")
                }, e),
                t.Add("Left", function() {
                    n.Select("left")
                }, e),
                e = t.Add("Component >"),
                t.Add("Properties [Ctrl+P]", function() {
                    c.ShowProperties()
                }, e),
                t.Add("Delete [Del]", function() {
                    c.DeleteSelection()
                }, e),
                t.Add("Disconnect", function() {
                    c.DisconnectSelection()
                }, e),
                t.Add("Snap to Grid", function() {
                    c.SnapToGrid()
                }, e),
                t.Add("Switch Query", function() {
                    c.SwitchQueryComponent()
                }, e);
                var r = "preproc" == c.CurrentProcess ? A : P;
                return r.CanUndo() && t.Add("Undo [Ctrl+Z]", r.Undo, e),
                r.CanRedo() && t.Add("Redo [Ctrl+Y]", r.Redo, e),
                e = t.Add("Search >"),
                t.Add("Search... [Ctrl+Shift+F]", function() {
                    n.Search()
                }, e),
                t.Add("Clear", function() {
                    n.ClearSearch()
                }, e),
                e = t.Add("Watch Points >"),
                t.Add("Set", function() {
                    c.SetWatchpoints(!0)
                }, e),
                t.Add("Clear", function() {
                    c.SetWatchpoints(!1)
                }, e),
                t.Add("Clear All", function() {
                    c.ClearWatchpoints()
                }, e),
                e = t.Add("File >"),
                t.Add("Help... [F1]", n.ShowHelp, e),
                n.Enabled && !n.LockedBy && (t.Add("Quick Save [Ctrl+S]", function() {
                    PropertyEd.QuickSave()
                }, e),
                t.Add("Save & Exit", function() {
                    PropertyEd.Save()
                }, e)),
                t.Add("Exit... [Ctrl+Q]", function() {
                    PropertyEd.Close()
                }, e),
                t.GetHTML()
            } catch (e) {
                d("makeContextMenu", e, Log.Type.Error)
            }
        }
        function f() {
            var e = "preproc" == c.CurrentProcess
              , t = e ? A : P
              , o = r.GetProcessXML()[0];
            t.Add(Utilities.GetXmlString(o))
        }
        function g(e) {
            if (!M.length) {
                var t = $(o.EventComponent).attr("id");
                c.AddSelected(t)
            }
            return e && M.length && f(),
            M.length > 0
        }
        function m(o, i, n) {
            c.SetCurrentProcess(o),
            t.Reset(),
            "string" == typeof i ? (i = Utilities.ParseXML(i),
            i = $(i).find(o),
            r.SetProcessXML(i)) : i = r.GetProcessXML(),
            e.LoadComponents(i, n),
            c.AdjustCanvasHeight()
        }
        function y(e) {
            m("preproc", e, S)
        }
        function C(e) {
            m("postproc", e, L)
        }
        function v(t) {
            try {
                d("createComponent", "Called");
                var r = e.ComponentTypes[t]
                  , o = new r;
                if (!o)
                    throw "A component '" + t + "' could not be created!";
                return o.Create(),
                o
            } catch (e) {
                d("createComponent", e, Log.Type.Error)
            }
        }
        function E() {
            try {
                if (d("updateToolbar", "Called"),
                !w)
                    return;
                var e = MP.Tools.Config.Editor.toolBars.process;
                w.css("left", e.position.left + "px").css("top", e.position.top + "px").data("lastLeft", e.position.left).data("lastTop", e.position.top),
                e.width && w.css("width", e.width + "px")
            } catch (e) {
                d("updateToolbar", e, Log.Type.Error)
            }
        }
        function T() {
            try {
                d("initToolbar", "Called"),
                w = $("#RuleToolbar"),
                w.draggable({
                    cancel: "img",
                    start: function(e, t) {
                        Global.DisableHighlightingInChrome(!0)
                    },
                    stop: function(e, t) {
                        Global.DisableHighlightingInChrome(!1),
                        Global.UpdateLastPosition(w, t)
                    }
                }).resizable({
                    start: function(e, t) {
                        Global.DisableHighlightingInChrome(!0)
                    },
                    stop: function(e, t) {
                        Global.DisableHighlightingInChrome(!1)
                    }
                }).disableSelection().hide(),
                E();
                var t = [];
                w.find("img[ref]").each(function() {
                    var r = $(this).attr("ref")
                      , o = e.ComponentTypes[r]
                      , i = new o;
                    $(this).attr("title", i.Title + "\n\n" + i.ToolTip).attr("draggable", !1).draggable({
                        helper: "clone",
                        start: function() {
                            Global.DisableHighlightingInChrome(!0)
                        },
                        stop: function() {
                            Global.DisableHighlightingInChrome(!1)
                        }
                    }),
                    t.push(r)
                }),
                $("#preproc, #postproc").droppable({
                    accept: n.GetAcceptedComponents(t),
                    greedy: !0,
                    activeClass: "droppable-active",
                    hoverClass: "droppable-hover",
                    drop: function(e, t) {
                        var r = {
                            left: t.offset.left - $(this).offset().left,
                            top: t.offset.top - $(this).offset().top
                        };
                        c.AddComponent($(t.draggable), r)
                    }
                }),
                $(window).bind("scroll.RuleToolBar", function() {
                    w.is(":visible") && w.css("top", w.data("lastTop") + $(document).scrollTop() + "px")
                })
            } catch (e) {
                d("initToolbar", e, Log.Type.Error)
            }
        }
        function b(e) {
            try {
                if (d("addComponentsFromXmlString", "Called"),
                e = Utilities.Trim(e),
                !e || "<c>" != e.substring(0, 3) || "</c>" != e.substring(e.length - 4))
                    return;
                R = e,
                f(),
                e = $(Utilities.ParseXML("<str>" + e + "</str>"));
                var i = e.find("str>c")
                  , n = -1
                  , a = 0
                  , s = 1e7;
                i.each(function(e, r) {
                    r = $(r);
                    var o;
                    do
                        n++,
                        o = t.GetComponent(n);
                    while (o);var i = r.find(">n")
                      , l = i.text();
                    i.text(n),
                    r.data("oldID", l);
                    var c = r.find(">x")
                      , d = r.find(">y")
                      , u = parseInt(c.text())
                      , p = parseInt(d.text());
                    p < s && (a = u,
                    s = p)
                }),
                i.each(function(e, t) {
                    t = $(t);
                    var r = t.find(">x")
                      , i = t.find(">y")
                      , n = parseInt(r.text())
                      , l = parseInt(i.text())
                      , c = n - a + o.OffsetX
                      , d = l - s + o.OffsetY;
                    c = Utilities.SnapTo(c, 32),
                    d = Utilities.SnapTo(d, 26),
                    r.text(c),
                    i.text(d)
                }),
                i.each(function(e, t) {
                    t = $(t);
                    var r = t.find(">j");
                    r.each(function(e, t) {
                        t = $(t);
                        var r = t.text()
                          , o = "";
                        i.each(function(e, t) {
                            t = $(t);
                            var i = t.data("oldID");
                            if (r && r == i)
                                return o = t.find(">n").text(),
                                !1
                        }),
                        t.text(o)
                    })
                }),
                r.AppendXML(i),
                c.Load(),
                c.ClearSelected(),
                i.each(function(e, t) {
                    var r = $(t).find(">n").text();
                    c.AddSelected(r)
                })
            } catch (e) {
                d("addComponentsFromXmlString", e, Log.Type.Error)
            }
        }
        try {
            var S, L, w, G = "RuleMaker.", A = new l("Pre",y), P = new l("Post",C), x = null, M = [], R = "";
            return {
                Initialized: !1,
                CurrentProcess: "",
                Initialize: function() {
                    try {
                        if (d("Initialize", "Called"),
                        E(),
                        this.Initialized)
                            return;
                        S = $("#preproc"),
                        L = $("#postproc"),
                        RuleGraphics.Initialize(S.attr("id"), L.attr("id")),
                        c.SetCurrentProcess(S.attr("id")),
                        T(),
                        this.Initialized = !0
                    } catch (e) {
                        d("Initialize", e, Log.Type.Error)
                    }
                },
                Undo: function() {
                    d("Undo", "Called");
                    var e = "preproc" == c.CurrentProcess
                      , t = e ? A : P;
                    t.Undo()
                },
                Redo: function() {
                    d("Redo", "Called");
                    var e = "preproc" == c.CurrentProcess
                      , t = e ? A : P;
                    t.Redo()
                },
                ClearUndo: function() {
                    d("ClearUndo", "Called"),
                    A.Clear(),
                    P.Clear()
                },
                DeleteFromProperties: function() {
                    if (x) {
                        d("DeleteFromProp", "Called"),
                        f();
                        var e = t.GetComponent(x);
                        e.Delete(),
                        r.DeleteComponent(x),
                        t.Remove(x),
                        RuleGraphics.Refresh(),
                        x = null,
                        e = null
                    }
                },
                AddComponent: function(e, o) {
                    try {
                        d("AddComponent", "Called");
                        var i = $(e).attr("ref")
                          , n = v(i);
                        n.SetX(Utilities.SnapTo(o.left, 32)),
                        n.SetY(Utilities.SnapTo(o.top, 26)),
                        r.AddComponent(n.GetNode());
                        var s = new a;
                        s.Load(n),
                        s.AppendTo($("#" + r.CurrentProcess)),
                        n.SetIcon(s),
                        t.AddComponent(n, n.GetID())
                    } catch (e) {
                        d("AddComponent", e, Log.Type.Error)
                    }
                },
                Enable: function() {
                    try {
                        d("Enable", "Called"),
                        u(S),
                        u(L),
                        n.Enabled && !n.LockedBy && w.show()
                    } catch (e) {
                        d("Enable", e, Log.Type.Error)
                    }
                },
                Disable: function() {
                    try {
                        d("Disable", "Called"),
                        w.hide(),
                        p(S),
                        p(L),
                        t.Reset(),
                        S.html(""),
                        L.html(""),
                        RuleGraphics.ClearGraphics()
                    } catch (e) {
                        d("Disable", e, Log.Type.Error)
                    }
                },
                ToggleToolbar: function(e, t) {
                    try {
                        d("ToggleToolbar", "Called")
                    } catch (e) {
                        d("ToggleToolbar", e, Log.Type.Error)
                    }
                },
                GetCurrentComponent: function() {
                    return t.GetComponent(x)
                },
                HandleServerError: function(e, r, o) {
                    try {
                        if (e && r) {
                            d("HandleServerError", "Could not compile " + r, Log.Type.Error, !0);
                            var i = e.toLowerCase();
                            i = i.replace(/process/, "proc"),
                            c.SetCurrentProcess(i);
                            var n = null
                              , a = r.split("_").pop()
                              , s = t.GetComponent(a);
                            s && (s.HighlightAsError(!0),
                            n = {
                                Close: function() {
                                    $(this).dialog("close")
                                },
                                "Jump To The Component": function() {
                                    if ($(this).dialog("close"),
                                    s) {
                                        var e = s.Icon.GetImage();
                                        Global.ScrollToElement(e, null, function() {
                                            Global.ShakeElement(e)
                                        })
                                    }
                                }
                            })
                        } else
                            d("HandleServerError", o, Log.Type.Error, !0);
                        Global.ShowErrorMessage(o, "VRM Save Error", n)
                    } catch (e) {
                        d("HandleServerError", e, Log.Type.Error)
                    }
                },
                SelectThisOnlyIfNotSelected: function(e) {
                    this.IsSelected(e) || (this.ClearSelected(),
                    this.AddSelected(e))
                },
                IsSelected: function(e) {
                    return e && $.inArray(e, M) > -1
                },
                AddSelected: function(e) {
                    if (e && (Utilities.IsNumber(e) && (e = e.toString()),
                    !this.IsSelected(e))) {
                        var r = t.GetComponent(e);
                        r && (r.HighlightAsFound(!1),
                        r.HighlightAsError(!1),
                        r.HighlightAsWatchpoint(!1),
                        r.HighlightAsSelected(!0),
                        M.push(e))
                    }
                },
                Select: function(e) {
                    try {
                        d("SelectPart", "Called"),
                        c.ClearSelected();
                        for (var r = t.GetItemArray(), i = 0; i < r.length; i++) {
                            var n = r[i]
                              , a = !1;
                            switch (e) {
                            case "all":
                                a = !0;
                                break;
                            case "below":
                                a = n.GetY() > o.OffsetY;
                                break;
                            case "right":
                                a = n.GetX() > o.OffsetX;
                                break;
                            case "above":
                                a = n.GetY() < o.OffsetY;
                                break;
                            case "left":
                                a = n.GetX() < o.OffsetX
                            }
                            a && c.AddSelected(n.GetID())
                        }
                    } catch (e) {
                        d("SelectPart", e, Log.Type.Error)
                    }
                },
                ClearSelected: function() {
                    try {
                        d("ClearSelected", "Called");
                        for (var e = t.GetItemArray(), r = 0; r < e.length; r++) {
                            var o = e[r];
                            o.HighlightAsSelected(!1)
                        }
                        M = null,
                        M = []
                    } catch (e) {
                        d("ClearSelected", e, Log.Type.Error)
                    }
                },
                GetSelectedComponentsXmlString: function() {
                    try {
                        if (!g(!1))
                            return;
                        d("GetSelectedComponentsXmlString", "Called");
                        for (var e = "", t = 0; t < M.length; t++) {
                            var o = M[t];
                            e += r.GetComponent(o)
                        }
                        return e
                    } catch (e) {
                        d("GetSelectedComponentsXmlString", e, Log.Type.Error)
                    }
                },
                Copy: function(e) {
                    try {
                        d("Copy", "Called"),
                        R = c.GetSelectedComponentsXmlString(),
                        R && e && c.DeleteSelection()
                    } catch (e) {
                        d("Copy", e, Log.Type.Error)
                    }
                },
                Paste: function() {
                    try {
                        d("Paste", "Called"),
                        b(R)
                    } catch (e) {
                        d("Paste", e, Log.Type.Error)
                    }
                },
                Export: function(e) {
                    try {
                        d("Export", "Called"),
                        R = c.GetSelectedComponentsXmlString(),
                        R && e && c.DeleteSelection(),
                        Global.SetClipboard(R) || n.ShowAceEditorForm(R, "Export", "", null, null, {
                            language: "xml"
                        })
                    } catch (e) {
                        d("Export", e, Log.Type.Error)
                    }
                },
                Import: function() {
                    try {
                        d("Import", "Called");
                        var e = Global.GetClipboard();
                        e ? b(e) : n.ShowAceEditorForm(e, "Import", "", b, null, {
                            language: "xml"
                        })
                    } catch (e) {
                        d("Import", e, Log.Type.Error)
                    }
                },
                SwitchQueryComponent: function() {
                    if (c.Copy(),
                    R && (R.search("<t>SELECTQUERY</t>") != -1 || R.search("<t>INSERTUPDATEQUERY</t>") != -1)) {
                        R = Utilities.ReplaceAll(R, "<t>SELECTQUERY</t>", "<t>SQ</t>"),
                        R = Utilities.ReplaceAll(R, "<t>INSERTUPDATEQUERY</t>", "<t>IUQ</t>"),
                        R = Utilities.ReplaceAll(R, "<t>SQ</t>", "<t>INSERTUPDATEQUERY</t>"),
                        R = Utilities.ReplaceAll(R, "<t>IUQ</t>", "<t>SELECTQUERY</t>"),
                        c.DeleteSelection();
                        try {
                            var e = $(Utilities.ParseXML("<str>" + R + "</str>"))
                              , t = e.find("str>c");
                            r.AppendXML(t),
                            c.Load(),
                            c.ClearSelected(),
                            t.each(function(e, t) {
                                var r = $(t).find(">n").text();
                                c.AddSelected(r)
                            })
                        } catch (e) {
                            d("SwitchQueryComponent", e, Log.Type.Error)
                        }
                    }
                },
                DeleteSelection: function() {
                    try {
                        if (!g(!0))
                            return;
                        d("DeleteSelection", "Called");
                        for (var e = 0; e < M.length; e++) {
                            var o = M[e]
                              , i = t.GetComponent(o);
                            i && (i.Delete(),
                            i = null,
                            r.DeleteComponent(o),
                            t.Remove(o))
                        }
                        c.ClearSelected(),
                        RuleGraphics.Refresh()
                    } catch (e) {
                        d("DeleteSelection", e, Log.Type.Error)
                    }
                },
                DisconnectSelection: function() {
                    try {
                        if (!g(!0))
                            return;
                        d("DisconnectSelection", "Called");
                        for (var e = 0; e < M.length; e++) {
                            var r = M[e]
                              , o = t.GetComponent(r);
                            o && (o.SetJ1 && o.SetJ1(""),
                            o.SetJ2 && o.SetJ2(""))
                        }
                        RuleGraphics.Refresh()
                    } catch (e) {
                        d("DisconnectSelection", e, Log.Type.Error)
                    }
                },
                SnapToGrid: function() {
                    try {
                        if (!g(!0))
                            return;
                        d("SnapToGrid", "Called");
                        for (var e = 0; e < M.length; e++) {
                            var r = M[e]
                              , o = t.GetComponent(r);
                            if (o) {
                                var i, n, a, s;
                                i = o.GetX(),
                                n = Utilities.SnapTo(i, 32),
                                o.SetX(n),
                                a = n - i,
                                i = o.GetY(),
                                n = Utilities.SnapTo(i, 26),
                                o.SetY(n),
                                s = n - i,
                                o.Icon.MoveBy(a, s)
                            }
                        }
                        RuleGraphics.Refresh()
                    } catch (e) {
                        d("SnapToGrid", e, Log.Type.Error)
                    }
                },
                SetWatchpoints: function(e) {
                    try {
                        d("SetWatchpoints", "Called"),
                        M.length || M.push($(o.EventComponent).attr("id"));
                        for (var r = 0; r < M.length; r++) {
                            var i = M[r]
                              , n = t.GetComponent(i);
                            n && n.SetWatchpoint(e)
                        }
                    } catch (e) {
                        d("SetWatchpoints", e, Log.Type.Error)
                    }
                },
                ClearWatchpoints: function() {
                    try {
                        d("ClearWatchpoints", "Called");
                        for (var e = t.GetItemArray(), r = 0; r < e.length; r++) {
                            var o = e[r];
                            o.SetWatchpoint(!1),
                            o.UpdateWatchpoint()
                        }
                    } catch (e) {
                        d("ClearWatchpoints", e, Log.Type.Error)
                    }
                },
                GetSelected: function() {
                    return M
                },
                Load: function(e) {
                    try {
                        d("Load", "Called"),
                        "string" == typeof e && (e = Utilities.ParseXML(e)),
                        r.Load(e);
                        var t = c.CurrentProcess;
                        y(),
                        C(),
                        o.Add("#preproc", h, "preproc"),
                        o.Add("#postproc", h, "postproc"),
                        c.SetCurrentProcess(t),
                        c.Enable()
                    } catch (e) {
                        d("Load", e, Log.Type.Error)
                    }
                },
                SetCanvasHeight: function(e) {
                    try {
                        d("SetCanvasHeight", "Called");
                        var t = "preproc" == c.CurrentProcess ? S : L
                          , r = e || Utilities.ToNumber(t.css("height")) + MP.Tools.Config.Editor.tabs.process.extendBy;
                        t.css("height", r),
                        $("#" + c.CurrentProcess + "canvas").css("height", r),
                        RuleGraphics.Refresh()
                    } catch (e) {
                        d("SetCanvasHeight", e, Log.Type.Error)
                    }
                },
                AdjustCanvasHeight: function() {
                    try {
                        d("AdjustCanvasHeight", "Called");
                        for (var e = 0, r = t.GetItemArray(), o = 0; o < r.length; o++) {
                            var i = r[o]
                              , n = i.GetY();
                            e = n > e ? n : e
                        }
                        e = Utilities.SnapTo(e, 100) + 500,
                        c.SetCanvasHeight(e)
                    } catch (e) {
                        d("AdjustCanvasHeight", e, Log.Type.Error)
                    }
                },
                SetCurrentProcess: function(e, i) {
                    try {
                        return s.Reset(),
                        c.CurrentProcess = e,
                        r.CurrentProcess = e,
                        RuleGraphics.SetCurrentProcess(e),
                        t.SetCurrentProcess(e),
                        i && n.Enabled && o.UpdateActiveEditor(e),
                        e
                    } catch (e) {
                        d("SetCurrentProcess", e, Log.Type.Error)
                    }
                },
                ShowProperties: function(e) {
                    try {
                        d("ShowProperties", "Called"),
                        Utilities.IsString(e) || (e = $(e || o.EventComponent).attr("id"));
                        var r = t.GetComponent(e);
                        if (!r)
                            return;
                        var i = r.GetProperties()
                          , n = r.Title + " - ID: " + e;
                        PropertyEd.Show(i, this.DeleteFromProperties, n),
                        x = e
                    } catch (e) {
                        d("ShowProperties", e, Log.Type.Error)
                    }
                },
                ComplexArgs: function(e, t, r) {
                    this.GetProperties = e,
                    this.AddParam = t,
                    this.DeleteParam = r
                }
            }
        } catch (e) {
            d("Main", e, Log.Type.Error)
        }
    }
    ;
    return c
}),
define("RuleGraphics", ["IconMover", "RuleStorage", "RulesMaker", "RuleXML"], function(e, t, r, o) {
    var n = new function() {
        function a(e, t, r, o) {
            Log.Add(p + e, t, r, o)
        }
        function s(e, t) {
            try {
                C = !1,
                null != t && g.setColor(t),
                g.setStroke(2);
                for (var r = 10, o = 4, i = 0; i < e.length; i++) {
                    var n = e[i];
                    null != n.Color && g.setColor(n.Color),
                    g.drawLine(n.Start.X, n.Start.Y, n.Start.X, n.Start.Y + r);
                    var s = (n.Stop.X - n.Start.X) / 2;
                    0 == s && n.Stop.Y <= n.Start.Y && (s = -20),
                    g.drawLine(n.Start.X, n.Start.Y + r, n.Start.X + s, n.Start.Y + r),
                    g.drawLine(n.Start.X + s, n.Start.Y + r, n.Start.X + s, n.Stop.Y - r),
                    g.drawLine(n.Start.X + s, n.Stop.Y - r, n.Stop.X, n.Stop.Y - r),
                    g.drawLine(n.Stop.X, n.Stop.Y - r, n.Stop.X, n.Stop.Y);
                    var l = [n.Stop.X, n.Stop.X - o, n.Stop.X + o, n.Stop.X]
                      , c = [n.Stop.Y, n.Stop.Y - o, n.Stop.Y - o, n.Stop.Y];
                    g.fillPolygon(l, c)
                }
            } catch (e) {
                a("DrawLines", e, Log.Type.Error)
            }
        }
        function l(e) {
            try {
                var t = new jsGraphics(e + "canvas");
                return t.clear(),
                t
            } catch (e) {
                a("PrepareCanvas", e, Log.Type.Error)
            }
        }
        function c(e) {
            try {
                if (null == e || "" == e)
                    return;
                var t = $("#" + e)
                  , r = $("#" + e + "canvas");
                if (null == r.height())
                    return;
                t.css("margin-top", Utilities.ToNumber(r.height()) * -1)
            } catch (e) {
                a("AlignCanvas", e, Log.Type.Error)
            }
        }
        function d(e, r) {
            try {
                if (!e.GetJ1)
                    return;
                var o = [];
                for (o[0] = e.GetJ1(),
                null != e.GetJ2 && (o[1] = e.GetJ2()),
                i = 0; i < 2; i++)
                    if ("" != o[i]) {
                        var n = t.GetComponent(parseInt(o[i], 10));
                        if (null != n) {
                            var s = e.GetIcon().GetExitPoint()
                              , l = n.GetIcon().GetEntryPoint()
                              , c = 0 == i ? m : y;
                            r[r.length] = new u(s,l,c)
                        }
                    }
            } catch (e) {
                a("GetLines", e, Log.Type.Error)
            }
        }
        function u(e, t, r) {
            this.Start = e,
            this.Stop = t,
            this.Color = r
        }
        var p = "Graphics."
          , h = null
          , f = null
          , g = null
          , m = "#61AEF1"
          , y = "#9B9B9B"
          , C = !1;
        return {
            ClearGraphics: function() {
                try {
                    h.clear(),
                    f.clear(),
                    C = !0
                } catch (e) {
                    a("ClearGraphics", e, Log.Type.Error)
                }
            },
            Initialize: function(e, t) {
                try {
                    a("Initialize", "Called"),
                    h = l(e),
                    f = l(t)
                } catch (e) {
                    a("Initialize", e, Log.Type.Error)
                }
            },
            Point: function(e, t) {
                this.X = e,
                this.Y = t
            },
            ReDraw: function() {
                try {
                    if (r.GetSelected().length > 0)
                        return void (C || n.ClearGraphics());
                    var t, o = e.Ctrl, i = [], l = 0;
                    null != e.From && (t = e.FromJ1 ? m : y,
                    i[l] = new u(e.From,o.OldEntry),
                    l++),
                    null != e.J1 && (i[l] = new u(o.OldExit,e.J1),
                    l++),
                    null != e.J2 && (i[l] = new u(o.OldExit,e.J2),
                    l++),
                    s(i, "white"),
                    o.OldEntry = o.GetIcon().GetEntryPoint(),
                    o.OldExit = o.GetIcon().GetExitPoint(),
                    i.length = 0,
                    l = 0,
                    null != e.From && (t = e.FromJ1 ? m : y,
                    i[l] = new u(e.From,o.OldEntry,t),
                    l++),
                    null != e.J1 && (i[l] = new u(o.OldExit,e.J1,m),
                    l++),
                    null != e.J2 && (i[l] = new u(o.OldExit,e.J2,y),
                    l++),
                    s(i),
                    g.paint()
                } catch (e) {
                    a("ReDraw", e, Log.Type.Error)
                }
            },
            Refresh: function() {
                try {
                    if (null == g)
                        return void a("Refresh", "Attempting to refresh a null canvas", Log.Type.Warning);
                    if (null == o.CurrentProcess || "" == o.CurrentProcess)
                        return;
                    c(o.CurrentProcess),
                    g.clear();
                    var e = [];
                    $("#" + o.CurrentProcess).find(".icon").each(function() {
                        var r = $(this).attr("id")
                          , o = t.GetComponent(r);
                        d(o, e)
                    }),
                    s(e),
                    g.paint()
                } catch (e) {
                    a("Refresh", e, Log.Type.Error)
                }
            },
            SetCurrentProcess: function(e) {
                try {
                    g = "preproc" == e ? h : f,
                    setTimeout("RuleGraphics.Refresh()", 100)
                } catch (e) {
                    a("SetCurrentProcess", e, Log.Type.Error)
                }
            }
        }
    }
    ;
    return n
}),
define("AddressStandardization", ["Communication"], function(e) {
    $("head").append("<style>.address-suggestion-dialog {    text-align: left;}.address-suggestion-dialog .suggestions {    margin: 1em 0;}.address-suggestion-dialog .suggestions .suggestion {    border: 1px solid #4444FF;    margin: .5em;    padding: .75em;    float: left;    cursor: pointer;}.address-suggestion-dialog .suggestions .suggestion:hover {    background-color: #E2E2FF;}.address-suggestion-dialog .manual-entry {    margin: 1em .5em 0 .5em;}</style>");
    var t = function(e) {
        return e instanceof $ ? e : $("*[name=" + e + "]")
    }
      , r = function(e) {
        var r = {};
        return $.each(e, function(e, o) {
            r[e] = t(o)
        }),
        r
    }
      , o = function(e) {
        e = r(e);
        var t = {};
        return $.each(e, function(e, r) {
            $.trim(r.val()).length > 0 && (t[e] = r.val())
        }),
        t
    }
      , i = function(e, t) {
        e = r(e),
        $.each(e, function(e, r) {
            t[e] && r.val(t[e])
        })
    }
      , n = function(e, t) {
        e = r(e);
        var n = o(e);
        a(n, function(r, o) {
            var n = function() {
                e.Address1 && e.Address1.focus()
            };
            return r ? (n(),
            t(r)) : o ? (i(e, o),
            t(null, !0)) : (n(),
            t(null, !1))
        })
    }
      , a = function(t, r) {
        e.CustomRequest("ZP4Sugestion.max?" + $.param({
            AJAX_ACTION: "GetZP4",
            Address_IN: t.Address1,
            City_IN: t.City,
            State_IN: t.State,
            Zip_IN: t.Zip
        }), function(e) {
            var o = $.parseJSON(e);
            if ("1" == o.Valid)
                return r(null, {
                    Address1: o.Address_OUT,
                    City: o.City_OUT,
                    State: o.State_OUT,
                    Zip: o.Zip_OUT
                });
            if ("0" == o.SugCnt)
                return r("Invalid address");
            var i, n = [];
            for (i = 0; i < o.SugCnt; ++i)
                n.push({
                    Address1: o["A_" + i],
                    City: o["C_" + i],
                    State: o["S_" + i],
                    Zip: o["Z_" + i]
                });
            var i, a = function(e, t) {
                var r, o = ["Address1", "City", "State", "Zip"];
                for (r = 0; r < o.length; ++r)
                    if (e[o[r]] !== t[o[r]])
                        return !1;
                return !0
            };
            for (i = 0; i < n.length; ++i)
                if (a(n[i], t))
                    return r(null, n[i]);
            var s = "";
            s += "<p>Please select one of the following addresses or change your entered address manually:</p>",
            s += '<div class="suggestions"></div>',
            s += '<p><button class="manual-entry">Change Address Manually</button></p>';
            var l = $("<div/>").addClass("address-suggestion-dialog").html(s)
              , c = l.find(".suggestions")
              , d = l.find(".manual-entry")
              , u = function(e) {
                return $("<span/>").text(e).html()
            };
            $.each(n, function(e, t) {
                var r = $("<address/>").addClass("suggestion").data("suggestion-data", t).html("");
                r.append(u(t.Address1)).append("<br/>").append(u(t.City)).append(", ").append(u(t.State)).append(" ").append(u(t.Zip)),
                c.append(r)
            }),
            $(".suggestion", c).click(function() {
                l.dialog("destroy");
                var e = $(this).data("suggestion-data");
                r(null, e)
            }),
            d.click(function() {
                l.dialog("destroy"),
                r(null, null)
            }),
            l.dialog({
                title: "Address Suggestions",
                autoOpen: !0,
                width: 420
            })
        }, null)
    }
      , s = function(e, t) {
        if (0 === e.length)
            return t(null, !0);
        var r = e[0];
        n(r, function(r, o) {
            return r ? t(r) : o ? void s(e.slice(1), t) : t(null, !1)
        })
    };
    return {
        checkFullAddress: n,
        checkFullAddresses: s,
        checkAddress: a,
        getAddressValues: o,
        setAddressValues: i,
        getAddressElements: r
    }
}),
define("main", [], function() {
    function e(e) {
        e.fn.outerHTML = function() {
            try {
                return this[0].outerHTML ? this[0].outerHTML : e("<div>").append(this.eq(0).clone(!0)).html()
            } catch (e) {
                Log.Add("$.outerHTML", e, Log.Type.Error)
            }
        }
        ;
        var t = e.fn.outerHTML;
        e.fn.formOuterHTML = function() {
            return arguments.length ? t.apply(this, arguments) : (e("input,button", this).each(function() {
                this.setAttribute("value", this.value)
            }),
            e("textarea", this).each(function() {
                e(this).text(this.value)
            }),
            t.apply(this))
        }
        ;
        var r = e.fn.html;
        e.fn.formHTML = function() {
            return arguments.length ? r.apply(this, arguments) : (e("input,button", this).each(function() {
                this.setAttribute("value", this.value)
            }),
            e("textarea", this).each(function() {
                e(this).text(this.value)
            }),
            r.apply(this))
        }
        ,
        e.expr[":"].focus = function(e) {
            return e === document.activeElement && (e.type || e.href)
        }
    }
    function t() {
        var r = $;
        "1.4.3" != r().jquery ? setTimeout(t, 500) : e(r)
    }
    require(["MP", "Log", "Browser", "PropertyEd", "Communication", "Utilities", "Helper", "Global", "RulesMaker", "RuleGraphics", "AddressStandardization", "page/comp/ValidatorContainer", "ReqList", "WatchList", "AjaxTab", "../ckeditor/ckeditor"], function() {
        var e = [{
            n: "MP",
            f: !1
        }, {
            n: "Log",
            f: !0
        }, {
            n: "Browser",
            f: !0
        }, {
            n: "PropertyEd",
            f: !1
        }, {
            n: "Communication",
            f: !0
        }, {
            n: "Utilities",
            f: !0
        }, {
            n: "Helper",
            f: !0
        }, {
            n: "Global",
            f: !0
        }, {
            n: "RulesMaker",
            f: !0
        }, {
            n: "RuleGraphics",
            f: !1
        }, {
            n: "AddressStandardization",
            f: !1
        }, {
            n: "Validator",
            f: !0
        }, {
            n: "ReqList",
            f: !0
        }, {
            n: "WatchList",
            f: !0
        }, {
            n: "AjaxTab",
            f: !0
        }, {
            n: "ckeditor",
            f: !1
        }];
        $.each(arguments, function(t, r) {
            var o = e[t];
            if (o) {
                window[o.n] = r;
                try {
                    o.f && Object.preventExtensions(r)
                } catch (e) {}
            }
        }),
        $(document).ready(function() {
            try {
                t();
                var e = location.href;
                e.indexOf("sessionexpired=true") > -1 && Global.ShowErrorMessage($("<h3>Your session has expired</h3><p>Due to inactivity on the system your session has expired. Please login to start a new session.</p>")),
                window.$Spelling && (window.$Spelling.ServerModel = "php"),
                window.GlobalScript || (window.GlobalScript = {
                    Origin: "Internal",
                    OnLoad: function() {}
                });
                var r = MP.Events.onMpCoreLoaded || $.noop;
                r()
            } catch (e) {
                Log.Add("main.ready", e, Log.Type.Error)
            }
        })
    })
}),
define("Helper", ["PageHelper"], function(e) {
    var t = new function() {
        this.GetEditorComponent = function(t) {
            return e.GetEditorComponent(t)
        }
    }
    ;
    return t
}),
define("PageHelper", ["Storage", "ContextMenu", "ContextMenuItems", "Undo"], function(e, t, r, o) {
    var i, n = {
        EditorCheckBox: "page/comp/EditorCheckBox",
        EditorDropDown: "page/comp/EditorDropDown",
        EditorLabel: "page/comp/EditorLabel",
        EditorLink: "page/comp/EditorLink",
        EditorDiv: "page/comp/EditorDiv",
        EditorMemo: "page/comp/EditorMemo",
        EditorRadio: "page/comp/EditorRadio",
        EditorSubmitButton: "page/comp/EditorSubmitButton",
        EditorText: "page/comp/EditorText",
        TransferList: "page/comp/TransferList",
        EditableContent: "page/comp/EditableContent",
        DynamicContainer: "page/comp/DynamicContainer",
        StaticContainer: "page/comp/StaticContainer",
        ScriptingContainer: "page/comp/ScriptingContainer",
        ValidationContainer: "page/comp/ValidationContainer"
    }, a = [], s = [];
    for (i in n)
        n.hasOwnProperty(i) && (a.push(n[i]),
        s.push(i));
    var l = {};
    require(a, function() {
        for (var e = 0; e < s.length; ++e)
            l[s[e]] = arguments[e]
    });
    var c, d;
    require(["Editor", "HtmlEditor"], function(e, t) {
        c = e,
        d = t
    });
    var u = new function(i) {
        function n(e, t, r, o) {
            Log.Add(x + e, t, r, o)
        }
        function a(e, t) {
            u.Reload(e, t)
        }
        function s(e, t, r) {
            try {
                n("createComponent", "Called");
                var o = ""
                  , i = l[e]
                  , a = new i;
                if (!a)
                    throw "A component '" + e + "' could not be created!";
                if (a.NameRequired)
                    if ("TransferList" == e) {
                        if (o = t || Utilities.PromptForName(!1),
                        o == Utilities.ModalResult.Cancel || o == Utilities.ModalResult.Empty)
                            return !1
                    } else
                        o = e.replace("Editor", ""),
                        o = t || o,
                        r || (o = u.MakeUniquePageID(o));
                return a.Create(o),
                a.GetControl()[0][e] = a,
                a
            } catch (e) {
                n("createComponent", e, Log.Type.Error)
            }
        }
        function p(e, t) {
            try {
                if (e) {
                    n("AddStoredComponent", "Called");
                    var r = e.GetControl()
                      , o = g(r, t);
                    D.AddComponent(e, o)
                }
            } catch (e) {
                n("AddStoredComponent", e, Log.Type.Error)
            }
        }
        function h(e, t) {
            try {
                var r = u.GetEditorComponent(e);
                return r.EditMode(),
                p(r, t),
                r
            } catch (e) {
                n("AddEditorToComponent", e, Log.Type.Error, !0)
            }
        }
        function f(e) {
            try {
                var t = u.GetEditorComponent(e);
                if (!t)
                    return;
                var r = u.GetComponentID(e);
                D.Remove(r),
                t.HighlightAsSelected(!1),
                t.HighlightAsFound(!1),
                t.HighlightAsError(!1),
                t.DefaultMode();
                var o = $(e)
                  , i = o.attr("Class");
                i = Utilities.RemoveWhiteSpaces(i),
                i = Utilities.Trim(i),
                o.attr("Class", i),
                o.removeAttr("origL"),
                o.removeAttr("origT"),
                o.removeAttr("unselectable"),
                o.removeAttr("aria-disabled"),
                "" == o.attr("condition") && o.removeAttr("condition"),
                o.removeClass("ui-resizable-autohide"),
                o.removeClass("ui-state-disabled"),
                o.removeClass("ui-activeBox"),
                o.find(".ui-selectee").removeClass("ui-selectee")
            } catch (e) {
                n("RemoveEditorFromComponent", e, Log.Type.Error, !0)
            }
        }
        function g(e, t) {
            try {
                var r = $(e)
                  , o = r.attr("mp-id");
                return o && !t ? o = Utilities.ToNumber(o) : (o = d.FindFirstAvailableID(),
                r.attr("mp-id", o)),
                n("SetComponentID", "ID=" + o),
                o
            } catch (e) {
                n("SetComponentID", e, Log.Type.Error)
            }
        }
        function m() {
            try {
                if (!M.length) {
                    var e = t.EventComponent
                      , r = u.GetComponentID(e);
                    r || (r = u.GetParentID(e)),
                    u.AddSelected(r)
                }
            } catch (e) {
                n("EnsureSelection", e, Log.Type.Error)
            }
        }
        function y(e, t) {
            var r = h(e, !0);
            if (!t) {
                var o;
                r.GetID && (o = r.GetID(),
                o = u.MakeUniquePageID(o),
                r.SetID(o)),
                r.GetName && (o = r.GetName(),
                o = u.MakeUniquePageID(o),
                r.SetName(o))
            }
            return u.AddSelected(r),
            r
        }
        function C(e, t) {
            var r = $('<div class="mp-help"/>');
            r.appendTo(e),
            r.bind("click", function() {
                var e = window.open(t, "helplink", "width=500,height=500,scrollbars=1,resizable=1,toolbar=0,location=0,menubar=0,status=0");
                e.focus()
            });
            var o = e.attr("ref");
            if ($.inArray(o, ["EditorText", "EditorMemo", "EditorDropDown", "EditorSubmitButton"]) > -1) {
                var i = "EditorSubmitButton" == o ? 8 : 2
                  , n = e.find(":input");
                r.css({
                    top: n.position().top + n.outerHeight() / 2 - r.outerHeight() / 2 + 1,
                    left: n.position().left + n.outerWidth() + i
                })
            }
            return r
        }
        function v(e, r, o, i) {
            try {
                if (!e)
                    return;
                r && r.length || (r = t.ActiveBox),
                u.ClearSelected(),
                I = e,
                e = u.CleanHtmlForEditor(e);
                var a = $(e)
                  , s = minY = 9999999
                  , l = [];
                if (a.each(function(e, t) {
                    var i = $(a[e])
                      , n = i.html();
                    if (n) {
                        var c = i.attr("mp-id")
                          , d = u.GetStoredComponent(c);
                        if (d && o) {
                            var p = d.GetControl();
                            p.after(i),
                            u.DeleteEditorComponents(p)
                        } else
                            i.appendTo(r);
                        var p = y(i, o);
                        i.find(".component").each(function() {
                            y(this, o)
                        });
                        var h = p.GetLeft();
                        s = h < s ? h : s;
                        var f = p.GetTop();
                        minY = f < minY ? f : minY,
                        l.push(p)
                    }
                }),
                o || i)
                    return l;
                for (var c = u.GetComponentRef(r), d = 0; d < l.length; d++) {
                    var p = l[d];
                    if ("StaticContainer" == c) {
                        var h = MP.Tools.Config.Editor.html.snap
                          , f = p.GetLeft() - s + t.OffsetX - 5
                          , g = p.GetTop() - minY + t.OffsetY - 25;
                        p.SetLeft(Utilities.SnapTo(f, h[0])),
                        p.SetTop(Utilities.SnapTo(g, h[1]))
                    } else {
                        var m = p.GetControl();
                        m.css("position", "relative").css("left", "").css("top", "").css("width", ""),
                        p.Refresh()
                    }
                }
                return l
            } catch (e) {
                n("addComponentsFromHtmlString", e, Log.Type.Error)
            }
        }
        function E(e) {
            try {
                var t = "";
                m();
                for (var r = 0; r < M.length; r++) {
                    var o = M[r]
                      , i = u.GetStoredComponent(o)
                      , a = i.GetControl()
                      , s = u.GetComponentRef(a);
                    $.inArray(s, ["EditableContent"]) > -1 || (u.RemoveEditorFromComponents(a, !0),
                    t += a.formOuterHTML(),
                    e ? a.remove() : u.AddEditorToComponents(a, !0))
                }
                return u.ClearSelected(),
                t = u.CleanHtmlAfterEditor(t)
            } catch (e) {
                n("GetHtmlOfSelectedComponents", e, Log.Type.Error)
            }
        }
        function T() {
            for (var e = 0; e < M.length; e++) {
                var t = M[e]
                  , r = u.GetStoredComponent(t)
                  , o = r.GetControl()
                  , i = u.GetComponentRef(o);
                if (!($.inArray(i, ["EditableContent"]) > -1) && (i = u.GetParentRef(o),
                $.inArray(i, ["EditableContent", "StaticContainer", "DynamicContainer"]) > -1))
                    return t = u.GetParentID(o)
            }
        }
        function b(e) {
            var t = T()
              , r = E(e);
            return e && R.Add(r, t),
            r
        }
        function S() {
            try {
                if (n("updateToolbar", "Called"),
                !A)
                    return;
                var e = MP.Tools.Config.Editor.toolBars.page;
                A.css("left", e.position.left + "px").css("top", e.position.top + "px").data("lastLeft", e.position.left).data("lastTop", e.position.top),
                e.width && A.css("width", e.width + "px")
            } catch (e) {
                n("updateToolbar", e, Log.Type.Error)
            }
        }
        function L() {
            try {
                n("initToolbar", "Called"),
                A = $("#ComponentToolbar"),
                A.draggable({
                    cancel: "img",
                    start: function(e, t) {
                        Global.DisableHighlightingInChrome(!0)
                    },
                    stop: function(e, t) {
                        Global.DisableHighlightingInChrome(!1),
                        Global.UpdateLastPosition(A, t)
                    }
                }).resizable({
                    start: function(e, t) {
                        Global.DisableHighlightingInChrome(!0)
                    },
                    stop: function(e, t) {
                        Global.DisableHighlightingInChrome(!1)
                    }
                }).disableSelection().hide(),
                S(),
                A.find("img[ref]").each(function() {
                    $(this).attr("draggable", !1).draggable({
                        helper: "clone",
                        start: function() {
                            Global.DisableHighlightingInChrome(!0)
                        },
                        stop: function() {
                            Global.DisableHighlightingInChrome(!1)
                        }
                    })
                }),
                $(window).bind("scroll.CompToolBar", function() {
                    A.is(":visible") && A.css("top", A.data("lastTop") + $(document).scrollTop() + "px")
                })
            } catch (e) {
                n("initToolbar", e, Log.Type.Error)
            }
        }
        function w() {
            P.find("#FooterSeparator").length || P.append("<div id='FooterSeparator'></div>")
        }
        function G() {
            try {
                var e, t = new r;
                return e = t.Add("Edit >"),
                t.Add("Copy [Ctrl+C]", function() {
                    u.Copy(!1)
                }, e),
                t.Add("Cut [Ctrl+X]", function() {
                    u.Copy(!0)
                }, e),
                t.Add("Paste [Ctrl+V]", function() {
                    u.Paste()
                }, e),
                t.Add("Copy (export)", function() {
                    u.Export(!1)
                }, e),
                t.Add("Cut (export)", function() {
                    u.Export(!0)
                }, e),
                t.Add("Paste (import)", function() {
                    u.Import()
                }, e),
                e = t.Add("Select >"),
                t.Add("All [Ctrl+A]", function() {
                    c.Select("all")
                }, e),
                t.Add("Below [Ctrl+B]", function() {
                    c.Select("below")
                }, e),
                t.Add("Right [Ctrl+R]", function() {
                    c.Select("right")
                }, e),
                t.Add("Above", function() {
                    c.Select("above")
                }, e),
                t.Add("Left", function() {
                    c.Select("left")
                }, e),
                e = t.Add("Component >"),
                t.Add("Properties [Ctrl+P]", function() {
                    c.ShowProperties()
                }, e),
                t.Add("Delete [Del]", function() {
                    u.DeleteSelection()
                }, e),
                t.Add("HTML [Ctrl+H]", function() {
                    u.EditHTML()
                }, e),
                t.Add("Duplicate", function() {
                    u.Duplicate()
                }, e),
                t.Add("Questionnaire", function() {
                    u.Questionnaire()
                }, e),
                R.CanUndo() && t.Add("Undo [Ctrl+Z]", u.Undo, e),
                e = t.Add("Position >"),
                t.Add("Snap to Grid", function() {
                    u.SnapToGrid()
                }, e),
                t.Add("Align Left", function() {
                    u.AlignLeft()
                }, e),
                t.Add("Align Top", function() {
                    u.AlignTop()
                }, e),
                t.Add("Align Right", function() {
                    u.AlignRight()
                }, e),
                t.Add("Set Left", function() {
                    u.SetProperty("SetLeft", u.GetMost("left") || 10, "Left")
                }, e),
                t.Add("Set Top", function() {
                    u.SetProperty("SetTop", u.GetMost("top") || 10, "Top")
                }, e),
                t.Add("Space Vertically", function() {
                    u.SpaceVertically()
                }, e),
                t.Add("Space Horizontally", function() {
                    u.SpaceHorizontally()
                }, e),
                t.Add("Sort Tab Index", function() {
                    u.SortTabIndex()
                }, e),
                e = t.Add("Property >"),
                t.Add("Required", function() {
                    u.SetProperty("SetRequired", !0, "Required")
                }, e),
                t.Add("Width", function() {
                    u.SetProperty("SetWidth", 100, "Width")
                }, e),
                t.Add("Height", function() {
                    u.SetProperty("SetHeight", 50, "Height")
                }, e),
                t.Add("Caption", function() {
                    u.SetProperty("SetCaption", "", "Caption")
                }, e),
                t.Add("Tooltip", function() {
                    u.SetProperty("SetTooltip", "Please enter a...", "Tooltip")
                }, e),
                t.Add("Comment", function() {
                    u.SetProperty("SetComment", "", "Comment")
                }, e),
                t.Add("Name", function() {
                    u.SetProperty("SetName", "Component1", "Name")
                }, e),
                t.Add("ID", function() {
                    u.SetProperty("SetID", "Component1", "ID")
                }, e),
                t.Add("Type", function() {
                    u.SetProperty("SetType", "text", "Type")
                }, e),
                t.Add("Server Cond.", function() {
                    u.SetProperty("SetSvrCondition", "", "Server Condition")
                }, e),
                t.Add("Client Cond.", function() {
                    u.SetProperty("SetCliCondition", "", "Client Condition")
                }, e),
                t.Add("Tab Index", function() {
                    u.SetProperty("SetTabIndex", 1, "Tab Index")
                }, e),
                t.Add("Valueless Attr.", function() {
                    u.SetProperty("SetValueLessAttrs", "", "Valueless Attributes")
                }, e),
                t.Add("Style", function() {
                    u.SetProperty("SetStyle", "", "Style")
                }, e),
                t.Add("Class", function() {
                    u.SetProperty("SetClass", "Default", "Class")
                }, e),
                t.Add("Value", function() {
                    u.SetProperty("SetValue", "1", "Value")
                }, e),
                t.Add("Size", function() {
                    u.SetProperty("SetSize", "", "Size")
                }, e),
                t.Add("Help Link", function() {
                    u.SetProperty("SetHelpLink", "../../help.html", "Size")
                }, e),
                t.Add("Options", function() {
                    u.SetProperty("SetOptions", "<option value='1'>Text</option>", "Options")
                }, e),
                t.Add("Multi Select", function() {
                    u.SetProperty("SetMultiSelect", !0, "Multi Select")
                }, e),
                t.Add("Target", function() {
                    u.SetProperty("SetTarget", "Communication.LinkRequest();", "Target")
                }, e),
                t.Add("Flipped", function() {
                    u.SetProperty("SetFlipped", !0, "Flipped")
                }, e),
                e = t.Add("Search >"),
                t.Add("Search... [Ctrl+Shift+F]", function() {
                    c.Search()
                }, e),
                t.Add("Clear", function() {
                    c.ClearSearch()
                }, e),
                e = t.Add("File >"),
                t.Add("Help... [F1]", c.ShowHelp, e),
                c.Enabled && !c.LockedBy && (t.Add("Quick Save [Ctrl+S]", function() {
                    PropertyEd.QuickSave()
                }, e),
                t.Add("Save & Exit", function() {
                    PropertyEd.Save()
                }, e)),
                t.Add("Exit... [Ctrl+Q]", function() {
                    PropertyEd.Close()
                }, e),
                t.GetHTML()
            } catch (e) {
                n("makeContextMenu", e, Log.Type.Error)
            }
        }
        try {
            var A, P, x = "PgHelper.", M = [], R = new o("Page",a), D = new e("Page"), I = "", N = "", k = null;
            return {
                Initialized: !1,
                Loaded: !1,
                Load: function(e) {
                    try {
                        if (!this.Initialized)
                            return;
                        n("Load", "Called"),
                        e != i && (e = this.CleanHtmlForEditor(e),
                        P.html(e),
                        w()),
                        t.Add("#rightColumn", G, "html"),
                        this.AddEditorToComponents(P);
                        var r = P.find("#rightColumn");
                        r.bind("mousedown", function(e) {
                            t.UpdatePossition(e, "html")
                        }),
                        r.delegate(".component", "dblclick", function(e) {
                            e.stopPropagation(),
                            c.ShowProperties(this)
                        }),
                        r.delegate(".EditorMemo", "click", function(e) {
                            e.stopPropagation(),
                            $(this).find("textarea").focus()
                        }),
                        this.Loaded = !0
                    } catch (e) {
                        n("Load", e, Log.Type.Error, !0)
                    }
                },
                Save: function() {
                    try {
                        if (!this.Initialized)
                            return;
                        n("Save", "Called"),
                        this.RemoveEditorFromComponents(P),
                        this.ClearStoredComponents();
                        var e = P.find("#rightColumn");
                        e.undelegate(".component").undelegate(".EditorMemo").unbind("mousedown").selectable("destroy");
                        var t = P.formHTML();
                        return t = this.CleanHtmlAfterEditor(t),
                        this.Loaded = !1,
                        t
                    } catch (e) {
                        n("Save", e, Log.Type.Error, !0)
                    }
                },
                Clear: function() {
                    P.html("")
                },
                Reload: function(e, t) {
                    n("Reload", "Called");
                    var r = $('[mp-id="' + t + '"]');
                    v(e, r, !0)
                },
                Container: function() {
                    return P
                },
                Initialize: function() {
                    S(),
                    this.Initialized || (P = $("#middle"),
                    L(),
                    this.Initialized = !0)
                },
                Enable: function() {
                    try {
                        if (!this.Initialized)
                            return;
                        n("Enable", "Called"),
                        A.show(),
                        this.Enabled = !0
                    } catch (e) {
                        n("Enable", e, Log.Type.Error, !0)
                    }
                },
                Disable: function() {
                    try {
                        n("Disable", "Called"),
                        A.hide(),
                        this.Enabled = !1
                    } catch (e) {
                        n("Disable", e, Log.Type.Error, !0)
                    }
                },
                Search: function(e, t) {
                    var r = D.GetItemArray();
                    e ? n("Search", "Searching " + r.length + " HTML elements for '" + e + "'", Log.Type.Debug) : n("Search", "Clearing", Log.Type.Info),
                    $.each(r, function() {
                        var r = this;
                        try {
                            r.Search(e, t),
                            r.HighlightAsError(!1)
                        } catch (e) {
                            n("BadComponent", r, Log.Type.Search),
                            r.HighlightAsError(!0)
                        }
                    })
                },
                ClearStoredComponents: function(e) {
                    n("ClearStoredComponents", "Called"),
                    e = $(e),
                    e.length ? e.find(".component").each(function() {
                        var e = u.GetComponentID(this);
                        D.Remove(e)
                    }) : D.Reset()
                },
                GetStoredComponent: function(e) {
                    try {
                        return D.GetComponent(e)
                    } catch (e) {
                        n("GetStoredComponent", e, Log.Type.Error)
                    }
                },
                CreateEditorComponent: function(e, t, r) {
                    try {
                        if (!e)
                            throw "No reference!";
                        n("CreateEditorComponent", "Called");
                        var o = s(e, t, r);
                        return p(o),
                        o
                    } catch (e) {
                        n("CreateEditorComponent", e, Log.Type.Error)
                    }
                },
                DeleteEditorComponents: function(e) {
                    try {
                        var t = $(e || k);
                        if (!t.length)
                            return;
                        n("DeleteEditorComponents", "Called"),
                        u.ClearSelected(),
                        u.AddSelected(u.GetEditorComponent(t)),
                        b(!0)
                    } catch (e) {
                        n("DeleteEditorComponents", e, Log.Type.Error)
                    }
                },
                GetEditorComponent: function(e) {
                    try {
                        e = $(e || k);
                        var t = u.GetComponentRef(e);
                        if (!t)
                            throw "Missing ref attribute!";
                        var r = null
                          , o = e[0];
                        try {
                            if (r = o[t],
                            !r)
                                throw "Error!";
                            return r
                        } catch (n) {
                            var i = l[t];
                            if (!i)
                                throw 'The control of type "' + t + '" not initialized!';
                            return r = new i,
                            r.Load(e),
                            o[t] = r,
                            r
                        }
                    } catch (t) {
                        n("GetEditorComponent", t.message || t + " " + Utilities.IdentifyChildren(e), Log.Type.Error)
                    }
                },
                MakeUniquePageID: function(e, t) {
                    if (!e)
                        return "";
                    for (var r, o = e.replace(/\d+$/, ""), i = o, n = t || 0, a = 0, s = $("#rightColumn"); ; ) {
                        if (r = s.find("#" + i).length,
                        r <= n)
                            break;
                        a++,
                        i = o + a.toString()
                    }
                    return i
                },
                GetComponentRefByID: function(e) {
                    var t = u.GetStoredComponent(e)
                      , r = t.GetControl()
                      , o = u.GetComponentRef(r);
                    return o
                },
                GetParentRef: function(e) {
                    try {
                        var t = $(e)[0].parentNode
                          , r = u.GetComponentRef(t);
                        return r
                    } catch (e) {
                        n("GetParentRef", e, Log.Type.Error)
                    }
                },
                GetParentID: function(e) {
                    try {
                        var t = $(e)[0].parentNode
                          , r = u.GetComponentID(t);
                        return r
                    } catch (e) {
                        n("GetParentID", e, Log.Type.Error)
                    }
                },
                GetComponentRef: function(e) {
                    try {
                        return $(e).attr("ref")
                    } catch (e) {
                        n("GetComponentRef", e, Log.Type.Error)
                    }
                },
                GetComponentID: function(e) {
                    try {
                        return $(e).attr("mp-id")
                    } catch (e) {
                        n("GetComponentID", e, Log.Type.Error)
                    }
                },
                IsSelected: function(e) {
                    return e && $.inArray(e, M) > -1
                },
                GetSelected: function() {
                    return M
                },
                AddSelected: function(e) {
                    if (e) {
                        if (Utilities.IsObject(e)) {
                            var t = e;
                            e = u.GetComponentID(t.GetControl())
                        } else
                            var t = u.GetStoredComponent(e);
                        u.IsSelected(e) || t && t.HighlightAsSelected && (t.HighlightAsSelected(!0),
                        M.push(e))
                    }
                },
                Select: function(e) {
                    try {
                        n("Select", "Called"),
                        u.ClearSelected();
                        var r = t.EventComponent
                          , o = u.GetComponentRef(r);
                        if ($.inArray(o, ["StaticContainer"]) == -1)
                            return;
                        var i = u.GetComponentID(r);
                        if (!i)
                            return;
                        for (var a = D.GetItemArray(), s = 0; s < a.length; s++) {
                            var l = a[s]
                              , c = l.GetControl()
                              , d = u.GetParentID(c)
                              , p = u.GetComponentRef(c)
                              , h = !1;
                            if (d == i && !p.match(/Container/)) {
                                switch (e) {
                                case "all":
                                    h = !0;
                                    break;
                                case "below":
                                    h = l.GetTop && l.GetTop() > t.OffsetY - 30;
                                    break;
                                case "right":
                                    h = l.GetLeft && l.GetLeft() > t.OffsetX;
                                    break;
                                case "above":
                                    h = l.GetTop && l.GetTop() < t.OffsetY - 30;
                                    break;
                                case "left":
                                    h = l.GetLeft && l.GetLeft() < t.OffsetX
                                }
                                h && u.AddSelected(l)
                            }
                        }
                    } catch (e) {
                        n("SelectBelow", e, Log.Type.Error)
                    }
                },
                ClearSelected: function() {
                    try {
                        n("ClearSelected", "Called");
                        for (var e = 0; e < M.length; e++) {
                            var t = u.GetStoredComponent(M[e]);
                            t && t.HighlightAsSelected && t.HighlightAsSelected(!1)
                        }
                        M = null,
                        M = []
                    } catch (e) {
                        n("ClearSelected", e, Log.Type.Error)
                    }
                },
                SnapToGrid: function() {
                    try {
                        n("SnapToGrid", "Called"),
                        m();
                        for (var e = MP.Tools.Config.Editor.html.snap, t = 0; t < M.length; t++) {
                            var r = u.GetStoredComponent(M[t]);
                            if (r) {
                                var o = r.GetLeft();
                                o = Utilities.SnapTo(o, e[0]),
                                r.SetLeft(o);
                                var i = r.GetTop();
                                i = Utilities.SnapTo(i, e[1]),
                                r.SetTop(i)
                            }
                        }
                    } catch (e) {
                        n("SnapToGrid", e, Log.Type.Error)
                    }
                },
                GetMost: function(e) {
                    if (m(),
                    !M.length)
                        return 0;
                    e = e.toLowerCase();
                    var t, r, o, i = 9999999;
                    for (t = 0; t < M.length; t++)
                        r = u.GetStoredComponent(M[t]),
                        r && (o = "top" == e ? r.GetTop() : r.GetLeft(),
                        i = o < i ? o : i);
                    return i
                },
                AlignLeft: function() {
                    try {
                        n("AlignLeft", "Called");
                        var e, t, r = u.GetMost("left"), o = MP.Tools.Config.Editor.html.snap;
                        for (r = Utilities.SnapTo(r, o[0]),
                        e = 0; e < M.length; e++)
                            t = u.GetStoredComponent(M[e]),
                            t && t.SetLeft(r)
                    } catch (e) {
                        n("AlignLeft", e, Log.Type.Error)
                    }
                },
                AlignRight: function() {
                    try {
                        n("AlignRight", "Called"),
                        m();
                        var e, t, r, o, i, a = 0;
                        for (e = 0; e < M.length; e++)
                            t = u.GetStoredComponent(M[e]),
                            t && (r = t.GetControl(),
                            o = r.width(),
                            i = t.GetLeft() + o,
                            a = i > a ? i : a);
                        var s = MP.Tools.Config.Editor.html.snap;
                        for (a = Utilities.SnapTo(a, s[0]),
                        e = 0; e < M.length; e++)
                            t = u.GetStoredComponent(M[e]),
                            t && (r = t.GetControl(),
                            o = r.width(),
                            t.SetLeft(a - o))
                    } catch (e) {
                        n("AlignRight", e, Log.Type.Error)
                    }
                },
                AlignTop: function() {
                    try {
                        n("AlignTop", "Called");
                        var e, t, r = u.GetMost("top"), o = MP.Tools.Config.Editor.html.snap;
                        for (r = Utilities.SnapTo(r, o[1]),
                        e = 0; e < M.length; e++)
                            t = u.GetStoredComponent(M[e]),
                            t && t.SetTop(r)
                    } catch (e) {
                        n("AlignTop", e, Log.Type.Error)
                    }
                },
                SpaceVertically: function() {
                    try {
                        n("SpaceVertically", "Called"),
                        m(),
                        jPrompt("Please enter a vertical spacing between tops of the selected components", 40, "Space Vertically", function(e) {
                            if (null != e) {
                                var t, r, o = [];
                                for (t = 0; t < M.length; t++)
                                    r = u.GetStoredComponent(M[t]),
                                    r && o.push(r);
                                o.sort(function(e, t) {
                                    return e.GetTop() - t.GetTop()
                                });
                                var i, n, a, s = Utilities.ToNumber(e);
                                for (t = 0; t < o.length; t++)
                                    r = o[t],
                                    a = r.GetTop(),
                                    0 == t ? (i = a,
                                    n = a) : n != a && (i += s,
                                    n = a),
                                    r.SetTop(i)
                            }
                        })
                    } catch (e) {
                        n("SpaceVertically", e, Log.Type.Error)
                    }
                },
                SpaceHorizontally: function() {
                    try {
                        n("SpaceHorizontally", "Called"),
                        m(),
                        jPrompt("Please enter a horizontal spacing between left sides of the selected components", 100, "Space Horizontally", function(e) {
                            if (null != e) {
                                var t, r, o = [];
                                for (t = 0; t < M.length; t++)
                                    r = u.GetStoredComponent(M[t]),
                                    r && o.push(r);
                                o.sort(function(e, t) {
                                    return e.GetLeft() - t.GetLeft()
                                });
                                var i, n, a, s = Utilities.ToNumber(e);
                                for (t = 0; t < o.length; t++)
                                    r = o[t],
                                    a = r.GetLeft(),
                                    0 == t ? (i = a,
                                    n = a) : n != a && (i += s,
                                    n = a),
                                    r.SetLeft(i)
                            }
                        })
                    } catch (e) {
                        n("SpaceHorizontally", e, Log.Type.Error)
                    }
                },
                Duplicate: function() {
                    try {
                        n("Duplicate", "Called"),
                        m();
                        var e = T()
                          , t = $('[mp-id="' + e + '"]')
                          , r = b(!1);
                        if (!r)
                            return;
                        jPrompt("Please enter how many copies and their vertical spacing", "5, 20", "Duplicate Component", function(e) {
                            if (null != e) {
                                var o = e.split(",")
                                  , i = o.length > 0 ? parseInt(o[0]) : 0
                                  , n = o.length > 1 ? parseInt(o[1]) : 0
                                  , a = 0;
                                if (i) {
                                    n = n || 20;
                                    for (var s = 0; s < i; s++) {
                                        var l = v(r, t, !1, !0);
                                        a += n;
                                        for (var c = 0; c < l.length; c++) {
                                            var d = l[c]
                                              , p = d.GetControl()
                                              , h = u.GetParentRef(p);
                                            "StaticContainer" == h ? d.SetTop(d.GetTop() + a) : (p.css("position", "relative").css("left", "").css("top", "").css("width", ""),
                                            d.Refresh())
                                        }
                                    }
                                    u.ClearSelected()
                                }
                            }
                        })
                    } catch (e) {
                        n("Duplicate", e, Log.Type.Error)
                    }
                },
                Questionnaire: function() {
                    try {
                        n("Questionnaire", "Called");
                        var e = t.EventComponent
                          , r = u.GetComponentRef(e);
                        if ("StaticContainer" != r)
                            return void jAlert("Questionnaires may be built only in body of static containers!");
                        var o, i = $('<div id="QuestionnaireDlg"><div class="toolWrapper"><div class="noWrap">List questions in "Text=Name" format:</div><textarea class="dialogTextarea"/></div></div>'), a = {
                            Build: function(r) {
                                N = o.Value();
                                var n = N.split("\n")
                                  , a = Utilities.ToNumber($("#width", i).val()) || 500
                                  , s = Utilities.ToNumber($("#spacing", i).val()) || 25
                                  , l = $("#fill", i).val()
                                  , c = MP.Tools.Config.Editor.html.snap
                                  , d = Utilities.SnapTo(t.OffsetX, c[0])
                                  , p = Utilities.SnapTo(t.OffsetY, c[1]);
                                $.each(n, function(t, r) {
                                    var t = r.search(/=[^=]*$/);
                                    if (!(t < 0)) {
                                        var o, i = r.substring(0, t).trim(), n = r.substring(t + 1).trim();
                                        if (o = u.CreateEditorComponent("EditorLabel", ""),
                                        o.AppendTo(e),
                                        o.SetLeft(d),
                                        o.SetTop(p),
                                        o.SetCaption(i),
                                        l)
                                            for (var c = o.GetControl(); c.width() < a; )
                                                i += l,
                                                o.SetCaption(i);
                                        o = u.CreateEditorComponent("EditorRadio", n, !0),
                                        o.AppendTo(e),
                                        o.SetLeft(d + a + 20),
                                        o.SetTop(p),
                                        o.SetCaption("Yes"),
                                        o = u.CreateEditorComponent("EditorRadio", n, !0),
                                        o.AppendTo(e),
                                        o.SetLeft(d + a + 70),
                                        o.SetTop(p),
                                        o.SetCaption("No"),
                                        o.SetValue("0"),
                                        p += s
                                    }
                                }),
                                i.dialog("close")
                            },
                            "Load Last": function(e) {
                                o.Value(N)
                            }
                        };
                        i.dialog({
                            title: "Build Questionnaire",
                            width: 500,
                            height: 400,
                            minWidth: 400,
                            minHeight: 300,
                            autoOpen: !1,
                            closeOnEscape: !0,
                            modal: !0,
                            buttons: a,
                            resizeStart: function() {
                                Global.DisableHighlightingInChrome(!0)
                            },
                            resizeStop: function() {
                                Global.DisableHighlightingInChrome(!1),
                                o.Height(i.height() - 70)
                            },
                            dragStart: function() {
                                Global.DisableHighlightingInChrome(!0)
                            },
                            dragStop: function() {
                                Global.DisableHighlightingInChrome(!1)
                            },
                            close: function() {
                                o.Remove(),
                                i.remove()
                            },
                            open: function() {
                                o = new MP.Constructors.AceEditor($(".dialogTextarea", i),{
                                    language: "text",
                                    focus: !0,
                                    value: N
                                }),
                                o.Height(i.height() - 70),
                                $("<p/>").append('Width <input id="width" value="500" style="width: 50px"/> ').append('Spacing <input id="spacing" value="25" style="width: 50px"/> ').append('Fill <input id="fill" value=" ." style="width: 50px"/> ').appendTo($(".toolWrapper", i))
                            }
                        }),
                        i.dialog("open")
                    } catch (e) {
                        n("Questionnaire", e, Log.Type.Error)
                    }
                },
                SortTabIndex: function() {
                    try {
                        n("SortTabIndex", "Called"),
                        m(),
                        jPrompt("Please enter an initial Tab Index value", 1, "SortTabIndex", function(e) {
                            if (null != e) {
                                var t, r, o = [];
                                for (t = 0; t < M.length; t++)
                                    r = u.GetStoredComponent(M[t]),
                                    r && o.push(r);
                                o.sort(function(e, t) {
                                    return e = e.GetTop() + "." + e.GetLeft(),
                                    t = t.GetTop() + "." + t.GetLeft(),
                                    parseFloat(e) - parseFloat(t)
                                });
                                var i = Utilities.ToNumber(e);
                                for (t = 0; t < o.length; t++)
                                    r = o[t],
                                    r.SetTabIndex(i),
                                    i++
                            }
                        })
                    } catch (e) {
                        n("SortTabIndex", e, Log.Type.Error)
                    }
                },
                SetProperty: function(e, t, r) {
                    try {
                        n("SetProperty", e),
                        m(),
                        jPrompt("Please enter a new value", t, r, function(r) {
                            if (null != r) {
                                Utilities.IsNumber(t) && (r = Utilities.ToNumber(r));
                                for (var o = 0; o < M.length; o++) {
                                    var i = u.GetStoredComponent(M[o]);
                                    i && i[e] && ($.inArray(e, ["SetID", "SetName"]) > -1 && (r = u.MakeUniquePageID(r)),
                                    i[e](r))
                                }
                            }
                        })
                    } catch (e) {
                        n("SetProperty", e, Log.Type.Error)
                    }
                },
                Copy: function(e) {
                    try {
                        n("Copy", "Called"),
                        I = b(e)
                    } catch (e) {
                        n("Copy", e, Log.Type.Error)
                    }
                },
                Paste: function() {
                    try {
                        n("Paste", "Called"),
                        v(I)
                    } catch (e) {
                        n("Paste", e, Log.Type.Error)
                    }
                },
                Export: function(e) {
                    try {
                        n("Export", "Called"),
                        I = b(e),
                        Global.SetClipboard(I) || c.ShowAceEditorForm(I, "Export", "", null, null, {
                            language: "html"
                        })
                    } catch (e) {
                        n("Export", e, Log.Type.Error)
                    }
                },
                Import: function() {
                    try {
                        n("Import", "Called");
                        var e = Global.GetClipboard();
                        e ? v(e) : c.ShowAceEditorForm(e, "Import", "", v, null, {
                            language: "html"
                        })
                    } catch (e) {
                        n("Import", e, Log.Type.Error)
                    }
                },
                DeleteSelection: function() {
                    try {
                        n("DeleteSelection", "Called"),
                        m(),
                        c.HideProperties(),
                        b(!0)
                    } catch (e) {
                        n("DeleteSelection", e, Log.Type.Error)
                    }
                },
                EditHTML: function() {
                    function e(e) {
                        v(e, r, !0),
                        u.ClearSelected()
                    }
                    try {
                        n("EditHTML", "Called"),
                        m();
                        var t = T()
                          , r = $('[mp-id="' + t + '"]')
                          , o = b(!1);
                        if (!o)
                            return;
                        c.ShowAceEditorForm(o, "HTML Editor", "WARNING: Not following editor API may corrupt the page or the editor!", e, null)
                    } catch (e) {
                        n("EditHTML", e, Log.Type.Error)
                    }
                },
                AddEditorToComponents: function(e, t, r) {
                    e = e || $("#rightColumn"),
                    $(".component", e).each(function() {
                        h(this, r)
                    }),
                    t && e.length && h(e, r)
                },
                RemoveEditorFromComponents: function(e, t) {
                    e = $(e),
                    e.length && ($(".component", e).each(function() {
                        f(this)
                    }),
                    t && f(e))
                },
                ValidatePage: function() {
                    try {
                        u.Search();
                        var e = D.GetItemArray()
                          , t = 0
                          , r = 0
                          , o = 0
                          , i = "";
                        n("ValidatePage", "Validating " + e.length + " HTML components", Log.Type.Debug),
                        $.each(e, function() {
                            var e = !1
                              , i = u.GetComponentRef(this.GetControl());
                            if (this.GetTooltip && this.GetName && !this.GetTooltip() && (t++,
                            e = !0,
                            n(this.GetName() + ".NoTooltip", this, Log.Type.Search)),
                            this.GetName && !this.GetName() && (r++,
                            e = !0,
                            n(i + ".NoName", this, Log.Type.Search)),
                            $.inArray(i, ["EditorRadio", "EditableContent"]) == -1) {
                                var a;
                                if (!a && this.GetID && (a = this.GetID()),
                                !a && this.GetName && (a = this.GetName()),
                                a) {
                                    var s = $('[id="' + a + '"]');
                                    s.length > 1 && (o++,
                                    e = !0,
                                    n(a + ".DuplicateID", this, Log.Type.Search))
                                }
                            }
                            this.HighlightAsError(e)
                        }),
                        t && (i += "Missing tooltips: " + t + "<br>"),
                        r && (i += "Components with no names: " + r + "<br>"),
                        o && (i += "Duplicate IDs: " + o + "<br>"),
                        i && n("ValidatePage", "Discovered " + parseInt(t + r + o) + " possible problems!", Log.Type.Debug)
                    } catch (e) {
                        n("ValidatePage", e, Log.Type.Error)
                    }
                    return i
                },
                CleanVrmAfterEditor: function(e) {
                    n("CleanVrmAfterEditor", "Called");
                    var t = window.location.href.split("/");
                    t = t[0] + "/" + t[1] + "/" + t[2];
                    var r = new RegExp(t,"g");
                    return e = e.replace(r, "../.."),
                    e = e.replace(/done[0-9]{1,}=\"[0-9]{1,}\"\s{0,}/g, "")
                },
                CleanHtmlAfterEditor: function(e) {
                    if (n("CleanHtmlAfterEditor", "Called"),
                    e = e.replace(/mp-target/g, "onclick"),
                    e = e.replace(/mp-type/g, "type"),
                    /mp-hide/.test(e)) {
                        e = "<div>" + e + "</div>";
                        var t = $(e)
                          , r = t.find("[mp-hide]");
                        r.each(function() {
                            var e = $(this);
                            e.removeAttr("mp-hide"),
                            e.css("display", "none")
                        }),
                        e = t.html()
                    }
                    return e
                },
                CleanHtmlForEditor: function(e) {
                    n("CleanHtmlForEditor", "Called"),
                    e = "<div>" + e + "</div>";
                    var t;
                    t = $(e).find(".component.EditorText"),
                    t.each(function() {
                        var t = $(this).find("input");
                        if (t.length) {
                            var r = t.attr("type");
                            r = 'type="' + r + '"';
                            var o = t.outerHTML()
                              , i = o.replace(r, "mp-" + r);
                            e = e.replace(o, i)
                        }
                    });
                    var r = $(e);
                    return t = r.find("*"),
                    t.each(function() {
                        var e = $(this)
                          , t = "none" == e.css("display");
                        t && (e.css("display", ""),
                        e.attr("mp-hide", "true"))
                    }),
                    r.formHTML()
                },
                AddHelpLink: function(e) {
                    if (e.GetHelpLink) {
                        var t = e.GetHelpLink();
                        if (!(!t || t.beginsWith("#L") && t.endsWith("#"))) {
                            var r = e.GetControl()
                              , o = function() {
                                r.data("MouseIn", !0);
                                var e = $("div.mp-help", r);
                                e.length || (e = C(r, t),
                                e.bind("mouseenter", function() {
                                    r.data("MouseIn", !0)
                                }),
                                e.bind("mouseleave", function() {
                                    r.data("MouseIn", !1)
                                }),
                                e.fadeIn(500))
                            }
                              , i = function() {
                                var e = $("div.mp-help", r);
                                e.length && (r.find("input,textarea,select").is(":focus") || (r.data("MouseIn", !1),
                                setTimeout(function() {
                                    r.data("MouseIn") || e.fadeOut(500, function() {
                                        e.remove()
                                    })
                                }, 500)))
                            };
                            if (Global.FadingHelpLinks)
                                r.bind("mouseenter", o),
                                r.bind("focusin", o),
                                r.bind("mouseleave", i),
                                r.bind("focusout", i);
                            else {
                                var n = $("div.mp-help", r);
                                if (n.length)
                                    return;
                                n = C(r, t),
                                n.show()
                            }
                        }
                    }
                },
                Undo: function() {
                    n("Undo", "Called"),
                    R.Undo()
                },
                Redo: function() {
                    n("Redo", "Called"),
                    R.Redo()
                },
                ClearUndo: function() {
                    n("ClearUndo", "Called"),
                    R.Clear()
                },
                DeleteFromProperties: function() {
                    try {
                        n("DeleteFromProp", "Called"),
                        u.DeleteEditorComponents()
                    } catch (e) {
                        n("DeleteFromProp", e, Log.Type.Error)
                    }
                },
                ShowProperties: function(e) {
                    try {
                        n("ShowProperties", "Called"),
                        e = $(e || t.EventComponent),
                        e.hasClass("component") || (e = e.parent());
                        var r = this.GetEditorComponent(e)
                          , o = r.GetProperties()
                          , i = r.refClassName;
                        try {
                            r.GetName && (i = i + " - Name: " + r.GetName()),
                            r.GetID && (i = i + " - ID: " + r.GetID())
                        } catch (e) {
                            n("ShowProperties", e, Log.Type.Error, !0)
                        }
                        k = e,
                        PropertyEd.Show(o, this.DeleteFromProperties, i)
                    } catch (e) {
                        n("ShowProperties", e, Log.Type.Error)
                    }
                }
            }
        } catch (e) {
            n("Main", e, Log.Type.Error)
        }
    }
    ;
    return u
}),
define("Bootstrap", ["ContextMenu", "ContextMenuItems", "Undo"], function(e, t, r) {
    var o, i = {
        input: "bs/comp/input",
        checkbox: "bs/comp/checkbox",
        radio: "bs/comp/radio",
        textarea: "bs/comp/textarea",
        select: "bs/comp/select",
        button: "bs/comp/button",
        div: "bs/comp/div",
        panel: "bs/comp/panel",
        widget: "bs/comp/widget",
        label: "bs/comp/label",
        bootstrapContent: "bs/comp/bootstrapContent",
        container: "bs/comp/container",
        row: "bs/comp/row",
        column: "bs/comp/column",
        js: "bs/comp/js"
    }, n = [], a = [];
    for (o in i)
        i.hasOwnProperty(o) && (n.push(i[o]),
        a.push(o));
    var s = {};
    require(n, function() {
        for (var e = 0; e < a.length; ++e)
            s[a[e]] = arguments[e]
    });
    var l, c;
    require(["Editor", "HtmlEditor"], function(e, t) {
        l = e,
        c = t
    });
    var d = new function(o) {
        function i(e, t, r, o) {
            Log.Add(k + e, t, r, o)
        }
        function n(e, t) {
            d.Reload(e, t)
        }
        function a() {
            try {
                if (i("updateToolbar", "Called"),
                !G)
                    return;
                var e = MP.Tools.Config.Editor.toolBars.bootstrap;
                G.css("left", e.position.left + "px").css("top", e.position.top + "px").data("lastLeft", e.position.left).data("lastTop", e.position.top),
                e.width && G.css("width", e.width + "px")
            } catch (e) {
                i("updateToolbar", e, Log.Type.Error)
            }
        }
        function c() {
            try {
                i("initToolbar", "Called"),
                G = $("#BootstrapToolbar"),
                G.draggable({
                    cancel: "img",
                    start: function(e, t) {
                        Global.DisableHighlightingInChrome(!0)
                    },
                    stop: function(e, t) {
                        Global.DisableHighlightingInChrome(!1),
                        Global.UpdateLastPosition(G, t)
                    }
                }).resizable({
                    start: function(e, t) {
                        Global.DisableHighlightingInChrome(!0)
                    },
                    stop: function(e, t) {
                        Global.DisableHighlightingInChrome(!1)
                    }
                }).disableSelection().hide(),
                a(),
                G.find("img[ref]").each(function() {
                    $(this).attr("draggable", !1).draggable({
                        helper: "clone",
                        start: function() {
                            Global.DisableHighlightingInChrome(!0)
                        },
                        stop: function() {
                            Global.DisableHighlightingInChrome(!1)
                        }
                    })
                }),
                $(window).bind("scroll.bootstrapToolBar", function() {
                    G.is(":visible") && G.css("top", G.data("lastTop") + $(document).scrollTop() + "px")
                })
            } catch (e) {
                i("initToolbar", e, Log.Type.Error)
            }
        }
        function u(e, t) {
            try {
                var r = d.GetEditorComponent(e);
                return r.EditMode(t),
                r
            } catch (e) {
                i("addEditorToComponent", e, Log.Type.Error, !0)
            }
        }
        function p(e) {
            try {
                var t = d.GetEditorComponent(e);
                if (!t)
                    return;
                t.HighlightAsFound(!1),
                t.HighlightAsError(!1),
                t.DefaultMode();
                var r = $(e);
                r.removeAttr("unselectable"),
                r.removeClass("ui-activeBox"),
                "" == r.attr("condition") && r.removeAttr("condition"),
                r.find(".ui-selectee").removeClass("ui-selectee")
            } catch (e) {
                i("removeEditorFromComponent", e, Log.Type.Error, !0)
            }
        }
        function h(e, t) {
            return (e + "" || "").replace(/\n|\t/g, " ").replace(/\s+/g, " ").replace(/\s*\/\*.*?\*\/\s*/g, " ").replace(/(^|\})(.*?)(\{)/g, function(e, r, o, i) {
                for (var n = [], a = o.split(","), s = 0; s < a.length; s++)
                    n.push(t + " " + a[s].replace(/^\s*|\s*$/, ""));
                return r + " " + n.join(", ") + " " + i
            })
        }
        function f(e, t) {
            t && (e = h(e, t)),
            $("head").append('<style type="text/css" mp-remove="true">' + e + "</style>")
        }
        function g(e, t, r, o) {
            $.ajax({
                url: e,
                dataType: "text/css",
                success: function(o) {
                    f(o, t);
                    var i = r || $.noop;
                    i(o, e, t)
                },
                error: function(r, i) {
                    var n = o || $.noop;
                    n(r, e, t)
                }
            })
        }
        function m(e) {
            for (var t = 0; t < e.length; t++) {
                var r = e[t];
                g(r.f, r.e)
            }
        }
        function y(e, t) {
            var r = $(e);
            if ($.inArray(r.attr("ref"), t) > -1)
                return d.GetEditorComponent(r[0]);
            for (var o = r.parents("[ref]"), i = 0; i < o.length; i++) {
                var n = $(o[i]);
                if ($.inArray(n.attr("ref"), t) > -1)
                    return d.GetEditorComponent(n)
            }
        }
        function C() {
            try {
                var e, r = new t;
                return e = r.Add("Edit >"),
                r.Add("Copy [Ctrl+C]", function() {
                    d.Copy(!1)
                }, e),
                r.Add("Cut [Ctrl+X]", function() {
                    d.Copy(!0)
                }, e),
                r.Add("Paste [Ctrl+V]", function() {
                    d.Paste()
                }, e),
                r.Add("Copy (export)", function() {
                    d.Export(!1)
                }, e),
                r.Add("Cut (export)", function() {
                    d.Export(!0)
                }, e),
                r.Add("Paste (import)", function() {
                    d.Import()
                }, e),
                e = r.Add("Component >"),
                r.Add("Properties [Ctrl+P]", function() {
                    d.ShowProperties()
                }, e),
                r.Add("Delete [Del]", function() {
                    d.DeleteSelection()
                }, e),
                r.Add("HTML [Ctrl+H]", function() {
                    d.EditHTML()
                }, e),
                F.CanUndo() && r.Add("Undo [Ctrl+Z]", d.Undo, e),
                e = r.Add("Columns >"),
                r.Add("Count", function() {
                    d.ColumnCount()
                }, e),
                r.Add("Class", function() {
                    d.ColumnClass()
                }, e),
                r.Add("Add New", function() {
                    d.ColumnCount(1)
                }, e),
                r.Add("Remove Last", function() {
                    d.ColumnCount(-1)
                }, e),
                e = r.Add("Rows >"),
                r.Add("Count", function() {
                    d.RowCount()
                }, e),
                r.Add("Add New", function() {
                    d.RowCount(1)
                }, e),
                r.Add("Remove Last", function() {
                    d.RowCount(-1)
                }, e),
                e = r.Add("Search >"),
                r.Add("Search...", function() {
                    l.Search()
                }, e),
                r.Add("Clear", function() {
                    l.ClearSearch()
                }, e),
                e = r.Add("File >"),
                r.Add("Help... [F1]", l.ShowHelp, e),
                l.Enabled && !l.LockedBy && (r.Add("Quick Save [Ctrl+S]", function() {
                    PropertyEd.QuickSave()
                }, e),
                r.Add("Save & Exit", function() {
                    PropertyEd.Save()
                }, e)),
                r.Add("Exit... [Ctrl+Q]", function() {
                    PropertyEd.Close()
                }, e),
                r.GetHTML()
            } catch (e) {
                i("makeContextMenu", e, Log.Type.Error)
            }
        }
        function v(e) {
            i("cleanHtmlAfterEditor", "Called");
            var t, r;
            for (t = 0; t < U.length; t++)
                r = U[t],
                e = Utilities.ReplaceAll(e, " we-" + r + '="', " " + r + '="');
            if (/mp-hide/.test(e)) {
                e = "<div>" + e + "</div>";
                var o = $(e)
                  , n = o.find("[mp-hide]");
                n.each(function() {
                    var e = $(this);
                    e.removeAttr("mp-hide"),
                    e.css("display", "none")
                }),
                e = o.html()
            }
            return e
        }
        function E(e) {
            i("cleanHtmlForEditor", "Called");
            var t, r;
            for (t = 1; t < U.length; t++)
                r = U[t],
                e = Utilities.ReplaceAll(e, " " + r + '="', " we-" + r + '="');
            e = "<div>" + e + "</div>";
            var o;
            o = $(e).find('[ref="input"]'),
            o.each(function() {
                var t = $(this)
                  , r = t.attr("type")
                  , o = t.outerHTML()
                  , i = o.replace('type="' + r + '"', 'we-type="' + r + '"');
                e = e.replace(o, i)
            });
            var n = $(e);
            return o = n.find("*"),
            o.each(function() {
                var e = $(this)
                  , t = "none" == e.css("display");
                t && (e.css("display", ""),
                e.attr("mp-hide", "true"))
            }),
            n.formHTML()
        }
        function T(e, t) {
            try {
                var r = ""
                  , o = $(e)
                  , n = o.attr("ref");
                return $.inArray(n, ["bootstrapContent"]) > -1 ? "" : (d.RemoveEditorFromComponents(o, !0),
                r += o.formOuterHTML(),
                t ? o.remove() : d.AddEditorToComponents(o, !0),
                r = v(r))
            } catch (e) {
                i("getHtmlOfSelectedComponents", e, Log.Type.Error)
            }
        }
        function b(e) {
            try {
                var t = $(e);
                if (t.attr("ref"))
                    return d.GetEditorComponent(t);
                var r = t.parents("[ref]");
                if (r.length)
                    return d.GetEditorComponent(r[0])
            } catch (e) {
                i("getElementCtrl", e, Log.Type.Error)
            }
        }
        function S(e) {
            try {
                var t = $(e)
                  , r = t.parents("[ref]");
                if (t.attr("ref") && r.length > 0)
                    return d.GetEditorComponent(r[0]);
                if (r.length > 1)
                    return d.GetEditorComponent(r[1])
            } catch (e) {
                i("getParentCtrl", e, Log.Type.Error)
            }
        }
        function L(t, r) {
            var o = r || e.EventComponent
              , i = b(o)
              , n = S(o)
              , a = T(i.Control(), t);
            return t && F.Add(a, n.ID()),
            a
        }
        function w(t, r, o) {
            try {
                if (!t)
                    return;
                H = t,
                t = E(t);
                var n = $(t)
                  , a = n.attr("mp-id");
                if (o) {
                    var s = A.find("[mp-id=" + a + "]");
                    s.length && L(!0, s)
                }
                switch (r && r.length || (r = e.ActiveBox,
                r.hasClass("ui-droppable") || (r = $(r.find(".ui-droppable").get(0)))),
                r.selector) {
                case ".prev()":
                    r.after(n);
                    break;
                case ".next()":
                    r.before(n);
                    break;
                default:
                    r.append(n)
                }
                d.AddEditorToComponents(n, !0, !o)
            } catch (e) {
                i("addComponentsFromHtmlString", e, Log.Type.Error)
            }
        }
        try {
            var G, A, P, x, M, R, D, I, N, k = "Bootstrap.", F = new r("Bootstrap",n), H = "", B = ["ui-droppable", "ui-sortable", "bs-rowBox", "bs-columnBox", "bs-containerBox", "ui-activeBox", "bs-noSubProps"], U = ["type", "checked", "readonly", "disabled", "onclick", "ondblclick", "onmousedown", "onmouseup", "onmousemove", "onmouseout", "onmouseover", "onscroll", "onwheel", "onkeydown", "onkeypress", "onkeyup", "onblur", "onchange", "oncontextmenu", "onfocus", "oninput", "oninvalid", "onreset", "onsearch", "onselect", "onsubmit"];
            return {
                Enabled: !1,
                Initialized: !1,
                Loaded: !1,
                Enable: function() {
                    try {
                        if (!this.Initialized)
                            return;
                        i("Enable", "Called"),
                        G.show(),
                        this.Enabled = !0
                    } catch (e) {
                        i("Enable", e, Log.Type.Error, !0)
                    }
                },
                Disable: function() {
                    try {
                        i("Disable", "Called"),
                        G.hide(),
                        this.Enabled = !1
                    } catch (e) {
                        i("Disable", e, Log.Type.Error, !0)
                    }
                },
                Load: function(t) {
                    try {
                        if (!this.Initialized)
                            return;
                        i("Load", "Called"),
                        t != o && (m([{
                            f: "../../css/icons-min.css"
                        }, {
                            f: "../../css/bootstrap-min.css",
                            e: "#bootstrap"
                        }, {
                            f: "../../css/widgets.css",
                            e: "#bootstrap"
                        }]),
                        t = E(t),
                        A.html(t),
                        P.css("width", "auto")),
                        this.AddEditorToComponents(),
                        e.Add("#bootstrap", C, "bootstrap"),
                        A.bind("mousedown", function(t) {
                            e.UpdatePossition(t, "bootstrap")
                        }),
                        A.delegate("[ref]", "dblclick", function(e) {
                            e.stopPropagation(),
                            d.ShowProperties(this)
                        }),
                        this.Loaded = !0
                    } catch (e) {
                        i("Load", e, Log.Type.Error, !0)
                    }
                },
                Save: function() {
                    try {
                        if (!this.Initialized || !this.Loaded)
                            return;
                        i("Save", "Called"),
                        this.RemoveEditorFromComponents(),
                        A.undelegate("[ref]").unbind("mousedown").selectable("destroy");
                        var e = A.formHTML();
                        return e = v(e)
                    } catch (e) {
                        i("Save", e, Log.Type.Error, !0)
                    }
                },
                Clear: function() {
                    P.css("width", x),
                    A.html(""),
                    $("head [mp-remove]").remove()
                },
                Reload: function(e, t) {
                    i("Reload", "Called");
                    var r = $('[mp-id="' + t + '"]');
                    w(e, r, !0)
                },
                Container: function() {
                    return A
                },
                Initialize: function() {
                    try {
                        if (i("Initialize", "Called"),
                        a(),
                        this.Initialized)
                            return;
                        A = $('<div id="bootstrap"/>'),
                        P = $("#shell");
                        var e = $("#vrmEditorTitle");
                        e.length ? e.after(A) : P.prepend(A),
                        x = P.css("width"),
                        c(),
                        this.Initialized = !0
                    } catch (e) {
                        i("Initialize", e, Log.Type.Error)
                    }
                },
                CreateEditorComponent: function(e, t, r, o) {
                    try {
                        if (i("CreateEditorComponent", "Ref: " + e + ", Name: " + t),
                        !e)
                            throw "Missing component reference!";
                        var n = s[e]
                          , a = new n;
                        if (!a)
                            throw "Component '" + e + "' could not be created!";
                        return a.Create(t || e, o),
                        a.EditMode(!r),
                        a.Control()[0][e] = a,
                        a
                    } catch (e) {
                        i("CreateEditorComponent", e, Log.Type.Error)
                    }
                },
                BuildComponent: function(e, t, r) {
                    try {
                        i("BuildComponent", "Ref: " + e);
                        var o = this.CreateEditorComponent(e, null, null, r)
                          , n = $(t);
                        return n.append(o.Control()),
                        o.EditMode(),
                        n.parents("[ref]").removeClass("droppable-hover"),
                        o
                    } catch (e) {
                        i("BuildComponent", e, Log.Type.Error)
                    }
                },
                AddEditorToComponents: function(e, t, r) {
                    try {
                        i("AddEditorToComponents", "Called");
                        var o = e || A;
                        $(o).find("[ref]").each(function() {
                            u(this, r)
                        }),
                        t && o.length && u(o, r)
                    } catch (e) {
                        i("AddEditorToComponents", e, Log.Type.Error)
                    }
                },
                RemoveEditorFromComponents: function(e, t) {
                    try {
                        i("RemoveEditorFromComponents", "Called");
                        var r = e || A;
                        $(r).find("[ref]").each(function() {
                            p(this)
                        }),
                        t && p(r)
                    } catch (e) {
                        i("RemoveEditorFromComponents", e, Log.Type.Error)
                    }
                },
                GetEditorComponent: function(e) {
                    try {
                        e = $(e);
                        var t = e.attr("ref");
                        if (!t)
                            throw "Missing ref attribute!";
                        var r = null
                          , o = e[0];
                        try {
                            if (r = o[t],
                            !r)
                                throw "Error!";
                            return r
                        } catch (i) {
                            var n = s[t];
                            if (!n)
                                throw 'The control of type "' + t + '" not initialized!';
                            return r = new n,
                            r.Load(e),
                            o[t] = r,
                            r
                        }
                    } catch (t) {
                        i("GetEditorComponent", t.message || t + " " + Utilities.IdentifyChildren(e), Log.Type.Error)
                    }
                },
                MakeUniquePageID: function(e, t) {
                    if (!e)
                        return "";
                    for (var r, o = e.replace(/\d+$/, ""), i = o, n = t || 0, a = 0; ; ) {
                        if (r = A.find("#" + i).length,
                        r <= n)
                            break;
                        a++,
                        i = o + a.toString()
                    }
                    return i
                },
                MakeUniquePageName: function(e, t) {
                    if (!e)
                        return "";
                    for (var r, o = e.replace(/\d+$/, ""), i = o, n = t || 0, a = 0; ; ) {
                        if (r = A.find('[name="' + i + '"]').length,
                        r <= n)
                            break;
                        a++,
                        i = o + a.toString()
                    }
                    return i
                },
                Search: function(e, t) {
                    var r = A.find("[ref]");
                    e ? i("Search", "Searching " + r.length + " HTML elements for '" + e + "'", Log.Type.Debug) : i("Search", "Clearing", Log.Type.Info),
                    $.each(r, function() {
                        var r = d.GetEditorComponent(this);
                        try {
                            r.Search(e, t),
                            r.HighlightAsError(!1)
                        } catch (e) {
                            i("BadComponent", r, Log.Type.Search),
                            r.HighlightAsError(!0)
                        }
                    })
                },
                DeleteSelection: function(e) {
                    try {
                        i("DeleteSelection", "Called"),
                        l.HideProperties(),
                        L(!0, e)
                    } catch (e) {
                        i("DeleteSelection", e, Log.Type.Error)
                    }
                },
                EditHTML: function() {
                    function t(e) {
                        w(e, o, !0)
                    }
                    try {
                        i("EditHTML", "Called");
                        var r, o;
                        r = b(e.EventComponent).Control(),
                        o = r.prev(),
                        o.length || (o = r.next()),
                        o.length || (o = S(e.EventComponent).Control());
                        var n = L(!1);
                        if (!n)
                            return;
                        l.ShowAceEditorForm(n, "HTML Editor", "WARNING: Not following editor API may corrupt the page or the editor!", t, null)
                    } catch (e) {
                        i("EditHTML", e, Log.Type.Error)
                    }
                },
                RowCount: function(t) {
                    try {
                        i("RowCount", "Called");
                        var r = y(e.EventComponent, ["container", "panel"]);
                        if (!r)
                            return;
                        var o = r.RowCount();
                        if (t)
                            return void r.RowCount(o + t);
                        jPrompt("Enter how many rows this container should have", o, "Rows", function(e) {
                            e = parseInt(e),
                            e && r.RowCount(e)
                        })
                    } catch (e) {
                        i("RowCount", e, Log.Type.Error)
                    }
                },
                ColumnCount: function(t) {
                    try {
                        i("ColumnCount", "Called");
                        var r = y(e.EventComponent, ["row"]);
                        if (!r)
                            return;
                        var o = r.ColumnCount();
                        if (t)
                            return void r.ColumnCount(o + t);
                        jPrompt("Enter how many columns this row should have", o, "Columns", function(e) {
                            e = parseInt(e),
                            e && (e > 12 && (e = 12),
                            r.ColumnCount(e))
                        })
                    } catch (e) {
                        i("ColumnCount", e, Log.Type.Error)
                    }
                },
                ColumnClass: function() {
                    try {
                        i("ColumnClass", "Called"),
                        ctrl = y(e.EventComponent, ["row", "column"]);
                        var t = ctrl.ColumnClass();
                        jPrompt("Update class of a single column or all columns of a row", t, "Class", function(e) {
                            ctrl.ColumnClass(e)
                        })
                    } catch (e) {
                        i("ColumnClass", e, Log.Type.Error)
                    }
                },
                Copy: function(e) {
                    try {
                        i("Copy", "Called"),
                        H = L(e)
                    } catch (e) {
                        i("Copy", e, Log.Type.Error)
                    }
                },
                Paste: function() {
                    try {
                        i("Paste", "Called"),
                        w(H)
                    } catch (e) {
                        i("Paste", e, Log.Type.Error)
                    }
                },
                Export: function(e) {
                    try {
                        i("Export", "Called"),
                        H = L(e),
                        Global.SetClipboard(H) || l.ShowAceEditorForm(H, "Export", "", null, null, {
                            language: "html"
                        })
                    } catch (e) {
                        i("Export", e, Log.Type.Error)
                    }
                },
                Import: function() {
                    try {
                        i("Import", "Called");
                        var e = Global.GetClipboard();
                        e ? w(e) : l.ShowAceEditorForm(e, "Import", "", w, null, {
                            language: "html"
                        })
                    } catch (e) {
                        i("Import", e, Log.Type.Error)
                    }
                },
                Undo: function() {
                    i("Undo", "Called"),
                    F.Undo()
                },
                Redo: function() {
                    i("Redo", "Called"),
                    F.Redo()
                },
                ClearUndo: function() {
                    i("ClearUndo", "Called"),
                    F.Clear()
                },
                ShowProperties: function(t) {
                    function r(e, t, r) {
                        var o = "";
                        $.each(B, function(t, r) {
                            var i = new RegExp("\\S*\\b" + r + "\\b\\S*");
                            i.test(e) && (e = e.replace(i, ""),
                            o += r + " ")
                        }),
                        e = Utilities.RemoveWhiteSpaces(e),
                        t(e),
                        r(o)
                    }
                    function o(e) {
                        return e.beginsWith("we-") ? e.substring(3) : e
                    }
                    function n(e) {
                        return $.inArray(e, U) != -1 ? "we-" + e : e
                    }
                    function a(e, t, i, a) {
                        var s = "";
                        this.elIdx = e,
                        i ? (i = o(i),
                        this.prop = t + "." + i,
                        this.first = !1,
                        "class" == i && r(a, function(e) {
                            a = e
                        }, function(e) {
                            s = e
                        })) : (this.prop = t,
                        this.first = !0),
                        this.name = i || "",
                        this.value = a || "",
                        this.hideValue = s,
                        this.edName = n(this.name)
                    }
                    function s() {
                        var e = M.localdata;
                        $.each(N, function(t, r) {
                            var o = $(I[r.elIdx]);
                            o.removeAttr(r.edName),
                            e = $.grep(e, function(e) {
                                return e.elIdx == r.elIdx && e.prop == r.prop
                            }, !0)
                        }),
                        $.each(e, function(e, t) {
                            if (t && !t.first) {
                                t.hideValue && (t.value += " " + t.hideValue,
                                t.value = Utilities.RemoveWhiteSpaces(t.value));
                                var r = $(I[t.elIdx]);
                                switch (t.name) {
                                case "HTML":
                                    r.html(t.value);
                                    break;
                                case "TEXT":
                                    r.text(t.value);
                                    break;
                                default:
                                    r.attr(t.edName, t.value)
                                }
                            }
                        }),
                        f.dialog("close")
                    }
                    function c() {
                        f.dialog("close")
                    }
                    function d() {
                        return [{
                            name: "elIdx",
                            type: "integer"
                        }, {
                            name: "prop",
                            type: "string"
                        }, {
                            name: "name",
                            type: "string"
                        }, {
                            name: "value",
                            type: "string"
                        }, {
                            name: "first",
                            type: "boolean"
                        }, {
                            name: "edName",
                            type: "string"
                        }, {
                            name: "hideValue",
                            type: "string"
                        }]
                    }
                    function u() {
                        return [{
                            text: "Property",
                            datafield: "prop",
                            width: "150px",
                            editable: !1
                        }, {
                            text: "Value",
                            datafield: "value",
                            width: "auto",
                            editable: !0
                        }, {
                            text: "",
                            datafield: "Edit",
                            width: "30px",
                            columntype: "number",
                            cellsrenderer: function(e) {
                                var t = D.jqxGrid("getrowdata", e)
                                  , r = t.first ? "" : "pencil";
                                return '<span style="padding:6px 8px" class="glyphicons glyphicons-' + r + '"></span>'
                            }
                        }, {
                            text: "",
                            datafield: "AddDel",
                            width: "30px",
                            columntype: "number",
                            cellsrenderer: function(e) {
                                var t = D.jqxGrid("getrowdata", e)
                                  , r = t.first ? "plus-sign" : "remove";
                                return '<span style="padding:6px 8px" class="glyphicons glyphicons-' + r + '"></span>'
                            }
                        }]
                    }
                    function p(e) {
                        function t(e) {
                            var o = e.get(0)
                              , i = o.attributes
                              , n = o.nodeName
                              , s = e.hasClass("bs-noSubProps");
                            if ($.inArray(n, ["OPTION"]) == -1) {
                                I.push(o),
                                r.push(new a(I.length - 1,n));
                                for (var l = 0; l < i.length; l++) {
                                    var c = i[l]
                                      , d = c.nodeName || ""
                                      , u = c.nodeValue || "";
                                    $.inArray(d, ["ref", "mp-id", "unselectable", "type"]) == -1 && r.push(new a(I.length - 1,n,d,u))
                                }
                                if (s)
                                    return void r.push(new a(I.length - 1,n,"HTML",e.html()));
                                var p = $.trim(e.text());
                                !e.children().length && p && r.push(new a(I.length - 1,n,"TEXT",p));
                                var h = e.children();
                                $.each(h, function(e, r) {
                                    var o = $(r);
                                    o.attr("ref") || t(o)
                                })
                            }
                        }
                        var r = [];
                        return t(e),
                        r
                    }
                    try {
                        i("ShowProperties", "Called");
                        var h = b(t || e.EventComponent);
                        if (!h)
                            return;
                        if (h.ShowEditor)
                            return void h.ShowEditor();
                        t = h.Control(),
                        N = [],
                        I = [];
                        var f = $("#PropertiesDlg");
                        if (f.length)
                            M.localdata = p(t);
                        else {
                            var g = {
                                Cancel: c,
                                Apply: s
                            };
                            f = $('<div id="PropertiesDlg"></div>'),
                            f.html('<div><div id="jqxProps"/></div>'),
                            f.dialog({
                                width: 500,
                                height: 500,
                                autoOpen: !1,
                                closeOnEscape: !1,
                                resizable: !0,
                                modal: !1,
                                buttons: g,
                                dialogClass: "clientDialog",
                                title: "Component Properties",
                                open: function() {
                                    D.jqxGrid({
                                        height: f.height() - 5
                                    })
                                },
                                beforeclose: function(e) {
                                    if (e.srcElement)
                                        return jConfirm("Are you sure to discard all changes?", "Cancel edit", function(e) {
                                            e && f.dialog("close")
                                        }),
                                        !1
                                },
                                resizeStop: function() {
                                    D.jqxGrid({
                                        height: f.height() - 5
                                    })
                                }
                            }),
                            M = {
                                localdata: p(t),
                                datafields: d(),
                                datatype: "array",
                                updaterow: function(e, t, r) {
                                    M.localdata[e] = t,
                                    r(!0)
                                },
                                deleterow: function(e, t) {
                                    M.localdata.splice(e, 1),
                                    t(!0)
                                },
                                addrow: function(e, t, r, o) {
                                    M.localdata[e] = t,
                                    o(!0)
                                }
                            },
                            R = new jQ.jqx.dataAdapter(M),
                            D = jQ("#jqxProps").jqxGrid({
                                width: "100%",
                                height: "100%",
                                source: R,
                                editable: !0,
                                enabletooltips: !0,
                                enablehover: !0,
                                columnsresize: !0,
                                editMode: "click",
                                columns: u()
                            }),
                            D.on("cellclick", function(e) {
                                var t = e.args.rowindex
                                  , r = e.args.datafield;
                                if ("Edit" == r) {
                                    var o = D.jqxGrid("getrowdata", t);
                                    if (o.first)
                                        return;
                                    setTimeout(function() {
                                        function e(e) {
                                            o.value = e;
                                            var r = D.jqxGrid("getrowid", t);
                                            D.jqxGrid("updaterow", r, o)
                                        }
                                        l.ShowAceEditorForm(o.value, "Editing " + o.prop, "", e, null, {
                                            language: "text"
                                        })
                                    }, 1)
                                }
                                if ("AddDel" == r) {
                                    var o = D.jqxGrid("getrowdata", t);
                                    o.first ? jPrompt("Property name:", "", "New Property", function(e) {
                                        if (e) {
                                            var r = new a(o.elIdx,o.prop,e);
                                            D.jqxGrid("addrow", null, r, t + 1),
                                            D.jqxGrid("selectrow", t + 1),
                                            D.jqxGrid("focus")
                                        }
                                    }) : (D.jqxGrid("deleterow", o.uid),
                                    N.push(o))
                                }
                            })
                        }
                        f.dialog("option", "title", "Component Properties - " + h.Reference() + " [" + h.ID() + "]"),
                        f.dialog("open"),
                        D.jqxGrid("updatebounddata")
                    } catch (e) {
                        i("ShowProperties", e, Log.Type.Error)
                    }
                }
            }
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    ;
    return d
}),
define("VrmScript", [], function() {
    var e;
    require(["Editor"], function(t) {
        e = t
    });
    var t = new function(r) {
        function o(e, t, r, o) {
            Log.Add("SharedScr." + e, t, r, o)
        }
        function i() {
            try {
                return a.Value()
            } catch (e) {
                o("getValue", e, Log.Type.Error, !0)
            }
        }
        function n(e) {
            try {
                a.Value(e || "", -1)
            } catch (e) {
                o("setValue", e, Log.Type.Error, !0)
            }
        }
        try {
            var a, s = $();
            return {
                Initialized: !1,
                Clear: function(e) {
                    t.Initialized && (o("Clear", "Called"),
                    a.ReadOnly(!0),
                    n(e))
                },
                Load: function(i) {
                    try {
                        if (!t.Initialized || !e.Enabled)
                            return;
                        if (o("Load", "Called"),
                        i == r)
                            return;
                        a.ReadOnly(!1),
                        n(i || "//type\n\n//const\n\n//var\n\n//function\n\n//procedure")
                    } catch (e) {
                        o("Load", e, Log.Type.Error, !0)
                    }
                },
                Save: function() {
                    try {
                        return t.Initialized ? (o("Save", "Called"),
                        i()) : ""
                    } catch (e) {
                        o("Save", e, Log.Type.Error, !0)
                    }
                },
                Initialize: function() {
                    try {
                        if (o("Initialize", "Called"),
                        t.Initialized)
                            return;
                        s = $("#vrmScrLink"),
                        a = new MP.Constructors.AceEditor($("#vrmScrPage"),{
                            language: "server script",
                            styles: {
                                height: "1000px"
                            }
                        }),
                        t.Initialized = !0,
                        t.Clear()
                    } catch (e) {
                        o("Initialize", e, Log.Type.Error)
                    }
                },
                HighlightAsFound: function(e) {
                    s.toggleClass("ui-search", e)
                },
                Search: function(e, r) {
                    try {
                        if (t.HighlightAsFound(!1),
                        !e)
                            return;
                        var i = Utilities.MakeRegExp(e, r)
                          , n = t.Save().search(i) > -1;
                        n && (t.HighlightAsFound(!0),
                        o("Search", t, Log.Type.Search))
                    } catch (e) {
                        o("Search", e, Log.Type.Error)
                    }
                }
            }
        } catch (e) {
            o("Main", e, Log.Type.Error)
        }
    }
    ;
    return t
}),
define("HtmlEditor", ["Utilities", "PageHelper", "Bootstrap"], function(e, t, r) {
    var o;
    require(["Editor"], function(e) {
        o = e
    });
    var i = new function(e) {
        function n(e, t, r, o) {
            Log.Add("HtmlEditor." + e, t, r, o)
        }
        function a() {
            try {
                return c.Value()
            } catch (e) {
                n("getValue", e, Log.Type.Error, !0)
            }
        }
        function s(t) {
            try {
                if (t == e)
                    return;
                c.Value(t, -1)
            } catch (e) {
                n("setValue", e, Log.Type.Error, !0)
            }
        }
        function l() {
            switch (i.Type) {
            case h:
                return t;
            case p:
                return r
            }
        }
        try {
            var c, d, u = "", p = "bootstrap", h = "absolute", f = "raw";
            return {
                Enabled: !1,
                Initialized: !1,
                Type: "",
                FindFirstAvailableID: function() {
                    var e, t, r = -1;
                    do
                        r++,
                        e = '[mp-id="' + r + '"]',
                        t = d.find(e).length;
                    while (t);return r
                },
                Clear: function(e) {
                    n("Clear", "Called"),
                    s(e || u),
                    this.Type == p && r.Clear(),
                    this.Type == f && d.html(e || u),
                    this.Disable(),
                    this.Type = ""
                },
                Show: function(e) {
                    try {
                        if (!this.Initialized)
                            return;
                        n("Show", "Called"),
                        s(e),
                        c.ReadOnly(!0)
                    } catch (e) {
                        n("Show", e, Log.Type.Error, !0)
                    }
                },
                Enable: function() {
                    try {
                        if (!this.Initialized || !o.Enabled || o.LockedBy)
                            return;
                        n("Enable", "Called"),
                        this.Type == p && r.Enable(),
                        this.Type == h && t.Enable(),
                        this.Enabled = !0
                    } catch (e) {
                        n("Enable", e, Log.Type.Error, !0)
                    }
                },
                Disable: function() {
                    try {
                        n("Disable", "Called"),
                        r.Disable(),
                        t.Disable(),
                        c.ReadOnly(!0),
                        this.Enabled = !1
                    } catch (e) {
                        n("Disable", e, Log.Type.Error, !0)
                    }
                },
                Load: function(i) {
                    try {
                        if (!this.Initialized || !o.Enabled)
                            return;
                        if (n("Load", "Called"),
                        i != e) {
                            this.Type = "";
                            var a = i.match(/<(.*)>/);
                            a = a && a.length ? a[0] : "",
                            !this.Type && /ref="bootstrapContent"/.test(a) && (this.Type = p),
                            !this.Type && /id="rightColumn"/.test(a) && (this.Type = h),
                            this.Type || (this.Type = f)
                        }
                        u = i || u,
                        this.Type == p && (s("Note that this is just a preview of original HTML. To edit use WYSIWYG editor above.\n\n" + u),
                        d = r.Container(),
                        t.Clear(),
                        r.Load(i),
                        c.ReadOnly(!0)),
                        this.Type == h && (s("Note that this is just a preview of original HTML. To edit use WYSIWYG editor above.\n\n" + u),
                        d = t.Container(),
                        t.Load(i),
                        c.ReadOnly(!0)),
                        this.Type == f && (d = $("#middle"),
                        d.html("<h1>This page can only be edited in HTML Page tab below</h1>"),
                        s(i),
                        c.ReadOnly(!1)),
                        this.Enable()
                    } catch (e) {
                        n("Load", e, Log.Type.Error, !0)
                    }
                },
                Save: function() {
                    try {
                        if (!this.Initialized)
                            return;
                        n("Save", "Called");
                        var e;
                        return this.Type == p && (e = r.Save()),
                        this.Type == h && (e = t.Save()),
                        this.Type == f && (e = a()),
                        e
                    } catch (e) {
                        n("Save", e, Log.Type.Error, !0)
                    }
                },
                EditHTML: function() {
                    try {
                        if (!this.Initialized || !o.Enabled)
                            return;
                        n("EditHTML", "Called");
                        var e = l();
                        e && e.EditHTML()
                    } catch (e) {
                        n("EditHTML", e, Log.Type.Error, !0)
                    }
                },
                Initialize: function() {
                    try {
                        if (n("Initialize", "Called"),
                        t.Initialize(),
                        r.Initialize(),
                        this.Initialized)
                            return;
                        c = new MP.Constructors.AceEditor($("#rawHtmlPage"),{
                            language: "html",
                            styles: {
                                height: "1000px"
                            }
                        }),
                        this.Initialized = !0
                    } catch (e) {
                        n("Initialize", e, Log.Type.Error)
                    }
                },
                Search: function(e, o) {
                    this.Type == p && r.Search(e, o),
                    this.Type == h && t.Search(e, o)
                },
                ClearUndo: function() {
                    n("ClearUndo", "Called"),
                    t.ClearUndo(),
                    r.ClearUndo()
                }
            }
        } catch (e) {
            n("Main", e, Log.Type.Error)
        }
    }
    ;
    return i
}),
define("bs/templateBase", ["Editor", "HtmlEditor", "Bootstrap"], function(e, t, r) {
    function o(e) {
        function o(e, t, r, o) {
            c.Log(l + e, t, r, o)
        }
        function i(e) {
            function t(e) {
                r.push(e);
                var o = e.children();
                $.each(o, function(e, r) {
                    var o = $(r);
                    o.attr("ref") || t(o)
                })
            }
            var r = [];
            return t(e),
            r
        }
        var n, a, s, l = "TmpBase.", c = this;
        this.Log = function(e, t, r, o) {
            var i = e;
            if (n) {
                var a = n.attr("mp-id");
                i += n.attr("id") || n.attr("name"),
                i = a ? i + "." + a : i
            }
            Log.Add(i, t, r, o)
        }
        ,
        this.BaseLoad = function(e, i) {
            try {
                n = $(e),
                a = $(i),
                s = n.attr("ref");
                var l = c.ID();
                if (l) {
                    var d = r.Container().find("[mp-id=" + l + "]");
                    d.length > 1 && (l = null)
                }
                l || (l = t.FindFirstAvailableID(),
                c.ID(l)),
                o("BaseLoad", "Called")
            } catch (e) {
                o("BaseLoad", e, Log.Type.Error)
            }
        }
        ,
        this.ID = function(t) {
            return t == e ? n.attr("mp-id") : void n.attr("mp-id", t)
        }
        ,
        this.Control = function(t) {
            return t == e ? n : void (n = t)
        }
        ,
        this.Reference = function() {
            return s
        }
        ,
        this.Input = function(t) {
            return t == e ? a : void (a = t)
        }
        ,
        this.Comment = function(t) {
            try {
                if (t == e)
                    return n.attr("mp-comment") || "";
                n.attr("mp-comment", t),
                c.UpdateComment()
            } catch (e) {
                o("Comment", e, Log.Type.Error)
            }
        }
        ,
        this.SvrCondition = function(t) {
            try {
                if (t == e)
                    return n.attr("condition") || "";
                n.attr("condition", t)
            } catch (e) {
                o("SvrCondition", e, Log.Type.Error)
            }
        }
        ,
        this.HighlightAsError = function(e) {
            try {
                var t = n;
                "radio" == s && (t = $("div[Ref='radio']").find("input[name='" + t.attr("name") + "']")),
                Browser.IsSafari() && $.inArray(s, ["radio", "checkbox", "select"]) > -1 && (t = t.parent()),
                t.toggleClass("ui-validation", e)
            } catch (e) {
                o("HighlightAsError", e, Log.Type.Error)
            }
        }
        ,
        this.HighlightAsFound = function(e) {
            n.toggleClass("ui-search", e)
        }
        ,
        this.BaseSearch = function(e, t) {
            try {
                if (this.HighlightAsFound(!1),
                !e)
                    return;
                for (var r, a, s, l, c = i(n), d = Utilities.MakeRegExp(e, t), u = !1, p = 0; p < c.length && (r = c[p],
                a = r.get(0).attributes,
                l = r.text(),
                !l || r.children().length || !(u = l.search(d) > -1)); p++) {
                    for (var h = 0; h < a.length && (s = a[h],
                    l = s.nodeValue || "",
                    !(u = l.search(d) > -1)); h++)
                        ;
                    if (u)
                        break
                }
                return u ? (this.HighlightAsFound(!0),
                void o("Search", this, Log.Type.Search)) : d
            } catch (e) {
                o("BaseSearch", e, Log.Type.Error)
            }
        }
        ,
        this.DisableHighlighting = function() {
            Global.DisableHighlightingInChrome(!0)
        }
        ,
        this.EnableHighlighting = function() {
            Global.DisableHighlightingInChrome(!1)
        }
        ,
        this.UpdateComment = function(e) {
            try {
                var t = $.trim(c.GetComment())
                  , r = jQ(n[0]);
                !e && t ? (t = t.replace(/[\n\r]/g, "<br/>"),
                r.jqxTooltip({
                    content: t,
                    showDelay: 1e3,
                    autoHideDelay: 5e4,
                    theme: "editor"
                })) : (r.jqxTooltip("destroy"),
                n.attr("id").beginsWith("jqxWidget") && n.removeAttr("id"))
            } catch (e) {
                o("UpdateComment", e, Log.Type.Error)
            }
        }
    }
    return o
}),
define("bs/comp/bootstrapContent", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(o) {
        function i(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "bootstrapContent",
            this.Accept = ["container", "js"];
            var n, a = this, s = !1;
            this.Load = function(e) {
                try {
                    i("Load", "Called"),
                    n = $(e),
                    this.BaseLoad(n)
                } catch (e) {
                    i("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!s)
                        return;
                    i("DefaultMode", "Called"),
                    n.droppable("destroy").sortable("destroy").removeClass("bs-columnBox droppable-active droppable-hover").enableSelection(),
                    s = !1
                } catch (e) {
                    i("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    if (s)
                        return;
                    i("EditMode", "Called"),
                    n.droppable({
                        accept: r.GetAcceptedComponents(a.Accept),
                        greedy: !0,
                        activeClass: "droppable-active",
                        hoverClass: "droppable-hover",
                        drop: function(e, r) {
                            var o = $(r.draggable).attr("ref");
                            t.BuildComponent(o, this)
                        }
                    }),
                    n.sortable({
                        items: ">div"
                    }),
                    n.addClass("bs-columnBox").disableSelection(),
                    s = !0
                } catch (e) {
                    i("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {}
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/container", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(o) {
        function i(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "container",
            this.Accept = ["row"];
            var n, a = this, s = !1;
            this.Create = function(e) {
                try {
                    i("Create", "Called"),
                    n = $('<div class="container"/>'),
                    n.attr("ref", a.refClassName),
                    this.BaseLoad(n)
                } catch (e) {
                    i("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    i("Load", "Called"),
                    n = $(e),
                    this.BaseLoad(n)
                } catch (e) {
                    i("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!s)
                        return;
                    i("DefaultMode", "Called"),
                    n.droppable("destroy").sortable("destroy").removeClass("bs-containerBox droppable-active droppable-hover").enableSelection(),
                    s = !1
                } catch (e) {
                    i("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    if (s)
                        return;
                    i("EditMode", "Called"),
                    n.droppable({
                        accept: r.GetAcceptedComponents(a.Accept),
                        greedy: !0,
                        activeClass: "droppable-active",
                        hoverClass: "droppable-hover",
                        drop: function(e, r) {
                            var o = $(r.draggable).attr("ref");
                            t.BuildComponent(o, this)
                        }
                    }),
                    n.sortable(),
                    n.disableSelection(),
                    n.addClass("bs-containerBox"),
                    s = !0
                } catch (e) {
                    i("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    i("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    i("Search", e, Log.Type.Error)
                }
            }
            ,
            this.RowCount = function(e) {
                try {
                    i("RowCount", "Called", Log.Type.Info);
                    var r = n.find(">[ref=row]");
                    if (e == o)
                        return r.length;
                    if (e > r.length)
                        for (var a = r.length; a < e; a++)
                            t.BuildComponent("row", n);
                    if (e < r.length)
                        for (var a = r.length; a > e; a--)
                            t.DeleteSelection(r[a - 1])
                } catch (e) {
                    i("RowCount", e, Log.Type.Error)
                }
            }
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/row", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(o) {
        function i(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "row",
            this.Accept = ["column"];
            var n, a = this, s = !1;
            this.Create = function(e) {
                try {
                    i("Create", "Called"),
                    n = $('<div class="row form_element"/>'),
                    n.attr("ref", a.refClassName),
                    this.BaseLoad(n)
                } catch (e) {
                    i("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    i("Load", "Called"),
                    n = $(e),
                    this.BaseLoad(n)
                } catch (e) {
                    i("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!s)
                        return;
                    i("DefaultMode", "Called"),
                    n.droppable("destroy").sortable("destroy").removeClass("bs-rowBox droppable-active droppable-hover").enableSelection().unbind("mouseenter").unbind("mouseleave"),
                    s = !1
                } catch (e) {
                    i("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    if (s)
                        return;
                    i("EditMode", "Called"),
                    n.droppable({
                        accept: r.GetAcceptedComponents(a.Accept),
                        greedy: !0,
                        activeClass: "droppable-active",
                        hoverClass: "droppable-hover",
                        drop: function(e, r) {
                            var o = $(r.draggable).attr("ref");
                            t.BuildComponent(o, this)
                        }
                    }),
                    n.sortable().disableSelection().addClass("bs-rowBox"),
                    s = !0
                } catch (e) {
                    i("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    i("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    i("Search", e, Log.Type.Error)
                }
            }
            ,
            this.ColumnCount = function(e) {
                try {
                    i("ColumnCount", "Called", Log.Type.Info);
                    var r = n.find(">[ref=column]");
                    if (e == o)
                        return r.length;
                    if (e > r.length)
                        for (var a = Math.floor(12 / e), s = r.length; s < e; s++)
                            t.BuildComponent("column", n, a);
                    if (e < r.length)
                        for (var s = r.length; s > e; s--)
                            t.DeleteSelection(r[s - 1])
                } catch (e) {
                    i("ColumnCount", e, Log.Type.Error)
                }
            }
            ,
            this.ColumnClass = function(e) {
                try {
                    i("ColumnClass", "Called", Log.Type.Info);
                    var t = n.find(">[ref=column]");
                    if (e == o) {
                        var r = t.attr("class")
                          , a = r.match(/\S*col-\S*/g);
                        return a ? a.join(" ") : "col-md-4"
                    }
                    t.removeClass(function(e, t) {
                        var r = t.match(/\S*col-\S*/g);
                        return !!r && r.join(" ")
                    }),
                    t.addClass(e)
                } catch (e) {
                    i("ColumnClass", e, Log.Type.Error)
                }
            }
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/column", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(o) {
        function i(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "column",
            this.Accept = ["row", "input", "checkbox", "radio", "textarea", "select", "button", "label", "div", "panel", "widget"];
            var n, a = this, s = !1;
            this.Create = function(e, t) {
                try {
                    i("Create", "Called"),
                    t = t || 4,
                    n = $('<div class="col-xs-12 col-sm-' + t + " col-md-" + t + ' padded-col"/>'),
                    n.attr("ref", a.refClassName),
                    this.BaseLoad(n)
                } catch (e) {
                    i("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    i("Load", "Called"),
                    n = $(e),
                    this.BaseLoad(n)
                } catch (e) {
                    i("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!s)
                        return;
                    i("DefaultMode", "Called"),
                    n.droppable("destroy").sortable("destroy").removeClass("bs-columnBox droppable-active droppable-hover").enableSelection(),
                    s = !1
                } catch (e) {
                    i("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    if (s)
                        return;
                    i("EditMode", "Called"),
                    n.droppable({
                        accept: r.GetAcceptedComponents(a.Accept),
                        greedy: !0,
                        activeClass: "droppable-active",
                        hoverClass: "droppable-hover",
                        drop: function(e, r) {
                            var o = $(r.draggable).attr("ref");
                            t.BuildComponent(o, this)
                        }
                    }),
                    n.sortable(),
                    n.disableSelection(),
                    n.addClass("bs-columnBox"),
                    s = !0
                } catch (e) {
                    i("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    i("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    i("Search", e, Log.Type.Error)
                }
            }
            ,
            this.ColumnClass = function(e) {
                try {
                    if (i("ColumnClass", "Called", Log.Type.Info),
                    e == o) {
                        var t = n.attr("class")
                          , r = t.match(/\S*col-\S*/g);
                        return r ? r.join(" ") : "col-md-4"
                    }
                    n.removeClass(function(e, t) {
                        var r = t.match(/\S*col-\S*/g);
                        return !!r && r.join(" ")
                    }),
                    n.addClass(e)
                } catch (e) {
                    i("ColumnClass", e, Log.Type.Error)
                }
            }
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/input", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(r) {
        function o(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "input",
            this.Accept = [];
            var i, n, a = this, s = !1;
            this.Create = function(e) {
                try {
                    o("Create", "Called"),
                    i = $('<input class="form-control hasPopover">'),
                    i.attr("we-type", "text"),
                    i.attr("ref", a.refClassName),
                    i.attr("name", e),
                    i.attr("value", ""),
                    i.attr("maxlength", "30"),
                    i.attr("placeholder", e),
                    i.attr("data-content", e),
                    i.attr("validator", "required()"),
                    n = i,
                    this.BaseLoad(i, n)
                } catch (e) {
                    o("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    o("Load", "Called"),
                    i = $(e),
                    n = i,
                    this.BaseLoad(i, n)
                } catch (e) {
                    o("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!s)
                        return;
                    o("DefaultMode", "Called"),
                    s = !1
                } catch (e) {
                    o("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function(e) {
                try {
                    if (s)
                        return;
                    if (o("EditMode", "Called"),
                    e) {
                        var r = n.attr("name");
                        r = t.MakeUniquePageName(r),
                        n.attr("name", r)
                    }
                    s = !0
                } catch (e) {
                    o("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    o("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    o("Search", e, Log.Type.Error)
                }
            }
        } catch (e) {
            o("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/textarea", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(r) {
        function o(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "textarea",
            this.Accept = [];
            var i, n, a = this, s = !1;
            this.Create = function(e) {
                try {
                    o("Create", "Called"),
                    i = $('<textarea class="form-control hasPopover" rows="3"></textarea>'),
                    i.attr("ref", a.refClassName),
                    i.attr("name", e),
                    i.attr("placeholder", e),
                    i.attr("data-content", e),
                    i.attr("validator", "required()"),
                    n = i,
                    this.BaseLoad(i, n)
                } catch (e) {
                    o("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    o("Load", "Called"),
                    i = $(e),
                    n = i,
                    this.BaseLoad(i, n)
                } catch (e) {
                    o("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!s)
                        return;
                    o("DefaultMode", "Called"),
                    s = !1
                } catch (e) {
                    o("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function(e) {
                try {
                    if (s)
                        return;
                    if (o("EditMode", "Called"),
                    e) {
                        var r = n.attr("name");
                        r = t.MakeUniquePageName(r),
                        n.attr("name", r)
                    }
                    s = !0
                } catch (e) {
                    o("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    o("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    o("Search", e, Log.Type.Error)
                }
            }
        } catch (e) {
            o("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/checkbox", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(r) {
        function o(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "checkbox",
            this.Accept = [];
            var i, n, a = this, s = !1;
            this.Create = function(e) {
                try {
                    o("Create", "Called"),
                    i = $('<div class="checkbox"><label><input type="checkbox" value="1"><span>' + e + "</span></label></div>"),
                    i.attr("ref", a.refClassName),
                    n = i.find("input"),
                    n.attr("name", e),
                    this.BaseLoad(i, n)
                } catch (e) {
                    o("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    o("Load", "Called"),
                    i = $(e),
                    n = i.find("input"),
                    this.BaseLoad(i, n)
                } catch (e) {
                    o("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!s)
                        return;
                    o("DefaultMode", "Called"),
                    s = !1
                } catch (e) {
                    o("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function(e) {
                try {
                    if (s)
                        return;
                    if (o("EditMode", "Called"),
                    e) {
                        var r = n.attr("name");
                        r = t.MakeUniquePageName(r),
                        n.attr("name", r)
                    }
                    s = !0
                } catch (e) {
                    o("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    o("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    o("Search", e, Log.Type.Error)
                }
            }
        } catch (e) {
            o("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/radio", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(r) {
        function o(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "radio",
            this.Accept = [];
            var i, n, a = this, s = !1;
            this.Create = function(e) {
                try {
                    o("Create", "Called"),
                    i = $('<div class="radio"><label><input type="radio" value="1"><span>' + e + "</span></label></div>"),
                    i.attr("ref", a.refClassName),
                    n = i.find("input"),
                    n.attr("name", e),
                    n.attr("id", e),
                    this.BaseLoad(i, n)
                } catch (e) {
                    o("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    o("Load", "Called"),
                    i = $(e),
                    n = i.find("input"),
                    this.BaseLoad(i, n)
                } catch (e) {
                    o("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!s)
                        return;
                    o("DefaultMode", "Called"),
                    s = !1
                } catch (e) {
                    o("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function(e) {
                try {
                    if (s)
                        return;
                    if (o("EditMode", "Called"),
                    e) {
                        var r = n.attr("id");
                        r = t.MakeUniquePageID(r),
                        n.attr("id", r)
                    }
                    s = !0
                } catch (e) {
                    o("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    o("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    o("Search", e, Log.Type.Error)
                }
            }
        } catch (e) {
            o("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/select", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(r) {
        function o(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "select",
            this.Accept = [];
            var i, n, a = this, s = !1;
            this.Create = function(e) {
                try {
                    o("Create", "Called"),
                    i = $('<select class="form-control hasPopover"><option value="-1">' + e + "</option></select>"),
                    i.attr("ref", a.refClassName),
                    i.attr("name", e),
                    i.attr("data-content", e),
                    i.attr("validator", "select()"),
                    n = i,
                    this.BaseLoad(i, n)
                } catch (e) {
                    o("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    o("Load", "Called"),
                    i = $(e),
                    n = i,
                    this.BaseLoad(i, n)
                } catch (e) {
                    o("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!s)
                        return;
                    o("DefaultMode", "Called"),
                    s = !1
                } catch (e) {
                    o("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function(e) {
                try {
                    if (s)
                        return;
                    if (o("EditMode", "Called"),
                    e) {
                        var r = n.attr("name");
                        r = t.MakeUniquePageName(r),
                        n.attr("name", r)
                    }
                    s = !0
                } catch (e) {
                    o("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    o("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    o("Search", e, Log.Type.Error)
                }
            }
        } catch (e) {
            o("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/button", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(t) {
        function r(e, t, r, o) {
            i.Log(i.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "button",
            this.Accept = [];
            var o, i = this, n = !1;
            this.Create = function(e) {
                try {
                    r("Create", "Called"),
                    o = $('<button type="button" class="btn default_btn"/>'),
                    o.attr("ref", i.refClassName),
                    o.attr("name", e),
                    o.attr("default", "false"),
                    o.attr("validate", "true"),
                    o.attr("we-onclick", "MP.Comm.Post(this)"),
                    o.html(e),
                    this.BaseLoad(o)
                } catch (e) {
                    r("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    r("Load", "Called"),
                    o = $(e),
                    this.BaseLoad(o)
                } catch (e) {
                    r("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!n)
                        return;
                    r("DefaultMode", "Called"),
                    n = !1
                } catch (e) {
                    r("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function(e) {
                try {
                    if (n)
                        return;
                    r("EditMode", "Called"),
                    n = !0
                } catch (e) {
                    r("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    r("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    r("Search", e, Log.Type.Error)
                }
            }
        } catch (e) {
            r("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/div", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(o) {
        function i(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "div",
            this.Accept = ["input", "checkbox", "radio", "textarea", "select", "button", "label", "div"];
            var n, a = this, s = !1;
            this.Create = function(e) {
                try {
                    i("Create", "Called"),
                    n = $('<div class="form-group bs-noSubProps"/>'),
                    n.attr("ref", a.refClassName),
                    this.BaseLoad(n)
                } catch (e) {
                    i("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    i("Load", "Called"),
                    n = $(e),
                    this.BaseLoad(n)
                } catch (e) {
                    i("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!s)
                        return;
                    i("DefaultMode", "Called"),
                    n.droppable("destroy").removeClass("bs-rowBox bs-noSubProps droppable-active droppable-hover"),
                    s = !1
                } catch (e) {
                    i("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function(e) {
                try {
                    if (s)
                        return;
                    i("EditMode", "Called"),
                    n.droppable({
                        accept: r.GetAcceptedComponents(a.Accept),
                        greedy: !0,
                        activeClass: "droppable-active",
                        hoverClass: "droppable-hover",
                        drop: function(e, r) {
                            var o = $(r.draggable).attr("ref");
                            t.BuildComponent(o, this)
                        }
                    }),
                    n.addClass("bs-rowBox bs-noSubProps"),
                    s = !0
                } catch (e) {
                    i("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    i("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    i("Search", e, Log.Type.Error)
                }
            }
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/panel", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(o) {
        function i(e, t, r, o) {
            s.Log(s.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "panel",
            this.Accept = ["row"];
            var n, a, s = this, l = !1;
            this.Create = function(e) {
                try {
                    i("Create", "Called"),
                    n = $('<div class="panel panel-primary"><div class="panel-heading">Panel</div><div class="panel-body"></div></div>'),
                    n.attr("ref", s.refClassName),
                    a = n.find(".panel-body"),
                    this.BaseLoad(n, a)
                } catch (e) {
                    i("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    i("Load", "Called"),
                    n = $(e),
                    a = n.find(".panel-body"),
                    this.BaseLoad(n, a)
                } catch (e) {
                    i("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!l)
                        return;
                    i("DefaultMode", "Called"),
                    a.droppable("destroy").sortable("destroy").removeClass("droppable-active droppable-hover").enableSelection(),
                    l = !1
                } catch (e) {
                    i("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function(e) {
                try {
                    if (l)
                        return;
                    i("EditMode", "Called"),
                    a.droppable({
                        accept: r.GetAcceptedComponents(s.Accept),
                        greedy: !0,
                        activeClass: "droppable-active",
                        hoverClass: "droppable-hover",
                        drop: function(e, r) {
                            var o = $(r.draggable).attr("ref");
                            t.BuildComponent(o, this)
                        }
                    }),
                    a.sortable(),
                    a.disableSelection(),
                    l = !0
                } catch (e) {
                    i("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    i("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    i("Search", e, Log.Type.Error)
                }
            }
            ,
            this.RowCount = function(e) {
                try {
                    i("RowCount", "Called", Log.Type.Info);
                    var r = a.find(">[ref=row]");
                    if (e == o)
                        return r.length;
                    if (e > r.length)
                        for (var n = r.length; n < e; n++)
                            t.BuildComponent("row", a);
                    if (e < r.length)
                        for (var n = r.length; n > e; n--)
                            t.DeleteSelection(r[n - 1])
                } catch (e) {
                    i("RowCount", e, Log.Type.Error)
                }
            }
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/widget", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(o) {
        function i(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "widget",
            this.Accept = [""];
            var n, a = this, s = !1;
            this.Create = function(e) {
                try {
                    i("Create", "Called"),
                    n = $('<div class="form-group bs-noSubProps">Paste widget HTML here</div>'),
                    n.attr("ref", a.refClassName),
                    n.attr("init", ""),
                    this.BaseLoad(n)
                } catch (e) {
                    i("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    i("Load", "Called"),
                    n = $(e),
                    this.BaseLoad(n)
                } catch (e) {
                    i("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!s)
                        return;
                    i("DefaultMode", "Called"),
                    n.droppable("destroy").removeClass("bs-rowBox bs-noSubProps droppable-active droppable-hover"),
                    s = !1
                } catch (e) {
                    i("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function(e) {
                try {
                    if (s)
                        return;
                    i("EditMode", "Called"),
                    n.droppable({
                        accept: r.GetAcceptedComponents(a.Accept),
                        greedy: !0,
                        activeClass: "droppable-active",
                        hoverClass: "droppable-hover",
                        drop: function(e, r) {
                            var o = $(r.draggable).attr("ref");
                            t.BuildComponent(o, this)
                        }
                    }),
                    n.addClass("bs-rowBox bs-noSubProps"),
                    s = !0
                } catch (e) {
                    i("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    i("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    i("Search", e, Log.Type.Error)
                }
            }
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/label", ["bs/templateBase", "Bootstrap", "Editor"], function(e, t, r) {
    function o(t) {
        function r(e, t, r, o) {
            i.Log(i.refClassName + "." + e, t, r, o)
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.refClassName = "label",
            this.Accept = ["input", "textarea", "select"];
            var o, i = this, n = !1;
            this.Create = function(e) {
                try {
                    r("Create", "Called"),
                    o = $('<label class="control-label bs-noSubProps"/>'),
                    o.attr("ref", i.refClassName),
                    o.attr("for", ""),
                    o.html(e),
                    this.BaseLoad(o)
                } catch (e) {
                    r("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    r("Load", "Called"),
                    o = $(e),
                    this.BaseLoad(o)
                } catch (e) {
                    r("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!n)
                        return;
                    r("DefaultMode", "Called"),
                    o.removeClass("bs-noSubProps"),
                    n = !1
                } catch (e) {
                    r("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function(e) {
                try {
                    if (n)
                        return;
                    r("EditMode", "Called"),
                    o.addClass("bs-noSubProps"),
                    n = !0
                } catch (e) {
                    r("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    r("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    r("Search", e, Log.Type.Error)
                }
            }
        } catch (e) {
            r("Main", e, Log.Type.Error)
        }
    }
    return o
}),
define("bs/comp/js", ["bs/templateBase", "Bootstrap", "Editor"], function(TemplateBase, Bootstrap, Editor) {
    function Js(undefined) {
        function Script(e, t, r) {
            this.Name = $.trim(e),
            this.Params = t,
            this.Body = r
        }
        function iLog(e, t, r, o) {
            self.Log(self.refClassName + "." + e, t, r, o)
        }
        function getFunctions(e) {
            try {
                iLog("getFunctions", "Called"),
                e = "\n" + e.substring(e.indexOf("function "), e.length);
                var t = []
                  , r = e.split(/[\n\r]function /);
                if (!r)
                    return t;
                for (var o = 0; o < r.length; o++) {
                    var i = r[o]
                      , n = i.substring(0, i.indexOf("{"))
                      , a = n.match(/\([^\)]+\)/g);
                    if (a = null == a || 0 == a.length ? "" : a[0],
                    a = a.replace("(", "").replace(")", ""),
                    n.indexOf("(") > -1 && (n = n.substring(0, n.indexOf("("))),
                    n) {
                        var s = i.substring(i.indexOf("{") + 1);
                        s = s.substring(0, s.lastIndexOf("}"));
                        var l = new Script(n,a,s);
                        t.push(l)
                    }
                }
                return t
            } catch (e) {
                iLog("getFunctions", e, Log.Type.Error)
            }
        }
        function attachScript(e) {
            try {
                iLog("attachScript", "Called");
                var t = $.trim(e);
                return t.beginsWith("(") ? parseNewCustomScripts(t, !0) : parseOldCustomScripts(t, !0)
            } catch (e) {
                return iLog("attachScript", e, Log.Type.Error, !0),
                e.message
            }
        }
        function resetScripts() {
            window.CustomScript = null,
            window.CustomScript = {}
        }
        function parseNewCustomScripts(script, clearScripts) {
            try {
                eval(script)
            } catch (e) {
                return iLog("parseNewCustomScripts", e.message, Log.Type.Error, !0),
                e.message
            }
        }
        function parseOldCustomScripts(e, t) {
            var r = getFunctions(e);
            if (r.length) {
                t && resetScripts();
                for (var o = "", i = null, n = 0; n < r.length; n++)
                    try {
                        i = r[n],
                        window.CustomScript[i.Name] = new Function(i.Params,i.Body)
                    } catch (e) {
                        o = i ? o + i.Name + " : " + e.message + ", " : o + e.message + ", "
                    }
                return o ? (iLog("parseOldCustomScripts", o, Log.Type.Error, !0),
                o) : void 0
            }
        }
        try {
            this.inheritFrom = TemplateBase,
            this.inheritFrom(),
            this.refClassName = "js",
            this.Accept = [];
            var self = this, control, input, featuresAdded = !1;
            this.Create = function(e) {
                try {
                    iLog("Create", "Called");
                    var t = "(function() {\n  var cs = {}; // Private custom script\n  cs.OnLoad = function() {\n  \tscroll(0,0);\n  };\n\n  // Publish it\n  CustomScript = cs; // Overwrite (default)\n  //$.extend(CustomScript, cs); // Append\n  //CustomAnything = cs; // Create new\n})();\n\n//function OnLoad(){scroll(0,0);} // Or delete everything above and use plain functions\n";
                    control = $("<div><pre>" + t + "</pre></div>"),
                    control.attr("ref", self.refClassName),
                    input = control.find("pre"),
                    this.BaseLoad(control)
                } catch (e) {
                    iLog("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    iLog("Load", "Called"),
                    control = $(e),
                    input = control.find("pre"),
                    this.BaseLoad(control)
                } catch (e) {
                    iLog("Load", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (!featuresAdded)
                        return;
                    iLog("DefaultMode", "Called"),
                    control.removeClass("bs-rowBox"),
                    featuresAdded = !1
                } catch (e) {
                    iLog("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function(e) {
                try {
                    if (featuresAdded)
                        return;
                    iLog("EditMode", "Called"),
                    control.addClass("bs-rowBox").addClass("js-component"),
                    featuresAdded = !0
                } catch (e) {
                    iLog("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    iLog("Search", "Called", Log.Type.Info),
                    this.BaseSearch(e, t)
                } catch (e) {
                    iLog("Search", e, Log.Type.Error)
                }
            }
            ,
            this.ShowEditor = function() {
                function e(e) {
                    input.text(e);
                    var t = attachScript(e);
                    t && jAlert("There are errors:\n\n" + t + "\n\n" + r),
                    resetScripts()
                }
                var t = input.text()
                  , r = "Errors due to #S variables may be OK within the editor.";
                Editor.ShowAceEditorForm(t, "Javascript Editor", r, e, null, {
                    language: "javascript"
                })
            }
        } catch (e) {
            iLog("Main", e, Log.Type.Error)
        }
    }
    return Js
}),
define("page/TemplateBase", ["PropertyFields", "Utilities", "PageHelper", "Editor"], function(e, t, r, o) {
    function i(i) {
        function n(e, t, r, o) {
            var i = f ? f.attr("mp-id") : ""
              , n = p + e;
            n += g ? "." + g.attr("id") || g.attr("name") : "",
            n = i ? n + "." + i : n,
            Log.Add(n, t, r, o)
        }
        function a() {
            try {
                if (n("attachValuelessAttrs", "Called"),
                !g)
                    return;
                var e = g.attr("valuelessAttrs");
                if (!e)
                    return;
                var t = e.match(/[a-zA-Z0-9#_]+/g);
                if (null == t)
                    return;
                for (var r = 0; r < t.length; r++)
                    try {
                        t[r].indexOf("#") > -1 ? g.attr(t[r], "") : g.attr(t[r], " ")
                    } catch (e) {}
            } catch (e) {
                n("attachValuelessAttrs", e, Log.Type.Error)
            }
        }
        function s() {
            try {
                if (n("detachValuelessAttrs", "Called"),
                !g)
                    return;
                var e = g.attr("valuelessAttrs");
                if (!e)
                    return;
                var t = e.match(/[a-zA-Z0-9#_]+/g);
                if (null == t)
                    return;
                for (var r = 0; r < t.length; r++)
                    try {
                        g.removeAttr(t[r])
                    } catch (e) {}
            } catch (e) {
                n("detachValuelessAttrs", e, Log.Type.Error)
            }
        }
        function l(e, t) {
            this.Name = e,
            this.Body = t
        }
        var c, d, u, p = "TmpBase.", h = this, f = null, g = null;
        this.Log = function(e, t, r, o) {
            var i = f ? f.attr("mp-id") : ""
              , n = e;
            n += g ? "." + g.attr("id") || g.attr("name") : "",
            n = i ? n + "." + i : n,
            Log.Add(n, t, r, o)
        }
        ,
        this.BaseLoad = function(e, t, o) {
            try {
                n("BaseLoad", "Called"),
                f = $(e),
                c = o || $.noop,
                t && (g = $(t),
                g.unbind("change.clearerror").bind("change.clearerror", function() {
                    try {
                        var e = r.GetEditorComponent($(this).parent());
                        e.HighlightAsError(!1)
                    } catch (e) {}
                })),
                a()
            } catch (e) {
                n("BaseLoad", e, Log.Type.Error)
            }
        }
        ,
        this.BaseLoad2 = function(e) {
            try {
                n("BaseLoad2", "Called"),
                f = $(e)
            } catch (e) {
                n("BaseLoad2", e, Log.Type.Error)
            }
        }
        ,
        this.AttachFunctions = function() {
            try {
                if (o.Enabled)
                    return void h.UpdateComment(!0);
                if (!f.attr("function"))
                    return;
                n("AttachFunctions", "Called");
                for (var e, r, i, a = f.attr("function").split("|"), s = f.attr("definition").split("|"), l = 0; l < a.length; l++)
                    if (e = t.Trim(a[l]),
                    r = t.Trim(s[l]),
                    !r.beginsWith("#S") && "" != e && "" != r) {
                        i = e.toLowerCase() + ".templatebase";
                        try {
                            var c = new Function(r);
                            g.unbind(i).bind(i, c)
                        } catch (t) {
                            throw n("BindScriptFunction", t + " on " + e + " in " + r, Log.Type.Error, !0),
                            t
                        }
                    }
            } catch (e) {
                n("AttachFunctions", e, Log.Type.Error)
            }
        }
        ,
        this.DetachFunctions = function() {
            try {
                if (n("DetachFunctions", "Called"),
                s(),
                f.attr("function"))
                    for (var e = f.attr("function").split("|"), t = 0; t < e.length; t++) {
                        var r = e[t].toLowerCase() + ".templatebase";
                        g.unbind(r)
                    }
                h.UpdateComment()
            } catch (e) {
                n("DetachFunctions", e, Log.Type.Error)
            }
        }
        ,
        this.AddFunction = function() {
            try {
                n("AddFunction", "Called"),
                null == f.attr("function") || 0 == f.attr("function").length ? (f.attr("function", ""),
                f.attr("definition", "")) : (f.attr("function", f.attr("function") + "|"),
                f.attr("definition", f.attr("definition") + "|"))
            } catch (e) {
                n("AddFunction", e, Log.Type.Error)
            }
        }
        ,
        this.DeleteFunction = function(e) {
            try {
                if (n("DeleteFunction", "Called"),
                !f.attr("function"))
                    return;
                var t;
                t = f.attr("function").match(/|/) ? [$.trim(f.attr("function"))] : f.attr("function").split("|");
                var r = f.attr("definition").split("|");
                t.splice(e, 1),
                r.splice(e, 1),
                f.attr("function", t.toPipeString()),
                f.attr("definition", r.toPipeString()),
                0 == f.attr("function").length && (f.removeAttr("function"),
                f.removeAttr("definition"))
            } catch (e) {
                n("DeleteFunction", e, Log.Type.Error)
            }
        }
        ,
        this.GetBaseProperties = function() {
            try {
                n("GetBaseProperties", "Called");
                var t = f.attr("ref")
                  , o = r.GetParentRef(f)
                  , i = [];
                if (i.push(new PropertyEd.Property(e.Comment,this.GetComment,this.SetComment)),
                "StaticContainer" == o && (i.push(new PropertyEd.Property(e.Left,this.GetLeft,this.SetLeft)),
                i.push(new PropertyEd.Property(e.Top,this.GetTop,this.SetTop))),
                i.push(new PropertyEd.Property(e.SvrCondition,this.GetSvrCondition,this.SetSvrCondition)),
                $.inArray(t, ["ScriptingContainer", "ValidationContainer"]) == -1 && i.push(new PropertyEd.Property(e.CliCondition,this.GetCliCondition,this.SetCliCondition)),
                g && ("EditorLabel" != t ? i.push(new PropertyEd.Property(e.TabIndex,this.GetTabIndex,this.SetTabIndex)) : g.attr("tabindex", "-1"),
                i.push(new PropertyEd.Property(e.Tooltip,this.GetTooltip,this.SetTooltip)),
                i.push(new PropertyEd.Property(e.HelpLink,this.GetHelpLink,this.SetHelpLink)),
                i.push(new PropertyEd.Property(e.ValueLessAttrs,this.GetValueLessAttrs,this.SetValueLessAttrs))),
                "ScriptingContainer" != t) {
                    var a = new RulesMaker.ComplexArgs(this.GetBaseProperties,this.AddFunction,this.DeleteFunction);
                    i.push(new PropertyEd.Property(e.ScriptFunctions,this.GetFunctions,this.SetFunctions,a))
                }
                return g && (i.push(new PropertyEd.Property(e.Style,this.GetStyle,this.SetStyle)),
                $.inArray(t, ["EditorLabel", "EditorLink"]) != -1 ? i.push(new PropertyEd.Property(e.ClassSelect,this.GetClass,this.SetClass)) : i.push(new PropertyEd.Property(e.ClassText,this.GetClass,this.SetClass))),
                i
            } catch (e) {
                n("GetBaseProperties", e, Log.Type.Error)
            }
        }
        ,
        this.GetFunctions = function() {
            try {
                n("GetFunctions", "Called");
                var e = f.attr("function")
                  , t = f.attr("definition");
                if (null == e || null == t)
                    return [];
                var r = [];
                if (e.indexOf("|") > -1) {
                    e = f.attr("function").split("|"),
                    t = f.attr("definition").split("|");
                    for (var o = 0; o < e.length; o++) {
                        var i = new l(e[o],t[o]);
                        r[r.length] = i
                    }
                } else
                    r[0] = new l(e,t);
                return r
            } catch (e) {
                n("GetFunctions", e, Log.Type.Error)
            }
        }
        ,
        this.SetFunctions = function(e) {
            try {
                n("SetFunctions", "Called");
                var r = ""
                  , o = ""
                  , i = !0;
                if (0 == e.length && (i = !1),
                1 == e.length) {
                    var a = t.ReplaceAll(e[0].Name, " ", "");
                    "" == a && (i = !1)
                }
                if (!i)
                    return f.removeAttr("function"),
                    void f.removeAttr("definition");
                for (var s = 0; s < e.length; s++) {
                    var a = t.ReplaceAll(e[s].Name, " ", "");
                    a.length > 0 && (r += e[s].Name + "|",
                    o += e[s].Body + "|")
                }
                e.length > 0 && (r = r.removeLastChar(),
                o = o.removeLastChar()),
                f.attr("function", r),
                f.attr("definition", o)
            } catch (e) {
                n("SetFunctions", e, Log.Type.Error)
            }
        }
        ,
        this.GetComment = function() {
            try {
                var e = f.attr("mp-comment");
                return e || ""
            } catch (e) {
                n("GetComment", e, Log.Type.Error)
            }
        }
        ,
        this.SetComment = function(e) {
            try {
                f.attr("mp-comment", e),
                h.UpdateComment()
            } catch (e) {
                n("SetComment", e, Log.Type.Error)
            }
        }
        ,
        this.GetSvrCondition = function() {
            try {
                var e = f.attr("condition");
                return e || ""
            } catch (e) {
                n("GetSvrCondition", e, Log.Type.Error)
            }
        }
        ,
        this.SetSvrCondition = function(e) {
            try {
                f.attr("condition", e)
            } catch (e) {
                n("SetSvrCondition", e, Log.Type.Error)
            }
        }
        ,
        this.GetCliCondition = function() {
            try {
                var e = f.attr("cli-cond");
                return e || ""
            } catch (e) {
                n("GetCliCondition", e, Log.Type.Error)
            }
        }
        ,
        this.SetCliCondition = function(e) {
            try {
                f.attr("cli-cond", e)
            } catch (e) {
                n("SetCliCondition", e, Log.Type.Error)
            }
        }
        ,
        this.GetTabIndex = function() {
            try {
                return g ? g.attr("tabindex") : 0
            } catch (e) {
                n("GetTabIndex", e, Log.Type.Error)
            }
        }
        ,
        this.SetTabIndex = function(e) {
            try {
                if (!g)
                    return;
                var t = parseInt(e, 0);
                t < 0 && (t = 0),
                g.attr("tabindex", t)
            } catch (e) {
                n("SetTabIndex", e, Log.Type.Error)
            }
        }
        ,
        this.GetValueLessAttrs = function() {
            try {
                if (!g)
                    return "";
                var e = g.attr("valuelessAttrs");
                if (!e)
                    return "";
                var t = e.match(/[a-zA-Z0-9#_]+/g);
                if (null == t)
                    return "";
                var r = t.toString();
                return r.replace(/,/g, " ")
            } catch (e) {
                n("GetValueLessAttrs", e, Log.Type.Error)
            }
        }
        ,
        this.SetValueLessAttrs = function(e) {
            try {
                if (!g)
                    return;
                if (g.removeAttr("valuelessAttrs"),
                null == e)
                    return;
                var t = e.match(/[a-zA-Z0-9#_]+/g);
                if (null == t)
                    return;
                t = t.toString(),
                g.attr("valuelessAttrs", t.replace(/,/g, " "))
            } catch (e) {
                n("SetValueLessAttrs", e, Log.Type.Error)
            }
        }
        ,
        this.GetTooltip = function() {
            try {
                if (!g)
                    return "";
                var e = g.attr("title");
                return e ? e : ""
            } catch (e) {
                n("GetTooltip", e, Log.Type.Error)
            }
        }
        ,
        this.SetTooltip = function(e) {
            try {
                g && g.attr("title", e)
            } catch (e) {
                n("SetTooltip", e, Log.Type.Error)
            }
        }
        ,
        this.GetHelpLink = function() {
            try {
                var e = f.attr("mp-help");
                return e ? e : ""
            } catch (e) {
                n("GetHelpLink", e, Log.Type.Error)
            }
        }
        ,
        this.SetHelpLink = function(e) {
            try {
                f.attr("mp-help", e)
            } catch (e) {
                n("SetHelpLink", e, Log.Type.Error)
            }
        }
        ,
        this.GetLeft = function() {
            try {
                return t.ToNumber(f.css("left"))
            } catch (e) {
                n("GetLeft", e, Log.Type.Error)
            }
        }
        ,
        this.SetLeft = function(e) {
            try {
                f.css("left", t.ToNumber(e) + "px")
            } catch (e) {
                n("SetLeft", e, Log.Type.Error)
            }
        }
        ,
        this.GetTop = function() {
            try {
                return t.ToNumber(f.css("top"))
            } catch (e) {
                n("GetTop", e, Log.Type.Error)
            }
        }
        ,
        this.SetTop = function(e) {
            try {
                f.css("top", t.ToNumber(e) + "px")
            } catch (e) {
                n("SetTop", e, Log.Type.Error)
            }
        }
        ,
        this.HighlightAsError = function(e) {
            try {
                var t = r.GetComponentRef(f)
                  , o = "ui-validation"
                  , i = g;
                i && i.length || (i = f),
                "EditorRadio" == t && (i = $("div[Ref='EditorRadio']").find("input[name='" + g.attr("name") + "']")),
                Browser.IsMSIE() && (o = "error",
                i = i.parent()),
                Browser.IsSafari() && $.inArray(t, ["EditorRadio", "EditorCheckBox", "EditorDropDown"]) > -1 && (i = i.parent()),
                i.toggleClass(o, e)
            } catch (e) {
                n("HighlightAsError", e, Log.Type.Error)
            }
        }
        ,
        this.HighlightAsSelected = function(e) {
            f.find(".moving").toggleClass("ui-selected", e)
        }
        ,
        this.HighlightAsFound = function(e) {
            var t = g || f;
            t.toggleClass("ui-search", e)
        }
        ,
        this.BaseSearch = function(e, r) {
            try {
                if (this.HighlightAsFound(!1),
                !e)
                    return;
                var o = t.MakeRegExp(e, r)
                  , i = !1;
                if (!i && this.GetID && (i = this.GetID().search(o) > -1),
                !i && this.GetName && (i = this.GetName().search(o) > -1),
                !i && this.GetTooltip && (i = this.GetTooltip().search(o) > -1),
                !i && this.GetComment && (i = this.GetComment().search(o) > -1),
                !i && this.GetSvrCondition && (i = this.GetSvrCondition().search(o) > -1),
                !i && this.GetCliCondition && (i = this.GetCliCondition().search(o) > -1),
                !i && this.GetValueLessAttrs && (i = this.GetValueLessAttrs().search(o) > -1),
                !i && this.GetCaption && (i = this.GetCaption().search(o) > -1),
                !i && this.GetStyle && (i = this.GetStyle().search(o) > -1),
                !i && this.GetClass && (i = this.GetClass().search(o) > -1),
                !i && this.GetFunctions) {
                    var a = $.grep(this.GetFunctions(), function(e) {
                        return e.Body.search(o) > -1
                    });
                    i = a.length > 0
                }
                return i ? void n("Search", this, Log.Type.Search) : o
            } catch (e) {
                n("BaseSearch", e, Log.Type.Error)
            }
        }
        ,
        this.DisableHighlighting = function() {
            Global.DisableHighlightingInChrome(!0)
        }
        ,
        this.EnableHighlighting = function() {
            Global.DisableHighlightingInChrome(!1)
        }
        ,
        this.onDragStart = function() {
            Global.DisableHighlightingInChrome(!0),
            d = h.GetLeft(),
            u = h.GetTop()
        }
        ,
        this.onDragStop = function() {
            Global.DisableHighlightingInChrome(!1)
        }
        ,
        this.onDragProgress = function() {
            var e = h.GetLeft()
              , t = h.GetTop()
              , o = r.GetComponentID(f);
            if (r.IsSelected(o) || (r.ClearSelected(),
            r.AddSelected(o)),
            d != e || u != t) {
                var i = e - d
                  , a = t - u
                  , s = r.GetSelected();
                d = e,
                u = t;
                for (var l = 0; l < s.length; l++) {
                    o = s[l];
                    var c = r.GetStoredComponent(o);
                    c ? (e = c.GetLeft(),
                    t = c.GetTop(),
                    c.SetLeft(e + i),
                    c.SetTop(t + a)) : n("Dragging", "Cannot locate component ID: " + o, Log.Type.Warning)
                }
            }
        }
        ,
        this.UpdateComment = function(e) {
            try {
                var t = $.trim(h.GetComment())
                  , r = jQ(f[0]);
                !e && t ? (t = t.replace(/[\n\r]/g, "<br/>"),
                r.jqxTooltip({
                    content: t,
                    showDelay: 1e3,
                    autoHideDelay: 5e4,
                    theme: "editor"
                })) : (r.jqxTooltip("destroy"),
                f.attr("id").beginsWith("jqxWidget") && f.removeAttr("id"))
            } catch (e) {
                n("UpdateComment", e, Log.Type.Error)
            }
        }
        ,
        this.GetStyle = function() {
            try {
                return g ? g.attr("style") || "" : ""
            } catch (e) {
                n("GetStyle", e, Log.Type.Error)
            }
        }
        ,
        this.SetStyle = function(e) {
            try {
                g.attr("style", e || " "),
                c(g)
            } catch (e) {
                n("SetStyle", e, Log.Type.Error)
            }
        }
        ,
        this.GetClass = function() {
            try {
                return g ? (g.removeClass("moving"),
                g.removeClass("ui-selected"),
                g.removeClass("ui-selectee"),
                g.attr("class") || "") : ""
            } catch (e) {
                n("GetClass", e, Log.Type.Error)
            }
        }
        ,
        this.SetClass = function(e) {
            try {
                g.attr("class", e),
                g.addClass("moving")
            } catch (e) {
                n("SetClass", e, Log.Type.Error)
            }
        }
    }
    return i
}),
define("page/comp/TransferList", ["page/TemplateBase", "Utilities", "PageHelper", "Editor"], function(e, t, r, o) {
    function i() {
        function t(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        function i() {
            try {
                if (g)
                    return;
                t("AddFeatures", "Called"),
                g = !0
            } catch (e) {
                t("AddFeatures", e, Log.Type.Error)
            }
        }
        function n() {
            try {
                if (!g)
                    return;
                t("RemoveFeatures", "Called"),
                g = !1
            } catch (e) {
                t("RemoveFeatures", e, Log.Type.Error)
            }
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.NameRequired = !0,
            this.refClassName = "TrfList";
            var a = this
              , s = $("<div ref='TransferList' />")
              , l = null
              , c = null
              , d = null
              , u = null
              , p = null
              , h = null
              , f = null
              , g = !1;
            this.SetFeatures = function(e) {
                g = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    t("AppendTo", "Called"),
                    l.AppendTo(e),
                    l.SetHeight("270");
                    var r = l.GetControl()
                      , i = $(r).parent().css("width");
                    i ? r.css("width", parseInt(i) - 10 + "px") : r.css("width", "840px"),
                    r.attr("transferlist", ""),
                    c.AppendTo(r),
                    d.AppendTo(r);
                    for (var n = [c, d], a = 0; a < n.length; a++) {
                        switch (a) {
                        case 0:
                            n[a].SetLeft("5");
                            break;
                        case 1:
                            n[a].SetLeft("490")
                        }
                        n[a].SetTop("5"),
                        n[a].SetWidth("336"),
                        n[a].SetMultiSelect(!0),
                        n[a].SetSize("12"),
                        n[a].SetCaption("List " + (a + 1))
                    }
                    p.AppendTo(r),
                    p.SetLeft("347"),
                    p.SetTop("15"),
                    p.SetWidth("126"),
                    p.SetCaption("Move Selected -->");
                    var s = new Object;
                    s.Name = "click",
                    s.Body = "TransferListHelper.MoveSelectedRight(this)",
                    p.SetFunctions([s]),
                    u.AppendTo(r),
                    u.SetLeft("347"),
                    u.SetTop("43"),
                    u.SetWidth("126"),
                    u.SetCaption("<-- Move Selected"),
                    s.Body = "TransferListHelper.MoveSelectedLeft(this)",
                    u.SetFunctions([s]),
                    h.AppendTo(r),
                    h.SetLeft("347"),
                    h.SetTop("81"),
                    h.SetWidth("126"),
                    h.SetCaption("<-- Move All"),
                    s.Body = "TransferListHelper.MoveAllLeft(this)",
                    h.SetFunctions([s]),
                    f.AppendTo(r),
                    f.SetLeft("347"),
                    f.SetTop("109"),
                    f.SetWidth("126"),
                    f.SetCaption("Move All -->"),
                    s.Body = "TransferListHelper.MoveAllRight(this)",
                    f.SetFunctions([s]),
                    this.BaseLoad2(r),
                    o.Enabled && this.EditMode()
                } catch (e) {
                    t("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function(e) {
                try {
                    t("Create", "Called"),
                    l = r.CreateEditorComponent("StaticContainer"),
                    c = r.CreateEditorComponent("EditorDropDown", e + "_ListLeft"),
                    d = r.CreateEditorComponent("EditorDropDown", e + "_ListRight"),
                    u = r.CreateEditorComponent("EditorSubmitButton", e + "_MoveSelectedLeft"),
                    p = r.CreateEditorComponent("EditorSubmitButton", e + "_MoveSelectedRight"),
                    h = r.CreateEditorComponent("EditorSubmitButton", e + "_MoveAllLeft"),
                    f = r.CreateEditorComponent("EditorSubmitButton", e + "_MoveAllRight")
                } catch (e) {
                    t("Create", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    t("Refresh", "Called")
                } catch (e) {
                    t("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    t("DefaultMode", "Called"),
                    n()
                } catch (e) {
                    t("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    t("EditMode", "Called"),
                    i()
                } catch (e) {
                    t("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return s
                } catch (e) {
                    t("GetControl", e, Log.Type.Error)
                }
            }
        } catch (e) {
            t("Main", e, Log.Type.Error)
        }
    }
    return i
}),
define("page/comp/EditorSubmitButton", ["page/TemplateBase", "PropertyFields", "Utilities", "PageHelper", "Editor"], function(e, t, r, o, i) {
    function n() {
        function n(e, t, r, o) {
            c.Log(c.refClassName + "." + e, t, r, o)
        }
        function a(e) {
            try {
                n("ResizeControl", "Called"),
                e = e || p;
                var t = e.outerWidth()
                  , r = e.outerHeight();
                e.width(t),
                e.height(r),
                d.css("width", t + 5),
                d.css("height", r)
            } catch (e) {
                n("ResizeControl", e, Log.Type.Error)
            }
        }
        function s() {
            try {
                if (u)
                    return;
                n("AddFeatures", "Called");
                var e = o.GetParentRef(d);
                "StaticContainer" == e && (p.addClass("moving"),
                d.draggable({
                    containment: "parent",
                    cancel: "",
                    grid: MP.Tools.Config.Editor.html.snap,
                    start: c.onDragStart,
                    stop: c.onDragStop,
                    drag: c.onDragProgress
                }),
                d.resizable({
                    autoHide: !0,
                    resize: function(e, t) {
                        p.width(t.size.width),
                        p.height(t.size.height),
                        a()
                    }
                })),
                d.addClass("editing"),
                u = !0
            } catch (e) {
                n("AddFeatures", e, Log.Type.Error)
            }
        }
        function l() {
            try {
                if (!u)
                    return;
                n("RemoveFeatures", "Called"),
                d.draggable("destroy").resizable("destroy").removeClass("editing"),
                p.removeClass("moving"),
                u = !1
            } catch (e) {
                n("RemoveFeatures", e, Log.Type.Error)
            }
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.NameRequired = !0,
            this.refClassName = "EdSubmitBtn";
            var c = this
              , d = null
              , u = !1
              , p = null;
            this.SetFeatures = function(e) {
                u = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    n("AppendTo", "Called"),
                    $(e).append(d),
                    this.BaseLoad(d, p, a),
                    i.Enabled && this.EditMode(),
                    this.Refresh()
                } catch (e) {
                    n("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function(e) {
                try {
                    n("Create", "Called"),
                    d = $("<div condition='' function='CLICK' definition='Communication.SerialRequest($(\"#rightColumn\"),false,this)' />"),
                    d.html("<input type='button' value='" + e + "' id='" + e + "' name='" + e + "'></input>"),
                    d.addClass("component EditorSubmitButton"),
                    d.attr("ref", "EditorSubmitButton"),
                    p = d.find("input"),
                    p.width(100),
                    p.height(22)
                } catch (e) {
                    n("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    n("DefaultMode", "Called"),
                    l(),
                    this.AttachFunctions()
                } catch (e) {
                    n("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    n("EditMode", "Called"),
                    s(),
                    this.DetachFunctions()
                } catch (e) {
                    n("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    n("Load", "Called"),
                    d = $(e),
                    p = $(d.find("input")),
                    this.BaseLoad(d, p, a);
                    var t = p.attr("onclick");
                    r.IsFunction(t) && (t = t.toString(),
                    t.indexOf("Communication.") > -1 && p.removeAttr("onclick"))
                } catch (e) {
                    n("Load", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    n("Refresh", "Called"),
                    a()
                } catch (e) {
                    n("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    n("Search", "Called", Log.Type.Info);
                    this.BaseSearch(e, t)
                } catch (e) {
                    n("Search", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    n("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    e.push(new PropertyEd.Property(t.Name,this.GetName,this.SetName)),
                    e.push(new PropertyEd.Property(t.Caption,this.GetCaption,this.SetCaption)),
                    e.push(new PropertyEd.Property(t.Validate,this.GetCauseValidation,this.SetCauseValidation));
                    var r = o.GetParentRef(d);
                    return "StaticContainer" == r && e.push(new PropertyEd.Property(t.DefaultButton,this.GetDefaultButton,this.SetDefaultButton)),
                    e
                } catch (e) {
                    n("GetProperties", e, Log.Type.Error)
                }
            }
            ,
            this.GetCauseValidation = function() {
                try {
                    var e = p.attr("CauseValidation");
                    return null != e
                } catch (e) {
                    n("GetCauseValidation", e, Log.Type.Error)
                }
            }
            ,
            this.GetDefaultButton = function() {
                try {
                    return "true" == p.attr("DefaultButton")
                } catch (e) {
                    n("GetDefaultButton", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return d
                } catch (e) {
                    n("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.GetCaption = function() {
                try {
                    return p.val()
                } catch (e) {
                    n("GetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.GetHeight = function() {
                try {
                    return r.ToNumber(p.outerHeight())
                } catch (e) {
                    n("GetHeight", e, Log.Type.Error)
                }
            }
            ,
            this.SetHeight = function(e) {
                try {
                    p.height(r.ToNumber(e)),
                    a()
                } catch (e) {
                    n("SetHeight", e, Log.Type.Error)
                }
            }
            ,
            this.GetWidth = function() {
                try {
                    return r.ToNumber(p.outerWidth())
                } catch (e) {
                    n("GetWidth", e, Log.Type.Error)
                }
            }
            ,
            this.SetWidth = function(e) {
                try {
                    p.width(r.ToNumber(e)),
                    a()
                } catch (e) {
                    n("SetWidth", e, Log.Type.Error)
                }
            }
            ,
            this.GetName = function() {
                try {
                    return p.attr("name")
                } catch (e) {
                    n("GetName", e, Log.Type.Error)
                }
            }
            ,
            this.SetName = function(e) {
                try {
                    e != p.attr("id") && p.attr("id", e),
                    e != p.attr("name") && p.attr("name", e)
                } catch (e) {
                    n("SetName", e, Log.Type.Error)
                }
            }
            ,
            this.SetCaption = function(e) {
                try {
                    p.val(e)
                } catch (e) {
                    n("SetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.SetDefaultButton = function(e) {
                try {
                    p.attr("DefaultButton", e)
                } catch (e) {
                    n("SetDefaultButton", e, Log.Type.Error)
                }
            }
            ,
            this.SetCauseValidation = function(e) {
                try {
                    e ? p.attr("CauseValidation", "true") : p.removeAttr("CauseValidation")
                } catch (e) {
                    n("SetCauseValidation", e, Log.Type.Error)
                }
            }
        } catch (e) {
            n("Main", e, Log.Type.Error)
        }
    }
    return n
}),
define("page/comp/EditorDropDown", ["page/TemplateBase", "PropertyFields", "Utilities", "PageHelper", "Editor"], function(e, t, r, o, i) {
    function n() {
        function n(e, t, r, o) {
            c.Log(c.refClassName + "." + e, t, r, o)
        }
        function a(e) {
            try {
                n("ResizeControl", "Called"),
                e = e || p;
                var t = e.outerWidth()
                  , r = e.outerHeight();
                e.width(t),
                d.css("width", t),
                d.css("height", r + 15)
            } catch (e) {
                n("ResizeControl", e, Log.Type.Error)
            }
        }
        function s() {
            try {
                if (u)
                    return;
                n("AddFeatures", "Called");
                var e = o.GetParentRef(d);
                "StaticContainer" == e && (p.addClass("moving"),
                h.addClass("moving"),
                d.draggable({
                    containment: "parent",
                    cancel: "",
                    grid: MP.Tools.Config.Editor.html.snap,
                    start: c.onDragStart,
                    stop: c.onDragStop,
                    drag: c.onDragProgress
                }),
                d.resizable({
                    autoHide: !0,
                    maxHeight: d.height(),
                    minHeight: d.height(),
                    resize: function(e, t) {
                        p.width(t.size.width),
                        a()
                    }
                })),
                d.addClass("editing"),
                u = !0
            } catch (e) {
                n("AddFeatures", e, Log.Type.Error)
            }
        }
        function l() {
            try {
                if (!u)
                    return;
                n("RemoveFeatures", "Called"),
                d.draggable("destroy").resizable("destroy").removeClass("editing"),
                p.removeClass("moving"),
                h.removeClass("moving"),
                u = !1
            } catch (e) {
                n("RemoveFeatures", e, Log.Type.Error)
            }
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.NameRequired = !0,
            this.refClassName = "EdDropdown";
            var c = this
              , d = null
              , u = !1
              , p = null
              , h = null;
            this.SetFeatures = function(e) {
                u = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    n("AppendTo", "Called"),
                    $(e).append(d),
                    this.BaseLoad(d, p, a),
                    i.Enabled && this.EditMode(),
                    this.Refresh()
                } catch (e) {
                    n("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function(e) {
                try {
                    n("Create", "Called"),
                    d = $("<div condition=''/>"),
                    d.html("<span>" + e + "</span><br/><select id='" + e + "' name='" + e + "' size='1'>"),
                    d.addClass("component EditorDropDown"),
                    d.attr("ref", "EditorDropDown"),
                    p = d.find("select"),
                    h = d.find("span"),
                    h.addClass("notRequired"),
                    h.click(function() {
                        p.focus()
                    })
                } catch (e) {
                    n("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    n("DefaultMode", "Called"),
                    l(),
                    this.AttachFunctions()
                } catch (e) {
                    n("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    n("EditMode", "Called"),
                    s(),
                    this.DetachFunctions()
                } catch (e) {
                    n("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    n("Load", "Called"),
                    d = $(e),
                    h = $(d.find("span")),
                    h.css("cursor", "default"),
                    p = $(d).find("select"),
                    h.click(function() {
                        p.focus()
                    }),
                    this.BaseLoad(d, p, a)
                } catch (e) {
                    n("Load", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    n("Refresh", "Called"),
                    a()
                } catch (e) {
                    n("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    n("Search", "Called", Log.Type.Info);
                    var r = this.BaseSearch(e, t);
                    r && this.GetOptions().search(r) > -1 && n("Search", this, Log.Type.Search)
                } catch (e) {
                    n("Search", e, Log.Type.Error)
                }
            }
            ,
            this.GetErrorMessage = function() {
                try {
                    if (this.GetRequired())
                        return "-1" == p.val() ? "You must select from the dropdown '" + h.text() + "'" : null
                } catch (e) {
                    n("GetErrorMessage", e, Log.Type.Error)
                }
            }
            ,
            this.SetFocus = function() {
                try {
                    p.focus()
                } catch (e) {
                    n("SetFocus", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return d
                } catch (e) {
                    n("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    n("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    return e.push(new PropertyEd.Property(t.Name,this.GetName,this.SetName)),
                    e.push(new PropertyEd.Property(t.Caption,this.GetCaption,this.SetCaption)),
                    e.push(new PropertyEd.Property(t.Options,this.GetOptions,this.SetOptions)),
                    e.push(new PropertyEd.Property(t.Size,this.GetSize,this.SetSize)),
                    e.push(new PropertyEd.Property(t.MultiSelect,this.GetMultiSelect,this.SetMultiSelect)),
                    e.push(new PropertyEd.Property(t.Required,this.GetRequired,this.SetRequired)),
                    e
                } catch (e) {
                    n("GetProperties", e, Log.Type.Error)
                }
            }
            ,
            this.GetCaption = function() {
                try {
                    return h.text()
                } catch (e) {
                    n("GetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.GetName = function() {
                try {
                    return p.attr("name")
                } catch (e) {
                    n("GetName", e, Log.Type.Error)
                }
            }
            ,
            this.GetOptions = function() {
                try {
                    return p.html()
                } catch (e) {
                    n("GetOptions", e, Log.Type.Error)
                }
            }
            ,
            this.GetMultiSelect = function() {
                try {
                    return p.attr("multiple")
                } catch (e) {
                    n("GetMultiSelect", e, Log.Type.Error)
                }
            }
            ,
            this.GetRequired = function() {
                try {
                    return h.hasClass("required")
                } catch (e) {
                    n("GetRequired", e, Log.Type.Error)
                }
            }
            ,
            this.GetSize = function() {
                try {
                    return p.attr("size")
                } catch (e) {
                    n("GetSize", e, Log.Type.Error)
                }
            }
            ,
            this.GetWidth = function() {
                try {
                    return r.ToNumber(p.outerWidth())
                } catch (e) {
                    n("GetWidth", e, Log.Type.Error)
                }
            }
            ,
            this.SetWidth = function(e) {
                try {
                    p.width(r.ToNumber(e)),
                    a()
                } catch (e) {
                    n("SetWidth", e, Log.Type.Error)
                }
            }
            ,
            this.SetCaption = function(e) {
                try {
                    h.text(e)
                } catch (e) {
                    n("SetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.SetName = function(e) {
                try {
                    e != p.attr("id") && p.attr("id", e),
                    e != p.attr("name") && p.attr("name", e)
                } catch (e) {
                    n("SetName", e, Log.Type.Error)
                }
            }
            ,
            this.SetMultiSelect = function(e) {
                try {
                    1 == e || "true" == e ? p.attr("multiple", "multiple") : p.attr("multiple", "")
                } catch (e) {
                    n("SetMultiSelect", e, Log.Type.Error)
                }
            }
            ,
            this.SetOptions = function(e) {
                try {
                    p.html(e)
                } catch (e) {
                    n("SetOptions", e, Log.Type.Error)
                }
            }
            ,
            this.SetRequired = function(e) {
                try {
                    1 == e || "true" == e ? h.removeClass("notRequired").addClass("required") : h.removeClass("required").addClass("notRequired")
                } catch (e) {
                    n("SetRequired", e, Log.Type.Error)
                }
            }
            ,
            this.SetSize = function(e) {
                try {
                    p.attr("size", e),
                    a()
                } catch (e) {
                    n("SetSize", e, Log.Type.Error)
                }
            }
        } catch (e) {
            n("Main", e, Log.Type.Error)
        }
    }
    return n
}),
define("page/comp/EditorLabel", ["page/TemplateBase", "PropertyFields", "PageHelper", "Editor"], function(e, t, r, o) {
    function i() {
        function i(e, t, r, o) {
            s.Log(s.refClassName + "." + e, t, r, o)
        }
        function n() {
            try {
                if (c)
                    return;
                i("AddFeatures", "Called");
                var e = r.GetParentRef(l);
                "StaticContainer" == e && (l.draggable({
                    containment: "parent",
                    cancel: "",
                    grid: MP.Tools.Config.Editor.html.snap,
                    start: s.onDragStart,
                    stop: s.onDragStop,
                    drag: s.onDragProgress
                }),
                l.resizable({
                    autoHide: !0,
                    maxHeight: l.height(),
                    minHeight: l.height(),
                    grid: MP.Tools.Config.Editor.html.snap
                })),
                d.addClass("moving"),
                l.addClass("editing").addClass("moving"),
                c = !0
            } catch (e) {
                i("AddFeatures", e, Log.Type.Error)
            }
        }
        function a() {
            try {
                if (!c)
                    return;
                i("RemoveFeatures", "Called"),
                d.removeClass("moving"),
                l.draggable("destroy").resizable("destroy").removeClass("editing").removeClass("moving"),
                c = !1
            } catch (e) {
                i("RemoveFeatures", e, Log.Type.Error)
            }
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.NameRequired = !1,
            this.refClassName = "EdLabel";
            var s = this
              , l = null
              , c = !1
              , d = null;
            this.SetFeatures = function(e) {
                c = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    i("AppendTo", "Called"),
                    $(e).append(l),
                    this.BaseLoad(l, d),
                    o.Enabled && this.EditMode(),
                    this.Refresh()
                } catch (e) {
                    i("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function() {
                try {
                    i("Create", "Called"),
                    l = $("<div condition=''/>"),
                    l.html("<label class='handle Default'>LABEL</label>"),
                    l.addClass("component EditorLabel"),
                    l.attr("ref", "EditorLabel"),
                    d = l.find("label")
                } catch (e) {
                    i("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    i("DefaultMode", "Called"),
                    a(),
                    this.AttachFunctions()
                } catch (e) {
                    i("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    i("EditMode", "Called"),
                    n(),
                    this.DetachFunctions()
                } catch (e) {
                    i("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    i("Load", "Called"),
                    l = $(e),
                    d = $(l.find("label")),
                    this.BaseLoad(l, d)
                } catch (e) {
                    i("Load", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    i("Refresh", "Called")
                } catch (e) {
                    i("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    i("Search", "Called", Log.Type.Info);
                    this.BaseSearch(e, t)
                } catch (e) {
                    i("Search", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return l
                } catch (e) {
                    i("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    i("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    return e.push(new PropertyEd.Property(t.ID,this.GetID,this.SetID)),
                    e.push(new PropertyEd.Property(t.Caption,this.GetCaption,this.SetCaption)),
                    e
                } catch (e) {
                    i("GetProperties", e, Log.Type.Error)
                }
            }
            ,
            this.GetID = function() {
                try {
                    return d.attr("id")
                } catch (e) {
                    i("GetID", e, Log.Type.Error)
                }
            }
            ,
            this.SetID = function(e) {
                try {
                    e != d.attr("id") && d.attr("id", e)
                } catch (e) {
                    i("SetID", e, Log.Type.Error)
                }
            }
            ,
            this.GetCaption = function() {
                try {
                    return d.html()
                } catch (e) {
                    i("GetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.SetCaption = function(e) {
                try {
                    d.html(e)
                } catch (e) {
                    i("SetCaption", e, Log.Type.Error)
                }
            }
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    return i
}),
define("page/comp/EditorLink", ["page/TemplateBase", "PropertyFields", "PageHelper", "Editor"], function(e, t, r, o) {
    function i() {
        function i(e, t, r, o) {
            s.Log(s.refClassName + "." + e, t, r, o)
        }
        function n() {
            try {
                if (c)
                    return;
                i("AddFeatures", "Called");
                var e = d.attr("onclick")
                  , t = "";
                if (Utilities.IsFunction(e)) {
                    t = String(e);
                    var o = t.indexOf("{") + 1
                      , n = t.lastIndexOf("}");
                    t = t.substring(o, n),
                    t = Utilities.Trim(t),
                    d.removeAttr("onclick")
                } else
                    t = s.GetTarget();
                s.SetTarget(t);
                var a = r.GetParentRef(l);
                "StaticContainer" == a && l.draggable({
                    containment: "parent",
                    cancel: "",
                    grid: MP.Tools.Config.Editor.html.snap,
                    start: s.onDragStart,
                    stop: s.onDragStop,
                    drag: s.onDragProgress
                }),
                d.addClass("moving"),
                l.addClass("editing").addClass("moving"),
                c = !0
            } catch (e) {
                i("AddFeatures", e, Log.Type.Error)
            }
        }
        function a() {
            try {
                if (!c)
                    return;
                i("RemoveFeatures", "Called"),
                d.removeClass("moving"),
                l.draggable("destroy").removeClass("editing").removeClass("moving"),
                c = !1
            } catch (e) {
                i("RemoveFeatures", e, Log.Type.Error)
            }
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.NameRequired = !1,
            this.refClassName = "EdLink";
            var s = this
              , l = null
              , c = !1
              , d = null;
            this.SetFeatures = function(e) {
                c = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    i("AppendTo", "Called"),
                    $(e).append(l),
                    this.BaseLoad(l, d),
                    o.Enabled && this.EditMode(),
                    this.Refresh()
                } catch (e) {
                    i("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function() {
                try {
                    i("Create", "Called"),
                    l = $("<div condition=''/>"),
                    l.html("<a class='handle Default' style='cursor: pointer;' onclick='Communication.LinkRequest();'>LINK</a>"),
                    l.addClass("component EditorLink"),
                    l.attr("ref", "EditorLink"),
                    d = l.find("a")
                } catch (e) {
                    i("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    i("DefaultMode", "Called"),
                    a(),
                    this.AttachFunctions()
                } catch (e) {
                    i("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    i("EditMode", "Called"),
                    n(),
                    this.DetachFunctions()
                } catch (e) {
                    i("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    i("Load", "Called"),
                    l = $(e),
                    d = $(l.find("a")),
                    this.BaseLoad(l, d)
                } catch (e) {
                    i("Load", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    i("Refresh", "Called")
                } catch (e) {
                    i("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    i("Search", "Called", Log.Type.Info);
                    var r = this.BaseSearch(e, t);
                    r && this.GetTarget().search(r) > -1 && i("Search", this, Log.Type.Search)
                } catch (e) {
                    i("Search", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return l
                } catch (e) {
                    i("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    i("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    return e.push(new PropertyEd.Property(t.ID,this.GetID,this.SetID)),
                    e.push(new PropertyEd.Property(t.Caption,this.GetCaption,this.SetCaption)),
                    e.push(new PropertyEd.Property(t.Target,this.GetTarget,this.SetTarget)),
                    e
                } catch (e) {
                    i("GetProperties", e, Log.Type.Error)
                }
            }
            ,
            this.GetID = function() {
                try {
                    return d.attr("id")
                } catch (e) {
                    i("GetID", e, Log.Type.Error)
                }
            }
            ,
            this.SetID = function(e) {
                try {
                    e != d.attr("id") && d.attr("id", e)
                } catch (e) {
                    i("SetID", e, Log.Type.Error)
                }
            }
            ,
            this.GetCaption = function() {
                try {
                    return d.text()
                } catch (e) {
                    i("GetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.SetCaption = function(e) {
                try {
                    d.text(e)
                } catch (e) {
                    i("SetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.GetTarget = function() {
                try {
                    return String(d.attr("mp-target"))
                } catch (e) {
                    i("GetTarget", e, Log.Type.Error)
                }
            }
            ,
            this.SetTarget = function(e) {
                try {
                    d.attr("mp-target", String(e))
                } catch (e) {
                    i("SetTarget", e, Log.Type.Error)
                }
            }
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    return i
}),
define("page/comp/EditorDiv", ["page/TemplateBase", "PropertyFields", "PageHelper", "Editor"], function(e, t, r, o) {
    function i() {
        function i(e, t, r, o) {
            l.Log(l.refClassName + "." + e, t, r, o)
        }
        function n() {
            try {
                if (d)
                    return;
                i("AddFeatures", "Called");
                var e = r.GetParentRef(c);
                "StaticContainer" == e && (c.draggable({
                    containment: "parent",
                    cancel: "",
                    grid: MP.Tools.Config.Editor.html.snap,
                    start: l.onDragStart,
                    stop: l.onDragStop,
                    drag: l.onDragProgress
                }),
                c.resizable({
                    autoHide: !0,
                    grid: MP.Tools.Config.Editor.html.snap,
                    resize: s,
                    stop: s
                })),
                u.addClass("moving"),
                c.addClass("editing").addClass("moving"),
                d = !0
            } catch (e) {
                i("AddFeatures", e, Log.Type.Error)
            }
        }
        function a() {
            try {
                if (!d)
                    return;
                i("RemoveFeatures", "Called"),
                u.removeClass("moving"),
                c.draggable("destroy").resizable("destroy").removeClass("editing").removeClass("moving"),
                d = !1
            } catch (e) {
                i("RemoveFeatures", e, Log.Type.Error)
            }
        }
        function s(e) {
            try {
                if (i("ResizeControl", "Called"),
                e && e.length && e.get(0) == u.get(0)) {
                    var t = e.attr("style")
                      , r = /width:/i.test(t) ? u.css("width") : ""
                      , o = /height:/i.test(t) ? u.css("height") : "";
                    c.css("width", r),
                    c.css("height", o)
                } else {
                    var r = Utilities.ToNumber(c.css("width"))
                      , o = Utilities.ToNumber(c.css("height"));
                    u.width(r),
                    u.height(o)
                }
            } catch (e) {
                i("ResizeControl", e, Log.Type.Error)
            }
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.NameRequired = !1,
            this.refClassName = "EdDiv";
            var l = this
              , c = null
              , d = !1
              , u = null;
            this.SetFeatures = function(e) {
                d = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    i("AppendTo", "Called"),
                    $(e).append(c),
                    this.BaseLoad(c, u, s),
                    o.Enabled && this.EditMode(),
                    this.Refresh()
                } catch (e) {
                    i("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function() {
                try {
                    i("Create", "Called"),
                    c = $("<div condition='' />"),
                    c.html("<div>DIV</div>"),
                    c.addClass("component EditorDiv"),
                    c.attr("ref", "EditorDiv"),
                    u = c.find("div")
                } catch (e) {
                    i("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    i("DefaultMode", "Called"),
                    a(),
                    this.AttachFunctions()
                } catch (e) {
                    i("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    i("EditMode", "Called"),
                    n(),
                    this.DetachFunctions()
                } catch (e) {
                    i("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    i("Load", "Called"),
                    c = $(e),
                    u = c.find("div"),
                    this.BaseLoad(c, u, s)
                } catch (e) {
                    i("Load", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    i("Refresh", "Called"),
                    s()
                } catch (e) {
                    i("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    i("Search", "Called", Log.Type.Info);
                    var r = this.BaseSearch(e, t);
                    r && this.GetHTML().search(r) > -1 && i("Search", this, Log.Type.Search)
                } catch (e) {
                    i("Search", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return c
                } catch (e) {
                    i("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    i("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    return e.push(new PropertyEd.Property(t.ID,this.GetID,this.SetID)),
                    e.push(new PropertyEd.Property(t.HtmlBody,this.GetHTML,this.SetHTML)),
                    e
                } catch (e) {
                    i("GetProperties", e, Log.Type.Error);
                }
            }
            ,
            this.GetID = function() {
                try {
                    return u.attr("id")
                } catch (e) {
                    i("GetID", e, Log.Type.Error)
                }
            }
            ,
            this.SetID = function(e) {
                try {
                    e != u.attr("id") && u.attr("id", e)
                } catch (e) {
                    i("SetID", e, Log.Type.Error)
                }
            }
            ,
            this.GetHTML = function() {
                try {
                    return u.html()
                } catch (e) {
                    i("GetHTML", e, Log.Type.Error)
                }
            }
            ,
            this.SetHTML = function(e) {
                try {
                    u.html(e)
                } catch (e) {
                    i("SetHTML", e, Log.Type.Error)
                }
            }
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    return i
}),
define("page/comp/EditorText", ["page/TemplateBase", "page/ValidationBase", "PropertyFields", "Utilities", "PageHelper", "Editor"], function(e, t, r, o, i, n) {
    function a() {
        function a(e, t, r, o) {
            d.Log(d.refClassName + "." + e, t, r, o)
        }
        function s(e) {
            try {
                a("ResizeControl", "Called"),
                e = e || h;
                var t = o.ToNumber(e.width())
                  , r = o.ToNumber(e.height());
                if (t < 1 || r < 1)
                    return;
                e.width(t);
                var n = o.ToNumber(u.css("padding-left")) + o.ToNumber(u.css("border-left-width"))
                  , s = o.ToNumber(u.css("padding-right")) + o.ToNumber(u.css("border-right-width"))
                  , l = o.ToNumber(e.css("margin-top")) + o.ToNumber(e.css("border-top-width"))
                  , c = t;
                Browser.IsMSIE() ? t -= n : (t -= n + s,
                n += 1,
                Browser.IsFirefox() && (l += 1)),
                f.width(t).height(r);
                var d = i.GetParentRef(u);
                "StaticContainer" == d ? f.css("left", n + "px").css("top", l + "px") : f.css("left", "").css("top", ""),
                u.css("width", c + "px")
            } catch (e) {
                a("ResizeControl", e, Log.Type.Error)
            }
        }
        function l() {
            try {
                if (p)
                    return;
                a("AddFeatures", "Called");
                var e = i.GetParentRef(u);
                "StaticContainer" == e && (h.addClass("moving"),
                u.draggable({
                    containment: "parent",
                    cancel: "",
                    grid: MP.Tools.Config.Editor.html.snap,
                    start: d.onDragStart,
                    stop: d.onDragStop,
                    drag: d.onDragProgress
                }),
                u.resizable({
                    autoHide: !0,
                    maxHeight: u.height(),
                    minHeight: u.height(),
                    resize: function(e, t) {
                        h.width(t.size.width),
                        s()
                    }
                })),
                h.bind("click.EditorText", function(e) {
                    e.stopPropagation(),
                    this.focus()
                }),
                u.addClass("editing"),
                p = !0
            } catch (e) {
                a("AddFeatures", e, Log.Type.Error)
            }
        }
        function c() {
            try {
                if (!p)
                    return;
                a("RemoveFeatures", "Called"),
                u.draggable("destroy").resizable("destroy").removeClass("editing"),
                h.removeClass("moving").unbind("click.EditorText"),
                p = !1
            } catch (e) {
                a("RemoveFeatures", e, Log.Type.Error)
            }
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.inheritFrom = t,
            this.inheritFrom(),
            this.NameRequired = !0,
            this.refClassName = "EdText",
            this.UserUpdate = !1,
            this.Corrected = !1,
            this.DatepickerShown = !1;
            var d = this
              , u = null
              , p = !1
              , h = null
              , f = null;
            this.SetFeatures = function(e) {
                p = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    a("AppendTo", "Called"),
                    $(e).append(u),
                    this.BaseLoad(u, h, s),
                    this.ValidationBaseLoad(u, h),
                    n.Enabled && this.EditMode(),
                    this.Refresh()
                } catch (e) {
                    a("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function(e) {
                try {
                    a("Create", "Called"),
                    u = $("<div condition=''/>"),
                    u.html("<span>" + e + "</span><input id='" + e + "' name='" + e + "' maxlength='30'>"),
                    u.addClass("component EditorText"),
                    u.attr("ref", "EditorText"),
                    h = u.find("input"),
                    f = u.find("span"),
                    f.addClass("notRequired"),
                    f.click(function() {
                        h.focus()
                    })
                } catch (e) {
                    a("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    a("DefaultMode", "Called"),
                    c(),
                    this.AttachFilter(),
                    this.AttachFunctions(),
                    h.css("margin-left", "");
                    var e = o.Trim(h.val());
                    if (h.val(e),
                    this.GetFilters && !h.attr("disabled") && !h.attr("readonly")) {
                        for (var t = !1, r = null, i = null, n = "mm/dd/yy", s = this.GetFilters(), l = 0; l < s.length; l++) {
                            var u = s[l];
                            if ("DATE" == u.Filter && "DATE" == u.DType && u.Param) {
                                t = !0,
                                n = u.Param.toLowerCase().replace("yyyy", "yy");
                                break
                            }
                            if ("DATE" == u.Filter && (t = !0),
                            "DATE" == u.DType) {
                                var p = u.Param.split("/")
                                  , f = parseInt(p[2], 10)
                                  , g = parseInt(p[0], 10) - 1
                                  , m = parseInt(p[1], 10);
                                "GREATERTHANEQUALS" == u.Filter && (r = new Date(f,g,m)),
                                "GREATERTHAN" == u.Filter && (r = new Date(f,g,m + 1)),
                                "LESSTHANEQUALS" == u.Filter && (i = new Date(f,g,m)),
                                "LESSTHAN" == u.Filter && (i = new Date(f,g,m - 1))
                            }
                        }
                        t && (h.removeClass("hasDatepicker"),
                        h.datepicker({
                            minDate: r,
                            maxDate: i,
                            showOn: "",
                            dateFormat: n,
                            changeMonth: !0,
                            changeYear: !0,
                            showAnim: "fadeIn",
                            onClose: function(e, t) {
                                d.DatepickerShown = !1,
                                $(t.input).focus()
                            },
                            beforeShow: function(e, t) {
                                d.DatepickerShown = !0;
                                var r = $(e).val();
                                if (r) {
                                    if (o.IsDate(r, u.Param)) {
                                        var i = new Date.parse(r)
                                          , n = i.getFullYear()
                                          , a = i.getMonth()
                                          , s = i.getDate();
                                        $(this).datepicker("option", "defaultDate", new Date(n,a,s))
                                    }
                                } else
                                    $(this).datepicker("option", "defaultDate", new Date)
                            }
                        }),
                        h.bind("dblclick.datepicker-custom", function() {
                            h.datepicker("show")
                        }))
                    }
                } catch (e) {
                    a("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    a("EditMode", "Called");
                    var e = o.Trim(h.val());
                    h.val(e),
                    l(),
                    h.css("margin-left", ""),
                    this.DetachFilter(),
                    this.DetachFunctions(),
                    h.unbind(".datepicker-custom"),
                    h.datepicker("destroy"),
                    h.removeClass("hasDatepicker")
                } catch (e) {
                    a("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    a("Load", "Called"),
                    u = $(e),
                    f = $(u.find("span")),
                    f.css("cursor", "text"),
                    h = $(u.find("input")),
                    this.BaseLoad(u, h, s),
                    f.click(function() {
                        h.focus()
                    }),
                    n.Enabled || (h.attr("sMask") && h.data("submit-type", "MASK"),
                    0 == o.Trim(h.val()).length ? f.css("font-size", "1em") : f.css("font-size", ".6em"),
                    h.keyup(function() {
                        0 == this.value.length ? f.css("font-size", "1em") : f.css("font-size", ".6em")
                    }),
                    h.hover(function() {
                        f.css("font-size", "1em")
                    }, function() {
                        0 == o.Trim(h.val()).length ? f.css("font-size", "1em") : f.css("font-size", ".6em")
                    }),
                    f.hover(function() {
                        f.css("font-size", "1em")
                    }, function() {
                        0 == o.Trim(h.val()).length ? f.css("font-size", "1em") : f.css("font-size", ".6em")
                    })),
                    this.ValidationBaseLoad(u, h)
                } catch (e) {
                    a("Load", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    a("Refresh", "Called"),
                    s()
                } catch (e) {
                    a("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.CorrectUI = function() {
                try {
                    if (this.Corrected)
                        return;
                    a("CorrectUI", "Called"),
                    s(),
                    this.Corrected = !0
                } catch (e) {
                    a("CorrectUI", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    a("Search", "Called", Log.Type.Info);
                    var r = this.BaseSearch(e, t);
                    if (r) {
                        var o = $.grep(this.GetFilters(), function(e) {
                            return e.Param.search(r) > -1
                        });
                        o.length > 0 && a("Search", this, Log.Type.Search)
                    }
                } catch (e) {
                    a("Search", e, Log.Type.Error)
                }
            }
            ,
            this.SetFocus = function() {
                try {
                    h.focus()
                } catch (e) {
                    a("SetFocus", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return u
                } catch (e) {
                    a("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.GetErrorMessage = function() {
                try {
                    if (this.GetRequired())
                        return 0 == o.Trim(h.val()).length ? "You must enter the field marked '" + f.text() + "'" : null
                } catch (e) {
                    a("GetErrorMessage", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    a("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    return e.push(new PropertyEd.Property(r.Type,this.GetType,this.SetType)),
                    e.push(new PropertyEd.Property(r.Name,this.GetName,this.SetName)),
                    e.push(new PropertyEd.Property(r.Caption,this.GetCaption,this.SetCaption)),
                    e.push(new PropertyEd.Property(r.MaxLength,this.GetMaxLength,this.SetMaxLength)),
                    e.push(new PropertyEd.Property(r.Required,this.GetRequired,this.SetRequired)),
                    e.push(new PropertyEd.Property(r.Secure,this.GetSecure,this.SetSecure)),
                    this.GetValidationProperties(e)
                } catch (e) {
                    a("GetProperties", e, Log.Type.Error)
                }
            }
            ,
            this.GetType = function() {
                try {
                    return h.attr("mp-type") || h.attr("type")
                } catch (e) {
                    a("GetType", e, Log.Type.Error)
                }
            }
            ,
            this.SetType = function(e) {
                try {
                    h.attr("mp-type", e || "text")
                } catch (e) {
                    a("SetType", e, Log.Type.Error)
                }
            }
            ,
            this.GetCaption = function() {
                try {
                    return f.text()
                } catch (e) {
                    a("GetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.SetCaption = function(e) {
                try {
                    f.text(e)
                } catch (e) {
                    a("SetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.GetMaxLength = function() {
                try {
                    return h.attr("maxlength")
                } catch (e) {
                    a("GetMaxLength", e, Log.Type.Error)
                }
            }
            ,
            this.SetMaxLength = function(e) {
                try {
                    h.attr("maxlength", e)
                } catch (e) {
                    a("SetMaxLength", e, Log.Type.Error)
                }
            }
            ,
            this.GetName = function() {
                try {
                    return h.attr("name")
                } catch (e) {
                    a("GetName", e, Log.Type.Error)
                }
            }
            ,
            this.SetName = function(e) {
                try {
                    e != h.attr("id") && h.attr("id", e),
                    e != h.attr("name") && h.attr("name", e)
                } catch (e) {
                    a("SetName", e, Log.Type.Error)
                }
            }
            ,
            this.GetRequired = function() {
                try {
                    return f.hasClass("required")
                } catch (e) {
                    a("GetRequired", e, Log.Type.Error)
                }
            }
            ,
            this.SetRequired = function(e) {
                try {
                    1 == e || "true" == e ? f.removeClass("notRequired").addClass("required") : f.removeClass("required").addClass("notRequired")
                } catch (e) {
                    a("SetRequired", e, Log.Type.Error)
                }
            }
            ,
            this.GetSecure = function() {
                try {
                    return h.attr("sValue") && h.attr("sMask")
                } catch (e) {
                    a("GetSecure", e, Log.Type.Error)
                }
            }
            ,
            this.SetSecure = function(e) {
                try {
                    e ? (h.attr("sValue", "#S" + h.attr("name") + "-sValue#"),
                    h.attr("sMask", "#S" + h.attr("name") + "-sMask#")) : (h.removeAttr("sValue"),
                    h.removeAttr("sMask"))
                } catch (e) {
                    a("SetSecure", e, Log.Type.Error)
                }
            }
            ,
            this.GetWidth = function() {
                try {
                    return o.ToNumber(h.width())
                } catch (e) {
                    a("GetWidth", e, Log.Type.Error)
                }
            }
            ,
            this.SetWidth = function(e) {
                try {
                    h.width(o.ToNumber(e)),
                    s()
                } catch (e) {
                    a("SetWidth", e, Log.Type.Error)
                }
            }
        } catch (e) {
            a("Main", e, Log.Type.Error)
        }
    }
    return a
}),
define("page/comp/EditorMemo", ["page/TemplateBase", "PropertyFields", "Utilities", "PageHelper", "Editor"], function(e, t, r, o, i) {
    function n() {
        function n(e, t, r, o) {
            d.Log(d.refClassName + "." + e, t, r, o)
        }
        function a(e) {
            try {
                n("ResizeControl", "Called");
                var t, r;
                if (e && e.width && e.height ? (t = e.width(),
                r = e.height()) : (t = d.GetWidth(),
                r = d.GetHeight()),
                t < 1 || r < 1)
                    return;
                h.width(t).height(r),
                f.width(t).height(r),
                u.css("width", t).css("height", r)
            } catch (e) {
                n("ResizeControl", e, Log.Type.Error)
            }
        }
        function s() {
            try {
                if (p)
                    return;
                n("AddFeatures", "Called");
                var e = o.GetParentRef(u);
                "StaticContainer" == e && (h.addClass("moving"),
                u.draggable({
                    containment: "parent",
                    cancel: "",
                    grid: MP.Tools.Config.Editor.html.snap,
                    start: d.onDragStart,
                    stop: d.onDragStop,
                    drag: d.onDragProgress
                }),
                u.resizable({
                    autoHide: !0,
                    grid: MP.Tools.Config.Editor.html.snap,
                    resize: a,
                    stop: a
                })),
                u.addClass("editing"),
                p = !0
            } catch (e) {
                n("AddFeatures", e, Log.Type.Error)
            }
        }
        function l() {
            try {
                if (!p)
                    return;
                n("RemoveFeatures", "Called"),
                u.draggable("destroy").resizable("destroy").removeClass("editing"),
                h.removeClass("moving"),
                c(!0),
                p = !1
            } catch (e) {
                n("RemoveFeatures", e, Log.Type.Error)
            }
        }
        function c(e) {
            try {
                if (e) {
                    var t = u.find("div.ckEditorDiv");
                    d.GetEditHTML() ? (t.length || (t = $("<div class='ckEditorDiv'/>"),
                    t.appendTo(u)),
                    t.html(h.val())) : t.length && t.remove()
                }
                f.hasClass("EditorMemoSpan") || (n("", "Incompatible element! This page must be resaved by the editor.", Log.Type.Warning),
                f.addClass("EditorMemoSpan"),
                f.removeAttr("style"),
                h.removeAttr("style"))
            } catch (e) {
                n("CleanUp", e, Log.Type.Error)
            }
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.NameRequired = !0,
            this.refClassName = "EdMemo",
            this.Corrected = !1;
            var d = this
              , u = null
              , p = !1
              , h = null
              , f = null;
            this.SetFeatures = function(e) {
                p = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    n("AppendTo", "Called"),
                    $(e).append(u),
                    this.BaseLoad(u, h, a),
                    i.Enabled && this.EditMode(),
                    this.Refresh()
                } catch (e) {
                    n("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function(e) {
                try {
                    n("Create", "Called"),
                    u = $("<div ref='EditorMemo' style='width: 100px; height: 80px;' condition=''/>"),
                    u.html("<span>" + e + "</span><textarea id='" + e + "' name='" + e + "'></textarea><div class='ckEditorDiv'/></div>"),
                    u.addClass("component EditorMemo"),
                    h = u.find("textarea"),
                    f = u.find("span"),
                    f.addClass("EditorMemoSpan notRequired"),
                    f.click(function() {
                        h.focus()
                    })
                } catch (e) {
                    n("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    if (n("DefaultMode", "Called"),
                    l(),
                    this.AttachFunctions(),
                    i.Enabled)
                        return;
                    var e = u.find("div.ckEditorDiv");
                    if ("true" == u.attr("EditHTML")) {
                        var t, r = h.attr("id"), o = h.attr("title");
                        1 != e.length ? n("DefaultMode", "CkEditor incompatible element! This page must be saved by the editor.", Log.Type.Warning) : (t = h.detach(),
                        h = e,
                        h.attr("id", r).attr("title", o).show());
                        var a = Global.ConvertToInlineCKEditor(h);
                        if (a)
                            f.remove(),
                            t.remove();
                        else {
                            if (!t)
                                return;
                            h.remove(),
                            h = t,
                            h.appendTo(u)
                        }
                        return a
                    }
                    if ("true" == u.attr("SpellCheck"))
                        return void u.append("<div class='MemoSpellButton' title='Spellcheck' onclick='Global.AddSpellcheck(this)'></div>");
                    e.remove()
                } catch (e) {
                    n("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    n("EditMode", "Called"),
                    s(),
                    this.DetachFunctions(),
                    u.find("div.ckEditorDiv").hide()
                } catch (e) {
                    n("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    n("Load", "Called"),
                    u = $(e),
                    h = $(u.find("textarea")),
                    f = $(u.find("span.EditorMemoSpan")),
                    f.length || (f = $(u.find("span"))),
                    f.click(function() {
                        h.focus()
                    }),
                    this.BaseLoad(u, h, a),
                    c(!1)
                } catch (e) {
                    n("Load", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    n("Refresh", "Called"),
                    a()
                } catch (e) {
                    n("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.CorrectUI = function() {
                try {
                    if (this.Corrected)
                        return;
                    n("CorrectUI", "Called"),
                    a(),
                    this.Corrected = !0
                } catch (e) {
                    n("CorrectUI", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    n("Search", "Called", Log.Type.Info);
                    this.BaseSearch(e, t)
                } catch (e) {
                    n("Search", e, Log.Type.Error)
                }
            }
            ,
            this.GetErrorMessage = function() {
                try {
                    if (this.GetRequired())
                        return 0 == r.Trim(h.val()).length ? "You must enter the field marked '" + f.text() + "'" : null
                } catch (e) {
                    n("GetErrorMessage", e, Log.Type.Error)
                }
            }
            ,
            this.SetFocus = function() {
                try {
                    h.focus()
                } catch (e) {
                    n("SetFocus", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return u
                } catch (e) {
                    n("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    n("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    return e.push(new PropertyEd.Property(t.Name,this.GetName,this.SetName)),
                    e.push(new PropertyEd.Property(t.Caption,this.GetCaption,this.SetCaption)),
                    e.push(new PropertyEd.Property(t.Required,this.GetRequired,this.SetRequired)),
                    e.push(new PropertyEd.Property(t.EditHTML,this.GetEditHTML,this.SetEditHTML)),
                    e.push(new PropertyEd.Property(t.Spellcheck,this.GetSpellcheck,this.SetSpellcheck)),
                    e
                } catch (e) {
                    n("GetProperties", e, Log.Type.Error)
                }
            }
            ,
            this.GetName = function() {
                try {
                    return h.attr("name")
                } catch (e) {
                    n("GetName", e, Log.Type.Error)
                }
            }
            ,
            this.SetName = function(e) {
                try {
                    e != h.attr("id") && h.attr("id", e),
                    e != h.attr("name") && h.attr("name", e)
                } catch (e) {
                    n("SetName", e, Log.Type.Error)
                }
            }
            ,
            this.GetCaption = function() {
                try {
                    return f.text()
                } catch (e) {
                    n("GetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.SetCaption = function(e) {
                try {
                    f.text(e)
                } catch (e) {
                    n("SetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.GetRequired = function() {
                try {
                    return f.hasClass("required")
                } catch (e) {
                    n("GetRequired", e, Log.Type.Error)
                }
            }
            ,
            this.SetRequired = function(e) {
                try {
                    1 == e || "true" == e ? f.removeClass("notRequired").addClass("required") : f.removeClass("required").addClass("notRequired")
                } catch (e) {
                    n("SetRequired", e, Log.Type.Error)
                }
            }
            ,
            this.GetEditHTML = function() {
                try {
                    return "true" == u.attr("EditHTML")
                } catch (e) {
                    n("GetEditHTML", e, Log.Type.Error)
                }
            }
            ,
            this.SetEditHTML = function(e) {
                try {
                    u.attr("EditHTML", e)
                } catch (e) {
                    n("SetEditHTML", e, Log.Type.Error)
                }
            }
            ,
            this.GetSpellcheck = function() {
                try {
                    return "true" == u.attr("Spellcheck")
                } catch (e) {
                    n("GetSpellcheck", e, Log.Type.Error)
                }
            }
            ,
            this.SetSpellcheck = function(e) {
                try {
                    u.attr("Spellcheck", e)
                } catch (e) {
                    n("SetSpellcheck", e, Log.Type.Error)
                }
            }
            ,
            this.GetWidth = function() {
                try {
                    return r.ToNumber(u.css("width"))
                } catch (e) {
                    n("GetWidth", e, Log.Type.Error)
                }
            }
            ,
            this.SetWidth = function(e) {
                try {
                    u.css("width", r.ToNumber(e)),
                    a()
                } catch (e) {
                    n("SetWidth", e, Log.Type.Error)
                }
            }
            ,
            this.GetHeight = function() {
                try {
                    return r.ToNumber(u.css("height"))
                } catch (e) {
                    n("GetHeight", e, Log.Type.Error)
                }
            }
            ,
            this.SetHeight = function(e) {
                try {
                    u.css("height", r.ToNumber(e)),
                    a()
                } catch (e) {
                    n("SetHeight", e, Log.Type.Error)
                }
            }
        } catch (e) {
            n("Main", e, Log.Type.Error)
        }
    }
    return n
}),
define("page/comp/EditorCheckBox", ["page/TemplateBase", "PropertyFields", "PageHelper", "Editor"], function(e, t, r, o) {
    function i() {
        function i(e, t, r, o) {
            s.Log(s.refClassName + "." + e, t, r, o)
        }
        function n() {
            try {
                if (c)
                    return;
                i("AddFeatures", "Called");
                var e = r.GetParentRef(l);
                "StaticContainer" == e && (u.addClass("moving"),
                d.addClass("moving"),
                l.draggable({
                    containment: "parent",
                    cancel: "",
                    grid: MP.Tools.Config.Editor.html.snap,
                    start: s.onDragStart,
                    stop: s.onDragStop,
                    drag: s.onDragProgress
                })),
                l.addClass("editing"),
                u.unbind("click"),
                c = !0
            } catch (e) {
                i("AddFeatures", e, Log.Type.Error)
            }
        }
        function a() {
            try {
                if (!c)
                    return;
                i("RemoveFeatures", "Called"),
                l.draggable("destroy").removeClass("editing"),
                d.removeClass("moving"),
                u.removeClass("moving"),
                c = !1
            } catch (e) {
                i("RemoveFeatures", e, Log.Type.Error)
            }
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.NameRequired = !0,
            this.refClassName = "EdCheckBox";
            var s = this
              , l = null
              , c = !1
              , d = null
              , u = null;
            this.SetFeatures = function(e) {
                c = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    i("AppendTo", "Called"),
                    $(e).append(l),
                    this.BaseLoad(l, d),
                    o.Enabled && this.EditMode(),
                    this.Refresh()
                } catch (e) {
                    i("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function(e) {
                try {
                    i("Create", "Called"),
                    l = $("<div condition=''/>"),
                    l.html("<input type='checkbox' id='" + e + "' name='" + e + "' value='1'><span>" + e + "</span>"),
                    l.addClass("component EditorCheckBox"),
                    l.attr("ref", "EditorCheckBox"),
                    d = l.find("input"),
                    u = l.find("span"),
                    u.addClass("notRequired")
                } catch (e) {
                    i("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    i("DefaultMode", "Called"),
                    a(),
                    this.AttachFunctions()
                } catch (e) {
                    i("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    i("EditMode", "Called"),
                    n(),
                    this.DetachFunctions()
                } catch (e) {
                    i("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    i("Load", "Called"),
                    l = $(e),
                    d = $(l.find("input")),
                    u = $(l.find("span")),
                    u.css("cursor", "pointer"),
                    u.bind("click", function() {
                        s.SetFocus()
                    }),
                    this.BaseLoad(l, d)
                } catch (e) {
                    i("Load", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    i("Refresh", "Called")
                } catch (e) {
                    i("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    i("Search", "Called", Log.Type.Info);
                    var r = this.BaseSearch(e, t);
                    r && this.GetValue().search(r) > -1 && i("Search", this, Log.Type.Search)
                } catch (e) {
                    i("Search", e, Log.Type.Error)
                }
            }
            ,
            this.GetErrorMessage = function() {
                try {
                    if (this.GetRequired())
                        return d[0].checked ? null : "You must check the box named '" + u.text() + "'"
                } catch (e) {
                    i("GetErrorMessage", e, Log.Type.Error)
                }
            }
            ,
            this.SetFocus = function() {
                try {
                    d.focus()
                } catch (e) {
                    i("SetFocus", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return l
                } catch (e) {
                    i("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    i("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    return e.push(new PropertyEd.Property(t.Name,this.GetName,this.SetName)),
                    e.push(new PropertyEd.Property(t.Caption,this.GetCaption,this.SetCaption)),
                    e.push(new PropertyEd.Property(t.Value,this.GetValue,this.SetValue)),
                    e.push(new PropertyEd.Property(t.Required,this.GetRequired,this.SetRequired)),
                    e.push(new PropertyEd.Property(t.Flipped,this.GetFlipped,this.SetFlipped)),
                    e
                } catch (e) {
                    i("GetProperties", e, Log.Type.Error)
                }
            }
            ,
            this.GetCaption = function() {
                try {
                    return u.text()
                } catch (e) {
                    i("GetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.SetCaption = function(e) {
                try {
                    u.text(e)
                } catch (e) {
                    i("SetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.GetName = function() {
                try {
                    return d.attr("name")
                } catch (e) {
                    i("GetName", e, Log.Type.Error)
                }
            }
            ,
            this.SetName = function(e) {
                try {
                    e != d.attr("id") && d.attr("id", e),
                    e != d.attr("name") && d.attr("name", e)
                } catch (e) {
                    i("SetName", e, Log.Type.Error)
                }
            }
            ,
            this.GetRequired = function() {
                try {
                    return u.hasClass("required")
                } catch (e) {
                    i("GetRequired", e, Log.Type.Error)
                }
            }
            ,
            this.SetRequired = function(e) {
                try {
                    1 == e || "true" == e ? u.removeClass("notRequired").addClass("required") : u.removeClass("required").addClass("notRequired")
                } catch (e) {
                    i("SetRequired", e, Log.Type.Error)
                }
            }
            ,
            this.GetValue = function() {
                try {
                    return d.attr("value")
                } catch (e) {
                    i("GetValue", e, Log.Type.Error)
                }
            }
            ,
            this.SetValue = function(e) {
                try {
                    d.attr("value", e)
                } catch (e) {
                    i("SetValue", e, Log.Type.Error)
                }
            }
            ,
            this.GetFlipped = function() {
                try {
                    var e = l.find(":first")
                      , t = e[0] == u[0];
                    return t
                } catch (e) {
                    i("GetFlipped", e, Log.Type.Error)
                }
            }
            ,
            this.SetFlipped = function(e) {
                try {
                    var t = u.detach();
                    1 == e || "true" == e ? l.prepend(t) : l.append(t)
                } catch (e) {
                    i("SetFlipped", e, Log.Type.Error)
                }
            }
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    return i
}),
define("page/comp/EditorRadio", ["page/TemplateBase", "PropertyFields", "PageHelper", "Editor"], function(e, t, r, o) {
    function i() {
        function i(e, t, r, o) {
            s.Log(s.refClassName + "." + e, t, r, o)
        }
        function n() {
            try {
                if (c)
                    return;
                i("AddFeature", "Called");
                var e = r.GetParentRef(l);
                "StaticContainer" == e && (u.addClass("moving"),
                d.addClass("moving"),
                l.draggable({
                    containment: "parent",
                    cancel: "",
                    grid: MP.Tools.Config.Editor.html.snap,
                    start: s.onDragStart,
                    stop: s.onDragStop,
                    drag: s.onDragProgress
                })),
                l.addClass("editing"),
                c = !0
            } catch (e) {
                i("AddFeatures", e, Log.Type.Error)
            }
        }
        function a() {
            try {
                if (!c)
                    return;
                i("RemoveFeatures", "Called"),
                l.draggable("destroy").removeClass("editing"),
                d.removeClass("moving"),
                u.removeClass("moving"),
                c = !1
            } catch (e) {
                i("RemoveFeatures", e, Log.Type.Error)
            }
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.NameRequired = !0,
            this.refClassName = "EdRadio";
            var s = this
              , l = null
              , c = !1
              , d = null
              , u = null;
            this.SetFeatures = function(e) {
                c = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    i("AppendTo", "Called"),
                    $(e).append(l),
                    this.BaseLoad(l, d),
                    o.Enabled && this.EditMode(),
                    this.Refresh()
                } catch (e) {
                    i("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function(e) {
                try {
                    i("Create", "Called"),
                    name = e,
                    l = $("<div condition=''/>"),
                    l.html("<input type='radio' id='" + name + "' name='" + name + "' value='1'><span>" + e + "</span>"),
                    l.addClass("component EditorRadio"),
                    l.attr("ref", "EditorRadio"),
                    d = l.find("input"),
                    u = l.find("span"),
                    u.addClass("notRequired")
                } catch (e) {
                    i("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    i("DefaultMode", "Called"),
                    a(),
                    this.AttachFunctions()
                } catch (e) {
                    i("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    i("EditMode", "Called"),
                    n(),
                    this.DetachFunctions()
                } catch (e) {
                    i("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    i("Load", "Called"),
                    l = $(e),
                    d = $(l.find("input")),
                    u = $(l.find("span")),
                    u.css("cursor", "pointer"),
                    u.bind("click", function() {
                        s.SetFocus()
                    }),
                    this.BaseLoad(l, d)
                } catch (e) {
                    i("Load", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    i("Refresh", "Called")
                } catch (e) {
                    i("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    i("Search", "Called", Log.Type.Info);
                    var r = this.BaseSearch(e, t);
                    r && this.GetValue().search(r) > -1 && i("Search", this, Log.Type.Search)
                } catch (e) {
                    i("Search", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    i("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    return e.push(new PropertyEd.Property(t.ID,this.GetID,this.SetID)),
                    e.push(new PropertyEd.Property(t.Name,this.GetName,this.SetName)),
                    e.push(new PropertyEd.Property(t.Caption,this.GetCaption,this.SetCaption)),
                    e.push(new PropertyEd.Property(t.Value,this.GetValue,this.SetValue)),
                    e.push(new PropertyEd.Property(t.Required,this.GetRequired,this.SetRequired)),
                    e.push(new PropertyEd.Property(t.Flipped,this.GetFlipped,this.SetFlipped)),
                    e
                } catch (e) {
                    i("GetProperties", e, Log.Type.Error)
                }
            }
            ,
            this.GetErrorMessage = function(e) {
                try {
                    if (this.GetRequired()) {
                        var t = d.attr("name");
                        return e.indexOf("&" + t + "=") == -1 ? "You must choose one of the radios '" + u.text() + "'" : null
                    }
                } catch (e) {
                    i("GetErrorMessage", e, Log.Type.Error)
                }
            }
            ,
            this.SetFocus = function() {
                try {
                    d.focus()
                } catch (e) {
                    i("SetFocus", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return l
                } catch (e) {
                    i("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.GetCaption = function() {
                try {
                    return u.text()
                } catch (e) {
                    i("GetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.GetRequired = function() {
                try {
                    return u.hasClass("required")
                } catch (e) {
                    i("GetRequired", e, Log.Type.Error)
                }
            }
            ,
            this.GetValue = function() {
                try {
                    return d.val()
                } catch (e) {
                    i("GetValue", e, Log.Type.Error)
                }
            }
            ,
            this.SetCaption = function(e) {
                try {
                    u.text(e)
                } catch (e) {
                    i("SetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.GetName = function() {
                try {
                    return d.attr("name")
                } catch (e) {
                    i("GetName", e, Log.Type.Error)
                }
            }
            ,
            this.SetName = function(e) {
                try {
                    d.attr("name", e)
                } catch (e) {
                    i("SetName", e, Log.Type.Error)
                }
            }
            ,
            this.GetID = function() {
                try {
                    return d.attr("id")
                } catch (e) {
                    i("GetID", e, Log.Type.Error)
                }
            }
            ,
            this.SetID = function(e) {
                try {
                    d.attr("id", e)
                } catch (e) {
                    i("SetID", e, Log.Type.Error)
                }
            }
            ,
            this.SetRequired = function(e) {
                try {
                    1 == e || "true" == e ? u.removeClass("notRequired").addClass("required") : u.removeClass("required").addClass("notRequired")
                } catch (e) {
                    i("SetRequired", e, Log.Type.Error)
                }
            }
            ,
            this.SetValue = function(e) {
                try {
                    d.val(e)
                } catch (e) {
                    i("SetValue", e, Log.Type.Error)
                }
            }
            ,
            this.GetFlipped = function() {
                try {
                    var e = l.find(":first")
                      , t = e[0] == u[0];
                    return t
                } catch (e) {
                    i("GetFlipped", e, Log.Type.Error)
                }
            }
            ,
            this.SetFlipped = function(e) {
                try {
                    var t = u.detach();
                    1 == e || "true" == e ? l.prepend(t) : l.append(t)
                } catch (e) {
                    i("SetFlipped", e, Log.Type.Error)
                }
            }
        } catch (e) {
            i("Main", e, Log.Type.Error)
        }
    }
    return i
}),
define("page/ValidationBase", ["page/comp/ValidatorContainer", "PropertyFields", "Utilities", "PageHelper", "Editor"], function(e, t, r, o, i) {
    var n = function() {
        function n(e, t, r, o) {
            Log.Add(s.refClassName + "." + e, t, r, o)
        }
        function a(t, r, o) {
            this.Filter = t,
            this.DType = o,
            this.Param = r,
            this.Callbacks = e.Filters[this.Filter]
        }
        this.refClassName = "ValidBase";
        var s = this
          , l = null
          , c = null
          , d = function(e, t, r, o, i, n) {
            if (o = o || function(e) {
                return e
            }
            ,
            i = i || $.noop,
            n = n || $.noop,
            r || "" === $.trim(e))
                return i(e);
            try {
                $.each(t, function(t, r) {
                    e = o(r, e)
                })
            } catch (e) {
                return n(e)
            }
            return i(e)
        }
          , u = function(e) {
            var t = $(e).parents(".component")[0];
            return o.GetEditorComponent(t)
        };
        this.ValidationBaseLoad = function(e, t) {
            try {
                l = e,
                c = t
            } catch (e) {
                n("ValidationBaseLoad", e, Log.Type.Error)
            }
        }
        ,
        this.FilterInput = function(e) {
            var t = this.DatepickerShown || c.attr("sMask") && !this.UserUpdate
              , r = null;
            return d(c.val(), this.GetFilters(), t, function(e, t) {
                return e.FilterText(t)
            }, function(e) {
                c.val(e)
            }, function(t) {
                if (e)
                    r = t;
                else {
                    var i = o.GetEditorComponent(l);
                    i && i.HighlightAsError(!0),
                    jAlert(t, "Invalid Entry", function() {
                        c.select(),
                        c.focus()
                    })
                }
            }),
            r
        }
        ,
        this.AttachFilter = function() {
            try {
                if (i.Enabled)
                    return;
                $.each(this.GetFilters(), function(e, t) {
                    t.Attach($(c))
                }),
                c.bind("change.filter", function() {
                    var e = u(this);
                    e.UserUpdate = !0
                }),
                c.bind("blur.filter", function() {
                    var e = u(this);
                    e.FilterInput()
                })
            } catch (e) {
                n("AttachFilter", e, Log.Type.Error)
            }
        }
        ,
        this.DetachFilter = function() {
            try {
                $.each(this.GetFilters(), function(e, t) {
                    t.Detach($(c))
                }),
                c.unbind(".filter")
            } catch (e) {
                n("DetachFilter", e, Log.Type.Error)
            }
        }
        ,
        this.GetValidationProperties = function(e) {
            try {
                var r = new RulesMaker.ComplexArgs(this.GetValidationProperties,this.AddFilter,this.DeleteFilter);
                switch (l.attr("Ref")) {
                case "EditorText":
                    e.push(new PropertyEd.Property(t.EditorTextFilters,this.GetFilters,this.SetFilters,r));
                    break;
                case "EditorDropdown":
                }
                return e
            } catch (e) {
                n("GetValidationProperties", e, Log.Type.Error)
            }
        }
        ,
        this.AddFilter = function() {
            try {
                null == l.attr("filter") || 0 == l.attr("filter").length ? (l.attr("filter", ""),
                l.attr("param", ""),
                l.attr("dtype", "")) : (l.attr("filter", l.attr("filter") + "|"),
                l.attr("param", l.attr("param") + "|"),
                l.attr("dtype", l.attr("dtype") + "|"))
            } catch (e) {
                n("AddFilter", e, Log.Type.Error)
            }
        }
        ,
        this.DeleteFilter = function(e) {
            try {
                if (!l.attr("filter") || !l.attr("param") || !l.attr("dtype"))
                    return;
                var t;
                t = l.attr("filter");
                var r = t.match(/|/) ? t.split("|") : [t];
                r.splice(e, 1),
                l.attr("filter", r.toPipeString()),
                t = l.attr("param");
                var o = t.match(/|/) ? t.split("|") : [t];
                o.splice(e, 1),
                l.attr("param", o.toPipeString()),
                t = l.attr("dtype");
                var i = t.match(/|/) ? t.split("|") : [t];
                i.splice(e, 1),
                l.attr("dtype", i.toPipeString()),
                0 == l.attr("filter").length && (l.removeAttr("filter"),
                l.removeAttr("param"),
                l.removeAttr("dtype"))
            } catch (e) {
                n("DeleteFilter", e, Log.Type.Error)
            }
        }
        ,
        this.GetFilters = function() {
            var e = l.attr("filter")
              , t = l.attr("dtype")
              , r = l.attr("param");
            if (null == e || "" == e || null == t || null == r)
                return [];
            var o = [];
            e = e.split("|"),
            t = t.split("|"),
            r = r.split("|");
            for (var i = 0; i < e.length; i++)
                o.push(new a(e[i],r[i],t[i]));
            return o
        }
        ,
        this.SetFilters = function(e) {
            try {
                var t, o = "", i = "", a = "", s = !0;
                if (0 == e.length && (s = !1),
                1 == e.length && (t = r.ReplaceAll(e[0].Filter, " ", ""),
                "" == t && (s = !1)),
                !s)
                    return l.removeAttr("filter"),
                    l.removeAttr("param"),
                    void l.removeAttr("dtype");
                for (var c = 0; c < e.length; c++)
                    t = r.ReplaceAll(e[c].Filter, " ", ""),
                    t.length > 0 && (o += e[c].Filter + "|",
                    i += e[c].Param + "|",
                    a += e[c].DType + "|");
                e.length > 0 && (o = o.removeLastChar(),
                i = i.removeLastChar(),
                a = a.removeLastChar()),
                l.attr("filter", o),
                l.attr("param", i),
                l.attr("dtype", a)
            } catch (e) {
                n("SetFilters", e, Log.Type.Error)
            }
        }
        ,
        a.prototype.FilterText = function(e) {
            var t = this.Callbacks.filter;
            return "function" != typeof t ? e : t(e, this.DType, this.Param)
        }
        ,
        a.prototype.Attach = function(e) {
            "object" == typeof this.Callbacks.filter && this.Callbacks.filter.attach && this.Callbacks.filter.attach(e, this.DType, this.Param)
        }
        ,
        a.prototype.Detach = function(e) {
            "object" == typeof this.Callbacks.filter && this.Callbacks.filter.detach && this.Callbacks.filter.detach(e, this.DType, this.Param)
        }
    };
    return n
}),
define("page/comp/EditableContent", ["Utilities", "PageHelper", "Editor"], function(e, t, r) {
    function o() {
        function e(e, t, r, o) {
            Log.Add(i.refClassName + "." + e, t, r, o)
        }
        function t() {
            try {
                if (a)
                    return;
                e("AddFeatures", "Called"),
                n.droppable({
                    accept: r.GetAcceptedComponents(i.Accept),
                    greedy: !0,
                    activeClass: "droppable-active",
                    hoverClass: "droppable-hover",
                    drop: function(e, t) {
                        var o = $(t.draggable).attr("ref");
                        r.BuildComponent(o, this)
                    }
                }),
                n.sortable({
                    items: ">.component",
                    handle: ">.handle"
                }),
                n.disableSelection(),
                a = !0
            } catch (t) {
                e("AddFeatures", t, Log.Type.Error)
            }
        }
        function o() {
            try {
                if (!a)
                    return;
                e("RemoveFeatures", "Called"),
                n.droppable("destroy").sortable("destroy").removeClass("droppable-active droppable-hover").enableSelection(),
                a = !1
            } catch (t) {
                e("RemoveFeatures", t, Log.Type.Error)
            }
        }
        try {
            this.NameRequired = !1,
            this.Accept = ["StaticContainer", "DynamicContainer", "EditorLabel", "EditorDiv", "TransferList", "ValidationContainer", "ScriptingContainer"],
            this.refClassName = "EditableContent";
            var i = this
              , n = null
              , a = !1;
            return {
                SetFeatures: function(e) {},
                HighlightAsSelected: function(e) {},
                HighlightAsFound: function(e) {},
                HighlightAsError: function(e) {},
                Search: function(e, t) {},
                DefaultMode: function() {
                    try {
                        e("DefaultMode", "Called"),
                        o(),
                        n.bind("keydown", function(t) {
                            if (13 == t.keyCode && !$(t.target).is(":button ,textarea")) {
                                var r = $(this).find(".EditorSubmitButton input[DefaultButton='true']");
                                if (r.length > 1)
                                    return void e("DefaultMode", "There are " + r.length + " default submit buttons on the page! Submit skipped.", Log.Type.Warning);
                                var o = new jQuery.Event("click");
                                r.trigger(o)
                            }
                        })
                    } catch (t) {
                        e("DefaultMode", t, Log.Type.Error)
                    }
                },
                EditMode: function() {
                    try {
                        e("EditMode", "Called"),
                        t()
                    } catch (t) {
                        e("EditMode", t, Log.Type.Error)
                    }
                },
                Load: function(t) {
                    try {
                        e("Load", "Called"),
                        n = $(t)
                    } catch (t) {
                        e("Load", t, Log.Type.Error)
                    }
                },
                GetControl: function() {
                    try {
                        return n
                    } catch (t) {
                        e("GetControl", t, Log.Type.Error)
                    }
                },
                Refresh: function() {
                    try {
                        e("Refresh", "Called")
                    } catch (t) {
                        e("Refresh", t, Log.Type.Error)
                    }
                }
            }
        } catch (t) {
            e("Main", t, Log.Type.Error)
        }
    }
    return o
}),
define("page/comp/DynamicContainer", ["page/TemplateBase", "PropertyFields", "Utilities", "PageHelper", "Editor"], function(e, t, r, o, i) {
    function n() {
        function o(e, t, r, o) {
            c.Log(c.refClassName + "." + e, t, r, o)
        }
        function n() {
            try {
                if (p)
                    return;
                o("AddFeatures", "Called"),
                d.droppable({
                    accept: i.GetAcceptedComponents(c.Accept),
                    greedy: !0,
                    activeClass: "droppable-active",
                    hoverClass: "droppable-hover",
                    drop: function(e, t) {
                        var r = $(t.draggable).attr("ref");
                        i.BuildComponent(r, this)
                    }
                }),
                d.sortable({
                    items: "> .component"
                }),
                u.addClass("moving"),
                p = !0
            } catch (e) {
                o("AddFeatures", e, Log.Type.Error)
            }
        }
        function a() {
            try {
                if (s(),
                !p)
                    return;
                o("RemoveFeatures", "Called"),
                d.droppable("destroy").sortable("destroy").removeClass("droppable-active droppable-hover"),
                u.removeClass("moving"),
                p = !1
            } catch (e) {
                o("RemoveFeatures", e, Log.Type.Error)
            }
        }
        function s() {
            $.trim(u.text()) ? u.css("visibility", "visible") : u.css("visibility", "hidden")
        }
        function l() {
            try {
                var e = d.find(".TableMaster,.TableMasterSM");
                if (!e.length)
                    return;
                e.each(function(t) {
                    var o = $(this);
                    o.attr("cellspacing", 0);
                    var i = $(o).find("thead > tr > td").length
                      , n = $(o).find("tbody > tr > td").length;
                    if (1 == n || n < i) {
                        var a = $(o).find("tr > td[colspan]");
                        a.each(function() {
                            $(this).get(0).removeAttribute("colspan")
                        });
                        for (var t = n; t < i; t++)
                            $("<td></td>").appendTo($(o).find("tbody > tr"));
                        $(e).find("tbody > tr > td").css({
                            "border-right": "none"
                        })
                    }
                    if ("true" != o.attr("wrapped")) {
                        o.find("tr:odd").addClass("even"),
                        o.find("tr").hover(function() {
                            $(this).addClass("hover")
                        }, function() {
                            $(this).removeClass("hover")
                        });
                        var s = o.attr("id");
                        if (null == s || 0 == s.length) {
                            var l = r.MakeGUID();
                            o.attr("id", l),
                            s = l
                        }
                        o.wrap("<div class='TableMasterWrapper'></div>"),
                        o.attr("wrapped", "true"),
                        superTable(s);
                        var c = !1
                          , u = !1
                          , p = (d.find(".TableMaster"),
                        $(this).parent(".sData"))
                          , h = $(this).parent().parent(".sBase")
                          , f = $(this)
                          , g = $(this).parent().parent().parent(".TableMasterWrapper");
                        g.css({
                            margin: "10px"
                        }),
                        h.width(g.width()),
                        p.width(h.width()),
                        p.height(f.height()),
                        g.height(p.height()),
                        p.height() > 190 && (p.height(190),
                        g.height(210)),
                        f.outerWidth(!0) > p.outerWidth(!0) && (c = !0,
                        g.height(g.height() + 18)),
                        p.height() < f.height() && (u = !0),
                        f.width() < p.width() && u && p.width(f.width() + 18)
                    }
                });
                var t = $(".sHeaderInner").find("table > thead > tr > td");
                $(t).attr("sortdir", "asc"),
                t.length && $(t).each(function() {
                    var e = $(this).parent().parent().parent();
                    e.find("thead > tr > td").length;
                    $(this).unbind("click"),
                    $(this).bind("click", function() {
                        var t = $(this).attr("sortdir")
                          , r = (e.attr("id"),
                        $(this).attr("data-sort-attr") || "")
                          , o = $(this).attr("data-sort-form");
                        o && Object.prototype.hasOwnProperty.call(h, o) && (o = h[o],
                        r = r || "data-sort-form-data",
                        $(e).parent().parent().next(".sData").find("tbody > tr > td:nth-child(" + ($(this).index() + 1) + ")").each(function() {
                            var e = $(this);
                            e.attr(r) || e.attr(r, o(e))
                        })),
                        $(e).parent().parent().next(".sData").find("tbody>tr").tsort("td:eq(" + $(this).index() + ")", {
                            order: t,
                            attr: r
                        }),
                        $(e).parent().parent().next(".sData").find(".even").removeClass("even"),
                        $(e).parent().parent().next(".sData").find("tr:odd").addClass("even"),
                        $(this).attr("sortdir", "asc" == t ? "desc" : "asc"),
                        $(this).parents("table").find(".asc").removeClass("asc"),
                        $(this).parents("table").find(".desc").removeClass("desc"),
                        $(this).addClass("asc" == t ? "asc" : "desc")
                    })
                })
            } catch (e) {
                o("FormatTableMaster", e, Log.Type.Error)
            }
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.NameRequired = !1,
            this.refClassName = "DynamicCont",
            this.Accept = ["DynamicContainer", "StaticContainer", "EditorLabel", "EditorDiv", "TransferList"];
            var c = this
              , d = null
              , u = null
              , p = !1
              , h = {
                dateMDY: function(e) {
                    var t = /(\d+)\/(\d+)\/(\d+)/.exec(e.text());
                    if (!t)
                        return e.text();
                    var r = t[1]
                      , o = t[2]
                      , i = t[3]
                      , n = new Date(i,r,o);
                    return n.getTime()
                }
            };
            this.SetFeatures = function(e) {
                p = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    o("AppendTo", "Called"),
                    $(e).append(d),
                    this.BaseLoad(d),
                    i.Enabled && this.EditMode()
                } catch (e) {
                    o("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function() {
                try {
                    o("Create", "Called"),
                    d = $("<div condition='' class='component DynamicContainer' ref='DynamicContainer'><h3 class='handle'>Dynamic Container</h3></div>"),
                    u = d.find(">h3")
                } catch (e) {
                    o("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    o("DefaultMode", "Called"),
                    a(),
                    l()
                } catch (e) {
                    o("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    o("EditMode", "Called"),
                    n()
                } catch (e) {
                    o("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    o("Load", "Called"),
                    d = $(e),
                    this.BaseLoad(d),
                    u = $(d.find(">h3"))
                } catch (e) {
                    o("Load", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return d
                } catch (e) {
                    o("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    o("Refresh", "Called")
                } catch (e) {
                    o("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    o("Search", "Called", Log.Type.Info);
                    this.BaseSearch(e, t)
                } catch (e) {
                    o("Search", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    o("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    return e.push(new PropertyEd.Property(t.ID,this.GetID,this.SetID)),
                    e.push(new PropertyEd.Property(t.Caption,this.GetCaption,this.SetCaption)),
                    e.push(new PropertyEd.Property(t.Borderless,this.GetBorderless,this.SetBorderless)),
                    e
                } catch (e) {
                    o("GetProperties", e, Log.Type.Error)
                }
            }
            ,
            this.GetID = function() {
                try {
                    return d.attr("id")
                } catch (e) {
                    o("GetID", e, Log.Type.Error)
                }
            }
            ,
            this.SetID = function(e) {
                try {
                    d.attr("id", e)
                } catch (e) {
                    o("SetID", e, Log.Type.Error)
                }
            }
            ,
            this.GetCaption = function() {
                try {
                    return u.text()
                } catch (e) {
                    o("GetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.SetCaption = function(e) {
                try {
                    u.text(e),
                    s()
                } catch (e) {
                    o("SetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.GetBorderless = function() {
                try {
                    return d.hasClass("borderless")
                } catch (e) {
                    o("GetBorderless", e, Log.Type.Error)
                }
            }
            ,
            this.SetBorderless = function(e) {
                try {
                    e ? d.addClass("borderless") : d.removeClass("borderless")
                } catch (e) {
                    o("SetBorderless", e, Log.Type.Error)
                }
            }
        } catch (e) {
            o("Main", e, Log.Type.Error)
        }
    }
    return n
}),
define("page/comp/StaticContainer", ["page/TemplateBase", "PropertyFields", "PageHelper", "Editor", "ContextMenu"], function(e, t, r, o, i) {
    function n() {
        function n(e, t, r, o) {
            c.Log(c.refClassName + "." + e, t, r, o)
        }
        function a() {
            try {
                if (p)
                    return;
                n("AddFeatures", "Called"),
                d.droppable({
                    accept: o.GetAcceptedComponents(c.Accept),
                    greedy: !0,
                    activeClass: "droppable-active",
                    hoverClass: "droppable-hover",
                    drop: function(e, t) {
                        var r = $(t.draggable).attr("ref")
                          , i = {
                            left: t.offset.left - $(this).offset().left,
                            top: t.offset.top - $(this).offset().top
                        };
                        o.BuildComponent(r, this, i)
                    }
                }),
                d.delegate(".moving", "mousedown", function() {
                    o.DisableSelectibleInIE(d, !0)
                }),
                d.delegate(".moving", "mouseup", function() {
                    o.DisableSelectibleInIE(d, !1)
                });
                var e = r.GetParentRef(d);
                $.inArray(e, ["StaticContainer"]) > -1 && (d.draggable({
                    containment: "parent",
                    handle: u,
                    grid: MP.Tools.Config.Editor.html.snap,
                    start: c.onDragStart,
                    stop: c.onDragStop
                }),
                d.resizable({
                    autoHide: !0,
                    grid: MP.Tools.Config.Editor.html.snap,
                    stop: function() {
                        var e = Utilities.ToNumber($(this).css("top"));
                        $(this).css("top", e + 1);
                        var t = Utilities.ToNumber($(this).css("left"));
                        $(this).css("left", t + 1)
                    }
                })),
                d.selectable({
                    filter: ".moving",
                    cancel: ".handle",
                    selected: function(e, t) {
                        var o = r.GetParentID($(t.selected))
                          , i = r.GetParentRef($(t.selected));
                        "StaticContainer" != i && r.AddSelected(o)
                    },
                    start: function(e, t) {
                        Global.DisableHighlightingInChrome(!0),
                        r.ClearSelected(),
                        i.Hide()
                    },
                    stop: function(e, t) {
                        Global.DisableHighlightingInChrome(!1)
                    }
                }),
                u.addClass("moving"),
                p = !0
            } catch (e) {
                n("AddFeatures", e, Log.Type.Error)
            }
        }
        function s() {
            try {
                if (l(),
                !p)
                    return;
                n("RemoveFeatures", "Called"),
                d.droppable("destroy").draggable("destroy").resizable("destroy").selectable("destroy").removeClass("droppable-active droppable-hover"),
                u.removeClass("moving"),
                p = !1
            } catch (e) {
                n("RemoveFeatures", e, Log.Type.Error)
            }
        }
        function l() {
            $.trim(u.text()) ? u.css("visibility", "visible") : u.css("visibility", "hidden")
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.NameRequired = !1,
            this.refClassName = "StaticCont",
            this.Accept = ["StaticContainer", "EditorText", "EditorLabel", "EditorDiv", "EditorDropDown", "EditorMemo", "EditorCheckBox", "EditorSubmitButton", "EditorRadio", "EditorLink", "TransferList"];
            var c = this
              , d = null
              , u = null
              , p = !1;
            this.SetFeatures = function(e) {
                p = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    n("AppendTo", "Called"),
                    $(e).append(d),
                    this.BaseLoad(d),
                    o.Enabled && this.EditMode()
                } catch (e) {
                    n("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function() {
                try {
                    n("Create", "Called"),
                    d = $("<div condition='' class='component StaticContainer' ref='StaticContainer'><h3 class='handle'>Static Container</h3></div>"),
                    u = d.find("h3")
                } catch (e) {
                    n("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    n("DefaultMode", "Called"),
                    s()
                } catch (e) {
                    n("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    n("EditMode", "Called"),
                    a()
                } catch (e) {
                    n("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    n("Search", "Called", Log.Type.Info);
                    this.BaseSearch(e, t)
                } catch (e) {
                    n("Search", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    n("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    e.push(new PropertyEd.Property(t.ID,this.GetID,this.SetID)),
                    e.push(new PropertyEd.Property(t.Caption,this.GetCaption,this.SetCaption)),
                    e.push(new PropertyEd.Property(t.Height,this.GetHeight,this.SetHeight));
                    var o = r.GetParentRef(d);
                    return "StaticContainer" == o && e.push(new PropertyEd.Property(t.Width,this.GetWidth,this.SetWidth)),
                    e.push(new PropertyEd.Property(t.Borderless,this.GetBorderless,this.SetBorderless)),
                    e
                } catch (e) {
                    n("GetProperties", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    n("Refresh", "Called")
                } catch (e) {
                    n("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    n("Load", "Called"),
                    d = $(e),
                    this.BaseLoad(d),
                    u = $(d.find(">h3"))
                } catch (e) {
                    n("Load", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return d
                } catch (e) {
                    n("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.GetBorderless = function() {
                try {
                    return d.hasClass("borderless")
                } catch (e) {
                    n("GetBorderless", e, Log.Type.Error)
                }
            }
            ,
            this.SetBorderless = function(e) {
                try {
                    e ? d.addClass("borderless") : d.removeClass("borderless")
                } catch (e) {
                    n("SetBorderless", e, Log.Type.Error)
                }
            }
            ,
            this.GetCaption = function() {
                try {
                    return u.text()
                } catch (e) {
                    n("GetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.SetCaption = function(e) {
                try {
                    u.text(e),
                    l()
                } catch (e) {
                    n("SetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.GetHeight = function() {
                try {
                    return Utilities.ToNumber(d.height())
                } catch (e) {
                    n("GetHeight", e, Log.Type.Error)
                }
            }
            ,
            this.SetHeight = function(e) {
                try {
                    d.height(Utilities.ToNumber(e))
                } catch (e) {
                    n("SetHeight", e, Log.Type.Error)
                }
            }
            ,
            this.GetID = function() {
                try {
                    return d.attr("id")
                } catch (e) {
                    n("GetID", e, Log.Type.Error)
                }
            }
            ,
            this.SetID = function(e) {
                try {
                    d.attr("id", e)
                } catch (e) {
                    n("SetID", e, Log.Type.Error)
                }
            }
            ,
            this.GetWidth = function() {
                try {
                    return Utilities.ToNumber(d.width())
                } catch (e) {
                    n("GetWidth", e, Log.Type.Error)
                }
            }
            ,
            this.SetWidth = function(e) {
                try {
                    d.width(Utilities.ToNumber(e))
                } catch (e) {
                    n("SetWidth", e, Log.Type.Error)
                }
            }
        } catch (e) {
            n("Main", e, Log.Type.Error)
        }
    }
    return n
}),
define("page/comp/ScriptingContainer", ["page/TemplateBase", "PropertyFields", "Utilities", "PageHelper", "Editor"], function(TemplateBase, PropertyFields, Utilities, PageHelper, Editor) {
    function ScriptingContainer() {
        function iLog(e, t, r, o) {
            self.Log(self.refClassName + "." + e, t, r, o)
        }
        function GetFunctions(e) {
            try {
                iLog("GetFunctions", "Called"),
                e = "\n" + e.substring(e.indexOf("function "), e.length);
                var t = []
                  , r = e.split(/[\n\r]function /);
                if (!r)
                    return t;
                for (var o = 0; o < r.length; o++) {
                    var i = r[o]
                      , n = i.substring(0, i.indexOf("{"))
                      , a = n.match(/\([^\)]+\)/g);
                    if (a = null == a || 0 == a.length ? "" : a[0],
                    a = a.replace("(", "").replace(")", ""),
                    n.indexOf("(") > -1 && (n = n.substring(0, n.indexOf("("))),
                    n) {
                        var s = i.substring(i.indexOf("{") + 1);
                        s = s.substring(0, s.lastIndexOf("}"));
                        var l = new Script(n,a,s);
                        t.push(l)
                    }
                }
                return t
            } catch (e) {
                iLog("GetFunctions", e, Log.Type.Error)
            }
        }
        function AttachScript(e) {
            try {
                iLog("AttachScript", "Called");
                var t = $.trim(e);
                return t.beginsWith("(") ? parseNewCustomScripts(t, !0) : parseOldCustomScripts(t, !0)
            } catch (e) {
                return iLog("AttachScript", e, Log.Type.Error, !0),
                e.message
            }
        }
        function AddFeatures() {
            try {
                if (featuresAdded)
                    return;
                iLog("AddFeatures", "Called"),
                control.css("display", "block").addClass("js-component"),
                script.css("display", "block"),
                h3.addClass("moving"),
                featuresAdded = !0
            } catch (e) {
                iLog("AddFeatures", e, Log.Type.Error)
            }
        }
        function RemoveFeatures() {
            try {
                if (!featuresAdded)
                    return;
                iLog("RemoveFeatures", "Called"),
                h3.removeClass("moving"),
                featuresAdded = !1
            } catch (e) {
                iLog("RemoveFeatures", e, Log.Type.Error)
            }
        }
        function ResetScripts() {
            window.CustomScript = null,
            window.CustomScript = {}
        }
        function parseNewCustomScripts(script, clearScripts) {
            try {
                eval(script)
            } catch (e) {
                return iLog("parseNewCustomScripts", e.message, Log.Type.Error, !0),
                e.message
            }
        }
        function parseOldCustomScripts(e, t) {
            var r = GetFunctions(e);
            if (r.length) {
                t && ResetScripts();
                for (var o = "", i = null, n = 0; n < r.length; n++)
                    try {
                        i = r[n],
                        window.CustomScript[i.Name] = new Function(i.Params,i.Body)
                    } catch (e) {
                        o = i ? o + i.Name + " : " + e.message + ", " : o + e.message + ", "
                    }
                return o ? (iLog("parseOldCustomScripts", o, Log.Type.Error, !0),
                o) : void 0
            }
        }
        try {
            this.inheritFrom = TemplateBase,
            this.inheritFrom(),
            this.NameRequired = !1,
            this.refClassName = "ScriptCont";
            var self = this
              , control = null
              , h3 = null
              , script = null
              , featuresAdded = !1;
            this.SetFeatures = function(e) {
                featuresAdded = e
            }
            ,
            this.AppendTo = function(e) {
                try {
                    iLog("AppendTo", "Called"),
                    $(e).append(control),
                    this.BaseLoad(control),
                    Editor.Enabled && this.EditMode()
                } catch (e) {
                    iLog("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function() {
                try {
                    iLog("Create", "Called");
                    var e = "(function() {\n  var cs = {}; // Private custom script\n  cs.OnLoad = function() {\n  \tscroll(0,0);\n  };\n\n  // Publish it\n  CustomScript = cs; // Overwrite (default)\n  //$.extend(CustomScript, cs); // Append\n  //CustomAnything = cs; // Create new\n})();\n\n//function OnLoad(){scroll(0,0);} // Or delete everything above and use plain functions\n";
                    control = $("<div condition='' class='component ScriptingContainer' ref='ScriptingContainer'><h3 class='handle'>Custom Scripts/JS Container</h3><pre>" + e + "</pre></div>"),
                    h3 = control.find(">h3"),
                    script = control.find(">pre")
                } catch (e) {
                    iLog("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function(e) {
                try {
                    iLog("DefaultMode", "Called"),
                    $(control).css("display", "none"),
                    RemoveFeatures();
                    var t = $.trim(control.find("pre").text());
                    return t.beginsWith("(") ? parseNewCustomScripts(t, e) : parseOldCustomScripts(t, e)
                } catch (e) {
                    iLog("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    iLog("EditMode", "Called"),
                    AddFeatures()
                } catch (e) {
                    iLog("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    iLog("Search", "Called", Log.Type.Info);
                    var r = this.BaseSearch(e, t);
                    r && this.GetScripts().search(r) > -1 && iLog("Search", this, Log.Type.Search)
                } catch (e) {
                    iLog("Search", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    iLog("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    return e.push(new PropertyEd.Property(PropertyFields.ID,this.GetID,this.SetID)),
                    e.push(new PropertyEd.Property(PropertyFields.Scripts,this.GetScripts,this.SetScripts)),
                    e
                } catch (e) {
                    iLog("GetProperties", e, Log.Type.Error)
                }
            }
            ,
            this.Refresh = function() {
                try {
                    iLog("Refresh", "Called")
                } catch (e) {
                    iLog("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    iLog("Load", "Called"),
                    control = $(e),
                    this.BaseLoad(control),
                    h3 = control.find(">h3"),
                    script = control.find(">pre"),
                    script.length || (script = control.find(">div")),
                    script.css("display", "none")
                } catch (e) {
                    iLog("Load", e, Log.Type.Error)
                }
            }
            ,
            this.Show = function(e) {
                iLog("Show", "Called"),
                control.css("display", "block"),
                control.html(e)
            }
            ,
            this.Hide = function() {
                iLog("Hide", "Called"),
                control.html(""),
                control.css("display", "none")
            }
            ,
            this.GetControl = function() {
                try {
                    return control
                } catch (e) {
                    iLog("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.GetID = function() {
                try {
                    return control.attr("id")
                } catch (e) {
                    iLog("GetID", e, Log.Type.Error)
                }
            }
            ,
            this.SetID = function(e) {
                try {
                    control.attr("id", e)
                } catch (e) {
                    iLog("SetID", e, Log.Type.Error)
                }
            }
            ,
            this.GetScripts = function() {
                try {
                    return script.text()
                } catch (e) {
                    iLog("GetScripts", e, Log.Type.Error)
                }
            }
            ,
            this.SetScripts = function(e) {
                try {
                    iLog("SetScripts", "Called"),
                    script.text(e);
                    var t = AttachScript(e);
                    t && jAlert("There are errors:\n" + t + "\nErrors due to #S variables may be OK within the editor."),
                    ResetScripts()
                } catch (e) {
                    iLog("SetScripts", e, Log.Type.Error)
                }
            }
        } catch (e) {
            iLog("Main", e, Log.Type.Error)
        }
    }
    function Script(e, t, r) {
        this.Name = $.trim(e),
        this.Params = t,
        this.Body = r
    }
    return ScriptingContainer
}),
define("page/comp/ValidationContainer", ["page/TemplateBase", "PropertyFields", "PageHelper", "Editor"], function(e, t, r, o) {
    function i() {
        function r(e, t, r, o) {
            a.Log(a.refClassName + "." + e, t, r, o)
        }
        function i() {
            try {
                if (l)
                    return;
                r("AddFeatures", "Called"),
                s.css("display", "block"),
                c.addClass("moving"),
                l = !0
            } catch (e) {
                r("AddFeatures", e, Log.Type.Error)
            }
        }
        function n() {
            try {
                if (!l)
                    return;
                r("RemoveFeatures", "Called"),
                s.css("display", "none"),
                c.removeClass("moving"),
                l = !1
            } catch (e) {
                r("RemoveFeatures", e, Log.Type.Error)
            }
        }
        try {
            this.inheritFrom = e,
            this.inheritFrom(),
            this.NameRequired = !1,
            this.refClassName = "ValidCont";
            var a = this
              , s = null
              , l = !1
              , c = null
              , d = null
              , u = "Errors were found, please resolve the following before re-submitting";
            this.SetFeatures = function(e) {
                l = e
            }
            ,
            this.Refresh = function() {
                try {
                    r("Refresh", "Called")
                } catch (e) {
                    r("Refresh", e, Log.Type.Error)
                }
            }
            ,
            this.AppendTo = function(e) {
                try {
                    r("AppendTo", "Called"),
                    $(e).append(s),
                    this.BaseLoad(s),
                    o.Enabled && this.EditMode()
                } catch (e) {
                    r("AppendTo", e, Log.Type.Error)
                }
            }
            ,
            this.Create = function() {
                try {
                    r("Create", "Called"),
                    s = $("<div condition='' class='component ValidationContainer' ref='ValidationContainer'><h3 class='handle'>" + u + "</h3><div/></div>"),
                    c = s.find(">h3"),
                    d = s.find(">div")
                } catch (e) {
                    r("Create", e, Log.Type.Error)
                }
            }
            ,
            this.DefaultMode = function() {
                try {
                    r("DefaultMode", "Called"),
                    n()
                } catch (e) {
                    r("DefaultMode", e, Log.Type.Error)
                }
            }
            ,
            this.EditMode = function() {
                try {
                    r("EditMode", "Called"),
                    i()
                } catch (e) {
                    r("EditMode", e, Log.Type.Error)
                }
            }
            ,
            this.Search = function(e, t) {
                try {
                    r("Search", "Called", Log.Type.Info);
                    this.BaseSearch(e, t)
                } catch (e) {
                    r("Search", e, Log.Type.Error)
                }
            }
            ,
            this.GetProperties = function() {
                try {
                    r("GetProperties", "Called");
                    var e = this.GetBaseProperties();
                    return e.push(new PropertyEd.Property(t.ID,this.GetID,this.SetID)),
                    e.push(new PropertyEd.Property(t.Caption,this.GetCaption,this.SetCaption)),
                    e
                } catch (e) {
                    r("GetProperties", e, Log.Type.Error)
                }
            }
            ,
            this.Load = function(e) {
                try {
                    r("Load", "Called"),
                    s = $(e),
                    this.BaseLoad(s),
                    c = s.find(">h3"),
                    d = s.find(">div"),
                    d.length || (d = $("<div/>"),
                    s.append(d))
                } catch (e) {
                    r("Load", e, Log.Type.Error)
                }
            }
            ,
            this.Show = function(e) {
                r("Show", "Called"),
                s.css("display", "block"),
                d.html(e);
                var t = c.html();
                "" == t && c.remove(),
                t.match(/Validation Errors/) && c.html(u)
            }
            ,
            this.Hide = function() {
                r("Hide", "Called"),
                d.html(""),
                s.css("display", "none")
            }
            ,
            this.GetCaption = function() {
                try {
                    return c.text()
                } catch (e) {
                    r("GetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.GetControl = function() {
                try {
                    return s
                } catch (e) {
                    r("GetControl", e, Log.Type.Error)
                }
            }
            ,
            this.GetID = function() {
                try {
                    return s.attr("id")
                } catch (e) {
                    r("GetID", e, Log.Type.Error)
                }
            }
            ,
            this.SetCaption = function(e) {
                try {
                    c.text(e)
                } catch (e) {
                    r("SetCaption", e, Log.Type.Error)
                }
            }
            ,
            this.SetID = function(e) {
                try {
                    s.attr("id", e)
                } catch (e) {
                    r("SetID", e, Log.Type.Error)
                }
            }
        } catch (e) {
            r("Main", e, Log.Type.Error)
        }
    }
    return i
}),
define("rules/BaseComponent", ["PropertyFields", "RuleXML"], function(e, t) {
    function r() {
        function r(e, t, r, n) {
            Log.Add(i.GetID() + "." + o + e, t, r, n)
        }
        this.Type = null,
        this.Icon = null,
        this.OldEntry = null,
        this.OldExit = null;
        var o = "BaseComp."
          , i = this
          , n = null
          , a = null;
        this.BaseCreate = function() {
            try {
                n = $(t.GetNewElement("c")),
                n.append(t.GetNewElement("n")),
                n.append(t.GetNewElement("t")),
                n.append(t.GetNewElement("values")),
                n.append(t.GetNewElement("j")),
                n.append(t.GetNewElement("j"));
                var e;
                e = $(t.GetNewElement("x")),
                e.text("0"),
                n.append(e),
                e = $(t.GetNewElement("y")),
                e.text("0"),
                n.append(e),
                n.append(t.GetNewElement("c")),
                n.append(t.GetNewElement("wp"));
                var o = t.FindFirstAvailableID();
                n.find(">n").text(o)
            } catch (e) {
                r("BaseCreate", e, Log.Type.Error)
            }
        }
        ,
        this.BaseLoad = function(e) {
            try {
                n = $(e),
                this.Type = n.find(">t").text(),
                0 == n.find(">c").length && n.append(t.GetNewElement("c")),
                0 == n.find(">wp").length && n.append(t.GetNewElement("wp"))
            } catch (e) {
                r("BaseLoad", e, Log.Type.Error)
            }
        }
        ,
        this.Delete = function() {
            var e = this.GetIcon();
            e.Delete(),
            e = null
        }
        ,
        this.GetIcon = function() {
            return this.Icon
        }
        ,
        this.GetNode = function() {
            try {
                return n
            } catch (e) {
                r("GetNode", e, Log.Type.Error)
            }
        }
        ,
        this.UpdateWatchpoint = function(e) {
            try {
                var t = !e && this.GetWatchpoint();
                this.HighlightAsWatchpoint(t)
            } catch (e) {
                r("UpdateWatchpoint", e, Log.Type.Error)
            }
        }
        ,
        this.ToggleWatchpoint = function() {
            try {
                var e = !this.GetWatchpoint();
                this.SetWatchpoint(e),
                this.HighlightAsWatchpoint(e)
            } catch (e) {
                r("ToggleWatchpoint", e, Log.Type.Error)
            }
        }
        ,
        this.GetBaseProperties = function() {
            var t = [];
            return t.push(new PropertyEd.Property(e.Comment,this.GetComment,this.SetComment)),
            t.push(new PropertyEd.Property(e.Watchpoint,this.GetWatchpoint,this.SetWatchpoint)),
            t
        }
        ,
        this.GetID = function() {
            try {
                return n.find(">n").text()
            } catch (e) {
                r("GetID", e, Log.Type.Error)
            }
        }
        ,
        this.GetComment = function() {
            try {
                return n.find(">c").text()
            } catch (e) {
                r("GetComment", e, Log.Type.Error)
            }
        }
        ,
        this.SetComment = function(e) {
            try {
                $(n.find(">c")[0]).text(e),
                a.UpdateComment()
            } catch (e) {
                r("SetComment", e, Log.Type.Error)
            }
        }
        ,
        this.GetWatchpoint = function() {
            try {
                return "1" == n.find(">wp").text()
            } catch (e) {
                r("GetWatchpoint", e, Log.Type.Error)
            }
        }
        ,
        this.SetWatchpoint = function(e) {
            try {
                $(n.find(">wp")[0]).text(e ? "1" : "0")
            } catch (e) {
                r("SetWatchpoint", e, Log.Type.Error)
            }
        }
        ,
        this.GetJ1 = function() {
            try {
                return $(n.find(">j")[0]).text()
            } catch (e) {
                r("GetJ1", e, Log.Type.Error)
            }
        }
        ,
        this.GetX = function() {
            try {
                return parseInt(n.find(">x").text(), 10)
            } catch (e) {
                r("GetX", e, Log.Type.Error)
            }
        }
        ,
        this.GetY = function() {
            try {
                return parseInt(n.find(">y").text(), 10)
            } catch (e) {
                r("GetY", e, Log.Type.Error)
            }
        }
        ,
        this.SetIcon = function(e) {
            this.Icon = e,
            a = e
        }
        ,
        this.SetJ1 = function(e) {
            try {
                $(n.find(">j")[0]).text(e)
            } catch (e) {
                r("SetJ1", e, Log.Type.Error)
            }
        }
        ,
        this.SetType = function(e) {
            try {
                $(n.find(">t")[0]).text(e)
            } catch (e) {
                r("SetType", e, Log.Type.Error)
            }
        }
        ,
        this.SetX = function(e) {
            try {
                $(n.find(">x")[0]).text(Utilities.ToNumber(e))
            } catch (e) {
                r("SetX", e, Log.Type.Error)
            }
        }
        ,
        this.SetY = function(e) {
            try {
                $(n.find(">y")[0]).text(Utilities.ToNumber(e))
            } catch (e) {
                r("SetY", e, Log.Type.Error)
            }
        }
        ,
        this.HighlightAsSelected = function(e) {
            var t = this.Icon.GetImage()
              , r = "ui-selected";
            t.toggleClass(r, e),
            this.UpdateWatchpoint(e)
        }
        ,
        this.HighlightAsFound = function(e) {
            var t = this.Icon.GetImage();
            t.toggleClass("ui-search", e),
            this.UpdateWatchpoint(e)
        }
        ,
        this.HighlightAsError = function(e) {
            var t = this.Icon.GetImage();
            t.toggleClass("ui-error", e),
            this.UpdateWatchpoint(e)
        }
        ,
        this.HighlightAsWatchpoint = function(e) {
            var t = this.Icon.GetImage();
            t.toggleClass("ui-watchpoint", e)
        }
        ,
        this.HighlightAsConnecting = function(e) {
            var t = this.Icon.GetImage();
            t.toggleClass("ui-connecting", e),
            this.UpdateWatchpoint(e)
        }
    }
    return r
}),
define("rules/comp/CompiledScriptFunction", ["rules/BaseComponent", "PropertyFields", "Utilities", "RuleXML", "rules/CDATABatch"], function(e, t, r, o, i) {
    function n() {
        function i(e, t, r, o) {
            Log.Add(s.GetID() + "." + a + e, t, r, o)
        }
        function n(e, t) {
            this.Name = e,
            this.Value = t
        }
        this.inheritFrom = e,
        this.inheritFrom(),
        this.Src = "../../images/ruleCOMPILEDSCRIPT.png",
        this.Title = "Script Function Component",
        this.ToolTip = "Executes stingray functions";
        var a = "CSF."
          , s = this
          , l = null;
        this.Create = function() {
            try {
                this.BaseCreate(),
                this.SetType("CSF"),
                l = this.GetNode();
                var e = $(l.find(">values")[0]);
                e.append(o.GetNewElement("n")),
                e.append(o.GetNewElement("v")),
                e.find(">n").text("GetConstant")
            } catch (e) {
                i("Create", e, Log.Type.Error)
            }
        }
        ,
        this.Load = function(e) {
            try {
                l = $(e),
                this.BaseLoad(l)
            } catch (e) {
                i("Load", e, Log.Type.Error)
            }
        }
        ,
        this.Search = function(e, t) {
            try {
                if (i("Search", "Called", Log.Type.Info),
                this.HighlightAsFound(!1),
                !e)
                    return;
                var o = r.MakeRegExp(e, t)
                  , n = $.grep(this.GetFunction(), function(e) {
                    return e.Value.search(o) > -1
                });
                (n.length || this.GetID().search(o) > -1 || this.GetComment().search(o) > -1) && i("Search", this, Log.Type.Search)
            } catch (e) {
                i("Search", e, Log.Type.Error)
            }
        }
        ,
        this.AddParam = function() {
            try {} catch (e) {
                i("AddParam", e, Log.Type.Error)
            }
        }
        ,
        this.DeleteFunction = function() {
            try {} catch (e) {
                i("DeleteFunction", e, Log.Type.Error)
            }
        }
        ,
        this.GetProperties = function() {
            try {
                var e = this.GetBaseProperties()
                  , r = new RulesMaker.ComplexArgs(this.GetProperties,null,null);
                return e.push(new PropertyEd.Property(t.CompiledScriptFunction,this.GetFunction,this.SetFunction,r)),
                e
            } catch (e) {
                i("GetProperties", e, Log.Type.Error)
            }
        }
        ,
        this.GetFunction = function() {
            try {
                var e = [];
                return $(l.find(">values")[0]).find(">n").each(function() {
                    var t = $(this).text()
                      , r = $(this).next().text();
                    r = r.replace(/''/g, "'"),
                    e[e.length] = new n(t,r)
                }),
                e
            } catch (e) {
                i("GetFunction", e, Log.Type.Error)
            }
        }
        ,
        this.SetFunction = function(e) {
            try {
                var t = $(l.find(">values")[0]);
                t.empty(),
                $.each(e, function(e, r) {
                    var i, n;
                    n = r.Name,
                    i = $(o.GetNewElement("n")),
                    t.append(i),
                    i.text(n),
                    n = r.Value || "",
                    i = $(o.GetNewElement("v")),
                    t.append(i),
                    n = n.replace(/'/g, "''"),
                    o.ReplaceCDATA(i, n)
                })
            } catch (e) {
                i("SetFunction", e, Log.Type.Error)
            }
        }
    }
    return n
}),
define("rules/comp/Script", ["rules/BaseComponent", "PropertyFields", "RuleXML"], function(e, t, r) {
    function o() {
        function o(e, t, r, o) {
            Log.Add(i + e + "." + n.GetID(), t, r, o)
        }
        this.inheritFrom = e,
        this.inheritFrom(),
        this.Src = "../../images/RulePascal.png",
        this.Title = "Scripting Component",
        this.ToolTip = "Add scripting code";
        var i = "Script."
          , n = this
          , a = null;
        this.Create = function() {
            try {
                this.BaseCreate(),
                this.SetType("SCRIPT"),
                a = this.GetNode();
                var e = $(a.find(">values")[0]);
                e.append(r.GetNewElement("v")),
                e.append(r.GetNewElement("lng"))
            } catch (e) {
                o("Create", e, Log.Type.Error)
            }
        }
        ,
        this.Load = function(e) {
            try {
                if (a = $(e),
                this.BaseLoad(a),
                0 == a.find(">values>lng").length) {
                    var t = a.find(">values");
                    t.append(r.GetNewElement("lng"))
                }
            } catch (e) {
                o("Load", e, Log.Type.Error)
            }
        }
        ,
        this.Search = function(e, t) {
            try {
                if (o("Search", "Called", Log.Type.Info),
                this.HighlightAsFound(!1),
                !e)
                    return;
                var r = Utilities.MakeRegExp(e, t);
                (this.GetID().search(r) > -1 || this.GetComment().search(r) > -1 || this.GetScript().search(r) > -1) && o("Search", this, Log.Type.Search)
            } catch (e) {
                o("Search", e, Log.Type.Error)
            }
        }
        ,
        this.GetProperties = function() {
            try {
                var e = this.GetBaseProperties();
                return e.push(new PropertyEd.Property(t.Language,this.GetLanguage,this.SetLanguage)),
                e.push(new PropertyEd.Property(t.SCRIPT,this.GetScript,this.SetScript)),
                e
            } catch (e) {
                o("GetProperties", e, Log.Type.Error)
            }
        }
        ,
        this.GetScript = function() {
            try {
                return $(a.find(">values>v")[0]).text()
            } catch (e) {
                o("GetScript", e, Log.Type.Error)
            }
        }
        ,
        this.SetScript = function(e) {
            try {
                r.ReplaceCDATA(a.find(">values>v")[0], e)
            } catch (e) {
                o("SetScript", e, Log.Type.Error)
            }
        }
        ,
        this.GetLanguage = function() {
            try {
                var e = $(a.find(">values>lng")[0]).text();
                return "Pascal" == e && (e = "Server Script"),
                e
            } catch (e) {
                o("GetLanguage", e, Log.Type.Error)
            }
        }
        ,
        this.SetLanguage = function(e) {
            try {
                "Server Script" == e && (e = "Pascal"),
                $(a.find(">values>lng")[0]).text(e)
            } catch (e) {
                o("SetLanguage", e, Log.Type.Error)
            }
        }
    }
    return o
}),
define("rules/comp/SqlTrn", ["rules/BaseComponent", "PropertyFields", "RuleXML"], function(e, t, r) {
    function o() {
        function o(e, t, r, o) {
            Log.Add(i + e + "." + n.GetID(), t, r, o)
        }
        this.inheritFrom = e,
        this.inheritFrom(),
        this.Src = "../../images/RuleSqlTrn.png",
        this.Title = "SQL Transaction Component",
        this.ToolTip = "Add SQL Transaction";
        var i = "SqlTrn."
          , n = this
          , a = null;
        this.Create = function() {
            try {
                this.BaseCreate(),
                this.SetType("SQLTRN"),
                a = this.GetNode();
                var e = $(a.find(">values")[0]);
                e.append(r.GetNewElement("n")),
                e.append(r.GetNewElement("t"))
            } catch (e) {
                o("Create", e, Log.Type.Error)
            }
        }
        ,
        this.Load = function(e) {
            try {
                a = $(e),
                this.BaseLoad(a)
            } catch (e) {
                o("Load", e, Log.Type.Error)
            }
        }
        ,
        this.Search = function(e, t) {
            try {
                if (o("Search", "Called", Log.Type.Info),
                this.HighlightAsFound(!1),
                !e)
                    return;
                var r = Utilities.MakeRegExp(e, t);
                (this.GetID().search(r) > -1 || this.GetComment().search(r) > -1 || this.GetSqlTrnName().search(r) > -1 || this.GetSqlTrnType().search(r) > -1) && o("Search", this, Log.Type.Search)
            } catch (e) {
                o("Search", e, Log.Type.Error)
            }
        }
        ,
        this.GetProperties = function() {
            try {
                var e = this.GetBaseProperties();
                return e.push(new PropertyEd.Property(t.SqlTrnName,this.GetSqlTrnName,this.SetSqlTrnName)),
                e.push(new PropertyEd.Property(t.SqlTrnType,this.GetSqlTrnType,this.SetSqlTrnType)),
                e
            } catch (e) {
                o("GetProperties", e, Log.Type.Error)
            }
        }
        ,
        this.GetSqlTrnName = function() {
            try {
                return $(a.find(">values>n")[0]).text()
            } catch (e) {
                o("GetSqlTrnName", e, Log.Type.Error)
            }
        }
        ,
        this.SetSqlTrnName = function(e) {
            try {
                $(a.find(">values>n")[0]).text(e)
            } catch (e) {
                o("SetSqlTrnName", e, Log.Type.Error)
            }
        }
        ,
        this.GetSqlTrnType = function() {
            try {
                return $(a.find(">values>t")[0]).text()
            } catch (e) {
                o("GetSqlTrnType", e, Log.Type.Error)
            }
        }
        ,
        this.SetSqlTrnType = function(e) {
            try {
                $(a.find(">values>t")[0]).text(e)
            } catch (e) {
                o("SetSqlTrnType", e, Log.Type.Error)
            }
        }
    }
    return o
}),
define("rules/comp/Error", ["rules/BaseComponent", "PropertyFields", "RuleXML"], function(e, t, r) {
    function o() {
        function o(e, t, r, o) {
            Log.Add(i + e + "." + n.GetID(), t, r, o)
        }
        this.inheritFrom = e,
        this.inheritFrom(),
        this.Src = "../../images/RuleERROR.png",
        this.Title = "ERROR Component",
        this.ToolTip = "Displays an html message to the user when an error occurs";
        var i = "Error."
          , n = this
          , a = null;
        this.Create = function() {
            try {
                this.BaseCreate(),
                this.SetType("ERROR"),
                a = this.GetNode();
                var e = $(a.find(">values")[0]);
                e.append(r.GetNewElement("v"))
            } catch (e) {
                o("Create", e, Log.Type.Error)
            }
        }
        ,
        this.Load = function(e) {
            try {
                a = $(e),
                this.BaseLoad(a)
            } catch (e) {
                o("Load", e, Log.Type.Error)
            }
        }
        ,
        this.Search = function(e, t) {
            try {
                if (o("Search", "Called", Log.Type.Info),
                this.HighlightAsFound(!1),
                !e)
                    return;
                var r = Utilities.MakeRegExp(e, t);
                (this.GetID().search(r) > -1 || this.GetComment().search(r) > -1 || this.GetErrorMessage().search(r) > -1) && o("Search", this, Log.Type.Search)
            } catch (e) {
                o("Search", e, Log.Type.Error)
            }
        }
        ,
        this.GetProperties = function() {
            try {
                var e = this.GetBaseProperties();
                return e.push(new PropertyEd.Property(t.ErrorMessage,this.GetErrorMessage,this.SetErrorMessage)),
                e
            } catch (e) {
                o("GetProperties", e, Log.Type.Error)
            }
        }
        ,
        this.GetErrorMessage = function() {
            try {
                return $(a.find(">values>v")[0]).text()
            } catch (e) {
                o("GetErrorMessage", e, Log.Type.Error)
            }
        }
        ,
        this.SetErrorMessage = function(e) {
            try {
                r.ReplaceCDATA(a.find(">values>v")[0], e)
            } catch (e) {
                o("SetErrorMessage", e, Log.Type.Error)
            }
        }
        ,
        this.SetJ1 = null
    }
    return o
}),
define("rules/comp/External", ["rules/BaseComponent", "PropertyFields", "RuleXML"], function(e, t, r) {
    function o() {
        function o(e, t, r, o) {
            Log.Add(i + e + "." + n.GetID(), t, r, o)
        }
        this.inheritFrom = e,
        this.inheritFrom(),
        this.Title = "External Component",
        this.ToolTip = "Delivers a template to the specified screen target after executing the pre-process function",
        this.Src = "../../images/RuleEXTERNAL.png";
        var i = "External."
          , n = this
          , a = null;
        this.Create = function() {
            try {
                this.BaseCreate(),
                this.SetType("EXTERNAL"),
                a = this.GetNode();
                var e = $(a.find(">values")[0]);
                e.append(r.GetNewElement("n"))
            } catch (e) {
                o("Create", e, Log.Type.Error)
            }
        }
        ,
        this.Load = function(e) {
            try {
                a = $(e),
                this.BaseLoad(a)
            } catch (e) {
                o("Load", e, Log.Type.Error)
            }
        }
        ,
        this.Search = function(e, t) {
            try {
                if (o("Search", "Called", Log.Type.Info),
                this.HighlightAsFound(!1),
                !e)
                    return;
                var r = Utilities.MakeRegExp(e, t);
                (this.GetID().search(r) > -1 || this.GetComment().search(r) > -1 || this.GetRuleName().search(r) > -1) && o("Search", this, Log.Type.Search)
            } catch (e) {
                o("Search", e, Log.Type.Error)
            }
        }
        ,
        this.GetProperties = function() {
            try {
                var e = this.GetBaseProperties();
                return e.push(new PropertyEd.Property(t.RuleName,this.GetRuleName,this.SetRuleName)),
                e
            } catch (e) {
                o("GetProperties", e, Log.Type.Error)
            }
        }
        ,
        this.GetRuleName = function() {
            try {
                return $(a.find(">values>n")[0]).text()
            } catch (e) {
                o("GetRuleName", e, Log.Type.Error)
            }
        }
        ,
        this.SetRuleName = function(e) {
            try {
                $(a.find(">values>n")[0]).text(e)
            } catch (e) {
                o("SetRuleName", e, Log.Type.Error)
            }
        }
    }
    return o
}),
define("rules/comp/If", ["rules/BaseComponent", "PropertyFields", "RuleXML"], function(e, t, r) {
    function o() {
        function o(e, t, r, o) {
            Log.Add(i + e + "." + n.GetID(), t, r, o)
        }
        this.inheritFrom = e,
        this.inheritFrom(),
        this.Src = "../../images/RuleIF.png",
        this.Title = "IF Component",
        this.ToolTip = "Makes a binary decision to determine which of two components will be called next";
        var i = "IF."
          , n = this
          , a = null;
        this.Create = function() {
            try {
                this.BaseCreate(),
                this.SetType("IF"),
                a = this.GetNode();
                var e = $(a.find(">values")[0]);
                e.append(r.GetNewElement("v"))
            } catch (e) {
                o("Create", e, Log.Type.Error)
            }
        }
        ,
        this.Load = function(e) {
            try {
                a = $(e),
                this.BaseLoad(a)
            } catch (e) {
                o("Load", e, Log.Type.Error)
            }
        }
        ,
        this.Search = function(e, t) {
            try {
                if (o("Search", "Called", Log.Type.Info),
                this.HighlightAsFound(!1),
                !e)
                    return;
                var r = Utilities.MakeRegExp(e, t);
                (this.GetID().search(r) > -1 || this.GetComment().search(r) > -1 || this.GetSvrCondition().search(r) > -1) && o("Search", this, Log.Type.Search)
            } catch (e) {
                o("Search", e, Log.Type.Error)
            }
        }
        ,
        this.GetProperties = function() {
            try {
                var e = this.GetBaseProperties();
                return e.push(new PropertyEd.Property(t.SvrCondition,this.GetSvrCondition,this.SetSvrCondition)),
                e
            } catch (e) {
                o("GetProperties", e, Log.Type.Error)
            }
        }
        ,
        this.GetSvrCondition = function() {
            try {
                var e = $(a.find(">values>v")[0]).text();
                return e.replace(/''/g, "'")
            } catch (e) {
                o("GetSvrCondition", e, Log.Type.Error)
            }
        }
        ,
        this.SetSvrCondition = function(e) {
            try {
                var t = e.replace(/'/g, "''")
                  , i = r.GetNewCDATA(t)
                  , n = r.GetNewElement("v");
                $(n).append(i),
                a.find(">values")[0].replaceChild(n, a.find(">values>v")[0])
            } catch (e) {
                o("SetSvrCondition", e, Log.Type.Error)
            }
        }
        ,
        this.GetJ2 = function() {
            try {
                return $(a.find(">j")[1]).text()
            } catch (e) {
                o("GetJ2", e, Log.Type.Error)
            }
        }
        ,
        this.SetJ2 = function(e) {
            try {
                $(a.find(">j")[1]).text(e)
            } catch (e) {
                o("SetJ2", e, Log.Type.Error)
            }
        }
    }
    return o
}),
define("rules/comp/InsertUpdateQuery", ["rules/BaseComponent", "PropertyFields", "Utilities", "RuleXML"], function(e, t, r, o) {
    function i() {
        function i(e, t, r, o) {
            Log.Add(a + e + "." + s.GetID(), t, r, o)
        }
        function n(e, t, r) {
            this.Name = e,
            this.Type = t,
            this.Value = r
        }
        this.inheritFrom = e,
        this.inheritFrom(),
        this.Src = "../../images/RuleINSERTUPDATEQUERY.png",
        this.Title = "Insert / Update Query Component",
        this.ToolTip = "Performs a SQL Insert or Update command";
        var a = "InsertUpdateQuery."
          , s = this
          , l = null;
        this.Create = function() {
            try {
                this.BaseCreate(),
                this.SetType("INSERTUPDATEQUERY"),
                l = this.GetNode();
                var e = $(l.find(">values")[0]);
                e.append(o.GetNewElement("query"))
            } catch (e) {
                i("Create", e, Log.Type.Error)
            }
        }
        ,
        this.Load = function(e) {
            try {
                l = $(e),
                this.BaseLoad(l)
            } catch (e) {
                i("Load", e, Log.Type.Error)
            }
        }
        ,
        this.AddParam = function(e) {
            try {
                var t, n = $(l.find(">values")[0]), a = $(o.GetNewElement("param"));
                t = o.GetNewElement("n"),
                a.append(t),
                e && $(t).text(r.Trim(e.Name)),
                t = o.GetNewElement("t"),
                a.append(t),
                e && $(t).text(r.Trim(e.Type)),
                t = o.GetNewElement("v"),
                a.append(t),
                e && $(t).html(o.GetNewCDATA(r.Trim(e.Value))),
                n.append(a)
            } catch (e) {
                i("AddParam", e, Log.Type.Error)
            }
        }
        ,
        this.DeleteParam = function(e) {
            try {
                var t = l.find(">values>param")[e];
                t.parentNode.removeChild(t)
            } catch (e) {
                i("DeleteParam", e, Log.Type.Error)
            }
        }
        ,
        this.Search = function(e, t) {
            try {
                if (i("Search", "Called", Log.Type.Info),
                this.HighlightAsFound(!1),
                !e)
                    return;
                var o = r.MakeRegExp(e, t);
                if (this.GetID().search(o) > -1 || this.GetComment().search(o) > -1 || this.GetQuery().search(o) > -1)
                    return void i("Search", this, Log.Type.Search);
                for (var n = this.GetQueryParams(), a = 0; a < n.length; a++)
                    if (n[a].Name.search(o) > -1 || n[a].Value.search(o) > -1)
                        return void i("Search", this, Log.Type.Search)
            } catch (e) {
                i("Search", e, Log.Type.Error)
            }
        }
        ,
        this.GetProperties = function() {
            try {
                var e = this.GetBaseProperties();
                e.push(new PropertyEd.Property(t.Query,this.GetQuery,this.SetQuery));
                var r = new RulesMaker.ComplexArgs(this.GetProperties,null,null);
                return e.push(new PropertyEd.Property(t.QueryParams,this.GetQueryParams,this.SetQueryParams,r)),
                e
            } catch (e) {
                i("GetProperties", e, Log.Type.Error)
            }
        }
        ,
        this.GetQuery = function() {
            try {
                var e = $(l.find(">values>query")[0]).text();
                return e.replace(/''/g, "'")
            } catch (e) {
                i("GetQuery", e, Log.Type.Error)
            }
        }
        ,
        this.SetQuery = function(e) {
            try {
                var t = e.replace(/'/g, "''")
                  , r = o.GetNewCDATA(t)
                  , n = o.GetNewElement("query");
                $(n).append(r),
                l.find(">values")[0].replaceChild(n, l.find(">values>query")[0])
            } catch (e) {
                i("SetQuery", e, Log.Type.Error)
            }
        }
        ,
        this.GetQueryParams = function() {
            try {
                var e = [];
                return l.find(">values>param").each(function() {
                    var t = $(this)
                      , r = t.find(">n").text()
                      , o = t.find(">t").text().toUpperCase()
                      , i = t.find(">v").text();
                    e.push(new n(r,o,i))
                }),
                e
            } catch (e) {
                i("GetQueryParams", e, Log.Type.Error)
            }
        }
        ,
        this.SetQueryParams = function(e) {
            try {
                var t, o, n, a, c = [], d = l.find(">values>param");
                for (t = 0; t < d.length; t++)
                    s.DeleteParam(0);
                for (t = 0; t < e.length; t++)
                    n = r.Trim(e[t].Name),
                    n && (s.AddParam(e[t]),
                    c.push(n));
                for (t = 0; t < c.length; t++)
                    for (n = c[t].toUpperCase(),
                    o = 0; o < c.length; o++)
                        if (a = c[o].toUpperCase(),
                        o != t && a == n)
                            return void jAlert("The parameter '" + c[t] + "' is used more than once!")
            } catch (e) {
                i("SetQueryParams", e, Log.Type.Error)
            }
        }
    }
    return i
}),
define("rules/comp/Math", ["rules/BaseComponent", "PropertyFields", "RuleXML"], function(e, t, r) {
    function o() {
        function o(e, t, r, o) {
            Log.Add(n + e + "." + a.GetID(), t, r, o)
        }
        function i(e, t, r) {
            this.Name = e,
            this.Format = t,
            this.Value = r
        }
        this.inheritFrom = e,
        this.inheritFrom(),
        this.Src = "../../images/RuleMATH.png",
        this.Title = "Math Component",
        this.ToolTip = "Create, modify, or delete multiple variables with mathematical expressions";
        var n = "Math."
          , a = this
          , s = null;
        this.Create = function() {
            try {
                this.BaseCreate(),
                this.SetType("MATH"),
                s = this.GetNode();
                var e = $(s.find(">values")[0]);
                e.append(r.GetNewElement("n")),
                e.append(r.GetNewElement("f")),
                e.append(r.GetNewElement("v"))
            } catch (e) {
                o("Create", e, Log.Type.Error)
            }
        }
        ,
        this.Load = function(e) {
            try {
                s = $(e),
                this.BaseLoad(s)
            } catch (e) {
                o("Load", e, Log.Type.Error)
            }
        }
        ,
        this.AddParam = function(e) {
            try {
                var t, i = $(s.find(">values")[0]);
                t = r.GetNewElement("n"),
                i.append(t),
                e && $(t).text(Utilities.Trim(e.Name)),
                t = r.GetNewElement("f"),
                i.append(t),
                e && $(t).text(Utilities.Trim(e.Format)),
                t = r.GetNewElement("v"),
                i.append(t),
                e && $(t).text(e.Value)
            } catch (e) {
                o("AddParam", e, Log.Type.Error)
            }
        }
        ,
        this.DeleteParam = function(e) {
            try {
                var t = s.find(">values>n")[e]
                  , r = s.find(">values>f")[e]
                  , i = s.find(">values>v")[e];
                t.parentNode.removeChild(t),
                r.parentNode.removeChild(r),
                i.parentNode.removeChild(i)
            } catch (e) {
                o("DeleteParam", e, Log.Type.Error)
            }
        }
        ,
        this.Search = function(e, t) {
            try {
                if (o("Search", "Called", Log.Type.Info),
                this.HighlightAsFound(!1),
                !e)
                    return;
                var r = Utilities.MakeRegExp(e, t);
                if (this.GetID().search(r) > -1 || this.GetComment().search(r) > -1)
                    return void o("Search", this, Log.Type.Search);
                for (var i = this.GetParams(), n = 0; n < i.length; n++)
                    if (i[n].Name.search(r) > -1 || i[n].Value.search(r) > -1)
                        return void o("Search", this, Log.Type.Search)
            } catch (e) {
                o("Search", e, Log.Type.Error)
            }
        }
        ,
        this.GetProperties = function() {
            try {
                var e = this.GetBaseProperties()
                  , r = new RulesMaker.ComplexArgs(this.GetProperties,null,null);
                return e.push(new PropertyEd.Property(t.MathParams,this.GetParams,this.SetParams,r)),
                e
            } catch (e) {
                o("GetProperties", e, Log.Type.Error)
            }
        }
        ,
        this.GetParams = function() {
            try {
                var e = [];
                return s.find(">values>n").each(function() {
                    var t = $(this).text()
                      , r = $(this).next().text()
                      , o = $(this).next().next().text();
                    e[e.length] = new i(t,r,o)
                }),
                e
            } catch (e) {
                o("GetParams", e, Log.Type.Error)
            }
        }
        ,
        this.SetParams = function(e) {
            try {
                var t, r, i = s.find(">values>n");
                for (t = 0; t < i.length; t++)
                    a.DeleteParam(0);
                for (t = 0; t < e.length; t++)
                    r = Utilities.Trim(e[t].Name),
                    r && a.AddParam(e[t])
            } catch (e) {
                o("SetParams", e, Log.Type.Error)
            }
        }
    }
    return o
}),
define("rules/comp/SelectQuery", ["rules/BaseComponent", "PropertyFields", "Utilities", "RuleXML"], function(e, t, r, o) {
    function i() {
        function i(e, t, r, o) {
            Log.Add(a + e + "." + s.GetID(), t, r, o)
        }
        function n(e, t, r) {
            this.Name = e,
            this.Type = t,
            this.Value = r
        }
        this.inheritFrom = e,
        this.inheritFrom(),
        this.Src = "../../images/RuleSELECTQUERY.png",
        this.Title = "Select Query Component",
        this.ToolTip = "Performs a SQL select with parameters";
        var a = "SelectQuery."
          , s = this
          , l = null;
        this.Create = function() {
            try {
                this.BaseCreate(),
                this.SetType("SELECTQUERY"),
                l = this.GetNode();
                var e = $(l.find(">values")[0]);
                e.append(o.GetNewElement("query"))
            } catch (e) {
                i("Create", e, Log.Type.Error)
            }
        }
        ,
        this.Load = function(e) {
            try {
                l = $(e),
                this.BaseLoad(l)
            } catch (e) {
                i("Load", e, Log.Type.Error)
            }
        }
        ,
        this.AddParam = function(e) {
            try {
                var t, n = $(l.find(">values")[0]), a = $(o.GetNewElement("param"));
                t = o.GetNewElement("n"),
                a.append(t),
                e && $(t).text(r.Trim(e.Name)),
                t = o.GetNewElement("t"),
                a.append(t),
                e && $(t).text(r.Trim(e.Type)),
                t = o.GetNewElement("v"),
                a.append(t),
                e && $(t).html(o.GetNewCDATA(r.Trim(e.Value))),
                n.append(a)
            } catch (e) {
                i("AddParam", e, Log.Type.Error)
            }
        }
        ,
        this.DeleteParam = function(e) {
            try {
                var t = l.find(">values>param")[e];
                t.parentNode.removeChild(t)
            } catch (e) {
                i("DeleteParam", e, Log.Type.Error)
            }
        }
        ,
        this.Search = function(e, t) {
            try {
                if (i("Search", "Called", Log.Type.Info),
                this.HighlightAsFound(!1),
                !e)
                    return;
                var o = r.MakeRegExp(e, t);
                if (this.GetID().search(o) > -1 || this.GetComment().search(o) > -1 || this.GetQuery().search(o) > -1)
                    return void i("Search", this, Log.Type.Search);
                for (var n = this.GetQueryParams(), a = 0; a < n.length; a++)
                    if (n[a].Name.search(o) > -1 || n[a].Value.search(o) > -1)
                        return void i("Search", this, Log.Type.Search)
            } catch (e) {
                i("Search", e, Log.Type.Error)
            }
        }
        ,
        this.GetProperties = function() {
            try {
                var e = this.GetBaseProperties();
                e.push(new PropertyEd.Property(t.Query,this.GetQuery,this.SetQuery));
                var r = new RulesMaker.ComplexArgs(this.GetProperties,null,null);
                return e.push(new PropertyEd.Property(t.QueryParams,this.GetQueryParams,this.SetQueryParams,r)),
                e
            } catch (e) {
                i("GetProperties", e, Log.Type.Error)
            }
        }
        ,
        this.GetJ2 = function() {
            try {
                return $(l.find(">j")[1]).text()
            } catch (e) {
                i("GetJ2", e, Log.Type.Error)
            }
        }
        ,
        this.SetJ2 = function(e) {
            try {
                $(l.find(">j")[1]).text(e)
            } catch (e) {
                i("SetJ2", e, Log.Type.Error)
            }
        }
        ,
        this.GetQuery = function() {
            try {
                var e = $(l.find(">values>query")[0]).text();
                return e.replace(/''/g, "'")
            } catch (e) {
                i("GetQuery", e, Log.Type.Error)
            }
        }
        ,
        this.SetQuery = function(e) {
            try {
                var t = e.replace(/'/g, "''")
                  , r = o.GetNewCDATA(t)
                  , n = o.GetNewElement("query");
                $(n).append(r),
                l.find(">values")[0].replaceChild(n, l.find(">values>query")[0])
            } catch (e) {
                i("SetQuery", e, Log.Type.Error)
            }
        }
        ,
        this.GetQueryParams = function() {
            try {
                var e = [];
                return l.find(">values>param").each(function() {
                    var t = $(this)
                      , r = t.find(">n").text()
                      , o = t.find(">t").text().toUpperCase()
                      , i = t.find(">v").text();
                    e.push(new n(r,o,i))
                }),
                e
            } catch (e) {
                i("GetQueryParams", e, Log.Type.Error)
            }
        }
        ,
        this.SetQueryParams = function(e) {
            try {
                var t, o, n, a, c = [], d = l.find(">values>param");
                for (t = 0; t < d.length; t++)
                    s.DeleteParam(0);
                for (t = 0; t < e.length; t++)
                    n = r.Trim(e[t].Name),
                    n && (s.AddParam(e[t]),
                    c.push(n));
                for (t = 0; t < c.length; t++)
                    for (n = c[t].toUpperCase(),
                    o = 0; o < c.length; o++)
                        if (a = c[o].toUpperCase(),
                        o != t && a == n)
                            return void jAlert("The parameter '" + c[t] + "' is used more than once!")
            } catch (e) {
                i("SetQueryParams", e, Log.Type.Error)
            }
        }
    }
    return i
}),
define("rules/CDATABatch", ["RuleXML"], function(e) {
    function t() {
        function t(e, t) {
            this.e = e,
            this.v = t
        }
        var r = [];
        this.Add = function(e, o) {
            r[r.length] = new t(e,o)
        }
        ,
        this.Process = function() {
            for (var t = 0; t < r.length; t++)
                e.ReplaceCDATA(r[t].e, r[t].v)
        }
    }
    return t
}),
define("rules/comp/Set", ["rules/BaseComponent", "PropertyFields", "RuleXML", "rules/CDATABatch"], function(e, t, r, o) {
    function i() {
        function o(e, t, r, o) {
            Log.Add(n + e + "." + a.GetID(), t, r, o)
        }
        function i(e, t) {
            this.Name = e,
            this.Value = t
        }
        this.inheritFrom = e,
        this.inheritFrom(),
        this.Src = "../../images/RuleSET.png",
        this.Title = "Multi Set Component",
        this.ToolTip = "Create, modify, or delete multiple variables with string expressions";
        var n = "Set."
          , a = this
          , s = null;
        this.Create = function() {
            try {
                this.BaseCreate(),
                this.SetType("SET"),
                s = this.GetNode();
                var e = $(s.find(">values")[0]);
                e.append(r.GetNewElement("n")),
                e.append(r.GetNewElement("v"))
            } catch (e) {
                o("Create", e, Log.Type.Error)
            }
        }
        ,
        this.Load = function(e) {
            try {
                s = $(e),
                this.BaseLoad(s)
            } catch (e) {
                o("Load", e, Log.Type.Error)
            }
        }
        ,
        this.AddParam = function(e) {
            try {
                var t, i = $(s.find(">values")[0]);
                t = r.GetNewElement("n"),
                i.append(t),
                e && $(t).html(r.GetNewCDATA(Utilities.Trim(e.Name))),
                t = r.GetNewElement("v"),
                i.append(t),
                e && $(t).html(r.GetNewCDATA(e.Value))
            } catch (e) {
                o("AddParam", e, Log.Type.Error)
            }
        }
        ,
        this.DeleteParam = function(e) {
            try {
                var t = s.find(">values>n")[e]
                  , r = s.find(">values>v")[e];
                t.parentNode.removeChild(t),
                r.parentNode.removeChild(r)
            } catch (e) {
                o("DeleteParam", e, Log.Type.Error)
            }
        }
        ,
        this.Search = function(e, t) {
            try {
                if (o("Search", "Called", Log.Type.Info),
                this.HighlightAsFound(!1),
                !e)
                    return;
                var r = Utilities.MakeRegExp(e, t);
                if (this.GetID().search(r) > -1 || this.GetComment().search(r) > -1)
                    return void o("Search", this, Log.Type.Search);
                for (var i = this.GetParams(), n = 0; n < i.length; n++)
                    if (i[n].Name.search(r) > -1 || i[n].Value.search(r) > -1)
                        return void o("Search", this, Log.Type.Search)
            } catch (e) {
                o("Search", e, Log.Type.Error)
            }
        }
        ,
        this.GetProperties = function() {
            try {
                var e = this.GetBaseProperties()
                  , r = new RulesMaker.ComplexArgs(this.GetProperties,null,null);
                return e.push(new PropertyEd.Property(t.SetParams,this.GetParams,this.SetParams,r)),
                e
            } catch (e) {
                o("GetProperties", e, Log.Type.Error)
            }
        }
        ,
        this.GetParams = function() {
            try {
                var e = [];
                return s.find(">values>n").each(function() {
                    var t = $(this).text()
                      , r = $(this).next().text();
                    e[e.length] = new i(t,r)
                }),
                e
            } catch (e) {
                o("GetParams", e, Log.Type.Error)
            }
        }
        ,
        this.SetParams = function(e) {
            try {
                var t, r, i = s.find(">values>n");
                for (t = 0; t < i.length; t++)
                    a.DeleteParam(0);
                for (t = 0; t < e.length; t++)
                    r = Utilities.Trim(e[t].Name),
                    r && a.AddParam(e[t])
            } catch (e) {
                o("SetParams", e, Log.Type.Error)
            }
        }
    }
    return i
}),
define("rules/comp/Template", ["rules/BaseComponent", "PropertyFields", "RuleXML"], function(e, t, r) {
    function o() {
        function o(e, t, r, o) {
            Log.Add(i + e + "." + n.GetID(), t, r, o)
        }
        this.inheritFrom = e,
        this.inheritFrom(),
        this.Src = "../../images/RuleTEMPLATE.png",
        this.Title = "Template Component",
        this.ToolTip = "Delivers a template to the specified screen target WITHOUT executing the pre-process function";
        var i = "Template."
          , n = this
          , a = null;
        this.Create = function() {
            try {
                this.BaseCreate(),
                this.SetType("TEMPLATE"),
                a = this.GetNode();
                var e = $(a.find(">values")[0]);
                e.append(r.GetNewElement("n")),
                e.append(r.GetNewElement("t"))
            } catch (e) {
                o("Create", e, Log.Type.Error)
            }
        }
        ,
        this.Load = function(e) {
            try {
                a = $(e),
                this.BaseLoad(a)
            } catch (e) {
                o("Load", e, Log.Type.Error)
            }
        }
        ,
        this.Search = function(e, t) {
            try {
                if (o("Search", "Called", Log.Type.Info),
                this.HighlightAsFound(!1),
                !e)
                    return;
                var r = Utilities.MakeRegExp(e, t);
                (this.GetID().search(r) > -1 || this.GetComment().search(r) > -1 || this.GetName().search(r) > -1 || this.GetTarget().search(r) > -1) && o("Search", this, Log.Type.Search)
            } catch (e) {
                o("Search", e, Log.Type.Error)
            }
        }
        ,
        this.GetProperties = function() {
            try {
                var e = this.GetBaseProperties();
                return e.push(new PropertyEd.Property(t.Name,this.GetName,this.SetName)),
                e.push(new PropertyEd.Property(t.Target,this.GetTarget,this.SetTarget)),
                e
            } catch (e) {
                o("GetProperties", e, Log.Type.Error)
            }
        }
        ,
        this.GetName = function() {
            try {
                return $(a.find(">values>n")[0]).text()
            } catch (e) {
                o("GetName", e, Log.Type.Error)
            }
        }
        ,
        this.GetTarget = function() {
            try {
                return $(a.find(">values>t")[0]).text()
            } catch (e) {
                o("GetTarget", e, Log.Type.Error)
            }
        }
        ,
        this.SetName = function(e) {
            try {
                $(a.find(">values>n")[0]).text(e)
            } catch (e) {
                o("SetName", e, Log.Type.Error)
            }
        }
        ,
        this.SetTarget = function(e) {
            try {
                $(a.find(">values>t")[0]).text(e)
            } catch (e) {
                o("SetTarget", e, Log.Type.Error)
            }
        }
    }
    return o
});
