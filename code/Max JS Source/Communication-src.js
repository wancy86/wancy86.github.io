/*
This script provides communication between the server and client
 */
define('Communication', ['ValidatorContainer', 'jQuery', 'Utilities', 'PageHelper', 'Editor', 'ReqList'],
    function(Validator, $, Utilities, PageHelper, Editor, ReqList) {
        var Communication = new function() {
            try {
                /* PRIVATE PROPERTIES */
                var logClassName = "Comm.",
                    working = false, // if ajax is currently working on a request
                    vrmEdit = null, // the VRM xml document
                    _vrmSave = null, // a copy of the vrm file attempting to save, used to prevent loss in case of save failure
                    boolNotifiedTimeout = false, // used for session expiration
                    self = this,
                    lastDebug = "";

                /* PRIVATE METHODS */

                function iLog(Place, Message, Type, Silent) {
                    Log.Add(logClassName + Place, Message, Type, Silent);
                }

                function Request() {
                    try {
                        this.isLastRequest = false;
                        this.template = "";
                        this.cache = false;
                        this.method = "POST";
                        this.data = null;
                        this.id = "";
                        this.host = "../../";
                        this.onSuccess = null;
                        this.onError = null;
                        this.timeout = 180000;
                        this.dataType = "xml";
                        this.url = null;
                        this.requestType = "";
                    } catch (err) {
                        iLog("Request", err, Log.Type.Error);
                    }
                }

                function GetSessionFromUrl(url) {
                    var s = url.toLowerCase();
                    var i = s.indexOf("?id=");
                    if (i < 0)
                        i = s.indexOf("&id=");
                    if (i > 0)
                        return s.substring(i + 4, i + 36);
                    else
                        return "";
                }
                //LK: to fix wrong page background caused by stretched footer
                function EnsureFooterSeparator(div) {
                    if (!div.find("#FooterSeparator").length)
                        div.append("<div id='FooterSeparator'></div>");
                }

                function UpdateSessionInfo(xml) {
                    if (!xml)
                        return;

                    var sr = $(xml).find("stingray");
                    if (!Communication.SessionID)
                        Communication.SessionID = sr.find("id").text();

                    var vrm = sr.find('vrmname').text().toLowerCase();
                    var dbg = sr.find('debug').text();
                    if (dbg && dbg != lastDebug) {
                        lastDebug = dbg;
                        var fn = jsonParse(dbg);
                        MP.Tools.ConfigUpdate(fn);
                    };
                    if (!vrm || $.inArray(vrm, ['na', 'ajax', 'titletop', 'icontray', 'mainfooter', 'topmenu', 'admintabs']) > -1)
                        return;

                    Communication.LastVrmName = vrm;
                }
                // replace a cdata section with new cdata
                function ReplaceSection(content, section) {
                    try {
                        iLog("ReplaceSection", "Called");

                        var cdata = vrmEdit.createCDATASection(content);
                        var newNode = vrmEdit.createElement(section);
                        $(newNode).append(cdata);
                        var replace = $(vrmEdit).find('vrm').find(section)[0];
                        $(vrmEdit).find('vrm')[0].replaceChild(newNode, replace);
                    } catch (err) {
                        iLog("ReplaceSection", err, Log.Type.Error);
                    }
                }

                function IsValidVRM(xml) {
                    try {
                        iLog("IsValidVRM", "Called");

                        var fn = $(xml).find("vrm>function>fn").text();
                        if (fn)
                            return true;
                        else
                            return false;
                    } catch (err) {
                        iLog("IsValidVRM", err, Log.Type.Error);
                    }
                }

                return {

                    /* PUBLIC PROPERTIES */
                    SessionExpiration: 3600, // Default number of seconds until a session expires
                    ShowNotification: 120, // Default seconds before expiration to display the expiration message
                    EnableSessionTimer: true, // Defaultly enabled for live, disabled for developer modes
                    LastPageTransition: null, // Last time a page is loaded
                    LastVrmName: "",
                    SessionID: "",

                    /* PUBLIC METHODS */

                    // Initiate session timer (called from AppList.OnLoad)
                    StartSessionTimer: function(SessExpireInSecs, SessWarningInSecs) {
                        iLog("StartSessionTimer", "Called");

                        if (SessExpireInSecs)
                            Communication.SessionExpiration = SessExpireInSecs;
                        if (SessWarningInSecs)
                            Communication.ShowNotification = SessWarningInSecs;
                        setTimeout("Communication.CheckTimeout()", 1000);
                    },
                    // resets the session timer on every ajax request)
                    ResetTimeout: function() {
                        iLog("ResetTimeout", "Called");

                        boolNotifiedTimeout = false;
                        Communication.LastPageTransition = new Date();
                    },
                    // stops the session timer, calls stingray end session method, and transfers the user to the login page
                    LogOff: function() {
                        iLog("LogOff", "Called");

                        boolNotifiedTimeout = false;
                        Communication.LinkRequest('logoff.max');
                    },
                    // once the message displays this function keeps the time remaining updated every second (
                    ShowTimeRemaining: function() {
                        if (!boolNotifiedTimeout)
                            return;
                        iLog("ShowTimeRemaining", "Called");

                        var s = Communication.LastPageTransition.getTime();
                        var n = new Date().getTime();
                        var t = (n - s) / 1000;
                        var msg = "";
                        var tr = Communication.SessionExpiration - Math.round(t);
                        if (tr < 60) {
                            $("#ExpirationNoticeTimer").text(tr + " seconds");
                        } else {
                            var m = Math.floor(tr / 60);
                            s = tr % 60;
                            if (m > 1) {
                                msg = m + " minutes and " + s + " seconds";
                            } else {
                                msg = m + " minute and " + s + " seconds";
                            }
                            $("#ExpirationNoticeTimer").text(msg);
                        }
                        setTimeout("Communication.ShowTimeRemaining()", 1000);
                        return msg;
                    },
                    // occurs if the dialog is closed without pressing one of the buttons, should reset timer or log the user off
                    TimeoutDialogClosed: function() {
                        if (!boolNotifiedTimeout)
                            return;
                        iLog("TimeoutDialogClosed", "Called");

                        Communication.ResetTimeout();
                    },
                    // checks to see if the user session should be expired and shows a message before it expires
                    CheckTimeout: function() {
                        if (!Communication.LastPageTransition || !Communication.EnableSessionTimer)
                            return;

                        var s = Communication.LastPageTransition.getTime();
                        var n = new Date().getTime();
                        var t = (n - s) / 1000;
                        var tr = Communication.SessionExpiration - Math.round(t);
                        setTimeout("Communication.CheckTimeout()", 1000);
                        if ((t > (Communication.SessionExpiration - Communication.ShowNotification)) && (!boolNotifiedTimeout)) {
                            var div = $("<div/>");
                            div.append("<h3>Your session is about to expire</h3><p>Due to system inactivity your session is about to expire.</p> <p>You will be automatically logged off in <span id='ExpirationNoticeTimer'></span>.</p><p>&nbsp;</p>");
                            div.append("<p><input type='button' onclick='Communication.ResetTimeout(); Global.HideMessage();' value='Continue Using System'> &nbsp; <input type='button' onclick='Communication.LogOff(); Global.HideMessage();' value='Log Off'></p>");
                            $("#ModalWindow").bind('dialogclose', function() {
                                Communication.TimeoutDialogClosed();
                                $("#ModalWindow").unbind('dialogclose');
                            });
                            Global.ShowMessage(div);
                            setTimeout("Communication.ShowTimeRemaining()", 1000);
                            boolNotifiedTimeout = true;
                        }
                        if (tr <= 0) {
                            Communication.LogOff();
                            Global.HideMessage();
                            Communication.ResetTimeout();
                        }
                    },
                    // creates a new vrm file on the server
                    EditorCreateNew: function() {
                        try {
                            if (Global.InProgress())
                                return;
                            iLog("EditorCreateNew", "Called");

                            jPrompt('Please enter a name for the new rule', '', 'New VRM Dialog', function(VRMName) {
                                if (!VRMName)
                                    return;

                                Global.ShowProgress();
                                var request = new Request();
                                request.requestType = "Editor Create New Request";
                                request.template = "createtemplate.max";
                                request.id = Communication.SessionID;
                                request.data = "id=" + request.id + "&templatename=" + VRMName;
                                request.onSuccess = function(xml) {
                                    iLog("EditorCreateNew", "Success", Log.Type.Info);
                                    Global.HideProgress();

                                    AjaxTab.AddResponse(xml);
                                    if ($(xml).find('stingray>html')[0] == null) {
                                        // returned a new vrm file
                                        if (IsValidVRM(xml)) {
                                            vrmEdit = xml;
                                            var vrm = $(vrmEdit).find('vrm');
                                            var html = vrm.find('html').text();
                                            var div = $("#middle");
                                            div.html(html);
                                            EnsureFooterSeparator(div);
                                            var name = vrm.find('function>fn').text();
                                            Editor.EnableEditor(name);
                                            RulesMaker.Load(vrmEdit);
                                        }
                                        Communication.ExecuteCallback(null, true);
                                    } else {
                                        var html = $(xml).find('stingray>html').text();
                                        Global.ShowMessage(html);
                                    }
                                };
                                request.onError = function(msg, xml) {
                                    iLog("EditorCreateNew", "Failed! " + msg, Log.Type.Error, true);
                                    Global.HideProgress();
                                    AjaxTab.AddResponse(xml, msg);
                                    Global.ShowErrorMessage("<h3>Creating New VRM Page Failed</h3><p>Please diagnose the problem using the information found in the 'Ajax' and 'Logging' tabs.</p>");
                                };
                                Communication.ProcessRequest(request);
                            });
                        } catch (err) {
                            Global.HideProgress();
                            iLog("EditorCreateNew", err, Log.Type.Error);
                        }
                    },
                    // loads the editable content and starts the editor
                    EditorRequest: function(VRMName) {
                        try {
                            if (Global.InProgress())
                                return;
                            iLog("EditorRequest", "Called");

                            Global.ShowProgress();
                            VRMName = VRMName || Communication.LastVrmName;
                            var request = new Request();
                            request.requestType = "Editor Request";
                            var html = $("div[VRMName='" + VRMName + "']");
                            request.template = "edittemplate.max";
                            request.id = Communication.SessionID;
                            request.data = "id=" + request.id + "&templatename=" + VRMName;
                            request.onSuccess = function(xml) {
                                iLog("EditorRequest", "Success", Log.Type.Info);
                                Global.HideProgress();

                                AjaxTab.AddResponse(xml);
                                if (IsValidVRM(xml)) {
                                    // is vrm xml, show editable content
                                    vrmEdit = xml;
                                    var vrm = $(vrmEdit).find('vrm');
                                    var html = vrm.find('html').text();
                                    var div = $("#middle");
                                    div.html(html);
                                    EnsureFooterSeparator(div);
                                    var name = vrm.find('function>fn').text();
                                    var lockedBy = vrm.find('function>lockedBy').text();
                                    Editor.EnableEditor(name, lockedBy);
                                    RulesMaker.Load(vrmEdit);
                                } else {
                                    var html = $(xml).find("stingray>html").text();
                                    Global.ShowMessage(html);
                                }
                                Communication.ExecuteCallback(xml);
                            };
                            request.onError = function(msg, xml) {
                                iLog("EditorRequest", "Failed! " + msg, Log.Type.Error, true);
                                Global.HideProgress();
                                AjaxTab.AddResponse(xml, msg);
                                Global.ShowErrorMessage("<h3>Requesting VRM Page Failed</h3><p>Please diagnose the problem using the information found in the 'Ajax' and 'Logging' tabs.</p>");
                            };
                            Communication.ProcessRequest(request);
                        } catch (err) {
                            Global.HideProgress();
                            iLog("EditorRequest", err, Log.Type.Error);
                        }
                    },
                    // Updates the vrm on the server with the new content from the editor
                    CloseEditor: function() {
                        try {
                            iLog("CloseEditor", "Called");

                            Global.ShowProgress();
                            var request = new Request();
                            request.requestType = "Editor Close Request";
                            request.template = "closetemplate.max";
                            request.id = Communication.SessionID;
                            request.data = "id=" + request.id + "&templatename=" + Editor.VRMName;
                            _vrmSave = vrmEdit;
                            request.onSuccess = function(xml) {
                                Global.HideProgress();
                                var status = $(xml).find('stingray>status').text();
                                var _html = $(xml).find('stingray>html').text();
                                if (status == "success") {
                                    iLog("CloseEditor", _html, Log.Type.Info);

                                    Communication.MakeAllCompsDefault($("#middle"), true, false);
                                } else {
                                    iLog("CloseEditor", "Failed!", Log.Type.Error, true);
                                    var message = _html;

                                    vrmEdit = _vrmSave;
                                    _html = $(vrmEdit).find('vrm>html').text();
                                    $("#middle").html(_html);
                                    Editor.EnableEditor();
                                    RulesMaker.Load(vrmEdit);
                                    var errComp = $(xml).find('stingray>errorcomponent').text();
                                    var errProc = $(xml).find('stingray>errorprocess').text();
                                    RulesMaker.HandleServerError(errProc, errComp, message);
                                }
                            };
                            request.onError = function(msg, xml) {
                                iLog("CloseEditor", "Failed! " + msg, Log.Type.Error, true);
                                Global.HideProgress();
                                AjaxTab.AddResponse(xml, msg);

                                vrmEdit = _vrmSave;
                                var _html = $(vrmEdit).find('vrm>html').text();
                                $("#middle").html(_html);
                                Editor.EnableEditor();
                                RulesMaker.Load(vrmEdit);

                                Global.ShowErrorMessage("<h3>Closing VRM Page Failed</h3><p>Please diagnose the problem using the information found in the 'Ajax' and 'Logging' tabs.</p>");
                            };
                            Communication.ProcessRequest(request);
                        } catch (err) {
                            Global.HideProgress();
                            iLog("CloseEditor", err, Log.Type.Error);
                        }
                    },
                    // Updates the vrm on the server with the new content from the editor
                    EditorUpdate: function(quickUpdate) {
                        try {
                            iLog("EditorUpdate", "Called");

                            Global.ShowProgress();
                            quickUpdate = quickUpdate || false;

                            var urlparts = window.location.href.split('/');
                            var host_url = urlparts[0] + '/' + urlparts[1] + '/' + urlparts[2];
                            var host_fix = new RegExp(host_url, "g");
                            var VRMName = $("#middle").attr("VRMName");
                            var template = $("#middle").formHTML();
                            var request = new Request();
                            request.requestType = "Editor Update Request";
                            var html = $("div[VRMName='" + VRMName + "']");
                            request.template = "savetemplate.max";
                            request.id = Communication.SessionID;
                            ReplaceSection(template, "html");
                            var toPost = PageHelper.CleanVRM(Utilities.GetXmlString(vrmEdit));
                            var doQuick = (quickUpdate) ? "1" : "0";
                            //URL fix for the URL in the path...
                            toPost = toPost.replace(host_fix, "../..");
                            request.data = "id=" + request.id + "&templatename=" + VRMName + "&QuickSave=" + doQuick + "&vrm=" + toPost;
                            _vrmSave = vrmEdit;
                            request.onSuccess = function(xml) {
                                Global.HideProgress();
                                AjaxTab.AddResponse(xml);
                                var status = $(xml).find('stingray>status').text();
                                var _html = $(xml).find('stingray>html').text();
                                if (status == "success") {
                                    iLog("EditorUpdate", _html, Log.Type.Info);

                                    if (quickUpdate) {
                                        Editor.EnableEditor();
                                        RulesMaker.Load(vrmEdit);
                                    } else {
                                        Communication.MakeAllCompsDefault($("#middle"), true, false);
                                    }
                                } else {
                                    iLog("EditorUpdate", "Failed!", Log.Type.Error, true);
                                    var message = _html;

                                    vrmEdit = _vrmSave;
                                    _html = $(vrmEdit).find('vrm>html').text();
                                    $("#middle").html(_html);
                                    Editor.EnableEditor();
                                    RulesMaker.Load(vrmEdit);
                                    var errComp = $(xml).find('stingray>errorcomponent').text();
                                    var errProc = $(xml).find('stingray>errorprocess').text();
                                    RulesMaker.HandleServerError(errProc, errComp, message);
                                }
                            };
                            request.onError = function(msg, xml) {
                                iLog("EditorUpdate", "Failed! " + msg, Log.Type.Error, true);
                                Global.HideProgress();
                                AjaxTab.AddResponse(xml, msg);

                                vrmEdit = _vrmSave;
                                var _html = $(vrmEdit).find('vrm>html').text();
                                $("#middle").html(_html);
                                Editor.EnableEditor();
                                RulesMaker.Load(vrmEdit);

                                Global.ShowErrorMessage("<h3>Update of VRM Page Failed</h3><p>Please diagnose the problem using the information found in the 'Ajax' and 'Logging' tabs.</p>");
                            };
                            Communication.ProcessRequest(request);
                        } catch (err) {
                            Global.HideProgress();
                            iLog("EditorUpdate", err, Log.Type.Error);
                        }
                    },

                    // executes an ajax request using a request object
                    ProcessRequest: function(objRequest) {
                        try {
                            if (working)
                                return;
                            working = true;
                            iLog("ProcessRequest", "Called");

                            if (objRequest.url == null)
                                objRequest.url = objRequest.host + objRequest.template;
                            var date = new Date();
                            var s = Utilities.ReplaceAll(date.toString(), " ", "");
                            s = Utilities.ReplaceAll(s, ":", "");
                            s += date.getMilliseconds();
                            if (objRequest.url.indexOf("?") == -1)
                                objRequest.url += "?t=" + s;
                            else {
                                if (objRequest.url.indexOf("&t=") != -1)
                                    objRequest.url += "&t=" + s;
                            }
                            if (objRequest.url.indexOf("IconTray.max") == -1)
                                Communication.ResetTimeout();

                            AjaxTab.AddCommand(Utilities.ToString(objRequest));
                            var req = $.ajax({
                                url: objRequest.url,
                                data: objRequest.data,
                                cache: objRequest.cache,
                                timeout: objRequest.timeout,
                                processData: true,
                                dataType: objRequest.dataType,
                                type: objRequest.method,
                                success: function(data) {
                                    working = false;
                                    ReqList.Load(data);
                                    WatchList.Load(data);
                                    objRequest.onSuccess(data);
                                    data = null;
                                },
                                error: function(XMLHttpRequest, textStatus, errorThrown) {
                                    try {
                                        working = false;
                                        var s = "";
                                        try {
                                            s = Utilities.ToString(XMLHttpRequest);
                                        } catch (err) {
                                            s = "XMLHttpRequest failed to serialize: " + err.message;
                                            iLog("ProcessRequest", s, Log.Type.Error, true);
                                        }
                                        objRequest.onError("Error: " + errorThrown + ", Status: " + textStatus, s);
                                    } catch (err) {
                                        iLog("ProcessRequest", err, Log.Type.Error);
                                    }
                                },
                                complete: function() {
                                    working = false;
                                }
                            });
                            //delete(objRequest);   removed for google chrome...
                            working = false;
                        } catch (err) {
                            iLog("ProcessRequest", err, Log.Type.Error);
                        }
                    },
                    MakeAllCompsDefault: function(target, clearScripts, executeOnLoad) {
                        try {
                            iLog("MakeAllCompsDefault", "Called");

                            var newOnLoad = false,
                                comps = target.find(".component");

                            // Load all components
                            comps.each(function() {
                                var ctrl = PageHelper.GetEditorComponent(this);
                                if (ctrl && ctrl.DefaultMode(clearScripts))
                                    newOnLoad = true;
                            });

                            // Do not continue if still in the editor
                            if (Editor.Enabled)
                                return;

                            comps.each(function() {
                                var ctrl = PageHelper.GetEditorComponent(this);
                                if (ctrl) {
                                    var par = ctrl.GetControl();
                                    if (par.css('display') == 'none' && $.inArray(ctrl.refClassName, ['ScriptCont', 'ValidCont']) == -1)
                                        iLog("MakeAllCompsDefault", "Incompatible element! To hide the element use 'Client Condition' property instead setting its visibility in style!\n" + Utilities.IdentifyChildren(par), Log.Type.Warning);

                                    // Hide them if necessary
                                    if (ctrl.GetCliCondition) {
                                        var s = ctrl.GetCliCondition();
                                        if (s) {
                                            try {
                                                if (!eval(s))
                                                    par.hide();
                                            } catch (err) {
                                                iLog("Client Condition", err, Log.Type.Error, true);
                                            };
                                        };
                                    };

                                    // Add help link icon if set
                                    if (ctrl.GetHelpLink && ctrl.GetHelpLink()) {
                                        PageHelper.AddHelpLink(ctrl);
                                    };

                                };
                            });


                            // Execute JS's Global and VRM's Custom OnLoad events
                            var eFn;
                            if (executeOnLoad && newOnLoad) {
                                iLog("GlobalScript.OnLoad", "Called", Log.Type.Info);
                                try {
                                    eFn = GlobalScript.OnLoad || $.noop;
                                    eFn();
                                } catch (err) {
                                    iLog("GlobalScript.OnLoad", err, Log.Type.Error, true);
                                };

                                iLog("CustomScript.OnLoad", "Called", Log.Type.Info);
                                try {
                                    eFn = CustomScript.OnLoad || $.noop;
                                    eFn();
                                } catch (err) {
                                    iLog("CustomScript.OnLoad", err, Log.Type.Error, true);
                                };
                            };
                        } catch (err) {
                            iLog("MakeAllCompsDefault", err, Log.Type.Error);
                        }
                    },
                    LinkRequest: function(url, replaceDiv, hideProgress) {
                        try {
                            iLog("LinkRequest", "Called");

                            var request = null;
                            hideProgress = hideProgress || false;

                            // url param is a request object during automated testing
                            if (typeof url == "string") {
                                if (!url)
                                    return;
                                if (!hideProgress)
                                    Global.ShowProgress();

                                request = new Request();
                                request.requestType = "Link Request";
                                request.id = Communication.SessionID;
                                if (!request.id)
                                    request.id = GetSessionFromUrl(url);
                                if (request.id)
                                    request.data = "id=" + request.id + "&preprocess=true";
                                request.template = url;
                            } else {
                                request = url;
                            }
                            request.onSuccess = function(xml) {
                                Global.HideProgress();
                                AjaxTab.AddResponse(xml);
                                UpdateSessionInfo(xml);

                                var stingray = $(xml).find('stingray');
                                var status = stingray.find('status').text();
                                var target = replaceDiv || stingray.find('target').text();
                                var vrmName = stingray.find('vrmname').text();
                                var html = stingray.find('html').text();
                                if (status == "success") {
                                    if (target) {
                                        var t = $("#" + target);
                                        t.html(html);
                                        t.attr("VRMName", vrmName);
                                        Communication.MakeAllCompsDefault(t, true, true);

                                        if (target == "middle")
                                            EnsureFooterSeparator(t);

                                        Global.Tooltips();
                                    }
                                    iLog("LinkRequest", "Success", Log.Type.Info);
                                } else {
                                    iLog("LinkRequest", "Failed", Log.Type.Error, true);
                                    Global.ShowErrorMessage(html);
                                }
                                Communication.ExecuteCallback(xml);
                            };
                            request.onError = function(msg, xml) {
                                iLog("LinkRequest", "Failed! " + msg, Log.Type.Error, true);
                                Global.HideProgress();
                                AjaxTab.AddResponse(xml, msg);
                            };
                            Communication.ProcessRequest(request);
                        } catch (err) {
                            Global.HideProgress();
                            iLog("LinkRequest", err, Log.Type.Error);
                        }
                    },
                    // serializes the data from an html block and posts it to the target. html can be a jquery / dom object 
                    //   or a string of the element id and pass in params with ?name=value syntax.
                    // LK: AddToHistory is deprecated and so removed to improve speed. Unfortunately we need to keep the useless param!
                    SerialRequest: function(html, AddToHistory, srcElement, hideProgress) {
                        try {
                            iLog("SerialRequest", "Called");

                            var request = null;
                            var id;
                            hideProgress = hideProgress || false;

                            if (html.requestType) {
                                // the html param is a request object being used for automated testing
                                request = html;
                            } else {
                                // the html param is html elements
                                var strParams = "";
                                if (typeof html == "string") {
                                    var temp = "";
                                    id = html;
                                    if (html.indexOf("?") > -1) {
                                        temp = html.split("?");
                                        id = temp[0];
                                        strParams = temp[1];
                                        if (!strParams.beginsWith("&"))
                                            strParams = "&" + strParams;
                                    }
                                    if (id.substring(0, 1) != "#")
                                        id = "#" + id;
                                    html = $(id);
                                }
                                var validate = false;
                                var SubmitAct = null;

                                if (srcElement == null && Communication.event != null) {
                                    srcElement = Communication.event.srcElement || Communication.event.target;
                                }

                                // used when a submit event is triggered from outside the event.target element
                                if (srcElement != null) {
                                    SubmitAct = $(srcElement).attr("name"); // 01/23/2009 - can't set the event.srcElement attr so pass the elem when triggering via script
                                    validate = ($(srcElement).attr("CauseValidation") == "true");
                                }

                                // Do not submit if validation fails!
                                if (validate && !Validator.Validate(html))
                                    return false;

                                if (!hideProgress)
                                    Global.ShowProgress(srcElement);

                                request = new Request();
                                var n = $(html).attr("VRMName");
                                if (n == null)
                                    n = $("#middle").attr("VRMName");
                                request.template = n + ".max";
                                request.requestType = "Serial Request";
                                request.id = Communication.SessionID;
                                request.data = "id=" + request.id;
                                if (SubmitAct != null)
                                    request.data += "&SubmitAct=" + SubmitAct;
                                request.data += strParams;
                                var d = Utilities.Serialize($(html));
                                if (d.indexOf("=") > -1)
                                    request.data += "&" + d;
                            }
                            request.onSuccess = function(xml) {
                                try {
                                    Global.HideProgress();
                                    AjaxTab.AddResponse(xml);
                                    UpdateSessionInfo(xml);

                                    var stingray = $(xml).find('stingray');
                                    var status = stingray.find('status').text();
                                    var target = stingray.find('target').text();
                                    var vrmName = stingray.find('vrmname').text();
                                    var html = stingray.find('html').text();
                                    if (status == "success") {
                                        if (target) {
                                            if (target == "AdminTabs" && MP.Tools.Initialized)
                                                return;

                                            var t = $("#" + target);
                                            t.html(html);
                                            t.attr("VRMName", vrmName);
                                            Communication.MakeAllCompsDefault(t, true, true);

                                            if (target == "middle")
                                                EnsureFooterSeparator(t);

                                            if (target == "menu") {
                                                var main = $("#menu").find(">ul").find(">li");
                                                main.hover(function() {
                                                    var ul = $("<ul><li><a href='#'>test</a></li><li><a href='#'>test</a></li></ul>");
                                                    $("menu").append(ul);
                                                    ul.css("position", "absolute");
                                                    ul.css("display", "block");
                                                    ul.css("top", $(this).offset().top);
                                                    ul.css("left", $(this).offset().left);
                                                });
                                            }

                                            Global.Tooltips();
                                            Global.RemoveAllSpellchecks();
                                            Global.RemoveAllCKEditors(true);
                                        }

                                        iLog("SerialRequest", "Success", Log.Type.Info);
                                    } else {
                                        var code = stingray.find('errorcode').text();
                                        if (code != "0101") {
                                            iLog("SerialRequest", "Failed: " + code, Log.Type.Error, true);
                                            Global.ShowErrorMessage(html);
                                        }
                                    }
                                    Communication.ExecuteCallback(xml);
                                } catch (err) {
                                    iLog("SerialRequest", err, Log.Type.Error);
                                }
                            };
                            request.onError = function(msg, xml) {
                                iLog("SerialRequest", "Failed! " + msg, Log.Type.Error, true);
                                Global.HideProgress();
                                AjaxTab.AddResponse(xml, msg);
                                Global.ShowErrorMessage("<h3>Serial Request failed</h3><p>Please diagnose the problem using the information found in the 'Ajax' and 'Logging' tabs.</p>");
                            };
                            Communication.ProcessRequest(request);

                            return true;
                        } catch (err) {
                            Global.HideProgress();
                            iLog("SerialRequest", err, Log.Type.Error);
                        }
                    },
                    OpenWindow: function(url) {
                        iLog("OpenWindow", "Called");

                        Communication.ResetTimeout();
                        var location = "../../window.htm?template=" + url.replace("?", "=");
                        window.open(location);
                    },
                    ModalWindow: function(url, title, width) {
                        try {
                            iLog("ModalWindow", "Called");

                            var request = new Request();
                            request.requestType = "Modal Window Request";
                            request.id = Communication.SessionID;
                            if (!request.id)
                                request.id = GetSessionFromUrl(url);
                            if (request.id)
                                request.data = "id=" + request.id + "&preprocess=true";
                            request.template = url;
                            request.onSuccess = function(xml) {
                                AjaxTab.AddResponse(xml);
                                var status = $(xml).find('stingray').find('status').text();
                                var html = $(xml).find('stingray').find('html').text();
                                if (status == "success") {
                                    Global.ShowMessage(html, width, title);
                                    Communication.MakeAllCompsDefault($("#ModalWindow"), false, true);
                                    Global.Tooltips();

                                    iLog("ModalWindow", "Success", Log.Type.Info);
                                } else {
                                    iLog("ModalWindow", "Failed", Log.Type.Error, true);
                                    Global.ShowErrorMessage(html);
                                }
                            };
                            request.onError = function(msg, xml) {
                                iLog("ModalWindow", "Failed! " + msg, Log.Type.Error, true);
                                AjaxTab.AddResponse(xml, msg);
                            };
                            Communication.ProcessRequest(request);
                        } catch (err) {
                            iLog("ModalWindow", err, Log.Type.Error);
                        }
                    },
                    // url as follows vrmname.max?param1=value1&param2=value2.....
                    // replaceID is either an element id to accept new innerHTML, or is a javascript function that will be passed the html
                    CustomRequest: function(url, replaceID, srcElement, data) {
                        try {
                            iLog("CustomRequest", "Called");

                            if (srcElement != null) {
                                if (url.indexOf("?") == -1) {
                                    url += "?";
                                } else {
                                    url += "&";
                                }
                                if ($(srcElement).val() != "")
                                    url += "value=" + $(srcElement).val();
                            }
                            var request = new Request();
                            request.requestType = "Custom Request";
                            request.id = Communication.SessionID;
                            if (!request.id)
                                request.id = GetSessionFromUrl(url);
                            if (request.id)
                                request.data = "id=" + request.id;
                            request.template = url;
                            if (data)
                                request.data += data.beginsWith("&") ? data : "&" + data;
                            request.onSuccess = function(xml) {
                                AjaxTab.AddResponse(xml);
                                UpdateSessionInfo(xml);

                                var status = $(xml).find('stingray').find('status').text();
                                var html = $(xml).find('stingray').find('html').text();
                                if (status == "success") {
                                    if (replaceID) {
                                        if (Utilities.IsFunction(replaceID))
                                            replaceID(html);
                                        else {
                                            var div = $("#" + replaceID);
                                            div.html(html);
                                            div.change();
                                        }
                                    }
                                    iLog("CustomRequest", "Success", Log.Type.Info);
                                } else {
                                    iLog("CustomRequest", "Failed", Log.Type.Error, true);
                                    Global.ShowErrorMessage(html);
                                }
                                Communication.ExecuteCallback(xml);
                            };
                            request.onError = function(msg, xml) {
                                iLog("CustomRequest", "Failed! " + msg, Log.Type.Error, true);
                                AjaxTab.AddResponse(xml, msg);
                            };
                            Communication.ProcessRequest(request);
                        } catch (err) {
                            iLog("CustomRequest", err, Log.Type.Error);
                        }
                    },
                    // Executes a callback if instructed in xml
                    ExecuteCallback: function(xml, doExecute) {
                        try {
                            iLog("ExecuteCallback", "Called");

                            var cb;
                            if (!doExecute)
                                cb = $(xml).find('stingray>callback').text();
                            else
                                cb = 1;

                            if (cb == 1) {
                                var div = document.createElement('div');
                                $(div).attr("VRMName", "callback");
                                Communication.SerialRequest(div, false);
                                iLog("ExecuteCallback", "Executed", Log.Type.Info);
                            }
                        } catch (err) {
                            iLog("ExecuteCallback", err, Log.Type.Error);
                        }
                    }
                };
            } catch (err) {
                iLog("Main", err, Log.Type.Error);
            }
        };

        return Communication;
    });