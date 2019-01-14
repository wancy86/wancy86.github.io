define('Global', ['Editor', 'ReqList', 'jQuery', 'Log', 'PageHelper'], function(Editor, ReqList, $, Log, PageHelper) {
    var Global = new function() {
        try {
            /* PRIVATE PROPERTIES */
            var logClassName = "Global.";
            var ProgressBar = null;

            /* PRIVATE METHODS */

            function iLog(Place, Message, Type, Silent) {
                Log.Add(logClassName + Place, Message, Type, Silent);
            }

            function UpdateRuleSet(RuleSet, ColorData) {
                if (!RuleSet || !RuleSet.selectorText)
                    return;

                //LK: Fixes a bug when passed Color Data object becomes again plain JSON string! Weird.
                if (Utilities.IsObject(ColorData))
                    var cd = ColorData;
                else
                    var cd = jsonParse(ColorData);

                var cssRule = RuleSet.selectorText.toLowerCase().replace(/'/g, '"');
                var cssStyle = RuleSet.style;

                switch (cssRule) {
                    case "body":
                        cssStyle.backgroundColor = cd.BodyBackground;
                        break;
                    case "h1, h2, h3":
                    case "h1":
                    case "h2":
                    case "h3":
                        cssStyle.color = cd.HTagColor;
                        break;
                    case "a":
                    case "a:visited":
                    case "a, a:visited":
                    case ".validationerrors li":
                        cssStyle.color = cd.Anchor;
                        break;
                    case "a:hover":
                    case ".validationerrors li:hover":
                        cssStyle.color = cd.AnchorHover;
                        break;
                    case ".sdata":
                    case ".sheader":
                    case "#shell":
                        cssStyle.backgroundColor = cd.Shell;
                        break;
                    case "#bottom":
                        cssStyle.backgroundColor = cd.FootColor;
                        break;
                    case ".required":
                        cssStyle.color = cd.Required;
                        break;
                    case ".notrequired":
                        cssStyle.color = cd.NotRequired;
                        break;
                    case 'input, select, textarea':
                    case '.editortext span':
                    case '.editormemospan':
                    case '.memospelldiv':
                        cssStyle.backgroundColor = cd.InputBackground;
                        break;
                    case 'input[type="button"]':
                        cssStyle.backgroundColor = cd.ButtonBackground;
                        break;
                    case ".staticcontainer h3, .dynamiccontainer h3, .validationcontainer h3, .scriptingcontainer h3":
                    case ".staticcontainer h3":
                    case ".dynamiccontainer h3":
                    case ".validationcontainer h3":
                    case ".scriptingcontainer h3":
                        cssStyle.color = cd.ContainerHeadTextColor;
                        cssStyle.backgroundColor = cd.ContainerHeadBackgroundColor;
                        break;
                    case ".editorlabel label.pagetitle":
                        cssStyle.color = cd.PageTitle;
                        break;
                    case ".tablemaster tr":
                    case ".tablemastersm tr":
                    case ".ac_odd":
                        cssStyle.backgroundColor = cd.TableRowColor;
                        break;
                    case ".tablemaster tr.even":
                    case ".tablemastersm tr.even":
                    case ".ac_results":
                        cssStyle.backgroundColor = cd.TableAlternateRowColor;
                        break;
                    case ".tablemaster thead tr":
                    case ".tablemastersm thead tr":
                        cssStyle.backgroundColor = cd.TableHeadColor;
                        break;
                    case "#menu":
                    case "#menu ul ul ul a":
                        cssStyle.backgroundColor = cd.MenuBackgroundColor;
                        break;
                    case "#menu a":
                        cssStyle.backgroundColor = cd.MenuBackgroundColor;
                        cssStyle.color = cd.MenuTextColor;
                        cssStyle.borderColor = cd.MenuBorderColorTop + ' ' + cd.MenuBorderColorRight + ' ' + cd.MenuBorderColorBottom + ' ' + cd.MenuBorderColorLeft;
                        break;
                    case "#menu a:hover":
                        cssStyle.color = cd.MenuHoverColor;
                        break;
                    case "#menu ul ul a":
                        cssStyle.backgroundColor = cd.MenuBackgroundColor;
                        cssStyle.borderColor = cd.MenuDropdownBorderColor;
                        break;
                }
            }

            return {
                /* PUBLIC PROPERTIES */
                DisableTooltips: false,
                WorkflowTimerInitialized: false,
                FadingHelpLinks: false,

                /* PUBLIC METHODS */
                Version: function() {
                    return MP.StingrayJsVersion;
                },
                ShowBarcodeDlg: function() {
                    jPrompt('Scan a barcode while the cursor is in this edit box\nWARNING: Any unsaved changes on current page will be lost!', '', 'Barcode Scanner', function(bc) {
                        if (bc)
                            Communication.LinkRequest('BarCode.max?' + $.param({ 'BC': bc }));
                    });
                },
                SetRequiredForAllElements: function(isRequired, commaList) {
                    try {
                        var arr = commaList.split(',');
                        for (var i = 0; i < arr.length; i++) {
                            Global.GetControl($.trim(arr[i])).SetRequired(isRequired);
                        };
                    } catch (err) {
                        iLog("SetRequiredForAllElements", err, Log.Type.Error);
                    }
                },
                // Fix GUI of already Spellchecked fields
                RemoveAllSpellchecks: function() {
                    try {
                        if (!window.livespell)
                            return;

                        livespell.spellingProviders = [];
                    } catch (err) {
                        iLog("RemoveAllSpellchecks", err, Log.Type.Error);
                    }
                },
                // Add Spellcheck to a field
                AddSpellcheck: function(obj) {
                    try {
                        if (!window.$Spelling) {
                            jAlert('Spellcheck module not loaded!');
                            return;
                        };

                        var div = $(obj).parent();
                        div.children('span').hide();
                        $Spelling.SpellCheckAsYouType(div.children('textarea'));
                        div.removeClass('EditorMemo').addClass('MemoSpellDiv');
                        div.children('.livespell_textarea').css({
                            'width': '100%',
                            'height': '100%'
                        });
                    } catch (err) {
                        iLog("AddSpellcheck", err, Log.Type.Error);
                    }
                },
                MakeCKEditorFromMemo: function(id, width, height) {
                    try {
                        var ed = CKEDITOR.instances[id];
                        if (ed)
                            ed.destroy(true);

                        var cfg = {
                            width: width + 2,
                            height: height - 38,
                            toolbarStartupExpanded: false,
                            removePlugins: 'elementspath',
                            //skin : 'office2003',
                            toolbar: [
                                { name: 'document', items: ['Source', '-', 'Maximize', 'Print'] },
                                { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'PasteText', '-', 'Undo', 'Redo'] },
                                { name: 'editing', items: ['Find', 'Replace'] },
                                { name: 'insert', items: ['Table', 'HorizontalRule', 'Smiley', 'SpecialChar'] },
                                { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'] },
                                { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'] },
                                { name: 'links', items: ['Link', 'Unlink'] },
                                { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
                                { name: 'colors', items: ['TextColor', 'BGColor'] }
                            ]
                        };

                        CKEDITOR.config.resize_enabled = false;
                        CKEDITOR.config.resize_minWidth = 50;
                        CKEDITOR.config.resize_minHeight = 50;
                        CKEDITOR.replace(id, cfg);
                    } catch (err) {
                        iLog("MakeCKEditorFromMemo", err, Log.Type.Error);
                    }
                },
                GetCKEditorDataByID: function(id) {
                    try {
                        var ed = CKEDITOR.instances[id];
                        if (ed) {
                            return ed.getData();
                        } else
                            return "";
                    } catch (err) {
                        iLog("GetCKEditorDataByID", err, Log.Type.Error);
                    }
                },
                RemoveAllCKEditors: function(onlyNotExisting) {
                    try {
                        for (var i in CKEDITOR.instances) {
                            var ed = CKEDITOR.instances[i];
                            var b = (!onlyNotExisting || $('#' + ed.name).length == 0);
                            if (b)
                                ed.destroy(true);
                        }
                    } catch (err) {
                        iLog("RemoveAllCKEditors", err, Log.Type.Error);
                    }
                },
                ConvertToAceEditor: function(element, language, focusAfter) {
                    language = language || 'text';

                    var cfg = MP.Tools.Config.Editor.ace;
                    var parent, ae, el;
                    if ((element.is("textarea") || element.is("input")) && element.is(":visible")) {
                        element.hide(); //.resizable('destroy')

                        parent = element.parent();
                        el = $('<div/>')
                            .appendTo(parent);
                        el = el.get(0);
                        ae = ace.edit(el);
                        ae.session.setValue(element.val());
                    } else {
                        parent = element.parent();
                        el = element.get(0);
                        ae = ace.edit(el);
                    };
                    ae.session.setMode("ace/mode/" + language);
                    ae.session.setUseWrapMode(cfg.wordWrap);
                    ae.setFontSize(14);

                    var themes = ["chrome", "clouds", "crimson_editor", "dawn", "dreamweaver", "eclipse", "github",
                        "solarized_light", "textmate", "tomorrow", "xcode", "clouds_midnight", "cobalt", "idle_fingers", "kr_theme", "merbivore",
                        "merbivore_soft", "mono_industrial", "monokai", "pastel_on_dark", "solarized_dark", "tomorrow_night", "tomorrow_night_blue",
                        "tomorrow_night_bright", "tomorrow_night_eighties", "twilight", "vibrant_ink", "ambiance", "chaos"
                    ];
                    var languages = ["text", "sql", "javascript", "pascal", "xml", "json", "html", "css"];
                    var help =
                        'F11  -  Toggle full screen\n' +
                        'Alt-W  -  Toggle word wrap\n' +
                        'Tab  -  Indent selection\n' +
                        'Shift-Tab  -  Outdent selection\n' +
                        'Alt-S  -  Remove doubled single quotes\n' +
                        'Alt-D  -  Double single quotes\n' +
                        'Ctrl-/  -  Toggle comment\n' +
                        'Ctrl-L  -  Go to line number\n' +
                        'Alt-L  -  Toggle fold\n' +
                        'Alt-0  -  Fold all\n' +
                        'Alt-Shift-0  -  Unfold all\n' +
                        'Ctrl-F  -  Find\n' +
                        'Ctrl-H  -  Replace\n' +
                        'Ctrl-K  -  Find next\n' +
                        'Ctrl-Shift-K  -  Find previous\n' +
                        'Ctrl-P  -  Jump to matching end\n' +
                        'Ctrl-Shift-P  -  Select to matching end\n' +
                        'Ctrl-U  -  To uppercase\n' +
                        'Ctrl-Shift-U  -  To lowercase\n' +
                        'Ctrl-D  -  Remove line\n' +
                        'Ctrl-Shift-D  -  Duplicate selection\n' +
                        'Ctrl-Alt-S  -  Sort selected lines\n' +
                        'Alt-Shift-Up  -  Copy lines up\n' +
                        'Alt-Up  -  Move lines up\n' +
                        'Alt-Shift-Down  -  Copy lines down\n' +
                        'Alt-Down  -  Move lines down\n' +
                        'Ctrl-[  -  Outdent line\n' +
                        'Ctrl-]  -  Indent line\n' +
                        'Ctrl-Up  -  Scroll up\n' +
                        'Ctrl-Down  -  Scroll down\n' +
                        'Ctrl-A  -  Select all\n' +
                        'Alt-mouse  -  Select rectangle\n' +
                        'Ctrl-Alt-E  -  Toggle recording\n' +
                        'Ctrl-Shift-E  -  Replay macro';

                    var aceFoot = $('<div/>')
                        .addClass("noWrap")
                        .appendTo(parent);

                    $('<select/>')
                        .attr('title', "Change editor theme")
                        .addClass("ace_selector")
                        .append(Utilities.ConvertToOptions(themes))
                        .appendTo(aceFoot)
                        .change(function() {
                            var sel = $(this).val();
                            cfg.theme = sel;
                            ae.setTheme("ace/theme/" + sel);
                        })
                        .val(cfg.theme || themes[0])
                        .change();

                    $('<select/>')
                        .attr('title', "Change editor language")
                        .addClass("ace_selector")
                        .append(Utilities.ConvertToOptions(languages))
                        .appendTo(aceFoot)
                        .change(function() {
                            var sel = $(this).val().toLowerCase();
                            ae.session.setMode("ace/mode/" + sel);
                        })
                        .val(language || languages[0]);

                    $('<div/>')
                        .attr('title', help)
                        .addClass("ace_help")
                        .appendTo(aceFoot);

                    if (cfg.codeTips)
                        ae.tokenTooltip = new TokenTooltip(ae);

                    // Delay focus to prevent wrong page scroll
                    if (focusAfter) {
                        setTimeout(function() {
                            ae.focus();
                        }, 50);
                    };

                    return ae;
                },
                GetCookie: function(name) {
                    try {
                        var i, arr, c, x, y;
                        arr = document.cookie.split("; ");
                        for (i = 0; i < arr.length; i++) {
                            c = arr[i];
                            x = c.substr(0, c.indexOf("="));
                            x = x.replace(/^\s+|\s+$/g, "");
                            if (x == name) {
                                y = c.substr(c.indexOf("=") + 1);
                                y = unescape(y);
                                return y;
                            }
                        }
                    } catch (err) {
                        iLog("GetCookie", err, Log.Type.Error, true);
                    }
                    return "";
                },
                SetCookie: function(name, value) {
                    try {
                        var exdate = new Date();
                        exdate.setDate(exdate.getDate() + 1);
                        document.cookie = name + "=" + escape(value) + "; expires=" + exdate.toUTCString();
                    } catch (err) {
                        iLog("SetCookie", err, Log.Type.Error);
                    }
                },
                SetClipboard: function(str) {
                    try {
                        window.clipboardData.setData('text', str);
                    } catch (err) {
                        iLog("SetClipboard", err, Log.Type.Error);
                    }
                },
                GetClipboard: function() {
                    try {
                        return window.clipboardData.getData('text');
                    } catch (err) {
                        iLog("GetClipboard", err, Log.Type.Error);
                    }
                    return "";
                },

                CheckWorkflow: function(param) {
                    if (param == null && Global.WorkflowTimerInitialized == true)
                        return;

                    Communication.CustomRequest("IconTray.max?action=workflow", function(IconColor) {
                        if (IconColor != "none")
                            $("#WorkflowIcon").attr("src", "../../images/32px-Crystal_Clear_app_access_" + IconColor + ".png");
                        else {
                            $("#WorkflowIcon").css("display", "none");
                            return;
                        }
                    }, null);

                    Global.WorkflowTimerInitialized = true;

                    // check status again in 5 minutes
                    setTimeout("Global.CheckWorkflow(true)", 5 * 60 * 1000);
                },

                // Disable or Enable tooltips globally
                Tooltips: function(boolShow) {
                    try {
                        if (boolShow == undefined)
                            boolShow = Global.DisableTooltips;
                        else
                            Global.DisableTooltips = boolShow;

                        if (boolShow) {
                            $("*[oldtitle]").each(function() {
                                $(this).attr("title", $(this).attr("oldtitle"));
                                $(this).removeAttr("oldtitle");
                            });
                        } else {
                            $("*[title]").each(function() {
                                $(this).attr("oldtitle", $(this).attr("title"));
                                $(this).removeAttr("title");
                            });
                        }
                    } catch (err) {
                        iLog("Tooltips", err, Log.Type.Error);
                    }
                },

                // returns a template component or array of components matching the id passed in
                GetControl: function(ctrlID) {
                    try {

                        //var inpt = $("#" + ctrlID); - won't return two objects with same id such as radio buttons
                        var inpt = $("*[name='" + ctrlID + "']");
                        var arr = new Array();

                        inpt.each(function() {
                            var ctrl = $(this).parents(".component");
                            if (ctrl.length > 0) // prevents problems where the same id is used on a non-control element (hack)
                                arr.push(PageHelper.GetEditorComponent(ctrl[0]));
                        });

                        if (arr.length == 1)
                            return arr[0];

                        return arr;

                    } catch (err) {
                        iLog("GetControl", err, Log.Type.Error);
                    }
                },
                MakeReadOnly: function(div) {
                    try {
                        var sel = null;
                        if ((typeof div == null) || (typeof div == 'undefined') || div == '') sel = $('#middle');
                        else sel = $(div);
                        inp = sel.find(":checkbox, :radio, select").attr("disabled", true);
                        inp = sel.find(":text, textarea").attr("readonly", true);
                    } catch (err) {
                        iLog("MakeReadOnly", err, Log.Type.Error);
                    }
                },

                InProgress: function() {
                    return ProgressBar && ProgressBar.is(":visible");
                },
                ShowProgress: function(blurInput) {
                    try {
                        if (blurInput)
                            $(blurInput).blur();
                        if (!ProgressBar)
                            ProgressBar = $('<div id="spinnerOverlay"></div>').appendTo('body');
                        ProgressBar.show();
                    } catch (err) {
                        iLog("ShowProgress", err, Log.Type.Error);
                    }
                },
                HideProgress: function() {
                    try {
                        if (ProgressBar)
                            ProgressBar.hide();
                    } catch (err) {
                        iLog("HideProgress", err, Log.Type.Error);
                    }
                },

                HideMessage: function() {
                    try {
                        $("#ModalWindow").dialog("close");
                    } catch (err) {
                        iLog("HideMessage", err, Log.Type.Error);
                    }
                },
                ShowErrorMessage: function(html, title, buttons) {
                    this.ShowMessage(html, 800, title || 'Error', null, buttons);
                },
                ShowMessage: function(html, width, title, opacity, buttons) {
                    try {
                        var $window = $('#ModalWindow');
                        var showNextMessage = function($window) {
                            var msg = $window.data('message-queue').shift();
                            if (!msg)
                                return;

                            $window.dialog('option', 'width', msg.width);
                            $window.dialog('option', 'title', msg.title);
                            $window.dialog('option', 'overlay', {
                                opacity: msg.opacity,
                                background: msg.color
                            });
                            $window.dialog('option', 'buttons', msg.buttons);
                            $window.dialog('close'); // Needed to get around jQuery UI bug (is it a bug?)
                            $window.html($('<div/>').html(msg.html));
                            $window.dialog('open');
                            $window.data('current-message', msg);
                        };

                        if (!$window.attr("dialoginit")) {
                            $window.css("display", "block");
                            $window.dialog({
                                modal: true,
                                autoOpen: false
                            });
                            $window.attr("dialoginit", "true");
                            $window.data('message-queue', []);
                            $window.bind('dialogclose', function() {
                                showNextMessage($window);
                            });
                        }

                        $window.data('message-queue').push({
                            html: html,
                            width: width || 960,
                            title: title || '',
                            opacity: opacity || .5,
                            color: '#000',
                            buttons: buttons || {}
                        });

                        showNextMessage($window);
                    } catch (err) {
                        iLog("ShowMessage", err, Log.Type.Error);
                    }
                },
                ReloadStyles: function(jsonColorStr, cssFilesCSV) {
                    if (!jsonColorStr)
                        return;

                    cssFilesCSV = cssFilesCSV || 'global.css,custom.css,tablewalker.css';
                    var cssFilesArr = cssFilesCSV.split(',');
                    var cd = jsonParse(jsonColorStr);
                    var mozilla = Browser.IsFirefox() || Browser.IsChrome() || Browser.IsSafari();
                    var sheets = document.styleSheets.length;

                    for (var i = 0; i < sheets; i++) {
                        for (var k = 0; k < cssFilesArr.length; k++) {
                            var re = new RegExp(cssFilesArr[k] + '$', 'i');
                            try {
                                var name = document.styleSheets[i].href;
                                if (name && name.match(re)) {
                                    if (mozilla)
                                        var rules = document.styleSheets[i].cssRules;
                                    else
                                        var rules = document.styleSheets[i].rules;

                                    if (rules) {
                                        for (var j = 0; j < rules.length; j++)
                                            UpdateRuleSet(rules[j], cd);
                                    }
                                    break;
                                }
                            } catch (err) {
                                Log.Add('ReloadStyles', err, Log.Type.Error);
                            }
                        }
                    }
                },
                ScrollToElement: function(element, speed, onComplete) {
                    speed = speed || 1000;
                    $('html, body').animate({
                        scrollTop: element.offset().top
                    }, speed, onComplete);
                },
                // Content highlighting fix during dragging and resizing in Chrome!
                DisableHighlightingInChrome: function(disable) {
                    if (!Browser.IsChrome())
                        return;

                    if (disable)
                        $(document).disableSelection();
                    else
                        $(document).enableSelection();
                },
                UpdateLastPosition: function(div, ui) {
                    var doc = $(document);
                    var pos = (ui && ui.position) ? ui.position : div.parent().offset();

                    div.data('lastTop', Utilities.ToNumber(pos.top - doc.scrollTop()));
                    div.data('lastLeft', Utilities.ToNumber(pos.left - doc.scrollLeft()));
                }
            };

        } catch (err) {
            iLog("Main", err, Log.Type.Error);
        }
    };

    return Global;
});