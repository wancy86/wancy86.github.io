// The main object for HTML Controls
var PageHelper = new function() {
    try {
        /* PRIVATE PROPERTIES */
        var logClassName = "PgHelper.",
            lastCompID = 0,
            selected = new Array(),
            eStore = new Storage(),
            copiedHTML = "",
            lastQuestionnaire = "";

        /* PRIVATE METHODS */

        function iLog(Place, Message, Type, Silent) {
            Log.Add(logClassName + Place, Message, Type, Silent);
        }

        function CreateComponent(strRef, compName, noNameCheck) {
            try {
                iLog("CreateComponent", "Called");

                var name = '';
                var fn = controlTypes[strRef];
                var ctrl = new fn();
                if (ctrl == null)
                    throw "A component '" + strRef + "' could not be created!";

                if (ctrl.NameRequired) {
                    if (strRef == "TransferList") {
                        name = compName || Utilities.PromptForName(false);
                        if (name == Utilities.ModalResult.Cancel || name == Utilities.ModalResult.Empty)
                            return false;
                    } else {
                        name = strRef.replace('Editor', '');
                        if (noNameCheck)
                            name = compName || name;
                        else
                            name = PageHelper.MakeUniquePageID(compName || name);
                    }
                }
                ctrl.Create(name);
                ctrl.GetControl()[0][strRef] = ctrl;
                return ctrl;
            } catch (err) {
                iLog("CreateComponent", err, Log.Type.Error);
            }
        }

        function AddEditorToComponent(Component) {
            var ctrl = PageHelper.GetEditorComponent(Component);
            ctrl.EditMode();
            PageHelper.AddStoredComponent(ctrl);

            // Show it if it was designed hidden
            var elm = $(Component);
            if (!elm.is(":visible")) {
                iLog("AddEditorToComponent", "Incompatible element! To hide the element use 'Client Condition' property instead setting its visibility in style!\n" + Utilities.IdentifyChildren(elm), Log.Type.Warning);
                elm.attr("isHidden", true);
                elm.show();
            };

            return ctrl;
        }
        // Removes editor stuff and cleans up component prior save
        function RemoveEditorFromComponent(Component) {
            var ctrl = PageHelper.GetEditorComponent(Component);
            if (!ctrl)
                return;

            var id = PageHelper.GetComponentID(Component)
            eStore.Remove(id);
            ctrl.HighlightAsSelected(false);
            ctrl.HighlightAsFound(false);
            ctrl.DefaultMode();

            var elm = $(Component);

            // Hide it if it was originaly hidden
            if (elm.attr("isHidden")) {
                elm.removeAttr("isHidden");
                elm.hide();
            };

            // Remove all extra class whitespaces
            var s = elm.attr('Class');
            s = Utilities.RemoveWhiteSpaces(s);
            s = Utilities.Trim(s);
            elm.attr("Class", s);

            // Remove extra attributes
            elm.removeAttr("origL");
            elm.removeAttr("origT");
            elm.removeAttr("unselectable");
            elm.removeAttr("aria-disabled");
            if (elm.attr("condition") == "")
                elm.removeAttr("condition");

            elm.removeClass("ui-resizable-autohide");
            elm.removeClass("ui-state-disabled");

            elm.find('.ui-selectee').removeClass("ui-selectee");
        }

        function SetComponentID(Component) {
            try {
                lastCompID += 1;
                iLog("SetComponentID", "ID=" + lastCompID);

                $(Component).attr("EditorID", lastCompID);
            } catch (err) {
                iLog("SetComponentID", err, Log.Type.Error);
            }
        }

        function EnsureSelection() {
            try {
                if (!selected.length) {
                    var ec = ContextMenu.EventComponent;
                    var id = PageHelper.GetComponentID(ec);
                    if (!id)
                        id = PageHelper.GetParentID(ec);
                    PageHelper.AddSelected(id);
                };
            } catch (err) {
                iLog("EnsureSelection", err, Log.Type.Error);
            }
        }

        function MakePastedComponentEditable(element) {
            var s;
            var ctrl = AddEditorToComponent(element);
            if (ctrl.GetID) {
                s = ctrl.GetID();
                s = PageHelper.MakeUniquePageID(s);
                ctrl.SetID(s);
            }
            if (ctrl.GetName) {
                s = ctrl.GetName();
                s = PageHelper.MakeUniquePageID(s);
                ctrl.SetName(s);
            }
            PageHelper.AddSelected(ctrl);

            return ctrl;
        }

        function AddHelpLinkIcon(el, url) {
            var d = $('<div class="mp-help"/>');
            d.appendTo(el);
            d.bind('click', function() {
                var wnd = window.open(url, "helplink", "width=500,height=500,scrollbars=1,resizable=1,toolbar=0,location=0,menubar=0,status=0");
                wnd.focus();
            });
            var ref = el.attr("ref");
            if ($.inArray(ref, ['EditorText', 'EditorMemo', 'EditorDropDown', 'EditorSubmitButton']) > -1) {
                var rightGap = (ref == 'EditorSubmitButton') ? 8 : 2;
                var inp = el.find(':input');
                d.css({
                    top: inp.position().top + inp.outerHeight() / 2 - d.outerHeight() / 2 + 1,
                    left: inp.position().left + inp.outerWidth() + rightGap
                });
            };
            return d;
        }


        return {
            /* PUBLIC METHODS */

            Search: function(str, caseSensitive) {
                try {
                    var arr = eStore.GetItemArray();
                    if (str == "")
                        iLog("Search", "Clearing", Log.Type.Info);
                    else
                        iLog("Search", "Searching " + arr.length + " HTML elements for '" + str + "'", Log.Type.Debug);

                    $.each(arr, function() {
                        if (this.Search)
                            this.Search(str, caseSensitive);
                    });
                } catch (err) {
                    iLog("Search", err, Log.Type.Error);
                }
            },

            ClearStoredComponents: function() {
                try {
                    iLog("ClearStoredComponents", "Called");

                    eStore.Reset();
                    lastCompID = 0;
                } catch (err) {
                    iLog("ClearStoredComponents", err, Log.Type.Error);
                }
            },
            AddStoredComponent: function(Component) {
                try {
                    if (Component) {
                        iLog("AddStoredComponent", "Called");

                        SetComponentID(Component.GetControl());
                        eStore.AddComponent(Component, lastCompID);
                    }
                } catch (err) {
                    iLog("AddStoredComponent", err, Log.Type.Error);
                }
            },
            GetStoredComponent: function(id) {
                try {
                    return eStore.GetComponent(id);
                } catch (err) {
                    iLog("GetStoredComponent", err, Log.Type.Error);
                }
            },

            CreateEditorComponent: function(strRef, compName, noNameCheck) {
                try {
                    if (!strRef)
                        throw "No reference!";
                    iLog("CreateEditorComponent", "Called");

                    var ctrl = CreateComponent(strRef, compName, noNameCheck);
                    PageHelper.AddStoredComponent(ctrl);

                    return ctrl;
                } catch (err) {
                    iLog("CreateEditorComponent", err, Log.Type.Error);
                }
            },
            // Deletes an element from the screen and removes it from storage
            DeleteEditorComponent: function(Component) {
                try {
                    var id = PageHelper.GetComponentID(Component);
                    if (id) {
                        iLog("DeleteEditorComponent", "Called");

                        eStore.Remove(id);
                        $(Component).remove();
                    }
                } catch (err) {
                    iLog("DeleteEditorComponent", err, Log.Type.Error);
                }
            },
            // returns object for the control
            GetEditorComponent: function(Component) {
                try {
                    var ref = PageHelper.GetComponentRef(Component);
                    if (!ref)
                        throw 'Missing ref attribute!';
                    var ctrl = null;
                    var temp = $(Component)[0];
                    try {
                        ctrl = temp[ref];
                        if (!ctrl)
                            throw 'Error!';
                        return ctrl;
                    } catch (err) {
                        var fn = controlTypes[ref];
                        if (!fn)
                            throw 'The control of type "' + ref + '" not initialized!';
                        ctrl = new fn();
                        ctrl.Load(Component);
                        temp[ref] = ctrl;
                        return ctrl;
                    }
                } catch (err) {
                    iLog("GetEditorComponent", err.message || err + " " + Utilities.IdentifyChildren(Component), Log.Type.Error);
                }
            },
            MakeUniquePageID: function(Name, MaxOcurrences) {
                if (!Name)
                    return '';

                var pref = Name.replace(/\d+$/, '');
                var s = pref;
                var max = MaxOcurrences || 0;
                var cnt, i = 0;

                while (true) {
                    cnt = $('#' + s, '#rightColumn').length;
                    if (cnt <= max)
                        break;
                    i++;
                    s = pref + i.toString();
                }
                return s;
            },
            GetParentRef: function(Component) {
                try {
                    var p = $(Component)[0].parentNode;
                    var ref = PageHelper.GetComponentRef(p);
                    return ref;
                } catch (err) {
                    iLog("GetParentRef", err, Log.Type.Error);
                }
            },
            GetParentID: function(Component) {
                try {
                    var p = $(Component)[0].parentNode;
                    var id = PageHelper.GetComponentID(p);
                    return id;
                } catch (err) {
                    iLog("GetParentID", err, Log.Type.Error);
                }
            },
            GetParentCtrl: function(Component) {
                try {
                    var p = $(Component)[0].parentNode;
                    var ctrl = PageHelper.GetComponentCtrl(p);
                    return ctrl;
                } catch (err) {
                    iLog("GetParentCtrl", err, Log.Type.Error);
                }
            },
            GetComponentRef: function(Component) {
                try {
                    return $(Component).attr("ref");
                } catch (err) {
                    iLog("GetComponentRef", err, Log.Type.Error);
                }
            },
            GetComponentID: function(Component) {
                try {
                    return $(Component).attr("EditorID");
                } catch (err) {
                    iLog("GetComponentID", err, Log.Type.Error);
                }
            },
            GetComponentCtrl: function(Component) {
                try {
                    return PageHelper.GetEditorComponent(Component);
                } catch (err) {
                    iLog("GetComponentCtrl", err, Log.Type.Error);
                }
            },
            RemoveComponentID: function(Component) {
                try {
                    var id = PageHelper.GetComponentID(Component);
                    if (id) {
                        iLog("RemoveComponentID", "ID=" + id);

                        $(Component).removeAttr("EditorID");
                    }
                } catch (err) {
                    iLog("RemoveComponentID", err, Log.Type.Error);
                }
            },

            IsSelected: function(id) {
                return (id && $.inArray(id, selected) > -1);
            },
            GetSelected: function() {
                return selected;
            },
            AddSelected: function(id) {
                if (!id)
                    return;
                if (Utilities.IsObject(id)) {
                    var ctrl = id;
                    id = PageHelper.GetComponentID(ctrl.GetControl());
                } else {
                    var ctrl = PageHelper.GetStoredComponent(id);
                }
                if (PageHelper.IsSelected(id))
                    return;

                if (ctrl && ctrl.HighlightAsSelected) {
                    ctrl.HighlightAsSelected(true);
                    selected.push(id);
                }
            },
            SelectAll: function() {
                try {
                    iLog("SelectAll", "Called");

                    PageHelper.ClearSelected();
                    var ec = ContextMenu.EventComponent;
                    var pRef = PageHelper.GetComponentRef(ec);
                    if ($.inArray(pRef, ['StaticContainer']) == -1)
                        return;
                    var pID = PageHelper.GetComponentID(ec);
                    if (!pID)
                        return;

                    var arr = eStore.GetItemArray();
                    for (var i = 0; i < arr.length; i++) {
                        var obj = arr[i];
                        var ctrl = obj.GetControl();
                        var cID = PageHelper.GetParentID(ctrl);
                        var cRef = PageHelper.GetComponentRef(ctrl);
                        if (cID == pID && !cRef.match(/Container/))
                            PageHelper.AddSelected(obj);
                    };
                } catch (err) {
                    iLog("SelectAll", err, Log.Type.Error);
                }
            },
            SelectBelow: function() {
                try {
                    iLog("SelectBelow", "Called");

                    PageHelper.ClearSelected();
                    var y = ContextMenu.OffsetY - 30;
                    var ec = ContextMenu.EventComponent;
                    var pRef = PageHelper.GetComponentRef(ec);
                    if ($.inArray(pRef, ['StaticContainer']) == -1)
                        return;
                    var pID = PageHelper.GetComponentID(ec);
                    if (!pID)
                        return;

                    var arr = eStore.GetItemArray();
                    for (var i = 0; i < arr.length; i++) {
                        var obj = arr[i];
                        var ctrl = obj.GetControl();
                        var cID = PageHelper.GetParentID(ctrl);
                        var cRef = PageHelper.GetComponentRef(ctrl);
                        if (cID == pID && !cRef.match(/Container/) && obj.GetTop && obj.GetTop() > y)
                            PageHelper.AddSelected(obj);
                    };
                } catch (err) {
                    iLog("SelectBelow", err, Log.Type.Error);
                }
            },
            ClearSelected: function() {
                try {
                    iLog("ClearSelected", "Called");

                    for (var i = 0; i < selected.length; i++) {
                        var ctrl = PageHelper.GetStoredComponent(selected[i]);
                        if (ctrl && ctrl.HighlightAsSelected)
                            ctrl.HighlightAsSelected(false);
                    };
                    selected = null;
                    selected = [];
                } catch (err) {
                    iLog("ClearSelected", err, Log.Type.Error);
                }
            },

            SnapToGrid: function() {
                try {
                    iLog("SnapToGrid", "Called");

                    EnsureSelection();
                    var snap = MP.Tools.Config.Editor.html.snap;
                    for (var i = 0; i < selected.length; i++) {
                        var ctrl = PageHelper.GetStoredComponent(selected[i]);
                        if (!ctrl)
                            continue;

                        var x = ctrl.GetLeft();
                        x = Utilities.SnapTo(x, snap[0]);
                        ctrl.SetLeft(x);

                        var y = ctrl.GetTop();
                        y = Utilities.SnapTo(y, snap[1]);
                        ctrl.SetTop(y);
                    }
                } catch (err) {
                    iLog("SnapToGrid", err, Log.Type.Error);
                }
            },
            AlignLeft: function() {
                try {
                    iLog("AlignLeft", "Called");

                    EnsureSelection();
                    var i, ctrl, x, minX = 9999999;
                    for (i = 0; i < selected.length; i++) {
                        ctrl = PageHelper.GetStoredComponent(selected[i]);
                        if (ctrl) {
                            x = ctrl.GetLeft();
                            minX = x < minX ? x : minX;
                        };
                    };

                    var snap = MP.Tools.Config.Editor.html.snap;
                    minX = Utilities.SnapTo(minX, snap[0]);
                    for (i = 0; i < selected.length; i++) {
                        ctrl = PageHelper.GetStoredComponent(selected[i]);
                        if (ctrl)
                            ctrl.SetLeft(minX);
                    }
                } catch (err) {
                    iLog("AlignLeft", err, Log.Type.Error);
                }
            },
            AlignRight: function() {
                try {
                    iLog("AlignRight", "Called");

                    EnsureSelection();
                    var i, ctrl, div, w, x, maxX = 0;
                    for (i = 0; i < selected.length; i++) {
                        ctrl = PageHelper.GetStoredComponent(selected[i]);
                        if (ctrl) {
                            div = ctrl.GetControl();
                            w = div.width();
                            x = ctrl.GetLeft() + w;
                            maxX = x > maxX ? x : maxX;
                        };
                    };

                    var snap = MP.Tools.Config.Editor.html.snap;
                    maxX = Utilities.SnapTo(maxX, snap[0]);
                    for (i = 0; i < selected.length; i++) {
                        ctrl = PageHelper.GetStoredComponent(selected[i]);
                        if (ctrl) {
                            div = ctrl.GetControl();
                            w = div.width();
                            ctrl.SetLeft(maxX - w);
                        }
                    }
                } catch (err) {
                    iLog("AlignRight", err, Log.Type.Error);
                }
            },
            AlignTop: function() {
                try {
                    iLog("AlignTop", "Called");

                    EnsureSelection();
                    var i, ctrl, y, minY = 9999999;
                    for (i = 0; i < selected.length; i++) {
                        ctrl = PageHelper.GetStoredComponent(selected[i]);
                        if (ctrl) {
                            y = ctrl.GetTop();
                            minY = y < minY ? y : minY;
                        };
                    };

                    var snap = MP.Tools.Config.Editor.html.snap;
                    minY = Utilities.SnapTo(minY, snap[1]);
                    for (i = 0; i < selected.length; i++) {
                        ctrl = PageHelper.GetStoredComponent(selected[i]);
                        if (ctrl)
                            ctrl.SetTop(minY);
                    }
                } catch (err) {
                    iLog("AlignTop", err, Log.Type.Error);
                }
            },
            SpaceVertically: function() {
                try {
                    iLog("SpaceVertically", "Called");

                    EnsureSelection();
                    jPrompt('Please enter a vertical spacing between tops of the selected components', 40, 'Space Vertically', function(v) {
                        if (v == null)
                            return;

                        var i, ctrl, arr = [];
                        for (i = 0; i < selected.length; i++) {
                            ctrl = PageHelper.GetStoredComponent(selected[i]);
                            if (ctrl)
                                arr.push(ctrl);
                        }

                        arr.sort(function(a, b) {
                            return (b.GetTop() < a.GetTop());
                        });

                        var px = Utilities.ToNumber(v);
                        var newTop, lastTop, currTop;
                        for (i = 0; i < arr.length; i++) {
                            ctrl = arr[i];

                            currTop = ctrl.GetTop();
                            if (i == 0) {
                                newTop = currTop;
                                lastTop = currTop;
                            } else {
                                if (lastTop != currTop) {
                                    newTop = newTop + px;
                                    lastTop = currTop;
                                }
                            }
                            ctrl.SetTop(newTop);
                        };
                    });
                } catch (err) {
                    iLog("SpaceVertically", err, Log.Type.Error);
                }
            },
            SpaceHorizontally: function() {
                try {
                    iLog("SpaceHorizontally", "Called");

                    EnsureSelection();
                    jPrompt('Please enter a horizontal spacing between left sides of the selected components', 100, 'Space Horizontally', function(v) {
                        if (v == null)
                            return;

                        var i, ctrl, arr = [];
                        for (i = 0; i < selected.length; i++) {
                            ctrl = PageHelper.GetStoredComponent(selected[i]);
                            if (ctrl)
                                arr.push(ctrl);
                        }

                        arr.sort(function(a, b) {
                            return (b.GetLeft() < a.GetLeft());
                        });

                        var px = Utilities.ToNumber(v);
                        var newLeft, lastLeft, currLeft;
                        for (i = 0; i < arr.length; i++) {
                            ctrl = arr[i];

                            currLeft = ctrl.GetLeft();
                            if (i == 0) {
                                newLeft = currLeft;
                                lastLeft = currLeft;
                            } else {
                                if (lastLeft != currLeft) {
                                    newLeft = newLeft + px;
                                    lastLeft = currLeft;
                                }
                            }
                            ctrl.SetLeft(newLeft);
                        };
                    });
                } catch (err) {
                    iLog("SpaceHorizontally", err, Log.Type.Error);
                }
            },
            Duplicate: function() {
                try {
                    iLog("Duplicate", "Called");

                    PageHelper.ClearSelected();
                    EnsureSelection();

                    jPrompt('Please enter how many copies and their vertical spacing', '5, 20', 'Duplicate Component', function(v) {
                        if (v == null)
                            return;

                        var arr = v.split(','),
                            count = (arr.length > 0) ? parseInt(arr[0]) : 0,
                            space = (arr.length > 1) ? parseInt(arr[1]) : 0;

                        if (!count)
                            return;

                        space = space || 20;
                        var ctrl = PageHelper.GetStoredComponent(selected[0]),
                            y = ctrl.GetTop(),
                            html = PageHelper.GetHtmlOfSelectedComponents(false),
                            div = ctrl.GetControl(),
                            cont = PageHelper.GetParentCtrl(div),
                            ref = PageHelper.GetParentRef(div);

                        for (var i = 0; i < count; i++) {
                            var c = PageHelper.AddComponentFromHtmlString(html, cont);

                            // Set position of all static container's direct children
                            if (ref == "StaticContainer") {
                                y += space;
                                c.SetTop(y);
                            } else {
                                var d = c.GetControl();
                                d.css('position', 'relative')
                                    .css('left', '')
                                    .css('top', '')
                                    .css('width', '');
                                ctrl.Refresh();
                            };
                        }
                    });
                } catch (err) {
                    iLog("Duplicate", err, Log.Type.Error);
                }
            },
            Questionnaire: function() {
                try {
                    iLog("Questionnaire", "Called");

                    var container = ContextMenu.EventComponent,
                        ref = PageHelper.GetComponentRef(container);
                    if (ref != "StaticContainer") {
                        jAlert("Questionnaires may be built only in body of static containers!");
                        return;
                    };

                    // This dialog removes itself from DOM after close!
                    var dlg = $('<div id="QuestionnaireDlg"><label>Question = Name:</label><br><textarea id="data"/><p></p></div>');
                    var p = $('p', dlg)
                    p.append('Width <input id="width" value="500" style="width: 50px"/> ');
                    p.append('Spacing <input id="spacing" value="25" style="width: 50px"/> ');
                    p.append('Fill <input id="fill" value=" ." style="width: 50px"/> ');
                    var taData = $('#data', dlg);
                    var btns = {
                        'Build': function(e) {
                            lastQuestionnaire = taData.val();
                            var lines = lastQuestionnaire.split('\n'),
                                width = Utilities.ToNumber($('#width', dlg).val()) || 500,
                                spacing = Utilities.ToNumber($('#spacing', dlg).val()) || 25,
                                fill = $('#fill', dlg).val(),
                                snap = MP.Tools.Config.Editor.html.snap,
                                x = Utilities.SnapTo(ContextMenu.OffsetX, snap[0]),
                                y = Utilities.SnapTo(ContextMenu.OffsetY, snap[1]);

                            $.each(lines, function(i, line) {
                                var i = line.search(/=[^=]*$/);
                                if (i < 0)
                                    return;
                                var question = line.substring(0, i).trim(),
                                    name = line.substring(i + 1).trim(),
                                    elm;

                                elm = PageHelper.CreateEditorComponent("EditorLabel", "");
                                elm.AppendTo(container);
                                elm.SetLeft(x);
                                elm.SetTop(y);
                                elm.SetCaption(question);

                                if (fill) {
                                    var ctrl = elm.GetControl();
                                    while (ctrl.width() < width) {
                                        question = question + fill;
                                        elm.SetCaption(question);
                                    };
                                };

                                elm = PageHelper.CreateEditorComponent("EditorRadio", name, true);
                                elm.AppendTo(container);
                                elm.SetLeft(x + width + 20);
                                elm.SetTop(y);
                                elm.SetCaption('Yes');

                                elm = PageHelper.CreateEditorComponent("EditorRadio", name, true);
                                elm.AppendTo(container);
                                elm.SetLeft(x + width + 70);
                                elm.SetTop(y);
                                elm.SetCaption('No');
                                elm.SetValue('0');

                                y += spacing;
                            });

                            dlg.dialog("close");
                        },
                        'Load Last': function(e) {
                            taData.val(lastQuestionnaire);
                            taData.focus();
                        }
                    };
                    var ResizeMemo = function() {
                        var h = dlg.height();
                        taData.height(h - 60);
                    };

                    dlg.dialog({
                        width: 500,
                        height: 400,
                        autoOpen: false,
                        closeOnEscape: true,
                        modal: true,
                        buttons: btns,
                        title: "Build Questionnaire",
                        resizeStart: function() {
                            Global.DisableHighlightingInChrome(true);
                        },
                        resizeStop: function() {
                            Global.DisableHighlightingInChrome(false);
                            ResizeMemo();
                        },
                        dragStart: function() {
                            Global.DisableHighlightingInChrome(true);
                        },
                        dragStop: function() {
                            Global.DisableHighlightingInChrome(false);
                        },
                        close: function() {
                            dlg.remove();
                        },
                        open: function() {
                            taData.focus();
                            ResizeMemo();
                        }
                    });
                    dlg.dialog("open");
                } catch (err) {
                    iLog("Questionnaire", err, Log.Type.Error);
                }
            },
            SortTabIndex: function() {
                try {
                    iLog("SortTabIndex", "Called");

                    EnsureSelection();
                    jPrompt('Please enter an initial Tab Index value', 1, 'SortTabIndex', function(v) {
                        if (v == null)
                            return;

                        var i, ctrl, arr = [];
                        for (i = 0; i < selected.length; i++) {
                            ctrl = PageHelper.GetStoredComponent(selected[i]);
                            if (ctrl)
                                arr.push(ctrl);
                        }
                        arr.sort(function(a, b) {
                            var a = a.GetTop() + '.' + a.GetLeft();
                            var b = b.GetTop() + '.' + b.GetLeft();
                            a = parseFloat(a);
                            b = parseFloat(b);
                            return (b < a);
                        });

                        var idx = Utilities.ToNumber(v);
                        for (i = 0; i < arr.length; i++) {
                            ctrl = arr[i];
                            ctrl.SetTabIndex(idx);
                            idx++;
                        };
                    });
                } catch (err) {
                    iLog("SortTabIndex", err, Log.Type.Error);
                }
            },
            SetProperty: function(methodName, displayValue, description) {
                try {
                    iLog("SetProperty", methodName);

                    EnsureSelection();
                    jPrompt('Please enter a value for ' + description, displayValue, methodName, function(v) {
                        if (v == null)
                            return;
                        if (Utilities.IsNumber(displayValue))
                            v = Utilities.ToNumber(v);

                        for (var i = 0; i < selected.length; i++) {
                            var ctrl = PageHelper.GetStoredComponent(selected[i]);
                            if (ctrl && ctrl[methodName]) {
                                if ($.inArray(methodName, ['SetID', 'SetName']) > -1)
                                    v = PageHelper.MakeUniquePageID(v);

                                ctrl[methodName](v);
                            }
                        }
                    });
                } catch (err) {
                    iLog("SetProperty", err, Log.Type.Error);
                }
            },
            MakeContextMenu: function() {
                try {
                    var m = new ContextMenuItems();
                    var i;

                    i = m.Add("Copy >");
                    m.Add("To Browser", function() { PageHelper.CopyToBrowser(false); }, i);
                    if (Browser.IsMSIE())
                        m.Add("To Clipboard", function() { PageHelper.CopyToClipboard(false); }, i);
                    m.Add("To Text Area", function() { PageHelper.CopyToTextarea(false); }, i);

                    i = m.Add("Cut >");
                    m.Add("To Browser", function() { PageHelper.CopyToBrowser(true); }, i);
                    if (Browser.IsMSIE())
                        m.Add("To Clipboard", function() { PageHelper.CopyToClipboard(true); }, i);
                    m.Add("To Text Area", function() { PageHelper.CopyToTextarea(true); }, i);

                    i = m.Add("Paste >");
                    m.Add("From Browser", function() { PageHelper.PasteFromBrowser(); }, i);
                    if (Browser.IsMSIE())
                        m.Add("From Clipboard", function() { PageHelper.PasteFromClipboard(); }, i);
                    m.Add("From Text Area", function() { PageHelper.PasteFromTextarea(); }, i);

                    i = m.Add("Select >");
                    m.Add("All", function() { PageHelper.SelectAll(); }, i);
                    m.Add("Below", function() { PageHelper.SelectBelow(); }, i);

                    i = m.Add("Component >");
                    m.Add("Delete", function() { PageHelper.DeleteSelection(); }, i);
                    m.Add("HTML", function() { PageHelper.EditHTML(); }, i);
                    m.Add("Duplicate", function() { PageHelper.Duplicate(); }, i);
                    m.Add("Questionnaire", function() { PageHelper.Questionnaire(); }, i);

                    i = m.Add("Position >");
                    m.Add("Snap to Grid", function() { PageHelper.SnapToGrid(); }, i);
                    m.Add("Align Left", function() { PageHelper.AlignLeft(); }, i);
                    m.Add("Align Top", function() { PageHelper.AlignTop(); }, i);
                    m.Add("Align Right", function() { PageHelper.AlignRight(); }, i);
                    m.Add("Set Left", function() { PageHelper.SetProperty("SetLeft", 10, "Left"); }, i);
                    m.Add("Set Top", function() { PageHelper.SetProperty("SetTop", 10, "Top"); }, i);
                    m.Add("Space Vertically", function() { PageHelper.SpaceVertically(); }, i);
                    m.Add("Space Horizontally", function() { PageHelper.SpaceHorizontally(); }, i);
                    m.Add("Sort Tab Index", function() { PageHelper.SortTabIndex(); }, i);

                    i = m.Add("Property >");
                    m.Add("Required", function() { PageHelper.SetProperty("SetRequired", true, "Required"); }, i);
                    m.Add("Width", function() { PageHelper.SetProperty("SetWidth", 100, "Width"); }, i);
                    m.Add("Height", function() { PageHelper.SetProperty("SetHeight", 50, "Height"); }, i);
                    m.Add("Caption", function() { PageHelper.SetProperty("SetCaption", "", "Caption"); }, i);
                    m.Add("Tooltip", function() { PageHelper.SetProperty("SetTooltip", "Please enter a...", "Tooltip"); }, i);
                    m.Add("Server Cond.", function() { PageHelper.SetProperty("SetSvrCondition", "", "Server Condition"); }, i);
                    m.Add("Client Cond.", function() { PageHelper.SetProperty("SetCliCondition", "", "Client Condition"); }, i);
                    m.Add("Tab Index", function() { PageHelper.SetProperty("SetTabIndex", 1, "Tab Index"); }, i);
                    m.Add("Name", function() { PageHelper.SetProperty("SetName", "Component1", "Name"); }, i);
                    m.Add("ID", function() { PageHelper.SetProperty("SetID", "Component1", "ID"); }, i);
                    m.Add("Valueless Attr.", function() { PageHelper.SetProperty("SetValueLessAttrs", "", "Valueless Attributes"); }, i);
                    m.Add("Style", function() { PageHelper.SetProperty("SetStyle", "", "Style"); }, i);
                    m.Add("Class", function() { PageHelper.SetProperty("SetClass", "Default", "Class"); }, i);
                    m.Add("Value", function() { PageHelper.SetProperty("SetValue", "1", "Value"); }, i);
                    m.Add("Size", function() { PageHelper.SetProperty("SetSize", "", "Size"); }, i);
                    m.Add("Help Link", function() { PageHelper.SetProperty("SetHelpLink", "../../help.html", "Size"); }, i);
                    m.Add("Options", function() { PageHelper.SetProperty("SetOptions", "<option value='1'>Text</option>", "Options"); }, i);
                    m.Add("Multi Select", function() { PageHelper.SetProperty("SetMultiSelect", true, "Multi Select"); }, i);
                    m.Add("Target", function() { PageHelper.SetProperty("SetTarget", "Communication.LinkRequest();", "Target"); }, i);
                    m.Add("Flipped", function() { PageHelper.SetProperty("SetFlipped", true, "Flipped"); }, i);

                    i = m.Add("Search >");
                    m.Add("Search...", function() { Editor.Search(); }, i);
                    m.Add("Clear", function() { Editor.ClearSearch(); }, i);

                    i = m.Add("File >");
                    if (Editor.Enabled && !Editor.LockedBy) {
                        m.Add("Quick Save", function() { PropertyEd.QuickSave(); }, i);
                        m.Add("Save & Exit", function() { PropertyEd.Save(); }, i);
                    };
                    m.Add("Exit...", function() { PropertyEd.Disable(); }, i);

                    return m.GetHTML();
                } catch (err) {
                    iLog("MakeContextMenu", err, Log.Type.Error);
                }
            },
            CopyToBrowser: function(doCut) {
                try {
                    iLog("CopyToBrowser", "Called");

                    copiedHTML = PageHelper.GetHtmlOfSelectedComponents(doCut);
                } catch (err) {
                    iLog("CopyToBrowser", err, Log.Type.Error);
                }
            },
            PasteFromBrowser: function() {
                try {
                    iLog("PasteFromBrowser", "Called");

                    PageHelper.AddComponentsFromHtmlString(copiedHTML);
                } catch (err) {
                    iLog("PasteFromBrowser", err, Log.Type.Error);
                }
            },
            CopyToClipboard: function(doCut) {
                try {
                    iLog("CopyToClipboard", "Called");

                    copiedHTML = PageHelper.GetHtmlOfSelectedComponents(doCut);
                    Global.SetClipboard(copiedHTML);
                } catch (err) {
                    iLog("CopyToClipboard", err, Log.Type.Error);
                }
            },
            PasteFromClipboard: function() {
                try {
                    iLog("PasteFromClipboard", "Called");

                    var s = Global.GetClipboard();
                    PageHelper.AddComponentsFromHtmlString(s);
                } catch (err) {
                    iLog("PasteFromClipboard", err, Log.Type.Error);
                }
            },
            CopyToTextarea: function(doCut) {
                try {
                    iLog("CopyToTextarea", "Called");

                    copiedHTML = PageHelper.GetHtmlOfSelectedComponents(doCut);
                    Editor.ShowTextareaForm(copiedHTML);
                } catch (err) {
                    iLog("CopyToTextarea", err, Log.Type.Error);
                }
            },
            PasteFromTextarea: function() {
                try {
                    iLog("PasteFromTextarea", "Called");

                    Editor.ShowTextareaForm('', function(s) {
                        PageHelper.AddComponentsFromHtmlString(s);
                    });
                } catch (err) {
                    iLog("PasteFromTextarea", err, Log.Type.Error);
                }
            },
            DeleteSelection: function() {
                try {
                    iLog("DeleteSelection", "Called");

                    EnsureSelection();
                    Editor.HideProperties();
                    for (var i = 0; i < selected.length; i++) {
                        var ctrl = PageHelper.GetStoredComponent(selected[i]);
                        if (ctrl) {
                            var div = ctrl.GetControl();
                            var ref = PageHelper.GetComponentRef(div);

                            // Do not allow delete the main container!
                            if ($.inArray(ref, ['EditableContent']) > -1)
                                continue;

                            if ($.inArray(ref, ["ScriptingContainer", "StaticContainer", "DynamicContainer"]) == -1) {
                                PageHelper.DeleteEditorComponent(div);
                                continue;
                            };

                            // Warn prior deleting a container
                            jConfirm('You are about to delete an entire container!\nAre you sure?', 'Confirm Delete', function(answer) {
                                if (answer) {
                                    PageHelper.DeleteEditorComponent(div);
                                };
                            });
                        };
                    };
                    PageHelper.ClearSelected();
                } catch (err) {
                    iLog("DeleteSelection", err, Log.Type.Error);
                }
            },
            EditHTML: function() {
                try {
                    iLog("EditHTML", "Called");

                    this.ClearSelected();

                    var h1 = PageHelper.GetHtmlOfSelectedComponents(false);
                    if (!h1)
                        return;

                    EnsureSelection();
                    Editor.ShowAceEditorForm(h1, "HTML Editor", "WARNING: Not following editor API may corrupt the page or the editor!", function(h2) {
                        var id = PageHelper.GetSelected()[0];
                        var ctrl = PageHelper.GetStoredComponent(id);
                        var elm = ctrl.GetControl();
                        var par = PageHelper.GetParentRef(elm);
                        if ($.inArray(par, ['EditableContent', "DynamicContainer"]) > -1) {
                            elm.after(h2);
                        } else {
                            par = PageHelper.GetParentCtrl(elm);
                            par = par.GetControl();
                            par.append(h2);
                        }
                        PageHelper.ClearSelected();
                        PageHelper.DeleteEditorComponent(elm);
                        PageHelper.ConvertDefaultToEditorComponents();
                    });
                } catch (err) {
                    iLog("EditHTML", err, Log.Type.Error);
                }
            },
            ConvertDefaultToEditorComponents: function(includeSelf, div) {
                div = div || $("#rightColumn");

                $(".component", div).each(function() {
                    try {
                        var id = PageHelper.GetComponentID(this);
                        if (!id)
                            AddEditorToComponent(this);
                    } catch (err) {
                        iLog("ConvertDefaultToEditorComponents", err, Log.Type.Error, true);
                    }
                });
                if (includeSelf)
                    AddEditorToComponent(div);
            },
            ConvertEditorToDefaultComponents: function(includeSelf, div) {
                div = div || $("#rightColumn");

                $(".component", div).each(function() {
                    try {
                        RemoveEditorFromComponent(this);
                    } catch (err) {
                        iLog("ConvertEditorToDefaultComponents", err, Log.Type.Error, true);
                    }
                });
                if (includeSelf)
                    RemoveEditorFromComponent(div);
            },
            AddComponentFromHtmlString: function(htmlStr, parentCont) {
                try {
                    if (!htmlStr)
                        return;

                    var div = (parentCont.GetControl) ? parentCont.GetControl() : parentCont;
                    PageHelper.ClearSelected();
                    var elm = $(htmlStr);
                    elm.appendTo(div);
                    var ctrl = MakePastedComponentEditable(elm);
                    elm.find('.component').each(function() {
                        MakePastedComponentEditable(this);
                    });

                    return ctrl;
                } catch (err) {
                    iLog("AddComponentsFromHtmlString", err, Log.Type.Error);
                }
            },
            AddComponentsFromHtmlString: function(htmlStr) {
                try {
                    if (!htmlStr)
                        return;
                    var ec = ContextMenu.EventComponent;
                    var ref = PageHelper.GetComponentRef(ec);
                    if ($.inArray(ref, ["EditableContent", "StaticContainer", "DynamicContainer"]) == -1)
                        return;

                    PageHelper.ClearSelected();
                    copiedHTML = htmlStr;
                    var items = $(htmlStr);
                    var minX = 9999999,
                        minY = 9999999;
                    var arr = [];
                    items.each(function(i, item) {
                        var elm = $(items[i]);
                        var s = elm.html();
                        if (!s)
                            return;

                        elm.appendTo(ec);
                        var ctrl = MakePastedComponentEditable(elm);
                        elm.find('.component').each(function() {
                            MakePastedComponentEditable(this);
                        });

                        // Find the left/top most position
                        var x = ctrl.GetLeft();
                        minX = x < minX ? x : minX;
                        var y = ctrl.GetTop();
                        minY = y < minY ? y : minY;

                        arr.push(ctrl);
                    });

                    // Set position of all static container's direct children
                    for (var i = 0; i < arr.length; i++) {
                        var ctrl = arr[i];

                        if (ref == "StaticContainer") {
                            var snap = MP.Tools.Config.Editor.html.snap;
                            var x = ctrl.GetLeft() - minX + ContextMenu.OffsetX - 5;
                            var y = ctrl.GetTop() - minY + ContextMenu.OffsetY - 25;
                            ctrl.SetLeft(Utilities.SnapTo(x, snap[0]));
                            ctrl.SetTop(Utilities.SnapTo(y, snap[1]));
                        } else {
                            var div = ctrl.GetControl();
                            div.css('position', 'relative')
                                .css('left', '')
                                .css('top', '')
                                .css('width', '');
                            ctrl.Refresh();
                        };
                    };

                    return arr;
                } catch (err) {
                    iLog("AddComponentsFromHtmlString", err, Log.Type.Error);
                }
            },
            GetHtmlOfSelectedComponents: function(doCut) {
                try {
                    var copiedHTML = "";

                    EnsureSelection();
                    for (var i = 0; i < selected.length; i++) {
                        var ctrl = PageHelper.GetStoredComponent(selected[i]);
                        if (ctrl) {
                            var div = ctrl.GetControl();
                            var ref = PageHelper.GetComponentRef(div);

                            // Skip the main container!
                            if ($.inArray(ref, ['EditableContent']) > -1)
                                continue;

                            // Remove editor
                            PageHelper.ConvertEditorToDefaultComponents(true, div);
                            copiedHTML += div.formOuterHTML();

                            // Delete or return editor
                            if (doCut)
                                div.remove();
                            else
                                PageHelper.ConvertDefaultToEditorComponents();
                        };
                    };
                    PageHelper.ClearSelected();

                    copiedHTML = PageHelper.CleanVRM(copiedHTML);
                    return copiedHTML;
                } catch (err) {
                    iLog("GetHtmlOfSelectedComponents", err, Log.Type.Error);
                }
            },
            // Check for missing tooltips
            FindFieldsWithNoTooltips: function() {
                iLog("FindFieldsWithNoTooltips", "Called");

                var arr = [];
                $('input, textarea', $('#rightColumn')).each(function() {
                    if ($.trim($(this).attr('title')) == "") {
                        arr.push($(this).attr('id') + " - " + $(this).attr('type'));
                    }
                });
                return arr;
            },
            // To clean or othervice manipulate a raw VRM data prior send to SR
            CleanVRM: function(data) {
                try {
                    iLog("CleanVRM", "Called");

                    data = data.replace(/done[0-9]{1,}=\"[0-9]{1,}\"\s{0,}/g, "");
                    data = data.replace(/targetlink2onclick/g, "onclick");

                    return data;
                } catch (err) {
                    iLog("CleanVRM", err, Log.Type.Error);
                }
            },
            AddHelpLink: function(ctrl) {
                var el = ctrl.GetControl(),
                    url = ctrl.GetHelpLink();

                // does element have a help URL
                if (!url)
                    return;

                var FadeIn = function() {
                    el.data('MouseIn', true);

                    // skip if icon already shown
                    var d = $('div.mp-help', el);
                    if (d.length)
                        return;

                    d = AddHelpLinkIcon(el, url);
                    d.bind('mouseenter', function() {
                        el.data('MouseIn', true);
                    });
                    d.bind('mouseleave', function() {
                        el.data('MouseIn', false);
                    });
                    d.fadeIn(500);
                };
                var FadeOut = function() {
                    // skip if icon not shown
                    var d = $('div.mp-help', el);
                    if (!d.length)
                        return;

                    // do not remove icon from focused elements
                    if (el.find('input,textarea,select').is(":focus"))
                        return;

                    // remove the icon
                    el.data('MouseIn', false);
                    setTimeout(function() {
                        if (!el.data('MouseIn')) {
                            d.fadeOut(500, function() {
                                d.remove();
                            });
                        };
                    }, 500);
                };

                if (Global.FadingHelpLinks) {
                    el.bind("mouseenter", FadeIn);
                    el.bind("focusin", FadeIn);
                    el.bind("mouseleave", FadeOut);
                    el.bind("focusout", FadeOut);

                } else {
                    // skip if icon already shown
                    var d = $('div.mp-help', el);
                    if (d.length)
                        return;

                    d = AddHelpLinkIcon(el, url);
                    d.show();
                };
            }
        };

    } catch (err) {
        iLog("Main", err, Log.Type.Error);
    }
};