/*
 Classes and functions to handle ReqList
*/
define('ReqList', ['jQuery', 'Utilities'], function($, Utilities) {
    var ReqList = new function(undefined) {
        try {

            /* PRIVATE PROPERTIES */
            var logClassName = "ReqList.",
                _reqDiv = null,
                _reqTab,
                _location,
                _wrapper,
                _reqTable = null,
                _reqID = 0,
                _lastReqList = "", // the last RL sent from stingray
                _lastVrmName = "",
                _lastVrmPg = null,
                _initialRL,
                _config;

            function iLog(Place, Message, Type, Silent) {
                Log.Add(logClassName + Place, Message, Type, Silent);
            }

            function Entry(Name, Value) {
                this.Name = Name;
                this.Value = Value;
            }

            function FormatEntry(ent) {
                _reqID++;

                var le = $("<tr/>");
                le.append("<td class='index'>" + _reqID + "</td>");
                le.append("<td class='name'>" + ent.Name + "</td>");
                if (ent.Name == 'VRM-PG')
                    le.append("<td class='wpValue'>" + ent.Value + "</td>");
                else {
                    le.append("<td class='value'><code class='ReqList'/></td>");
                    le.find("code").text(ent.Value);
                };

                return le;
            }

            function Clear() {
                _reqID = 0;
                _lastVrmPg = null;
                if (_reqTable)
                    _reqTable.empty().remove();
                _reqTable = $('<table class="ReqList"><tr><th>ID</th><th>Name</th><th>Value</th></tr></table>');
                _wrapper.append(_reqTable);
            }
            // Shows the entire ReqList in HTML table           
            function Display(rlNode, vrmName, xml) {
                try {
                    if (!rlNode)
                        return false;
                    iLog("Display", "Called");

                    // Cache last valid RL
                    if (_initialRL) {
                        _lastReqList = xml;
                        _lastVrmName = vrmName;
                    };

                    // To preserve performance do not do anything if disabled or hidden
                    if (!ReqList.Enabled || !_wrapper.is(':visible'))
                        return false;

                    if (_initialRL) {
                        Clear();
                        _lastVrmPg = ReqList.Add('VRM-PG', vrmName);
                    } else {
                        if (!_config.showAll)
                            return false;

                        ReqList.Add('VRM-PG', vrmName);
                    };

                    var s = $(rlNode).text();
                    var regex = /\|{2}/g;
                    var arr = s.split(regex);
                    for (var i = 0; i < arr.length; i++) {
                        var m = arr[i];
                        var b = m.indexOf("=");
                        ReqList.Add(m.substring(0, b), m.substring(b + 1));
                    };
                    ReqList.Add('', '');
                    ReqList.Add('', '');
                    EnsureLimit();

                    return true;
                } catch (err) {
                    iLog("Display", err, Log.Type.Error);
                }
            }
            // Remove the oldest records to preserve system resources
            function EnsureLimit() {
                var cnt = _reqTable.find("tr").length;
                if (cnt > 1000) {
                    var i = cnt - 1000;
                    _reqTable.find("tr:gt(0):lt(" + i.toString() + ")").empty().remove();
                }
            }

            function InitConfig() {
                _config = MP.Tools.Config.Editor.tabs.reqList;
            }

            function UpdateButtons() {
                if (ReqList.Enabled)
                    _reqDiv.dialog("option", "title", "ReqList viewer");
                else
                    _reqDiv.dialog("option", "title", "ReqList viewer - Disabled");

                var bp = $(".ui-dialog-buttonpane", _reqDiv.parent());
                var FindBtn = function(caption) {
                    return $("button:contains(" + caption + ")", bp);
                };

                if (ReqList.Enabled)
                    FindBtn('Enable').html("Disable");
                else
                    FindBtn('Disable').html("Enable");

                if (_config.pinned)
                    FindBtn('Pin').html("Unpin");
                else
                    FindBtn('Unpin').html("Pin");

                if (_location == _reqTab)
                    FindBtn('Tab View').html("View Here");
                else
                    FindBtn('View Here').html("Tab View");

                if (_config.showAll)
                    FindBtn('Show All').html("Show 1st");
                else
                    FindBtn('Show 1st').html("Show All");
            }

            return {

                Enabled: false,
                Initialized: false,

                // Gets the HTML of the Table element
                GetList: function() {
                    if (_lastReqList)
                        return Utilities.GetXmlString(_lastReqList);
                    else
                        return "No ReqList";
                },
                // Loads RL from xml - The XML of the entire response which may or may not contain a RL
                Load: function(xml) {
                    try {
                        if (!this.Initialized || !xml)
                            return;
                        iLog("Load", "Called");

                        var sr = $(xml).find("stingray");
                        var vrm = sr.find("vrmname").text();
                        var rl = sr.find("reqlist");
                        var cb = sr.find("callback").text();
                        var sts = sr.find("status").text();
                        _initialRL = !((cb == 0) && (sts != "error"));

                        if (Display(rl, vrm, xml))
                            this.AutoFilter();
                    } catch (err) {
                        iLog("Load", err, Log.Type.Error, true);
                    }
                },
                Add: function(name, value) {
                    try {
                        if (!this.Initialized)
                            return null;

                        var e = new Entry(name, value);
                        var fe = FormatEntry(e);
                        _reqTable.append(fe);
                        return fe;
                    } catch (err) {
                        iLog("Add", err, Log.Type.Error);
                    }
                },
                ClearTab: function() {
                    if (!this.Initialized)
                        return;
                    iLog("ClearTab", "Called");

                    Clear();
                },
                Show: function(activate) {
                    if (!this.Initialized)
                        return;

                    _reqDiv.dialog("open");
                    if (activate && !this.Enabled)
                        this.Switch();
                },
                Hide: function() {
                    if (!this.Initialized)
                        return;

                    _reqDiv.dialog("close");
                },
                Switch: function() {
                    this.Enabled = !this.Enabled;

                    UpdateButtons();

                    if (_reqID == 0)
                        this.Load(_lastReqList);
                },
                Pin: function(value) {
                    if (value == undefined)
                        _config.pinned = !_config.pinned;
                    else
                        _config.pinned = value;

                    UpdateButtons();

                    if (_config.pinned) {
                        $(window).bind('scroll.pinReqListDiv', function() {
                            var p = _reqDiv.parent();
                            if (p.is(":visible"))
                                p.css('top', (_reqDiv.data('lastTop') + $(document).scrollTop()) + "px");
                        });
                    } else {
                        $(window).unbind('scroll.pinReqListDiv');
                    }
                },
                MoveTo: function(value) {
                    if (!value)
                        value = (_location == _reqDiv) ? 'tab' : 'float';
                    else
                        value = value.toLowerCase();
                    _config.viewStyle = value;

                    var div = _wrapper.detach();
                    var msg = 'This view is inactive. You can either <a class="activateViewLink">activate this view</a> or <a class="goToViewLink">go to the other view</a>.';

                    if (value == 'tab') {
                        _location = _reqTab;
                        this.Hide();
                        _reqDiv.html(msg);
                        _reqDiv.find('.activateViewLink').bind('click', function() {
                            ReqList.MoveTo("float");
                        });
                        _reqDiv.find('.goToViewLink').bind('click', function() {
                            ReqList.Hide();
                            Global.ScrollToElement($('#ReqListLink'), 500);
                        });
                        _reqTab.html('');
                        div.appendTo(_reqTab);
                        if (this.Initialized)
                            Global.ScrollToElement($('#ReqListLink'), 500);
                    } else {
                        _location = _reqDiv;
                        _reqTab.html(msg);
                        _reqTab.find('.activateViewLink').bind('click', function() {
                            ReqList.MoveTo("tab");
                        });
                        _reqTab.find('.goToViewLink').bind('click', function() {
                            ReqList.Show();
                            Global.ScrollToElement(_reqDiv.parent(), 500);
                        });
                        _reqDiv.html('');
                        div.appendTo(_reqDiv);
                    }

                    UpdateButtons();
                },
                ShowWhat: function(value) {
                    if (value == undefined)
                        _config.showAll = !_config.showAll;
                    else
                        _config.showAll = value;

                    UpdateButtons();
                },
                Initialize: function() {
                    try {
                        if (!MP.Tools.Config.reqlistEnabled || this.Initialized)
                            return;
                        iLog("Initialize", "Called");

                        InitConfig();

                        // This dialog is being reused and so should be created only once!
                        _reqTab = $('#ReqListTab');
                        _reqDiv = $('#ReqListDiv');
                        if (!_reqDiv.length)
                            _reqDiv = $('<div id="ReqListDiv"><div class="toolWrapper"></div></div>');

                        _wrapper = _reqDiv.find(".toolWrapper");
                        _location = _reqDiv;

                        var btns = {
                            'Clear': function() {
                                ReqList.ClearTab();
                            },
                            'Enable': function() {
                                ReqList.Switch();
                            },
                            'Pin': function() {
                                ReqList.Pin();
                            },
                            'Tab View': function() {
                                ReqList.MoveTo();
                            },
                            'Show All': function() {
                                ReqList.ShowWhat();
                            }
                        };
                        _reqDiv.dialog({
                            width: _config.size.width,
                            height: _config.size.height,
                            position: [_config.position.left, _config.position.top],
                            minWidth: 380,
                            minHeight: 200,
                            autoOpen: false,
                            closeOnEscape: false,
                            modal: false,
                            buttons: btns,
                            dialogClass: "aboveSpinner",
                            resizeStart: function() {
                                Global.DisableHighlightingInChrome(true);
                            },
                            resizeStop: function() {
                                Global.DisableHighlightingInChrome(false);
                            },
                            dragStart: function() {
                                Global.DisableHighlightingInChrome(true);
                            },
                            dragStop: function(event, ui) {
                                Global.DisableHighlightingInChrome(false);
                                Global.UpdateLastPosition(_reqDiv, ui);
                            },
                            open: function(event) {
                                UpdateButtons();

                                if (_reqDiv.data('lastLeft') && _reqDiv.data('lastTop')) {
                                    _reqDiv.dialog("option", {
                                        position: [_reqDiv.data('lastLeft'), _reqDiv.data('lastTop')]
                                    });
                                } else {
                                    Global.UpdateLastPosition(_reqDiv);
                                }
                            }
                        });

                        _reqDiv.find('#edReqListFilter')
                            .val(_config.filter)
                            .keypress(function(event) {
                                if (event.which == 13) {
                                    var v = event.target.value;
                                    _config.filter = v;
                                    ReqList.FilterBy(v);
                                };
                            });

                        Clear();

                        this.MoveTo(_config.viewStyle);
                        this.Pin(_config.pinned || false);
                        this.Initialized = true;
                    } catch (err) {
                        iLog("Initialize", err, MP.Types.Log.Error);
                    }
                },
                AutoFilter: function() {
                    var s = $("#edReqListFilter").val();
                    if (s)
                        this.FilterBy(s);
                },
                FilterBy: function(nameList) {
                    try {
                        nameList = Utilities.RemoveWhiteSpaces(nameList);
                        nameList = $.trim(nameList);
                        iLog("FilterBy", "Called: " + nameList);

                        var rows = _reqTable.find("tr td.name").parent();
                        if (!nameList) {
                            rows.show();
                        } else {
                            var arr = nameList.split(" ");
                            for (var r = 0; r < rows.length; r++) {
                                var tr = $(rows[r]);
                                var name = tr.find("td.name").text();
                                var found = name == 'VRM-PG';

                                if (!found) {
                                    $.each(arr, function(idx, itm) {
                                        var re = new RegExp(itm, "i");
                                        if (name.search(re) > -1) {
                                            found = true;
                                            return;
                                        };
                                    });
                                };
                                if (found)
                                    tr.show()
                                else
                                    tr.hide();
                            };
                        };
                    } catch (err) {
                        iLog("FilterBy", err, Log.Type.Error);
                    }
                }
            };

        } catch (err) {
            iLog("Main", err, Log.Type.Error);
        }
    };

    return ReqList;
});