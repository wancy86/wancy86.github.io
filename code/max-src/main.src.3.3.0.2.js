/** @license
  Copyright (c) 2008-2012, Maximum Processing Inc, All Rights Reserved.
  
  BEGIN of Core JS Objects
  
  The following numbered objects should be loaded in order prior the rest of our objects, right after jQuery!
*/

// Main/root core object for all JS!
define('MP', ['ContextMenu', 'Editor', 'Communication', 'PageHelper', 'RuleHelper', 'HtmlEditor', 'Browser', 'VrmScript'], function (ContextMenu, Editor, Communication, PageHelper, RuleHelper, HtmlEditor, Browser, VrmScript) {
	var MP = new function (undefined) {
		/* PRIVATE PROPERTIES */
		var config = {};

		/* PRIVATE METHODS */

		return {
			/* PUBLIC PROPERTIES */
			StingrayJsVersion : "3.3.0.2",

			/* PUBLIC METHODS */
			Initialize : function (cfgObj) {
				$.extend(config, cfgObj);

				MP.Tools.Initialize(config);
				MP.WebSocket.Initialize(config.webSocket);
			},

			/* PUBLIC OBJECTS */
			Modules : {
				description: "Various modules/objects"
			},
			Types : {
				description: "Type definitions"
			},
			Components : {
				description: "Screen components"
			},
			Constructors : {
				description: "Reusable constructor functions"
			},
			Editor : {
				description: "Editor tools"
			},
			Events : {
				description: "Core events"
			}
		};
	};



	// Core communication!
	var webSocket = new function() {
		try {
			/* PRIVATE PROPERTIES */
			var _webSocket,
				_webSockets = [],
				_watchDog,
				_url = Browser.ParseURL(),
				_ntf;
				
			var _config = {
				host: _url.hostname,
				port: 5711,
				autoReconnectMS: 30000,
				systemApplication: '',
				ssl: false
			};

			/* PRIVATE METHODS */
			function iLog(Place, Message, Type, Silent) {
				Log.Add("WebSocket." + Place, Message, Type, Silent);
			}
			function WebSocketObj(name) {
				this.app = name.toLowerCase();
				this.onMessage;
				this.onOpen;
				this.onClose;
				this.onError;
			}
			function Message(name, msg) {
				this.app = name.toLowerCase();
				this.text = msg;
			}
			function showNotification(type, cfg) {
				if (MP.Tools.jqxNotificationsEnabled()) {
					var ntf = jQ('<div/>')
						.html(cfg.message)
						.jqxNotification({
							autoOpen: true,
							autoClose: false,
							template: type
						});
					if (!_ntf || !_ntf.length) {
						_ntf = jQ('.jqx-notification-container');
						_ntf.addClass('aboveSpinner');
					}
				} else
					jAlert(cfg.message, cfg.title);
			}
			function executeCB(callback, data, webSocketObj) {
				if (!callback)
					return;

				try {
					callback(data, webSocketObj);
				} catch (err) {
					iLog('executeCB', err, Log.Type.Error, true);
				};
			}
			function getMessage(data) {
				var msg = new Message('system', '');
				try {
					msg = $.parseJSON(data);
					msg.app = msg.app.toLowerCase();
				} catch (err) {
					msg.text = data;
				};

				return msg;
			}
			function getConfig(msg) {
				var cfg = msg.config || '{}';
				try {
					cfg = cfg.replace(/&(quot);/g, '"');
					cfg = $.parseJSON(cfg);
				} catch (err) {
					cfg = {};
					iLog('getConfig', err, Log.Type.Error, true);
				};

				return cfg;
			}
			function handleSysMsg(msg) {
				var cfg = getConfig(msg),
					show = cfg.showAs || 'alert-dlg';
				
				show = show.toLowerCase();
				cfg.message = msg.text || cfg.message;
				if (!cfg.message)
					return;

				switch (show) {
					case 'custom-dlg':
						Global.ShowErrorMessage(cfg.message, cfg.title || 'System Message', null, cfg.width);
						break;
					case 'confirm-dlg':
						jConfirm(cfg.message, cfg.title, function(answer) {
							msg = $.extend(msg, {
								//id: Communication.SessionID,
								answer: answer
							});
							webSocket.Send(msg.app, msg);
						});
						break;
					case 'prompt-dlg':
						jPrompt(cfg.message, cfg.value, cfg.title, function(answer) {
							msg = $.extend(msg, {
								//id: Communication.SessionID,
								answer: answer
							});
							webSocket.Send(msg.app, msg);
						});
						break;
					case 'info-ntf':
						showNotification('info', cfg);
						break;
					case 'success-ntf':
						showNotification('success', cfg);
						break;
					case 'warning-ntf':
						showNotification('warning', cfg);
						break;
					case 'danger-ntf':
						showNotification('error', cfg);
						break;
					default:
						jAlert(cfg.message, cfg.title);
				};

				return true;
			}
			function setWatchDog() {
				if (_watchDog)
					return;

				watchDog();

				_watchDog = setInterval(watchDog, _config.autoReconnectMS || 30000);
			}
			function watchDog() {
				if (_webSocket || !webSocket.Count() || !Communication.SessionOK())
					return;

				iLog('Reconnecting', webSocket.Count() + ' sockets');

				var protocol = _config.ssl ? 'wss://' : 'ws://';

				_webSocket = new WebSocket(protocol + _config.host + ':' + _config.port + '/sgc/auth/url/' + Communication.SessionID + '/H');
				_webSocket.onopen = function(evt) {
					if (!Communication.SessionOK())
						return;
					
					$.each(_webSockets, function() {
						executeCB(this.onOpen, evt, this);
					});
				};
				_webSocket.onclose = function(evt) {
					if (!Communication.SessionOK())
						return;

					$.each(_webSockets, function() {
						executeCB(this.onClose, evt, this);
					});

					_webSocket = null;
				};
				_webSocket.onmessage = function(evt) {
					if (!Communication.SessionOK())
						return;

					var msg = getMessage(evt.data)
					$.each(_webSockets, function() {
						if (msg.app == this.app)
							executeCB(this.onMessage, msg, this);
					});
				};
				_webSocket.onerror = function(evt) {
					if (!Communication.SessionOK() || !evt.data)
						return;

					var msg = getMessage(evt.data);
					$.each(_webSockets, function() {
						if (msg.app == this.app)
							executeCB(this.onError, msg, this);
					});
				};
			}
			function findByName(name) {
				name = name.toLowerCase();
				var idx = -1;
				$.each(_webSockets, function(index, item) {
					if (item.app == name)
						idx = index;
				});
				
				return idx;
			}
			function closeAll() {
				_webSocket.close();
				_webSocket = null;
				_webSockets = []; // Comment out to test closing and reconnecting the socket
			}
			
			return {
				
				Initialize: function(cfg) {
					$.extend(_config, cfg);

					// Make host as browser if not present
					if (!_config.host)
						_config.host = _url.hostname;

					if (_config.systemApplication)
						webSocket.Add(_config.systemApplication, {onMessage: handleSysMsg});
				},
				Remove: function(name) {
					if (!name)
						return;
					
					var idx = findByName(name);
					if (idx > -1) {
						iLog('Removing', name);
						_webSockets.splice(idx, 1);
						if (!webSocket.Count())
							closeAll();
					};
				},
				Count: function() {
					return _webSockets.length;
				},
				Find: function(name) {
					if (!name)
						return;
					
					var idx = findByName(name);
					if (idx > -1)
						return _webSockets[idx];
				},
				Close: function(name) {
					try {
						if (name) {
							iLog('Closing', name + ' socket');
							webSocket.Remove(name);
						} else {
							iLog('Closing', webSocket.Count() + ' sockets');
							closeAll();
						}
					} catch (err) {
						iLog('Close', err, Log.Type.Error, true);
					}
				},
				Send: function(name, data) {
					try {
						if (!name)
							return;
						
						var ws = webSocket.Find(name),
							msg = new Message(name);
						if (ws) {
							iLog('Send', 'to ' + name);

							if (Utilities.IsString(data))
								msg.text = data;
							else
								$.extend(msg, data);

							_webSocket.send(JSON.stringify(msg));
						};
						
						return ws;
					} catch (err) {
						iLog('Send', err, Log.Type.Error, true);
					}
				},
				Add: function(name, cfg) {
					try {
						if (!name)
							return;
						
						var ws = webSocket.Find(name);
						if (!ws) {
							ws = new WebSocketObj(name, cfg);
							$.extend(ws, cfg);
							_webSockets.push(ws);
							iLog('Added', name + ' (' + webSocket.Count() + ')');
						};
						
						setWatchDog();
						
						return ws;
					} catch (err) {
						iLog('Add', err, Log.Type.Error, true);
					}
				}
			};
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	MP.WebSocket = webSocket;



	// Debugging tools
	var tools = new function () {
		try {

			/* PRIVATE PROPERTIES */
			var _toolbar,
				tbSect = null,
				lastButton,
				vrmNameEl,
				languages = [],	lngSelDlg, lngSource, lngData, lngGrid, lngButton, lngAbbr,
				wfButton, wfSecs,
				origTitle = document.title,
				lastVrmList;

			var cfgDefault = {
				bootstrapEnabled : false,
				Editor : {
					openInTab: true,
					html : {
						snap : [5, 5],
						pageLayout : "middle"
					},
					ace : {
						enabled : true,
						theme : "chrome",
						codeTips : false,
						wordWrap : false
					},
					property : {
						pinned : false
					},
					toolBars : {
						developer : {
							width : 0,
							position : {
								left : 0,
								top : 100
							}
						},
						page : {
							width : 0,
							position : {
								left : 0,
								top : 100
							}
						},
						process : {
							width : 0,
							position : {
								left : 0,
								top : 100
							}
						},
						bootstrap : {
							width : 0,
							position : {
								left : 0,
								top : 100
							}
						}
					},
					tabs : {
						logging : {
							pinned : false,
							viewStyle : "float",
							position : {
								left : "center",
								top : "middle"
							},
							size : {
								width : 600,
								height : 400
							}
						},
						reqList : {
							pinned : false,
							filter : "",
							viewStyle : "float",
							showAll : false,
							filterVars : false,
							position : {
								left : "center",
								top : "middle"
							},
							size : {
								width : 600,
								height : 400
							}
						},
						watchList : {
							pinned : false,
							filter : "",
							viewStyle : "float",
							position : {
								left : "center",
								top : "middle"
							},
							size : {
								width : 600,
								height : 400
							}
						},
						ajax : {
							pinned : false,
							viewStyle : "float",
							position : {
								left : "center",
								top : "middle"
							},
							size : {
								width : 600,
								height : 400
							}
						},
						process : {
							extendBy : 500
						},
						sandbox : {
							pinned : false,
							position : {
								left : "center",
								top : "middle"
							},
							size : {
								width : 600,
								height : 400
							}
						}
					}
				}
			};
			
			/* PRIVATE METHODS */
			function iLog(Place, Message, Type, Silent) {
				Log.Add("Tools." + Place, Message, Type, Silent);
			}
			function CompleteConfig(cfgObj) {
				var shell = $('#shell'),
					tb = cfgDefault.Editor.toolBars;
				
				// Here because some browsers cannot do it earlier!
				tb.developer.position.left = shell.offset().left + shell.width() + 40;
				tb.page.position.left = shell.offset().left - 50;
				tb.process.position.left = shell.offset().left + shell.width() - 20;
				tb.bootstrap.position.left = shell.offset().left - 50;

				$.extend(true, tools.Config, cfgDefault, cfgObj);
			}
			function updateButton(id, show, definition, onClick) {
				var btn = tbSect.find('#' + id);

				if (show) {
					if (!btn.length) {
						btn = $(definition)
							.attr('id', id);

						if (lastButton)
							lastButton.after(btn);
						else
							tbSect.append(btn);
						
						if (onClick)
							btn.bind("click", onClick);
					};
					lastButton = btn;
				} else
					btn.remove();
			}
			function updateToolbar() {
				try {
					iLog("updateToolbar", "Called");

					if (!_toolbar)
						return;

					var cfg = tools.Config.Editor.toolBars.developer;
					_toolbar.css('left', cfg.position.left + 'px')
						.css('top', cfg.position.top + 'px')
						.data('lastLeft', cfg.position.left)
						.data('lastTop', cfg.position.top);
					if (cfg.width)
						_toolbar.css('width', cfg.width + 'px');
				} catch (err) {
					iLog("updateToolbar", err, Log.Type.Error);
				}
			}
			function initToolbar() {
				try {
					iLog("initToolbar", "Called");
					
					if (_toolbar)
						return;
						
					_toolbar = $('<div id="DevToolBar" class="verticalToolbar aboveSpinner"/>');
					$('#bottom').after(_toolbar);
					tbSect = $('<div class="toolbarSection">');
					_toolbar.append(tbSect);

					_toolbar.draggable({
							cancel: "img",
							start: function( event, ui ) {
								Global.DisableHighlightingInChrome(true);
							},
							stop: function( event, ui ) {
								Global.DisableHighlightingInChrome(false);
								Global.UpdateLastPosition(_toolbar, ui);
							}
						})
						.resizable({
							start: function() {
								Global.DisableHighlightingInChrome(true);
							},
							stop: function( event, ui ) {
								Global.DisableHighlightingInChrome(false);
							}
						})
						.disableSelection();
					
					$(window).bind('scroll.DevToolBar', function () {
						if (_toolbar.is(":visible"))
							_toolbar.css('top', (_toolbar.data('lastTop') + $(document).scrollTop()) + "px");
					});
				} catch (err) {
					iLog("initToolbar", err, Log.Type.Error);
				}
			}
			function resetLanguages() {
				var dlg = $('#SelectLanguageDlg');
				dlg.remove();
			}
			function ShowLogging(activate) {
				if (tools.Config.loggingEnabled)
					Log.Show(activate);
			}
			function ShowReqList(activate) {
				if (tools.Config.reqlistEnabled)
					ReqList.Show(activate);
			}
			function ShowWatchList(activate) {
				if (tools.Config.watchlistEnabled)
					WatchList.Show(activate);
			}
			function ShowAjax(activate) {
				if (tools.Config.ajaxEnabled)
					AjaxTab.Show(activate);
			}
			function ShowSandbox() {
				if (Editor.Enabled)
					sandbox.Show();
			}
			function togglePageLayout(value) {
				var div = $('#shell');
				var val = '30px';
				
				if (!value) {
					value = tools.Config.Editor.html.pageLayout;
					value = value.toLowerCase();
					var arr = ['middle', 'left', 'right'];
					var idx = $.inArray(value, arr);
					if (idx >= 0 && idx <= 1)
						idx++;
					else
						idx = 0;
					value = arr[idx];
				} else
					value = value.toLowerCase();
				tools.Config.Editor.html.pageLayout = value;
				
				switch (value) {
				case 'left' : 
					div.css('margin-left', val);
					div.css('margin-right', 'auto');
					break;
				case 'right':
					div.css('margin-left', 'auto');
					div.css('margin-right', val);
					break;
				default :
					div.css('margin-left', 'auto');
					div.css('margin-right', 'auto');
					break;
				};
			}

			function ValidatePage() {
				var s = PageHelper.ValidatePage() + RuleHelper.ValidatePage();
				if (s)
					jAlert( 'There are some warnings on this page. Please view details in the logging pane.<p>' + s + '</p>', 'Page validation' );
				else
					jAlert( 'No problems found. Page seem OK.', 'Page validation' );
			}

			function selectLanguage() {
				if (!tools.Config.multilingual) {
					jAlert('This system is not configured for multiple languages.');
					return;
				}

				function selectOne(abbreviation) {
					if (!abbreviation)
						return;
					
					lngsDD.find('option:selected').removeAttr("selected");
					lngsDD.find('option[value=' + abbreviation + ']').attr('selected','selected');
					var lo = findLanguage(abbreviation);
					$('#dtbLngs').attr('src', lo.img);
				}

				function closeDlg() {
					dlg.dialog('close');
				}

				function findLanguage(abbreviation) {
					var abbr = abbreviation.toLowerCase();
				    var lngs = $.grep(languages, function(o, i) {
				      	return o.abr == abbr;
				    });
				    if (lngs.length == 1)
				    	return lngs[0];
				}

				function addLanguage(abbreviation, name, image, selected, position) {
					var lo = {
						abr: abbreviation,
						txt: name,
						img: image,
						sel: selected || false
					};

					if (Utilities.IsNumber(position))
						languages.insert(position, lo);
					else
						languages.push(lo);

					return lo;
				}

				function findBtn(caption, btnPane) {
					return $("button:contains(" + caption + ")", btnPane);
				}
				
				function getLng() {
					var opts = lngsDD.find('option:selected');
					if (opts.length != 1) {
						jAlert('Only a single language can be selected');
						return;
					};

					var abbr = $(opts[0]).val();
					return findLanguage(abbr);
				}

				function updateUserLanguage() {
					var lo = getLng();
					if (!lo)
						return;
					
					closeDlg();

					var cbFn = function(result) {
						var res = $.parseJSON(result);
						if (res.success) {
							lngButton.attr('src', lo.img);
							jAlert('Language will change with your next action.');
						 } else
							jAlert('Selected language failed to load. Please try again.');
					};
					Communication.UserLanguage = lo.abr;
					Communication.CustomRequest("icontray.max?action=UpdateUserLanguage&Abbr=" + lo.abr, cbFn);
				}
				
				function makeOptions() {
					var makeOption = function (lo) {
						var opt = $('<option/>')
							.attr('value', lo.abr)
							.text(lo.txt + ' [' + lo.abr + ']');

						if (lo.sel)
							opt.attr('selected', 'selected');

						return opt;
					};
					
					var opts = $([]);
					$.each(languages, function (idx, elm) {
						opts = opts.add(makeOption(elm));
					});
					
					return opts;
				}
				
				function Reload() {
					var cbFn = function(result) {
						languages = $.parseJSON(result);
						if (Editor.Enabled)
							addLanguage('#l', 'Language variables', '../../images/dev-lng-vars.png', false, 0);
						
						lngsDD.html(makeOptions());
						lngsDD.focus();

						if (Editor.Enabled)
							selectOne(langMgr.CurrAbbreviation());
						else
							selectOne(Communication.UserLanguage);
					};
					Communication.CustomRequest("icontray.max?action=ReloadLanguages", cbFn);
				}
				
				function Load() {
					var lo = getLng();
					if (!lo)
						return;
					
					langMgr.Switch(lo.abr);
					selectOne(lo.abr);
				}
				
				function Rebuild() {
					jConfirm('This will create all missing #L language variables!\nAre you sure?', 'Confirm Creation', function(answer) {
						if (answer) {
							selectOne('#l');
							langMgr.Switch('#l');
							langMgr.RebuildVars(false);
						};
					});
				}

				function Delete() {
					var lo = getLng();
					if (!lo || lo.abr == '#l')
						return;

					jConfirm('You are about to delete selected language!\nAre you sure?', 'Confirm Delete', function(answer) {
						if (!answer)
							return;

						Communication.CustomRequest("admintabs.max?action=DeleteLanguage&Abbr=" + lo.abr);

						// Switch to #L 1st so the deleted language is not re-added!
						langMgr.Switch('#l');
						langMgr.Delete(lo.abr);
						lngsDD.find('option:selected').remove();
						selectOne('#l');
					});
				}
				
				function EditAll() {
					var lo = getLng();
					if (!lo)
						return;
					
					lngSelDlg.dialog("close");
					if (langMgr.CurrAbbreviation() != lo.abr)
						langMgr.Switch(lo.abr, lo.txt);

					function apply() {
		                var lngs = langMgr.Languages(),
							lo = lngs[lngAbbr],
							arr = lngSource.localdata;

						for (var i = 0; i < arr.length; i++) {
							var row = arr[i];
							lo.elms[row.id] = {c: row.capt, t: row.tit, h: row.hlp};
						};
						langMgr.Languages(lngs);
						
						dlg.dialog("close");
					}
					function cancel() {
						dlg.dialog("close");
					}
					function buildDataFields() {
		                return [
		                	{ name: 'id', type: 'integer' },
		                	{ name: 'inp', type: 'string' },
		                	{ name: 'capt', type: 'string' },
		                	{ name: 'tit', type: 'string' },
		                	{ name: 'hlp', type: 'string' }
		                ];
		            }
					function buildColumns() {
		                return [
		                	{ text: 'ID', datafield: 'id', width: '4%', editable: false },
		                	{ text: 'Input', datafield: 'inp', width: '20%', editable: false },
		                	{ text: 'Caption', datafield: 'capt', width: '20%', editable: true },
		                	{ text: 'Title', datafield: 'tit', width: '40%', editable: true },
		                	{ text: 'Help Link', datafield: 'hlp', width: '16%', editable: true }
		                ];
		            }
					function buildGrid(abbreviation) {
		                lngAbbr = abbreviation;

		                var lngs = langMgr.Languages(),
		                	lo = lngs[lngAbbr],
		                	pg = $('#rightColumn'),
		                	arr = [];
		                
		                for (var id in lo.elms) {
							var el = lo.elms[id],
		                		elm = pg.find('[mp-id="' + id + '"]');
							
							if (!elm.length)
								continue;

							// Figure out name
							var	ctrl = PageHelper.GetEditorComponent(elm),
								ref = ctrl.refClassName,
								name = '';
							
							if ($.inArray(ref, ['ValidCont', 'ScriptCont', 'EditableContent']) != -1)
								continue;
							
							if (!name && ctrl.GetID)
								name = ctrl.GetID();
							if (!name && ctrl.GetName)
								name = ctrl.GetName();
							name = name + ' [' + ref + ']';

		                	arr.push( { "id": id, "inp": name, "capt": el.c, "tit": el.t, "hlp": el.h } );
		                }

		                return arr;
		            }

					// This dialog is being reused and so should be created only once!
					var dlg = $('#EditLanguagesDlg');
					if (!dlg.length) {
						var btns = {
								'Cancel' : cancel,
								'Apply'  : apply
							};
						
						dlg = $('<div id="EditLanguagesDlg"></div>');
						dlg.html('<div><div id="jqxLngs"/></div>');
						
						dlg.dialog({
							width : 900,
							height : 600,
							autoOpen : false,
							closeOnEscape : false,
							resizable : true,
							modal : true,
							buttons : btns,
							dialogClass : "clientDialog",
							title : "Language Editor",
							open : function() {
								lngGrid.jqxGrid({height: dlg.height() - 5});
							},
							close : function() {
								lngSelDlg.dialog("open");
							},
							resizeStop: function() {
								lngGrid.jqxGrid({height: dlg.height() - 5});
							}
						});
					
			            lngSource = {
			                localdata: buildGrid(lo.abr),
			                datatype: "array",
			                updaterow: function (rowid, rowdata, commit) {
				                lngSource.localdata[rowid] = rowdata
			                    commit(true);
			                },
			                datafields: buildDataFields()
			            };
			            lngData = new jQ.jqx.dataAdapter(lngSource);
			            lngGrid = jQ("#jqxLngs").jqxGrid({
			                width: '100%',
			                height: '100%',
			                source: lngData,
			                editable: true,
			                enabletooltips: true,
							columnsresize: true,
							sortable: true,
			                editMode: 'click',
			                columns: buildColumns()
			            });
					} else {
						lngSource.localdata = buildGrid(lo.abr);
					}

					dlg.dialog("option", "title", "Language Editor - " + lo.txt + " [" + lo.abr + "]");
					dlg.dialog("open");
					lngGrid.jqxGrid('updatebounddata');
				}

				function Rename() {
					var lo = getLng();
					if (!lo || lo.abr == '#l')
						return;
					
					jPrompt('Please enter a new name', lo.txt, 'Re-name Language', function (name) {
						if (!name)
							return;

						langMgr.Rename(lo.abr, name);
						lo.txt = name;
						lngsDD.find('option:selected').html(name + ' [' + lo.abr + ']');
						Communication.CustomRequest("admintabs.max?action=UpdateLanguage&Abbr=" + lo.abr + "&Name=" + encodeURIComponent(name));
					});
				}

				function Copy() {
					var lo = getLng();
					if (!lo || lo.abr == '#l')
						return;
					
					jConfirm('This will copy the active language to the selected language!\nAre you sure?', 'Confirm Copy', function(answer) {
						if (answer) {
							langMgr.Copy(lo.abr);
							langMgr.Switch(lo.abr);
						}
					});
				}
				
				function Add() {
					jPrompt('Please enter an abbreviation and name.\nThe new language will inherit values from the active language.', 'sp,Spanish', 'New language', function (value) {
						if (!value)
							return;
					
						var arr = value.split(',');
						if (arr.length != 2) {
							jAlert('Abbreviation must be comma separated from the name!');
							return;
						};

						var	abbr = arr[0].trim().toLowerCase(),
							name = arr[1].trim();
						if (!abbr || !name) {
							jAlert('Both abbreviation and name must be entered!');
							return;
						};

						if ( abbr == '#l') {
							jAlert('Abbreviation RAW already exists!');
							return;
						};

						Communication.CustomRequest("admintabs.max?action=AddLanguage&Abbr=" + abbr + "&Name=" + encodeURIComponent(name));

						var lo = findLanguage(abbr);
						if (lo) {
							langMgr.Rename(abbr, name);
							lo.txt = name;
							selectOne(abbr);
							lngsDD.find('option:selected').html(name + ' [' + abbr + ']');
						} else {
							langMgr.Copy(abbr, name);
							addLanguage(abbr, name, '../../images/dev-lng-new.png');
							lngsDD.append($('<option></option>').val(abbr).html(name + ' [' + abbr + ']'));
							selectOne(abbr);
						}
						langMgr.Switch(abbr);
					});
				};

				// This dialog is being reused and so should be created only once!
				var lngsDD;
				var dlg = $('#SelectLanguageDlg');
				if (!dlg.length) {
					var btns, loadFn, width;
					if (Editor.Enabled) {
						btns = {
							'#L'     : Rebuild,
							'Edit'   : EditAll,
							'Copy'   : Copy,
							'Rename' : Rename,
							'Delete' : Delete,
							'Add'    : Add
						};
						loadFn = Load;
						width = 400;
					} else {
						btns = {
							'Close'  : closeDlg,
							'Select' : updateUserLanguage
						};
						loadFn = updateUserLanguage;
						width = 220;
					}
					
					lngsDD = $('<select id="LanguageListDD" multiple=""></select>');
					lngsDD
						.bind('dblclick', loadFn)
						.bind('keydown', function (e) {
							if (e.keyCode == $.ui.keyCode.ENTER)
								loadFn();
						});
					
					dlg = $('<div id="SelectLanguageDlg"></div>');
					dlg.html(lngsDD);
					
					dlg.dialog({
						width : width,
						height : 200,
						autoOpen : false,
						closeOnEscape : true,
						resizable : true,
						modal : !Editor.Enabled,
						buttons : btns,
						dialogClass : "clientDialog",
						title : "Languages",
						dragStop: function(event, ui) {
							Global.UpdateLastPosition(dlg, ui);
						},
						open : function() {
							Global.UpdateLastPosition(dlg);

							if (!Editor.Enabled)
								tools.ToolsInForeground(false);
							if (!lngsDD.find('option').length)
								Reload();
							lngsDD.focus();
						},
						close : function() {
							if (!Editor.Enabled)
								tools.ToolsInForeground(true);
						}
					});
					lngSelDlg = dlg;
					
					if (Editor.Enabled) {
						$(window).bind('scroll.pinLanguageDlg', function () {
							var p = dlg.parent();
							if (p.is(":visible"))
								p.css('top', (dlg.data('lastTop') + $(document).scrollTop()) + "px");
						});
					}
				};
				dlg.dialog("open");
				
				var bp = $(".ui-dialog-buttonpane", dlg.parent());
				findBtn('Load', bp).attr('title', 'This will make the selected language the active language');
				findBtn('Add', bp).attr('title', 'This will add a new language that will inherit values from the active language');
				findBtn('Rename', bp).attr('title', 'This will rename the selected language');
				findBtn('Copy', bp).attr('title', 'This will copy the active language to a selected language in the list');
				findBtn('Edit', bp).attr('title', 'This will open selected language in a language editor');
				findBtn('#L', bp).attr('title', 'This will create all missing #L language variables');
			}
			function SelectPageToEdit() {
				var updateVrmList = function(data) {
					if (data)
						lastVrmList = data;

					// LK: We replace the whole list each time as a workaround Chrome's bug selecting the correct item
					var vrmName = tools.VRMName.toLowerCase();

					pagesDD.html(lastVrmList);
					pagesDD.val([vrmName]); //pagesDD.find('option[value=' + vrmName + ']').attr('selected', 'selected');
					pagesDD.focus();
				};
				var GetPage = function () {
					var opts = pagesDD.find('option:selected');
					if (opts.length != 1) {
						jAlert('Only a single VRM page can be open!');
						return;
					} else
						return $(opts[0]).val();
				};
				var ReloadPages = function () {
					Communication.CustomRequest("admintabs.max?action=ReloadPages", updateVrmList);
				};
				var EditPage = function () {
					var pg = GetPage();
					if (!pg)
						return;
					
					dlg.dialog("close");
					tools.VRMName = pg;

					if (!Editor.Standalone && tools.Config.Editor.openInTab)
						Communication.OpenTab("vrmEditor.html?id=" + Communication.SessionID + "&templateName=" + pg);
					else
						Communication.EditorRequest(pg);
				};
				var ViewPage = function () {
					var pg = GetPage();
					if (!pg)
						return;
					
					dlg.dialog("close");
					tools.VRMName = pg;

					if (!Editor.Standalone && tools.Config.Editor.openInTab)
						Communication.OpenTab("vrmEditor.html?id=" + Communication.SessionID + "&ro=1&templateName=" + pg);
					else
						Communication.EditorRequest(pg, true);
				};
				var NewPage = function () {
					dlg.dialog("close");

					function createNew() {
						var name = newDlg.find('#nvName').val(),
							type = newDlg.find('input[name=nvType]:checked').val();
						if (name && type) {
							tools.VRMName = name;
							Communication.EditorCreateNew(name, type + '.vrm');
							pagesDD.html('');
						}
					}

					// This dialog is being reused and so should be created only once!
					var newDlg = $('#NewVrmDlg');
					if (!newDlg.length) {
						newDlg = $('<div id="NewVrmDlg" style="text-align: left;"><label for="nvName">VRM name:</label><input type="text" id="nvName" value=""/></div>');
						var swch = $('<p/>').appendTo(newDlg);
						swch.append('<input type="radio" name="nvType" id="nvAbsolute" value="absolute" checked/><label for="nvAbsolute">Absolute positioned page</label><br/>');
						if (tools.Config.bootstrapEnabled)
							swch.append('<input type="radio" name="nvType" id="nvBootstrap" value="bootstrap"/><label for="nvBootstrap">Bootstrap page</label><br/>');
						swch.append('<input type="radio" name="nvType" id="nvEmpty" value="empty"/><label for="nvEmpty">Other (raw editing only)</label><br/>');
						
						var btns = {
							'Create' : function () {
								createNew();
								newDlg.dialog("close");
							}
						};					
						newDlg.dialog({
							width : 300,
							autoOpen : false,
							closeOnEscape : true,
							modal : true,
							buttons : btns,
							title : "New VRM",
							open : function () {
								newDlg.find('#nvName').focus().select();
							}
						});
						newDlg.keypress(function(e) {
							if (e.keyCode == $.ui.keyCode.ENTER)
								createNew();
						});
					};
					newDlg.dialog("open");
				};
				
				var CopyPage = function () {
					var oldPg = GetPage();
					if (!oldPg)
						return;
					
					dlg.dialog("close");
					jPrompt('Please enter a new name', oldPg, 'Copy a VRM page', function (newPg) {
						if (newPg == null)
							return;
						
						var cbFn = function(result) {
							try {
								result = $.parseJSON(result);
								if (!Utilities.IsObject(result))
									throw 'Bad response! Expected object!';
								if (result.newPage) {
									var vrmName = result.newPage;
									iLog('CopyPage', 'New ' + vrmName + '.vrm & ' + vrmName + '.sql files created.', Log.Type.Debug);
									
									tools.VRMName = vrmName;
									Communication.EditorRequest(vrmName);
									pagesDD.html('');
									return;
								};
								if (result.error) {
									jAlert(result.error);
									return;
								};
								throw 'Bad response! No page or error!';
							} catch (err) {
								iLog("CopyPage", err, Log.Type.Error);
							}
						};
						var params = $.param({
							'oldPage': oldPg,
							'newPage': newPg
						});
						
						Communication.CustomRequest("admintabs.max?action=CopyPage", cbFn, null, params);
					});
				};

				// This dialog is being reused and so should be created only once!
				var pagesDD;
				var dlg = $('#SelectPageToEditDlg');
				if (!dlg.length) {
					pagesDD = $('<select id="VrmPageListDD" multiple=""></select>');
					pagesDD
						.bind('dblclick', EditPage)
						.bind('keydown', function (e) {
							if (e.keyCode == $.ui.keyCode.ENTER)
								EditPage();
						});
					dlg = $('<div id="SelectPageToEditDlg"></div>');
					dlg.html(pagesDD);
					
					var btns = {
						'Reload': ReloadPages,
						'New'   : NewPage,
						'Copy'  : CopyPage,
						'Edit'  : EditPage,
						'View'  : ViewPage
					};					
					dlg.dialog({
						width : 350,
						height : 400,
						autoOpen : false,
						closeOnEscape : true,
						resizable : true,
						modal : true,
						buttons : btns,
						dialogClass : "clientDialog",
						title : "Select a VRM page",
						open : function() {
							tools.ToolsInForeground(false);
							if (!pagesDD.find('option').length)
								ReloadPages();
							else
								updateVrmList();
						},
						close : function() {
							tools.ToolsInForeground(true);
						}
					});
				};
				dlg.dialog("open");
			}
			function SaveConfiguration() {
				var SaveAndSend = function (saveDefault) {
					dlg.dialog("close");
					
					// Update the configuration object
					var c = tools.Config.Editor,
						doc = $(document);
					
					if (saveDefault) {
						c = cfgDefault;
						$.extend(true, tools.Config, c);
					} else {
						c.openInTab = $('#openInTab', dlg)[0].checked;

						var d = _toolbar;
						if (d.length) {
							c.toolBars.developer.position.left = d.data('lastLeft');
							c.toolBars.developer.position.top = d.data('lastTop');
							c.toolBars.developer.width = Utilities.ToNumber(d.width());
						}
						d = $('#RuleToolbar');
						if (d.length) {
							c.toolBars.process.position.left = d.data('lastLeft');
							c.toolBars.process.position.top = d.data('lastTop');
							c.toolBars.process.width = Utilities.ToNumber(d.width());
						}
						d = $('#ComponentToolbar');
						if (d.length) {
							c.toolBars.page.position.left = d.data('lastLeft');
							c.toolBars.page.position.top = d.data('lastTop');
							c.toolBars.page.width = Utilities.ToNumber(d.width());
						}
						d = $('#BootstrapToolbar');
						if (d.length) {
							c.toolBars.bootstrap.position.left = d.data('lastLeft');
							c.toolBars.bootstrap.position.top = d.data('lastTop');
							c.toolBars.bootstrap.width = Utilities.ToNumber(d.width());
						}
						
						var updateDbgWndCfg = function(cfg, div) {
							if (div.data('lastLeft') && div.data('lastTop')) {
								cfg.position.left = div.data('lastLeft');
								cfg.position.top = div.data('lastTop');
								cfg.size.width = Utilities.ToNumber(div.parent().width());
								cfg.size.height = Utilities.ToNumber(div.parent().height());
							};
						};

						d = $('#LoggingDiv');
						if (d.length)
							updateDbgWndCfg(c.tabs.logging, d);
						
						d = $('#ReqListDiv');
						if (d.length)
							updateDbgWndCfg(c.tabs.reqList, d);
						
						d = $('#WatchListDiv');
						if (d.length)
							updateDbgWndCfg(c.tabs.watchList, d);
						
						d = $('#AjaxDiv');
						if (d.length)
							updateDbgWndCfg(c.tabs.ajax, d);
						
						d = $('#SandboxDiv');
						if (d.length)
							updateDbgWndCfg(c.tabs.sandbox, d);
					}

					// Convert the configuration object to string
					var data = 'Cfg="Editor":' + encodeURIComponent(JSON.stringify(c)),
						url = "admintabs.max?action=SaveConfig";
					
					// Send to the server
					Communication.CustomRequest(url, null, null, data);
				};

				// This dialog is being reused and so should be created only once!
				var dlg = $('#SaveConfigurationDlg');
				if (!dlg.length) {
					dlg = $('<div id="SaveConfigurationDlg"></div>');
					var body = dlg.html('<p>You can either save your current configuration or reset to the default settings.<p/><p>In order to see the default setting you must re-login.</p><p id="userPreferences"></p>');
					var cfg = $('#userPreferences', body);
					cfg.append('<input type="checkbox" id="openInTab" value="1"/><label for="openInTab">Open editors in new tab</label><br/>');
					
					var btns = {
						'Reset to default' : function () {
							SaveAndSend(true);
						},
						'Save current' : function () {
							SaveAndSend(false);
						}
					};					
					dlg.dialog({
						width : 370,
						autoOpen : false,
						closeOnEscape : true,
						resizable : false,
						modal : true,
						buttons : btns,
						dialogClass : "clientDialog",
						title : "Save User Preferences",
						open : function() {
							if (!Editor.Enabled)
								tools.ToolsInForeground(false);
							$('#openInTab', dlg)[0].checked = tools.Config.Editor.openInTab;
						},
						close : function() {
							if (!Editor.Enabled)
								tools.ToolsInForeground(true);
						}
					});
				};
				dlg.dialog("open");
			}
			function ShowVersion(msg) {
				msg = (msg) ? msg : "";
				jAlert(msg + MP.StingrayJsVersion);
			}
			function pingWorkflow() {
				if (!Communication.SessionOK())
					return;

				Communication.CustomRequest("icontray.max?action=workflow", function (IconColor) {
					if (IconColor != "none")
						wfButton.attr("src", "../../images/32px-Crystal_Clear_app_access_" + IconColor + ".png");
					else
						wfButton.css("display", "none");
				});
				
				setTimeout(pingWorkflow, wfSecs * 1000);
			}
			function shortcuts(inEditor) {
				iLog("shortcuts", "Called");

				var m = Mousetrap;
				if (!m)
					return;

				function cancelCB(event, combination) {
					Log.Debug(combination + ' canceled!');
					return false;
				};

				m.reset();

				m.bind('backspace', cancelCB);
				if (inEditor) {
					m.bind('ctrl+s', function() {
						PropertyEd.QuickSave();
						return false;
					});
					m.bind('ctrl+q', function() { PropertyEd.Close() });
					m.bind('ctrl+c', function() { Editor.Copy(false) });
					m.bind('ctrl+x', function() { Editor.Copy(true) });
					m.bind('ctrl+v', function() { Editor.Paste() });
					m.bind('ctrl+shift+f', function() { Editor.Search() });
					m.bind('ctrl+z', function() { Editor.Undo() });
					m.bind('ctrl+y', function() { Editor.Redo() });
					m.bind('del', function() { Editor.Delete() });
					m.bind('ctrl+h', function() {
						HtmlEditor.EditHTML();
						return false;
					});
					m.bind('ctrl+p', function() {
						Editor.ShowProperties();
						return false;
					});
					m.bind('f1', Editor.ShowHelp);
					m.bind('ctrl+a', function() { return Editor.Select('all'); });
					m.bind('ctrl+b', function() { return Editor.Select('below'); });
					m.bind('ctrl+r', function() { return Editor.Select('right'); });
					
					m.bind('ctrl+f5', cancelCB);
					m.bind('f5', cancelCB);
				} else {
					m.bind('ctrl+l', function() {
						Communication.EditorRequest();
						return false;
					});
					m.bind('ctrl+o', function() {
						SelectPageToEdit();
						return false;
					});
				}
			}
			
			return {
			
				/* PUBLIC PROPERTIES */
				description: "Debugging tools",
				Initialized : false,
				Enabled : false,
				VRMName : '',
				Config : {},
				
				/* PUBLIC METHODS */
				ConfigUpdate : function (config) {
					try {
						config = $.parseJSON(config);
						$.extend(this.Config, config);

						this.ShowToolbar();
					} catch (err) {
						iLog("ConfigUpdate", err, Log.Type.Error);
					}
				},
				ShowToolbar : function () {
					try {
						var c = this.Config,
							b;
						
						if (!this.Initialized || c.isEditor)
							return;
						
						resetLanguages();
						shortcuts(Editor.Enabled);
						
						b = c.loggingEnabled;
						updateButton('dtbLog', b, '<img title="Open a Log Viewer" src="../../images/dev-logging.png" />', function() { ShowLogging() });

						b = c.reqlistEnabled;
						updateButton('dtbRL', b, '<img title="Open a ReqList Viewer" src="../../images/dev-reqlist.png" />', function() { ShowReqList() });
						
						b = !Editor.Enabled && c.watchlistEnabled;
						updateButton('dtbWL', b, '<img title="Open a WatchList Viewer" src="../../images/dev-watchlist.png" />', function() { ShowWatchList() });
						
						b = !Editor.Enabled && c.ajaxEnabled;
						updateButton('dtbAjax', b, '<img title="Open an Ajax Viewer" src="../../images/dev-ajax.png" />', function() { ShowAjax() });
						
						b = true;
						updateButton('dtbPos', b, '<img title="Toggle Page Layout" src="../../images/dev-layout.png" />', function() { togglePageLayout() });
						
						b = !Editor.Enabled;
						updateButton('dtbSel', b, '<img title="Select a page to edit" src="../../images/dev-select.png" />', function() { SelectPageToEdit() });
						
						b = Editor.Enabled && c.multilingual;
						updateButton('dtbLngs', b, '<img title="Select a language" src="../../images/dev-lng-vars.png" />', function() { selectLanguage() });
						
						b = JSON && JSON.stringify;
						updateButton('dtbCfg', b, '<img title="Save current configuration and layout" src="../../images/dev-config.png" />', function() { SaveConfiguration() });
						
						b = Editor.Enabled;
						updateButton('dtbSrch', b, '<img title="Find on the page" src="../../images/dev-search.png" />', function() { Editor.Search() });
						
						b = Editor.Enabled;
						updateButton('dtbVal', b, '<img title="Validate this page" src="../../images/dev-validation.png" />', function() { ValidatePage() });
						
						b = Editor.Enabled;
						updateButton('dtbSand', b, '<img title="Sandbox" src="../../images/dev-sandbox.png" />', function() { ShowSandbox() });

						b = Editor.Enabled && !Editor.LockedBy;
						updateButton('dtbQSave', b, '<img title="Save without leaving the editor (Quick save)" src="../../images/dev-quick.png" />', function() { PropertyEd.QuickSave() });
						
						b = Editor.Enabled && !Editor.LockedBy;
						updateButton('dtbFSave', b, '<img title="Save and exit (Full save)" src="../../images/dev-save.png" />', function() { PropertyEd.Save() });
						
						b = Editor.Enabled;
						updateButton('dtbExit', b, '<img title="Exit without saving the page (Cancel editing)" src="../../images/dev-exit.png" />', function() { PropertyEd.Close() });
						
						b = !Editor.Enabled;
						updateButton('dtbVer', b, '<img title="Show version" src="../../images/dev-version.png" />', function() { ShowVersion('Client Version: ') });
						
						// Lower z-order if we are inside the editor to allow other windows to be shown above
						_toolbar.toggleClass('aboveSpinner', !Editor.Enabled);
					} catch (err) {
						iLog("ShowToolbar", err, Log.Type.Error);
					}
				},
				Initialize : function (cfgObj) {
					try {
						var div = $('#DeveloperTabs');
						if (!div.length || !div.find('div').is(':visible'))
							return;

						div.tabs();
						Communication.EnableSessionTimer = false;
						CompleteConfig(cfgObj);
						
						Log.Initialize();
						ReqList.Initialize();
						WatchList.Initialize();
						AjaxTab.Initialize();
						ContextMenu.Initialize();
						RulesMaker.Initialize();
						VrmScript.Initialize();
						HtmlEditor.Initialize();
						sandbox.Initialize();

						initToolbar();
						updateToolbar();
						togglePageLayout(this.Config.Editor.html.pageLayout);

						vrmNameEl = $('#vrmName', '#bottom');

						this.Enabled = true;
						this.Initialized = true;

						this.ShowToolbar();
					} catch (err) {
						iLog("Initialize", err, Log.Type.Error);
					}
				},
				AceEnabled : function () {
					return !Browser.IsMSIE() && window.ace && this.Config.Editor.ace.enabled;
				},
				jqxGridsEnabled : function () {
					var r = window.jQ && window.jqxGrid;
					if (!r)
						iLog("jqxGrid", "jQX grid widget is missing or incorrectly installed.", Log.Type.Warning);
					return r;
				},
				jqxNotificationsEnabled : function () {
					var r = window.jQ && window.jqxNotification;
					if (!r)
						iLog("jqxNotification", "jQX notification widget is missing or incorrectly installed.", Log.Type.Warning);
					return r;
				},
				EditorEnabled : function() {
					return this.Config.editorEnabled;
				},
				ToolsInForeground : function(value) {
					$('#DevToolBar').toggleClass('aboveSpinner', value);
					$('#LoggingDiv').parent().toggleClass('aboveSpinner', value);
					$('#ReqListDiv').parent().toggleClass('aboveSpinner', value);
					$('#WatchListDiv').parent().toggleClass('aboveSpinner', value);
					$('#AjaxDiv').parent().toggleClass('aboveSpinner', value);
				},
				ShowVrmName : function (vrmName) {
					if (!this.Initialized || !vrmName)
						return;
					
					tools.VRMName = vrmName;
					var s = vrmName.toUpperCase();
					if (Editor.Enabled) {
						vrmNameEl.html('Editing - ' + s);
						document.title = 'Editing - ' + s;
					} else {
						vrmNameEl.html('Showing - ' + s);
						document.title = origTitle;
					}
				},
				ShowLanguages : function () {
					selectLanguage();
				},
				InitLanguages : function (button) {
					lngButton = $(button);
					if (!Communication.SessionOK() || !lngButton.length)
						return;

					Communication.CustomRequest("icontray.max?action=GetUserLanguage", function(result) {
						var lo = $.parseJSON(result);
						if (lo.abr) {
							Communication.UserLanguage = lo.abr;
							lngButton.attr('src', lo.img);
						}
					});
				},
				InitWorkflow : function(button, repeatSeconds) {
					wfButton = $(button);
					wfSecs = repeatSeconds || 300;
					if (wfButton.length)
						pingWorkflow();
				}
			}
		
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	MP.Tools = tools;
	

	// Language manager
	var langMgr = new function () {
		try {

			/* PRIVATE PROPERTIES */
			var languages = {},
				currLngObj = null,
				origLngObj = null,
				loaded = false,
				origLoadedObj = null;
			
			/* PRIVATE METHODS */
			function iLog(Place, Message, Type, Silent) {
				Log.Add("LngMgr." + Place, Message, Type, Silent);
			}
			function findLanguage(abbreviation) {
			    return languages[abbreviation];
			};
			function findElement(lngObj, id) {
			    return lngObj.elms[id];
			};
			function addElement(lngObj, id, caption, tooltip, helplink) {
				var lo = new ElmObj(caption, tooltip, helplink);
				lngObj.elms[id] = lo;
				return lo;
			};
			function updateElement(lngObj, ctrl) {
				var id = PageHelper.GetComponentID(ctrl.GetControl()),
					lo = findElement(lngObj, id),
					caption = '', tooltip = '', helplink = '';

				if (ctrl.GetCaption)
					caption = ctrl.GetCaption();
				if (ctrl.GetTooltip)
					tooltip = ctrl.GetTooltip();
				if (ctrl.GetHelpLink)
					helplink = ctrl.GetHelpLink();

				if (!lo)
					lo = addElement(lngObj, id, caption, tooltip, helplink);
				else {
					lo.c = caption;
					lo.t = tooltip;
					lo.h = helplink;
				}
			};
			function isValidElement(reference) {
				return $.inArray(reference, ['ValidCont', 'ScriptCont', 'EditableContent']) == -1;
			};
			function updateAllElements(lngObj) {
				$(".component", "#rightColumn").each(function () {
					var ctrl = PageHelper.GetEditorComponent(this);
					if (isValidElement(ctrl.refClassName))
						updateElement(lngObj, ctrl);
				});
			};
			function updateControl(lngObj, ctrl) {
				var id = PageHelper.GetComponentID(ctrl.GetControl()),
					lo = findElement(lngObj, id),
					caption = '', tooltip = '', helplink = '';

				if (!lo)
					lo = addElement(lngObj, id, caption, tooltip, helplink);
				else {
					caption = lo.c;
					tooltip = lo.t;
					helplink = lo.h;
				}

				if (ctrl.SetCaption)
					ctrl.SetCaption(caption);
				if (ctrl.SetTooltip)
					ctrl.SetTooltip(tooltip);
				if (ctrl.SetHelpLink)
					ctrl.SetHelpLink(helplink);
			};
			function updateAllControls(lngObj) {
				lngObj = lngObj || currLngObj;

				$(".component", "#rightColumn").each(function () {
					var ctrl = PageHelper.GetEditorComponent(this);
					if (isValidElement(ctrl.refClassName))
						updateControl(lngObj, ctrl);
				});
			};
			function recreateOriginals(doAll) {
				var lo = langMgr.Add('#l', 'Language variables');
				lo.elms = {};

				$(".component", "#rightColumn").each(function () {
					var ctrl = PageHelper.GetEditorComponent(this);
					if (!isValidElement(ctrl.refClassName))
						return;

					var	id = PageHelper.GetComponentID(ctrl.GetControl()),
						name, capt, ttip, help;

					// Figure out name
					if (!name && ctrl.GetID)
						name = ctrl.GetID();
					if (!name && ctrl.GetName)
						name = ctrl.GetName();
					if (!name)
						name = id;

					// Get existing properties if not rebuilding all
					if (!doAll) {
						if (ctrl.GetCaption)
							capt = ctrl.GetCaption();
						if (ctrl.GetTooltip)
							ttip = ctrl.GetTooltip();
						if (ctrl.GetHelpLink)
							help = ctrl.GetHelpLink();
					}

					// Update remining blanks using the name
					capt = capt || '#L' + name + '-Caption#';
					ttip = ttip || '#L' + name + '-ToolTip#';
					help = help || '#L' + name + '-HelpLink#';
					
					addElement(lo, id, capt, ttip, help);
				});

				return lo;
			};
			function switchFromTo(fromLngObj, toLngObj) {
				try {
					iLog("SwitchFromTo", "Called");
					
					$(".component", "#rightColumn").each(function () {
						var ctrl = PageHelper.GetEditorComponent(this);
						if (isValidElement(ctrl.refClassName)) {
							updateElement(fromLngObj, ctrl);
							updateControl(toLngObj, ctrl);
						};
					});

					currLngObj = toLngObj;
				} catch (err) {
					iLog("SwitchFromTo", err, Log.Type.Error);
				}
			};
			function removeID(id) {
				for (var lng in languages) {
					var lo = languages[lng];
					lo.elms[id] = null;
					delete lo.elms[id];
				}
			};
			function removeOldElements() {
				var pg = $("#rightColumn"),
					lo = langMgr.Get('#l'),
					i = 0;
				//while (i < lo.elms.length) {
				for (var id in lo.elms) {
					var s = '[mp-id="' + id + '"]';
					if (!pg.find(s).length)
						removeID(id);
				}
			};

			// PRIVATE CONSTRUCTORS!
			function LngObj(abbreviation, name, elements) {
				this.abbr = abbreviation;
				this.name = name;
				this.elms = elements || {};
			};
			function ElmObj(caption, tooltip, helplink) {
				this.c = caption;
				this.t = tooltip;
				this.h = helplink;
			};
			function turnOff() {
				languages = {};
				origLngObj = null;
				currLngObj = null;
				loaded = false;
			};
			function askToReverse() {
				var arr = [];
				for (var lng in languages) {
					if (lng != '#l')
						arr.push(lng);
				}
				var lngs = arr.join(',');

				jPrompt('This page seem to be multi-lingual but your system is not.\nKeep one of the listed language to translate this page into', lngs, 'Confirm Translation', function(lng) {
					if (lng == null)
						return;
					
					var lo = findLanguage(lng);
					if (lo) {
						currLngObj = findLanguage('#l');
						langMgr.Switch(lo.abbr);
						turnOff();
					} else
						setTimeout(askToReverse, 10);
				})
			};

			return {
			
				/* PUBLIC PROPERTIES */
				description: "Language Manager",

				/* PUBLIC METHODS */
				Load : function (lngs) {
					loaded = false;
					
					try {
						if (Utilities.IsString(lngs))
							lngs = $.parseJSON(lngs);
						
						languages = lngs || {};
						origLoadedObj = languages;
						loaded = true;

						if (tools.Config.multilingual) {
							
							// if no RAW present copy page to EN and rebuild RAW's #L. Confuzing enough? :)
							var raw = findLanguage('#l');
							if (!raw) {
								currLngObj = this.Copy('en', 'English');
								origLngObj = this.RebuildVars(true);
								this.Switch('#l');
							} else {
								origLngObj = raw;
								currLngObj = raw;
							}
						} else {

							// 
							if (this.Count() < 2)
								turnOff();
							else
								askToReverse();
						}
					} catch (err) {
						iLog("Load", err, Log.Type.Error, true);
					}

					return languages;
				},
				Save : function () {
					if (!loaded)
						return '{}';

					try {
						this.Switch('#l');
						removeOldElements();
					} catch (err) {
						// Do not prevent the whole VRM from saving!
						iLog("Save", err, Log.Type.Error, true);
						// Return original working translations!
						languages = origLoadedObj;
					}

					return JSON.stringify(languages);
				},
				Count : function () {
					var cnt = 0;
					for (var lng in languages)
						cnt++;
					return cnt;
				},
				CurrAbbreviation : function () {
					return currLngObj.abbr;
				},
				CurrName : function () {
					return currLngObj.name;
				},
				Exists : function (abbreviation) {
					if (!loaded)
						return false;
					
					var lo = findLanguage(abbreviation);
					return Utilities.IsObject(lo);
				},
				Rename : function (abbreviation, name) {
					if (!loaded)
						return null;
					
					var lo = this.Add(abbreviation, name);
					lo.name = name;

					return lo;
				},
				Delete : function (abbreviation) {
					if (!loaded)
						return;
					
					for (var lng in languages) {
						if (lng == abbreviation) {
							languages[lng] = null;
							delete languages[lng];
							return;
						}
					}
				},
				Add : function (abbreviation, name) {
					if (!loaded)
						return null;
					
					var lo = findLanguage(abbreviation);
					if (!lo) {
						lo = new LngObj(abbreviation, name);
						languages[abbreviation] = lo;
					}
					
					return lo;
				},
				Get : function (abbreviation, name) {
					if (loaded)
						return this.Add(abbreviation, name);
				},
				Switch : function (abbreviation, name) {
					if (!loaded)
						return null;
					
					var lo = this.Add(abbreviation, name);
					switchFromTo(currLngObj, lo);

					return lo;
				},
				Languages : function (value) {
					if (!loaded)
						return null;
					
					if (value && Utilities.IsObject(value)) {
						languages = value;
						updateAllControls();
					} else
						return languages;
				},
				RebuildVars : function (doAll) {
					if (!loaded)
						return;
					
					origLngObj = recreateOriginals(doAll);
					updateAllControls();

					return origLngObj;
				},
				Copy : function (abbreviation, name) {
					if (!loaded)
						return null;
					
					var lo = this.Add(abbreviation, name);
					updateAllElements(lo);

					return lo;
				}
			};
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	MP.LanguageMgr = langMgr;



	// AceEditor
	var AceEditor = function (input, config) {
		try {
			var aceEditor,
				textArea,
				aceConfig,
				aceEnabled = MP.Tools.AceEnabled();

			create(input, config);



			function iLog(Place, Message, Type, Silent) {
				Log.Add("AceEditor." + Place, Message, Type, Silent);
			}

			function getValue(value, flags) {
				if (value == undefined)
					return (aceEditor) ? aceEditor.getValue() : textArea.val();
				else
					(aceEditor) ? aceEditor.setValue(value, flags) : textArea.val(value);
			}

			function create(input, config) {
				textArea = $(input);
				aceConfig = config || {};
				aceEditor = Global.ConvertToAceEditor(textArea, aceConfig);

				if (!aceEditor)
					textArea.css(aceConfig.styles || {});

				getValue(aceConfig.value);
			}

			function getContainer() {
				return (aceEditor) ? $(aceEditor.container) : $(textArea);
			}

			
			
			return {
				Value : function (value, flags) {
					return getValue(value, flags);
				},
				Resize : function () {
					if (aceEditor)
						aceEditor.resize();
				},
				Height : function (value) {
					var ed = getContainer();
					
					if (value == undefined)
						return ed.height();

					ed.height(value);
					this.Resize();
				},
				Width : function (value) {
					var ed = getContainer();
					
					if (value == undefined)
						return ed.width();

					ed.width(value);
					this.Resize();
				},
				Remove : function () {
					if (aceEditor)
						aceEditor.destroy();

					aceEditor = null;
					textArea = null;
				},
				ReadOnly : function (value) {
					if (value == undefined)
						return (aceEditor) ? aceEditor.getReadOnly() : textArea.attr('disabled');
					else
						(aceEditor) ? aceEditor.setReadOnly(value) : textArea.attr('disabled', value);
				},
				Focus : function () {
					if (aceEditor)
						aceEditor.focus();
					else
						textArea.focus();
				},
				ScrollToLine : function (lineNumber) {
					if (aceEditor) {
						aceEditor.scrollToRow(lineNumber);
						aceEditor.gotoLine(lineNumber + 1, 0);
					} else {
						textArea.scrollTop(lineNumber + 1);
					}
				}
			};
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	MP.Constructors.AceEditor = AceEditor;



	// Coding sandbox
	var sandbox = new function (undefined) {
		try {

			/* PRIVATE PROPERTIES */
			var _div = null,
				_wrapper,
				_config,
				servEd,
				varsEd,
				respEd,
				_opened = false;

			/* PRIVATE METHODS */
			function iLog(Place, Message, Type, Silent) {
				Log.Add("Sandbox." + Place, Message, Type, Silent);
			}
			function Clear() {
				servEd.Value('');
				varsEd.Value('');
				respEd.Value('');
			}
			function InitConfig() {
				_config = MP.Tools.Config.Editor.tabs.sandbox;
			}
			function UpdateButtons() {
				var bp = $(".ui-dialog-buttonpane", _div.parent());
				var FindBtn = function(caption) {
					return $("button:contains(" + caption + ")", bp);
				};
				
				if (_config.pinned)
					FindBtn('Pin').html("Unpin");
				else
					FindBtn('Unpin').html("Pin");
			}
			function examples() {
				var url = '../../help/advanced.htm',
					wnd = "width=800,height=800,scrollbars=yes,resizable=yes,toolbar=no,location=no,menubar=no,status=no";
				window.open(url, "StingrayHelp", wnd);
			}
			
			return {

				/* PUBLIC PROPERTIES */
				Enabled: false,
				Initialized: false,

				/* PUBLIC METHODS */
				Show : function (activate) {
					if (!this.Initialized)
						return;
					
					_div.dialog("open");
				},
				Hide : function () {
					if (this.Initialized)
						_div.dialog("close");
				},
				Pin : function (value) {
					if (value == undefined)
						_config.pinned = !_config.pinned;
					else
						_config.pinned = value;
					
					UpdateButtons();
					
					if (_config.pinned) {
						$(window).bind('scroll.pinSandboxDiv', function () {
							var p = _div.parent();
							if (p.is(":visible"))
								p.css('top', (_div.data('lastTop') + $(document).scrollTop()) + "px");
						});
					} else {
						$(window).unbind('scroll.pinSandboxDiv');
					}
				},
				Execute : function () {
					try {
						_wrapper.tabs("select", 2);
						respEd.Value('Processing...');
						respEd.ScrollToLine(0);
						
						var code = '&sb-code=' + encodeURIComponent(servEd.Value()),
							vars = '&sb-vars=' + encodeURIComponent(varsEd.Value()),
							url = "admintabs.max?action=ExecuteScript";

						var cbFn = function(result) {
							respEd.Value(result);
							respEd.ScrollToLine(0);
						};
						
						// Send to the server
						Communication.CustomRequest(url, cbFn, null, code + vars);
					} catch (err) {
						iLog.Add("Execute", err, Log.Type.Error);
					}
				},
				Initialize : function () {
					try {
						if (sandbox.Initialized)
							return;					

						InitConfig();
						
						_div = $('#SandboxDiv');
						_wrapper = $("#cs-tabs", _div);
						
						var btns = {
							'Execute' : sandbox.Execute,
							'Help'    : examples,
							'Pin'     : function () { sandbox.Pin() }
						};

						_div.dialog({
							title : 'Sandbox',
							width : _config.size.width,
							height : _config.size.height,
							minWidth : 400,
							minHeight : 300,
							position : [_config.position.left, _config.position.top],
							autoOpen : false,
							closeOnEscape : false,
							modal : false,
							buttons : btns,
							resizeStart: function() {
								Global.DisableHighlightingInChrome(true);
							},
							resizeStop: function() {
								Global.DisableHighlightingInChrome(false);
								servEd.Height(_wrapper.height() - 90);
								varsEd.Height(_wrapper.height() - 90);
								respEd.Height(_wrapper.height() - 75);
							},
							dragStart: function(event, ui) {
								Global.DisableHighlightingInChrome(true);
							},
							dragStop: function(event, ui) {
								Global.DisableHighlightingInChrome(false);
								Global.UpdateLastPosition(_div, ui);
							},
							open: function(event) {
								UpdateButtons();

								if (_div.data('lastLeft') && _div.data('lastTop')) {
									_div.dialog("option", {
										position: [_div.data('lastLeft'), _div.data('lastTop')]
									});
								} else {
									Global.UpdateLastPosition(_div);
								}

								if (_opened)
									return;

								_wrapper.tabs();

								servEd = new MP.Constructors.AceEditor($("#ta-ss", _wrapper), {
									language: 'server script',
									focus: true
								});
								servEd.Height(_wrapper.height() - 90);

								varsEd = new MP.Constructors.AceEditor($("#ta-vars", _wrapper), {
									language: 'text',
									focus: false
								});
								varsEd.Height(_wrapper.height() - 90);

								respEd = new MP.Constructors.AceEditor($("#ta-resp", _wrapper), {
									language: 'text',
									focus: false
								});
								respEd.Height(_wrapper.height() - 75);

								_opened = true;
							}
						});
						
						sandbox.Pin(_config.pinned || false);
						sandbox.Initialized = true;
					} catch (err) {
						iLog.Add("Initialize", err, Log.Type.Error);
					}
				}
			};
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	MP.Editor.Sandbox = sandbox;


	return MP;
});

// 1. A storage for page variables and functions on page scope. ScriptingContainer adds functions to this and calls reset to remove old functions
window.CustomScript = window.CustomScript || {};

// 3. Main global logging used across JS core
define('Log', ['Editor'], function (Editor) {

	// log entry types, the value is used as a class when displayed
	var LogType = new function () {
		this.Error = "error";
		this.Info = "info";
		this.Warning = "warning";
		this.Debug = "debug";
		this.Search = "search";
	};

	var Log = new function (undefined) {

		/* PRIVATE PROPERTIES */
		var _logDiv = null,
			_logTab,
			_location,
			_wrapper,
			_logTable = null,
			_logID = 0,
			_lastSentErrTime = new Date(),
			_config;

		/* PRIVATE METHODS */

		function FormatEntry(ent) {
			_logID++;
			
			var le = $("<tr/>");
			le.append("<td class='index'>" + _logID + "</td>");
			le.append("<td class='time'>" + ent.Time + "</td>");
			le.append("<td class='source'>" + ent.Source + "</td>");
			
			var td = $("<td class='" + ent.Type + "' />");
			td.append(ent.Message);
			
			le.append(td);
			return le;
		}
		function Entry(Src, Message, Type) {
			this.Source = Src;
			this.Message = Message;
			this.Time = Utilities.GetFormattedTime();
			this.Type = Type;
		}
		function Clear() {
			_logID = 0;
			
			if (_logTable)
				_logTable.empty().remove();
			_logTable = $('<table class="Logging"><tr><th>ID</th><th>Time</th><th>Source</th><th>Message</th></tr></table>');
			_wrapper.append(_logTable);
			$('#dtbLog').removeClass('error warning debug search');
		}
		// Remove the oldest records to preserve system resources
		function EnsureLimit() {
			if (_logID < 3000)
				return;

			if ((_logID % 100) == 0)
				_logTable.find("tr:gt(0):lt(101)").empty().remove();
		}
		function InitConfig() {
			_config = MP.Tools.Config.Editor.tabs.logging;
			if (!_config.size) {
				_config.size = {
					width: 600,
					height: 400
				};
			};
		}
		function UpdateButtons() {
			if (Log.Enabled)
				_logDiv.dialog( "option", "title", "Log viewer");
			else
				_logDiv.dialog( "option", "title", "Log viewer - Disabled");
			
			var bp = $(".ui-dialog-buttonpane", _logDiv.parent());
			var FindBtn = function(caption) {
				return $("button:contains(" + caption + ")", bp);
			};
			
			if (Log.Enabled)
				FindBtn('Enable').html("Disable");
			else
				FindBtn('Disable').html("Enable");
			
			if (_config.pinned)
				FindBtn('Pin').html("Unpin");
			else
				FindBtn('Unpin').html("Pin");
			
			if (_location == _logTab)
				FindBtn('Tab View').html("View Here");
			else
				FindBtn('View Here').html("Tab View");
		}
		function JsErrorToStr(Message) {
			if (!Utilities.IsObject(Message))
				return Message;
				
			var msg;
			if (Message.message)
				msg = Message.message;
			else
				msg = Message.Message.description;
			
			msg += " [";
			if (Message.fileName)
				msg += Message.fileName + ", ";
			if (Message.lineNumber)
				msg += Message.lineNumber + ", ";
			if (Message.EntryID)
				msg += Message.EntryID;
			else
				msg += _logID;
			msg += ']';
			
			return msg;
		}
		
		return {

			/* PUBLIC PROPERTIES */
			Enabled : false,
			Initialized: false,

			/* PUBLIC METHODS */
			Debug : function (Message) {
				this.Add('DEBUG', Message, LogType.Debug);
			},

			// Add an entry to the log [default Type = LogType.Info]
			Add : function (Src, Message, Type, SilentError) {
				Type = Type || LogType.Info;
				SilentError = SilentError || false;

				// On live clients log errors into console and server
				if (!this.Initialized) {
					if (Type != LogType.Error)
						return;
						
					// Log error to console if available. LK: neither (console != undefined) nor (!console) work in IE!
					if (window.console != undefined && window.console.log != undefined)
						console.log(Src, " Error: ", Message);
					
					// Send live non communication errors to the server. Limit 1 post per 2 seconds!
					var now = new Date();
					var ms =  new Date(now - _lastSentErrTime);
					if (ms > 2000 && $.inArray(Src, ['Comm.CustomRequest', 'Comm.SerialRequest', 'Comm.LinkRequest']) == -1) {
						_lastSentErrTime = now;
						var data = "ReqList=" + ReqList.GetList();
						var vrmName = $("#middle").attr("VRMName");
						var msg = JsErrorToStr(Message);
						var url = "Logging.max?action=log&Source=" + Src + " (" + Global.Version() + ")&VRMName=" + vrmName + "&Message=" + msg;

						Communication.CustomRequest(url, null, null, data);
					};
					return;
				}
					
				// To preserve performance do not do anything if disabled or hidden
				if (this.Enabled && _wrapper.is(':visible') || $.inArray(Type, [LogType.Error, LogType.Warning, LogType.Debug, LogType.Search]) > -1) {
					EnsureLimit();
					
					var msg = "";
					var isObj = Utilities.IsObject(Message);
					if (Type == LogType.Search && isObj) {
						msg = $("<a>Locate</a>");
						msg.bind("click", function() {
							var el;
							if (Message.GetControl) {
								el = Message.GetControl();
							} else {
								el = Message.Icon.GetImage();
								var s = el.parent().attr("ID");
								RulesMaker.SetCurrentProcess(s);
							}
							Global.ScrollToElement(el, null, function() {
								Global.ShakeElement(el);
							});
						});
						Message.HighlightAsFound(true);
					} else {
						msg = JsErrorToStr(Message);
					}
					var entry = new Entry(Src, msg, Type);
					_logTable.append(FormatEntry(entry));
					if (entry.Type != LogType.Info) {
						$('#dtbLog').toggleClass(entry.Type, true);
					}
				}
				
				if (Type == LogType.Error) {
					//if (Editor.Enabled)
					//	this.Show();

					if (!SilentError)
						throw Message;
				}
			},
			ClearTab : function () {
				if (!this.Initialized)
					return;

				Clear();
				this.Add("Log.ClearTab", "Called");
			},
			Show : function (activate) {
				if (!this.Initialized)
					return;
				
				_logDiv.dialog("open");
				if (activate && !this.Enabled)
					this.Switch();
			},
			Hide : function () {
				if (this.Initialized)
					_logDiv.dialog("close");
			},
			Switch : function () {
				this.Enabled = !this.Enabled;
				
				UpdateButtons();
			},
			Pin : function (value) {
				if (value == undefined)
					_config.pinned = !_config.pinned;
				else
					_config.pinned = value;
				
				UpdateButtons();
				
				if (_config.pinned) {
					$(window).bind('scroll.pinLogDiv', function () {
						var p = _logDiv.parent();
						if (p.is(":visible"))
							p.css('top', (_logDiv.data('lastTop') + $(document).scrollTop()) + "px");
					});
				} else {
					$(window).unbind('scroll.pinLogDiv');
				}
			},
			MoveTo : function (value) {
				if (!value)
					value = (_location == _logDiv) ? 'tab' : 'float';
				else
					value = value.toLowerCase();
				_config.viewStyle = value;
				
				var div = _wrapper.detach();
				var msg = 'This view is inactive. You can either <a class="activateViewLink">activate this view</a> or <a class="goToViewLink">go to the other view</a>.';
				
				if (value == 'tab') {
					_location = _logTab;
					this.Hide();
					_logDiv.html(msg);
					_logDiv.find('.activateViewLink').bind('click', function() {
						Log.MoveTo("float");
					});
					_logDiv.find('.goToViewLink').bind('click', function() {
						Log.Hide();
						Global.ScrollToElement($('#LoggingLink'));
					});
					_logTab.html('');
					div.appendTo(_logTab);
					if (this.Initialized)
						Global.ScrollToElement($('#LoggingLink'));
				} else {
					_location = _logDiv;
					_logTab.html(msg);
					_logTab.find('.activateViewLink').bind('click', function() {
						Log.MoveTo("tab");
					});
					_logTab.find('.goToViewLink').bind('click', function() {
						Log.Show();
						Global.ScrollToElement(_logDiv.parent());
					});
					_logDiv.html('');
					div.appendTo(_logDiv);
				}
				
				UpdateButtons();
			},
			Initialize : function () {
				try {
					if (!MP.Tools.Config.loggingEnabled || this.Initialized)
						return;					

					InitConfig();
					
					// This dialog is being reused and so should be created only once!
					_logTab = $('#LoggingTab');
					_logDiv = $('#LoggingDiv');
					if (!_logDiv.length)
						_logDiv = $('<div id="LoggingDiv"><div class="toolWrapper"></div></div>');
					
					_wrapper = _logDiv.find(".toolWrapper");
					_location = _logDiv;
					
					var btns = {
						'Clear' : function () {
							Log.ClearTab();
						},
						'Enable' : function () {
							Log.Switch();
						},
						'Pin' : function () {
							Log.Pin();
						},
						'Tab View' : function () {
							Log.MoveTo();
						}
					};
					_logDiv.dialog({
						width : _config.size.width,
						height : _config.size.height,
						position : [_config.position.left, _config.position.top],
						minWidth : 300,
						minHeight : 200,
						autoOpen : false,
						closeOnEscape : false,
						modal : false,
						buttons : btns,
						dialogClass : "aboveSpinner",
						resizeStart: function() {
							Global.DisableHighlightingInChrome(true);
						},
						resizeStop: function() {
							Global.DisableHighlightingInChrome(false);
						},
						dragStart: function(event, ui) {
							Global.DisableHighlightingInChrome(true);
						},
						dragStop: function(event, ui) {
							Global.DisableHighlightingInChrome(false);
							Global.UpdateLastPosition(_logDiv, ui);
						},
						open: function(event) {
							UpdateButtons();
							
							if (_logDiv.data('lastLeft') && _logDiv.data('lastTop')) {
								_logDiv.dialog("option", {
									position: [_logDiv.data('lastLeft'), _logDiv.data('lastTop')]
								});
							} else {
								Global.UpdateLastPosition(_logDiv);
							}
						}
					});
					Clear();
					
					this.MoveTo(_config.viewStyle);
					this.Pin(_config.pinned || false);
					this.Initialized = true;
				} catch (err) {
					this.Add("Initialize", err, LogType.Error);
				}
			}
		};
	};
	Log.Type = LogType;
	
	return Log;
});

TransferListHelper = new function () {
	/* PRIVATE PROPERTIES */
	var logClassName = "TrfListHelper.";
		
	/* PRIVATE METHODS */	
	function iLog(Place, Message, Type, Silent) {
		Log.Add(logClassName + Place, Message, Type, Silent);
	}
	function List(left, right) {
		this.Left = left;
		this.Right = right;
	}
	function GetLists(button) {
		try {
			iLog("GetLists", "Called");
			
			var p = $(button).parents(".StaticContainer");
			var l = $(p).find("select")[0];
			var r = $(p).find("select")[1];
			return new List($(l), $(r));
		} catch (err) {
			iLog("GetLists", err, Log.Type.Error);
		}
	}
	function TransferSelected(from, to, all) {
		try {
			iLog("TransferSelected", "Called");
			
			var toMove = [];
			for (var i = 0; i < from[0].options.length; i++) {
				var opt = from[0].options[i];
				if (opt.selected || all)
					toMove.push(opt);
			}
			for (var i = 0; i < toMove.length; i++) {
				var opt = toMove[i];
				$(opt).remove().appendTo(to);
				$(opt).removeAttr("selected");
			}
			Utilities.SortSelect(from);
			Utilities.SortSelect(to);
		} catch (err) {
			iLog("TransferSelected", err, Log.Type.Error);
		}
	}
	
	return {
	
		/* PUBLIC PROPERTIES */
		
		/* PUBLIC METHODS */
		MoveSelectedLeft : function (button) {
			try {
				iLog("MoveSelectedLeft", "Called");
				
				var list = GetLists(button);
				TransferSelected(list.Right, list.Left, false);
			} catch (err) {
				iLog("MoveSelectedLeft", err, Log.Type.Error);
			}
		},
		MoveSelectedRight : function (button) {
			try {
				iLog("MoveSelectedRight", "Called");
				
				var list = GetLists(button);
				TransferSelected(list.Left, list.Right, false);
			} catch (err) {
				iLog("MoveSelectedRight", err, Log.Type.Error);
			}
		},
		MoveAllLeft : function (button) {
			try {
				iLog("MoveAllLeft", "Called");
				
				var list = GetLists(button);
				TransferSelected(list.Right, list.Left, true);
			} catch (err) {
				iLog("MoveAllLeft", err, Log.Type.Error);
			}
		},
		MoveAllRight : function (button) {
			try {
				iLog("MoveAllRight", "Called");
				
				var list = GetLists(button);
				TransferSelected(list.Left, list.Right, true);
			} catch (err) {
				iLog("MoveAllRight", err, Log.Type.Error);
			}
		},
		Serialize : function (HTML) {
			try {
				iLog("Serialize", "Called");
				
				var ret = "";
				$(HTML).find(".component").each(function () { // find all the transfer lists in the HTML
					if ($(this).attr("TransferList") != null) {
						$(this).find("select").each(function () { // find the selects in the transfer lists
							var name = $(this).attr("name");
							ret += "&" + name + "_count=" + $(this)[0].options.length;
							for (var i = 0; i < $(this)[0].options.length; i++) {
								var opt = $(this)[0].options[i];
								ret += "&" + name + "_" + i + "=" + $(opt).attr("value");
							}
						});
					}
				});
				return ret;
			} catch (err) {
				iLog("Serialize", err, Log.Type.Error);
			}
		}
	}; // end return block
};

define('Storage', [], function () {
	function Storage(identifier) {
		try {
			identifier = identifier || '';

			/* PRIVATE PROPERTIES */
			var logClassName = identifier + "Storage.";
			var _objects = [];

			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				Log.Add(logClassName + Place, Message, Type, Silent);
			}
			function Pair(Component, ID) {
				this.Component = Component;
				this.ID = ID;
				this.Destroy = function () {
					this.Component = null;
					this.ID = null;
				};
			}
			
			/* PUBLIC PROPERTIES */
			this.ID = identifier;

			/* PUBLIC METHODS */
			this.AddComponent = function (Component, ID) {
				try {
					iLog("AddComponent", "ID=" + ID);
					
					if (!this.GetComponent(ID)) {
						var p = new Pair(Component, ID);
						_objects.push(p);
					}
				} catch (err) {
					iLog("AddComponent", err, Log.Type.Error);
				}
			};
			this.GetComponent = function (ID) {
				try {
					for (var i = 0; i < _objects.length; i++) {
						if (_objects[i].ID == ID)
							return _objects[i].Component;
					}
					return null;
				} catch (err) {
					iLog("GetComponent", err, Log.Type.Error);
				}
			};
			this.GetCount = function () {
				return _objects.length;
			};
			this.GetItemArray = function () {
				try {
					iLog("GetItemArray", "Called");
					
					var _array = [];
					for (var i = 0; i < _objects.length; i++)
						_array.push(_objects[i].Component);
					
					return _array;
				} catch (err) {
					iLog("GetItemArray", err, Log.Type.Error);
				}
			};
			this.GetIdArray = function (asNumeric) {
				try {
					iLog("GetIdArray", "Called");
					
					var _array = [],
						id;
					for (var i = 0; i < _objects.length; i++) {
						id = _objects[i].ID;
						if (asNumeric)
							id = parseInt(id);
						_array.push(id);
					}
					
					return _array;
				} catch (err) {
					iLog("GetIdArray", err, Log.Type.Error);
				}
			};
			this.Remove = function (ID) {
				try {
					iLog("Remove", "ID=" + ID);
					
					for (var i = 0; i < _objects.length; i++) {
						if (_objects[i].ID == ID) {
							_objects[i].Destroy();
							_objects[i] = null;
							_objects.splice(i, 1);
							return;
						}
					}
				} catch (err) {
					iLog("Remove", err, Log.Type.Error);
				}
			};
			this.Reset = function () {
				try {
					iLog("Reset", _objects.length + " items");
					
					for (var i = 0; i < _objects.length; i++) {
						_objects[i].Destroy();
						_objects[i] = null;
					}
					_objects = [];
				} catch (err) {
					iLog("Reset", err, Log.Type.Error);
				}
			};
		
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Storage;
});

// Do not include PropertyEd! You'll get circular dependency issues
define('Editor', ['PageHelper', 'RuleHelper', 'ContextMenu', 'IconMover', 'IconConnector', 'RuleStorage', 'HtmlEditor', 'Bootstrap', 'VrmScript'], function (PageHelper, RuleHelper, ContextMenu, IconMover, IconConnector, RuleStorage, HtmlEditor, Bootstrap, VrmScript) {
	var Editor = new function () {
		try {
			/* PRIVATE PROPERTIES */
			var logClassName = "Editor.",
				hidElements = [],
				executeAfterInit;

			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				Log.Add(logClassName + Place, Message, Type, Silent);
			}
			function getEditor() {
				switch (ContextMenu.ActiveEditor) {
					case 'html' : return PageHelper;
					case 'bootstrap' : return Bootstrap;
					case 'preproc' : return RulesMaker;
					case 'postproc' : return RulesMaker;
				}
			}
			function waitForEditorInit(doneCB) {
				if (doneCB)
					executeAfterInit = doneCB;

				if (!executeAfterInit)
					return;
				
				if (!MP.Tools.Initialized)
					setTimeout(waitForEditorInit, 100);
				else
					executeAfterInit();
			}
			function enableEditor(vrmName, lockedBy, doneCB) {
				Editor.VRMName = vrmName;
				Editor.LockedBy = lockedBy;
				
				// Detach selected elements from the editor's page
				hidElements = Global.DetachElements($(".HideInEditor").children());

				div = $("#preproc, #postproc");
				var stopEventProp = false;
				var ppDiv = div; // keep a valid reference!
				div.delegate(".icon", "dblclick", function (event) {
					event.stopPropagation();							
					RulesMaker.ShowProperties(this);
				});
				div.delegate(".icon", "mousedown", function (event) {
					try {
						stopEventProp = true;
						
						Editor.DisableSelectibleInIE(ppDiv, true);
						
						var id = $(this).attr("id");
						IconMover.Load(id);
						IconMover.Enable();
						if (event.which == 1)
							ContextMenu.Hide();
						
						var ctrl = RuleStorage.GetComponent(id);
						ctrl.Icon.SetIconMover(IconMover);
					} catch (err) {
						iLog("MouseDown", err, Log.Type.Error);
					}
				});
				div.delegate(".icon", "mouseup", function (event) {
					try {
						stopEventProp = false;
						
						var img = $(this);
						var id = img.attr("id");
						if (event.which == 3)
							RulesMaker.SelectThisOnlyIfNotSelected(id);

						IconConnector.IconClicked(id, event);
						IconMover.Reset();
						
						var ctrl = RuleStorage.GetComponent(id);
						ctrl.SetX(img.position().left);
						ctrl.SetY(img.position().top);
						
						Editor.DisableSelectibleInIE(ppDiv, false);
					} catch (err) {
						iLog("MouseUp", err, Log.Type.Error);
					}
				});
				div.bind("mousedown", function (event) {
					try {
						ContextMenu.UpdatePossition(event, RulesMaker.CurrentProcess);

						if (stopEventProp)
							return false;
						
						ContextMenu.Hide();
						IconConnector.CanvasClicked(event);
					} catch (err) {
						iLog("MouseDown", err, Log.Type.Error);
					}
				});
				div.selectable({
					filter : "img",
					selected : function (event, ui) {
						var id = $(ui.selected).attr("id");
						RulesMaker.AddSelected(id);
					},
					start : function (event, ui) {
						Global.DisableHighlightingInChrome(true);
						RulesMaker.ClearSelected();
					},
					stop : function (event, ui) {
						Global.DisableHighlightingInChrome(false);
					}
				});

				Editor.Enabled = true;
				
				// Lower z-order of all our client debuging tools
				MP.Tools.ToolsInForeground(false);
				MP.Tools.ShowToolbar();
				MP.Tools.ShowVrmName(vrmName);

				// Execute callback if present
				waitForEditorInit(doneCB);
			}

			return {
			
				/* PUBLIC PROPERTIES */
				Enabled : false,
				Standalone: false,
				VRMName : "",
				VRMPath : '',
				LockedBy : "",

				/* PUBLIC METHODS */

				Delete : function () {
					iLog("Delete", "Called");
					
					var o = getEditor();
					if (o)
						o.DeleteSelection();
				},
				Copy : function (doCut) {
					iLog("Copy", "Called");

					var o = getEditor();
					if (o)
						o.Copy(doCut);
				},
				Paste : function () {
					iLog("Paste", "Called");

					var o = getEditor();
					if (o)
						o.Paste();
				},
				Undo : function () {
					iLog("Undo", "Called");

					var o = getEditor();
					if (o)
						o.Undo();
				},
				Redo : function () {
					iLog("Redo", "Called");

					var o = getEditor();
					if (o)
						o.Redo();
				},
				Clear : function () {
					iLog("Clear", "Called");

					HtmlEditor.ClearUndo();
					RulesMaker.ClearUndo();
					VrmScript.Clear();
					window.CustomScript = {};
				},
				ClearSearch : function () {
					HtmlEditor.Search();
					RuleHelper.Search();
					VrmScript.Search();
				},
				Search : function () {
					function DoSearch () {
						var fw = $('#SearchFW', dlg).val();
						var opts = {
								caseSens : $('#SearchCS', dlg)[0].checked,
								wholeWord: $('#SearchWW', dlg)[0].checked,
								regExpr  : $('#SearchRE', dlg)[0].checked
							};

						HtmlEditor.Search(fw, opts);
						RuleHelper.Search(fw, opts);
						VrmScript.Search(fw, opts);
					}
					// This dialog is being reused and so should be created only once!
					var dlg = $('#SearchForDlg');
					if (!dlg.length) {
						dlg = $('<div id="SearchForDlg" style="text-align: left;"><label for="SearchFW">Find What:</label><input type="text" id="SearchFW" value=""/></div>');
						var swch = $('<p/>').appendTo(dlg);
						swch.append('<input type="checkbox" id="SearchCS" value="1"/><label for="SearchCS">Case sensitive</label><br/>');
						swch.append('<input type="checkbox" id="SearchWW" value="1"/><label for="SearchWW">Whole word</label><br/>');
						swch.append('<input type="checkbox" id="SearchRE" value="1"/><label for="SearchRE">Regular expression</label><br/>');
						
						var btns = {
							'Search' : function (e) {
								DoSearch();
								dlg.dialog("close");
							},
							'Clear' : function () {
								Editor.ClearSearch();
								dlg.dialog("close");
							}
						};					
						dlg.dialog({
							width : 210,
							autoOpen : false,
							closeOnEscape : true,
							modal : true,
							buttons : btns,
							title : "Find",
							open : function () {
								dlg.find('#SearchFW').focus().select();
							}
						});
						dlg.keypress(function(e) {
							if (e.keyCode == $.ui.keyCode.ENTER) {
								DoSearch();
							}
						});
					};
					dlg.dialog("open");
				},
				// Called when a template component is dropped onto a container
				BuildComponent : function (Ref, Container, Position) {
					try {
						if (Ref == null)
							iLog("BuildComponent", "The Template control passed in did not specify a ref attribute", Log.Type.Error);
							
						var ctrl = PageHelper.CreateEditorComponent(Ref),
							cont = $(Container);
						if (ctrl) {
							ctrl.AppendTo(cont);
							ctrl.Refresh();
							
							if (Position) {
								var snap = MP.Tools.Config.Editor.html.snap;
								ctrl.SetLeft(Utilities.SnapTo(Position.left - 5, snap[0]));
								ctrl.SetTop(Utilities.SnapTo(Position.top - 25, snap[1]));
							}
							cont.parents('.component').removeClass('droppable-hover');
						}
					} catch (err) {
						iLog("BuildComponent", err, Log.Type.Error);
					}
				},
				DisableSelectibleInIE : function (div, disable) {
					if (!Browser.IsMSIE())
						return;
					
					if (disable)
						div.selectable("disable");
					else
						div.selectable("enable");
				},
				// Disables the editor and sets each component to its default state
				DisableEditor : function () {
					try {
						if (!this.Enabled)
							return;
						iLog("DisableEditor", "Called");
						
						// Re-attach detached elements back to the page
						Global.ReattachElements(hidElements);

						div = $("#preproc, #postproc");
						div.undelegate(".icon")
							.unbind('mousedown')
							.selectable("destroy");
						
						this.Enabled = false;
						
						// Raise back z-order of all our client debuging tools
						MP.Tools.ToolsInForeground(true);
						MP.Tools.ShowToolbar();
						MP.Tools.ShowVrmName(this.VRMName);

						if (Editor.Standalone)
							$('#dtbSel').click();
					} catch (err) {
						iLog("DisableEditor", err, Log.Type.Error);
					}
				},
				// Enables the editor and sets each component to its editable state
				EnableEditor : function (vrmName, lockedBy, lintMsg, doneCB, readOnly) {
					try {
						if (this.Enabled)
							return;
						iLog("EnableEditor", "Called");
						
						vrmName = vrmName || this.VRMName;
						
						if (readOnly) {
							enableEditor(vrmName, lockedBy, doneCB);
							jAlert(lockedBy, 'View mode');
							return;
						};

						if (lockedBy) {
							jConfirm(lockedBy + '<br>Click VIEW to continue in view mode or UNLOCK to unlock this page.', 'Locked VRM', function(view) {
								if (view)
									enableEditor(vrmName, lockedBy, doneCB);
								else {
									Communication.CustomRequest("admintabs.max?action=UnlockVRM&vrmName=" + vrmName);
									enableEditor(vrmName, '', doneCB);
								}
							}, {
								okButton: 'VIEW',
								cancelButton: 'UNLOCK'
							});
							return;
						};

						// Standard editor
						enableEditor(vrmName, '', doneCB);
						if (lintMsg)
							jAlert(lintMsg, 'Lint Messages');
					} catch (err) {
						iLog("EnableEditor", err, Log.Type.Error);
					}
				},
				HideProperties : function () {
					try {
						iLog("HideProperties", "Called");
						
						PropertyEd.Hide();
					} catch (err) {
						iLog("HideProperties", err, Log.Type.Error);
					}
				},
				ShowProperties : function (Component) {
					try {
						iLog("ShowProperties", "Called");
						
						var o = getEditor();
						if (o)
							o.ShowProperties(Component);
					} catch (err) {
						iLog("ShowProperties", err, Log.Type.Error);
					}
				},
				// returns the properties of the current component
				GetProperties : function () {
					try {
						var ctrl = PageHelper.GetEditorComponent();
						return ctrl.GetProperties();
					} catch (err) {
						iLog("GetProperties", err, Log.Type.Error);
					}
				},
				ShowAceEditorForm : function (data, title, description, applyCB, cancelCB, aceConfig) {
					// This dialog removes itself from DOM after close!
					var aceEditor;
					var dlg = $('<div id="AceEditorDlg"><div class="toolWrapper"><div class="noWrap">' + description + '</div><textarea class="dialogTextarea"/></div></div>');
					var _wrapper = $('.toolWrapper', dlg);

					var btns = {
						'Cancel' : function (e) {
							dlg.dialog("close");
						},
						'Apply' : function (e) {
							if (applyCB) {
								cancelCB = null;
								
								var val = aceEditor.Value();
								applyCB(val);
							};
							dlg.dialog("close");
						}
					}
					
					aceConfig = $.extend({
						language: 'html',
						focus: true,
						value: data
					}, aceConfig);

					dlg.dialog({
						width : 700,
						height : 500,
						minWidth : 400,
						minHeight : 300,
						autoOpen : false,
						closeOnEscape : false,
						modal : true,
						buttons : btns,
						title : title,
						resizeStart: function() {
							Global.DisableHighlightingInChrome(true);
						},
						resizeStop: function() {
							Global.DisableHighlightingInChrome(false);
							aceEditor.Height(_wrapper.height() - 35);
						},
						dragStart: function() {
							Global.DisableHighlightingInChrome(true);
						},
						dragStop: function() {
							Global.DisableHighlightingInChrome(false);
						},
						close : function() {
							aceEditor.Remove();

							if (cancelCB)
								cancelCB(data);
							
							dlg.remove();
						},
						beforeclose : function(event) {
							if (event.srcElement) {
								jConfirm('Are you sure to discard all changes?', 'Cancel edit', function(answer) {
									if (answer)
										dlg.dialog('close');
								});
								return false;
							}
						},
						open : function() {
							aceEditor = new MP.Constructors.AceEditor($('.dialogTextarea', dlg), aceConfig);
							aceEditor.Height(_wrapper.height() - 35);
						}
					});
					dlg.dialog("open");
				},
				// formats an array for .droppable accept selector
				GetAcceptedComponents : function (acceptArray) {
					try {
						var _accept = "";
						for (var i = 0; i < acceptArray.length; i++)
							_accept += "img[ref='" + acceptArray[i] + "'],";
						_accept = _accept.substring(0, _accept.length - 1);
						return _accept;
					} catch (err) {
						iLog("GetAcceptedComponents", err, Log.Type.Error);
					}
				},
				ShowHelp : function () {
					try {
						iLog("ShowHelp", "Called");
						
						var wnd = "width=800,height=800,scrollbars=yes,resizable=yes,toolbar=no,location=no,menubar=no,status=no",
							url = '../../help/menu.html?id=' + Communication.SessionID;
						
						window.open(url, "EditorHelp", wnd);
						return false;
					} catch (err) {
						iLog("ShowHelp", err, Log.Type.Error);
					}
				},
				Select : function (what) {
					try {
						iLog("Select", "Called");
						
						var o = getEditor();
						if (o)
							o.Select(what);

						return false;
					} catch (err) {
						iLog("Select", err, Log.Type.Error);
					}
				}
			};

		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	return Editor;
});

define('PropertyFields', ['page/comp/ValidatorContainer'], function (Validator) {
	var key,
		filter,
		filterOptions = {'':''},
		addHelp = function(event) {
			var sel = $(event.target),
				opt = sel.find("option:selected"),
				hlp = opt.attr('title'),
				row = sel.parents('tr').first(),
				inp = row.find('[name=Param]');
			
			jQ(row.get(0)).jqxTooltip({ content: hlp, trigger: 'click', autoHideDelay: 10000, showArrow: false, theme: 'editor' });
		};

	
	for (key in Validator.Filters) {
		if (!Object.prototype.hasOwnProperty.call(Validator.Filters, key))
			continue;
		
		filter = Validator.Filters[key];
		filterOptions[key] = {
			text : filter.name,
			title: filter.description
		};
	}
	
	var PropertyFields = {
		EditorTextFilters : {
			label : 'Filters',
			description : 'Data filters',
			type : 'multi',
			data : [{
					name : 'Filter',
					label : 'Filter',
					type : 'select',
					data : filterOptions,
					onClick : addHelp
				}, {
					name : 'DType',
					label : 'Type',
					type : 'select',
					data : ',DATE,FLOAT,INTEGER,STRING,MONEY'.split(',')
				}, {
					name : 'Param',
					label : 'Parameter',
					type : 'text',
					sizeHint : 'wide'
				}
			]
		},
		Borderless : {
			label : 'Borderless',
			description : 'Whether the control shows a border',
			type : 'checkbox',
			live : true
		},
		Caption : {
			label : 'Caption',
			description : 'The caption of the component',
			type : 'text',
			live : true,
			sizeHint : 'wide'
		},
		HtmlBody : {
			label : 'HTML body',
			description : 'The HTML body of the component',
			type : 'text',
			live : false,
			sizeHint : 'large',
			language : 'html'
		},
		Checked : {
			label : 'Checked',
			description : 'Whether or not the component is checked',
			type : 'text',
			live : true,
			sizeHint : 'small'
		},
		ClassSelect : {
			label : 'Class',
			description : 'A single CSS class',
			type : 'select',
			data : [
				'Default',
				'PageTitle',
				'DefaultBold',
				'Required',
				'RequiredBold',
				'Extended',
				'ExtendedBold',
				'RequiredExtended',
				'RequiredExtendedBold',
				'InfoColor',
				'AttentionColor'
			],
			live : true
		},
		ClassText : {
			label : 'Class',
			description : 'List of CSS classes',
			type : 'text',
			sizeHint : 'wide',
			live : true
		},
		SvrCondition : {
			label : 'Server Condition',
			description : 'A server side script condition for the element to be delivered or not',
			type : 'text',
			sizeHint : 'wide'
		},
		CliCondition : {
			label : 'Client Condition',
			description : 'A client side JS condition for the element to be initially shown or not',
			type : 'text',
			sizeHint : 'wide'
		},
		DefaultButton : {
			label : 'Default',
			description : 'Check to invoke the click event on enter key press on any element of the parent Static Container',
			type : 'checkbox',
			live : false
		},
		EditHTML : {
			label : 'Edit HTML',
			description : 'Replaces the text area with an html editor',
			type : 'checkbox',
			live : false
		},
		Spellcheck : {
			label : 'Spellcheck',
			description : 'Enables the text area to be spellchecked',
			type : 'checkbox',
			live : false
		},
		Flipped : {
			label : 'Flipped',
			description : "Flip input's side",
			type : 'checkbox',
			live : true
		},
		Height : {
			label : 'Height',
			description : 'The height of the component',
			type : 'text',
			sizeHint : 'small',
			live : true
		},
		ID : {
			label : 'ID',
			description : 'The ID of the component',
			type : 'text'
		},
		Left : {
			label : 'Left',
			description : 'The left position of the component',
			type : 'text',
			live : true,
			sizeHint : 'small'
		},
		MaxLength : {
			label : 'Maximum length',
			description : 'The maximum number of characters allowed',
			type : 'text',
			live : true,
			sizeHint : 'small'
		},
		MultiSelect : {
			label : 'Multiselect',
			description : 'Allows multiple items to be selected at same time',
			type : 'checkbox',
			live : true
		},
		Name : {
			label : 'Name',
			description : 'The name of the component',
			type : 'text'
		},
		Type : {
			label : 'Type',
			description : 'The type of the input [text, password, number, email, tel, search, color, range, url, date, time, week]',
			type : 'select',
			data : [
				'text',
				'password',
				'number',
				'email',
				'tel',
				'search',
				'color',
				'range',
				'url',
				'date',
				'time',
				'week'
			],
			live : false
		},
		OnClick : {
			label : 'On click',
			description : 'The javascript that executes when the component is clicked',
			type : 'text'
		},
		Options : {
			label : 'Options',
			description : 'The variable that fills the dropdown options',
			type : 'text',
			sizeHint : 'wide'
		},
		Required : {
			label : 'Required',
			description : 'If the component requires input',
			type : 'checkbox',
			live : true
		},
		Secure : {
			label : 'Secure',
			description : 'Secure input with masked value. Use function "SecureVarForDisplay" to set the mask',
			type : 'checkbox',
			live : false
		},
		Watchpoint : {
			label : 'Watch Point',
			description : 'Set a watchpoint which will cause Stingray to send all ReqList changes back to the editor',
			type : 'checkbox',
			live : true
		},
		Scripts : {
			label : 'Scripts',
			description : 'Javascript functions that will be made available on this page',
			type : 'text',
			live : false,
			sizeHint : 'large',
			language : 'javascript'
		},
		ScriptFunctions : {
			label : 'Script functions',
			description : 'User functions',
			type : 'multi',
			data : [{
					name : 'Name',
					label : 'Event',
					type : 'select',
					data : {
						'BLUR' : {
							text : 'Blur/unfocus'
						},
						'CHANGE' : {
							text : 'Change/edit'
						},
						'CLICK' : {
							text : 'Click'
						},
						'DBLCLICK' : {
							text : 'Double-click'
						},
						'FOCUS' : {
							text : 'Focus'
						},
						'MOUSEDOWN' : {
							text : 'Mouse button down'
						},
						'MOUSEMOVE' : {
							text : 'Mouse move'
						},
						'MOUSEOUT' : {
							text : 'Mouse move out'
						},
						'MOUSEOVER' : {
							text : 'Mouse move over'
						},
						'MOUSEUP' : {
							text : 'Mouse button up'
						},
						'KEYPRESS' : {
							text : 'Key Press'
						},
						'KEYUP' : {
							text : 'Key Up'
						},
						'KEYDOWN' : {
							text : 'Key Down'
						}
					}
				}, {
					name : 'Body',
					label : 'Handler',
					type : 'text',
					sizeHint : 'wide'
				}
			]
		},
		Size : {
			label : 'Size',
			description : 'The size attribute of an input',
			type : 'text',
			sizeHint : 'small',
			live : true
		},
		Style : {
			label : 'Style',
			description : 'Styles applied to the component',
			type : 'text',
			live : true,
			sizeHint : 'wide'
		},
		TabIndex : {
			label : 'Tab index',
			description : 'The tab index of the component',
			type : 'text',
			live : false,
			sizeHint : 'small'
		},
		Tags : {
			label : 'Tags',
			description : 'Attributes without value (eg. disabled, readonly, checked...) added to the input element',
			type : 'text',
			live : true
		},
		Target : {
			label : 'Target',
			description : 'The stingray target div that will receive the rendered template html',
			type : 'text',
			sizeHint : 'wide'
		},
		Top : {
			label : 'Top',
			description : 'The top position of the component',
			type : 'text',
			live : true,
			sizeHint : 'small'
		},
		Tooltip : {
			label : 'Tooltip',
			description : 'The tooltip that displays above a component',
			type : 'text',
			live : true,
			sizeHint : 'wide'
		},
		HelpLink : {
			label : 'Help Link',
			description : 'URL address to a HTML help document',
			type : 'text',
			live : false,
			sizeHint : 'wide'
		},
		Validate : {
			label : 'Validate',
			description : 'If the button should validate the page',
			type : 'checkbox',
			live : true
		},
		Value : {
			label : 'Value',
			description : 'The value of the component',
			type : 'text',
			live : true,
			sizeHint : 'small'
		},
		ValueLessAttrs : {
			label : 'Valueless attributes',
			description : 'Components valueless attributes',
			type : 'text',
			live : true,
			sizeHint : 'wide'
		},
		Width : {
			label : 'Width',
			description : 'The width of the component',
			type : 'text',
			live : true,
			sizeHint : 'small'
		},
		EventVRM : {
			label : 'Event VRM',
			description : 'The VRM [with params] to be called by Ajax',
			type : 'text'
		},
		Event : {
			label : 'Event',
			description : 'The event that fires the ajax post',
			type : 'select'
		},
		AjaxEnabled : {
			label : 'Ajax enabled',
			description : 'Whether the ajax post feature is enabled',
			type : 'checkbox'
		},
		Comment : {
			label : 'Comment',
			description : 'Comment describing purpose of this component and its code displayed in its title and hint',
			type : 'text',
			live : false,
			sizeHint : 'wide'
		},
		CompiledScriptFunction : {
			label : 'Function',
			description : 'Script Function',
			type : 'csf',
			data : []
		},
		SCRIPT : {
			label : 'Script',
			description : 'Script code',
			type : 'text',
			sizeHint : 'large',
			language : 'server script'
		},
		Language : {
			label : 'Language',
			description : 'The type of language the script is written in',
			type : 'select',
			live : false,
			data : ['Server Script']
		},
		SqlTrnName : {
			label : 'Name',
			description : 'A unique name of SQL transaction',
			type : 'text'
		},
		SqlTrnType : {
			label : 'Type',
			description : 'The type of needed SQL transaction',
			type : 'select',
			live : false,
			data : ['Begin', 'Commit', 'Rollback']
		},
		ErrorMessage : {
			label : 'Error message',
			description : 'The error message that will be displayed to the user',
			type : 'text',
			sizeHint : 'large'
		},
		J1 : {
			label : 'J1',
			description : 'The Component that is called by default',
			type : 'text'
		},
		J2 : {
			label : 'J2',
			description : 'The Component that is called on a false condition',
			type : 'text'
		},
		MathParams : {
			label : 'Math parameters',
			description : 'Math Properties',
			type : 'multi',
			data : [{
					name : 'Name',
					label : 'Name',
					type : 'text',
					sizeHint : 'small'
				}, {
					name : 'Format',
					label : 'Format',
					type : 'select',
					data : 'INTEGER,LONGDATETIME,LONGDATETIMEAMPM,SHORTDATE,ROUND,FLOAT'.split(',')
				}, {
					name : 'Value',
					label : 'Param value',
					type : 'text',
					sizeHint : 'wide'
				}
			]
		},
		Query : {
			label : 'Query',
			description : 'A SQL query',
			type : 'text',
			sizeHint : 'large',
			language : 'sql'
		},
		QueryParams : {
			label : 'Parameters',
			description : 'Set Query Parameters',
			type : 'multi',
			data : [{
					name : 'Name',
					label : 'Name',
					type : 'text',
					sizeHint : 'small'
				}, {
					name : 'Type',
					label : 'Type',
					type : 'select',
					data : 'BOOLEAN,CURRENCY,DATETIME,FLOAT,INTEGER,STRING,SECURE'.split(',')
				}, {
					name : 'Value',
					label : 'Value',
					type : 'text',
					sizeHint : 'wide'
				}
			]
		},
		RuleName : {
			label : 'Rule name',
			description : 'The vrm to be called',
			type : 'text'
		},
		SetParams : {
			label : 'ReqList Variables',
			description : 'Set ReqList Variables',
			type : 'multi',
			data : [{
					name : 'Name',
					label : 'Name',
					type : 'text',
					sizeHint : 'small'
				}, {
					name : 'Value',
					label : 'Value',
					type : 'text',
					sizeHint : 'wide'
				}
			]
		},
		X : {
			label : 'X',
			description : 'The left coordinate of the component',
			type : 'text',
			live : true
		},
		Y : {
			label : 'Y',
			description : 'The top coordinate of the component',
			type : 'text',
			live : true
		}
	};
	
	return PropertyFields;
});

/*
This script provides commonly used utility functions
 */
define('Utilities', ['Formatting'], function (Formatting) {
	Array.prototype.reset = function () {
		for (var i = 0; i < this.length; i++)
			this[i] = null;
	};
	Array.prototype.insert = function (index, item) {
  		this.splice(index, 0, item);
	};
	Array.prototype.toPipeString = function () {
		var str = "";
		for (var i = 0; i < this.length; i++) {
			str += this[i] + "|";
		}
		return str.substring(0, str.length - 1);
	};
	String.prototype.beginsWith = function (str) {
		var L = str.length;
		var begin = this.substring(0, L);
		return (begin == str);
	};
	String.prototype.endsWith = function (str) {
		var L = str.length;
		var end = this.substring(this.length - L);
		return (end == str);
	};
	String.prototype.removeLastChar = function () {
		return this.substring(0, this.length - 1);
	};
	String.prototype.removeFirstChar = function () {
		return this.substring(1);
	};
	String.prototype.insert = function (pos, str) {
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
	// Removed in IE8!
	if(typeof String.prototype.trim !== 'function') {
		String.prototype.trim = function() {
			return this.replace(/^\s+|\s+$/g, '');
		};
	};
	
	// Dialog modal result types, the value is used as a class when displayed
	var ModalResultType = new function () {
		this.Ok = "-Dialog-Returned-OK-";
		this.Cancel = "-Dialog-Returned-Cancel-";
		this.Yes = "-Dialog-Returned-Yes-";
		this.No = "-Dialog-Returned-No-";
		this.Empty = "-Dialog-Returned-Empty-String";
	};

	Utilities = new function (undefined) {
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

				SafeStrCompare : function(str1, str2) {
					try {
						return str1.localeCompare(str2);
					} catch (err) {
						if (str1 < str2)
							return -1;
						if (str1 > str2)
							return 1;
						return 0;
					}
				},
				MakeRegExp : function(str, options) {
					var opts = '';
					if (options) {
						if (options.regExpr) {
							var i = str.lastIndexOf("/");
							if (i > -1) {
								var s = str;
								str = s.substring(0, i);
								opts = s.substring(i + 1);
							}
						} else {
							if (!options.caseSens)
								opts = 'i';
							if (options.wholeWord)
								str = '\\b' + str + '\\b';
						}
					}
					return new RegExp(str, opts);
				},
				MakeGUID : function() {
				  return (G() + G() + "-" + G() + "-" + G() + "-" + G() + "-" + G() + G() + G()).toUpperCase();
				},
				GetXmlString : function (xml) {
					var xmlDoc = (xml instanceof $) ? xml[0] : xml;

					if (xmlDoc.xml)
						return xmlDoc.xml;
					else
						return new XMLSerializer().serializeToString(xmlDoc);
				},
				// returns the current time formatted "0h:0m:0s:00ms"
				GetFormattedTime : function () {
					try {
						var d = new Date();
						var t = this.PadNumber(d.getHours()) + ":" + this.PadNumber(d.getMinutes()) + ":" + this.PadNumber(d.getSeconds()) + "." + this.PadNumber(d.getMilliseconds(), 3);
						return t;
					} catch (err) {
						iLog("GetFormattedTime", err, Log.Type.Error);
					}
				},
				GetTimeDifference : function (Date1, Date2) {
					var d1 = Date1.getTime();
					var d2 = Date2.getTime();
					return d2 - d1;
				},
				FilterScript : function (Script) {
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
				Format : function (str, params) {
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
				PadNumber : function (num, padd) {
					try {
						padd = padd || 2;
						var s = "0000000000000000" + num;
    					return s.substr(s.length - padd);
					} catch (err) {
						iLog("PadNumber", err, Log.Type.Error);
					}
				},
				ParseXML : function (xml) {
					if (window.ActiveXObject && window.GetObject) {
						var dom = new ActiveXObject('Microsoft.XMLDOM');
						dom.loadXML(xml);
						return dom;
					}
					if (window.DOMParser)
						return new DOMParser().parseFromString(xml, 'text/xml');
					throw new Error('No XML parser available');
				},
				PreventRefresh : function () {
					try {
						document.oncontextmenu = nocontextmenu;
						document.onmousedown = norightclick;

						if (window.Event)
							document.captureEvents(Event.MOUSEUP);
						if (document.addEventListener) {
							document.addEventListener("keydown", onKeyDown, false);
							return;
						}
						if (document.attachEvent) {
							document.attachEvent("onkeydown", onKeyDown);
							return;
						}
					} catch (err) {
						iLog("PreventRefresh", err, Log.Type.Error);
					}
				}, // prompts the user for a control name and ensures it doesn't already exist
				PromptForName : function (unique, caption) {
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
				ReplaceAll : function (str, fnd, val) {
					try {
						if (!str)
							return '';
						
						var r = new RegExp(fnd, 'g');
						return str.replace(r, val);
					} catch (err) {
						iLog("ReplaceAll", err, Log.Type.Error);
					}
				},
				Serialize : function (HTML) {
					try {
						var toReturn = [];
						var els = $(HTML).find(':input').get();
						$.each(els, function () {
							//LK: New logic supporting all new input types. 2 IF statements instead 1:
							//if (this.name && !this.disabled && (this.checked || /select|textarea/i.test(this.nodeName) || /text|hidden|password/i.test(this.type))) {
							if (this.name && !this.disabled && !/button/i.test(this.type)) {
								if (!this.checked && /checkbox|radio/i.test(this.type))
									return;

								var e = $(this),
									n = encodeURIComponent(this.name),
									t = e.data('submit-type'), // Used for special inputs as MONEY, MASK...
									v = e.val();
								
								// Certain types must be adjusted for submit
								switch (t) {
								case 'MONEY':
									v = Utilities.MoneyToNumber(v);
									if (v)
										toReturn.push(n + "=" + encodeURIComponent(v));
									break;
								case 'MASK':
									toReturn.push(n + "=" + encodeURIComponent(v));
									toReturn.push(n + "-sMask=" + encodeURIComponent(e.attr('sMask')));
									toReturn.push(n + "-sValue=" + encodeURIComponent(e.attr('sValue')));
									break;
								default:
									if (v)
										toReturn.push(n + "=" + encodeURIComponent(e.val()));
								};
							}
						});
						// Get CKEditor values
						$(HTML).find("div[ref='EditorMemo']").each(function () {
							if ($(this).attr("EditHTML") == "true") {
								var input = $(this).find('div.ckEditorDiv'),
									ckSmb = String.fromCharCode(183);

								// Use new DIV. No data loss! New way!
								var data = Global.GetCKEditorValue(input);
								if (data == null) {
									// No DIV or functional CkEditor so use TEXTAREA. Old way!
									input = $(this).find("textarea");
									data = Global.GetCKEditorValue(input);
								}
								if (data == null) {
									// No functional CkEditor so use plain TEXTAREA
									data = input.val();
								}

								var id = encodeURIComponent(input.attr("id"));
								data = encodeURIComponent(data);
								toReturn.push(id + ckSmb + "=" + data);
							}
						});
						var ret = toReturn.join("&").replace(/%20/g, "+");
						
						// Serialize transfer lists
						ret += TransferListHelper.Serialize(HTML);
						
						return ret;
					} catch (err) {
						iLog("Serialize", err, Log.Type.Error);
					}
				},
				SortSelect : function (select) {
					try {
						select = $(select);
						var arr = Global.DetachElements(select.find('option'));
						arr.sort(function(a, b) {
							return Utilities.SafeStrCompare($(a.element).text(), $(b.element).text());
						});
						Global.ReattachElements(arr);
					} catch (err) {
						iLog("SortSelect", err, Log.Type.Error);
					}
				},
				SnapTo : function (num, snapTo) {
					var	frac = num / snapTo % 1;
					if (frac == 0)
						return num;

					var mod = num % snapTo;
					if (frac > 0 && frac < 0.5)
						return num - mod;
					else
						return num - mod + snapTo;
				},
				ToNumber : function (str) {
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
				ToMoney : function (value) {
					try {
						if (Utilities.IsString(value))
							return Formatting.formatTextAsMoney(value);
						
						if (Utilities.IsNumber(value))
							return Formatting.formatTextAsMoney(value.toString());

						// is input itself
						return Formatting.formatFieldAsMoney(value);
					} catch (err) {
						iLog("ToMoney", err, Log.Type.Error);
					}
				},
				MoneyToNumber : function (str) {
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
				ToString : function (IComponent, wrapped, currDepth) {
					currDepth = currDepth || 0;
					if (currDepth > 20)
						return "null";
					
					currDepth++;
					var _str = "";
					if (!wrapped)
						_str = "{\n";
					$.each(IComponent, function (field, val) {
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
				toProperCase : function(s) {
					return s.toLowerCase().replace( /\b((m)(a?c))?(\w)/g,
						function($1, $2, $3, $4, $5) {
							if($2)
								return $3.toUpperCase()+$4+$5.toUpperCase();
							else
								return $1.toUpperCase();
						}
					);
				},
				Trim : function (str) {
					if (str)
						return str.trim();
					else
						return "";
				},
				RemoveWhiteSpaces : function (str) {
					if (str)
						return str.replace(/\s+/g, " ");
					else
						return "";
				},
				IsObject : function (o) {
					return (o && typeof o == "object") || Utilities.IsFunction(o);
				},
				IsFunction : function (o) {
					return (typeof o == "function");
				},
				IsNumber : function (o) {
					return (typeof o == "number");
				},
				IsString : function (o) {
					return (typeof o == "string");
				},
				IsDate : function(DateStr, FormatStr) {
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
				IdentifyChildren : function(element) {
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
				ConvertToJSONObject : function (jsonStr, keyName) {
					if (Utilities.IsObject(jsonStr))
						return jsonStr;
					
					// Ensure it is a string!
					var js = jsonStr + '',
						obj = {},
						re = /^\{(\S|\s)*\}$/; //LK: replaces imperfect /^\{(.*)\}$/
					js = js.trim();
					if (re.test(js)) {
						try {
							obj = $.parseJSON(js);
						} catch(err) {
							obj = null;
						}
					} else
						obj[keyName] = jsonStr;
					
					return obj;
				},
				ConvertToOptions : function (obj) {
					var makeOption = function (data) {
						if (data instanceof $)
							return data;
						
						return $('<option/>')
							.attr('value', data.value || '')
							.attr('title', data.title || '')
							.text(data.text || '');
					};
					
					var parseOption = function (opt) {
						if (typeof opt === 'string') {
							return {
								text : opt,
								value : opt
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
						$.each(obj, function (i, opt) {
							$options = $options.add(makeOption(parseOption(opt)));
						});
					} else if (typeof obj === 'object') {
						// WTB Object.keys with Array for each.
						var key;
						for (key in obj) {
							if (!Object.prototype.hasOwnProperty.call(obj, key))
								continue;
							
							$options = $options.add(makeOption($.extend(parseOption(obj[key]), {value: key})));
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

define('Formatting', [], function () {
	var joinNumber = function (integer, fractions) {
		if (fractions === '')
			return integer;
		else
			return integer + '.' + fractions;
	};
	
	var stripNonNumericalCharacters = function (text) {
		return text.replace(/[^-\d\.]/g, '');
	};
	
	var formatNumberWithCommas = function (amountString) {
		var parts = amountString.split('.');
		var integer = parts[0].replace(/(\d{1,3})(?=(\d{3})+$)/g, '$1,');
		var fractions = parts.slice(1).join('');
		
		if (parts.length > 1)
			return integer + '.' + fractions;
		else
			return integer;
	};
	
	var formatText = function (text) {
		var s = stripNonNumericalCharacters(text);
		s = formatNumberWithCommas(s);
		var i = parseFloat(s);
		if (i < 0)
			return s.insert(1, '$');
		else
			return '$' + s;
	};
	
	var formatTextAsMoney = function (text) {
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
			fractions = fractions.substring(0, 2);
		}
		
		return joinNumber(integer, fractions);
	};
	
	var formatFieldAsMoney = function ($field) {
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
		formatFieldAsMoney : formatFieldAsMoney,
		formatTextAsMoney : formatTextAsMoney,
		stripNonNumericalCharacters : stripNonNumericalCharacters
	};
});

define('page/comp/ValidatorContainer', ['Utilities', 'PageHelper', 'Formatting'], function (Utilities, PageHelper, Formatting) {
	var Validator = new function () {
		var logClassName = "Validator.";
		
		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place, Message, Type, Silent);
		}
		function GetErrors(html) {
			try {
				iLog("GetErrors", "Called");
				
				var errors = [],
					radios = [];
				
				// Validate all input's values
				$(html).find(".component").each(function () {
					var inp = $(this).find("> :input"),
						err = '';
						
					// Validate single, not disabled, writable and visible input
					if (inp.length == 1 && !inp.attr("disabled") && !inp.attr("readonly") && inp.is(':visible')) {
						var ctrl = PageHelper.GetEditorComponent(this);
						if (ctrl) {
							
							if (ctrl.GetRequired && ctrl.GetRequired()) {
								var ref = PageHelper.GetComponentRef(this);
								var span = $(this).find(">span");
								
								switch (ref) {
								case "EditorText":
									if (Utilities.Trim(inp.val()).length == 0)
										err = "Field '" + span.text() + "' must be entered. Click to fix.";
									break;
								case "EditorMemo":
									if (Utilities.Trim(inp.val()).length == 0)
										err = "Text field '" + span.text() + "' must be entered. Click to fix.";
									break;
								case "EditorDropDown":
									if (inp.val() == "-1")
										err = "An option '" + span.text() + "' must be selected. Click to fix.";
									break;
								case "EditorRadio":
									var name = inp.attr("name"),
										radSel = 'input:radio[name=' + name + ']';
									if ($.inArray(name, radios) == -1 && !$(radSel + ':checked').length) {
										radios.push(name);
										var s = "";
										$(radSel).parent().find('span').each(function() {
											s += $(this).text() + ', ';
										});
										err = "At least one option (" + s.slice(0, s.length -2) + ") must be selected. Click to fix.";
									}
									break;
								case "EditorCheckBox":
									if (!inp[0].checked)
										err = "Check box '" + span.text() + "' must be selected. Click to fix.";
									break;
								};
							};

							// Validate rest of filters only if required check is successful
							if (!err && ctrl.FilterInput) {
								err = ctrl.FilterInput(true);
							};
						};
						if (err) {
							ctrl.HighlightAsError(true);
							err = new ValidationError(err, ctrl);
							errors.push(err);
						};
					};
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
						var el = $(this).data("elementObj");
						Global.ScrollToElement(el, null, function() {
							Global.ShakeElement(el);
							var obj = PageHelper.GetEditorComponent(el);
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
				
				$(".ValidationContainer").each(function () {
					var ctrl = PageHelper.GetEditorComponent(this);
					ctrl.Hide();
				});
			} catch (err) {
				iLog("HideErrors", err, Log.Type.Error);
			}
		}
		
		return {
		
			Validate : function (html, noDisplay ) {
				try {
					iLog("Validate", "Called");
					
					var errors = GetErrors(html);
					if (!errors.length) {
						HideErrors();
						return true;
					};
						
					if (!noDisplay) {
						var table = ErrorTable(errors);
						ShowErrors(table, html);
					};
					
					// Trigger it last in case they show dialogs with overlay
					var eFn = window.CustomScript.onValidationErrors || MP.Events.onValidationErrors || $.noop;
					eFn(errors);
					
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
	
	Validator.Filters = (function () {
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
		function executeCallback(fnCB, val, dtype, element) {
			if (fnCB) {
				fnCB = eval(fnCB);
				val = fnCB.call(null, val, dtype, element);
			}
			return val;
		}
		
		return {
		
			DATE : {
				name : 'Date',
				description : 'Blank, format string or {"format": "MM/dd/yyyy", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'format');
					if (!obj)
						throw "Error in validation!";
					
					var val = Value.replace(/[^0-9]/g, "/"); // replace any separators with /
					val = Utilities.ReplaceAll(val, "//", "/"); // get rid of all double pipes
					
					try {
						obj.format = obj.format || "MM/dd/yyyy";
						
						if (val.indexOf("/") == -1) {
							switch (val.length) {
							case 1: // 6 - 4/6/03
								var d = new Date().moveToFirstDayOfMonth().addDays(parseInt(val) - 1);
								val = d.toString(obj.format);
								break;
							case 2: // 26 - 2/6/03 or 4/26/03
								var d = new Date(),
									i = parseInt(val) - 1,
									t = d.getDate() - 1;
								if (i <= t)
									d = d.moveToFirstDayOfMonth().addDays(i);
								else
									d.set({month: parseInt(val.charAt(0)) - 1, day: parseInt(val.charAt(1))});
								val = d.toString(obj.format);
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
						var p = obj.format != "MM/dd/yyyy" ? obj.format : null;
						if (!Utilities.IsDate(val, p))
							throw "The date must be a valid date in '" + obj.format.toUpperCase() + "' format";

						var d = new Date.parse(val);
						val = executeCallback(obj.pass, d.toString(obj.format), dtype);
						return val;
					} catch(err) {
						val = executeCallback(obj.fail, val, dtype);
						throw obj.message || "Only floating decimal point numbers are accepted";
					}
				}
			},
			EMAIL : {
				name : 'Email address',
				description : 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'param');
					if (!obj)
						throw "Error in validation!";
					
					var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
					if (re.test(Value)) {
						Value = executeCallback(obj.pass, Value, dtype);
						return Value;
					} else {
						Value = executeCallback(obj.fail, Value, dtype);
						throw obj.message || "The email address is invalid";
					}
				}
			},
			EMAILS : {
				name : 'Email address list',
				description : 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'param');
					if (!obj)
						throw "Error in validation!";
					
					Value = Value.replace(/ /g, '').replace(/,/g, ';');
					var re = /^(([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,63}))((;(([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,63})))*)(;{0,1})$/;
					if (re.test(Value)) {
						Value = executeCallback(obj.pass, Value, dtype);
						return Value;
					} else {
						Value = executeCallback(obj.fail, Value, dtype);
						throw obj.message || "The email address list is invalid";
					}
				}
			},
			EQUAL : {
				name : 'Equal-to',
				description : 'Value of selected type, or {"value": "50", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'value');
					if (!obj)
						throw "Error in validation!";
					
					var v = Convert(Value, dtype),
						p = Convert(obj.value, dtype);
					if (v == p) {
						Value = executeCallback(obj.pass, Value, dtype);
						return Value;
					} else {
						Value = executeCallback(obj.fail, Value, dtype);
						throw obj.message || "The values are not equal";
					}
				}
			},
			FLOAT : {
				name : 'Floating-point number',
				description : 'Blank, number of digits, or {"digits": "2", "trailingZeros": "true", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'digits');
					if (!obj)
						throw "Error in validation!";
					
					try {
						var v = Value.replace(/[^0-9\.-]/g, ""); // replace any non-numeric characters
						if (!v.length)
							throw '!';
						
						var p = Convert(v, "FLOAT");
						if (isNaN(p))
							throw '!';
						
						//param: blank = default 2 digits, 3 = # of digits, or { "digits": 3, "trailingZeros": true/false }
						Value = p.toFixed(obj.digits || 2);
						if (!/(0|false)/i.test(obj.trailingZeros))
							Value = executeCallback(obj.pass, Value, dtype);
						else
							Value = executeCallback(obj.pass, parseFloat(Value), dtype);
						
						return Value;
					} catch(err) {
						Value = executeCallback(obj.fail, Value, dtype);
						throw obj.message || "Only floating decimal point numbers are accepted";
					}
				}
			},
			GREATERTHAN : {
				name : 'Greater-than',
				description : 'Value of selected type, or {"value": "50", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'value');
					if (!obj)
						throw "Error in validation!";
					
					var v = Convert(Value, dtype),
						p = Convert(obj.value, dtype);
					if (v > p) {
						Value = executeCallback(obj.pass, Value, dtype);
						return Value;
					} else {
						Value = executeCallback(obj.fail, Value, dtype);
						throw obj.message || Display(v, dtype) + " must be greater than " + Display(p, dtype);
					}
				}
			},
			GREATERTHANEQUALS : {
				name : 'Greater-than-or-equal-to',
				description : 'Value of selected type, or {"value": "50", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'value');
					if (!obj)
						throw "Error in validation!";
					
					var v = Convert(Value, dtype),
						p = Convert(obj.value, dtype);
					if (v >= p) {
						Value = executeCallback(obj.pass, Value, dtype);
						return Value;
					} else {
						Value = executeCallback(obj.fail, Value, dtype);
						throw obj.message || Display(v, dtype) + " must be greater than or equal to " + Display(p, dtype);
					}
				}
			},
			INTEGER : {
				name : 'Integer',
				description : 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'param');
					if (!obj)
						throw "Error in validation!";
					
					try {
						var v = Value.replace(/[^0-9\.-]/g, ""); // replace any non-numeric characters
						if (!v.length)
							throw '!';
						
						var p = Convert(v, "INTEGER");
						if (isNaN(p))
							throw '!';
						
						Value = executeCallback(obj.pass, p.toString(), dtype);
						return Value;
					} catch(err) {
						Value = executeCallback(obj.fail, Value, dtype);
						throw obj.message || "Only integer values are accepted";
					}
				}
			},
			LESSTHAN : {
				name : 'Less-than',
				description : 'Value of selected type, or {"value": "50", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'value');
					if (!obj)
						throw "Error in validation!";
					
					var v = Convert(Value, dtype),
						p = Convert(obj.value, dtype);
					if (v < p) {
						Value = executeCallback(obj.pass, Value, dtype);
						return Value;
					} else {
						Value = executeCallback(obj.fail, Value, dtype);
						throw obj.message || Display(v, dtype) + " must be less than " + Display(p, dtype);
					}
				}
			},
			LESSTHANEQUALS : {
				name : 'Less-than-or-equal-to',
				description : 'Value of selected type, or {"value": "50", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'value');
					if (!obj)
						throw "Error in validation!";
					
					var v = Convert(Value, dtype),
						p = Convert(obj.value, dtype);
					if (v <= p) {
						Value = executeCallback(obj.pass, Value, dtype);
						return Value;
					} else {
						Value = executeCallback(obj.fail, Value, dtype);
						throw obj.message || Display(v, dtype) + " must be less than or equal to " + Display(p, dtype);
					}
				}
			},
			PHONE : {
				name : 'Phone number',
				description : 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'param');
					if (!obj)
						throw "Error in validation!";
					
					var val = Value.replace(/x/g, "|"); // extensions will almost always contain the letter x, so replace x with |
					val = val.replace(/[^0-9|]/g, "");
					var ext = "",
						i = val.lastIndexOf("|");
					if (i > -1) {
						ext = val.substring(i + 1);
						val = val.substring(0, i);
					}

					switch (val.length) {
						case 7:
							val = val.substring(0, 3) + "-" + val.substring(3);
							break;
						case 10:
							val = "(" + val.substring(0, 3) + ") " + val.substring(3, 6) + "-" + val.substring(6);
							break;
						case 11:
							val = val.substring(0, 1) + " (" + val.substring(1, 4) + ") " + val.substring(4, 7) + "-" + val.substring(7);
							break;
						default:
							val = executeCallback(obj.fail, val, dtype);
							throw obj.message || "The phone number is invalid";
					}
					
					if (ext.length)
						val += " x " + ext;

					val = executeCallback(obj.pass, val, dtype);
					return val;
				}
			},
			SSN : {
				name : 'Social security number',
				description : 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'param');
					if (!obj)
						throw "Error in validation!";
					
					var val = Value.replace(/[^0-9]/g, ""); // remove any non-numeric characters
					if (val.length == 9)
						val = val.substring(0, 3) + "-" + val.substring(3, 5) + "-" + val.substring(5);
					
					var re = /^[0-9]{3}[\- ]?[0-9]{2}[\- ]?[0-9]{4}$/;
					if (re.test(val)) {
						val = executeCallback(obj.pass, val, dtype);
						return val;
					} else {
						val = executeCallback(obj.fail, val, dtype);
						throw obj.message || "The social security number is invalid";
					}
				}
			},
			FEIN : {
				name : 'Federal employer ID',
				description : 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'param');
					if (!obj)
						throw "Error in validation!";
					
					var val = Value.replace(/[^0-9]/g, ""); // remove any non-numeric characters
					if (val.length == 9)
						val = val.substring(0, 2) + "-" + val.substring(2);

					var re = /^[0-9]{2}[\- ]?[0-9]{7}$/;
					if (re.test(val)) {
						val = executeCallback(obj.pass, val, dtype);
						return val;
					} else {
						val = executeCallback(obj.fail, val, dtype);
						throw obj.message || "The federal employer identification number is invalid";
					}
				}
			},
			DLN : {
				name : 'Driver license number',
				description : 'state string, jQuery selector for input/select, or {"state":"FL/#input", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'state');
					if (!obj)
						throw "Error in validation!";
					
					var val = Value,
						st = obj.state;
					if (st.length != 2)
						st = $(st).val();
					st = st.toUpperCase();
					
					var stObj = dlStates[st];
					if (!stObj)
						stObj = dlStates.default;

					var re = new RegExp(stObj.rule, 'i');
					if (re.test(val)) {
						val = executeCallback(obj.pass, val, dtype);
						return val;
					} else {
						val = executeCallback(obj.fail, val, dtype);
						throw obj.message || "The driver license number is invalid";
					}
				}
			},
			STATE : {
				name : 'State postal code',
				description : 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'param');
					if (!obj)
						throw "Error in validation!";
					
					var val = Value.toUpperCase();
					try {
						if (val == "INT")
							return val;
						var _exp = /[A-Z]{2}/g;
						if (!_exp.test(val))
							throw "The state code must be two letters";
						var states = "AL AK AZ AR CA CO CT DC DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR VI GU";
						_exp = new RegExp(val, "g");
						if (states.search(_exp) == -1)
							throw "The state code is invalid";

						val = executeCallback(obj.pass, val, dtype);
						return val;
					} catch(err) {
						val = executeCallback(obj.fail, val, dtype);
						throw obj.message || err.message;
					}
				}
			},
			TIME : {
				name : 'Time',
				description : 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'param');
					if (!obj)
						throw "Error in validation!";
					
					var val = Value.toUpperCase();
					try {
						val = val.replace(/[^0-9AM:PM]/g, "");

						var end;
						if (val.indexOf("AM") > -1)
							end = "AM";
						else if (val.indexOf("PM") > -1)
							end = "PM";
						if (!end)
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
						
						val = executeCallback(obj.pass, h + ":" + m + " " + end, dtype);
						return val;
					} catch(err) {
						val = executeCallback(obj.fail, val, dtype);
						throw obj.message || err.message;
					}
				}
			},
			ZIPCODE : {
				name : 'ZIP code',
				description : 'Blank or {"message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'param');
					if (!obj)
						throw "Error in validation!";
					
					var val = Value.replace(/[^0-9]/g, ""); // replace any non-numeric characters
					switch (val.length) {
					case 5:
						val = executeCallback(obj.pass, val, dtype);
						break;
					case 9:
						val = executeCallback(obj.pass, val.substring(0, 5) + "-" + val.substring(5), dtype);
						break;
					default:
						val = executeCallback(obj.fail, val, dtype);
						throw obj.message || "The ZIP code must be 5 or 9 digits for zip + 4 codes";
					}
					return val;
				}
			},
			PASSWORD : {
				name : 'Password',
				description : 'Blank or {"pass": "CustomScript.pass"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'param');
					if (!obj)
						throw "Error in validation!";
					
					Value = executeCallback(obj.pass, Value, dtype);
					return Value;
				}
			},
			MONEY : {
				name : 'Monetary value (money)',
				description : 'Blank or {"message": "Failed!", "focus": "CustomScript.focus", "blur": "CustomScript.blur"}',
				filter : {
					attach : function ($element, dtype, param) {
						var obj = Utilities.ConvertToJSONObject(param, 'param');
						if (!obj)
							throw "Error in validation!";
						
						var v1 = Formatting.formatFieldAsMoney($element);
						var v2 = Formatting.stripNonNumericalCharacters(v1);
						
						//LK 10/6/2014: submit-value replaced for submit-type!
						$element.data('submit-value', v2);
						$element.data('submit-type', 'MONEY');

						$element.bind('focus.money-filter', function () {
							var v1 = $element.val(),
								v2;
							
							if (obj.focus)
								v2 = executeCallback(obj.focus, v1, dtype, $element);
							else
								v2 = Formatting.stripNonNumericalCharacters(v1);
							
							if (v1 != v2)
								$element.val(v2);
							$element.data('submit-value', v2);
						});
						$element.bind('blur.money-filter', function () {
							var v1, v2;

							if (obj.blur) {
								v1 = $element.val();
								v2 = executeCallback(obj.blur, v1, dtype, $element);
							} else {
								v1 = Formatting.formatFieldAsMoney($element);
								v2 = Formatting.stripNonNumericalCharacters(v1);
							}

							$element.data('submit-value', v2);
						});
					},
					detach : function ($element, dtype, param) {
						$element.unbind('.money-filter');
					}
				}
			},
			CUSTOMEXPRESSION : {
				name : 'Custom expression',
				description : '^[A-z]+$ or {"pattern": "^[A-z]+$", "modifiers": "ig", "message": "Failed!", "pass": "CustomScript.pass", "fail": "CustomScript.fail"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'pattern');
					if (!obj || !obj.pattern)
						throw "Wrong validation expression pattern!";
						
					var exp = new RegExp(obj.pattern, obj.modifiers);
					if (exp.test(Value)) {
						Value = executeCallback(obj.pass, Value, dtype);
						return Value;
					} else {
						Value = executeCallback(obj.fail, Value, dtype);
						throw obj.message || "The information is formatted incorrectly";
					}
				}
			},
			CUSTOMFUNCTION : {
				name : 'Custom function',
				description : 'CustomScript.myValFn or {"function": "CustomScript.myValFn"}',
				filter : function (Value, dtype, param) {
					var obj = Utilities.ConvertToJSONObject(param, 'function');
					if (!obj || !obj.function)
						throw "Missing validation function!";

					var fn = obj.function.replace(/[\(\)\;]/g, ''),
						val = executeCallback(fn, Value, dtype);
					return val;

					/* LK: Old and unsafe
					var val = Value.replace(/"/g, '\\"'),
						fn = param.replace(/[\(\)\;]/g, '') + '("' + val + '", "' + dtype + '")';
					return eval(fn);
					*/
				}
			}
		};
	}());
	
	return Validator;
});

define('AjaxTab', [], function () {
	//A placeholder for all bottom tabs
	var AjaxTab = new function (undefined) {
		try {

			/* PRIVATE PROPERTIES */
			var logClassName = "AjaxTab.",
				_ajaxDiv = null,
				_ajaxTab,
				_location,
				_wrapper,
				_cmdDiv = null,
				_resDiv = null,
				_itemId = 0,
				_lastRequest = "",			// the last request sent to stingray
				_lastResponse = "",			// the last response sent from stingray
				_config;
			
			/* PRIVATE METHODS */

			function iLog(Place, Message, Type, Silent) {
				Log.Add(logClassName + Place, Message, Type, Silent);
			}
			function Clear() {
				try {
					_itemId = 0;
					
					_cmdDiv.find("div").remove();
					_resDiv.find("div").remove();
				} catch (err) {
					iLog("Clear", err, Log.Type.Error);
				}
			}
			// Sets different background of clicked Ajax item
			function SetBackground(div) {
				try {
					iLog("SetBackground", "Called");
					
					var id = $(div).attr("iID");
					_cmdDiv.find("div[iID='" + id + "']").css("background-color", "#ddd");
					_resDiv.find("div[iID='" + id + "']").css("background-color", "#ddd");
				} catch (err) {
					iLog("SetBackground", err, Log.Type.Error);
				}
			}
			// Resets all Commands/Responses Ajax backgrounds
			function ResetBackgrounds() {
				try {
					iLog("ResetBackgrounds", "Called");
					
					_cmdDiv.find("div").css("background-color", "#fff");
					_resDiv.find("div").css("background-color", "#fff");
				} catch (err) {
					iLog("ResetBackgrounds", err, Log.Type.Error);
				}
			}
			// Remove the oldest records to preserve system resources
			function EnsureLimit() {
				if (_itemId > 10 && (_itemId % 5) == 0) {
					_cmdDiv.find("div:lt(5)").remove();
					_resDiv.find("div:lt(5)").remove();
				}
			}
			function InitConfig() {
				_config = MP.Tools.Config.Editor.tabs.ajax;
				if (!_config.size) {
					_config.size = {
						width: 600,
						height: 400
					};
				};
			}
			function UpdateButtons() {
				if (AjaxTab.Enabled)
					_ajaxDiv.dialog( "option", "title", "Ajax viewer");
				else
					_ajaxDiv.dialog( "option", "title", "Ajax viewer - Disabled");
				
				var bp = $(".ui-dialog-buttonpane", _ajaxDiv.parent());
				var FindBtn = function(caption) {
					return $("button:contains(" + caption + ")", bp);
				};
				
				if (AjaxTab.Enabled)
					FindBtn('Enable').html("Disable");
				else
					FindBtn('Disable').html("Enable");
				
				if (_config.pinned)
					FindBtn('Pin').html("Unpin");
				else
					FindBtn('Unpin').html("Pin");
				
				if (_location == _ajaxTab)
					FindBtn('Tab View').html("View Here");
				else
					FindBtn('View Here').html("Tab View");
			}

			return {
			
				/* PUBLIC PROPERTIES */
				Enabled : false,
				Initialized : false,

				/* PUBLIC METHODS */
				
				// Adds new item into Commands Ajax tab
				AddCommand : function (data) {
					try {
						_lastRequest = data;
						
						// To preserve performance do not do anything if disabled or hidden
						if (!this.Enabled || !_wrapper.is(':visible'))
							return;

						EnsureLimit();
						_itemId++;
						var time = "<span class='time'>[" + _itemId + "] " + Utilities.GetFormattedTime() + "</span> <br/>";
						var div = $("<div/>");
						div.attr("iID", _itemId);
						div.text(data);
						div.prepend(time);
						div.addClass("item");
						div.click(function () {
							ResetBackgrounds();
							SetBackground(this);
						});
						_cmdDiv.append(div);
					} catch (err) {
						iLog("AddCommand", err, Log.Type.Error, true);
					}
				},
				// Adds new item into Responses Ajax tab
				AddResponse : function (data, msg) {
					try {
						_lastResponse = data;
						
						// To preserve performance do not do anything if disabled or hidden
						if (!this.Enabled || !_wrapper.is(':visible'))
							return;
						
						var code = $(data).find("stingray>errorcode").text();
						if (code == "0101")
							data = "An empty response due empty callback";
						else {
							data = Utilities.GetXmlString(data);
							if (msg)
								data = msg + '\n' + data;
						};

						var time = "<span class='time'>[" + _itemId + "] " + Utilities.GetFormattedTime() + "</span> <br/>";
						var div = $("<div/>");
						div.attr("iID", _itemId);
						div.text(data);
						div.prepend(time);
						div.addClass("item");
						div.click(function () {
							ResetBackgrounds();
							SetBackground(this);
						});
						_resDiv.append(div);
					} catch (err) {
						iLog("AddResponse", err, Log.Type.Error, true);
					}
				},
				ClearTab : function () {
					if (!this.Initialized)
						return;

					iLog("ClearTab", "Called");
					Clear();
				},
				Show : function (activate) {
					if (!this.Initialized)
						return;
					
					_ajaxDiv.dialog("open");
					if (activate && !this.Enabled)
						this.Switch();
				},
				Hide : function () {
					if (this.Initialized)
						_ajaxDiv.dialog("close");
				},
				Switch : function () {
					this.Enabled = !this.Enabled;
					
					UpdateButtons();
					
					if (_itemId == 0) {
						this.AddCommand(_lastRequest);
						this.AddResponse(_lastResponse);
					};
				},		
				Pin : function (value) {
					if (value == undefined)
						_config.pinned = !_config.pinned;
					else
						_config.pinned = value;
					
					UpdateButtons();
					
					if (_config.pinned) {
						$(window).bind('scroll.pinAjaxDiv', function () {
							var p = _ajaxDiv.parent();
							if (p.is(":visible"))
								p.css('top', (_ajaxDiv.data('lastTop') + $(document).scrollTop()) + "px");
						});
					} else {
						$(window).unbind('scroll.pinAjaxDiv');
					}
				},
				MoveTo : function (value) {
					if (!value)
						value = (_location == _ajaxDiv) ? 'tab' : 'float';
					else
						value = value.toLowerCase();
					_config.viewStyle = value;
					
					var div = _wrapper.detach();
					var msg = 'This view is inactive. You can either <a class="activateViewLink">activate this view</a> or <a class="goToViewLink">go to the other view</a>.';
					
					if (value == 'tab') {
						_location = _ajaxTab;
						this.Hide();
						_ajaxDiv.html(msg);
						_ajaxDiv.find('.activateViewLink').bind('click', function() {
							AjaxTab.MoveTo("float");
						});
						_ajaxDiv.find('.goToViewLink').bind('click', function() {
							AjaxTab.Hide();
							Global.ScrollToElement($('#AjaxLink'));
						});
						_ajaxTab.html('');
						div.appendTo(_ajaxTab);
						if (this.Initialized)
							Global.ScrollToElement($('#AjaxLink'));
					} else {
						_location = _ajaxDiv;
						_ajaxTab.html(msg);
						_ajaxTab.find('.activateViewLink').bind('click', function() {
							AjaxTab.MoveTo("tab");
						});
						_ajaxTab.find('.goToViewLink').bind('click', function() {
							AjaxTab.Show();
							Global.ScrollToElement(_ajaxDiv.parent());
						});
						_ajaxDiv.html('');
						div.appendTo(_ajaxDiv);
					}
					
					UpdateButtons();
				},
				Initialize : function () {
					try {
						if (!MP.Tools.Config.ajaxEnabled || this.Initialized)
							return;					
						iLog("Initialize", "Called");
						
						InitConfig();
						
						// This dialog is being reused and so should be created only once!
						_ajaxTab = $('#AjaxTab');
						_ajaxDiv = $('#AjaxDiv');
						if (!_ajaxDiv.length)
							_ajaxDiv = $('<div id="AjaxDiv" style="text-align: left;"><div class="toolWrapper"><div id="Commands"/><div id="Responses"/></div></div>');
							
						_cmdDiv = _ajaxDiv.find("#Commands");
						_resDiv = _ajaxDiv.find("#Responses");
						_wrapper = _ajaxDiv.find(".toolWrapper");
						_location = _ajaxDiv;

						var btns = {
							'Clear' : function () {
								AjaxTab.ClearTab();
							},
							'Enable' : function () {
								AjaxTab.Switch();
							},
							'Pin' : function () {
								AjaxTab.Pin();
							},
							'Tab View' : function () {
								AjaxTab.MoveTo();
							}
						};
						_ajaxDiv.dialog({
							width : _config.size.width,
							height : _config.size.height,
							position : [_config.position.left, _config.position.top],
							minWidth : 300,
							minHeight : 200,
							autoOpen : false,
							closeOnEscape : false,
							modal : false,
							buttons : btns,
							dialogClass : "aboveSpinner",
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
								Global.UpdateLastPosition(_ajaxDiv, ui);
							},
							open: function(event) {
								UpdateButtons();
								
								if (_ajaxDiv.data('lastLeft') && _ajaxDiv.data('lastTop')) {
									_ajaxDiv.dialog("option", {
										position: [_ajaxDiv.data('lastLeft'), _ajaxDiv.data('lastTop')]
									});
								} else {
									Global.UpdateLastPosition(_ajaxDiv);
								}
							}
						});

						this.MoveTo(_config.viewStyle);
						this.Pin(_config.pinned || false);
						this.Initialized = true;
					} catch (err) {
						iLog("Initialize", err, Log.Type.Error);
					}
				}
			};
		
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	return AjaxTab;
});

/*
 Classes and functions to handle ReqList
*/
define('ReqList', ['Utilities'], function (Utilities) {
	var ReqList = new function (undefined) {
		try {

			/* PRIVATE PROPERTIES */
			var logClassName = "ReqList.",
				_reqDiv = null,
				_reqTab,
				_location,
				_wrapper,
				_reqTable = null,
				_reqID = 0,
				_lastReqList = "",			// the last RL sent from stingray
				_lastVrmName = "",
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
				if (_reqTable)
					_reqTable.empty().remove();
				_reqTable = $('<table class="ReqList"><tr><th>ID</th><th>Name</th><th>Value</th></tr></table>');
				_wrapper.append(_reqTable);
			}
			function AddVarOfName(name) {
				if (!_config.filterVars)
					return true;
				
				var arr = _config.filter.split(" ");
				for (var i = 0; i < arr.length; i++) {
					var re = new RegExp(arr[i], "i");
					if (name.search(re) > -1)
						return true;
				};
				return false;
			}
			// Shows the entire ReqList in HTML table			
			function Display(rlNode, vrmName, xml) {
				try {
					if (!rlNode)
						return;
					if ($.inArray(vrmName, ReqList.ExcludeVRMs) > -1)
						return;
					iLog("Display", "Called");
					
					// Cache last valid RL
					var firstRL = Communication.InitialRequest;
					if (firstRL) {
						_lastReqList = xml;
						_lastVrmName = vrmName;
					};
						
					// To preserve performance do not do anything if disabled or hidden
					if (!ReqList.Enabled || !_wrapper.is(':visible'))
						return;

					if (firstRL) {
						if (!_config.showAll)
							Clear();
						ReqList.Add('VRM-PG', vrmName);
					} else {
						ReqList.Add('VRM-PG', vrmName);
						if (!_config.showAll)
							return;
					};
					
					var s = $(rlNode).text();
					var arr = s.split(/\|{2}/g);
					for (var i = 0; i < arr.length; i++) {
						var m = arr[i],
							b = m.indexOf("="),
							name = m.substring(0, b),
							val = m.substring(b + 1);
						
						if (AddVarOfName(name))
							ReqList.Add(name, val);
					};
					
					EnsureLimit();
					if (!_config.filterVars)
						ReqList.FilterBy();
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
					FindBtn('All VRMs').html("1st VRM").attr('title', 'Click here to display ReqList of the initial response only.');
				else
					FindBtn('1st VRM').html("All VRMs").attr('title', 'Click here to display ReqList of all responses.');
				
				if (_config.filterVars)
					FindBtn('Filter ON').html("Filter OFF").attr('title', 'Click here to hide filtered variables allowing their recovery within less ReqLists.');
				else
					FindBtn('Filter OFF').html("Filter ON").attr('title', 'Click here to permanently remove filtered variables allowing more ReqLists to be shown.');
				
				var s = '';
				if (ReqList.Enabled) {
					s = s + (_config.filterVars ? ' - Filter ON' : '');
					s = s + (_config.showAll ? '' : ' - 1st VRM Only');
				} else {
					s = " - Disabled";
				};
				_reqDiv.dialog( "option", "title", "ReqList viewer" + s);
			}

			return {
			
				Enabled : false,
				Initialized : false,
				ExcludeVRMs : ['ICONTRAY'],
				
				// Gets the HTML of the Table element
				GetList : function () {
					if (_lastReqList)
						return Utilities.GetXmlString(_lastReqList);
					else
						return "No ReqList";
				},
				// Loads RL from xml - The XML of the entire response which may or may not contain a RL
				Load : function (xml) {
					try {
						if (!this.Initialized || !xml)
							return;
						iLog("Load", "Called");
						
						var sr = $(xml).find("stingray");
						
						// Do not display RL of empty callbacks
						var code = sr.find("errorcode").text();
						if (code == "0101")
							return;

						var vrm = sr.find("vrmname").text();
						var rl = sr.find("reqlist");
						Display(rl, vrm, xml);
					} catch (err) {
						iLog("Load", err, Log.Type.Error, true);
					}
				},
				Add : function (name, value) {
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
				ClearTab : function () {
					if (!this.Initialized)
						return;
					iLog("ClearTab", "Called");
					
					Clear();
				},
				Show : function (activate) {
					if (!this.Initialized)
						return;
					
					_reqDiv.dialog("open");
					if (activate && !this.Enabled)
						this.Switch();
				},
				Hide : function () {
					if (!this.Initialized)
						return;
					
					_reqDiv.dialog("close");
				},
				Switch : function () {
					this.Enabled = !this.Enabled;
					
					UpdateButtons();
					
					if (_reqID == 0)
						this.Load(_lastReqList);
				},		
				Pin : function (value) {
					if (value == undefined)
						_config.pinned = !_config.pinned;
					else
						_config.pinned = value;
					
					UpdateButtons();
					
					if (_config.pinned) {
						$(window).bind('scroll.pinReqListDiv', function () {
							var p = _reqDiv.parent();
							if (p.is(":visible"))
								p.css('top', (_reqDiv.data('lastTop') + $(document).scrollTop()) + "px");
						});
					} else {
						$(window).unbind('scroll.pinReqListDiv');
					}
				},
				MoveTo : function (value) {
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
							Global.ScrollToElement($('#ReqListLink'));
						});
						_reqTab.html('');
						div.appendTo(_reqTab);
						if (this.Initialized)
							Global.ScrollToElement($('#ReqListLink'));
					} else {
						_location = _reqDiv;
						_reqTab.html(msg);
						_reqTab.find('.activateViewLink').bind('click', function() {
							ReqList.MoveTo("tab");
						});
						_reqTab.find('.goToViewLink').bind('click', function() {
							ReqList.Show();
							Global.ScrollToElement(_reqDiv.parent());
						});
						_reqDiv.html('');
						div.appendTo(_reqDiv);
					}
					
					UpdateButtons();
				},
				ShowWhat : function (value) {
					if (value == undefined)
						_config.showAll = !_config.showAll;
					else
						_config.showAll = value;
					
					UpdateButtons();
				},
				FilterVars : function (value) {
					if (value == undefined)
						_config.filterVars = !_config.filterVars;
					else
						_config.filterVars = value;
					
					UpdateButtons();
				},
				Initialize : function () {
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
							'Clear' : function () {
								ReqList.ClearTab();
							},
							'Enable' : function () {
								ReqList.Switch();
							},
							'Pin' : function () {
								ReqList.Pin();
							},
							'Tab View' : function () {
								ReqList.MoveTo();
							},
							'All VRMs' : function () {
								ReqList.ShowWhat();
							},
							'Filter OFF' : function () {
								ReqList.FilterVars();
							}
						};
						_reqDiv.dialog({
							width : _config.size.width,
							height : _config.size.height,
							position : [_config.position.left, _config.position.top],
							minWidth : 380,
							minHeight : 200,
							autoOpen : false,
							closeOnEscape : false,
							modal : false,
							buttons : btns,
							dialogClass : "aboveSpinner",
							resizeStart: function() {
								Global.DisableHighlightingInChrome(true);
							},
							resizeStop: function() {
								Global.DisableHighlightingInChrome(false);
							},
							dragStart: function() {
								Global.DisableHighlightingInChrome(true);
							},
							dragStop: function( event, ui ) {
								Global.DisableHighlightingInChrome(false);
								Global.UpdateLastPosition(_reqDiv, ui);
							},
							open: function( event ) {
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
							.bind('keyup', function(event) {
								ReqList.UpdateFilter(event.target.value);
								ReqList.FilterBy();
							});
						
						Clear();
						
						this.MoveTo(_config.viewStyle);
						this.Pin(_config.pinned || false);
						this.Initialized = true;
					} catch (err) {
						iLog("Initialize", err, MP.Types.Log.Error);
					}
				},
				UpdateFilter : function (nameList) {
					var s = $.trim(nameList);
					s = Utilities.RemoveWhiteSpaces(s);
					_config.filter = s;
				},
				FilterBy : function() {
					try {
						iLog("FilterBy", "Called: " + _config.filter);
						
						var rows = _reqTable.find("tr td.name").parent();
						if (!_config.filter) {
							rows.show();
						} else {
							var arr = _config.filter.split(" ");
							for (var r = 0; r < rows.length; r++) {
								var tr = $(rows[r]);
								var name = tr.find("td.name").text();
								var found = name == 'VRM-PG';

								if (!found) {
									for (var i = 0; i < arr.length; i++) {
										var re = new RegExp(arr[i], "i");
										if (name.search(re) > -1) {
											found = true;
											break;
										};
									};
								};
								if (found)
									tr.show()
								else
									tr.hide();
							};
						};
					} catch (err) {
						iLog("FilterBy", err, Log.Type.Error, true);
					}
				}
			};
		
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	return ReqList;
});

/*
 WatchLists with dumped reqlist changes on set watchpoints
*/
define('WatchList', ['Utilities'], function (Utilities) {
	var WatchList = new function (undefined) {
		try {

			/* PRIVATE PROPERTIES */
			var logClassName = "WatchList.",
				_reqDiv = null,
				_reqTab,
				_location,
				_wrapper,
				_reqTable = null,
				_reqID = 0,
				_lastReqList = "",			// the last WL sent from stingray
				_lastVrmName = "",
				_config;
			
			function iLog(Place, Message, Type, Silent) {
				Log.Add(logClassName + Place, Message, Type, Silent);
			}
			function Entry(name, value, newBP) {
				this.NewBP = newBP;
				this.Name = name;
				this.Value = value;
			}
			function FormatEntry(ent) {
				var le = $("<tr/>");
				if (ent.NewBP) {
					_reqID = 0;
					le.append("<td class='wpIndex'></td>");
					le.append("<td class='wpName'></td>");
					le.append("<td class='wpValue'>" + ent.Value + "</td>");
				} else {
					_reqID++;
					le.append("<td class='index'>" + _reqID + "</td>");
					le.append("<td class='name'>" + ent.Name + "</td>");
					le.append("<td class='value'><code class='ReqList'/></td>");
					le.find("code").text(ent.Value);
				};
				return le;
			}
			function Clear() {
				_reqID = 0;
				if (_reqTable)
					_reqTable.empty().remove();
				_reqTable = $('<table class="ReqList"><tr><th>ID</th><th>Name</th><th>Value</th></tr></table>');
				_wrapper.append(_reqTable);
			}
			function Add(name, value, newBP) {
				try {
					var e = new Entry(name, value, newBP);
					_reqTable.append(FormatEntry(e));
				} catch (err) {
					iLog("Add", err, Log.Type.Error);
				}
			}
			function Display(wlNode, vrmName, xml) {
				try {
					if (!wlNode)
						return false;
					iLog("Display", "Called");
					
					var s = $(wlNode).text();
					if (!s)
						return false;
					var arr = $.parseJSON(s);
					if (arr.length == 0)
						return false;

					// Cache last valid WL
					_lastReqList = xml;
					_lastVrmName = vrmName;

					// To preserve performance do not do anything if disabled or hidden
					if (!WatchList.Enabled || !_wrapper.is(':visible'))
						return false;

					Clear();
					for (var i = 0; i < arr.length; i++) {
						var bp = arr[i];						
						Add("", bp.n, true);
						
						for (var y = 0; y < bp.v.length; y++) {
							var rl = bp.v[y];
							Add(rl.n, rl.v, false);
						};
					};
					return true;
				} catch (err) {
					iLog("Display", err, Log.Type.Error);
				}
			}
			function InitConfig() {
				_config = MP.Tools.Config.Editor.tabs.watchList;
				if (!_config.size) {
					_config.size = {
						width: 600,
						height: 400
					};
				};
			}
			function UpdateButtons() {
				if (WatchList.Enabled)
					_reqDiv.dialog( "option", "title", "WatchList viewer");
				else
					_reqDiv.dialog( "option", "title", "WatchList viewer - Disabled");
				
				var bp = $(".ui-dialog-buttonpane", _reqDiv.parent());
				var FindBtn = function(caption) {
					return $("button:contains(" + caption + ")", bp);
				};
				
				if (WatchList.Enabled)
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
			}

			return {
			
				Enabled : false,
				Initialized : false,
				
				// Gets the HTML of the Table element
				GetList : function () {
					if (_lastReqList)
						return Utilities.GetXmlString(_lastReqList);
					else
						return "No WatchList";
				},
				// Loads WL from xml - The XML of the entire response which may or may not contain a WL
				Load : function (xml) {
					try {
						if (!this.Initialized || !xml)
							return;
						iLog("Load", "Called");
						
						var sr = $(xml).find("stingray");
						var vrm = sr.find("vrmname").text();
						var wl = sr.find("watchlist");
						
						if (Display(wl, vrm, xml))
							this.AutoFilter();
					} catch (err) {
						iLog("Load", err, Log.Type.Error, true);
					}
				},
				ClearTab : function () {
					if (!this.Initialized)
						return;
					iLog("ClearTab", "Called");
					
					Clear();
				},
				Show : function (activate) {
					if (!this.Initialized)
						return;
					
					_reqDiv.dialog("open");
					if (activate && !this.Enabled)
						this.Switch();
				},
				Hide : function () {
					if (this.Initialized)
						_reqDiv.dialog("close");
				},
				Switch : function () {
					this.Enabled = !this.Enabled;
					
					UpdateButtons();
					
					if (_reqID == 0)
						this.Load(_lastReqList);
				},		
				Pin : function (value) {
					if (value == undefined)
						_config.pinned = !_config.pinned;
					else
						_config.pinned = value;
					
					UpdateButtons();
					
					if (_config.pinned) {
						$(window).bind('scroll.pinWatchListDiv', function () {
							var p = _reqDiv.parent();
							if (p.is(":visible"))
								p.css('top', (_reqDiv.data('lastTop') + $(document).scrollTop()) + "px");
						});
					} else {
						$(window).unbind('scroll.pinWatchListDiv');
					}
				},
				MoveTo : function (value) {
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
							WatchList.MoveTo("float");
						});
						_reqDiv.find('.goToViewLink').bind('click', function() {
							WatchList.Hide();
							Global.ScrollToElement($('#WatchListLink'));
						});
						_reqTab.html('');
						div.appendTo(_reqTab);
						if (this.Initialized)
							Global.ScrollToElement($('#WatchListLink'));
					} else {
						_location = _reqDiv;
						_reqTab.html(msg);
						_reqTab.find('.activateViewLink').bind('click', function() {
							WatchList.MoveTo("tab");
						});
						_reqTab.find('.goToViewLink').bind('click', function() {
							WatchList.Show();
							Global.ScrollToElement(_reqDiv.parent());
						});
						_reqDiv.html('');
						div.appendTo(_reqDiv);
					}
					
					UpdateButtons();
				},
				Initialize : function () {
					try {
						if (!MP.Tools.Config.watchlistEnabled || this.Initialized)
							return;
						iLog("Initialize", "Called");

						InitConfig();
						
						// This dialog is being reused and so should be created only once!
						_reqTab = $('#WatchListTab');
						_reqDiv = $('#WatchListDiv');
						if (!_reqDiv.length)
							_reqDiv = $('<div id="WatchListDiv"><div class="toolWrapper"></div></div>');

						_wrapper = _reqDiv.find(".toolWrapper");
						_location = _reqDiv;
						
						var btns = {
							'Clear' : function () {
								WatchList.ClearTab();
							},
							'Enable' : function () {
								WatchList.Switch();
							},
							'Pin' : function () {
								WatchList.Pin();
							},
							'Tab View' : function () {
								WatchList.MoveTo();
							}
						};
						_reqDiv.dialog({
							width : _config.size.width,
							height : _config.size.height,
							position : [_config.position.left, _config.position.top],
							minWidth : 300,
							minHeight : 200,
							autoOpen : false,
							closeOnEscape : false,
							modal : false,
							buttons : btns,
							dialogClass : "aboveSpinner",
							resizeStart: function() {
								Global.DisableHighlightingInChrome(true);
							},
							resizeStop: function() {
								Global.DisableHighlightingInChrome(false);
							},
							dragStart: function() {
								Global.DisableHighlightingInChrome(true);
							},
							dragStop: function( event, ui ) {
								Global.DisableHighlightingInChrome(false);
								Global.UpdateLastPosition(_reqDiv, ui);
							},
							open: function( event ) {
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
						
						_reqDiv.find('#edWatchListFilter')
							.val(_config.filter)
							.bind('keyup', function(event) {
								var v = event.target.value;
								_config.filter = v;
								WatchList.FilterBy(v);
							});

						Clear();
						
						this.MoveTo(_config.viewStyle);
						this.Pin(_config.pinned || false);
						this.Initialized = true;
					} catch (err) {
						iLog("Initialize", err, Log.Type.Error);
					}
				},
				AutoFilter : function () {
					var s = $("#edWatchListFilter").val();
					if (s)
						this.FilterBy(s);
				},
				FilterBy : function (nameList) {
					try {
						nameList = $.trim(nameList);
						nameList = Utilities.RemoveWhiteSpaces(nameList);
						iLog("FilterBy", "Called: " + nameList);
						
						var rows = _reqTable.find("tr td.name").parent();
						if (!nameList) {
							rows.show();
						} else {
							var arr = nameList.split(" ");
							for (var r = 0; r < rows.length; r++) {
								var tr = $(rows[r]);
								var name = tr.find("td.name").text();
								var found = false;

								$.each(arr, function (idx, itm) {
									var re = new RegExp(itm, "i");
									if (name.search(re) > -1) {
										found = true;
										return;
									};
								});
								if (found)
									tr.show()
								else
									tr.hide();
							};
						};
					} catch (err) {
						iLog("FilterBy", err, Log.Type.Error, true);
					}
				}
			};
		
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	return WatchList;
});

/*
This script provides communication between the server and client
 */
define('Communication', ['page/comp/ValidatorContainer', 'Utilities', 'PageHelper', 'RuleHelper', 'Editor', 'ReqList', 'HtmlEditor', 'ContextMenu', 'VrmScript'], function (Validator, Utilities, PageHelper, RuleHelper, Editor, ReqList, HtmlEditor, ContextMenu, VrmScript) {
	var Communication = new function (undefined) {
		try {
			/* PRIVATE PROPERTIES */
			var vrmEdit = null, // the current xml document
				notifiedTimeout = false, // used for session expiration
				lastDebug = '',
				loggedOut = 'LOGGED OUT';
			
			/* PRIVATE METHODS */

			function iLog(Place, Message, Type, Silent) {
				Log.Add("Comm." + Place, Message, Type, Silent);
			}
			function Request() {
				this.async = true;
				this.cache = false;
				this.initialRequest = false;
				this.method = "POST";
				this.data = null;
				this.id = "";
				this.host = "../../";
				this.template = "";
				this.timeout = 180000;
				this.dataType = "xml";
				this.url = null;
				this.requestType = "";
				this.done = $.noop;
				this.fail = $.noop;
			}
			function GetValueFromURL(url, name) {
				return decodeURIComponent((new RegExp('[?|&]' + name + '=([^&;]+?)(&|#|;|$)', 'i').exec(url) || [,""])[1].replace(/\+/g, '%20')) || null
			}
			//LK: to fix wrong page background caused by stretched footer
			function EnsureFooterSeparator(div) {
				if (!div.find("#FooterSeparator").length)
					div.append("<div id='FooterSeparator'></div>");
			}
			function initAfterLogin(newSess) {
				var oldSess = Communication.SessionID;
				if (newSess) {
					Communication.SessionID = newSess;
					if (!oldSess) {
						// We have a brand new valid session!
						Communication.LinkRequest('icontray.max', 'IconTray', true);
					}
				}
			}
			function UpdateSessionFromURL(url) {
				if (!url)
					return;
				
				initAfterLogin(GetValueFromURL(url, 'id'));
			}
			function UpdateSessionFromXML(xml) {
				if (!xml)
					return;
				
				var sr = $(xml).find("stingray");
				initAfterLogin(sr.find("id").text());

				var dbg = sr.find('debug').text();
				if (dbg && dbg != lastDebug) {
					lastDebug = dbg;
					MP.Tools.ConfigUpdate(dbg);
				};					
				
				var vrm = sr.find('vrmname').text().toLowerCase();
				if (!vrm || $.inArray(vrm, ['na', 'ajax', 'titletop', 'icontray', 'mainfooter', 'topmenu', 'admintabs', 'tablewalker']) > -1)
					return;
				
				if (!Communication.InitialRequest || Communication.VRMName == vrm)
					return;

				Communication.VRMName = vrm;
				MP.Tools.ShowVrmName(vrm);

				var html = sr.find("html").text();
				HtmlEditor.Show(html);
			}
			function UpdateEditorFromXML(xml) {
				if (!xml || !$(xml).length)
					return;
				
				xml = $(xml);
				var root, name, path;

				if (xml.find('stingray')[0] != null) {
					root = xml.find("stingray");
					name = root.find("vrmname").text();
					path = root.find("vrmpath").text();
					if (root.find("status").text() == "success")
						root = root.find("vrm");
				} else {
					root = xml.find('vrm');
					name = root.find('function>fn').text();
				};

				if (name)
					Editor.VRMName = name;
				if (path)
					Editor.VRMPath = path;

				return root;
			}
			// Replaces or adds a cdata section with a new one
			function replaceSection(content, section) {
				try {
					iLog("replaceSection", "Called");
					
					var xml = vrmEdit.context;

					var cdata = xml.createCDATASection(content),
						newNode = xml.createElement(section);
					$(newNode).append(cdata);

					var replace = vrmEdit.find(section)[0];
					if (replace)
						vrmEdit[0].replaceChild(newNode, replace);
					else
						vrmEdit[0].appendChild(newNode);
				} catch (err) {
					iLog("replaceSection", err, Log.Type.Error);
				}
			}
			// Executes a callback if instructed in xml
			function ExecuteCallback(xml) {
				try {
					iLog("ExecuteCallback", "Called");
					
					var cb = $(xml).find('stingray>callback').text();
					if (cb == 1) {
						Communication.SerialRequest($('<div VRMName="callback"/>'), 'CALLBACK');
						iLog("ExecuteCallback", "Requested", Log.Type.Info);
					}
				} catch (err) {
					iLog("ExecuteCallback", err, Log.Type.Error);
				}
			}
			function RemoveOldCKEditors() {
				try {
					for(var id in CKEDITOR.instances) {
						var ed = CKEDITOR.instances[id];
						if (!$('#' + ed.name).length)
							ed.destroy();
					};
				} catch (err) {
					iLog("RemoveOldCKEditors", err, Log.Type.Error);
				}
			}
			function editorUpdate(quickUpdate) {
				Global.ShowProgress();
				
				var doQuick = (quickUpdate) ? "1" : "0",
					lngs = MP.LanguageMgr.Save(),
					htmlPg = HtmlEditor.Save(),
					shScr = VrmScript.Save();
				
				replaceSection(htmlPg, "html");
				replaceSection(lngs, "languages");
				replaceSection(shScr, "scripts");

				// Always clear locked by
				vrmEdit.find('function>lockedBy').text('');

				var toPost = Utilities.GetXmlString(vrmEdit);
				toPost = PageHelper.CleanVrmAfterEditor(toPost);
				
				var request = new Request(),
					vrmCopy = vrmEdit; // keep a copy to prevent loss in case of failure

				request.requestType = "Editor Update Request";
				request.template = "savetemplate.max";
				request.id = Communication.SessionID;
				request.data = "templatename=" + Editor.VRMName + "&path=" + Editor.VRMPath + "&QuickSave=" + doQuick + "&vrm=" + toPost;
				request.onSuccess = function (xml) {
					Global.HideProgress();
					
					var sr = $(xml).find('stingray'),
						status = sr.find('status').text(),
						html = sr.find('html').text();
					if (status == "success") {
						iLog("EditorUpdate", html, Log.Type.Info);

						if (quickUpdate) {
							// Re-enable all editors
							Editor.EnableEditor();
							HtmlEditor.Load();
							RulesMaker.Enable();
						} else {
							// Fully close all the editors
							RulesMaker.Disable();
							ContextMenu.RemoveAll();
							Communication.MakeAllCompsDefault($("#middle"), true, false, false);
							HtmlEditor.Clear(htmlPg);
							Editor.Clear();
							Editor.DisableEditor();
						}
					} else {
						iLog("EditorUpdate", "Failed! " + html, Log.Type.Error, true);

						vrmEdit = vrmCopy;
						
						Editor.EnableEditor();
						HtmlEditor.Load();
						RulesMaker.Enable();
						
						var errComp = sr.find('errorcomponent').text(),
							errProc = sr.find('errorprocess').text();
						RulesMaker.HandleServerError(errProc, errComp, html);
					}
				};
				request.onError = function (msg, xml) {
					iLog("EditorUpdate", "Failed! " + msg, Log.Type.Error, true);
					Global.HideProgress();
					
					vrmEdit = vrmCopy;
					
					Editor.EnableEditor();
					HtmlEditor.Load();
					RulesMaker.Enable();

					Global.ShowErrorMessage("<h3>Update of VRM Page Failed</h3><p>Please diagnose the problem using the information found in the 'Ajax' and 'Logging' tabs.</p>");
				};

				Communication.ProcessRequest(request);
			}

			return {
			
				/* PUBLIC PROPERTIES */
				SessionExpiration : 3600, // Default number of seconds until a session expires
				ShowNotification : 120, // Default seconds before expiration to display the expiration message
				EnableSessionTimer : true, // Defaultly enabled for live, disabled for developer modes
				LastPageTransition : null, // Last time a page is loaded
				VRMName : '',
				SessionID : '',
				InitialRequest : false,
				UserLanguage : '',
				
				/* PUBLIC METHODS */

				// Initiate session timer (called from AppList.OnLoad)
				StartSessionTimer : function (SessExpireInSecs, SessWarningInSecs) {
					iLog("StartSessionTimer", "Called");
					
					if (SessExpireInSecs)
						Communication.SessionExpiration = SessExpireInSecs;
					if (SessWarningInSecs)
						Communication.ShowNotification = SessWarningInSecs;
					setTimeout("Communication.CheckTimeout()", 1000);
				},
				// resets the session timer on every ajax request)
				ResetTimeout : function () {
					iLog("ResetTimeout", "Called");
					
					notifiedTimeout = false;
					Communication.LastPageTransition = new Date();
				},
				SessionOK : function () {
					return Communication.SessionID && Communication.SessionID != loggedOut;
				},
				LogOff : function () {
					iLog("LogOff", "Called");
					
					notifiedTimeout = false;
					Communication.LinkRequest('logoff.max');
					Communication.SessionID = loggedOut;
				},
				// once the message displays this function keeps the time remaining updated every second (
				ShowTimeRemaining : function () {
					if (!notifiedTimeout)
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
				TimeoutDialogClosed : function () {
					if (!notifiedTimeout)
						return;
					iLog("TimeoutDialogClosed", "Called");
					
					Communication.ResetTimeout();
				},
				// checks to see if the user session should be expired and shows a message before it expires
				CheckTimeout : function () {
					if (!Communication.LastPageTransition || !Communication.EnableSessionTimer)
						return;
					
					var s = Communication.LastPageTransition.getTime();
					var n = new Date().getTime();
					var t = (n - s) / 1000;
					var tr = Communication.SessionExpiration - Math.round(t);
					setTimeout("Communication.CheckTimeout()", 1000);
					if ((t > (Communication.SessionExpiration - Communication.ShowNotification)) && (!notifiedTimeout)) {
						var div = $("<div/>");
						div.append("<h3>Your session is about to expire</h3><p>Due to system inactivity your session is about to expire.</p> <p>You will be automatically logged off in <span id='ExpirationNoticeTimer'></span>.</p><p>&nbsp;</p>");
						div.append("<p><input type='button' onclick='Communication.ResetTimeout(); Global.HideMessage();' value='Continue Using System'> &nbsp; <input type='button' onclick='Communication.LogOff(); Global.HideMessage();' value='Log Off'></p>");
						$("#ModalWindow").bind('dialogclose', function () {
							Communication.TimeoutDialogClosed();
							$("#ModalWindow").unbind('dialogclose');
						});
						Global.ShowMessage(div);
						setTimeout("Communication.ShowTimeRemaining()", 1000);
						notifiedTimeout = true;
					}
					if (tr <= 0) {
						Communication.LogOff();
						Global.HideMessage();
						Communication.ResetTimeout();
					}
				},
				// creates a new vrm file on the server
				EditorCreateNew : function(vrmName, vrmTemplate) {
					try {
						if (Global.InProgress())
							return;
						iLog("EditorCreateNew", "Called");
						
						Global.ShowProgress();
						var request = new Request();
						request.requestType = "Editor Create New Request";
						request.template = "createtemplate.max";
						request.id = Communication.SessionID;
						request.data = "vrmName=" + vrmName + "&vrmTemplate=" + vrmTemplate;
						request.onSuccess = function (xml) {
							iLog("EditorCreateNew", "Success", Log.Type.Info);
							Global.HideProgress();
							
							// watch for error message
							var err = $(xml).find("stingray>html").text();
							if (err) {
								Global.ShowErrorMessage(err);
								return;
							};

							vrmEdit = UpdateEditorFromXML(xml);
							var html = vrmEdit.find('html').text(),
								name = vrmEdit.find('function>fn').text();
							
							Editor.EnableEditor(name, '', '', function() {
								Editor.Clear();
								RulesMaker.Load(vrmEdit);
								HtmlEditor.Load(html);
								MP.LanguageMgr.Load('');
							});
							iLog('EditorCreateNew', 'New ' + vrmName + '.vrm & ' + vrmName + '.sql files created.', Log.Type.Debug);
							
							ExecuteCallback(vrmEdit);
						};
						request.onError = function (msg, xml) {
							iLog("EditorCreateNew", "Failed! " + msg, Log.Type.Error, true);
							Global.HideProgress();
							Global.ShowErrorMessage("<h3>Creating New VRM Page Failed</h3><p>Please diagnose the problem using the information found in the 'Ajax' and 'Logging' tabs.</p>");
						};

						Communication.ProcessRequest(request);
					} catch (err) {
						iLog("EditorCreateNew", err, Log.Type.Error);
						Global.HideProgress();
					}
				},
				// loads the editable content and starts the editor
				EditorRequest : function (VRMName, readOnly, standalone) {
					try {
						if (Global.InProgress())
							return;
						iLog("EditorRequest", "Called");
						
						if (!VRMName) {
							jAlert('No VRM provided! Nothing to edit.');
							return;
						};

						Global.ShowProgress();
						
						var request = new Request();
						request.requestType = "Editor Request";
						request.template = "edittemplate.max";
						request.id = Communication.SessionID;
						request.data = "templateName=" + VRMName;
						if (readOnly)
							request.data += "&readOnly=1";
						request.onSuccess = function (xml) {
							iLog("EditorRequest", "Success", Log.Type.Info);
							Global.HideProgress();
							
							// watch for error message
							var err = $(xml).find("stingray>html").text();
							if (err) {
								Global.ShowErrorMessage(err);
								return;
							};

							vrmEdit = UpdateEditorFromXML(xml);
							var html = vrmEdit.find('html').text(),
								name = vrmEdit.find('function>fn').text(),
								lockedBy = vrmEdit.find('function>lockedBy').text(),
								lintMsg = vrmEdit.find('function>lintMsg').text(),
								lng = vrmEdit.find('languages').text(),
								shScr = vrmEdit.find('scripts').text();

							Editor.EnableEditor(name, lockedBy, lintMsg, function() {
								Editor.Clear();
								RulesMaker.Load(vrmEdit);
								HtmlEditor.Load(html);
								VrmScript.Load(shScr);
								MP.LanguageMgr.Load(lng);

								if (standalone)
									Editor.Standalone = standalone;
							}, readOnly);
							
							ExecuteCallback(vrmEdit);
						};
						request.onError = function (msg, xml) {
							iLog("EditorRequest", "Failed! " + msg, Log.Type.Error, true);
							Global.HideProgress();
							Global.ShowErrorMessage("<h3>Requesting VRM Page Failed</h3><p>Please diagnose the problem using the information found in the 'Ajax' and 'Logging' tabs.</p>");
						};

						Communication.ProcessRequest(request);
					} catch (err) {
						iLog("EditorRequest", err, Log.Type.Error);
						Global.HideProgress();
					}
				},
				// Updates the vrm on the server with the new content from the editor
				CloseEditor : function () {
					try {
						iLog("CloseEditor", "Called");
						
						PropertyEd.Hide();
						RulesMaker.Disable();
						ContextMenu.RemoveAll();
						Editor.DisableEditor();
						Global.ShowProgress();

						var request = new Request();
						request.requestType = "Editor Close Request";
						request.template = "closetemplate.max";
						request.id = Communication.SessionID;
						request.data = "templatename=" + Editor.VRMName + "&path=" + Editor.VRMPath;
						request.onSuccess = function (xml) {
							Global.HideProgress();
							UpdateEditorFromXML(xml);
							
							var sr = $(xml).find('stingray'),
								status = sr.find('status').text(),
								html = sr.find('html').text();
							
							if (status == "success") {
								iLog("CloseEditor", html, Log.Type.Info);
							} else {
								iLog("CloseEditor", "Failed! " + html, Log.Type.Error, true);
								Global.ShowErrorMessage("<h3>Closing VRM Page Failed</h3><p>" + html + "</p>");
							}
							html = HtmlEditor.Save();
							Communication.MakeAllCompsDefault($("#middle"), true, false, false);
							HtmlEditor.Clear(html);
							Editor.Clear();
						};
						request.onError = function (msg, xml) {
							iLog("CloseEditor", "Failed! " + msg, Log.Type.Error, true);
							Global.HideProgress();
							
							var html = HtmlEditor.Save();
							Communication.MakeAllCompsDefault($("#middle"), true, false, false);
							HtmlEditor.Clear(html);
							Editor.Clear();
						};

						Communication.ProcessRequest(request);
					} catch (err) {
						iLog("CloseEditor", err, Log.Type.Error);
						Global.HideProgress();
					}
				},
				// Updates the vrm on the server with the new content from the editor
				EditorUpdate : function (quickUpdate) {
					try {
						iLog("EditorUpdate", "Called");
						
						PropertyEd.Hide();

						if (!quickUpdate) {
							var s = PageHelper.ValidatePage() + RuleHelper.ValidatePage();
							if (s) {
								jConfirm( 'There are warnings on this page. You can find details in the logging pane.<p>' + s
										+ '</p><p>Click cancel to make changes or OK to save, but ignoring warnings may result in QA rejection.</p>',
										  'Page validation', function(answer) {
									if (answer)
										editorUpdate(false);
								});
								return;
							};
						};

						editorUpdate(quickUpdate);
					} catch (err) {
						iLog("EditorUpdate", err, Log.Type.Error);
						Global.HideProgress();
					}
				},
				
				// executes an ajax request using a request object
				ProcessRequest : function (objRequest) {
					try {
						iLog("ProcessRequest", "Called");
						
						this.InitialRequest = objRequest.initialRequest;
						
						// Make all necessary URL adjustments
						var url = objRequest.url;
						if (!url)
							url = objRequest.host + objRequest.template;
						
						if (url.indexOf("t=") == -1) {
							var d = new Date(),
								t = d.getTime().toString(),
								s = "t=" + t;
							url += (url.indexOf("?") == -1) ? "?" + s : "&" + s;
						};
						objRequest.url = url;

						if (url.indexOf("icontray.max") == -1)
							this.ResetTimeout();
						
						// Add client/server protocol API
						var api = 'id=' + objRequest.id;
						if (this.UserLanguage)
							api = api + '&csul=' + this.UserLanguage;
						
						var	data = objRequest.data || '';
						if (data && !data.beginsWith("&"))
							data = "&" + data;
						
						objRequest.data = api + data;
						
						AjaxTab.AddCommand(Utilities.ToString(objRequest));

						var req = $.ajax({
							url : objRequest.url,
							data : objRequest.data,
							cache : objRequest.cache,
							timeout : objRequest.timeout,
							processData : true,
							dataType : objRequest.dataType,
							type : objRequest.method,
							async : objRequest.async,
							success : function (data) {
								ReqList.Load(data);
								WatchList.Load(data);
								AjaxTab.AddResponse(data);

								objRequest.onSuccess(data);
								data = null;
							},
							error : function (xhr, textStatus, error) {
								try {
									var s = "";
									try {
										s = Utilities.ToString(xhr);
									} catch (err) {
										s = "XMLHttpRequest failed to serialize: " + err.message;
										iLog("ProcessRequest", s, Log.Type.Error, true);
									}
									
									var msg = "Error: " + error + ", Status: " + textStatus;
									AjaxTab.AddResponse(s, msg);
									objRequest.onError(msg, xhr);

									// Trigger it last in case they show dialogs with overlay or blocking alert
									var eFn = window.CustomScript.onCommunicationError || MP.Events.onCommunicationError || $.noop;
									eFn(msg, xhr);
								} catch (err) {
									iLog("ProcessRequest", err, Log.Type.Error);
								}
							}
						});
					} catch (err) {
						iLog("ProcessRequest", err, Log.Type.Error);
					}
				},
				
				CorrectUI : function (target) {
					try {
						iLog("CorrectUI", "Called");
						
						var cnt = 0,
							target = $(target),
							comps = target.find(".component");
							
						for (var i = 0; i < comps.length; i++) {
							var ctrl = PageHelper.GetEditorComponent(comps[i]);
							if (ctrl && ctrl.CorrectUI && !ctrl.Corrected) {
								ctrl.CorrectUI();
								cnt++;
							};
							if (cnt > 99) {
								setTimeout("Communication.CorrectUI('" + target.selector + "')", 1000);
								break;
							};
						};
						iLog("CorrectUI", "Corrected " + cnt + " components");
					} catch (err) {
						iLog("CorrectUI", err, Log.Type.Error);
					}
				},
				
				MakeAllCompsDefault : function (target, clearScripts, customOnLoad, globalOnLoad) {
					try {
						var comps = target.find(".component");
						
						// Load all components
						iLog("MakeAllCompsDefault", "Loading " + comps.length + " components");
						comps.each(function () {
							var ctrl = PageHelper.GetEditorComponent(this);
							if (ctrl)
								ctrl.DefaultMode(clearScripts);
						});
						
						// Correct UI
						this.CorrectUI(target.selector);
						
						RemoveOldCKEditors();

						// Do not continue if still in the editor
						if (Editor.Enabled)
							return;
						
						comps.each(function () {
							var ctrl = PageHelper.GetEditorComponent(this);
							if (ctrl) {
								// Hide them if necessary
								if (ctrl.GetCliCondition) {
									var s = ctrl.GetCliCondition();
									if (s) {
										try {
											if (!eval(s)) {
												var par = ctrl.GetControl();
												par.hide();
											}
										} catch (err) {
											iLog("Client Condition", err, Log.Type.Error, true);
										};
									};
								};
								
								PageHelper.AddHelpLink(ctrl);
							};
						});
						
						// Execute JS's Global and VRM's Custom OnLoad events
						if (globalOnLoad && window.GlobalScript.OnLoad) {
							iLog("GlobalScript.OnLoad", "Called", Log.Type.Info);
							try {
								window.GlobalScript.OnLoad();
							} catch (err) {
								iLog("GlobalScript.OnLoad", err, Log.Type.Error, !MP.Tools.EditorEnabled());
							};
						};	
						
						if (customOnLoad && window.CustomScript.OnLoad) {
							iLog("CustomScript.OnLoad", "Called", Log.Type.Info);
							try {
								window.CustomScript.OnLoad();
							} catch (err) {
								iLog("CustomScript.OnLoad", err, Log.Type.Error, !MP.Tools.EditorEnabled());
							};
							window.CustomScript.OnLoad = null;
						};
					} catch (err) {
						iLog("MakeAllCompsDefault", err, Log.Type.Error);
					}
				},
				LinkRequest : function (url, replaceDiv, hideProgress, settings) {
					try {
						iLog("LinkRequest", "Called");
						
						if (!url)
							return;
						if (!hideProgress)
							Global.ShowProgress();
						
						UpdateSessionFromURL(url);

						var request = new Request();
						if (Utilities.IsObject(settings))
							request = $.extend(request, settings);

						request.requestType = "Link Request";
						request.id = Communication.SessionID;
						if (request.id)
							request.data = "preprocess=true";
						request.template = url;
						request.initialRequest = true;

						request.onSuccess = function (xml) {
							Global.HideProgress();
							UpdateSessionFromXML(xml);
							
							var stingray = $(xml).find('stingray');
							var status = stingray.find('status').text();
							var target = replaceDiv || stingray.find('target').text();
							var vrmName = stingray.find('vrmname').text();
							var html = stingray.find('html').text();
							if (status == "success") {
								iLog("LinkRequest", vrmName + " succeeded", Log.Type.Info);

								if (target) {
									var t = $("#" + target);
									t.html(html);
									t.attr("VRMName", vrmName);

									var coreVRM = $.inArray(vrmName, ['ICONTRAY', 'ADMINTABS']) > -1;
									Communication.MakeAllCompsDefault(t, !coreVRM, true, !coreVRM);

									if (target == "middle")
										EnsureFooterSeparator(t);
									
									Global.Tooltips();
								}
								request.done(xml);
							} else {
								var code = stingray.find('errorcode').text();
								code = code || html;
								iLog("LinkRequest", vrmName + " failed: " + code, Log.Type.Error, true);
								request.fail(html, xml, vrmName);
								Global.ShowErrorMessage(html);
							}
							ExecuteCallback(xml);
						};
						request.onError = function (msg, xhr) {
							iLog("LinkRequest", "Failed! " + msg, Log.Type.Error, true);
							Global.HideProgress();
							request.fail(msg, xhr);
						};

						Communication.ProcessRequest(request);
					} catch (err) {
						iLog("LinkRequest", err, Log.Type.Error);
						Global.HideProgress();
						if (request)
							request.fail(err.message, err);
					}
				},
				// serializes the data from an html block and posts it to the target. html can be a jquery / dom object 
				//   or a string of the element id and pass in params with ?name=value syntax.
				SerialRequest : function (html, callID, srcElement, hideProgress, settings) {
					try {
						iLog("SerialRequest", "Called");
						
						var strParams = "",
							validate = false,
							SubmitAct = null;

						if (Utilities.IsString(html)) {
							var temp = "",
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
						
						// used when a submit event is triggered from outside the event.target element
						if (srcElement) {
							var el = $(srcElement);
							SubmitAct = el.attr("name");
							validate = (el.attr("CauseValidation") == "true");
						}
						
						// Do not submit if validation fails!
						if (validate && !Validator.Validate(html))
							return false;

						if (!hideProgress)
							Global.ShowProgress(srcElement);
						
						var request = new Request();
						if (Utilities.IsObject(settings))
							request = $.extend(request, settings);
						
						var n = $(html).attr("VRMName");
						if (!n)
							n = $("#middle").attr("VRMName");
						request.template = n + ".max";
						request.requestType = "Serial Request";
						request.id = Communication.SessionID;
						request.initialRequest = callID != 'CALLBACK';
						if (SubmitAct)
							request.data = "SubmitAct=" + SubmitAct + strParams;
						else
							request.data = strParams;
						var d = Utilities.Serialize($(html));
						if (d.indexOf("=") > -1)
							request.data += (request.data) ? "&" + d : d;

						request.onSuccess = function (xml) {
							try {
								Global.HideProgress();
								UpdateSessionFromXML(xml);

								var stingray = $(xml).find('stingray');
								var status = stingray.find('status').text();
								var target = stingray.find('target').text();
								var vrmName = stingray.find('vrmname').text();
								var html = stingray.find('html').text();
								if (status == "success") {
									iLog("SerialRequest", vrmName + " succeeded", Log.Type.Info);
									
									if (!target || target == "AdminTabs" && MP.Tools.Initialized)
										return;

									var t = $("#" + target);
									t.html(html);
									t.attr("VRMName", vrmName);

									var coreVRM = $.inArray(vrmName, ['ICONTRAY', 'ADMINTABS']) > -1;
									Communication.MakeAllCompsDefault(t, !coreVRM, true, !coreVRM);

									if (target == "middle")
										EnsureFooterSeparator(t);

									if (target == "menu") {
										var main = $("#menu").find(">ul").find(">li");
										main.hover(function () {
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
									
									request.done(xml);
								} else {
									var code = stingray.find('errorcode').text();
									if (code != "0101") {
										code = code || html;
										iLog("SerialRequest", vrmName + " failed: " + code, Log.Type.Error, true);
										request.fail(html, xml, vrmName);
										Global.ShowErrorMessage(html);
									}
								}
								ExecuteCallback(xml);
							} catch (err) {
								iLog("SerialRequest", err, Log.Type.Error);
								request.fail(err.message, err, vrmName);
							}
						};
						request.onError = function (msg, xhr) {
							iLog("SerialRequest", "Failed! " + msg, Log.Type.Error, true);
							Global.HideProgress();
							request.fail(msg, xhr);
						};

						Communication.ProcessRequest(request);

						return true;
					} catch (err) {
						iLog("SerialRequest", err, Log.Type.Error);
						Global.HideProgress();
						if (request)
							request.fail(err.message, err);
					}
				},
				OpenWindow : function (url, instanceName, config) {
					iLog("OpenWindow", url);
					
					var ul = this.UserLanguage;
					if (ul)
						ul = '&csul=' + ul;

					var loc = "../../window.htm?id=" + this.SessionID + ul + "&template=" + url.replace("?", "&");
					return this.OpenTab(loc, instanceName, config);
				},
				OpenTab : function (url, instanceName, config) {
					iLog("OpenTab", url);
					
					this.ResetTimeout();
					return window.open(url, instanceName, config);
				},
				ModalWindow : function (url, title, width, settings) {
					try {
						iLog("ModalWindow", "Called");
						
						UpdateSessionFromURL(url);

						var request = new Request();
						if (Utilities.IsObject(settings))
							request = $.extend(request, settings);
						
						request.requestType = "Modal Window Request";
						request.id = Communication.SessionID;
						request.data = "preprocess=true";
						request.template = url;
						request.onSuccess = function (xml) {
							var stingray = $(xml).find('stingray');
							var status = stingray.find('status').text();
							var vrmName = stingray.find('vrmname').text();
							var html = stingray.find('html').text();
							if (status == "success") {
								iLog("ModalWindow", vrmName + " succeeded", Log.Type.Info);
								
								Global.ShowMessage(html, width, title);
								Communication.MakeAllCompsDefault($("#ModalWindow"), false, true, true);
								Global.Tooltips();
								
								request.done(xml);
							} else {
								var code = stingray.find('errorcode').text();
								code = code || html;
								iLog("ModalWindow", vrmName + " failed: " + code, Log.Type.Error, true);

								request.fail(html, xml, vrmName);
								Global.ShowErrorMessage(html);
							}
						};
						request.onError = function (msg, xhr) {
							iLog("ModalWindow", "Failed! " + msg, Log.Type.Error, true);
							request.fail(msg, xhr);
						};

						Communication.ProcessRequest(request);
					} catch (err) {
						iLog("ModalWindow", err, Log.Type.Error);
						if (request)
							request.fail(err.message, err);
					}
				},
				// url as follows vrmname.max?param1=value1&param2=value2.....
				// replaceID is either an element id to accept new innerHTML, or is a javascript function that will be passed the html
				CustomRequest : function (url, replaceID, srcElement, data, settings) {
					try {
						iLog("CustomRequest", "Called");
						
						if (srcElement) {
							var s = $(srcElement).val();
							if (s) {
								url += (url.indexOf("?") == -1 ? '?' : '&');
								url += "value=" + encodeURIComponent(s);
							};
						};

						UpdateSessionFromURL(url);

						var request = new Request();
						if (Utilities.IsObject(settings))
							request = $.extend(request, settings);
						
						request.requestType = "Custom Request";
						request.id = Communication.SessionID;
						request.data = data;
						request.template = url;
						
						request.onSuccess = function (xml) {
							UpdateSessionFromXML(xml);

							var stingray = $(xml).find('stingray');
							var status = stingray.find('status').text();
							var vrmName = stingray.find('vrmname').text();
							var html = stingray.find('html').text();
							if (status == "success") {
								iLog("CustomRequest", vrmName + " succeeded", Log.Type.Info);
								
								if (replaceID) {
									if (Utilities.IsFunction(replaceID))
										replaceID(html);
									else {
										var div = $("#" + replaceID);
										div.html(html);
										div.change();
									}
								}
								
								request.done(xml);
							} else {
								var code = stingray.find('errorcode').text();
								code = code || html;
								iLog("CustomRequest", vrmName + " failed: " + code, Log.Type.Error, true);

								request.fail(html, xml, vrmName);
								Global.ShowErrorMessage(html);
							}
							ExecuteCallback(xml);
						};
						request.onError = function (msg, xhr) {
							iLog("CustomRequest", "Failed! " + msg, Log.Type.Error, true);
							request.fail(msg, xhr);
						};

						Communication.ProcessRequest(request);
					} catch (err) {
						iLog("CustomRequest", err, Log.Type.Error);
						if (request)
							request.fail(err.message, err);
					}
				}
			};
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
			if (request)
				request.fail(err.message, err);
		}
	};
	
	return Communication;
});

/*
Cross browser functions
 */
define('Browser', [], function () {

	var Browser = new function () {
		try {

			/* PRIVATE PROPERTIES */
			var logClassName = "Browser.";
			
			function iLog(Place, Message, Type, Silent) {
				Log.Add(logClassName + Place, Message, Type, Silent);
			}

			return {
			
				/*
				Function: IsMSIE
				To determine if the browser is MS IE
				
				Returns:
				boolean true/false
				 */
				IsMSIE : function () {
					return $.browser.msie || false;
				},
				
				/*
				Function: IsSafari
				To determine if the browser is Apple Safari
				
				Returns:
				boolean true/false
				 */
				IsSafari : function () {
					return ($.browser.safari && !/chrome/.test(navigator.userAgent.toLowerCase())) || false;
				},
				
				/*
				Function: IsChrome
				To determine if the browser is Google Chrome
				
				Returns:
				boolean true/false
				 */
				IsChrome : function () {
					return ($.browser.safari && /chrome/.test(navigator.userAgent.toLowerCase())) || false;
				},
				
				/*
				Function: IsFirefox
				To determine if the browser is Fire Fox
				
				Returns:
				boolean true/false
				 */
				IsFirefox : function () {
					return $.browser.mozilla || false;
				},
				
				/*
				Function: IsValidBrowser
				To determine if the browser is valid
				
				Returns:
				Should return true if valid
				 */
				IsValidBrowser : function () {
					return true;
				},
				
				/*
				Function: DetectExplorer
				Returns a full browser's description
				
				Returns:
				String identifying a web browser
				 */
				DetectExplorer : function () {
					return navigator.userAgent;
				},
				ParseURL : function (url) {
					url = url || window.location.href;

				    var parser = document.createElement('a'),
				        searchObject = {},
				        queries, split, i;
				    
				    // Let the browser do the work
				    parser.href = url;
				    
				    // Convert query string to object
				    queries = parser.search.replace(/^\?/, '').split('&');
				    for ( i = 0; i < queries.length; i++ ) {
				        split = queries[i].split('=');
				        searchObject[split[0].toLowerCase()] = split[1];
				    }
				    return {
				        protocol: parser.protocol,
				        host: parser.host,
				        hostname: parser.hostname,
				        port: parser.port,
				        pathname: parser.pathname,
				        search: parser.search,
				        searchObject: searchObject,
				        hash: parser.hash
				    };
				}
			};
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	// For backwards compatibility
	window.IsMSIE = Browser.IsMSIE;
	window.IsSafari = Browser.IsSafari;
	window.IsChrome = Browser.IsChrome;
	window.IsFirefox = Browser.IsFirefox;
	window.IsValidBrowser = Browser.IsValidBrowser;
	window.DetectExplorer = Browser.DetectExplorer;
	
	return Browser;
});

define('PropertyFieldData', ['PropertyFields'], function (PropertyFields) {
	var PropertyFieldData = function (propertyField, options) {
		if (typeof propertyField === 'string') {
			propertyField = PropertyFields[propertyField];
		}
		
		this.propertyField = propertyField;
		this.options = options;
	};
	
	PropertyFieldData.prototype.get = function () {
		return (this.options.getter || $.noop)();
	};
	
	PropertyFieldData.prototype.set = function (value) {
		(this.options.setter || $.noop)(value);
	};
	
	PropertyFieldData.prototype.isDisabled = function () {
		return !this.options.setter;
	};
	PropertyFieldData.prototype.language = function () {
		return this.propertyField.language;
	};
	
	PropertyFieldData.prototype.allowsLiveEditing = function () {
		if (typeof this.propertyField.live !== 'undefined')
			return this.propertyField.live;
		else		
			return false;
	};
	
	return PropertyFieldData;
});

define('TokenTooltip', [], function() {
	if (!window.ace)
		return;
		
	var dom = ace.require("ace/lib/dom");
	var event = ace.require("ace/lib/event");
	var Range = ace.require("ace/range").Range;

	var tooltipNode;

	var TokenTooltip = function(editor) {
		if (editor.tokenTooltip)
			return;
		editor.tokenTooltip = this;    
		this.editor = editor;
		
		editor.tooltip = tooltipNode || this.$init();

		this.update = this.update.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseOut = this.onMouseOut.bind(this);
		event.addListener(editor.renderer.scroller, "mousemove", this.onMouseMove);
		event.addListener(editor.renderer.content, "mouseout", this.onMouseOut);
	};

	(function(){
		this.token = {};
		this.range = new Range();
		
		this.update = function() {
			this.$timer = null;
			
			var r = this.editor.renderer;
			if (this.lastT - (r.timeStamp || 0) > 1000) {
				r.rect = null;
				r.timeStamp = this.lastT;
				this.maxHeight = innerHeight;
				this.maxWidth = innerWidth;
			}

			var canvasPos = r.rect || (r.rect = r.scroller.getBoundingClientRect());
			var offset = (this.x + r.scrollLeft - canvasPos.left - r.$padding) / r.characterWidth;
			var row = Math.floor((this.y + r.scrollTop - canvasPos.top) / r.lineHeight);
			var col = Math.round(offset);

			var screenPos = {row: row, column: col, side: offset - col > 0 ? 1 : -1};
			var session = this.editor.session;
			var docPos = session.screenToDocumentPosition(screenPos.row, screenPos.column);
			var token = session.getTokenAt(docPos.row, docPos.column);

			if (!token && !session.getLine(docPos.row)) {
				token = {
					type: "",
					value: "",
					state: session.bgTokenizer.getState(0)
				};
			}
			if (!token) {
				session.removeMarker(this.marker);
				tooltipNode.style.display = "none";
				this.isOpen = false;
				return;
			}
			if (!this.isOpen) {
				tooltipNode.style.display = "";
				this.isOpen = true;
			}
			
			var tokenText = token.type;
			if (token.state)
				tokenText += "|" + token.state;
			if (token.merge)
				tokenText += "\n  merge";
			if (token.stateTransitions)
				tokenText += "\n  " + token.stateTransitions.join("\n  ");
			
			if (this.tokenText != tokenText) {
				tooltipNode.textContent = tokenText;
				this.tooltipWidth = tooltipNode.offsetWidth;
				this.tooltipHeight = tooltipNode.offsetHeight;
				this.tokenText = tokenText;
			}
			
			this.updateTooltipPosition(this.x, this.y);

			this.token = token;
			session.removeMarker(this.marker);
			this.range = new Range(docPos.row, token.start, docPos.row, token.start + token.value.length);
			this.marker = session.addMarker(this.range, "ace_bracket", "text");
		};
		
		this.onMouseMove = function(e) {
			this.x = e.clientX;
			this.y = e.clientY;
			if (this.isOpen) {
				this.lastT = e.timeStamp;
				this.updateTooltipPosition(this.x, this.y);
			}
			if (!this.$timer)
				this.$timer = setTimeout(this.update, 100);
		};
		
		this.onMouseOut = function(e) {
			var t = e && e.relatedTarget;
			var ct = e &&  e.currentTarget;
			while(t && (t = t.parentNode)) {
				if (t == ct)
					return;
			}
			tooltipNode.style.display = "none";
			this.editor.session.removeMarker(this.marker);
			this.$timer = clearTimeout(this.$timer);
			this.isOpen = false;
		};
		
		this.updateTooltipPosition = function(x, y) {
			var st = tooltipNode.style;
			if (x + 10 + this.tooltipWidth > this.maxWidth)
				x = innerWidth - this.tooltipWidth - 10;
			if (y > innerHeight * 0.75 || y + 20 + this.tooltipHeight > this.maxHeight)
				y = y - this.tooltipHeight - 30;
			
			st.left = x + 10 + "px";
			st.top = y + 20 + "px";
		};

		this.$init = function() {
			tooltipNode = document.documentElement.appendChild(dom.createElement("div"));
			var st = tooltipNode.style;
			st.position = "fixed";
			st.display = "none";
			st.background = "lightyellow";
			st.borderRadius = "";
			st.border = "1px solid gray";
			st.padding = "1px";
			st.zIndex = 2001;
			st.fontFamily = "monospace";
			st.whiteSpace = "pre-line";
			return tooltipNode;
		};

		this.destroy = function() {
			this.onMouseOut();
			event.removeListener(this.editor.renderer.scroller, "mousemove", this.onMouseMove);
			event.removeListener(this.editor.renderer.content, "mouseout", this.onMouseOut);
			delete this.editor.tokenTooltip;    
		};

	}).call(TokenTooltip.prototype);

	return TokenTooltip;
});

define('PropertyEditorFactory', ['PropertyFieldData', 'TokenTooltip'], function (PropertyFieldData, TokenTooltip) {
    var aceEditors = [];
	var sizeHintCss = {
		small : {
			width : 100
		},
		medium : {
			width : 250,
			height: '1.3em'
		},
		wide : {
			width : '96%',
			height: '1.3em'
		},
		large : {
			width : '96%',
			height: '15em'
		}
	};
	
	var PropertyEditorFactory = {
		DestroyAceEditors : function () {
			$.each(aceEditors, function (i, ae) {
				ae.destroy();
				ae = null;
			});
			aceEditors = [];
		},
		ResizeAceEditors : function () {
			var lastTop = 0,
				lastId = -1;
			
			// Find the last editor
			$.each(aceEditors, function (i, ae) {
				var div = $(ae.container);
				if (div.position().top > lastTop) {
					lastTop = div.position().top;
					lastId = i;
				};
			});
			if (lastId == -1)
				return;
			
			// Shrink all editors
			$.each(aceEditors, function (i, ae) {
				var div = $(ae.container);
				div.height(200);
			});
			
			// Expand the last editor
			var ae = aceEditors[lastId],
				div = $(ae.container),
				dlg = div.parents('#PropertyDlg'),
				tbl = div.parents('.PropertyEditorTable'),
				h1 = dlg.height(),
				h2 = tbl.height();
			if (h1 > h2) 
				div.height(h1 - h2 + 200);
			
			// Update all editors
			$.each(aceEditors, function (i, ae) {
				ae.resize();
			});
		},
		create : function (propertyFieldData) {
			var type = propertyFieldData.propertyField.type;
			var factory = PropertyEditorFactory[type];
			
			if (type === 'create' || typeof factory !== 'function') {
				throw new Error('Bad property type: ' + type);
			}
			
			var editor = factory(propertyFieldData);
			editor.refresh();
			
			return editor;
		},
			
		text : function (propertyFieldData) {
			var sizeHint = propertyFieldData.propertyField.sizeHint;
			
			if (!Object.prototype.hasOwnProperty.call(sizeHintCss, sizeHint))
				sizeHint = 'medium';

			var $div = $('<div class="noWrap"/>');
			var $editor = null;
			var aceEditor = null;
			
			if (sizeHint === 'large' && MP.Tools.AceEnabled()) {
				$editor = $('<div/>')
					.appendTo($div);
				
				aceEditor = Global.ConvertToAceEditor($editor, {language: propertyFieldData.language()});
				if (aceEditor)
					aceEditors.push(aceEditor);
			} else {
				var isTA = sizeHint !== 'small';
				if (isTA)
					$editor = $('<textarea class="ace_textarea"/>');
				else
					$editor = $('<input type="text"/>');

				$editor
					.attr('name', propertyFieldData.propertyField.name || '')
					.attr('title', propertyFieldData.propertyField.description || '')
					.attr('disabled', propertyFieldData.isDisabled() ? 'disabled' : '')
					.css(sizeHintCss[sizeHint])
					.appendTo($div);
				
				if (isTA && MP.Tools.AceEnabled()) {
					$('<div/>')
						.attr('title', "Switch to advanced editor")
						.addClass("ace_resize")
						.appendTo($div)
						.bind('click', function() {
							$(this).hide();
							aceEditor = Global.ConvertToAceEditor($editor, {language: propertyFieldData.language(), focus: true});
							if (aceEditor)
								aceEditors.push(aceEditor);
							PropertyEditorFactory.ResizeAceEditors();
						});
				};
			};
			
			refresh = function () {
				var v = propertyFieldData.get();
				if (aceEditor)
					aceEditor.setValue(v, -1);
				else
					$editor.val(v);
			};
			save = function () {
				var v;
				if (aceEditor)
					v = aceEditor.getValue();
				else
					v = $editor.val();
				propertyFieldData.set(v);
			};
			
			if (propertyFieldData.allowsLiveEditing()) {
				$editor.bind('keyup change', save);
			};
			
			return {
				$element : $div,
				refresh : refresh,
				save : save
			};
		},
		
		multi : function (propertyFieldData) {
			var spec = propertyFieldData.propertyField.data;
			if (!spec) {
				throw new Error('Property is missing spec: ' + (propertyFieldData.propertyField.name || propertyFieldData.propertyField.label));
			}

			var $table = $('<table/>');
			var $header = $('<thead/>').appendTo($table);
			var $body = $('<tbody/>').appendTo($table);
			var $footer = $('<tfoot/>').appendTo($table);
			
			// Build header
			var $headerRow = $('<tr/>').appendTo($header);
			
			$.each(spec, function (i, specItem) {
				$('<th/>').text(specItem.label).appendTo($headerRow);
			});
			
			// Build inner data
			var items = []; // Set in refresh()
			var itemEditors = []; // [ { item, editor } ]
			
			var buildItemCell = function (specItem, item) {
				var pfd = new PropertyFieldData(specItem, {
						getter : function () {
							return item[specItem.name];
						},
						setter : function (value) {
							item[specItem.name] = value;
						}
					});
				
				var editor = PropertyEditorFactory.create(pfd);
				
				itemEditors.push({
					item : item,
					editor : editor
				});
				
				return $('<td/>').append(editor.$element);
			};
			
			var buildItemRow = function (item) {
				var $row = $('<tr/>'),
					last;
				
				$.each(spec, function (i, specItem) {
					last = buildItemCell(specItem, item).appendTo($row);
				});
				last.css('width', '100%');
				
				var btns = $('<td class="propertyBtns"/>').appendTo($row);
				$('<div class="deletePropertyBtn" title="Delete"/>')
					.bind('click', function () {
						jConfirm('Are you sure you want to delete this property?', 'Confirm Delete', function(answer) {
							if (!answer)
								return;

							var index = $.inArray(item, items);
							items.splice(index, 1);
							
							// Remove it from itemEditors to stop tracking updates
							$.each(itemEditors, function (index, value) {
								if (value && value.item === item)
									itemEditors[index] = null;
							});
							itemEditors = $.grep(itemEditors, function (ed) {
								return ed != null;
							});
							
							var fn = propertyFieldData.options.args.DeleteParam || $.noop;
							fn(index);
							
							$row.remove();
						}, {
							okButton: 'Yes',
							cancelButton: 'No'
						});
					})
					.appendTo(btns);
				
				// if there is resizing button move it to the last column
				var ace = last.find('div.ace_resize');
				if (ace.length)
					$(ace).detach().appendTo(btns);
				
				return $row;
			};
			
			var AddParameter = function(newItem) {
				var item = newItem || {}; // TODO Create using proper constructor (e.g. Filter instead of Object)
				items.push(item);
				
				var fn = propertyFieldData.options.args.AddParam || $.noop;
				fn();
				
				buildItemRow(item).appendTo($body);
			};
			
			// Build footer
			var $addRow = $('<tr/>').appendTo($footer);
			var $addCell = $('<td/>')
				.attr('colspan', spec.length + 1)
				.appendTo($addRow);
			
			// Add button
			$('<img src="../../images/param-add.png" title="Add new" class="paramActions"/>')
				.click(AddParameter)
				.appendTo($addCell);
			
			if (propertyFieldData.propertyField.description == 'Set Query Parameters' && MP.Tools.AceEnabled()) {
			
				// Auto link query params
				$('<img src="../../images/param-link.png" title="Generate query parameters" class="paramActions"/>')
					.click(function() {
						var s = aceEditors[0].getValue(),
							params = s.match(/:(\w+)/g),		
							items = GetValidItems(),
							newCnt = 0;
						
						$.each(params, function (i, attr) {
							var name = attr.replace(':', ''),
								NAME = name.toUpperCase(),
								found = false;
							
							for (var i = 0; i < items.length; i++) {
								if (items[i].Name.toUpperCase() == NAME) {
									found = true;
									break;
								};
							};
							
							if (!found) {
								var newItem = {
									Name: name,
									Type: 'STRING',
									Value: '#S' + name + '#'
								};
								AddParameter(newItem);
								newCnt++;
							};
						});
						
						if (newCnt) {
							s = newCnt == 1 ? ' parameter was' : ' parameters were';
							jAlert(newCnt + s + ' added. Please verify their Types and Values are correct.');
						};
					})
					.appendTo($addCell);
			
				// Validate query
				$('<img src="../../images/query-validate.png" title="Validate query" class="paramActions"/>')
					.click(function() {
						var items = GetValidItems();
						var params = '';
						for (var i = 0; i < items.length; i++)
							params = params + ',' + items[i].Name + '=' + items[i].Type;
						params = '&params=' + encodeURIComponent(params.substring(1));
						
						var query = '&query=' + encodeURIComponent(aceEditors[0].getValue());
						var url = "admintabs.max?action=ValidateQuery";
						var cbFn = function(result) {
							var btns = {
								'Close' : function () {
									$(this).dialog('close');
								}
							};
							Global.ShowMessage(result, 600, 'Query Validator', null, btns);
						};
						
						// Send to the server
						Communication.CustomRequest(url, cbFn, null, query + params);
						
					})
					.appendTo($addCell);
			};
			
			var refresh = function () {
				items = $.extend(true, [], propertyFieldData.get()); // Deep clone
				itemEditors = [];
				
				$body.empty();
				
				$.each(items, function (i, item) {
					buildItemRow(item).appendTo($body);
				});
			};
			
			var GetValidItems = function () {
				// Save child properties
				$.each(itemEditors, function (index, value) {
					if (value && value.editor)
						value.editor.save();
				});
				// Remove invalid items
				var validItems = $.grep(items, function (item) {
					return item !== null;
				});
				return validItems;
			};
			
			var save = function () {
				var items = GetValidItems();
				propertyFieldData.set(items);
			};
			
			return {
				$element : $table,
				refresh : refresh,
				save : save
			};
		},
		
		checkbox : function (propertyFieldData) {
			var $editor = $('<input/>')
				.attr('title', propertyFieldData.propertyField.description || '')
				.attr('type', 'checkbox');
			
			var refresh = function () {
				// IE is buggy and won't check a checkbox properly unless
				// it is added to the DOM.  This UGLY HACK "ensures" it's
				// in the DOM before refreshing.
				setTimeout(function () {
					$editor.attr('checked', propertyFieldData.get() ? 'checked' : '');
				}, 0);
			};
			
			var save = function () {
				propertyFieldData.set($editor.is(':checked'));
			};
			
			if (propertyFieldData.allowsLiveEditing()) {
				$editor.bind('change', function () {
					save();
				});
			}
			
			return {
				$element : $editor,
				refresh : refresh,
				save : save
			};
		},
		
		select : function (propertyFieldData) {
			var $select = $('<select/>')
				.attr('title', propertyFieldData.propertyField.description || '')
				.append(Utilities.ConvertToOptions(propertyFieldData.propertyField.data || []));
			if (propertyFieldData.propertyField.onClick)
				$select.bind('click', propertyFieldData.propertyField.onClick);

			
			var refresh = function () {
				$select.val(propertyFieldData.get());
			};
			
			var save = function () {
				propertyFieldData.set($select.val());
			};
			
			if (propertyFieldData.allowsLiveEditing()) {
				$select.bind('keydown keyup keypress change', function () {
					save();
				});
			}
			
			return {
				$element : $select,
				refresh : refresh,
				save : save
			};
		},

		csf : function (propertyFieldData) {
			var fncs = MP.Tools.Config.ScriptFunctions;
			var $div = $('<div/>');
			var items = []; // Set in refresh()
			var fnArr = [];
			var fnArrBackup = [];
			var id = 0;

			// fn.type = Nil, String, Char, Boolean, Byte, Integer, Double, Currency, Extended, TStringList, TDate, TTime, TDateTime
			// fn.cat = Nil, Var, Const, Procedure, Function, Record, Object, Array

			var getValueByName = function (name) {
				if (fnArr instanceof Array) {
					var itm = $.grep(fnArr, function(e){ return e.Name == name; });
					if (itm.length > 0)
						return itm[0].Value;
					else
						return '';
				} else
					return '';
			};
			
			var inputSize = function(fn) {
				if ($.inArray(fn.cat, ['record', 'object', 'array']) > -1)
					return 'large';
				else				
					return 'wide';
			};
			
			var addInput = function(fn, desc) {
				var $p = $('<p/>').appendTo($div);
				fn.value = getValueByName(fn.name);
				$p.append('<label>' + desc + '</label></br>');
				id++;

				var item = {
					ID   : 'csf-' + fn.name + '-' + id.toString(),
					Name : fn.name,
					Value: fn.value,
					Input: null,
					Language: ''
				};
				items.push(item);
				
				if (fn.cat == 'procedure')
					return;
					
				var is = inputSize(fn);
				var isTA = is == 'large';
				if (isTA)
					var ed = $('<textarea class="ace_textarea"/>');
				else
					var ed = $('<input type="text" class="ace_input"/>');
				ed.attr('id', item.ID)
					.attr('title', fn.label || '')
					.val(fn.value)
					.css(sizeHintCss[is])
					.appendTo($p);
				item.Input = ed;

				if (MP.Tools.AceEnabled()) {
					$('<div/>')
						.attr('title', "Switch to advanced editor")
						.addClass("ace_resize")
						.appendTo($p)
						.bind('click', function() {
							$(this).hide();
							var ae = Global.ConvertToAceEditor(ed, {
								language: item.Language,
								focus: true
							});
							if (!ae)
								return;

							aceEditors.push(ae);
							item.Input = ae;
							PropertyEditorFactory.ResizeAceEditors();
						});
				};
			};
			
			var deleteFunction = function () {
				$div.find('p').remove();
				items = [];
				id = 0;
				// Done in callback setter
				//var delFn = propertyFieldData.options.args.DeleteParam || $.noop; delFn();
			};
			
			var updateItems = function () {
				$.each(items, function (i, itm) {
					if (itm.Input && itm.Input.getValue)
						itm.Value = itm.Input.getValue();
					else
						itm.Value = $('#' + itm.ID).val();
				});
			};
			
			var makeProperties = function (fnName) {
				try {
					fnName = fnName || fnArr[0].Name;
					
					var fn = null;
					$.each(fncs, function (idx, elm) {
						if (elm.name == fnName) {
							fn = elm;
							return;
						};
					});
					if (!fn)
						throw "Unknown function " + fnName + "!";

					deleteFunction();
					$select.val(fnName);

					// Add function declaration
					var s = fn.type ? '<br><br>return: ' + fn.type + ';' : '';
					addInput(fn, fn.def + '<br><br>' + fn.label + s);
					fnArr.splice(0, 1);
					
					// Add property declarations
					$.each(fn.params, function (idx, elm) {
						addInput(elm, elm.pass + ' ' + elm.name + ': ' + elm.type + ';');
					});
				} catch (err) {
					iLog("makePropertis", err, Log.Type.Error);
				}
			};
			
			var makeOptions = function () {
				var makeOption = function (data) {
					return $('<option/>')
					.attr('value', data.name)
					.attr('title', data.def + '\n\n' + data.label)
					.text(data.name);
				};
				
				var options = $([]);
				$.each(fncs, function (idx, elm) {
					if (elm.gear != '0')
						options = options.add(makeOption(elm));
				});

				return options;
			};
			
			var $select = $('<select/>')
				.attr('title', propertyFieldData.propertyField.description || '')
				.append(makeOptions())
				.appendTo($div)
				.change(function() {
					// Deep clone
					fnArr = $.extend(true, [], fnArrBackup);
					makeProperties($(this).val());
				});
			Utilities.SortSelect($select);

			var refresh = function () {
				// Deep clone
				fnArr = $.extend(true, [], propertyFieldData.get()); 
				fnArrBackup = $.extend(true, [], fnArr);
				makeProperties();
			};
			
			var save = function () {
				updateItems();
				propertyFieldData.set(items);
			};
			
			if (propertyFieldData.allowsLiveEditing()) {
				$select.bind('keydown keyup keypress change', function () {
					save();
				});
			};
			
			return {
				$element : $div,
				refresh : refresh,
				save : save
			};
		}
	};
	
	return PropertyEditorFactory;
});

define('RuleXML', ['RuleStorage'], function (RuleStorage) {
	var RuleXML = new function () {

		/* PRIVATE PROPERTIES */
		var logClassName = "RuleXML.";
		var _xml = null;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place, Message, Type, Silent);
		}		
		
		return {
			/* PUBLIC PROPERTIES */
			CurrentProcess : "",

			/* PUBLIC METHODS */

			AddComponent : function (xmlNode) {
				try {
					iLog("AddComponent", "Called");
					
					_xml.find(this.CurrentProcess).append(xmlNode);
				} catch (err) {
					iLog("AddComponent", err, Log.Type.Error);
				}
			},
			AppendXML : function (xmlNodes) {
				try {
					var proc = _xml.find(this.CurrentProcess);
					proc.append(xmlNodes);
				} catch (err) {
					iLog("AppendXML", err, Log.Type.Error);
				}
			},
			GetComponent : function (ID) {
				try {
					if (typeof ID != "number")
						ID = parseInt(ID, 10);
					var ret = "";
					_xml.find(this.CurrentProcess + ">c").each(function () {
						if (parseInt($(this).find(">n").text(), 10) == ID) {
							ret = Utilities.GetXmlString(this);
						}
					});
					return ret;
				} catch (err) {
					iLog("GetComponent", err, Log.Type.Error);
				}
			},
			DeleteComponent : function (ID) {
				try {
					iLog("DeleteComponent", "Called");
					
					var toRemove = null;
					_xml.find(this.CurrentProcess + ">c").each(function () {
						if ($(this).find(">n").text() == ID) // flag the component for removal
							toRemove = this;
						$(this).find("j").each(function () { // clear any references to the component
							if ($(this).text() == ID)
								$(this).text("");
						});
					});
					if (toRemove != null)
						toRemove.parentNode.removeChild(toRemove);
				} catch (err) {
					iLog("DeleteComponent", err, Log.Type.Error);
				}
			},
			Load : function (xml) {
				iLog("Load", "Called");
				
				if (xml)	
					_xml = $(xml);
			},
			// gets the component that links to the component specified
			GetFromComponent : function (ID) {
				try {
					if (typeof ID != "number")
						ID = parseInt(ID, 10);
					var ctrl = null;
					_xml.find(this.CurrentProcess + ">c").each(function () {
						var _compID = parseInt($(this).find("n").text(), 10);
						$(this).find("j").each(function () {
							var j = $(this).text();
							if (j == ID.toString())
								ctrl = RuleStorage.GetComponent(_compID);
						});
					});
					return ctrl;
				} catch (err) {
					iLog("GetFromComponent", err, Log.Type.Error);
				}
			},
			GetNewElement : function (nodeName) {
				try {
					return _xml.context.createElement(nodeName);
				} catch (err) {
					iLog("GetNewElement", err, Log.Type.Error);
				}
			},
			GetNewCDATA : function (strContent) {
				try {
					strContent = strContent || '';
					return _xml.context.createCDATASection(strContent);
				} catch (err) {
					iLog("GetNewCDATA", err, Log.Type.Error);
				}
			},
			ReplaceCDATA : function (elem, value) {
				try {
					var parentNode = $(elem)[0].parentNode;
					var n = $(elem)[0].nodeName;
					var cdata = RuleXML.GetNewCDATA(value);
					var newElem = RuleXML.GetNewElement(n);
					$(newElem).append(cdata);
					parentNode.replaceChild(newElem, $(elem)[0]);
				} catch (err) {
					iLog("ReplaceCDATA", err, Log.Type.Error);
				}
			},
			FindFirstAvailableID : function () {
				try {
					var id = -1,
						ctrl;
					
					do {
						id++;
						ctrl = RuleStorage.GetComponent(id);
					} while (ctrl);
					
					return id;
				} catch (err) {
					iLog("FindFirstAvailableID", err, Log.Type.Error);
				}
			},
			FindLastAvailableID : function () {
				try {
					var arr = RuleStorage.GetIdArray(true),
						id = -1;
					
					for (var i = 0; i < arr.length; i++) {
						if (arr[i] > id)
							id = arr[i];
					}

					return ++id;
				} catch (err) {
					iLog("FindLastAvailableID", err, Log.Type.Error);
				}
			},
			GetFunctionXML : function () {
				try {
					return _xml.find("function");
				} catch (err) {
					iLog("GetFunctionXML", err, Log.Type.Error);
				}
			},
			GetProcessXML : function () {
				try {
					return _xml.find(this.CurrentProcess);
				} catch (err) {
					iLog("GetProcessXML", err, Log.Type.Error);
				}
			},
			SetProcessXML : function (xmlNode) {
				try {
					_xml.find(this.CurrentProcess).replaceWith($(xmlNode));
				} catch (err) {
					iLog("SetProcessXML", err, Log.Type.Error);
				}
			}
		};
	};
	
	return RuleXML;
});

// Classes and functions to handle menus
define('ContextMenuItems', [], function () {
	function ContextMenuItems() {
		var rootUL = $("<ul/>");
		
		function EnsureUL(li) {
			var ul = li.find('>ul');
			if (ul.length == 0)
				ul = $("<ul/>");
			li.append(ul);
			
			return ul;
		}

		// Adds a menu item to the ContextMenu
		this.Add = function (caption, callback, item) {
			var li = $("<li/>");
			li.text(caption);
			
			if (callback)
				li.click(callback);
			
			if (item) {
				var ul = EnsureUL(item);
				ul.append(li);
			} else {
				rootUL.append(li);
			}
			
			return li;
		};

		// Reference of the entire menu with all its items
		this.GetHTML = function () {
			return rootUL;
		};
	}
	
	return ContextMenuItems;
});

define('ContextMenu', ['Storage'], function (Storage) {
	var ContextMenu = new function () {

		/* PRIVATE PROPERTIES */
		var logClassName = "ContMenu.",
			contextMenus = new Storage('Menu'),
			_div = $("<div class='contextMenu'></div>"),
			_isVisible = false,
			activeBoxClass;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place, Message, Type, Silent);
		}		
		function Menu(selector, callback, name) {
			var _name = name;
			var _selector = selector;
			var _callback = callback;
			
			this.Name = function () {
				return _name;
			};
			this.Attach = function () {
				$(_selector)
					.each(function () {
						this.oncontextmenu = function (e) {
							ContextMenu.Show(_callback, e || window.event, _name);
							return false;
						}
					});
			};
			this.Detach = function () {
				$(_selector)
					.each(function () {
						this.oncontextmenu = null;
					});
			};
		}
		function findParentToPasteTo(element) {
			element = $(element);
			var ref = element.attr('ref'),
				allowed = [];

			switch (ContextMenu.ActiveEditor) {
			case 'html' :
				allowed = ["EditableContent", "StaticContainer", "DynamicContainer"];
				break;
			case 'bootstrap' :
				allowed = ["bootstrapContent", "container", "row", "column", "div", "panel"];
				break;
			default :
				return $('#' + ContextMenu.ActiveEditor);
			}

			if ($.inArray(ref, allowed) > -1)
				return element;
			
			var parents = element.parents("[ref]");
			for (var i = 0; i < parents.length; i++) {
				element = $(parents[i]);
				ref = element.attr('ref');
				if ($.inArray(ref, allowed) > -1)
					return element;
			}

			// No valid parent found! Return default
			return $('[ref=bootstrapContent]');
		}
		
		return {
			Initialized : false,
			Enabled : true,
			EventComponent: null,
			ActiveEditor: '',
			ActiveBox: $(),
			OffsetX : 0,
			OffsetY : 0,
			ScrollX : 0,
			ScrollY : 0,
			ClientX : 0,
			ClientY : 0,

			Initialize : function () {
				try {
					if (this.Initialized)
						return;
					iLog("Initialize", "Called");

					activeBoxClass = "ui-activeBox";

					$("body").append(_div);
					$("body").bind("click.contextMenu", function () {
						ContextMenu.Hide();
					});
					
					this.Initialized = true;
				} catch (err) {
					iLog("Initialize", err, Log.Type.Error);
				}
			},
			Add : function (selector, callback, name) {
				try {
					iLog("Add", "Called");

					name = name || selector;
					var menu = new Menu(selector, callback, name);
					contextMenus.AddComponent(menu, name);
					menu.Attach();
				} catch (err) {
					iLog("Add", err, Log.Type.Error);
				}
			},
			Refresh : function () {
				try {
					iLog("Refresh", "Called");
					
					var menus = contextMenus.GetItemArray();
					for (var i = 0; i < menus.length; i++) {
						var menu = menus[i];
						menu.Attach();
					}
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			},
			Remove : function (nme) {
				try {
					iLog("Remove", "Called");
					
					var menu = contextMenus.GetComponent(nme);
					if (menu) {
						menu.Detach();
						contextMenus.Remove(nme);
					}
				} catch (err) {
					iLog("Remove", err, Log.Type.Error);
				}
			},
			RemoveAll : function () {
				try {
					iLog("RemoveAll", "Called");
					
					var menus = contextMenus.GetItemArray();
					for (var i = 0; i < menus.length; i++) {
						var menu = menus[i];
						menu.Detach();
					}
					contextMenus.Reset();
				} catch (err) {
					iLog("RemoveAll", err, Log.Type.Error);
				}
			},
			Detach : function (nme) {
				try {
					iLog("Detach", "Called");
					
					var menu = contextMenus.GetComponent(nme);
					if (menu) {
						menu.Detach();
					}
				} catch (err) {
					iLog("Remove", err, Log.Type.Error);
				}
			},
			DetachAll : function () {
				try {
					iLog("DetachAll", "Called");
					
					var menus = contextMenus.GetItemArray();
					for (var i = 0; i < menus.length; i++) {
						var menu = menus[i];
						menu.Detach();
					}
				} catch (err) {
					iLog("DetachAll", err, Log.Type.Error);
				}
			},
			Attach : function (nme) {
				try {
					iLog("Attach", "Called");
					
					var menu = contextMenus.GetComponent(nme);
					if (menu) {
						menu.Attach();
					}
				} catch (err) {
					iLog("Remove", err, Log.Type.Error);
				}
			},
			AttachAll : function () {
				try {
					iLog("AttachAll", "Called");
					
					var menus = contextMenus.GetItemArray();
					for (var i = 0; i < menus.length; i++) {
						var menu = menus[i];
						menu.Attach();
					}
				} catch (err) {
					iLog("AttachAll", err, Log.Type.Error);
				}
			},
			Hide : function () {
				if (!_isVisible)
					return;
				iLog("Hide", "Called");

				_div.css("display", "none");
				_isVisible = false;
			},
			Show : function (menuCallback, evt, editorName) {
				try {
					this.Hide();
					iLog("Show", "Called");

					var html = menuCallback();
					if (html == null)
						return false;
					
					this.UpdatePossition(evt, editorName);
					
					// if disabled do not stop event propagation!!!
					if (!this.Enabled)
						return false;

					_div.css("left", this.ClientX + this.ScrollX + 'px');
					_div.css("top", this.ClientY + this.ScrollY + 'px');
					_div.html(html);
					_div.css("display", "block");
					_isVisible = true;
					
					return true;
				} catch (err) {
					iLog("Show", err, Log.Type.Error);
				}
			},
			UpdatePossition : function (event, editorName) {
				var evt = event || window.event;
				this.ScrollX = document.body.scrollLeft || document.documentElement.scrollLeft;
				this.ScrollY = document.body.scrollTop || document.documentElement.scrollTop;
				this.ClientX = evt.clientX;
				this.ClientY = evt.clientY;
				
				if (editorName)
					this.ActiveEditor = editorName;

				var evtComp = evt.target || evt.srcElement;
				if (evtComp != this.EventComponent) {
					this.ActiveBox.toggleClass(activeBoxClass, false);
					this.EventComponent = evtComp;

					this.ActiveBox = findParentToPasteTo(evtComp);
					this.ActiveBox.toggleClass(activeBoxClass, true);
				}

				if (evt.offsetX && evt.offsetY) {
					this.OffsetX = evt.offsetX;
					this.OffsetY = evt.offsetY;
				} else {
					var pos = $(this.EventComponent).offset();
					this.OffsetX = Utilities.ToNumber(evt.pageX - pos.left);
					this.OffsetY = Utilities.ToNumber(evt.pageY - pos.top);
				}
			},
			UpdateActiveEditor : function(editorName) {
				this.ClientX = 100;
				this.ClientY = 100;
				this.ActiveEditor = editorName || 'preproc';
				this.ActiveBox.toggleClass(activeBoxClass, false);
				this.ActiveBox = $('#' + this.ActiveEditor);
				this.ActiveBox.toggleClass(activeBoxClass, true);
				this.EventComponent = this.ActiveBox[0];
			}
		};
	};
	
	return ContextMenu;
});

define('PropertyEd', ['PropertyEditorFactory', 'PropertyFieldData', 'Communication', 'Editor'], function (PropertyEditorFactory, PropertyFieldData, Communication, Editor) {
	// This needs ctor/#show logic to be refactored
	
	var PropertyEd = function (undefined) {
		this.reset();

		this._div = $('<div id="PropertyDlg"/>');
		this._table = $('<table/>')
			.appendTo(this._div)
			.addClass('PropertyEditorTable');

		var self = this,
			_config;
		
		var InitConfig = function() {
			if (_config)
				return;
			
			_config = MP.Tools.Config.Editor.property;
		};
		var Pin = function(value) {
			if (value == undefined)
				_config.pinned = !_config.pinned;
			else
				_config.pinned = value;
			
			UpdateButtons();
			
			if (_config.pinned) {
				$(window).bind('scroll.pinPropertyDiv', function () {
					var p = self._div.parent();
					if (p.is(":visible"))
						p.css('top', (self._div.data('lastTop') + $(document).scrollTop()) + "px");
				});
			} else {
				$(window).unbind('scroll.pinPropertyDiv');
			}
		};
		var UpdateButtons = function() {
			var bp = $(".ui-dialog-buttonpane", self._div.parent());
			var FindBtn = function(caption) {
				return $("button:contains(" + caption + ")", bp);
			};
			
			if (_config.pinned)
				FindBtn('Pin').html("Unpin");
			else
				FindBtn('Unpin').html("Pin");
		};
		
		var buttons = {
			'Cancel' : function () {
				self.revertAndClose();
			},
			'Delete' : function () {
				self.saveAndClose();
				
				// XXX TEMPORARY XXX
				if (self.deleteCallback) {
					self.deleteCallback.call(null);
				}
			},
			'Pin' : function () {
				Pin();
			}
		};
		
		this._div.dialog({
			minWidth : 470,
			minHeight : 250,
			width : 650,
			autoOpen : false,
			closeOnEscape : true,
			modal : false,
			buttons : buttons,
			resizeStart: function() {
				Global.DisableHighlightingInChrome(true);
			},
			resizeStop: function() {
				Global.DisableHighlightingInChrome(false);
				PropertyEditorFactory.ResizeAceEditors();
			},
			dragStart: function() {
				Global.DisableHighlightingInChrome(true);
			},
			dragStop: function(event, ui) {
				Global.DisableHighlightingInChrome(false);
				Global.UpdateLastPosition(self._div, ui);
			},
			open: function( event, ui ) {
				UpdateButtons();
				
				if (self._div.data('lastLeft') && self._div.data('lastTop')) {
					self._div.dialog("option", {
						position: [self._div.data('lastLeft'), self._div.data('lastTop')]
					});
				} else {
					Global.UpdateLastPosition(self._div, ui);
				}
			},
			close : function () {
				self.save();				
				self.reset();
			}
		});
		
		InitConfig();
		Pin(_config.pinned || false);
	};
	
	PropertyEd.prototype.iLog = function (Place, Message, Type, Silent) {
		Log.Add("PropEditor.P." + Place, Message, Type, Silent);
	};
	PropertyEd.prototype.reset = function () {
		this.iLog("Reset", "Called");
		
		this.editors = [];
		this.properties = [];
		this.originalValues = [];
		PropertyEditorFactory.DestroyAceEditors();
	};
	PropertyEd.prototype.show = function (properties, deleteCallback, title) {
		this.iLog("Show", "Called");
		
		this.reset();
		this.properties = properties.slice(0); // Clone
		this.deleteCallback = deleteCallback; // XXX TEMPORARY XXX
		
		var self = this;
		var $table = this._table.empty();
		var $body = $('<tbody/>').appendTo($table);		
		var editors = this.editors = $.map(this.properties, function (propertyFieldData) {
				return PropertyEditorFactory.create(propertyFieldData);
			});
		
		// jQuery is RETARDED and removes falsy values from the output when
		// using $.map or $.fn.map, so we do things the old fashion way
		// (i.e. the way which will annoy you because I am annoyed)
		this.originalValues = (function (properties) {
			var ret = [];
			$.each(properties, function (i, propertyFieldData) {
				ret.push(propertyFieldData.get());
			});
			return ret;
		}(properties));
		
		$.each(this.properties, function (i, propertyFieldData) {
			var propertyField = propertyFieldData.propertyField;
			var $header = $('<th/>')
				.text(propertyField.label)
				.addClass('PropertyEditorName');
			var $editor = $('<td/>')
				.append(editors[i].$element)
				.addClass('PropertyEditorValue');
			
			if (editors[i].$element.attr('title').match(/The name of the component/g)) {
				var currentElement = editors[i].$element;
				// save old name before changes on focus
				$(currentElement).bind('focus', function () {
					$(this).attr('oldname', $(this).val());
				});
				
				// check for names uniqueness on blur
				$(currentElement).bind('change', function () {
					var self = $(this);

					if (!self.val()) {
						self.val(self.attr('oldname'));
						jAlert('Component name cannot be blank!', 'Name Warning', function() {
							self.focus();
							self.select();
						});
						return false;
					}
					
					var arr = [];
					$('input[type!="radio"]').each(function () {
						if ($(this).attr('id'))
							arr.push($(this).attr('id'));
					});					
					$('select').each(function () {
						if ($(this).attr('id'))
							arr.push($(this).attr('id'));
					});
					
					if ($.inArray(self.val(), arr) > -1) {
						var nn = self.val();
						self.val(self.attr('oldname'));
						jAlert('Component of name <b>' + nn + '</b> already exists!<br>Please eneter another name.', 'Name Warning', function() {
							self.focus();
							self.select();
						});
						return false;
					}
				});
			}
			
			$editor.find('textarea').removeAttr('disabled');
			$('<tr/>').append($header, $editor).appendTo($body);
		});
		
		// Update title and position of the dialog
		var e = self._div;

		e.dialog('option', 'title', title || 'Editor');
		e.dialog('open');
		
		var w = $(window);
		var wTop = w.scrollTop();
		var wBtm = wTop + w.height();
		var eTop = e.offset().top;
		var eBtm = eTop + e.height();

		if ((eTop < wTop) || (eBtm > wBtm))
			e.dialog( "option", "position", ['center', 'center'] );
		
		PropertyEditorFactory.ResizeAceEditors();
	};	
	PropertyEd.prototype.save = function () {
		if (this.editors.length == 0)
			return;
		this.iLog("Save", "Called");
		
		// Update all properties
		$(this.editors).each(function (i, editor) {
			editor.save();
		});
		// Visually update the script component
		var ctrl = RulesMaker.GetCurrentComponent();
		if (ctrl)
			ctrl.UpdateWatchpoint();
	};	
	PropertyEd.prototype.revertAndClose = function () {
		this.iLog("RevertAndClose", "Called");
		
		this.revertChanges();
		this.saveAndClose();
	};	
	PropertyEd.prototype.saveAndClose = function () {
		this.iLog("SaveAndClose", "Called");
		
		this._div.dialog('close');
	};	
	PropertyEd.prototype.revertChanges = function () {
		this.iLog("RevertChanges", "Called");
		
		var originalValues = this.originalValues;
		
		$(this.properties).each(function (i, propertyFieldData) {
			propertyFieldData.set(originalValues[i]);
		});
		
		$(this.editors).each(function (i, editor) {
			editor.refresh();
		});
	};

	PropertyEd.iLog = function (Place, Message, Type, Silent) {
		Log.Add("PropEditor." + Place, Message, Type, Silent);
	};

	PropertyEd.Property = function (propertyField, getter, setter, args) {
		// XXX TEMPORARY XXX
		return new PropertyFieldData(propertyField, {
			getter : getter,
			setter : setter,
			args : args
		});
	};	
	PropertyEd.GetInstance = function () {
		var ed;
		if (this.editor) {
			ed = this.editor;
			ed.save();
		} else {
			ed = new PropertyEd();
			this.editor = ed;
		}		
		return ed;
	};	
	PropertyEd.Show = function () {
		this.iLog("Show", "Called");
		
		var ed = this.GetInstance();
		ed.show.apply(ed, arguments);
		return ed;
	};	
	PropertyEd.Hide = function () {
		var ed = this.GetInstance();
		ed.saveAndClose();
		return ed;
	};
	PropertyEd.Close = function () {
		this.iLog("Close", "Called");
		
		if (Editor.LockedBy)
			Communication.CloseEditor();
		else {
			jConfirm('Are you sure you want to exit without saving?', 'Confirm Exit', function(answer) {
				if (answer)
					Communication.CloseEditor();
			});
		};
	};
	PropertyEd.Save = function () {
		if (!Editor.Enabled || Editor.LockedBy || Global.InProgress())
			return;
		this.iLog("Save", "Called");
		
		Communication.EditorUpdate(false);
	};
	PropertyEd.QuickSave = function () {
		if (!Editor.Enabled || Editor.LockedBy || Global.InProgress())
			return;
		this.iLog("QuickSave", "Called");
		
		Communication.EditorUpdate(true);
	};

	return PropertyEd;
});

define('Global', ['Editor', 'ReqList', 'Log', 'PageHelper'], function (Editor, ReqList, Log, PageHelper) {
	var Global = new function () {
		try {
			/* PRIVATE PROPERTIES */
			var logClassName = "Global.",
				ProgressBar = null,
				msgQueue = [];
			
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
					var cd = $.parseJSON(ColorData);

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
				DisableTooltips : false,
				FadingHelpLinks: false,

				/* PUBLIC METHODS */
				Version : function () {
					return MP.StingrayJsVersion;
				},
				ShowBarcodeDlg : function () {
					jPrompt('Scan a barcode while the cursor is in this edit box\nWARNING: Any unsaved changes on current page will be lost!', '', 'Barcode Scanner', function(bc) {
						if (bc)
							Communication.LinkRequest('BarCode.max?' + $.param({'BC' : bc}));
					});
				},
				SetRequiredForAllElements : function (isRequired, commaList) {
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
				RemoveAllSpellchecks : function () {
					try {
						if (!window.livespell)
							return;
							
						livespell.spellingProviders = [];
					} catch (err) {
						iLog("RemoveAllSpellchecks", err, Log.Type.Error);
					}
				},
				// Add Spellcheck to a field
				AddSpellcheck : function (obj) {
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
							'width' : '100%',
							'height' : '100%'
						});
					} catch (err) {
						iLog("AddSpellcheck", err, Log.Type.Error);
					}
				},
				ConvertToInlineCKEditor : function(element) {
					try {
						var el = $(element),
							id = el.attr('id'),
							tt = el.attr('title'),
							ed = CKEDITOR.instances[id];
						
						// Remove an older instance of same name!
						if (ed)
							ed.destroy();

						el.attr('contenteditable', true);
						el.addClass('ckEditor');

						var cfg = {
							removeButtons : 'Anchor',
							title : tt,
							toolbarGroups : [
							    { name: 'document',    groups: [ 'mode', 'document', 'doctools' ] },
							    { name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
							    { name: 'paragraph',   groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },
							    { name: 'links' },
							    { name: 'insert' },
							    { name: 'editing',     groups: [ 'find', 'selection', 'spellchecker' ] },
							    '/',
							    { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
							    { name: 'styles' },
							    { name: 'colors' }
							]
						};
						return CKEDITOR.inline(id, cfg);
					} catch (err) {
						iLog("ConvertToInlineCKEditor", err, Log.Type.Error, true);
					}
				},
				GetCKEditorValue : function(element) {
					try {
						var ed,
							id = $(element).attr('id');
						if (id)
							ed = CKEDITOR.instances[id];
						if (ed)
							return ed.getData();
						else
							return null;
					} catch (err) {
						iLog("GetCKEditorValue", err, Log.Type.Error);
					}
				},
				ConvertToAceEditor : function (element, config) {
					if (!MP.Tools.AceEnabled())
						return;

					config = $.extend({
						language: 'text',
						focus: false,
						theme: 'chrome',
						styles: {}
					}, config);

					var makeAceMode = function(lng) {
						if (lng == 'server script')
							lng = 'pascal';
						return "ace/mode/" + lng;
					};

					var cfg = MP.Tools.Config.Editor.ace;
					var parent, ae, el;
					if ((element.is("textarea") || element.is("input")) /*&& element.is(":visible")*/) {
						element.hide();
						
						parent = element.parent();
						el = $('<div/>')
							.css(config.styles)
							.appendTo(parent);
						el = el.get(0);
						ae = ace.edit(el);
						ae.setValue(element.val(), -1);
					} else {
						parent = element.parent()
							.css(config.styles);
						el = element.get(0);
						ae = ace.edit(el);
					};
					
					var themes = ["chrome", "clouds", "crimson_editor", "dawn", "dreamweaver", "eclipse", "github",
						"solarized_light", "textmate", "tomorrow", "xcode", "clouds_midnight", "cobalt", "idle_fingers", "kr_theme", "merbivore",
						"merbivore_soft", "mono_industrial", "monokai", "pastel_on_dark", "solarized_dark", "tomorrow_night", "tomorrow_night_blue",
						"tomorrow_night_bright", "tomorrow_night_eighties", "twilight", "vibrant_ink", "ambiance", "chaos"];
					var languages = ["text", "sql", "javascript", "server script", "xml", "json", "html", "css"];
					var help =
						'F1  -  Context help<br>' +
						'F11  -  Toggle full screen<br>' +
						'Alt-W  -  Toggle word wrap<br>' +
						'Tab  -  Indent selection<br>' +
						'Shift-Tab  -  Outdent selection<br>' +
						'Alt-S  -  Remove doubled single quotes<br>' +
						'Alt-D  -  Double single quotes<br>' +
						'Ctrl-/  -  Toggle comment<br>' +
						'Ctrl-L  -  Go to line number<br>' +
						'Alt-L  -  Toggle fold<br>' +
						'Alt-0  -  Fold all<br>' +
						'Alt-Shift-0  -  Unfold all<br>' +
						'Ctrl-F  -  Find<br>' +
						'Ctrl-H  -  Replace<br>' +
						'Ctrl-K  -  Find next<br>' +
						'Ctrl-Shift-K  -  Find previous<br>' +
						'Ctrl-P  -  Jump to matching end<br>' +
						'Ctrl-Shift-P  -  Select to matching end<br>' +
						'Ctrl-U  -  To uppercase<br>' +
						'Ctrl-Shift-U  -  To lowercase<br>' +
						'Ctrl-D  -  Remove line<br>' +
						'Ctrl-Shift-D  -  Duplicate selection<br>' +
						'Ctrl-Alt-S  -  Sort selected lines<br>' +
						'Alt-Shift-Up  -  Copy lines up<br>' +
						'Alt-Up  -  Move lines up<br>' +
						'Alt-Shift-Down  -  Copy lines down<br>' +
						'Alt-Down  -  Move lines down<br>' +
						'Ctrl-[  -  Outdent line<br>' +
						'Ctrl-]  -  Indent line<br>' +
						'Ctrl-Up  -  Scroll up<br>' +
						'Ctrl-Down  -  Scroll down<br>' +
						'Ctrl-A  -  Select all<br>' +
						'Alt-mouse  -  Select rectangle<br>' +
						'Ctrl-Alt-E  -  Toggle recording<br>' +
						'Ctrl-Shift-E  -  Replay macro';
					
					//language = language || languages[0];
					ae.session.setMode(makeAceMode(config.language));
					ae.session.setUseWrapMode(cfg.wordWrap);
					ae.setFontSize(14);
					
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
						.val(cfg.theme || config.theme)
						.change();
					
					$('<select/>')
						.attr('title', "Change editor language")
						.addClass("ace_selector")
						.append(Utilities.ConvertToOptions(languages))
						.appendTo(aceFoot)
						.change(function() {
							var sel = $(this).val().toLowerCase();
							ae.session.setMode(makeAceMode(sel));
						})
						.val(config.language);
					
					var hlp = $('<div/>');
					hlp.addClass("ace_help");
					hlp.appendTo(aceFoot);

					if (MP.Tools.jqxGridsEnabled())
						jQ(hlp.get(0)).jqxTooltip({ content: help, autoHideDelay: 50000, theme: 'editor' });
					else {
						help = Utilities.ReplaceAll(help, '<br>', '\n');
						hlp.attr('title', help);
					}

					
					if (cfg.codeTips)
						ae.tokenTooltip = new TokenTooltip(ae);
					if (config.focus)
						ae.focus();

					return ae;
				},
				GetCookie : function (name) {
					try {
						var i, arr, c, x, y;
						arr = document.cookie.split("; ");
						for (i = 0; i < arr.length; i++) {
							c = arr[i];
							x = c.substring(0, c.indexOf("="));
							x = x.trim();
							if (x == name) {
								y = c.substring(c.indexOf("=") + 1);
								y = unescape(y);
								return y;
							}
						}
					} catch (err) {
						iLog("GetCookie", err, Log.Type.Error, true);
					}
					return "";
				},
				SetCookie : function (name, value) {
					try {
						var exdate = new Date();
						exdate.setDate(exdate.getDate() + 1);
						document.cookie = name + "=" + escape(value) + "; expires=" + exdate.toUTCString();
					} catch (err) {
						iLog("SetCookie", err, Log.Type.Error);
					}
				},
				CheckWorkflow : function () {
					iLog("CheckWorkflow", "Remove obsolete Global.CheckWorkflow function!", Log.Type.Warning);
				},
				TooltipsClick : function() {
					var icon = $("#TooltipIcon"),
						status = icon.attr("status") == "0" ? "1" : "0";
					
					Communication.CustomRequest("icontray.max?action=tooltips&status=" + status, function (html) {
						var h = $(html);
						icon.attr("alt", h.attr("alt"));
						icon.attr("status", h.attr("status"));
						icon.attr("src", h.attr("src"));
						
						Global.Tooltips(icon.attr("status") == "1");
					}, null);
				},
				// Disable or Enable all tooltips on all pages
				Tooltips : function (boolShow) {
					try {
						if (boolShow == undefined)
							boolShow = Global.DisableTooltips;
						else
							Global.DisableTooltips = boolShow;
						
						if (boolShow) {
							$("*[oldtitle]").each(function () {
								$(this).attr("title", $(this).attr("oldtitle"));
								$(this).removeAttr("oldtitle");
							});
						} else {
							$("*[title]").each(function () {
								$(this).attr("oldtitle", $(this).attr("title"));
								$(this).removeAttr("title");
							});
						}
					} catch (err) {
						iLog("Tooltips", err, Log.Type.Error);
					}
				},
				DetachElements : function(elements) {
					elements = $(elements);
					var objs = [];

					$.each(elements, function() {
						var elm = $(this),
							obj = {
								parent : elm.parent(),
								element: elm.detach()
							};

						objs.push(obj);
					});

					return objs;
				},
				ReattachElements : function(array) {
					$.each(array, function() {
						this.element.appendTo(this.parent);
					});
				},
				
				// returns a template component or array of components matching the id passed in
				GetControl : function (ctrlID) {
					try {
						//var inpt = $("#" + ctrlID); - won't return two objects with same id such as radio buttons
						var inpt = $("*[name='" + ctrlID + "']"),
							arr = [];
						
						inpt.each(function () {
							var ctrl = $(this).parent(".component");
							if (ctrl.length) // prevents problems where the same id is used on a non-control element (hack)
								arr.push(PageHelper.GetEditorComponent(ctrl[0]));
						});
						
						if (arr.length == 1)
							return arr[0];
						else
							return arr;
					} catch (err) {
						iLog("GetControl", err, Log.Type.Error);
					}
				},
				MakeReadOnly : function (div) {
					try {
						var sel = null;
						if ((typeof div == null) || (typeof div == 'undefined') || div == '') sel = $( '#middle' );
						else sel=$( div );						
						inp = sel.find( ":checkbox, :radio, select" ).attr( "disabled", true );
						inp = sel.find( ":text, textarea" ).attr( "readonly", true );
					} catch (err) {
						iLog("MakeReadOnly", err, Log.Type.Error);
					}
				},
				
				InProgress : function () {
					return ProgressBar && ProgressBar.is(":visible");
				},
				ShowProgress : function (blurInput) {
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
				HideProgress : function () {
					try {
						if (ProgressBar)
							ProgressBar.hide();
					} catch (err) {
						iLog("HideProgress", err, Log.Type.Error);
					}
				},
				
				HideMessage : function () {
					try {
						$("#ModalWindow").dialog("close");
					} catch (err) {
						iLog("HideMessage", err, Log.Type.Error);
					}
				},
				ShowErrorMessage : function (html, title, buttons, width) {
					title = title || 'Error';
					width = width || 800;
					buttons = buttons || {
						'Close' : function () {
							$(this).dialog('close');
						}
					};

					this.ShowMessage(html, width, title, null, buttons);
				},
				ShowMessage : function (html, width, title, opacity, buttons) {
					try {
						var mw = $('#ModalWindow');
						var showNextMessage = function () {
							var msg = msgQueue.shift();							
							if (!msg)
								return;
							
							mw.dialog('option', 'width', msg.width);
							mw.dialog('option', 'title', msg.title);
							mw.dialog('option', 'overlay', {
								opacity : msg.opacity,
								background : msg.color
							});
							mw.dialog('option', 'buttons', msg.buttons);
							mw.dialog('close'); // Needed to get around jQuery UI bug (is it a bug?)
							mw.html($('<div/>').html(msg.html));
							mw.dialog('open');
						};
						
						if (!mw.attr("dialoginit")) {
							msgQueue = [];
							mw.css("display", "block");
							mw.dialog({
								modal   : true,
								autoOpen: false
							});
							mw.attr("dialoginit", "true");							
							mw.bind('dialogclose', function () {
								showNextMessage();
							});
						}
						
						msgQueue.push({
							html   : html,
							width  : width || 960,
							title  : title || '',
							opacity: opacity || .5,
							color  : '#000',
							buttons: buttons || {}
						});
						
						showNextMessage();
					} catch (err) {
						iLog("ShowMessage", err, Log.Type.Error);
					}
				},
				ReloadStyles : function (jsonColorStr, cssFilesCSV) {
					if (!jsonColorStr)
						return;
					
					cssFilesCSV = cssFilesCSV || 'global.css,custom.css,tablewalker.css';
					var cssFilesArr = cssFilesCSV.split(',');
					var cd = $.parseJSON(jsonColorStr);
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
				ShakeElement : function (element, times) {
					times = times || 10;
					var left = Utilities.ToNumber(element.css("left"));
					var Shake = function() {
						times--;
						if (times) {
							var offset = (times % 2 == 0) ? times : -times,
								x = left + offset;
							
							element.css('left', x + 'px');
							setTimeout(Shake, 50);
						} else {
							element.css('left', left + 'px');
						};
					};
					
					Shake();
				},
				ScrollToElement : function (element, speed, onComplete) {
					var s = (Browser.IsSafari()) ? 'body' : 'html';
					$(s).animate({
						scrollTop: element.offset().top
					}, speed || 500, onComplete);
				},
				// Content highlighting fix during dragging and resizing in Chrome! LK: May not be needed anymore!
				DisableHighlightingInChrome : function (disable) {
					if (!Browser.IsChrome())
						return;
					
					if (disable)
						$(document).disableSelection();
					else
						$(document).enableSelection();
				},
				UpdateLastPosition : function (div, ui) {
					var doc = $(document);
					var pos = (ui && ui.position) ? ui.position : div.parent().offset();
					
					div.data('lastTop', Utilities.ToNumber(pos.top - doc.scrollTop()));
					div.data('lastLeft', Utilities.ToNumber(pos.left - doc.scrollLeft()));
				},
				SetClipboard : function(dataOrInput) {
					var el,
						result = false,
						cleanup = Utilities.IsString(dataOrInput);

					if (cleanup)
						el = $('<textarea class="clipboardCont"/>').val(dataOrInput).appendTo('body');
					else
						el = $(dataOrInput);

					el.select();

					try {
						result = document.execCommand('copy');
					} catch (err) {}

					if (cleanup)
						el.remove();

					return result;
				},
				GetClipboard : function(input) {
					var el = $(input),
						result = '',
						cleanup = !el.length;

					if (cleanup)
						el = $('<textarea class="clipboardCont"/>').appendTo('body');

					el.select();

					try {
						if (document.execCommand('paste'))
							result = el.val();
					} catch (err) {}

					if (cleanup)
						el.remove();

					return result;
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	return Global;
});

define('RuleStorage', ['Storage'], function (Storage) {
	// Delegates the storage between preprocess and post process
	var RuleStorage = new function () {
		try {
			var logClassName = "RuleStorage.";
			var PreProcStorage = new Storage('Pre');
			var PostProcStorage = new Storage('Post');
			var CurrentStorage = null;

			function iLog(Place, Message, Type, Silent) {
				Log.Add(logClassName + Place, Message, Type, Silent);
			}
			
			this.AddComponent = function (Component, ID) {
				try {
					CurrentStorage.AddComponent(Component, ID);
				} catch (err) {
					iLog("AddComponent", err, Log.Type.Error);
				}
			};
			this.GetComponent = function (ID) {
				try {
					return CurrentStorage.GetComponent(ID);
				} catch (err) {
					iLog("GetComponent", err, Log.Type.Error);
				}
			};
			this.GetCount = function () {
				try {
					return CurrentStorage.GetCount();
				} catch (err) {
					iLog("GetCount", err, Log.Type.Error);
				}
			};
			this.GetCurrentStorage = function () {
				try {
					return CurrentStorage;
				} catch (err) {
					iLog("GetCurrentStorage", err, Log.Type.Error);
				}
			};
			this.GetItemArray = function () {
				try {
					return CurrentStorage.GetItemArray();
				} catch (err) {
					iLog("GetItemArray", err, Log.Type.Error);
				}
			};
			this.GetIdArray = function (asNumeric) {
				try {
					return CurrentStorage.GetIdArray(asNumeric);
				} catch (err) {
					iLog("GetIdArray", err, Log.Type.Error);
				}
			};
			this.Remove = function (ID) {
				try {
					CurrentStorage.Remove(ID);
				} catch (err) {
					iLog("Remove", err, Log.Type.Error);
				}
			};
			this.Reset = function () {
				try {
					CurrentStorage.Reset();
				} catch (err) {
					iLog("Reset", err, Log.Type.Error);
				}
			};
			this.SetCurrentProcess = function (ProcessDivID) {
				if (ProcessDivID == "preproc")
					CurrentStorage = PreProcStorage;
				else
					CurrentStorage = PostProcStorage;
			};
			this.GetStorage = function (ProcessDivID) {
				if (ProcessDivID == "preproc")
					return PreProcStorage;
				else
					return PostProcStorage;
			};
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	return RuleStorage;
});

define('IconMover', ['RuleXML', 'RuleStorage'], function (RuleXML, RuleStorage) {
	var IconMover = new function () {
		var logClassName = "IconMover.";
		
		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place, Message, Type, Silent);
		}

		return {
		
			Load : function (id) {
				try {
					this.Ctrl = RuleStorage.GetComponent(id);
					this.Ctrl.OldEntry = this.Ctrl.GetIcon().GetEntryPoint();
					this.Ctrl.OldExit = this.Ctrl.GetIcon().GetExitPoint();
					var temp = RuleXML.GetFromComponent(id);
					if (temp) {
						this.FromJ1 = (temp.GetJ1() == this.Ctrl.GetID());
						this.From = temp.GetIcon().GetExitPoint();
					}
					if (this.Ctrl.GetJ1 && this.Ctrl.GetJ1()) {
						temp = RuleStorage.GetComponent(this.Ctrl.GetJ1());
						if (temp && temp.GetIcon)
							this.J1 = temp.GetIcon().GetEntryPoint();
						else
							this.J1 = null;
					}
					if (this.Ctrl.GetJ2 && (this.Ctrl.GetJ2())) {
						temp = RuleStorage.GetComponent(this.Ctrl.GetJ2());
						if (temp && temp.GetIcon)
							this.J2 = temp.GetIcon().GetEntryPoint();
						else
							this.J2 = null;
					}
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			},
			MoveSelected : function (x, y) {
				var selected = RulesMaker.GetSelected();
				for (var i = 0; i < selected.length; i++) {
					var ctrl = RuleStorage.GetComponent(selected[i]);
					ctrl.Icon.MoveBy(x, y);
				}
			},
			Reset : function () {
				this.Ctrl = null;
				this.From = null;
				this.FromJ1 = null;
				this.J1 = null;
				this.J2 = null;
				this.Enabled = false;
			},
			Enable : function () {
				this.Enabled = true;
			},
			Refresh : function () {
				try {
					if (!this.Enabled)
						return;
					this.Ctrl.Icon.UpdateComment();
					RuleGraphics.ReDraw();
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			},
			Enabled : false,	// whether the control is enabled
			Ctrl : null,		// a rules maker component
			J1 : null,			// the primary point the control goes to
			J2 : null,			// the secondary point the control goes to
			From : null,		// the point that goes to the control
			FromJ1 : null
		};
	};
	
	return IconMover;
});

define('IconConnector', ['ContextMenu', 'RuleStorage'], function (ContextMenu, RuleStorage) {
	var IconConnector = new function (undefined) {

		/* PRIVATE PROPERTIES */
		var logClassName = "IconConn.",
			_fromID,
			_fromComp;
		
		/* PRIVATE METHODS */		
		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place, Message, Type, Silent);
		}
		
		return {
			Reset : function () {
				_fromID = null;
				if (_fromComp)
					_fromComp.HighlightAsConnecting(false);
				_fromComp = null;
				ContextMenu.Enabled = true;
			},
			CanvasClicked : function (event) {
				try {
					var btn = event.which,
						shift = event.shiftKey;
					iLog("CanvasClicked", "Btn=" + btn);
					
					if (!shift || !_fromComp) {
						this.Reset();
						return;
					}
					
					// First component have been clicked
					switch (btn) {
					case 1:
						var toID = _fromComp.GetJ1(),
							toComp = RuleStorage.GetComponent(toID);
						this.DisConnect(_fromComp, toComp, _fromComp.SetJ1);
						break;
					case 3:
						var getJ2 = _fromComp.GetJ2 || $.noop,
							toID = getJ2(),
							toComp = RuleStorage.GetComponent(toID);
						this.DisConnect(_fromComp, toComp, _fromComp.SetJ2);
						ContextMenu.Enabled = false;
						break;
					}

				} catch (err) {
					iLog("CanvasClicked", err, Log.Type.Error);
				}
			},
			IconClicked : function (ID, event) {
				try {
					var btn = event.which,
						shift = event.shiftKey;
					iLog("IconClicked", "ID=" + ID + ", Btn=" + btn);
					
					// Do nothing if clicked on same component
					if (ID == _fromID)
						return;
					
					// Clear previously highlighted component
					if (_fromID && !shift)
						_fromComp.HighlightAsConnecting(false);
					
					// Highlight newely clicked component
					if (ID && !shift) {
						_fromComp = RuleStorage.GetComponent(ID);
						_fromComp.HighlightAsConnecting(true);
						_fromID = ID;
						return;
					}

					// Two different components have been clicked
					if (ID && shift) {
						var toComp = RuleStorage.GetComponent(ID);
						
						switch (btn) {
						case 1:
							if (_fromComp && _fromComp.SetJ1)
								this.Connect(_fromComp, toComp, _fromComp.SetJ1);
							break;
						case 3:
							if (_fromComp && _fromComp.SetJ2)
								this.Connect(_fromComp, toComp, _fromComp.SetJ2);
							ContextMenu.Enabled = false;
							break;
						}
					}
				} catch (err) {
					iLog("IconClicked", err, Log.Type.Error);
				}
			},
			Connect : function (From, To, Set) {
				iLog("Connect", "From: " + From.GetID() + " To: " + To.GetID());
				
				var toID = To.GetID();
				
				// Disconnect the 2nd connection if it is the same
				if (From.GetJ2) {
					var id, fn;
					if (Set == From.SetJ2) {
						id = From.GetJ1();
						fn = From.SetJ1;
					} else {
						id = From.GetJ2();
						fn = From.SetJ2;
					}
					if (toID == id)
						this.DisConnect(From, To, fn);
				};
					
				Set(toID);
				RuleGraphics.Refresh();
			},
			DisConnect : function (From, To, Set) {
				if (From && To)
					iLog("Disconnect", "From: " + From.GetID() + " To: " + To.GetID());
				
				if (Set)
					Set("");
				
				RuleGraphics.Refresh();
			}
		}
	};
	
	IconConnector.Reset();
	return IconConnector;
});

define('RuleIcon', ['IconMover', 'RuleStorage'], function (IconMover, RuleStorage) {
	function RuleIcon() {
		try {
			/* PRIVATE PROPERTIES */
			var logClassName = "RuleIcon.";
			var CurrentPositionX;
			var CurrentPositionY;
			var _img = null;
			var _div = null;
			var _container = null;
			var _iconMover = null;
			var _component = null;

			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				var s = "";
				if (_img)
					s = _img.attr("id");
				if (s != "")
					s = s + ".";
				Log.Add(s + logClassName + Place, Message, Type, Silent);
			}
			function AddFeatures() {
				try {
					iLog("AddFeatures", "Called");
					
					_img.draggable({
						containment : "parent",
						grid : [32, 26],
						start : function () {
							Global.DisableHighlightingInChrome(true);
							
							CurrentPositionX = null;
							CurrentPositionY = null;
						},
						stop : function () {
							Global.DisableHighlightingInChrome(false);
							
							var selected = RulesMaker.GetSelected();
							for (var i = 0; i < selected.length; i++) {
								var id = selected[i];
								var ctrl = RuleStorage.GetComponent(id);
								if (ctrl) {
									try {
										var pos = ctrl.Icon.GetImage().position();
										ctrl.SetX(pos.left);
										ctrl.SetY(pos.top);
										ctrl.Icon.UpdateComment();
									} catch (err) {
										iLog("StopDragging", "Failed to update position of ID: " + id + ". Reason: " + err.message, Log.Type.Error, true);
									};
								} else
									iLog("StopDragging", "Cannot locate component ID: " + id, Log.Type.Warning);
							};
							RuleGraphics.Refresh();
						},
						drag : function () {
							var img = $(this);
							var x = img.css("left");
							var y = img.css("top");
							if ((CurrentPositionX == x) && (CurrentPositionY == y))
								return;
							
							if (CurrentPositionX && CurrentPositionY) {
								var diffX = parseInt(x, 10) - parseInt(CurrentPositionX, 10);
								var diffY = parseInt(y, 10) - parseInt(CurrentPositionY, 10);
							} else {
								var diffX = null;
								var diffY = null;
							}

							CurrentPositionX = x;
							CurrentPositionY = y;
							
							var id = _img.attr("id");
							if (!RulesMaker.IsSelected(id)) {
								RulesMaker.ClearSelected();
								RulesMaker.AddSelected(id);
							};
							IconMover.MoveSelected(diffX, diffY);
						}
					});
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			function getEntryPoint() {
				try {
					var t = Utilities.ToNumber(_img.css("top"));
					var l = Utilities.ToNumber(_img.css("left"));
					var w = Utilities.ToNumber(_img.width());
					var x = l + parseInt(w / 2, 10);
					var y = t;
					return new RuleGraphics.Point(x, y);
				} catch (err) {
					iLog("getEntryPoint", err, Log.Type.Error);
				}
			}
			function getExitPoint() {
				try {
					var t = Utilities.ToNumber(_img.css("top"));
					var l = Utilities.ToNumber(_img.css("left"));
					var w = Utilities.ToNumber(_img.width());
					var h = Utilities.ToNumber(_img.height());
					var x = l + parseInt(w / 2, 10);
					var y = t + h;
					return new RuleGraphics.Point(x, y);
				} catch (err) {
					iLog("getExitPoint", err, Log.Type.Error);
				}
			}

			/* PUBLIC METHODS */

			this.Load = function (component) {
				try {
					iLog("Load", "Called");
					
					_component = component;
					var id = _component.GetID();
					_div = $("<div class='RuleIconComment' commentid='" + id + "'>");
					
					_img = $("<img/>");
					_img.attr("src", _component.Src);					
					_img.attr("id", id);
					_img.addClass("icon");
					_img.css("top", _component.GetY());
					_img.css("left", _component.GetX());
					_img.css("position", "absolute");
					_img.appendTo('<div/>'); // HACK to corect display in IE!

					AddFeatures();
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.AppendTo = function (Container) {
				try {
					_container = Container;
					_container.append(_img);
					_container.append(_div);

					this.UpdateComment();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			// removes the image from the canvas
			this.Delete = function () {
				iLog("Delete", "Called");
				
				_container.find("div[commentid='" + _img.attr("id") + "']").remove();
				_img.remove();
			};
			this.GetContainer = function () {
				try {
					return _container;
				} catch (err) {
					iLog("GetContainer", err, Log.Type.Error);
				}
			};
			this.GetEntryPoint = function () {
				try {
					return getEntryPoint();
				} catch (err) {
					iLog("GetEntryPoint", err, Log.Type.Error);
				}
			};
			this.GetExitPoint = function () {
				try {
					return getExitPoint();
				} catch (err) {
					iLog("GetExitPoint", err, Log.Type.Error);
				}
			};
			this.GetImage = function () {
				return _img;
			};
			this.MoveBy = function (x, y) {
				var newX = Utilities.ToNumber(_img.css("left")) + x;
				var newY = Utilities.ToNumber(_img.css("top")) + y;
				this.MoveTo(newX, newY);
			};
			this.MoveTo = function (x, y) {
				_img.css("left", x).css("top", y);
			};
			this.SetIconMover = function (mover) {
				_iconMover = mover;
			};
			this.UpdateComment = function (remove) {
				try {
					var s = $.trim(_component.GetComment()),
						newLine = s.substring(0).search(/[\n\r]/),
						txt;
					
					if (newLine > 0 && newLine < 25)
						txt = s.substring(0, newLine);
					else {
						if (s.length > 25)
							txt = s.substring(0, 25) + '...';
						else
							txt = s;
					}

					_div.text(_component.GetID() + ": " + txt);
					_div.css("top", _img.css("top")).css("left", _img.css("left"));
					
					//_img.attr("title", s);
					var jQimg = jQ(_img[0]);
					if (!remove && s && Utilities.SafeStrCompare(s, txt)) {
						s = s.replace(/[\n\r]/g, '<br/>');
						jQimg.jqxTooltip({ content: s, showDelay: 1000, autoHideDelay: 50000, theme: 'editor' });
						_div.css("color", 'blue');
					} else {
						jQimg.jqxTooltip('destroy');
						_div.css("color", 'black');
					}
				} catch (err) {
					iLog("UpdateComment", err, Log.Type.Error);
				}
			};
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return RuleIcon;
});

// This script provides standard functions used by Javascript Control Objects found in the controls.js
define('RuleHelper', ['RuleIcon', 'RuleStorage'], function (RuleIcon, RuleStorage) {
	
	// Building componentTypes isn't safe, but if we don't do it this way we will encounter circular dependency issues because many components depend upon RuleHelper
	var compTypeIncludes = {
		'CSF' : 'rules/comp/CompiledScriptFunction',
		'SCRIPT' : 'rules/comp/Script',
		'SQLTRN' : 'rules/comp/SqlTrn',
		'ERROR' : 'rules/comp/Error',
		'EXTERNAL' : 'rules/comp/External',
		'IF' : 'rules/comp/If',
		'INSERTUPDATEQUERY' : 'rules/comp/InsertUpdateQuery',
		'MATH' : 'rules/comp/Math',
		'SELECTQUERY' : 'rules/comp/SelectQuery',
		'SET' : 'rules/comp/Set',
		'TEMPLATE' : 'rules/comp/Template'
	};
	
	var includes = [],
		types = [],
		key;	
	for (key in compTypeIncludes) {
		if (compTypeIncludes.hasOwnProperty(key)) {
			includes.push(compTypeIncludes[key]);
			types.push(key);
		}
	}
	
	var componentTypes = {};	
	require(includes, function () {
		for (var i = 0; i < types.length; ++i)
			componentTypes[types[i]] = arguments[i];
	});
	
	var RuleHelper = new function () {
		var logClassName = "RuleHelper.";
		
		try {
			function iLog(Place, Message, Type, Silent) {
				Log.Add(logClassName + Place, Message, Type, Silent);
			}
			function loadComponent(xmlNode) {
				try {
					var type = $(xmlNode).find(">t").text();
					type.toUpperCase();
					var fn = componentTypes[type];
					var ctrl = new fn();
					ctrl.Load(xmlNode);
					return ctrl;
				} catch (err) {
					iLog("loadComponent", 'Most likely unknown type: ' + type, Log.Type.Error, true);
				}
			}
			
			return {
			
				Search : function (str, options) {
					var proc = ["preproc", "postproc"];
					for (var p = 0; p < proc.length; p++) {
						var rs = RuleStorage.GetStorage(proc[p]);
						if (str)
							iLog("Search", "Searching " + rs.GetCount() + " " + proc[p].toUpperCase() + " components for '" + str + "'", Log.Type.Debug);
						else
							iLog("Search", "Clearing", Log.Type.Info);
						
						var arr = rs.GetItemArray();
						$.each(arr, function () {
							var el = this;
							try {
								el.Search(str, options);
								el.HighlightAsError(false);
							} catch (err) {
								iLog('BadComponent', el, Log.Type.Search);
								el.HighlightAsError(true);
							}
						});
					}
				},
				LoadComponents : function (xmlNode, divTarget) {
					try {
						iLog("LoadComponents", "Called");
						
						var div = $(divTarget);
						div.html('');
						$(xmlNode).find(">c").each(function () {
							var comp = loadComponent(this);
							if (!comp)
								return;
							
							// Correct X/Y
							comp.SetX(Utilities.SnapTo(comp.GetX(), 32));
							comp.SetY(Utilities.SnapTo(comp.GetY(), 26));

							var icon = new RuleIcon();
							icon.Load(comp);

							comp.SetIcon(icon);
							icon.AppendTo(div);
							RuleStorage.AddComponent(comp, comp.GetID());
							comp.UpdateWatchpoint();
						});
					} catch (err) {
						iLog("LoadComponents", err, Log.Type.Error);
					}
				},
				ValidatePage : function () {
					try {
						RuleHelper.Search();
						
						var proc = ["preproc", "postproc"],
							ifs = 0,
							badCon = 0,
							noCon = 0,
							wpSet = 0,
							noComm = 0,
							s = '';
						
						for (var p = 0; p < proc.length; p++) {
							var rs = RuleStorage.GetStorage(proc[p]),
								arr = rs.GetItemArray();
								
							iLog("ValidatePage", "Validating " + arr.length + " " + proc[p].toUpperCase() + " components", Log.Type.Debug);
							
							$.each(arr, function (idx, item) {
								var isWrong = false;
								
								// Connections
								if (item.Type == 'IF') {
									if (!item.GetJ1() || !item.GetJ2()) {
										badCon++;
										isWrong = true;
										iLog(item.GetID() + '.BadConnection', item, Log.Type.Search);
									};
								};
								
								if ($.inArray(item.Type, ['ERROR', 'TEMPLATE']) > -1) {
									if (item.GetJ1()) {
										badCon++;
										isWrong = true;
										iLog(item.GetID() + '.BadConnection', item, Log.Type.Search);
									};
								};
								
								// Watch points
								if (item.GetWatchpoint()) {
									wpSet++;
									iLog(item.GetID() + '.WatchpointSet', item, Log.Type.Search);
								};
								
								// Comments
								if (!item.GetComment()) {
									noComm++;
									iLog(item.GetID() + '.NoComment', item, Log.Type.Search);
								};
								
								var hasConn = false,
									id = item.GetID();
								for (var i = 0; i < arr.length; i++) {
									if (arr[i] == item)
										continue;
									
									if (arr[i].GetJ1() == id || arr[i].GetJ2 && arr[i].GetJ2() == id) {
										hasConn = true;
										break;
									};
								};
								if (!hasConn) {
									noCon++;
									isWrong = true;
									iLog(item.GetID() + '.NotConnected', item, Log.Type.Search);
								};
								
								item.HighlightAsError(isWrong);
							});
						};
						
						if (badCon)
							s += 'Wrong connections: ' + badCon + '<br>';
						if (noCon > 2)
							s += 'Not connected: ' + parseInt(noCon - 2) + '<br>';
						if (wpSet)
							s += 'Watch points set: ' + wpSet + '<br>';
						if (noComm)
							s += 'No component comments: ' + noComm + '<br>';
						if (s)
							iLog('ValidatePage', 'Discovered ' + parseInt(badCon + noCon + wpSet + noComm) + ' possible problems!', Log.Type.Debug);
					} catch (err) {
						iLog("ValidatePage", err, Log.Type.Error);
					}
					return s;
				},
				ComponentTypes : componentTypes
			};
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	return RuleHelper;
});

define('Undo', [], function () {
	var undo = function (identifier, callBack) {
	
		var logClassName = identifier + "Undo.",
			mainCallBack = callBack, 
			states = [],
			current = 0,
			self = this;
		
		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place, Message, Type, Silent);
		};
		function StateObj(value, callBack, parentID) {
			this.value = value;
			this.callBack = callBack || mainCallBack;
			this.parentID = parentID;
		};

		this.ID = identifier;

		this.Clear = function () {
			states.reset();
			states = [];
			current = 0;
		};
		this.Add = function (value, parentID, callBack) {
			var so = new StateObj(value, callBack, parentID);

			if (current < states.length)
				states.splice(current, states.length);
			
			states.push(so);

			if (states.length > 10)
				states.shift(so);

			current = states.length;
		};
		this.CanRedo = function () {
			return current < states.length - 1;
		};
		this.CanUndo = function () {
			return current > 0;
		};
		this.Undo = function () {
			try {
				if (!self.CanUndo())
					return;
				
				current--;
				var so = states[current];
				if (so)
					so.callBack(so.value, so.parentID);
			} catch (err) {
				iLog("Undo", err, Log.Type.Error, true);
			}
		};
		this.Redo = function () {
			try {
				if (!self.CanRedo())
					return;
				
				current++;
				var so = states[current];
				if (so)
					so.callBack(so.value, so.parentID);
			} catch (err) {
				iLog("Redo", err, Log.Type.Error, true);
			}
		};
	};
	
	return undo;
});

define('RulesMaker', ['RuleHelper', 'RuleStorage', 'RuleXML', 'ContextMenu', 'ContextMenuItems', 'Editor', 'RuleIcon', 'IconConnector', 'Undo'], function (RuleHelper, RuleStorage, RuleXML, ContextMenu, ContextMenuItems, Editor, RuleIcon, IconConnector, Undo) {
	var RulesMaker = new function () {
		try {
			/* PRIVATE VARIABLES */
			var logClassName = "RuleMaker.",
				preDiv, postDiv,
				preUndo = new Undo('Pre', loadPreProcess),
				postUndo = new Undo('Post', loadPostProcess),
				_currentComponentID = null,
				selected = [],
				copiedXML = "",
				_toolbar;

			
			/* PRIVATE METHODS */

			function iLog(Place, Message, Type, Silent) {
				Log.Add(logClassName + Place, Message, Type, Silent);
			}
			function AddFeatures(div) {
				try {
					iLog("AddFeatures", "Called");
				}
				catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			function RemoveFeatures(div) {
				try {
					iLog("RemoveFeatures", "Called");
					
					div = $(div);
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			function makeContextMenu() {
				try {
					var m = new ContextMenuItems(),
						i;
					
					i = m.Add("Edit >");
						m.Add("Copy [Ctrl+C]", function () { RulesMaker.Copy(false); }, i);
						m.Add("Cut [Ctrl+X]", function () { RulesMaker.Copy(true); }, i);
						m.Add("Paste [Ctrl+V]", function () { RulesMaker.Paste(); }, i);
						m.Add("Copy (export)", function () { RulesMaker.Export(false); }, i);
						m.Add("Cut (export)", function () { RulesMaker.Export(true); }, i);
						m.Add("Paste (import)", function () { RulesMaker.Import(); }, i);

					i = m.Add("Select >");
						m.Add("All [Ctrl+A]", function () { Editor.Select('all'); }, i);
						m.Add("Below [Ctrl+B]", function () { Editor.Select('below'); }, i);
						m.Add("Right [Ctrl+R]", function () { Editor.Select('right'); }, i);
						m.Add("Above", function () { Editor.Select('above'); }, i);
						m.Add("Left", function () { Editor.Select('left'); }, i);

					i = m.Add("Component >");
						m.Add("Properties [Ctrl+P]", function () { RulesMaker.ShowProperties(); }, i);
						m.Add("Delete [Del]", function () { RulesMaker.DeleteSelection(); }, i);
						m.Add("Disconnect", function () { RulesMaker.DisconnectSelection(); }, i);
						m.Add("Snap to Grid", function () { RulesMaker.SnapToGrid(); }, i);
						m.Add("Switch Query", function () { RulesMaker.SwitchQueryComponent(); }, i);
					var undo = RulesMaker.CurrentProcess == 'preproc' ? preUndo : postUndo;
					if (undo.CanUndo())
						m.Add("Undo [Ctrl+Z]", undo.Undo, i);
					if (undo.CanRedo())
						m.Add("Redo [Ctrl+Y]", undo.Redo, i);
					
					i = m.Add("Search >");
						m.Add("Search... [Ctrl+Shift+F]", function () { Editor.Search(); }, i);
						m.Add("Clear", function () { Editor.ClearSearch(); }, i);

					i = m.Add("Watch Points >");
						m.Add("Set", function () { RulesMaker.SetWatchpoints(true); }, i);
						m.Add("Clear", function () { RulesMaker.SetWatchpoints(false); }, i);
						m.Add("Clear All", function () { RulesMaker.ClearWatchpoints(); }, i);
					
					i = m.Add("File >");
						m.Add("Help... [F1]", Editor.ShowHelp, i);
					if (Editor.Enabled && !Editor.LockedBy) {
						m.Add("Quick Save [Ctrl+S]", function () { PropertyEd.QuickSave(); }, i);
						m.Add("Save & Exit", function () { PropertyEd.Save(); }, i);
					};
						m.Add("Exit... [Ctrl+Q]", function () { PropertyEd.Close(); }, i);
					
					return m.GetHTML();
				} catch (err) {
					iLog("makeContextMenu", err, Log.Type.Error);
				}
			}
			function saveCurrentState() {
				var b = RulesMaker.CurrentProcess == 'preproc',
					undo = b ? preUndo : postUndo,
					xml = RuleXML.GetProcessXML()[0];
				undo.Add(Utilities.GetXmlString(xml));
			}
			function ensureSelection(saveState) {
				if (!selected.length) {
					var id = $(ContextMenu.EventComponent).attr("id");
					RulesMaker.AddSelected(id);
				}
				if (saveState && selected.length)
					saveCurrentState();
				
				return selected.length > 0;
			}
			function loadProcess(name, xml, div) {
				RulesMaker.SetCurrentProcess(name);
				RuleStorage.Reset();
				
				if (typeof xml == "string") {
					xml = Utilities.ParseXML(xml);
					xml = $(xml).find(name);
					RuleXML.SetProcessXML(xml);
				} else
					xml = RuleXML.GetProcessXML();

				RuleHelper.LoadComponents(xml, div);
				RulesMaker.AdjustCanvasHeight();
			}
			function loadPreProcess(xml) {
				loadProcess('preproc', xml, preDiv);
			}
			function loadPostProcess(xml) {
				loadProcess('postproc', xml, postDiv);
			}
			function createComponent(strType) {
				try {
					iLog("createComponent", "Called");
					
					var fn = RuleHelper.ComponentTypes[strType],
						ctrl = new fn();
					if (!ctrl)
						throw "A component '" + strType + "' could not be created!";
					
					ctrl.Create();
					
					return ctrl;
				} catch (err) {
					iLog("createComponent", err, Log.Type.Error);
				}
			}
			function updateToolbar() {
				try {
					iLog("updateToolbar", "Called");

					if (!_toolbar)
						return;

					var cfg = MP.Tools.Config.Editor.toolBars.process;
					_toolbar
						.css('left', cfg.position.left + 'px')
						.css('top', cfg.position.top + 'px')
						.data('lastLeft', cfg.position.left)
						.data('lastTop', cfg.position.top);
					if (cfg.width)
						_toolbar.css('width', cfg.width + 'px');
				} catch (err) {
					iLog("updateToolbar", err, Log.Type.Error);
				}
			}
			function initToolbar() {
				try {
					iLog("initToolbar", "Called");
					
					_toolbar = $('#RuleToolbar');
					_toolbar
						.draggable({
							cancel: "img",
							start: function( event, ui ) {
								Global.DisableHighlightingInChrome(true);
							},
							stop: function( event, ui ) {
								Global.DisableHighlightingInChrome(false);
								Global.UpdateLastPosition(_toolbar, ui);
							}
						})
						.resizable({
							start: function( event, ui ) {
								Global.DisableHighlightingInChrome(true);
							},
							stop: function( event, ui ) {
								Global.DisableHighlightingInChrome(false);
							}
						})
						.disableSelection()
						.hide();
					
					updateToolbar();

					var accept = [];
					_toolbar.find("img[ref]").each(function () {
						var ref = $(this).attr("ref");
						var fn = RuleHelper.ComponentTypes[ref];
						var ctrl = new fn();
						$(this)
							.attr("title", ctrl.Title + "\n\n" + ctrl.ToolTip)
							.attr('draggable', false)
							.draggable({
								helper : 'clone',
								start: function() {
									Global.DisableHighlightingInChrome(true);
								},
								stop: function() {
									Global.DisableHighlightingInChrome(false);
								}
							});
						accept.push(ref);
					});

					$("#preproc, #postproc").droppable({
						accept : Editor.GetAcceptedComponents(accept),
						greedy : true,
						activeClass : 'droppable-active',
						hoverClass : 'droppable-hover',
						drop : function (ev, ui) {
							var pos = {
								left: ui.offset.left - $(this).offset().left,
								top : ui.offset.top - $(this).offset().top
							};
							RulesMaker.AddComponent($(ui.draggable), pos);
						}
					});
					
					$(window).bind('scroll.RuleToolBar', function () {
						if (_toolbar.is(":visible"))
							_toolbar.css('top', (_toolbar.data('lastTop') + $(document).scrollTop()) + "px");
					});
				} catch (err) {
					iLog("initToolbar", err, Log.Type.Error);
				}
			}
			function addComponentsFromXmlString(xml) {
				try {
					iLog("addComponentsFromXmlString", "Called");
					
					xml = Utilities.Trim(xml);
					if (!((xml) && (xml.substring(0, 3) == "<c>") && (xml.substring(xml.length - 4) == "</c>")))
						return;

					copiedXML = xml;
					saveCurrentState();

					xml = $(Utilities.ParseXML("<str>" + xml + "</str>"));
					var comps = xml.find("str>c"),
						newID = -1,
						minX = 0,
						minY = 10000000;
					
					comps.each(function (i, comp) {
						comp = $(comp);

						// Find first available ID, save the original one
						var ctrl;
						do {
							newID++;
							ctrl = RuleStorage.GetComponent(newID);
						} while (ctrl);
						var nEl = comp.find(">n"),
							oldID = nEl.text();
						nEl.text(newID);
						comp.data('oldID', oldID);

						// Find top most component
						var elmX = comp.find(">x"),
							elmY = comp.find(">y"),
							posX = parseInt(elmX.text()),
							posY = parseInt(elmY.text());
						if (posY < minY) {
							minX = posX;
							minY = posY;
						}
					});

					// Update X, Y, Snap to grid, Find lowest Y
					comps.each(function (i, comp) {
						comp = $(comp);
						var elmX = comp.find(">x"),
							elmY = comp.find(">y"),
							posX = parseInt(elmX.text()),
							posY = parseInt(elmY.text()),
							x = posX - minX + ContextMenu.OffsetX,
							y = posY - minY + ContextMenu.OffsetY;
						x = Utilities.SnapTo(x, 32);
						y = Utilities.SnapTo(y, 26);
						elmX.text(x);
						elmY.text(y);
					});
					
					// Correct jump IDs, remove bad jumps
					comps.each(function (i, comp) {
						comp = $(comp);
						var jumps = comp.find(">j");
						jumps.each(function (i, jump) {
							jump = $(jump);
							var oldID = jump.text(),
								newID = '';
							comps.each(function (i, comp) {
								comp = $(comp);
								var id = comp.data('oldID');
								if (oldID && oldID == id) {
									newID = comp.find(">n").text();
									return false;
								}
							});
							jump.text(newID);
						});
					});

					// Append the updated XML
					RuleXML.AppendXML(comps);
					RulesMaker.Load();
					
					// Select the new elements
					RulesMaker.ClearSelected();
					comps.each(function (i, comp) {
						var id = $(comp).find(">n").text();
						RulesMaker.AddSelected(id);
					});
				} catch (err) {
					iLog("addComponentsFromXmlString", err, Log.Type.Error);
				}
			}
			
			return {
				Initialized : false,
				CurrentProcess : "",
				
				/* PUBLIC METHODS */
				Initialize : function () {
					try {
						iLog("Initialize", "Called");
						
						updateToolbar();

						if (this.Initialized)
							return;

						preDiv = $("#preproc");
						postDiv = $("#postproc");

						RuleGraphics.Initialize(preDiv.attr("id"), postDiv.attr("id"));
						RulesMaker.SetCurrentProcess(preDiv.attr("id"));
						
						initToolbar();
						
						this.Initialized = true;
					} catch (err) {
						iLog("Initialize", err, Log.Type.Error);
					}
				},
				
				Undo : function () {
					iLog("Undo", "Called");

					var b = RulesMaker.CurrentProcess == 'preproc',
						undo = b ? preUndo : postUndo;
					undo.Undo();
				},
				Redo : function () {
					iLog("Redo", "Called");

					var b = RulesMaker.CurrentProcess == 'preproc',
						undo = b ? preUndo : postUndo;
					undo.Redo();
				},
				ClearUndo : function () {
					iLog("ClearUndo", "Called");

					preUndo.Clear();
					postUndo.Clear();
				},
				// Use only for delete from property dialog!
				DeleteFromProperties : function () {
					if (!_currentComponentID)
						return;
					iLog("DeleteFromProp", "Called");
					
					saveCurrentState();

					var ctrl = RuleStorage.GetComponent(_currentComponentID);
					ctrl.Delete();

					RuleXML.DeleteComponent(_currentComponentID);
					RuleStorage.Remove(_currentComponentID);
					RuleGraphics.Refresh();
					
					_currentComponentID = null;
					ctrl = null;
				},
				AddComponent : function (Component, Position) {
					try {
						iLog("AddComponent", "Called");
						
						// Make new component
						var ref = $(Component).attr("ref"),
							ctrl = createComponent(ref);

						// Set X/Y
						ctrl.SetX(Utilities.SnapTo(Position.left, 32));
						ctrl.SetY(Utilities.SnapTo(Position.top, 26));

						RuleXML.AddComponent(ctrl.GetNode());

						// Make its icon
						var icon = new RuleIcon();
						icon.Load(ctrl);
						icon.AppendTo($("#" + RuleXML.CurrentProcess));
						ctrl.SetIcon(icon);
						
						RuleStorage.AddComponent(ctrl, ctrl.GetID());
					} catch (err) {
						iLog("AddComponent", err, Log.Type.Error);
					}
				},
				Enable : function () {
					try {
						iLog("Enable", "Called");
						
						AddFeatures(preDiv);
						AddFeatures(postDiv);
						
						if (Editor.Enabled && !Editor.LockedBy)
							_toolbar.show();
					} catch (err) {
						iLog("Enable", err, Log.Type.Error);
					}
				},
				Disable : function () {
					try {
						iLog("Disable", "Called");
						
						_toolbar.hide();
						RemoveFeatures(preDiv);
						RemoveFeatures(postDiv);
						RuleStorage.Reset();
						preDiv.html("");
						postDiv.html("");
						RuleGraphics.ClearGraphics();
					} catch (err) {
						iLog("Disable", err, Log.Type.Error);
					}
				},
				ToggleToolbar : function (toolBar, show) {
					try {
						iLog("ToggleToolbar", "Called");
						
					} catch (err) {
						iLog("ToggleToolbar", err, Log.Type.Error);
					}
				},
				GetCurrentComponent : function () {
					return RuleStorage.GetComponent(_currentComponentID);
				},
				HandleServerError : function (process, component, message) {
					try {
						// Switch to the process
						if (process && component) {
							iLog("HandleServerError", "Could not compile " + component, Log.Type.Error, true);
						
							var s = process.toLowerCase();
							s = s.replace(/process/, "proc");
							RulesMaker.SetCurrentProcess(s);

							var buttons = null;
							var id = component.split("_").pop();
							var ctrl = RuleStorage.GetComponent(id);
							if (ctrl) {
								ctrl.HighlightAsError(true);
								
								buttons = {
									'Close' : function () {
										$(this).dialog('close');
									},
									'Jump To The Component' : function () {
										$(this).dialog('close');
										if (ctrl) {
											var el = ctrl.Icon.GetImage();
											Global.ScrollToElement(el, null, function() {
												Global.ShakeElement(el);
											});
										};
									}
								};
							};
						} else {
							iLog("HandleServerError", message, Log.Type.Error, true);
						};
						
						Global.ShowErrorMessage(message, 'VRM Save Error', buttons);
					} catch (err) {
						iLog("HandleServerError", err, Log.Type.Error);
					}
				},
				SelectThisOnlyIfNotSelected : function (id) {
					if (!this.IsSelected(id)) {
						this.ClearSelected();
						this.AddSelected(id);
					};
				},
				IsSelected : function (id) {
					return (id && $.inArray(id, selected) > -1);
				},
				AddSelected : function (id) {
					if (!id)
						return;
					if (Utilities.IsNumber(id))
						id = id.toString();
					if (this.IsSelected(id))
						return;
					var ctrl = RuleStorage.GetComponent(id);
					if (!ctrl)
						return;

					ctrl.HighlightAsFound(false);
					ctrl.HighlightAsError(false);
					ctrl.HighlightAsWatchpoint(false);
					ctrl.HighlightAsSelected(true);
					selected.push(id);
				},
				Select : function (part) {
					try {
						iLog("SelectPart", "Called");
						
						RulesMaker.ClearSelected();
						var arr = RuleStorage.GetItemArray();
						for (var i = 0; i < arr.length; i++) {
							var ctrl = arr[i],
								add = false;
								
							switch (part) {
								case 'all':
									add = true;
									break;
								case 'below':
									add = ctrl.GetY() > ContextMenu.OffsetY;
									break;
								case 'right':
									add = ctrl.GetX() > ContextMenu.OffsetX;
									break;
								case 'above':
									add = ctrl.GetY() < ContextMenu.OffsetY;
									break;
								case 'left':
									add = ctrl.GetX() < ContextMenu.OffsetX;
									break;
							};
							if (add)
								RulesMaker.AddSelected(ctrl.GetID())
						};
					} catch (err) {
						iLog("SelectPart", err, Log.Type.Error);
					}
				},
				ClearSelected : function () {
					try {
						iLog("ClearSelected", "Called");
						
						var arr = RuleStorage.GetItemArray();
						for (var i = 0; i < arr.length; i++) {
							var ctrl = arr[i];
							ctrl.HighlightAsSelected(false);
						};
						selected = null;
						selected = [];
					} catch (err) {
						iLog("ClearSelected", err, Log.Type.Error);
					}
				},
				GetSelectedComponentsXmlString : function () {
					try {
						if (!ensureSelection(false))
							return;

						iLog("GetSelectedComponentsXmlString", "Called");
						
						var s = "";
						for (var i = 0; i < selected.length; i++) {
							var id = selected[i];
							s += RuleXML.GetComponent(id);
						}
						return s;
					} catch (err) {
						iLog("GetSelectedComponentsXmlString", err, Log.Type.Error);
					}
				},
				Copy : function (doCut) {
					try {
						iLog("Copy", "Called");
						
						copiedXML = RulesMaker.GetSelectedComponentsXmlString();
						if (copiedXML && doCut)
							RulesMaker.DeleteSelection();
					} catch (err) {
						iLog("Copy", err, Log.Type.Error);
					}
				},
				Paste : function () {
					try {
						iLog("Paste", "Called");
						
						addComponentsFromXmlString(copiedXML);
					} catch (err) {
						iLog("Paste", err, Log.Type.Error);
					}
				},
				Export : function (doCut) {
					try {
						iLog("Export", "Called");
						
						copiedXML = RulesMaker.GetSelectedComponentsXmlString();
						if (copiedXML && doCut)
							RulesMaker.DeleteSelection();

						if (!Global.SetClipboard(copiedXML))
							Editor.ShowAceEditorForm(copiedXML, 'Export', '', null, null, {language: "xml"});
					} catch (err) {
						iLog("Export", err, Log.Type.Error);
					}
				},
				Import : function () {
					try {
						iLog("Import", "Called");
						
						var s = Global.GetClipboard();
						if (s)
							addComponentsFromXmlString(s)
						else
							Editor.ShowAceEditorForm(s, 'Import', '', addComponentsFromXmlString, null, {language: "xml"});
					} catch (err) {
						iLog("Import", err, Log.Type.Error);
					}
				},
				SwitchQueryComponent : function () {
					RulesMaker.Copy();

					if (!copiedXML || copiedXML.search('<t>SELECTQUERY</t>') == -1 && copiedXML.search('<t>INSERTUPDATEQUERY</t>') == -1)
						return;

					copiedXML = Utilities.ReplaceAll(copiedXML, '<t>SELECTQUERY</t>', '<t>SQ</t>');
					copiedXML = Utilities.ReplaceAll(copiedXML, '<t>INSERTUPDATEQUERY</t>', '<t>IUQ</t>');
					copiedXML = Utilities.ReplaceAll(copiedXML, '<t>SQ</t>', '<t>INSERTUPDATEQUERY</t>');
					copiedXML = Utilities.ReplaceAll(copiedXML, '<t>IUQ</t>', '<t>SELECTQUERY</t>');
					
					RulesMaker.DeleteSelection();

					try {
						var xml = $(Utilities.ParseXML("<str>" + copiedXML + "</str>"));
						var comps = xml.find("str>c");
						
						// Append the updated XML
						RuleXML.AppendXML(comps);
						RulesMaker.Load();
						
						// Select the new elements
						RulesMaker.ClearSelected();
						comps.each(function (i, comp) {
							var id = $(comp).find(">n").text();
							RulesMaker.AddSelected(id);
						});
					} catch (err) {
						iLog("SwitchQueryComponent", err, Log.Type.Error);
					}
				},
				DeleteSelection : function () {
					try {
						if (!ensureSelection(true))
							return;

						iLog("DeleteSelection", "Called");
						
						for (var i = 0; i < selected.length; i++) {
							var id = selected[i];
							var ctrl = RuleStorage.GetComponent(id);
							if (ctrl) {
								ctrl.Delete();
								ctrl = null;
								RuleXML.DeleteComponent(id);
								RuleStorage.Remove(id);
							}
						}

						RulesMaker.ClearSelected();
						RuleGraphics.Refresh();
					} catch (err) {
						iLog("DeleteSelection", err, Log.Type.Error);
					}
				},
				DisconnectSelection : function () {
					try {
						if (!ensureSelection(true))
							return;

						iLog("DisconnectSelection", "Called");
						
						for (var i = 0; i < selected.length; i++) {
							var id = selected[i];
							var ctrl = RuleStorage.GetComponent(id);
							if (ctrl) {
								if (ctrl.SetJ1)
									ctrl.SetJ1('');
								if (ctrl.SetJ2)
									ctrl.SetJ2('');
							}
						}
						RuleGraphics.Refresh();
					} catch (err) {
						iLog("DisconnectSelection", err, Log.Type.Error);
					}
				},
				SnapToGrid : function () {
					try {
						if (!ensureSelection(true))
							return;

						iLog("SnapToGrid", "Called");
						
						for (var i = 0; i < selected.length; i++) {
							var id = selected[i];
							var ctrl = RuleStorage.GetComponent(id);
							if (!ctrl)
								continue;

							var pos1, pos2, offX, offY;

							pos1 = ctrl.GetX();
							pos2 = Utilities.SnapTo(pos1, 32);
							ctrl.SetX(pos2);
							offX = pos2 - pos1;

							pos1 = ctrl.GetY();
							pos2 = Utilities.SnapTo(pos1, 26);
							ctrl.SetY(pos2);
							offY = pos2 - pos1;
							
							ctrl.Icon.MoveBy(offX, offY);
						}
						RuleGraphics.Refresh();
					} catch (err) {
						iLog("SnapToGrid", err, Log.Type.Error);
					}
				},
				SetWatchpoints : function (value) {
					try {
						iLog("SetWatchpoints", "Called");
						
						if (!selected.length)
							selected.push($(ContextMenu.EventComponent).attr("id"));
						for (var i = 0; i < selected.length; i++) {
							var id = selected[i];
							var ctrl = RuleStorage.GetComponent(id);
							if (ctrl)
								ctrl.SetWatchpoint(value);
						};
					} catch (err) {
						iLog("SetWatchpoints", err, Log.Type.Error);
					}
				},
				ClearWatchpoints : function () {
					try {
						iLog("ClearWatchpoints", "Called");
						
						var arr = RuleStorage.GetItemArray();
						for (var i = 0; i < arr.length; i++) {
							var ctrl = arr[i];
							ctrl.SetWatchpoint(false);
							ctrl.UpdateWatchpoint();
						};
					} catch (err) {
						iLog("ClearWatchpoints", err, Log.Type.Error);
					}
				},
				GetSelected : function () {
					return selected;
				},
				// called from Communication.EditorRequest passing in the vrm xml document
				Load : function (xml) {
					try {
						iLog("Load", "Called");
						
						if (typeof xml == "string")
							xml = Utilities.ParseXML(xml);
						RuleXML.Load(xml);

						var cp = RulesMaker.CurrentProcess;
						
						loadPreProcess();
						loadPostProcess();
						
						ContextMenu.Add("#preproc", makeContextMenu, "preproc");
						ContextMenu.Add("#postproc", makeContextMenu, "postproc");

						RulesMaker.SetCurrentProcess(cp);
						RulesMaker.Enable();
					} catch (err) {
						iLog("Load", err, Log.Type.Error);
					}
				},
				SetCanvasHeight : function (newHeight) {
					try {
						iLog("SetCanvasHeight", "Called");
						
						//LK: UI does not supply newHeight so increase it by user config!
						var proc = RulesMaker.CurrentProcess == "preproc" ? preDiv : postDiv;
						var height = newHeight || Utilities.ToNumber(proc.css("height")) + MP.Tools.Config.Editor.tabs.process.extendBy;
						proc.css("height", height);
						$("#" + RulesMaker.CurrentProcess + "canvas").css("height", height);

						RuleGraphics.Refresh();
					} catch (err) {
						iLog("SetCanvasHeight", err, Log.Type.Error);
					}
				},
				AdjustCanvasHeight : function () {
					try {
						iLog("AdjustCanvasHeight", "Called");
						
						var maxY = 0;
						var arr = RuleStorage.GetItemArray();
						for (var i = 0; i < arr.length; i++) {
							var ctrl = arr[i];
							var y = ctrl.GetY();
							maxY = y > maxY ? y : maxY;
						};

						maxY = Utilities.SnapTo(maxY, 100) + 500;
						RulesMaker.SetCanvasHeight(maxY);
					} catch (err) {
						iLog("AdjustCanvasHeight", err, Log.Type.Error);
					}
				},
				SetCurrentProcess : function (ProcessDivID, updateActiveEditor) {
					try {
						IconConnector.Reset();
						RulesMaker.CurrentProcess = ProcessDivID;
						RuleXML.CurrentProcess = ProcessDivID;
						RuleGraphics.SetCurrentProcess(ProcessDivID);
						RuleStorage.SetCurrentProcess(ProcessDivID);
						
						if (updateActiveEditor && Editor.Enabled)
							ContextMenu.UpdateActiveEditor(ProcessDivID);

						return ProcessDivID;
					} catch (err) {
						iLog("SetCurrentProcess", err, Log.Type.Error);
					}
				},
				ShowProperties : function (ID) {
					try {
						iLog("ShowProperties", "Called");
						
						if (!Utilities.IsString(ID))
							ID = $(ID || ContextMenu.EventComponent).attr("id");

						var ctrl = RuleStorage.GetComponent(ID);
						if (!ctrl)
							return;
						
						var pr = ctrl.GetProperties(),
							title = ctrl.Title + " - ID: " + ID;
						PropertyEd.Show(pr, this.DeleteFromProperties, title);
						_currentComponentID = ID;
					} catch (err) {
						iLog("ShowProperties", err, Log.Type.Error);
					}
				},
				ComplexArgs : function (GetProperties, AddParam, DeleteParam) {
					this.GetProperties = GetProperties;
					this.AddParam = AddParam;
					this.DeleteParam = DeleteParam;
				}
			};
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	return RulesMaker;
});

/*    Copyright 2008-2010 Maximum Processing Inc
 */
define('RuleGraphics', ['IconMover', 'RuleStorage', 'RulesMaker', 'RuleXML'], function (IconMover, RuleStorage, RulesMaker, RuleXML) {
	var Graphics = new function () {
		
		var logClassName = "Graphics.";
		var _pre = null;
		var _post = null;
		var _canvas = null;
		var Color1 = "#61AEF1";
		var Color2 = "#9B9B9B";
		var isClear = false;
		
		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place, Message, Type, Silent);
		}
		function DrawLines(Lines, Color) {
			try {
				isClear = false;
				if (Color != null)
					_canvas.setColor(Color);
				_canvas.setStroke(2);
				var arm = 10;
				var d = arm;
				var tr = 4;
				for (var i = 0; i < Lines.length; i++) {
					var Line = Lines[i];
					if (Line.Color != null)
						_canvas.setColor(Line.Color);
					// A - B
					_canvas.drawLine(Line.Start.X, Line.Start.Y, Line.Start.X, Line.Start.Y + arm);
					var factor = (Line.Stop.X - Line.Start.X) / 2;
					if ((factor == 0) && (Line.Stop.Y <= Line.Start.Y))
						factor = -20;
					// B - C
					_canvas.drawLine(Line.Start.X, Line.Start.Y + arm, Line.Start.X + factor, Line.Start.Y + arm);
					// C - D
					_canvas.drawLine(Line.Start.X + factor, Line.Start.Y + arm, Line.Start.X + factor, Line.Stop.Y - arm);
					// D - E
					_canvas.drawLine(Line.Start.X + factor, Line.Stop.Y - arm, Line.Stop.X, Line.Stop.Y - arm);
					// E - F
					_canvas.drawLine(Line.Stop.X, Line.Stop.Y - arm, Line.Stop.X, Line.Stop.Y);
					// arrows
					var x = [Line.Stop.X, Line.Stop.X - tr, Line.Stop.X + tr, Line.Stop.X];
					var y = [Line.Stop.Y, Line.Stop.Y - tr, Line.Stop.Y - tr, Line.Stop.Y];
					_canvas.fillPolygon(x, y);
				}
			} catch (err) {
				iLog("DrawLines", err, Log.Type.Error);
			}
		}
		function DiagonalDrawLines(Lines, Color) {
			try {
				if (Color != null)
					_canvas.setColor(Color);
				_canvas.setStroke(2);
				var arm = 10;
				var d = arm;
				var tr = 4;
				for (var i = 0; i < Lines.length; i++) {
					var Line = Lines[i];
					if (Line.Color != null)
						_canvas.setColor(Line.Color);
					_canvas.drawLine(Line.Start.X, Line.Start.Y, Line.Start.X, Line.Start.Y + arm);
					// arm down from bottom
					_canvas.drawLine(Line.Start.X, Line.Start.Y + arm, Line.Stop.X, Line.Stop.Y - arm);
					// the main length
					_canvas.drawLine(Line.Stop.X, Line.Stop.Y - arm, Line.Stop.X, Line.Stop.Y - tr);
					// arm up from top
					var x = [Line.Stop.X, Line.Stop.X - tr, Line.Stop.X + tr, Line.Stop.X];
					// arrow
					var y = [Line.Stop.Y, Line.Stop.Y - tr, Line.Stop.Y - tr, Line.Stop.Y];
					// arrow
					_canvas.fillPolygon(x, y);
				}
			} catch (err) {
				iLog("DiagonalDrawLines", err, Log.Type.Error);
			}
		}
		function PrepareCanvas(ContainerID) {
			try {
				var _canvas = new jsGraphics(ContainerID + "canvas");
				_canvas.clear();
				return _canvas;
			} catch (err) {
				iLog("PrepareCanvas", err, Log.Type.Error);
			}
		}
		
		function AlignCanvas(ContainerID) {
			try {
				if (ContainerID == null || ContainerID == "")
					return;
				var _componentDiv = $("#" + ContainerID);
				var _canvasDiv = $("#" + ContainerID + "canvas");
				if (_canvasDiv.height() == null)
					return;
				_componentDiv.css("margin-top", (Utilities.ToNumber(_canvasDiv.height()) * -1));
			} catch (err) {
				iLog("AlignCanvas", err, Log.Type.Error);
			}
		}
		
		function GetLines(Component, Lines) {
			try {
				if (!Component.GetJ1)
					return;
				var j = [];
				j[0] = Component.GetJ1();
				if (Component.GetJ2 != null)
					j[1] = Component.GetJ2();
				for (i = 0; i < 2; i++) {
					if (j[i] != "") {
						var called = RuleStorage.GetComponent(parseInt(j[i], 10));
						if (called != null) {
							var start = Component.GetIcon().GetExitPoint();
							var stop = called.GetIcon().GetEntryPoint();
							var color = (i == 0 ? Color1 : Color2);
							Lines[Lines.length] = new Line(start, stop, color);
						}
					}
				}
			} catch (err) {
				iLog("GetLines", err, Log.Type.Error);
			}
		}
		
		function Line(Start, Stop, Color) {
			this.Start = Start;
			this.Stop = Stop;
			this.Color = Color;
		}
		
		return {
		
			ClearGraphics : function () {
				try {
					_pre.clear();
					_post.clear();
					isClear = true;
				} catch (err) {
					iLog("ClearGraphics", err, Log.Type.Error);
				}
			},
			Initialize : function (PreProcessCanvasDivID, PostProcessCanvasDivID) {
				try {
				    iLog("Initialize", "Called");
					
					_pre = PrepareCanvas(PreProcessCanvasDivID);
					_post = PrepareCanvas(PostProcessCanvasDivID);
				} catch (err) {
					iLog("Initialize", err, Log.Type.Error);
				}
			},
			Point : function (X, Y) {
				this.X = X;
				this.Y = Y;
			},
			ReDraw : function () {
				try {
					if (RulesMaker.GetSelected().length > 0) {
						if (!isClear)
							Graphics.ClearGraphics();
						return;
					}
					// draw white between old entry and exit
					var ctrl = IconMover.Ctrl;
					var Lines = [];
					var i = 0;
					var c;
					if (IconMover.From != null) {
						c = (IconMover.FromJ1 ? Color1 : Color2);
						Lines[i] = new Line(IconMover.From, ctrl.OldEntry);
						i++;
					}
					if (IconMover.J1 != null) {
						Lines[i] = new Line(ctrl.OldExit, IconMover.J1);
						i++;
					}
					if (IconMover.J2 != null) {
						Lines[i] = new Line(ctrl.OldExit, IconMover.J2);
						i++;
					}
					DrawLines(Lines, "white");
					// reset old points draw the new lines
					ctrl.OldEntry = ctrl.GetIcon().GetEntryPoint();
					ctrl.OldExit = ctrl.GetIcon().GetExitPoint();
					Lines.length = 0;
					i = 0;
					if (IconMover.From != null) {
						c = (IconMover.FromJ1 ? Color1 : Color2);
						Lines[i] = new Line(IconMover.From, ctrl.OldEntry, c);
						i++;
					}
					if (IconMover.J1 != null) {
						Lines[i] = new Line(ctrl.OldExit, IconMover.J1, Color1);
						i++;
					}
					if (IconMover.J2 != null) {
						Lines[i] = new Line(ctrl.OldExit, IconMover.J2, Color2);
						i++;
					}
					DrawLines(Lines);
					_canvas.paint();
				} catch (err) {
					iLog("ReDraw", err, Log.Type.Error);
				}
			},
			Refresh : function () {
				try {
					if (_canvas == null) {
						iLog("Refresh", "Attempting to refresh a null canvas", Log.Type.Warning);
						return;
					}
					if (RuleXML.CurrentProcess == null || RuleXML.CurrentProcess == "")
						return;
					AlignCanvas(RuleXML.CurrentProcess);
					_canvas.clear();
					var Lines = [];
					$("#" + RuleXML.CurrentProcess).find(".icon").each(function () {
						var id = $(this).attr("id");
						var ctrl = RuleStorage.GetComponent(id);
						GetLines(ctrl, Lines);
					});
					DrawLines(Lines);
					_canvas.paint();
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			},
			// Called from RulesMaker.SetCurrentProcess method which is called when the pre or post tab is clicked
			SetCurrentProcess : function (CurrentProcessDivID) {
				try {
					if (CurrentProcessDivID == "preproc")
						_canvas = _pre;
					else
						_canvas = _post;
					setTimeout("RuleGraphics.Refresh()", 100);
					// gives the div time to display and refreshes once ready
				} catch (err) {
					iLog("SetCurrentProcess", err, Log.Type.Error);
				}
			}
		};
	};
	
	return Graphics;
});

define('AddressStandardization', ['Communication'], function (Communication) {
	// Hack
	$('head').append(''
		 + '<style>'
		 + '.address-suggestion-dialog {'
		 + '    text-align: left;'
		 + '}'
		 + '.address-suggestion-dialog .suggestions {'
		 + '    margin: 1em 0;'
		 + '}'
		 + '.address-suggestion-dialog .suggestions .suggestion {'
		 + '    border: 1px solid #4444FF;'
		 + '    margin: .5em;'
		 + '    padding: .75em;'
		 + '    float: left;'
		 + '    cursor: pointer;'
		 + '}'
		 + '.address-suggestion-dialog .suggestions .suggestion:hover {'
		 + '    background-color: #E2E2FF;'
		 + '}'
		 + '.address-suggestion-dialog .manual-entry {'
		 + '    margin: 1em .5em 0 .5em;'
		 + '}'
		 + '</style>');
	
	var getControlThingy = function (nameOrElement) {
		if (nameOrElement instanceof $) {
			return nameOrElement;
		} else {
			return $('*[name=' + nameOrElement + ']');
		}
	};
	
	var getAddressElements = function (elements) {
		var newElements = {};
		
		$.each(elements, function (name, nameOrElement) {
			newElements[name] = getControlThingy(nameOrElement);
		});
		
		return newElements;
	};
	
	var getAddressValues = function (elements) {
		elements = getAddressElements(elements);
		
		var addressValues = {};
		
		$.each(elements, function (name, $element) {
			if ($.trim($element.val()).length > 0) {
				addressValues[name] = $element.val();
			}
		});
		
		return addressValues;
	};
	
	var setAddressValues = function (elements, addressValues) {
		elements = getAddressElements(elements);
		
		$.each(elements, function (name, $element) {
			if (addressValues[name]) {
				$element.val(addressValues[name]);
			}
		});
	};
	
	var checkFullAddress = function (elements, callback) {
		elements = getAddressElements(elements);
		
		var addressValues = getAddressValues(elements);
		
		checkAddress(addressValues, function (error, newAddressValues) {
			var focusAddress = function () {
				// Should this logic be here?
				if (elements.Address1) {
					elements.Address1.focus();
				}
			};
			
			if (error) {
				// Bad address
				focusAddress();
				
				return callback(error);
			}
			
			if (newAddressValues) {
				// Suggestion selected
				setAddressValues(elements, newAddressValues);
				
				return callback(null, true);
			} else {
				// Manual entry
				focusAddress();
				
				return callback(null, false);
			}
		});
	};
	
	var checkAddress = function (addressValues, callback) {
		Communication.CustomRequest('ZP4Sugestion.max?' + $.param({
				'AJAX_ACTION' : 'GetZP4',
				'Address_IN' : addressValues.Address1,
				'City_IN' : addressValues.City,
				'State_IN' : addressValues.State,
				'Zip_IN' : addressValues.Zip
			}), function (AjaxResp) {
			var response = $.parseJSON(AjaxResp);
			
			if (response.Valid == '1') {
				return callback(null, {
					'Address1' : response.Address_OUT,
					'City' : response.City_OUT,
					'State' : response.State_OUT,
					'Zip' : response.Zip_OUT
				});
			}
			
			if (response.SugCnt == '0') {
				return callback('Invalid address');
			}
			
			// Oh my GOD the source data is horrible.  This snippet makes it sane.
			var suggestions = [];
			var i;
			
			for (i = 0; i < response.SugCnt; ++i) {
				suggestions.push({
					'Address1' : response['A_' + i], // Look at this!  LOOK AT IT!!!
					'City' : response['C_' + i],
					'State' : response['S_' + i],
					'Zip' : response['Z_' + i]
				});
			}
			// End retardation correction code
			
			// If the current address matches any suggestion,
			// use that suggestion
			var areAddressesEqual = function (addressValuesA, addressValuesB) {
				// Too lazy to make this prettier
				var properties = ['Address1', 'City', 'State', 'Zip'];
				var i;
				
				for (i = 0; i < properties.length; ++i) {
					if (addressValuesA[properties[i]] !== addressValuesB[properties[i]]) {
						return false;
					}
				}
				
				return true;
			};
			
			var i;
			
			for (i = 0; i < suggestions.length; ++i) {
				if (areAddressesEqual(suggestions[i], addressValues)) {
					return callback(null, suggestions[i]);
				}
			}
			
			var html = '';
			html += '<p>Please select one of the following addresses or change your entered address manually:</p>';
			html += '<div class="suggestions"></div>';
			html += '<p><button class="manual-entry">Change Address Manually</button></p>';
			
			var $dialog = $('<div/>').addClass('address-suggestion-dialog').html(html);
			var $suggestions = $dialog.find('.suggestions');
			var $manualEntryButton = $dialog.find('.manual-entry');
			
			var escapeHtml = function (text) {
				return $('<span/>').text(text).html();
			};
			
			$.each(suggestions, function (index, suggestionData) {
				var $suggestion = $('<address/>')
					.addClass('suggestion')
					.data('suggestion-data', suggestionData)
					.html('');
				
				// This is kinda klunky...  Please rewrite if you know a more elegant way.
				$suggestion
				.append(escapeHtml(suggestionData.Address1))
				.append('<br/>')
				.append(escapeHtml(suggestionData.City))
				.append(', ')
				.append(escapeHtml(suggestionData.State))
				.append(' ')
				.append(escapeHtml(suggestionData.Zip));
				
				$suggestions.append($suggestion);
			});
			
			$('.suggestion', $suggestions).click(function () {
				$dialog.dialog('destroy');
				
				var suggestionData = $(this).data('suggestion-data');
				
				callback(null, suggestionData);
			});
			
			$manualEntryButton.click(function () {
				$dialog.dialog('destroy');
				
				callback(null, null);
			});
			
			$dialog.dialog({
				title : 'Address Suggestions',
				autoOpen : true,
				width : 420
			});
		}, null);
	};
	
	var checkFullAddresses = function (addressValuesArray, callback) {
		if (addressValuesArray.length === 0) {
			return callback(null, true);
		}
		
		var addressValues = addressValuesArray[0];
		
		checkFullAddress(addressValues, function (error, isAddressCorrect) {
			if (error) {
				return callback(error);
			}
			
			if (!isAddressCorrect) {
				return callback(null, false);
			}
			
			checkFullAddresses(addressValuesArray.slice(1), callback);
		});
	};
	
	return {
		checkFullAddress : checkFullAddress,
		checkFullAddresses : checkFullAddresses,
		
		checkAddress : checkAddress,
		
		getAddressValues : getAddressValues,
		setAddressValues : setAddressValues,
		
		getAddressElements : getAddressElements
	};
});


define('main', [], function () {
	
	function addJqPlugins($) {
		$.fn.outerHTML = function () {
			try {
				if (this[0].outerHTML)
					return this[0].outerHTML;
				// TODO: if not IE then this code must return the equivalent of outerHTML - needs testing
				return $('<div>').append(this.eq(0).clone(true)).html();
			} catch (err) {
				Log.Add("$.outerHTML", err, Log.Type.Error);
			}
		};

		// This returns correct input values which $.outerHTML() does not! Performance penalty!
		var oldOuterHTML = $.fn.outerHTML;
		$.fn.formOuterHTML = function () {
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
		$.expr[":"].focus = function( elem ) {
			return elem === document.activeElement && ( elem.type || elem.href );
		};
	}
	function waitForCoreJq() {
		var jq = $;
		if (jq().jquery != '1.4.3')
			setTimeout(waitForCoreJq, 500);
		else
			addJqPlugins(jq);
	}

	// General place to expose classes to the global window object!
	require([
		'MP',
		'Log',
		'Browser',
		'PropertyEd',
		'Communication',
		'Utilities',
		'Helper',
		'Global',
		'RulesMaker',
		'RuleGraphics',
		'AddressStandardization',
		'page/comp/ValidatorContainer',
		'ReqList',
		'WatchList',
		'AjaxTab',
		'../ckeditor/ckeditor'
	], function () {
		
		// Name of object to add to the window, Flag to change its mutability
		var globals = [
			{'n':'MP', 'f':false},
			{'n':'Log', 'f':true},
			{'n':'Browser', 'f':true},
			{'n':'PropertyEd', 'f':false},
			{'n':'Communication', 'f':true},
			{'n':'Utilities', 'f':true},
			{'n':'Helper', 'f':true},
			{'n':'Global', 'f':true},
			{'n':'RulesMaker', 'f':true},
			{'n':'RuleGraphics', 'f':false},
			{'n':'AddressStandardization', 'f':false},
			{'n':'Validator', 'f':true},
			{'n':'ReqList', 'f':true},
			{'n':'WatchList', 'f':true},
			{'n':'AjaxTab', 'f':true},
			{'n':'ckeditor', 'f':false}
		];
		
		$.each(arguments, function (index, value) {
			var global = globals[index];
			if (global) {
				window[global.n] = value;
				try {
					if (global.f)
						Object.preventExtensions(value);
				} catch (err) {}
			}
		});

		$(document).ready(function () {
			try {
				// Fix for a rare situation that passed $ is not our core jQuery!
				waitForCoreJq();
				
				// show session expired message
				var hrf = location.href;
				if (hrf.indexOf("sessionexpired=true") > -1)
					Global.ShowErrorMessage($("<h3>Your session has expired</h3><p>Due to inactivity on the system your session has expired. Please login to start a new session.</p>"));
				
				// Spellcheck
				if (window.$Spelling)
					window.$Spelling.ServerModel = "php";
				
				// GlobalScript: a storage for system variables and functions on global scope. We create it only if GlobalScript in Custom.js does not exist
				if (!window.GlobalScript) {
					window.GlobalScript = {
						Origin: "Internal",
						OnLoad: function() {}
					};
				};
				
				// A callback event to execute right after the core is fully loaded into the DOM
				var eFn = MP.Events.onMpCoreLoaded || $.noop;
				eFn();
			} catch (err) {
				Log.Add("main.ready", err, Log.Type.Error);
			}
		});
	});
});

// Mini public version of internaly used PageHelper
define('Helper', ['PageHelper'], function (PageHelper) {
	var Helper = new function () {
		this.GetEditorComponent = function (Component) {
			return PageHelper.GetEditorComponent(Component);
		}
	}
	
	return Helper;
});

/*
Original absolute positioned editor

1. Get the Control Object for an existing HTML Component and calls one of its methods
var div = $("component div selector");
var text = PageHelper.GetEditorComponent(div)
text.SetCaption("This is new");

2. Create a new Component
var ctrl = PageHelper.CreateEditorComponent("EditorText");
ctrl.AppendTo( $("#container") );
 */

define('PageHelper', ['Storage', 'ContextMenu', 'ContextMenuItems', 'Undo'], function (Storage, ContextMenu, ContextMenuItems, Undo) {

	// Building componentTypes isn't safe, but if we don't do it this way we will encounter circular dependency issues because many components depend upon PageHelper
	var compTypeIncludes = {
		'EditorCheckBox' : 'page/comp/EditorCheckBox',
		'EditorDropDown' : 'page/comp/EditorDropDown',
		'EditorLabel' : 'page/comp/EditorLabel',
		'EditorLink' : 'page/comp/EditorLink',
		'EditorDiv' : 'page/comp/EditorDiv',
		'EditorMemo' : 'page/comp/EditorMemo',
		'EditorRadio' : 'page/comp/EditorRadio',
		'EditorSubmitButton' : 'page/comp/EditorSubmitButton',
		'EditorText' : 'page/comp/EditorText',
		'TransferList' : 'page/comp/TransferList',
		
		'EditableContent' : 'page/comp/EditableContent',
		'DynamicContainer' : 'page/comp/DynamicContainer',
		'StaticContainer' : 'page/comp/StaticContainer',
		'ScriptingContainer' : 'page/comp/ScriptingContainer',
		'ValidationContainer' : 'page/comp/ValidationContainer'
	};
	
	var includes = [],
		types = [],
		key;	
	for (key in compTypeIncludes) {
		if (compTypeIncludes.hasOwnProperty(key)) {
			includes.push(compTypeIncludes[key]);
			types.push(key);
		}
	}

	var controlTypes = {};
	require(includes, function () {
		for (var i = 0; i < types.length; ++i)
			controlTypes[types[i]] = arguments[i];
	});

	var Editor, HtmlEditor;
	require(['Editor', 'HtmlEditor'], function (ed, html) {
		Editor = ed;
		HtmlEditor = html;
	});
	
	// The main object for HTML Controls
	var PageHelper = new function (undefined) {
		try {
			/* PRIVATE PROPERTIES */
			var logClassName = "PgHelper.",
				selected = [],
				undo = new Undo('Page', reload),
				eStore = new Storage('Page'),
				copiedHTML = "",
				lastQuestionnaire = "",
				_toolbar,
				_mainDiv,
				_currentComponent = null;

			/* PRIVATE METHODS */

			function iLog(Place, Message, Type, Silent) {
				Log.Add(logClassName + Place, Message, Type, Silent);
			}
			function reload(html, parentID) {
				PageHelper.Reload(html, parentID);
			}
			function createComponent(strRef, compName, noNameCheck) {
				try {
					iLog("createComponent", "Called");
					
					var name = '';
					var fn = controlTypes[strRef];
					var ctrl = new fn();
					if (!ctrl)
						throw "A component '" + strRef + "' could not be created!";
						
					if (ctrl.NameRequired) {
						if (strRef == "TransferList") {
							name = compName || Utilities.PromptForName(false);
							if (name == Utilities.ModalResult.Cancel || name == Utilities.ModalResult.Empty)
								return false;
						} else {
							name = strRef.replace('Editor', '');
							name = compName || name;
							if (!noNameCheck)
								name = PageHelper.MakeUniquePageID(name);
						}
					}
					ctrl.Create(name);
					ctrl.GetControl()[0][strRef] = ctrl;

					return ctrl;
				} catch (err) {
					iLog("createComponent", err, Log.Type.Error);
				}
			}
			function AddStoredComponent(Component, forceNewId) {
				try {
					if (Component) {
						iLog("AddStoredComponent", "Called");
						
						var ctrl = Component.GetControl(),
							id = SetComponentID(ctrl, forceNewId);
						eStore.AddComponent(Component, id);
					}
				} catch (err) {
					iLog("AddStoredComponent", err, Log.Type.Error);
				}
			}
			function AddEditorToComponent(Component, forceNewId) {
				try {
					var ctrl = PageHelper.GetEditorComponent(Component);
					ctrl.EditMode();
					AddStoredComponent(ctrl, forceNewId);
					
					return ctrl;
				} catch (err) {
					iLog("AddEditorToComponent", err, Log.Type.Error, true);
				}
			}
			// Removes editor and cleans up component
			function RemoveEditorFromComponent(Component) {
				try {
					var ctrl = PageHelper.GetEditorComponent(Component);
					if (!ctrl)
						return;
						
					var id = PageHelper.GetComponentID(Component)
					eStore.Remove(id);
					ctrl.HighlightAsSelected(false);
					ctrl.HighlightAsFound(false);
					ctrl.HighlightAsError(false);
					ctrl.DefaultMode();
					
					var elm = $(Component);
					
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
					elm.removeClass("ui-activeBox");
					
					elm.find('.ui-selectee').removeClass("ui-selectee");
				} catch (err) {
					iLog("RemoveEditorFromComponent", err, Log.Type.Error, true);
				}
			}
			// Deletes an element from the screen and storage
			function DeleteEditorComponent(Component) {
				var id = PageHelper.GetComponentID(Component);
				if (!id)
					return;

				iLog("DeleteEditorComponent", "Called");
				
				eStore.Remove(id);
				$(Component).remove();
			}
			function SetComponentID(Component, forceNewId) {
				try {
					var comp = $(Component),
						id = comp.attr("mp-id");
					
					if (id && !forceNewId) {
						id = Utilities.ToNumber(id);
					} else {
						id = HtmlEditor.FindFirstAvailableID();
						comp.attr("mp-id", id);
					}
					
					iLog("SetComponentID", "ID=" + id);

					return id;
				} catch (err) {
					iLog("SetComponentID", err, Log.Type.Error);
				}
			}
			function EnsureSelection() {
				try {
					if (!selected.length) {
						var ec = ContextMenu.EventComponent,
							id = PageHelper.GetComponentID(ec);
						if (!id)
							id = PageHelper.GetParentID(ec);
						PageHelper.AddSelected(id);
					};
				} catch (err) {
					iLog("EnsureSelection", err, Log.Type.Error);
				}
			}
			function MakePastedComponentEditable(element, keepSameIDs) {
				var ctrl = AddEditorToComponent(element, true);
				
				if (!keepSameIDs) {
					var s;
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
				if ($.inArray(ref, ['EditorText','EditorMemo','EditorDropDown','EditorSubmitButton']) > -1) {
					var rightGap = (ref == 'EditorSubmitButton') ? 8 : 2;
					var inp = el.find(':input');
					d.css({
						top: inp.position().top + inp.outerHeight() / 2 - d.outerHeight() / 2 + 1,
						left: inp.position().left + inp.outerWidth() + rightGap
					});
				};
				return d;
			}
			function addComponentsFromHtmlString(htmlStr, parent, doNotAlter, doNotReposition) {
				try {
					if (!htmlStr)
						return;

					if (!parent || !parent.length)
						parent = ContextMenu.ActiveBox;

					PageHelper.ClearSelected();
					copiedHTML = htmlStr;
					htmlStr = PageHelper.CleanHtmlForEditor(htmlStr);

					var items = $(htmlStr),
						minX = minY = 9999999,
						arr = [];
					items.each(function (i, item) {
						var elm = $(items[i]),
							s = elm.html();
						if (!s)
							return;
							
						var id = elm.attr('mp-id'),
							comp = PageHelper.GetStoredComponent(id);
						if (comp && doNotAlter) {
							var ctrl = comp.GetControl();
							ctrl.after(elm);
							PageHelper.DeleteEditorComponents(ctrl);
						} else
							elm.appendTo(parent);

						var ctrl = MakePastedComponentEditable(elm, doNotAlter);
						elm.find('.component').each(function () {
							MakePastedComponentEditable(this, doNotAlter);
						});
						
						// Find the left/top most position
						var x = ctrl.GetLeft();
						minX = x < minX ? x : minX;
						var y = ctrl.GetTop();
						minY = y < minY ? y : minY;
						
						arr.push(ctrl);
					});
					
					// Undo, Raw HTML features don't need to change possitions!
					if (doNotAlter || doNotReposition)
						return arr;

					// Set position of all static container's direct children
					var ref = PageHelper.GetComponentRef(parent);
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
					iLog("addComponentsFromHtmlString", err, Log.Type.Error);
				}
			}
			function GetHtmlOfSelectedComponents(remove) {
				try {
					var copiedHTML = "";

					EnsureSelection();
					for (var i = 0; i < selected.length; i++) {
						var id = selected[i],
							ctrl = PageHelper.GetStoredComponent(id),
							div = ctrl.GetControl(),
							ref = PageHelper.GetComponentRef(div);

						// Skip the main container!
						if ($.inArray(ref, ['EditableContent']) > -1)
							continue;
						
						// Remove editor
						PageHelper.RemoveEditorFromComponents(div, true);
						copiedHTML += div.formOuterHTML();
						
						// Delete or return editor
						if (remove)
							div.remove();
						else
							PageHelper.AddEditorToComponents(div, true);
					};
					PageHelper.ClearSelected();
					
					copiedHTML = PageHelper.CleanHtmlAfterEditor(copiedHTML);
					return copiedHTML;
				} catch (err) {
					iLog("GetHtmlOfSelectedComponents", err, Log.Type.Error);
				}
			}
			function GetParentOfSelectedComponents() {
				for (var i = 0; i < selected.length; i++) {
					var id = selected[i],
						ctrl = PageHelper.GetStoredComponent(id),
						div = ctrl.GetControl(),
						ref = PageHelper.GetComponentRef(div);

					// Skip the main container!
					if ($.inArray(ref, ['EditableContent']) > -1)
						continue;

					// Find first allowed parent container
					ref = PageHelper.GetParentRef(div);
					if ($.inArray(ref, ["EditableContent", "StaticContainer", "DynamicContainer"]) > -1) {
						id = PageHelper.GetParentID(div);
						return id;
					}
				}
			}
			function saveCurrentState(remove) {
				var parID = GetParentOfSelectedComponents(),
					html = GetHtmlOfSelectedComponents(remove);
				
				if (remove)
					undo.Add(html, parID);
				
				return html;
			}
			function updateToolbar() {
				try {
					iLog("updateToolbar", "Called");

					if (!_toolbar)
						return;

					var cfg = MP.Tools.Config.Editor.toolBars.page;
					_toolbar
						.css('left', cfg.position.left + 'px')
						.css('top', cfg.position.top + 'px')
						.data('lastLeft', cfg.position.left)
						.data('lastTop', cfg.position.top);
					if (cfg.width)
						_toolbar.css('width', cfg.width + 'px');
				} catch (err) {
					iLog("updateToolbar", err, Log.Type.Error);
				}
			}
			function initToolbar() {
				try {
					iLog("initToolbar", "Called");
					
					_toolbar = $('#ComponentToolbar');
					_toolbar
						.draggable({
							cancel: "img",
							start: function( event, ui ) {
								Global.DisableHighlightingInChrome(true);
							},
							stop: function( event, ui ) {
								Global.DisableHighlightingInChrome(false);
								Global.UpdateLastPosition(_toolbar, ui);
							}
						})
						.resizable({
							start: function( event, ui ) {
								Global.DisableHighlightingInChrome(true);
							},
							stop: function( event, ui ) {
								Global.DisableHighlightingInChrome(false);
							}
						})
						.disableSelection()
						.hide();
					
					updateToolbar();

					_toolbar.find("img[ref]").each(function () {
						$(this)
							.attr('draggable', false)
							.draggable({
								helper : 'clone',
								start: function() {
									Global.DisableHighlightingInChrome(true);
								},
								stop: function() {
									Global.DisableHighlightingInChrome(false);
								}
							});
					});
					
					$(window).bind('scroll.CompToolBar', function () {
						if (_toolbar.is(":visible"))
							_toolbar.css('top', (_toolbar.data('lastTop') + $(document).scrollTop()) + "px");
					});
				} catch (err) {
					iLog("initToolbar", err, Log.Type.Error);
				}
			}
			function ensureFooterSeparator() {
				if (!_mainDiv.find("#FooterSeparator").length)
					_mainDiv.append("<div id='FooterSeparator'></div>");
			}
			function makeContextMenu() {
				try {
					var m = new ContextMenuItems(),
						i;
					
					i = m.Add("Edit >");
						m.Add("Copy [Ctrl+C]", function () { PageHelper.Copy(false); }, i);
						m.Add("Cut [Ctrl+X]", function () { PageHelper.Copy(true); }, i);
						m.Add("Paste [Ctrl+V]", function () { PageHelper.Paste(); }, i);
						m.Add("Copy (export)", function () { PageHelper.Export(false); }, i);
						m.Add("Cut (export)", function () { PageHelper.Export(true); }, i);
						m.Add("Paste (import)", function () { PageHelper.Import(); }, i);
					
					i = m.Add("Select >");
						m.Add("All [Ctrl+A]", function () { Editor.Select('all'); }, i);
						m.Add("Below [Ctrl+B]", function () { Editor.Select('below'); }, i);
						m.Add("Right [Ctrl+R]", function () { Editor.Select('right'); }, i);
						m.Add("Above", function () { Editor.Select('above'); }, i);
						m.Add("Left", function () { Editor.Select('left'); }, i);

					i = m.Add("Component >");
						m.Add("Properties [Ctrl+P]", function () { Editor.ShowProperties(); }, i);
						m.Add("Delete [Del]", function () { PageHelper.DeleteSelection(); }, i);
						m.Add("HTML [Ctrl+H]", function () { PageHelper.EditHTML(); }, i);
						m.Add("Duplicate", function () { PageHelper.Duplicate(); }, i);
						m.Add("Questionnaire", function () { PageHelper.Questionnaire(); }, i);
					if (undo.CanUndo())
						m.Add("Undo [Ctrl+Z]", PageHelper.Undo, i);
					
					i = m.Add("Position >");
						m.Add("Snap to Grid", function () { PageHelper.SnapToGrid(); }, i);
						m.Add("Align Left", function () { PageHelper.AlignLeft(); }, i);
						m.Add("Align Top", function () { PageHelper.AlignTop(); }, i);
						m.Add("Align Right", function () { PageHelper.AlignRight(); }, i);
						m.Add("Set Left", function () { PageHelper.SetProperty("SetLeft", PageHelper.GetMost('left') || 10, "Left"); }, i);
						m.Add("Set Top", function () { PageHelper.SetProperty("SetTop", PageHelper.GetMost('top') || 10, "Top"); }, i);
						m.Add("Space Vertically", function () { PageHelper.SpaceVertically(); }, i);
						m.Add("Space Horizontally", function () { PageHelper.SpaceHorizontally(); }, i);
						m.Add("Sort Tab Index", function () { PageHelper.SortTabIndex(); }, i);

					i = m.Add("Property >");
						m.Add("Required", function () { PageHelper.SetProperty("SetRequired", true, "Required"); }, i);
						m.Add("Width", function () { PageHelper.SetProperty("SetWidth", 100, "Width"); }, i);
						m.Add("Height", function () { PageHelper.SetProperty("SetHeight", 50, "Height"); }, i);
						m.Add("Caption", function () { PageHelper.SetProperty("SetCaption", "", "Caption"); }, i);
						m.Add("Tooltip", function () { PageHelper.SetProperty("SetTooltip", "Please enter a...", "Tooltip"); }, i);
						m.Add("Comment", function () { PageHelper.SetProperty("SetComment", "", "Comment"); }, i);
						m.Add("Name", function () { PageHelper.SetProperty("SetName", "Component1", "Name"); }, i);
						m.Add("ID", function () { PageHelper.SetProperty("SetID", "Component1", "ID"); }, i);
						m.Add("Type", function () { PageHelper.SetProperty("SetType", "text", "Type"); }, i);
						m.Add("Server Cond.", function () { PageHelper.SetProperty("SetSvrCondition", "", "Server Condition"); }, i);
						m.Add("Client Cond.", function () { PageHelper.SetProperty("SetCliCondition", "", "Client Condition"); }, i);
						m.Add("Tab Index", function () { PageHelper.SetProperty("SetTabIndex", 1, "Tab Index"); }, i);
						m.Add("Valueless Attr.", function () { PageHelper.SetProperty("SetValueLessAttrs", "", "Valueless Attributes"); }, i);
						m.Add("Style", function () { PageHelper.SetProperty("SetStyle", "", "Style"); }, i);
						m.Add("Class", function () { PageHelper.SetProperty("SetClass", "Default", "Class"); }, i);
						m.Add("Value", function () { PageHelper.SetProperty("SetValue", "1", "Value"); }, i);
						m.Add("Size", function () { PageHelper.SetProperty("SetSize", "", "Size"); }, i);
						m.Add("Help Link", function () { PageHelper.SetProperty("SetHelpLink", "../../help.html", "Size"); }, i);
						m.Add("Options", function () { PageHelper.SetProperty("SetOptions", "<option value='1'>Text</option>", "Options"); }, i);
						m.Add("Multi Select", function () { PageHelper.SetProperty("SetMultiSelect", true, "Multi Select"); }, i);
						m.Add("Target", function () { PageHelper.SetProperty("SetTarget", "Communication.LinkRequest();", "Target"); }, i);
						m.Add("Flipped", function () { PageHelper.SetProperty("SetFlipped", true, "Flipped"); }, i);

					i = m.Add("Search >");
						m.Add("Search... [Ctrl+Shift+F]", function () { Editor.Search(); }, i);
						m.Add("Clear", function () { Editor.ClearSearch(); }, i);

					i = m.Add("File >");
						m.Add("Help... [F1]", Editor.ShowHelp, i);
					if (Editor.Enabled && !Editor.LockedBy) {
						m.Add("Quick Save [Ctrl+S]", function () { PropertyEd.QuickSave(); }, i);
						m.Add("Save & Exit", function () { PropertyEd.Save(); }, i);
					};
						m.Add("Exit... [Ctrl+Q]", function () { PropertyEd.Close(); }, i);
					
					return m.GetHTML();
				} catch (err) {
					iLog("makeContextMenu", err, Log.Type.Error);
				}
			}
			
			return {
				/* PUBLIC PROPERTIES */
				Initialized : false,
				Loaded : false,
				
				/* PUBLIC METHODS */
				Load : function (html) {
					try {
						if (!this.Initialized)
							return;
						iLog("Load", "Called");
						
						// Quick save does not pass new HTML!
						if (html != undefined) {
							html = this.CleanHtmlForEditor(html);
							_mainDiv.html(html);
							ensureFooterSeparator();
						};
						
						ContextMenu.Add("#rightColumn", makeContextMenu, 'html');
						
						this.AddEditorToComponents(_mainDiv);
						
						// Delegate all event handlers!
						var div = _mainDiv.find("#rightColumn");
						div.bind("mousedown", function (evt) {
							ContextMenu.UpdatePossition(evt, 'html');
						});
						
						div.delegate(".component", "dblclick", function (event) {
							event.stopPropagation();
							Editor.ShowProperties(this);
						});
						
						div.delegate(".EditorMemo", "click", function (event) {
							event.stopPropagation();
							$(this).find("textarea").focus();
						});

						this.Loaded = true;
					} catch (err) {
						iLog("Load", err, Log.Type.Error, true);
					}
				},
				Save : function () {
					try {
						if (!this.Initialized)
							return;
						iLog("Save", "Called");
						
						this.RemoveEditorFromComponents(_mainDiv);
						this.ClearStoredComponents();

						// Unbind all event handlers!
						var div = _mainDiv.find("#rightColumn");
						div.undelegate(".component")
							.undelegate(".EditorMemo")
							.unbind('mousedown')
							.selectable("destroy");
						
						var html = _mainDiv.formHTML();
						html = this.CleanHtmlAfterEditor(html);

						this.Loaded = false;

						return html;
					} catch (err) {
						iLog("Save", err, Log.Type.Error, true);
					}
				},
				Clear : function () {
					_mainDiv.html('');
				},
				Reload : function (html, parentID) {
					iLog("Reload", "Called");

					var parEl = $('[mp-id="' + parentID + '"]');
					addComponentsFromHtmlString(html, parEl, true);
				},
				Container : function() {
					return _mainDiv;
				},
				Initialize : function () {
					updateToolbar();

					if (this.Initialized)
						return;

					_mainDiv = $('#middle');
					initToolbar();

					this.Initialized = true;
				},
				Enable : function () {
					try {
						if (!this.Initialized)
							return;
						iLog("Enable", "Called");
						
						_toolbar.show();
						
						this.Enabled = true;
					} catch (err) {
						iLog("Enable", err, Log.Type.Error, true);
					}
				},
				Disable : function () {
					try {
						iLog("Disable", "Called");
					
						_toolbar.hide();
						
						this.Enabled = false;
					} catch (err) {
						iLog("Disable", err, Log.Type.Error, true);
					}
				},
				Search : function (str, options) {
					var arr = eStore.GetItemArray();
					if (str)
						iLog("Search", "Searching " + arr.length + " HTML elements for '" + str + "'", Log.Type.Debug);
					else
						iLog("Search", "Clearing", Log.Type.Info);
					
					$.each(arr, function () {
						var el = this;
						try {
							el.Search(str, options);
							el.HighlightAsError(false);
						} catch (err) {
							iLog('BadComponent', el, Log.Type.Search);
							el.HighlightAsError(true);
						}
					});
				},
				ClearStoredComponents : function (parentDiv) {
					iLog("ClearStoredComponents", "Called");
					parentDiv = $(parentDiv);
					if (parentDiv.length) {
						parentDiv
							.find('.component')
							.each(function () {
								var id = PageHelper.GetComponentID(this);
								eStore.Remove(id);
							});
					} else
						eStore.Reset();
				},
				GetStoredComponent : function (id) {
					try {
						return eStore.GetComponent(id);
					} catch (err) {
						iLog("GetStoredComponent", err, Log.Type.Error);
					}
				},

				CreateEditorComponent : function (strRef, compName, noNameCheck) {
					try {
						if (!strRef)
							throw "No reference!";
						iLog("CreateEditorComponent", "Called");
						
						var ctrl = createComponent(strRef, compName, noNameCheck);
						AddStoredComponent(ctrl);
						
						return ctrl;
					} catch (err) {
						iLog("CreateEditorComponent", err, Log.Type.Error);
					}
				},
				// Deletes an element and all sub elements from the screen and storage
				DeleteEditorComponents : function (component) {
					try {
						var c = $(component || _currentComponent);
						if (!c.length)
							return;
						iLog("DeleteEditorComponents", "Called");

						PageHelper.ClearSelected();
						PageHelper.AddSelected(PageHelper.GetEditorComponent(c));
						
						saveCurrentState(true);
					} catch (err) {
						iLog("DeleteEditorComponents", err, Log.Type.Error);
					}
				},
				// returns object for the control
				GetEditorComponent : function (Component) {
					try {
					    Component = $(Component || _currentComponent);
						var ref = PageHelper.GetComponentRef(Component);
						if (!ref)
							throw 'Missing ref attribute!';
						
						var ctrl = null;
						var temp = Component[0];
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
				MakeUniquePageID : function (Name, MaxOcurrences) {
					if (!Name)
						return '';
						
					var pref = Name.replace(/\d+$/, ''),
						s = pref,
						max = MaxOcurrences || 0,
						cnt,
						i = 0,
						rc = $('#rightColumn');
					
					while (true) {
						cnt = rc.find('#' + s).length;
						if (cnt <= max)
							break;
						i++;
						s = pref + i.toString();
					}
					return s;
				},
				GetComponentRefByID : function (id) {
					var ctrl = PageHelper.GetStoredComponent(id),
						div = ctrl.GetControl(),
						ref = PageHelper.GetComponentRef(div);
					return ref;
				},
				GetParentRef : function (Component) {
					try {
						var p = $(Component)[0].parentNode;
						var ref = PageHelper.GetComponentRef(p);
						return ref;
					} catch (err) {
						iLog("GetParentRef", err, Log.Type.Error);
					}
				},
				GetParentID : function (Component) {
					try {
						var p = $(Component)[0].parentNode;
						var id = PageHelper.GetComponentID(p);
						return id;
					} catch (err) {
						iLog("GetParentID", err, Log.Type.Error);
					}
				},
				GetComponentRef : function (Component) {
					try {
						return $(Component).attr("ref");
					} catch (err) {
						iLog("GetComponentRef", err, Log.Type.Error);
					}
				},
				GetComponentID : function (Component) {
					try {
						return $(Component).attr("mp-id");
					} catch (err) {
						iLog("GetComponentID", err, Log.Type.Error);
					}
				},
				
				IsSelected : function (id) {
					return (id && $.inArray(id, selected) > -1);
				},
				GetSelected : function () {
					return selected;
				},
				AddSelected : function (id) {
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
				Select : function (part) {
					try {
						iLog("Select", "Called");
						
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
							var obj = arr[i],
								ctrl = obj.GetControl(),
								cID = PageHelper.GetParentID(ctrl),
								cRef = PageHelper.GetComponentRef(ctrl),
								add = false;
							
							if (cID == pID && !cRef.match(/Container/)) {
								switch (part) {
									case 'all':
										add = true;
										break;
									case 'below':
										add = obj.GetTop && obj.GetTop() > ContextMenu.OffsetY - 30;
										break;
									case 'right':
										add = obj.GetLeft && obj.GetLeft() > ContextMenu.OffsetX;
										break;
									case 'above':
										add = obj.GetTop && obj.GetTop() < ContextMenu.OffsetY - 30;
										break;
									case 'left':
										add = obj.GetLeft && obj.GetLeft() < ContextMenu.OffsetX;
										break;
								};
							
								if (add)
									PageHelper.AddSelected(obj);
							};
						};
					} catch (err) {
						iLog("SelectBelow", err, Log.Type.Error);
					}
				},
				ClearSelected : function () {
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
				
				SnapToGrid : function () {
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
				GetMost : function(posType) {
					EnsureSelection();
					if (!selected.length)
						return 0;
					
					posType = posType.toLowerCase();
					var i, ctrl, pos, min = 9999999;
					for (i = 0; i < selected.length; i++) {
						ctrl = PageHelper.GetStoredComponent(selected[i]);
						if (ctrl) {
							pos = (posType == 'top') ? ctrl.GetTop() : ctrl.GetLeft();
							min = pos < min ? pos : min;
						};
					};
					
					return min;
				},
				AlignLeft : function () {
					try {
						iLog("AlignLeft", "Called");
						
						var i, ctrl,
							minX = PageHelper.GetMost('left'),
							snap = MP.Tools.Config.Editor.html.snap;
						
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
				AlignRight : function () {
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
				AlignTop : function () {
					try {
						iLog("AlignTop", "Called");
						
						var i, ctrl,
							minY = PageHelper.GetMost('top'),
							snap = MP.Tools.Config.Editor.html.snap;
						
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
				SpaceVertically : function () {
					try {
						iLog("SpaceVertically", "Called");
						
						EnsureSelection();
						jPrompt('Please enter a vertical spacing between tops of the selected components', 40, 'Space Vertically', function (v) {
							if (v == null)
								return;

							var i, ctrl, arr = [];
							for (i = 0; i < selected.length; i++) {
								ctrl = PageHelper.GetStoredComponent(selected[i]);
								if (ctrl)
									arr.push(ctrl);
							}
							
							arr.sort(function(a, b) {
								return (a.GetTop() - b.GetTop());
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
				SpaceHorizontally : function () {
					try {
						iLog("SpaceHorizontally", "Called");
						
						EnsureSelection();
						jPrompt('Please enter a horizontal spacing between left sides of the selected components', 100, 'Space Horizontally', function (v) {
							if (v == null)
								return;

							var i, ctrl, arr = [];
							for (i = 0; i < selected.length; i++) {
								ctrl = PageHelper.GetStoredComponent(selected[i]);
								if (ctrl)
									arr.push(ctrl);
							}
							
							arr.sort(function(a, b) {
								return (a.GetLeft() - b.GetLeft());
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
				Duplicate : function () {
					try {
						iLog("Duplicate", "Called");
						
						EnsureSelection();
						
						var parID = GetParentOfSelectedComponents();
						var parEl = $('[mp-id="' + parID + '"]');
						var html = saveCurrentState(false);
						if (!html)
							return;
						
						jPrompt('Please enter how many copies and their vertical spacing', '5, 20', 'Duplicate Component', function (v) {
							if (v == null)
								return;

							var arr = v.split(','),
								count = (arr.length > 0) ? parseInt(arr[0]) : 0,
								space = (arr.length > 1) ? parseInt(arr[1]) : 0,
								offsetY = 0;
							
							if (!count)
								return;
								
							space = space || 20;
							for (var i = 0; i < count; i++) {
								var ctrls = addComponentsFromHtmlString(html, parEl, false, true);
								offsetY += space; 
								
								// Set position of all static container's direct children
								for (var y = 0; y < ctrls.length; y++) {
									var ctrl = ctrls[y],
										div = ctrl.GetControl(),
										ref = PageHelper.GetParentRef(div);

									// Set new position of all static container's direct children
									if (ref == "StaticContainer")
										ctrl.SetTop(ctrl.GetTop() + offsetY);
									else {
										div.css('position', 'relative')
										   .css('left', '')
										   .css('top', '')
										   .css('width', '');
										ctrl.Refresh();
									}
								}
							}
							PageHelper.ClearSelected();
						});
					} catch (err) {
						iLog("Duplicate", err, Log.Type.Error);
					}
				},
				Questionnaire : function () {
					try {
						iLog("Questionnaire", "Called");
						
						var container = ContextMenu.EventComponent,
							ref = PageHelper.GetComponentRef(container);
						if (ref != "StaticContainer") {
							jAlert("Questionnaires may be built only in body of static containers!");
							return;
						};
						
						// This dialog removes itself from DOM after close!
						var dlg = $('<div id="QuestionnaireDlg"><div class="toolWrapper"><div class="noWrap">List questions in "Text=Name" format:</div><textarea class="dialogTextarea"/></div></div>');
						var aceEditor;
						var btns = {
							'Build' : function (e) {
								lastQuestionnaire = aceEditor.Value();

								var lines = lastQuestionnaire.split('\n'),
									width = Utilities.ToNumber($('#width', dlg).val()) || 500,
									spacing = Utilities.ToNumber($('#spacing', dlg).val()) || 25,
									fill = $('#fill', dlg).val(),
									snap = MP.Tools.Config.Editor.html.snap,
									x = Utilities.SnapTo(ContextMenu.OffsetX, snap[0]),
									y = Utilities.SnapTo(ContextMenu.OffsetY, snap[1]);
								
								$.each(lines, function (i, line) {
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
							'Load Last' : function (e) {
								aceEditor.Value(lastQuestionnaire);
							}
						};
						
						dlg.dialog({
							title : "Build Questionnaire",
							width : 500,
							height : 400,
							minWidth : 400,
							minHeight : 300,
							autoOpen : false,
							closeOnEscape : true,
							modal : true,
							buttons : btns,
							resizeStart: function() {
								Global.DisableHighlightingInChrome(true);
							},
							resizeStop: function() {
								Global.DisableHighlightingInChrome(false);
								aceEditor.Height(dlg.height() - 70);
							},
							dragStart: function() {
								Global.DisableHighlightingInChrome(true);
							},
							dragStop: function() {
								Global.DisableHighlightingInChrome(false);
							},
							close : function () {
								aceEditor.Remove();
								dlg.remove();
							},
							open : function () {
								aceEditor = new MP.Constructors.AceEditor($('.dialogTextarea', dlg), {
									language: 'text',
									focus: true,
									value: lastQuestionnaire
								});
								aceEditor.Height(dlg.height() - 70);

								$('<p/>')
									.append('Width <input id="width" value="500" style="width: 50px"/> ')
									.append('Spacing <input id="spacing" value="25" style="width: 50px"/> ')
									.append('Fill <input id="fill" value=" ." style="width: 50px"/> ')
									.appendTo($('.toolWrapper', dlg));
							}
						});
						dlg.dialog("open");
					} catch (err) {
						iLog("Questionnaire", err, Log.Type.Error);
					}
				},
				SortTabIndex : function () {
					try {
						iLog("SortTabIndex", "Called");
						
						EnsureSelection();
						jPrompt('Please enter an initial Tab Index value', 1, 'SortTabIndex', function (v) {
							if (v == null)
								return;

							var i, ctrl, arr = [];
							for (i = 0; i < selected.length; i++) {
								ctrl = PageHelper.GetStoredComponent(selected[i]);
								if (ctrl)
									arr.push(ctrl);
							}
							arr.sort(function(a, b) {
								a = a.GetTop() + '.' + a.GetLeft();
								b = b.GetTop() + '.' + b.GetLeft();
								return (parseFloat(a) - parseFloat(b));
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
				SetProperty : function (methodName, displayValue, description) {
					try {
						iLog("SetProperty", methodName);
						
						EnsureSelection();
						jPrompt('Please enter a new value', displayValue, description, function (v) {
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
				Copy : function (doCut) {
					try {
						iLog("Copy", "Called");
						
						copiedHTML = saveCurrentState(doCut);
					} catch (err) {
						iLog("Copy", err, Log.Type.Error);
					}
				},
				Paste : function () {
					try {
						iLog("Paste", "Called");
						
						addComponentsFromHtmlString(copiedHTML);
					} catch (err) {
						iLog("Paste", err, Log.Type.Error);
					}
				},
				Export : function (doCut) {
					try {
						iLog("Export", "Called");
						
						copiedHTML = saveCurrentState(doCut);
						if (!Global.SetClipboard(copiedHTML))
							Editor.ShowAceEditorForm(copiedHTML, 'Export', '', null, null, {language: "html"});
					} catch (err) {
						iLog("Export", err, Log.Type.Error);
					}
				},
				Import : function () {
					try {
						iLog("Import", "Called");
						
						var s = Global.GetClipboard();
						if (s)
							addComponentsFromHtmlString(s)
						else
							Editor.ShowAceEditorForm(s, 'Import', '', addComponentsFromHtmlString, null, {language: "html"});
					} catch (err) {
						iLog("Import", err, Log.Type.Error);
					}
				},
				DeleteSelection : function () {
					try {
						iLog("DeleteSelection", "Called");
						
						EnsureSelection();
						Editor.HideProperties();
						saveCurrentState(true);
					} catch (err) {
						iLog("DeleteSelection", err, Log.Type.Error);
					}
				},
				EditHTML : function () {
					try {
						iLog("EditHTML", "Called");
						
						EnsureSelection();
						
						var parID = GetParentOfSelectedComponents();
						var parEl = $('[mp-id="' + parID + '"]');
						var h1 = saveCurrentState(false);
						if (!h1)
							return;
						
						function update(html) {
							addComponentsFromHtmlString(html, parEl, true);
							PageHelper.ClearSelected();
						};
						
						Editor.ShowAceEditorForm(h1, "HTML Editor", "WARNING: Not following editor API may corrupt the page or the editor!", update, null);
					} catch (err) {
						iLog("EditHTML", err, Log.Type.Error);
					}
				},
				AddEditorToComponents : function (div, includeSelf, forceNewIds) {
					div = div || $("#rightColumn");
					
					$(".component", div).each(function () {
						AddEditorToComponent(this, forceNewIds);
					});
					if (includeSelf && div.length)
						AddEditorToComponent(div, forceNewIds);
				},
				// Removes editor and cleans up all components
				RemoveEditorFromComponents : function (div, includeSelf) {
					div = $(div);
					if (!div.length)
						return;
					
					$(".component", div).each(function () {
						RemoveEditorFromComponent(this);
					});
					if (includeSelf)
						RemoveEditorFromComponent(div);
				},
				ValidatePage : function () {
					try {
						PageHelper.Search();
						
						var arr = eStore.GetItemArray(),
							tooltips = 0,
							names = 0,
							ids = 0,
							s = '';
						
						iLog("ValidatePage", "Validating " + arr.length + " HTML components", Log.Type.Debug);
						
						$.each(arr, function () {
							var isWrong = false,
								ref = PageHelper.GetComponentRef(this.GetControl());
							
							// Input's tooltips - elements with names only!
							if (this.GetTooltip && this.GetName && !this.GetTooltip()) {
								tooltips++;
								isWrong = true;
								iLog(this.GetName() + '.NoTooltip', this, Log.Type.Search);
							};
							
							// Input's names
							if (this.GetName && !this.GetName()) {
								names++;
								isWrong = true;
								iLog(ref + '.NoName', this, Log.Type.Search);
							};
							
							// Unique IDs
							if ($.inArray(ref, ['EditorRadio', 'EditableContent']) == -1) {
								var id;
								if (!id && this.GetID)
									id = this.GetID();
								if (!id && this.GetName)
									id = this.GetName();
								if (id) {
									var el = $('[id="' + id + '"]');
									if (el.length > 1) {
										ids++;
										isWrong = true;
										iLog(id + '.DuplicateID', this, Log.Type.Search);
									};
								};
							};
							
							this.HighlightAsError(isWrong);
						});
						
						if (tooltips)
							s += 'Missing tooltips: ' + tooltips + '<br>';
						if (names)
							s += 'Components with no names: ' + names + '<br>';
						if (ids)
							s += 'Duplicate IDs: ' + ids + '<br>';
						if (s)
							iLog('ValidatePage', 'Discovered ' + parseInt(tooltips + names + ids) + ' possible problems!', Log.Type.Debug);
					} catch (err) {
						iLog("ValidatePage", err, Log.Type.Error);
					}
					return s;
				},
				// To clean or othervice manipulate data prior editor save
				CleanVrmAfterEditor : function (data) {
					iLog("CleanVrmAfterEditor", "Called");
						
						// URL fix for URL in the path
						var url = window.location.href.split('/');
						url = url[0] + '/' + url[1] + '/' + url[2];
						var re = new RegExp(url, "g");
						data = data.replace(re, "../..");

						// No idea what this is for
						data = data.replace(/done[0-9]{1,}=\"[0-9]{1,}\"\s{0,}/g, "");
					
					return data;
				},
				CleanHtmlAfterEditor : function (data) {
					iLog("CleanHtmlAfterEditor", "Called");
						
					data = data.replace(/mp-target/g, "onclick");
					data = data.replace(/mp-type/g, "type");

					if (/mp-hide/.test(data)) {
						// Make an extra wrapper to get access to all children
						data = '<div>' + data + '</div>';

						// Hide originally hiden elements
						var html = $(data),
							cmps = html.find('[mp-hide]');
						cmps.each(function () {
							var el = $(this);
							el.removeAttr("mp-hide");
							el.css('display', 'none');
						});
						
						data = html.html();
					};

					return data;
				},
				CleanHtmlForEditor: function (data) {
					iLog("CleanHtmlForEditor", "Called");

					// Make an extra wrapper to get access to all children
					data = '<div>' + data + '</div>';
					
					// Move input types into new editable attribute
					var cmps
					cmps = $(data).find('.component.EditorText');
					cmps.each(function () {
						var input = $(this).find('input');
						if (!input.length)
							return;

						var type = input.attr('type');
						type = 'type="' + type + '"';

						var txt1 = input.outerHTML();
						var txt2 = txt1.replace(type, 'mp-' + type);
						data = data.replace(txt1, txt2);
					});

					// Show all hiden elements
					var html = $(data);
					cmps = html.find('*');
					cmps.each(function () {
						var el = $(this),
							hid = el.css("display") == "none";
						if (hid) {
							el.css('display', '');
							el.attr('mp-hide', 'true');
						};
					});
					
					return html.formHTML();
				},
				AddHelpLink : function (ctrl) {
					
					// Does element have a help link?
					if (!ctrl.GetHelpLink)
						return;

					var url = ctrl.GetHelpLink();
					if (!url || url.beginsWith('#L') && url.endsWith('#'))
						return;
					
					var el = ctrl.GetControl();

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
				},
				Undo : function () {
					iLog("Undo", "Called");

					undo.Undo();
				},
				Redo : function () {
					iLog("Redo", "Called");

					undo.Redo();
				},
				ClearUndo : function () {
					iLog("ClearUndo", "Called");
					
					undo.Clear();
				},
				// Use only for delete from property dialog!
				DeleteFromProperties : function () {
					try {
						iLog("DeleteFromProp", "Called");
						
						PageHelper.DeleteEditorComponents();
					} catch (err) {
						iLog("DeleteFromProp", err, Log.Type.Error);
					}
				},
				ShowProperties : function (Component) {
					try {
						iLog("ShowProperties", "Called");

						Component = $(Component || ContextMenu.EventComponent);
						if (!Component.hasClass('component'))
							Component = Component.parent();

						var ctrl = this.GetEditorComponent(Component),
							pr = ctrl.GetProperties(),
							title = ctrl.refClassName;
						try {
							if (ctrl.GetName)
								title = title + " - Name: " + ctrl.GetName();
							if (ctrl.GetID)
								title = title + " - ID: " + ctrl.GetID();
						} catch (err) {
							iLog("ShowProperties", err, Log.Type.Error, true);
						}						
						
						_currentComponent = Component;
						PropertyEd.Show(pr, this.DeleteFromProperties, title);
					} catch (err) {
						iLog("ShowProperties", err, Log.Type.Error);
					}
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	return PageHelper;
});

/*
 New bootstrap editor
*/
define('Bootstrap', ['ContextMenu', 'ContextMenuItems', 'Undo'], function (ContextMenu, ContextMenuItems, Undo) {

	// Building componentTypes isn't safe, but if we don't do it this way we will encounter circular dependency issues because many components depend upon Bootstrap
	var compTypeIncludes = {
		'input' : 'bs/comp/input',
		'checkbox' : 'bs/comp/checkbox',
		'radio' : 'bs/comp/radio',
		'textarea' : 'bs/comp/textarea',
		'select' : 'bs/comp/select',
		'button' : 'bs/comp/button',
		'div' : 'bs/comp/div',
		'panel' : 'bs/comp/panel',
		'widget' : 'bs/comp/widget',
		'label' : 'bs/comp/label',
		'bootstrapContent' : 'bs/comp/bootstrapContent',
		'container' : 'bs/comp/container',
		'row' : 'bs/comp/row',
		'column' : 'bs/comp/column',
		'js' : 'bs/comp/js'
	};
	
	var includes = [],
		types = [],
		key;	
	for (key in compTypeIncludes) {
		if (compTypeIncludes.hasOwnProperty(key)) {
			includes.push(compTypeIncludes[key]);
			types.push(key);
		}
	}
	
	var controlTypes = {};
	require(includes, function () {
		for (var i = 0; i < types.length; ++i)
			controlTypes[types[i]] = arguments[i];
	});

	var Editor, HtmlEditor;
	require(['Editor', 'HtmlEditor'], function (ed, html) {
		Editor = ed;
		HtmlEditor = html;
	});
	
	var Bootstrap = new function (undefined) {
		try {

			/* PRIVATE PROPERTIES */
			var logClassName = "Bootstrap.",
				undo = new Undo('Bootstrap', reload),
				copiedHTML = '',
				_toolbar,
				_mainDiv,
				_shellDiv,
				_shellWidth,
				propSource, propData, propGrid, elements, deleted,
				editorClasses = ['ui-droppable', 'ui-sortable', 'bs-rowBox', 'bs-columnBox', 'bs-containerBox', 'ui-activeBox', 'bs-noSubProps'],
				notFriendlyAttributes = [
					'type', 'checked', 'readonly', 'disabled',
					// Mouse events
					'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmousemove', 'onmouseout', 'onmouseover', 'onscroll', 'onwheel',
					// Keyboard events
					'onkeydown', 'onkeypress', 'onkeyup',
					// Form events
					'onblur', 'onchange', 'oncontextmenu', 'onfocus', 'oninput', 'oninvalid', 'onreset', 'onsearch', 'onselect', 'onsubmit'
				];
			
			function iLog(Place, Message, Type, Silent) {
				Log.Add(logClassName + Place, Message, Type, Silent);
			}
			function reload(html, parentID) {
				Bootstrap.Reload(html, parentID);
			}
			function updateToolbar() {
				try {
					iLog("updateToolbar", "Called");

					if (!_toolbar)
						return;

					var cfg = MP.Tools.Config.Editor.toolBars.bootstrap;
					_toolbar
						.css('left', cfg.position.left + 'px')
						.css('top', cfg.position.top + 'px')
						.data('lastLeft', cfg.position.left)
						.data('lastTop', cfg.position.top);
					if (cfg.width)
						_toolbar.css('width', cfg.width + 'px');
				} catch (err) {
					iLog("updateToolbar", err, Log.Type.Error);
				}
			}
			function initToolbar() {
				try {
					iLog("initToolbar", "Called");
					
					_toolbar = $('#BootstrapToolbar');
					_toolbar
						.draggable({
							cancel: "img",
							start: function( event, ui ) {
								Global.DisableHighlightingInChrome(true);
							},
							stop: function( event, ui ) {
								Global.DisableHighlightingInChrome(false);
								Global.UpdateLastPosition(_toolbar, ui);
							}
						})
						.resizable({
							start: function( event, ui ) {
								Global.DisableHighlightingInChrome(true);
							},
							stop: function( event, ui ) {
								Global.DisableHighlightingInChrome(false);
							}
						})
						.disableSelection()
						.hide();
					
					updateToolbar();

					_toolbar.find("img[ref]").each(function () {
						$(this)
							.attr('draggable', false)
							.draggable({
								helper : 'clone',
								start: function() {
									Global.DisableHighlightingInChrome(true);
								},
								stop: function() {
									Global.DisableHighlightingInChrome(false);
								}
							});
					});
					
					$(window).bind('scroll.bootstrapToolBar', function () {
						if (_toolbar.is(":visible"))
							_toolbar.css('top', (_toolbar.data('lastTop') + $(document).scrollTop()) + "px");
					});
				} catch (err) {
					iLog("initToolbar", err, Log.Type.Error);
				}
			}
			function addEditorToComponent(Component, forceNewNames) {
				try {
					var ctrl = Bootstrap.GetEditorComponent(Component);
					ctrl.EditMode(forceNewNames);
					
					return ctrl;
				} catch (err) {
					iLog("addEditorToComponent", err, Log.Type.Error, true);
				}
			}
			function removeEditorFromComponent(Component) {
				try {
					var ctrl = Bootstrap.GetEditorComponent(Component);
					if (!ctrl)
						return;
						
					ctrl.HighlightAsFound(false);
					ctrl.HighlightAsError(false);
					ctrl.DefaultMode();

					var elm = $(Component);
					
					// Remove extra attributes and editor classes
					elm.removeAttr("unselectable");
					elm.removeClass("ui-activeBox");
					if (elm.attr("condition") == "")
						elm.removeAttr("condition");
					
					elm.find('.ui-selectee').removeClass("ui-selectee");
				} catch (err) {
					iLog("removeEditorFromComponent", err, Log.Type.Error, true);
				}
			}
			function addSelectorToCSS(cssData, elSelector) {
				return ((cssData + "") || "")
					.replace(/\n|\t/g, " ")
					.replace(/\s+/g, " ")
					.replace(/\s*\/\*.*?\*\/\s*/g, " ")
					.replace(/(^|\})(.*?)(\{)/g, function($0, $1, $2, $3) {
						var collector = [],
							parts = $2.split(",");
						for (var i = 0; i < parts.length; i++)
							collector.push(elSelector + " " + parts[i].replace(/^\s*|\s*$/, ""));
						return $1 + " " + collector.join(", ") + " " + $3;
					});
			}
			function addCSS(cssData, elSelector) {
				if (elSelector)
					cssData = addSelectorToCSS(cssData, elSelector);
			    $("head").append('<style type="text/css" mp-remove="true">' + cssData + '</style>');
			}
			function loadCSS(cssUrl, elSelector, successCB, errorCB) {
			    $.ajax({
			        url: cssUrl,
			        dataType: "text/css",
			        success: function(data) {
		            	addCSS(data, elSelector);
						var fn = successCB || $.noop;
			            fn(data, cssUrl, elSelector);
			        },
			        error: function(jqXHR, err) {
						var fn = errorCB || $.noop;
			            fn(jqXHR, cssUrl, elSelector);
			        }
			    })
			}
			function ensureStyles(styles) {
				for (var i = 0; i < styles.length; i++) {
					var style = styles[i];
					loadCSS(style.f, style.e);
				}
			}
			function findClosestParentControl(element, references) {
				var el = $(element);

				if ($.inArray(el.attr('ref'), references) > -1)
					return Bootstrap.GetEditorComponent(el[0]);

				var parents = el.parents('[ref]');
				for (var i = 0; i < parents.length; i++) {
					var parent = $(parents[i]);
					if ($.inArray(parent.attr('ref'), references) > -1)
						return Bootstrap.GetEditorComponent(parent);
				}
			}
			function makeContextMenu() {
				try {
					var m = new ContextMenuItems(),
						i;
					
					i = m.Add("Edit >");
						m.Add("Copy [Ctrl+C]", function () { Bootstrap.Copy(false); }, i);
						m.Add("Cut [Ctrl+X]", function () { Bootstrap.Copy(true); }, i);
						m.Add("Paste [Ctrl+V]", function () { Bootstrap.Paste(); }, i);
						m.Add("Copy (export)", function () { Bootstrap.Export(false); }, i);
						m.Add("Cut (export)", function () { Bootstrap.Export(true); }, i);
						m.Add("Paste (import)", function () { Bootstrap.Import(); }, i);
					
					i = m.Add("Component >");
						m.Add("Properties [Ctrl+P]", function () { Bootstrap.ShowProperties(); }, i);
						m.Add("Delete [Del]", function () { Bootstrap.DeleteSelection(); }, i);
						m.Add("HTML [Ctrl+H]", function () { Bootstrap.EditHTML(); }, i);
					if (undo.CanUndo())
						m.Add("Undo [Ctrl+Z]", Bootstrap.Undo, i);

					i = m.Add("Columns >");
						m.Add("Count", function () { Bootstrap.ColumnCount(); }, i);
						m.Add("Class", function () { Bootstrap.ColumnClass(); }, i);
						m.Add("Add New", function () { Bootstrap.ColumnCount(1); }, i);
						m.Add("Remove Last", function () { Bootstrap.ColumnCount(-1); }, i);
					
					i = m.Add("Rows >");
						m.Add("Count", function () { Bootstrap.RowCount(); }, i);
						m.Add("Add New", function () { Bootstrap.RowCount(1); }, i);
						m.Add("Remove Last", function () { Bootstrap.RowCount(-1); }, i);
					
					i = m.Add("Search >");
						m.Add("Search...", function () { Editor.Search(); }, i);
						m.Add("Clear", function () { Editor.ClearSearch(); }, i);

					i = m.Add("File >");
						m.Add("Help... [F1]", Editor.ShowHelp, i);
					if (Editor.Enabled && !Editor.LockedBy) {
						m.Add("Quick Save [Ctrl+S]", function () { PropertyEd.QuickSave(); }, i);
						m.Add("Save & Exit", function () { PropertyEd.Save(); }, i);
					};
						m.Add("Exit... [Ctrl+Q]", function () { PropertyEd.Close(); }, i);
					
					return m.GetHTML();
				} catch (err) {
					iLog("makeContextMenu", err, Log.Type.Error);
				}
			}
			function cleanHtmlAfterEditor(data) {
				iLog("cleanHtmlAfterEditor", "Called");
				
				var i, attr;
				for (i = 0; i < notFriendlyAttributes.length; i++) {
					attr = notFriendlyAttributes[i];
					data = Utilities.ReplaceAll(data, ' we-' + attr + '="', ' ' + attr + '="');
				}

				if (/mp-hide/.test(data)) {
					// Make an extra wrapper to get access to all children
					data = '<div>' + data + '</div>';

					// Hide originally hiden elements
					var html = $(data),
						cmps = html.find('[mp-hide]');
					cmps.each(function () {
						var el = $(this);
						el.removeAttr("mp-hide");
						el.css('display', 'none');
					});
					
					data = html.html();
				};

				return data;
			}
			function cleanHtmlForEditor(data) {
				iLog("cleanHtmlForEditor", "Called");

				// Important! Do not include 1st TYPE attribute!!!
				var i, attr;
				for (i = 1; i < notFriendlyAttributes.length; i++) {
					attr = notFriendlyAttributes[i];
					data = Utilities.ReplaceAll(data, ' ' + attr + '="', ' we-' + attr + '="');
				}

				// Make an extra wrapper to get access to all children
				data = '<div>' + data + '</div>';
				
				// Move input types into new editable attribute
				var cmps
				cmps = $(data).find('[ref="input"]');
				cmps.each(function () {
					var input = $(this),
						type = input.attr('type'),
						txt1 = input.outerHTML(),
						txt2 = txt1.replace('type="' + type + '"', 'we-' + 'type="' + type + '"');

					data = data.replace(txt1, txt2);
				});

				// Show all hiden elements
				var html = $(data);
				cmps = html.find('*');
				cmps.each(function () {
					var el = $(this),
						hid = el.css("display") == "none";
					if (hid) {
						el.css('display', '');
						el.attr('mp-hide', 'true');
					};
				});
				
				return html.formHTML();
			}
			function getHtmlOfSelectedComponents(element, remove) {
				try {
					var copiedHTML = "",
						div = $(element),
						ref = div.attr('ref');

					// Skip the main container!
					if ($.inArray(ref, ['bootstrapContent']) > -1)
						return '';
					
					// Remove editor
					Bootstrap.RemoveEditorFromComponents(div, true);
					copiedHTML += div.formOuterHTML();
					
					// Delete or return editor
					if (remove)
						div.remove();
					else
						Bootstrap.AddEditorToComponents(div, true);
					
					copiedHTML = cleanHtmlAfterEditor(copiedHTML);
					
					return copiedHTML;
				} catch (err) {
					iLog("getHtmlOfSelectedComponents", err, Log.Type.Error);
				}
			}
			function getElementCtrl(element) {
				try {
					var el = $(element);
					if (el.attr('ref'))
						return Bootstrap.GetEditorComponent(el);

					var parents = el.parents('[ref]');
					if (parents.length)
						return Bootstrap.GetEditorComponent(parents[0]);
				} catch (err) {
					iLog("getElementCtrl", err, Log.Type.Error);
				}
			}
			function getParentCtrl(element) {
				try {
					var el = $(element),
						parents = el.parents('[ref]');
					
					if (el.attr('ref') && parents.length > 0)
						return Bootstrap.GetEditorComponent(parents[0]);

					if (parents.length > 1)
						return Bootstrap.GetEditorComponent(parents[1]);
				} catch (err) {
					iLog("getParentCtrl", err, Log.Type.Error);
				}
			}
			function saveCurrentState(remove, element) {
				var el = element || ContextMenu.EventComponent,
					elm = getElementCtrl(el),
					par = getParentCtrl(el),
					html = getHtmlOfSelectedComponents(elm.Control(), remove);
				
				if (remove)
					undo.Add(html, par.ID());
				
				return html;
			}
			function addComponentsFromHtmlString(htmlStr, parent, doNotAlter) {
				try {
					if (!htmlStr)
						return;

					copiedHTML = htmlStr;
					htmlStr = cleanHtmlForEditor(htmlStr);
					
					var elm = $(htmlStr),
						id = elm.attr('mp-id');
					if (doNotAlter) {
						var el = _mainDiv.find('[mp-id=' + id + ']');
						if (el.length)
							saveCurrentState(true, el);
					};

					// If no parent provided find first droppable area of currently active box
					if (!parent || !parent.length) {
						parent = ContextMenu.ActiveBox;
						if (!parent.hasClass('ui-droppable'))
							parent = $(parent.find('.ui-droppable').get(0));
					}
					switch (parent.selector) {
						case '.prev()': parent.after(elm); break;
						case '.next()': parent.before(elm); break;
						default: parent.append(elm); break;
					}
					
					Bootstrap.AddEditorToComponents(elm, true, !doNotAlter);
				} catch (err) {
					iLog("addComponentsFromHtmlString", err, Log.Type.Error);
				}
			}

			return {
				Enabled : false,
				Initialized : false,
				Loaded : false,

				Enable : function () {
					try {
						if (!this.Initialized)
							return;
						iLog("Enable", "Called");
						
						_toolbar.show();
						
						this.Enabled = true;
					} catch (err) {
						iLog("Enable", err, Log.Type.Error, true);
					}
				},
				Disable : function () {
					try {
						iLog("Disable", "Called");
					
						_toolbar.hide();
						
						this.Enabled = false;
					} catch (err) {
						iLog("Disable", err, Log.Type.Error, true);
					}
				},
				Load : function (html) {
					try {
						if (!this.Initialized)
							return;
						iLog("Load", "Called");
						
						// Quick save does not pass new HTML!
						if (html != undefined) {
							ensureStyles([
								{f: '../../css/icons-min.css'},
								{f: '../../css/bootstrap-min.css', e: '#bootstrap'},
								{f: '../../css/widgets.css', e: '#bootstrap'}
							]);
							html = cleanHtmlForEditor(html);
							_mainDiv.html(html);
							_shellDiv.css('width', 'auto');
						};
						this.AddEditorToComponents();
						ContextMenu.Add("#bootstrap", makeContextMenu, 'bootstrap');

						// Delegate all event handlers!
						_mainDiv.bind("mousedown", function (evt) {
							ContextMenu.UpdatePossition(evt, 'bootstrap');
						});
						_mainDiv.delegate("[ref]", "dblclick", function (event) {
							event.stopPropagation();
							Bootstrap.ShowProperties(this);
						});

						this.Loaded = true;
					} catch (err) {
						iLog("Load", err, Log.Type.Error, true);
					}
				},
				Save : function () {
					try {
						if (!this.Initialized || !this.Loaded)
							return;
						iLog("Save", "Called");
						
						this.RemoveEditorFromComponents();

						// Unbind all event handlers!
						_mainDiv.undelegate("[ref]")
							.unbind('mousedown')
							.selectable("destroy");

						var html = _mainDiv.formHTML();
						html = cleanHtmlAfterEditor(html);

						return html;
					} catch (err) {
						iLog("Save", err, Log.Type.Error, true);
					}
				},
				Clear : function () {
					// Remove added bootstrap
					_shellDiv.css('width', _shellWidth);
					_mainDiv.html('');
					$('head [mp-remove]').remove();
				},
				Reload : function (html, parentID) {
					iLog("Reload", "Called");

					var parEl = $('[mp-id="' + parentID + '"]');
					addComponentsFromHtmlString(html, parEl, true);
				},
				Container : function() {
					return _mainDiv;
				},
				Initialize : function () {
					try {
						iLog("Initialize", "Called");
						
						updateToolbar();

						if (this.Initialized)
							return;

						_mainDiv = $('<div id="bootstrap"/>');
						_shellDiv = $('#shell');

						// In standalone version add the editor after its header, othervise to the top
						var vet = $('#vrmEditorTitle');
						if (vet.length)
							vet.after(_mainDiv);
						else
							_shellDiv.prepend(_mainDiv);
						_shellWidth = _shellDiv.css('width');

						initToolbar();

						this.Initialized = true;
					} catch (err) {
						iLog("Initialize", err, Log.Type.Error);
					}
				},
				CreateEditorComponent : function (strRef, compName, noNameCheck, size) {
					try {
						iLog("CreateEditorComponent", "Ref: " + strRef + ", Name: " + compName);
						
						if (!strRef)
							throw "Missing component reference!";
						
						var fn = controlTypes[strRef];
						var ctrl = new fn();
						if (!ctrl)
							throw "Component '" + strRef + "' could not be created!";
							
						ctrl.Create(compName || strRef, size);
						ctrl.EditMode(!noNameCheck);
						ctrl.Control()[0][strRef] = ctrl;
						
						return ctrl;
					} catch (err) {
						iLog("CreateEditorComponent", err, Log.Type.Error);
					}
				},
				// Called when a template component is dropped onto a container
				BuildComponent : function (strRef, Container, size) {
					try {
						iLog("BuildComponent", "Ref: " + strRef);
						
						var ctrl = this.CreateEditorComponent(strRef, null, null, size),
							cont = $(Container);
						cont.append(ctrl.Control());
						ctrl.EditMode();
						cont.parents('[ref]').removeClass('droppable-hover');

						return ctrl;
					} catch (err) {
						iLog("BuildComponent", err, Log.Type.Error);
					}
				},
				AddEditorToComponents : function (Container, includeSelf, forceNewNames) {
					try {
						iLog("AddEditorToComponents", "Called");
						
						var div = Container || _mainDiv;
						$(div).find("[ref]").each(function() {
							addEditorToComponent(this, forceNewNames);
						});
					if (includeSelf && div.length)
						addEditorToComponent(div, forceNewNames);
					} catch (err) {
						iLog("AddEditorToComponents", err, Log.Type.Error);
					}
				},
				RemoveEditorFromComponents : function (Container, includeSelf) {
					try {
						iLog("RemoveEditorFromComponents", "Called");
						
						var div = Container || _mainDiv;
						$(div).find("[ref]").each(function() {
							removeEditorFromComponent(this);
						});
						if (includeSelf)
							removeEditorFromComponent(div);
					} catch (err) {
						iLog("RemoveEditorFromComponents", err, Log.Type.Error);
					}
				},
				GetEditorComponent : function (Component) {
					try {
					    Component = $(Component);
						var ref = Component.attr('ref');
						if (!ref)
							throw 'Missing ref attribute!';
						
						var ctrl = null;
						var temp = Component[0];
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
				MakeUniquePageID : function (Name, MaxOcurrences) {
					if (!Name)
						return '';
						
					var pref = Name.replace(/\d+$/, ''),
						s = pref,
						max = MaxOcurrences || 0,
						cnt,
						i = 0;
					
					while (true) {
						cnt = _mainDiv.find('#' + s).length;
						if (cnt <= max)
							break;
						i++;
						s = pref + i.toString();
					}
					return s;
				},
				MakeUniquePageName : function (Name, MaxOcurrences) {
					if (!Name)
						return '';
						
					var pref = Name.replace(/\d+$/, ''),
						s = pref,
						max = MaxOcurrences || 0,
						cnt,
						i = 0;
					
					while (true) {
						cnt = _mainDiv.find('[name="' + s + '"]').length;
						if (cnt <= max)
							break;
						i++;
						s = pref + i.toString();
					}
					return s;
				},
				Search : function (str, options) {
					var elms = _mainDiv.find("[ref]");
					if (str)
						iLog("Search", "Searching " + elms.length + " HTML elements for '" + str + "'", Log.Type.Debug);
					else
						iLog("Search", "Clearing", Log.Type.Info);
					
					$.each(elms, function () {
						var ctrl = Bootstrap.GetEditorComponent(this);
						try {
							ctrl.Search(str, options);
							ctrl.HighlightAsError(false);
						} catch (err) {
							iLog('BadComponent', ctrl, Log.Type.Search);
							ctrl.HighlightAsError(true);
						}
					});
				},
				DeleteSelection : function (element) {
					try {
						iLog("DeleteSelection", "Called");
						
						Editor.HideProperties();
						saveCurrentState(true, element);
					} catch (err) {
						iLog("DeleteSelection", err, Log.Type.Error);
					}
				},
				EditHTML : function () {
					try {
						iLog("EditHTML", "Called");
						
						var el, elm;
						el = getElementCtrl(ContextMenu.EventComponent).Control();
						elm = el.prev();
						if (!elm.length)
							elm = el.next();
						if (!elm.length)
							elm = getParentCtrl(ContextMenu.EventComponent).Control();

						var h1 = saveCurrentState(false);
						if (!h1)
							return;
						
						function update(html) {
							addComponentsFromHtmlString(html, elm, true);
						};
						
						Editor.ShowAceEditorForm(h1, "HTML Editor", "WARNING: Not following editor API may corrupt the page or the editor!", update, null);
					} catch (err) {
						iLog("EditHTML", err, Log.Type.Error);
					}
				},
				RowCount : function (value) {
					try {
						iLog("RowCount", "Called");
						var ctrl = findClosestParentControl(ContextMenu.EventComponent, ['container', 'panel']);
						if (!ctrl)
							return;

						var count = ctrl.RowCount();

						if (value) {
							ctrl.RowCount(count + value);
							return;
						};

						jPrompt('Enter how many rows this container should have', count, 'Rows', function (count) {
							count = parseInt(count);
							if (!count)
								return;
							ctrl.RowCount(count);
						});
					} catch (err) {
						iLog("RowCount", err, Log.Type.Error);
					}
				},
				ColumnCount : function (value) {
					try {
						iLog("ColumnCount", "Called");

						var ctrl = findClosestParentControl(ContextMenu.EventComponent, ['row']);
						if (!ctrl)
							return;

						var count = ctrl.ColumnCount();

						if (value) {
							ctrl.ColumnCount(count + value);
							return;
						};

						jPrompt('Enter how many columns this row should have', count, 'Columns', function (count) {
							count = parseInt(count);
							if (!count)
								return;
							if (count > 12)
								count = 12;
							ctrl.ColumnCount(count);
						});
					} catch (err) {
						iLog("ColumnCount", err, Log.Type.Error);
					}
				},
				ColumnClass : function () {
					try {
						iLog("ColumnClass", "Called");

						ctrl = findClosestParentControl(ContextMenu.EventComponent, ['row', 'column']);
						var cls = ctrl.ColumnClass();
						jPrompt('Update class of a single column or all columns of a row', cls, 'Class', function (cls) {
							ctrl.ColumnClass(cls);
						});
					} catch (err) {
						iLog("ColumnClass", err, Log.Type.Error);
					}
				},
				Copy : function (doCut) {
					try {
						iLog("Copy", "Called");
						
						copiedHTML = saveCurrentState(doCut);
					} catch (err) {
						iLog("Copy", err, Log.Type.Error);
					}
				},
				Paste : function () {
					try {
						iLog("Paste", "Called");
						
						addComponentsFromHtmlString(copiedHTML);
					} catch (err) {
						iLog("Paste", err, Log.Type.Error);
					}
				},
				Export : function (doCut) {
					try {
						iLog("Export", "Called");
						
						copiedHTML = saveCurrentState(doCut);
						if (!Global.SetClipboard(copiedHTML))
							Editor.ShowAceEditorForm(copiedHTML, 'Export', '', null, null, {language: "html"});
					} catch (err) {
						iLog("Export", err, Log.Type.Error);
					}
				},
				Import : function () {
					try {
						iLog("Import", "Called");
						
						var s = Global.GetClipboard();
						if (s)
							addComponentsFromHtmlString(s)
						else
							Editor.ShowAceEditorForm(s, 'Import', '', addComponentsFromHtmlString, null, {language: "html"});
					} catch (err) {
						iLog("Import", err, Log.Type.Error);
					}
				},
				Undo : function () {
					iLog("Undo", "Called");

					undo.Undo();
				},
				Redo : function () {
					iLog("Redo", "Called");

					undo.Redo();
				},
				ClearUndo : function () {
					iLog("ClearUndo", "Called");
					
					undo.Clear();
				},
				ShowProperties : function(element) {
					try {
						iLog("ShowProperties", "Called");

			            var ctrl = getElementCtrl(element || ContextMenu.EventComponent);
			            if (!ctrl)
			            	return;

			            if (ctrl.ShowEditor) {
			            	ctrl.ShowEditor();
			            	return;
			            }

			            element = ctrl.Control();
			            deleted = [];
			            elements = [];

						function removeEditorClasses(value, newCssCB, delCssCB) {
							var delCss = '';
							$.each(editorClasses, function(i, css) {
								var re = new RegExp('\\S*\\b' + css + '\\b\\S*');
								if (re.test(value)) {
									value = value.replace(re, '');
									delCss += css + ' ';
								}
							});
							value = Utilities.RemoveWhiteSpaces(value);

							newCssCB(value);
							delCssCB(delCss);
						}
						function ensureRealName(name) {
							if (name.beginsWith('we-'))
								return name.substring(3);
							else
								return name;
						}
						function ensureSafeName(name) {
							if ($.inArray(name, notFriendlyAttributes) != -1)
								return 'we-' + name;
							else
								return name;
						}
						function Property(index, property, name, value) {
							var hideVal = '';

							this.elIdx = index;
							if (name) {
								name = ensureRealName(name);
								this.prop = property + "." + name;
								this.first = false;
								if (name == 'class')
									removeEditorClasses(value,
										function(leftCss) {
											value = leftCss;
										},
										function(removedCss) {
											hideVal = removedCss;
										}
									);
							} else {
								this.prop = property;
								this.first = true;
							}
							this.name = name || '';
							this.value = value || '';
							this.hideValue = hideVal;
							this.edName = ensureSafeName(this.name);
						}
						function apply() {
							var arr = propSource.localdata;
							$.each(deleted, function(i, del) {
								// Delete correct property
								var el = $(elements[del.elIdx]);
								el.removeAttr(del.edName);

								// Remove from original array
								arr = $.grep(arr, function(p) {
									return p.elIdx == del.elIdx && p.prop == del.prop;
								}, true);
							});
							
							$.each(arr, function(i, p) {
								if (!p || p.first)
									return;

								if (p.hideValue) {
									p.value += ' ' + p.hideValue;
									p.value = Utilities.RemoveWhiteSpaces(p.value);
								}

								var el = $(elements[p.elIdx]);
								switch (p.name) {
									case 'HTML': el.html(p.value); break;
									case 'TEXT': el.text(p.value); break;
									default: el.attr(p.edName, p.value); break;
								}
							});

							dlg.dialog("close");
						}
						function cancel() {
							dlg.dialog("close");
						}
						function buildDataFields() {
			                return [
			                	{ name: 'elIdx', type: 'integer' },
			                	{ name: 'prop', type: 'string' },
			                	{ name: 'name', type: 'string' },
			                	{ name: 'value', type: 'string' },
			                	{ name: 'first', type: 'boolean' },
			                	{ name: 'edName', type: 'string' },
			                	{ name: 'hideValue', type: 'string' }
			                ];
			            }
						function buildColumns() {
			                return [
			                	{ text: 'Property', datafield: 'prop', width: '150px', editable: false },
			                	{ text: 'Value', datafield: 'value', width: 'auto', editable: true },
								{ text: '', datafield: 'Edit', width: '30px', columntype: 'number', cellsrenderer: function (row) {
									var rd = propGrid.jqxGrid('getrowdata', row),
										icon = rd.first ? '' : 'pencil';
									return '<span style="padding:6px 8px" class="glyphicons glyphicons-' + icon + '"></span>';
								}},
			                	{ text: '', datafield: 'AddDel', width: '30px', columntype: 'number', cellsrenderer: function (row) {
									var rd = propGrid.jqxGrid('getrowdata', row),
										icon = rd.first ? 'plus-sign' : 'remove';
									return '<span style="padding:6px 8px" class="glyphicons glyphicons-' + icon + '"></span>';
								}}
			                ];
			            }
						function buildGrid(element) {
			                var arr = [];

							function addValidChildren(element) {
								var el = element.get(0),
									attrs = el.attributes,
									type = el.nodeName,
									noSubProps = element.hasClass('bs-noSubProps');

			                	// Skip the following elements
			                	if ($.inArray(type, ['OPTION']) != -1)
				                	return;

				                elements.push(el);
				                arr.push(new Property(elements.length - 1, type));

								// Add attributes
								for (var i = 0; i < attrs.length; i++) {
								    var attr = attrs[i],
								    	name = attr.nodeName || '',
								    	val = attr.nodeValue || '';

				                	// Skip the following attributes
				                	if ($.inArray(name, ['ref', 'mp-id', 'unselectable', 'type']) != -1)
				                		continue;

				                	arr.push(new Property(elements.length - 1, type, name, val));
								}
				                
								// Add HTML body property
				                if (noSubProps) {
				                	arr.push(new Property(elements.length - 1, type, 'HTML', element.html()));
				                	return;
				                }
				                var s = $.trim(element.text());
				                if (!element.children().length && s) {
				                	arr.push(new Property(elements.length - 1, type, 'TEXT', s));
				                }

								// Add children elements
				                var ch = element.children();
				                $.each(ch, function(i, element) {
									var el = $(element);
									if (!el.attr('ref'))
				                		addValidChildren(el);
				                });
				            }
			                
			                addValidChildren(element);

			                return arr;
			            }

						// This dialog is being reused and so should be created only once!
						var dlg = $('#PropertiesDlg');
						if (!dlg.length) {
							var btns = {
									'Cancel' : cancel,
									'Apply'  : apply
								};
							
							dlg = $('<div id="PropertiesDlg"></div>');
							dlg.html('<div><div id="jqxProps"/></div>');
							
							dlg.dialog({
								width : 500,
								height : 500,
								autoOpen : false,
								closeOnEscape : false,
								resizable : true,
								modal : false,
								buttons : btns,
								dialogClass : "clientDialog",
								title : "Component Properties",
								open : function() {
									propGrid.jqxGrid({height: dlg.height() - 5});
								},
								beforeclose : function(event) {
									if (event.srcElement) {
										jConfirm('Are you sure to discard all changes?', 'Cancel edit', function(answer) {
											if (answer)
												dlg.dialog('close');
										});
										return false;
									}
								},
								resizeStop: function() {
									propGrid.jqxGrid({height: dlg.height() - 5});
								}
							});
						
				            propSource = {
				                localdata: buildGrid(element),
				                datafields: buildDataFields(),
				                datatype: "array",
				                updaterow: function (rowid, rowdata, commit) {
					                propSource.localdata[rowid] = rowdata;
				                    commit(true);
				                },
				                deleterow: function (rowid, commit) {
					                propSource.localdata.splice(rowid, 1);
				                	commit(true);
				                },
				                addrow: function (rowid, rowdata, position, commit) {
					                propSource.localdata[rowid] = rowdata;
				                	commit(true);
				                }
				            };
				            propData = new jQ.jqx.dataAdapter(propSource);
				            propGrid = jQ("#jqxProps").jqxGrid({
				                width: '100%',
				                height: '100%',
				                source: propData,
				                editable: true,
				                enabletooltips: true,
				                enablehover: true,
								columnsresize: true,
				                editMode: 'click',
				                columns: buildColumns()
				            });
				            
				            // Attach button events
				            propGrid.on("cellclick", function (event) {
				                var row = event.args.rowindex,
				                	df = event.args.datafield;
				                
				                if (df == 'Edit') {
									var rd = propGrid.jqxGrid('getrowdata', row);
									if (rd.first)
										return;

									// Show a bit later for correct z-order!
									setTimeout(function() {
										function update(value) {
											rd.value = value;
											var rowID = propGrid.jqxGrid('getrowid', row);
	                    					propGrid.jqxGrid('updaterow', rowID, rd);
										};
										
										Editor.ShowAceEditorForm(rd.value, 'Editing ' + rd.prop, '', update, null, {language: "text"});
									}, 1);
				                }
				                
				                if (df == 'AddDel') {
									var rd = propGrid.jqxGrid('getrowdata', row);
									if (rd.first) {
										jPrompt('Property name:', '', 'New Property', function (name) {
											if (name) {
												var p = new Property(rd.elIdx, rd.prop, name);
												propGrid.jqxGrid('addrow', null, p, row + 1);
												propGrid.jqxGrid('selectrow', row + 1);
												propGrid.jqxGrid('focus');
											};
										});
									} else {
										propGrid.jqxGrid('deleterow', rd.uid);
										deleted.push(rd);
									}
								}
							});
							
						} else {
							propSource.localdata = buildGrid(element);
						}

						dlg.dialog("option", "title", "Component Properties - " + ctrl.Reference() + " [" + ctrl.ID() + "]");
						dlg.dialog("open");
						propGrid.jqxGrid('updatebounddata');
					} catch (err) {
						iLog("ShowProperties", err, Log.Type.Error);
					}
				}

			};
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	return Bootstrap;
});

/*
 Main HTML editor managing old absolute positioned, new bootstraped and raw HTML editors
*/
define('VrmScript', [], function () {

	var Editor;
	require(['Editor'], function (ed) {
		Editor = ed;
	});
	
	var vrmScr = new function (undefined) {
		try {

			/* PRIVATE PROPERTIES */
			var aceEditor,
				tabEl = $();

			function iLog(Place, Message, Type, Silent) {
				Log.Add("SharedScr." + Place, Message, Type, Silent);
			}
			function getValue() {
				try {
					return aceEditor.Value();
				} catch (err) {
					iLog("getValue", err, Log.Type.Error, true);
				}
			}
			function setValue(data) {
				try {
					aceEditor.Value(data || '', -1);
				} catch (err) {
					iLog("setValue", err, Log.Type.Error, true);
				}
			}

			return {
			
				Initialized : false,

				Clear : function (data) {
					if (!vrmScr.Initialized)
						return;
					iLog("Clear", "Called");
					
					aceEditor.ReadOnly(true);
					setValue(data);
				},
				Load : function (data) {
					try {
						if (!vrmScr.Initialized || !Editor.Enabled)
							return;
						iLog("Load", "Called");

						// Quick save does not pass data!
						if (data == undefined)
							return;

						aceEditor.ReadOnly(false);
						setValue(data || '//type\n\n//const\n\n//var\n\n//function\n\n//procedure');
					} catch (err) {
						iLog("Load", err, Log.Type.Error, true);
					}
				},
				Save : function () {
					try {
						if (!vrmScr.Initialized)
							return '';
						iLog("Save", "Called");
					
						return getValue();
					} catch (err) {
						iLog("Save", err, Log.Type.Error, true);
					}
				},
				Initialize : function () {
					try {
						iLog("Initialize", "Called");

						if (vrmScr.Initialized)
							return;

						tabEl = $('#vrmScrLink');
						aceEditor = new MP.Constructors.AceEditor($('#vrmScrPage'), {
							language: 'server script',
							styles: {
								height: '1000px'
							}
						});

						vrmScr.Initialized = true;
						vrmScr.Clear();
					} catch (err) {
						iLog("Initialize", err, Log.Type.Error);
					}
				},
				HighlightAsFound : function (value) {
					tabEl.toggleClass("ui-search", value);
				},
				Search : function (str, options) {
					try {
						vrmScr.HighlightAsFound(false);
						
						if (!str)
							return;

						var re = Utilities.MakeRegExp(str, options),
							found = vrmScr.Save().search(re) > -1;

						if (found) {
							vrmScr.HighlightAsFound(true);
							iLog("Search", vrmScr, Log.Type.Search);
						};
					} catch (err) {
						iLog("Search", err, Log.Type.Error);
					}
				}
			};
		
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	return vrmScr;
});

/*
 Main HTML editor managing old absolute positioned, new bootstraped and raw HTML editors
*/
define('HtmlEditor', ['Utilities', 'PageHelper', 'Bootstrap'], function (Utilities, PageHelper, Bootstrap) {

	var Editor;
	require(['Editor'], function (ed) {
		Editor = ed;
	});
	
	var HtmlEditor = new function (undefined) {
		try {

			/* PRIVATE PROPERTIES */
			var aceEditor,
				_lastHtml = "",			// the initial HTML loaded into editor
				_mainDiv;

			var	cBootstrap = 'bootstrap',
				cAbsolute = 'absolute',
				cRaw = 'raw';

			function iLog(Place, Message, Type, Silent) {
				Log.Add("HtmlEditor." + Place, Message, Type, Silent);
			}
			function getValue() {
				try {
					return aceEditor.Value();
				} catch (err) {
					iLog("getValue", err, Log.Type.Error, true);
				}
			}
			function setValue(html) {
				try {
					if (html == undefined)
						return;

					aceEditor.Value(html, -1);
				} catch (err) {
					iLog("setValue", err, Log.Type.Error, true);
				}
			}
			function getEditor() {
				switch (HtmlEditor.Type) {
					case cAbsolute : return PageHelper;
					case cBootstrap : return Bootstrap;
				}
			}

			return {
			
				Enabled : false,
				Initialized : false,
				Type : '',

				FindFirstAvailableID : function() {
					var s, cnt,
						id = -1;
					
					do {
						id++;
						s = '[mp-id="' + id + '"]';
						cnt = _mainDiv.find(s).length;
					} while (cnt);
					
					return id;
				},
				Clear : function (html) {
					iLog("Clear", "Called");
					
					setValue(html || _lastHtml);
					if (this.Type == cBootstrap)
						Bootstrap.Clear();
					if (this.Type == cRaw)
						_mainDiv.html(html || _lastHtml);

					this.Disable();
					this.Type = '';
				},
				Show : function (html) {
					try {
						if (!this.Initialized)
							return;
						iLog("Show", "Called");
						
						setValue(html);
						aceEditor.ReadOnly(true);
					} catch (err) {
						iLog("Show", err, Log.Type.Error, true);
					}
				},
				Enable : function () {
					try {
						if (!this.Initialized || !Editor.Enabled || Editor.LockedBy)
							return;
						iLog("Enable", "Called");
					
						if (this.Type == cBootstrap)
							Bootstrap.Enable();
						if (this.Type == cAbsolute)
							PageHelper.Enable();
						
						this.Enabled = true;
					} catch (err) {
						iLog("Enable", err, Log.Type.Error, true);
					}
				},
				Disable : function () {
					try {
						iLog("Disable", "Called");
					
						Bootstrap.Disable();
						PageHelper.Disable();
						aceEditor.ReadOnly(true);

						this.Enabled = false;
					} catch (err) {
						iLog("Disable", err, Log.Type.Error, true);
					}
				},
				Load : function (html) {
					try {
						if (!this.Initialized || !Editor.Enabled)
							return;
						iLog("Load", "Called");

						// Quick save does not pass new HTML!
						if (html != undefined) {
							this.Type = '';

							var firstTag = html.match(/<(.*)>/);
							if (!firstTag || !firstTag.length)
								firstTag = ''
							else
								firstTag = firstTag[0];

							// Figure out which editor to use by first tag only!
							if (!this.Type && /ref="bootstrapContent"/.test(firstTag))
								this.Type = cBootstrap;

							if (!this.Type && /id="rightColumn"/.test(firstTag))
								this.Type = cAbsolute;

							if (!this.Type)
								this.Type = cRaw;
						};

						_lastHtml = html || _lastHtml;

						if (this.Type == cBootstrap) {
							setValue('Note that this is just a preview of original HTML. To edit use WYSIWYG editor above.\n\n' + _lastHtml);
							_mainDiv = Bootstrap.Container();
							PageHelper.Clear();
							Bootstrap.Load(html);
							aceEditor.ReadOnly(true);
						};
						if (this.Type == cAbsolute) {
							setValue('Note that this is just a preview of original HTML. To edit use WYSIWYG editor above.\n\n' + _lastHtml);
							_mainDiv = PageHelper.Container();
							PageHelper.Load(html);
							aceEditor.ReadOnly(true);
						};
						if (this.Type == cRaw) {
							_mainDiv = $("#middle");
							_mainDiv.html('<h1>This page can only be edited in HTML Page tab below</h1>');
							setValue(html);
							aceEditor.ReadOnly(false);
						};

						this.Enable();
					} catch (err) {
						iLog("Load", err, Log.Type.Error, true);
					}
				},
				Save : function () {
					try {
						if (!this.Initialized)
							return;
						iLog("Save", "Called");
					
						var html;
						if (this.Type == cBootstrap)
							html = Bootstrap.Save();
						
						if (this.Type == cAbsolute)
							html = PageHelper.Save();

						if (this.Type == cRaw)
							html = getValue();
						
						return html;
					} catch (err) {
						iLog("Save", err, Log.Type.Error, true);
					}
				},
				EditHTML : function () {
					try {
						if (!this.Initialized || !Editor.Enabled)
							return;
						iLog("EditHTML", "Called");

						var o = getEditor();
						if (o)
							o.EditHTML();
					} catch (err) {
						iLog("EditHTML", err, Log.Type.Error, true);
					}
				},
				Initialize : function () {
					try {
						iLog("Initialize", "Called");

						PageHelper.Initialize();
						Bootstrap.Initialize();

						if (this.Initialized)
							return;

						aceEditor = new MP.Constructors.AceEditor($('#rawHtmlPage'), {
							language: 'html',
							styles: {
								height: '1000px'
							}
						});

						this.Initialized = true;
					} catch (err) {
						iLog("Initialize", err, Log.Type.Error);
					}
				},
				Search : function (str, options) {
					if (this.Type == cBootstrap)
						Bootstrap.Search(str, options);
					if (this.Type == cAbsolute)
						PageHelper.Search(str, options);
				},
				ClearUndo : function () {
					iLog("ClearUndo", "Called");
					
					PageHelper.ClearUndo();
					Bootstrap.ClearUndo();
				}
			};
		
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	};
	
	return HtmlEditor;
});

/*
 BEGIN of Bootstrap Control Objects
*/
define('bs/templateBase', ['Editor', 'HtmlEditor', 'Bootstrap'], function (Editor, HtmlEditor, Bootstrap) {
	
	function TemplateBase(undefined) {
		/* PUBLIC PROPERTIES */
		
		/* PRIVATE PROPERTIES */
		var logClassName = "TmpBase.",
			self = this,
			_control,
			_input,
			_reference;
		
		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			self.Log(logClassName + Place, Message, Type, Silent);
		}
		function getValidChildren(element) {
		    var elements = [];

			function addValidChildren(element) {
		        elements.push(element);

		        var ch = element.children();
		        $.each(ch, function(i, element) {
					var el = $(element);
					if (!el.attr('ref'))
		        		addValidChildren(el);
		        });
		    }
		    
		    addValidChildren(element);

		    return elements;
		}
		
		/* PUBLIC METHODS */

		this.Log = function(Place, Message, Type, Silent) {
			var s = Place;
			if (_control) {
				var id = _control.attr("mp-id");
				s += _control.attr("id") || _control.attr("name");
				s = (!id) ? s : s + "." + id;
			}
			Log.Add(s, Message, Type, Silent);
		};
		this.BaseLoad = function (element, input) {
			try {
				_control = $(element);
				_input = $(input);
				_reference = _control.attr('ref');

				// Ensure valid unique ID!
				var id = self.ID();
				if (id) {
					var el = Bootstrap.Container().find('[mp-id=' + id + ']');
					if (el.length > 1)
						id = null;
				}
				if (!id) {
					id = HtmlEditor.FindFirstAvailableID();
					self.ID(id);
				}
				
				iLog("BaseLoad", "Called");
			} catch (err) {
				iLog("BaseLoad", err, Log.Type.Error);
			}
		};
		this.ID = function(value) {
			if (value == undefined)
				return _control.attr('mp-id');
			else
				_control.attr('mp-id', value);
		};
		this.Control = function (value) {
			if (value == undefined)
				return _control;
			else
				_control = value;
		};
		this.Reference = function () {
			return _reference;
		};
		this.Input = function (value) {
			if (value == undefined)
				return _input;
			else
				_input = value;
		};
		this.Comment = function (value) {
			try {
				if (value == undefined) {
					return _control.attr("mp-comment") || "";
				} else {
					_control.attr("mp-comment", value);
					self.UpdateComment();
				}
			} catch (err) {
				iLog("Comment", err, Log.Type.Error);
			}
		};
		this.SvrCondition = function (value) {
			try {
				if (value == undefined)
					return _control.attr("condition") || "";
				else
					_control.attr("condition", value);
			} catch (err) {
				iLog("SvrCondition", err, Log.Type.Error);
			}
		};
		this.HighlightAsError = function (value) {
			try {
				var elm = _control;

				// Find all related radios
				if (_reference == 'radio')
					elm = $("div[Ref='radio']").find("input[name='" + elm.attr("name") + "']");
				
				// Safari does not render shadow around some inputs!
				if (Browser.IsSafari() && $.inArray(_reference, ['radio', 'checkbox', 'select']) > -1)
					elm = elm.parent();
				
				elm.toggleClass("ui-validation", value);
			} catch (err) {
				iLog("HighlightAsError", err, Log.Type.Error);
			}
		};
		this.HighlightAsFound = function (value) {
			_control.toggleClass("ui-search", value);
		};
		this.BaseSearch = function (str, options) {
			try {
				this.HighlightAsFound(false);
				
				if (!str)
					return;

				var elements = getValidChildren(_control),
					re = Utilities.MakeRegExp(str, options),
					found = false,
					el, attrs, attr, val;

				for (var e = 0; e < elements.length; e++) {
					el = elements[e];
					attrs = el.get(0).attributes;
					val = el.text();

					if (val && !el.children().length) {
						found = val.search(re) > -1;
						if (found)
							break;
					}

					for (var a = 0; a < attrs.length; a++) {
						attr = attrs[a];
						val = attr.nodeValue || '';
						found = val.search(re) > -1;
						if (found)
							break;
					}
					if (found)
						break;
				}
				
				if (found) {
					this.HighlightAsFound(true);
					iLog("Search", this, Log.Type.Search);
					return;
				} else {
					// Continue search in inherited objects!
					return re;
				}
			} catch (err) {
				iLog("BaseSearch", err, Log.Type.Error);
			}
		};
		this.DisableHighlighting = function () {
			Global.DisableHighlightingInChrome(true);
		};
		this.EnableHighlighting = function () {
			Global.DisableHighlightingInChrome(false);
		};
		this.UpdateComment = function (remove) {
			try {
				var s = $.trim(self.GetComment());
				var jQctrl = jQ(_control[0]);
				if (!remove && s) {
					s = s.replace(/[\n\r]/g, '<br/>');
					jQctrl.jqxTooltip({ content: s, showDelay: 1000, autoHideDelay: 50000, theme: 'editor' });
				} else {
					jQctrl.jqxTooltip('destroy');
					if (_control.attr('id').beginsWith('jqxWidget'))
						_control.removeAttr('id');
				}
			} catch (err) {
				iLog("UpdateComment", err, Log.Type.Error);
			}
		};
	}
	
	return TemplateBase;
});

define('bs/comp/bootstrapContent', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function BootstrapContent(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "bootstrapContent";
			this.Accept = ['container', 'js'];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				featuresAdded = false;

			/* PRIVATE METHODS */
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}

			/* PUBLIC METHODS */
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);

					this.BaseLoad(control);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					control
						.droppable("destroy")
						.sortable("destroy")
						.removeClass('bs-columnBox droppable-active droppable-hover')
						.enableSelection();
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					control.droppable({
						accept : Editor.GetAcceptedComponents(self.Accept),
						greedy : true,
						activeClass : 'droppable-active',
						hoverClass : 'droppable-hover',
						drop : function (ev, ui) {
							var ref = $(ui.draggable).attr("ref");
							Bootstrap.BuildComponent(ref, this);
						}
					});
					control.sortable({
						items  : ">div"
						//handle : ">.handle"
					});
					control
						.addClass('bs-columnBox')
						.disableSelection();

					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
			};
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return BootstrapContent;
});

define('bs/comp/container', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Container(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "container";
			this.Accept = ["row"];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");
					
					control = $('<div class="container"/>');
					control.attr('ref', self.refClassName);
					
					this.BaseLoad(control);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					
					this.BaseLoad(control);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					control
						.droppable("destroy")
						.sortable("destroy")
						.removeClass('bs-containerBox droppable-active droppable-hover')
						.enableSelection();
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					control.droppable({
						accept : Editor.GetAcceptedComponents(self.Accept),
						greedy : true,
						activeClass : 'droppable-active',
						hoverClass : 'droppable-hover',
						drop : function (ev, ui) {
							var ref = $(ui.draggable).attr("ref");
							Bootstrap.BuildComponent(ref, this);
						}
					});
					control.sortable();
					control.disableSelection();
					control.addClass('bs-containerBox');
					
					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.RowCount = function (count) {
				try {
					iLog("RowCount", "Called", Log.Type.Info);

					var rows = control.find(">[ref=row]");
					if (count == undefined)
						return rows.length;

					// Add more rows
					if (count > rows.length)
						for (var i = rows.length; i < count; i++)
							Bootstrap.BuildComponent('row', control);
					
					// Remove extra rows
					if (count < rows.length)
						for (var i = rows.length; i > count; i--)
							Bootstrap.DeleteSelection(rows[i - 1]);
				} catch (err) {
					iLog("RowCount", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Container;
});

define('bs/comp/row', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Row(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "row";
			this.Accept = ["column"];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");
					
					control = $('<div class="row form_element"/>');
					control.attr('ref', self.refClassName);
					
					this.BaseLoad(control);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					
					this.BaseLoad(control);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					control
						.droppable("destroy")
						.sortable("destroy")
						.removeClass('bs-rowBox droppable-active droppable-hover')
						.enableSelection()
						.unbind('mouseenter')
						.unbind('mouseleave');
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					control.droppable({
						accept : Editor.GetAcceptedComponents(self.Accept),
						greedy : true,
						activeClass : 'droppable-active',
						hoverClass : 'droppable-hover',
						drop : function (ev, ui) {
							var ref = $(ui.draggable).attr("ref");
							Bootstrap.BuildComponent(ref, this);
						}
					});
					control
						.sortable()
						.disableSelection()
						.addClass('bs-rowBox');

					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.ColumnCount = function (count) {
				try {
					iLog("ColumnCount", "Called", Log.Type.Info);

					var columns = control.find(">[ref=column]");
					if (count == undefined)
						return columns.length;

					// Add more columns
					if (count > columns.length) {
						var size = Math.floor(12 / count);
						for (var i = columns.length; i < count; i++)
							Bootstrap.BuildComponent('column', control, size);
					}
					
					// Remove extra columns
					if (count < columns.length)
						for (var i = columns.length; i > count; i--)
							Bootstrap.DeleteSelection(columns[i - 1]);
				} catch (err) {
					iLog("ColumnCount", err, Log.Type.Error);
				}
			};
			this.ColumnClass = function (value) {
				try {
					iLog("ColumnClass", "Called", Log.Type.Info);

					var columns = control.find(">[ref=column]");
					if (value == undefined) {
						var c = columns.attr('class'),
							matches = c.match(/\S*col-\S*/g);
						return matches ? matches.join(' ') : 'col-md-4';
					};
					
					// Update column classes
					columns.removeClass(function(i, c) {
						var matches = c.match(/\S*col-\S*/g);
						return matches ? matches.join(' ') : false;
					});
					columns.addClass(value);
				} catch (err) {
					iLog("ColumnClass", err, Log.Type.Error);
				}
			};

		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Row;
});

define('bs/comp/column', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Column(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "column";
			this.Accept = ["row", "input", "checkbox", "radio", "textarea", "select", "button", "label", "div", "panel", "widget"];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name, size) {
				try {
					iLog("Create", "Called");

					size = size || 4;
					
					control = $('<div class="col-xs-12 col-sm-' + size + ' col-md-' + size + ' padded-col"/>');
					control.attr('ref', self.refClassName);
					
					this.BaseLoad(control);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					
					this.BaseLoad(control);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					control
						.droppable("destroy")
						.sortable("destroy")
						.removeClass('bs-columnBox droppable-active droppable-hover')
						.enableSelection();
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					control.droppable({
						accept : Editor.GetAcceptedComponents(self.Accept),
						greedy : true,
						activeClass : 'droppable-active',
						hoverClass : 'droppable-hover',
						drop : function (ev, ui) {
							var ref = $(ui.draggable).attr("ref");
							Bootstrap.BuildComponent(ref, this);
						}
					});
					control.sortable();
					control.disableSelection();
					control.addClass('bs-columnBox');
					
					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.ColumnClass = function (value) {
				try {
					iLog("ColumnClass", "Called", Log.Type.Info);

					if (value == undefined) {
						var c = control.attr('class'),
							matches = c.match(/\S*col-\S*/g);
						return matches ? matches.join(' ') : 'col-md-4';
					};
					
					// Update column classes
					control.removeClass(function(i, c) {
						var matches = c.match(/\S*col-\S*/g);
						return matches ? matches.join(' ') : false;
					});
					control.addClass(value);
				} catch (err) {
					iLog("ColumnClass", err, Log.Type.Error);
				}
			};

		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Column;
});

define('bs/comp/input', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Input(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "input";
			this.Accept = [];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				input,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");

					control = $('<input class="form-control hasPopover">');
					control.attr('we-type', 'text');
					control.attr('ref', self.refClassName);
					control.attr('name', name);
					control.attr('value', '');
					control.attr('maxlength', '30');
					control.attr('placeholder', name);
					control.attr('data-content', name);
					control.attr('validator', 'required()');

					input = control;

					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					input = control;

					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function (forceNewNames) {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					if (forceNewNames) {
						var name = input.attr('name');
						name = Bootstrap.MakeUniquePageName(name);
						input.attr('name', name);
					};

					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Input;
});

define('bs/comp/textarea', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Textarea(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "textarea";
			this.Accept = [];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				input,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");
					
					control = $('<textarea class="form-control hasPopover" rows="3"></textarea>');
					control.attr('ref', self.refClassName);
					control.attr('name', name);
					control.attr('placeholder', name);
					control.attr('data-content', name);
					control.attr('validator', 'required()');

					input = control;

					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					input = control;

					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function (forceNewNames) {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					if (forceNewNames) {
						var name = input.attr('name');
						name = Bootstrap.MakeUniquePageName(name);
						input.attr('name', name);
					};

					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Textarea;
});

define('bs/comp/checkbox', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Checkbox(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "checkbox";
			this.Accept = [];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				input,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");
					
					control = $('<div class="checkbox"><label><input type="checkbox" value="1"><span>' + name + '</span></label></div>');
					control.attr('ref', self.refClassName);

					input = control.find('input');
					input.attr('name', name);

					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					input = control.find('input');

					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function (forceNewNames) {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					if (forceNewNames) {
						var name = input.attr('name');
						name = Bootstrap.MakeUniquePageName(name);
						input.attr('name', name);
					};

					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Checkbox;
});

define('bs/comp/radio', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Radio(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "radio";
			this.Accept = [];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				input,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");
					
					control = $('<div class="radio"><label><input type="radio" value="1"><span>' + name + '</span></label></div>');
					control.attr('ref', self.refClassName);
					
					input = control.find('input');
					input.attr('name', name);
					input.attr('id', name);

					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					input = control.find('input');
					
					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function (forceNewNames) {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					if (forceNewNames) {
						var id = input.attr('id');
						id = Bootstrap.MakeUniquePageID(id);
						input.attr('id', id);
					};

					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Radio;
});

define('bs/comp/select', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Select(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "select";
			this.Accept = [];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				input,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");
					
					control = $('<select class="form-control hasPopover"><option value="-1">' + name + '</option></select>');
					control.attr('ref', self.refClassName);
					control.attr('name', name);
					control.attr('data-content', name);
					control.attr('validator', 'select()');

					input = control;

					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					input = control;

					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function (forceNewNames) {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					if (forceNewNames) {
						var name = input.attr('name');
						name = Bootstrap.MakeUniquePageName(name);
						input.attr('name', name);
					};

					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Select;
});

define('bs/comp/button', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Button(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "button";
			this.Accept = [];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");
					
					control = $('<button type="button" class="btn default_btn"/>');
					control.attr('ref', self.refClassName);
					control.attr('name', name);
					control.attr('default', 'false');
					control.attr('validate', 'true');
					control.attr('we-onclick', 'MP.Comm.Post(this)');
					control.html(name);

					this.BaseLoad(control);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					
					this.BaseLoad(control);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function (forceNewNames) {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Button;
});

define('bs/comp/div', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Div(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "div";
			this.Accept = ["input", "checkbox", "radio", "textarea", "select", "button", "label", "div"];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");
					
					control = $('<div class="form-group bs-noSubProps"/>');
					control.attr('ref', self.refClassName);

					this.BaseLoad(control);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					
					this.BaseLoad(control);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					control
						.droppable("destroy")
						.removeClass('bs-rowBox bs-noSubProps droppable-active droppable-hover');
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function (forceNewNames) {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					control.droppable({
						accept : Editor.GetAcceptedComponents(self.Accept),
						greedy : true,
						activeClass : 'droppable-active',
						hoverClass : 'droppable-hover',
						drop : function (ev, ui) {
							var ref = $(ui.draggable).attr("ref");
							Bootstrap.BuildComponent(ref, this);
						}
					});
					control.addClass('bs-rowBox bs-noSubProps');

					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Div;
});

define('bs/comp/panel', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Panel(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "panel";
			this.Accept = ["row"];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				input,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");
					
					control = $('<div class="panel panel-primary"><div class="panel-heading">Panel</div><div class="panel-body"></div></div>');
					control.attr('ref', self.refClassName);
					input = control.find('.panel-body');

					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					input = control.find('.panel-body');

					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					input
						.droppable("destroy")
						.sortable("destroy")
						.removeClass('droppable-active droppable-hover')
						.enableSelection();
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function (forceNewNames) {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					input.droppable({
						accept : Editor.GetAcceptedComponents(self.Accept),
						greedy : true,
						activeClass : 'droppable-active',
						hoverClass : 'droppable-hover',
						drop : function (ev, ui) {
							var ref = $(ui.draggable).attr("ref");
							Bootstrap.BuildComponent(ref, this);
						}
					});
					input.sortable();
					input.disableSelection();

					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.RowCount = function (count) {
				try {
					iLog("RowCount", "Called", Log.Type.Info);

					var rows = input.find(">[ref=row]");
					if (count == undefined)
						return rows.length;

					// Add more rows
					if (count > rows.length)
						for (var i = rows.length; i < count; i++)
							Bootstrap.BuildComponent('row', input);
					
					// Remove extra rows
					if (count < rows.length)
						for (var i = rows.length; i > count; i--)
							Bootstrap.DeleteSelection(rows[i - 1]);
				} catch (err) {
					iLog("RowCount", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Panel;
});

define('bs/comp/widget', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Widget(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "widget";
			this.Accept = [""];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");
					
					control = $('<div class="form-group bs-noSubProps">Paste widget HTML here</div>');
					control.attr('ref', self.refClassName);
					control.attr('init', '');

					this.BaseLoad(control);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					
					this.BaseLoad(control);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					control
						.droppable("destroy")
						.removeClass('bs-rowBox bs-noSubProps droppable-active droppable-hover');
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function (forceNewNames) {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					control.droppable({
						accept : Editor.GetAcceptedComponents(self.Accept),
						greedy : true,
						activeClass : 'droppable-active',
						hoverClass : 'droppable-hover',
						drop : function (ev, ui) {
							var ref = $(ui.draggable).attr("ref");
							Bootstrap.BuildComponent(ref, this);
						}
					});
					control.addClass('bs-rowBox bs-noSubProps');

					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Widget;
});

define('bs/comp/label', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Label(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "label";
			this.Accept = ["input", "textarea", "select"];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			
			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");
					
					control = $('<label class="control-label bs-noSubProps"/>');
					control.attr('ref', self.refClassName);
					control.attr('for', '');
					control.html(name);

					this.BaseLoad(control);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);

					this.BaseLoad(control);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					control.removeClass('bs-noSubProps');
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function (forceNewNames) {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");

					control.addClass('bs-noSubProps');
					
					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Label;
});

define('bs/comp/js', ['bs/templateBase', 'Bootstrap', 'Editor'], function (TemplateBase, Bootstrap, Editor) {
	function Js(undefined) {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.refClassName = "js";
			this.Accept = [];

			/* PRIVATE PROPERTIES */
			var self = this,
				control,
				input,
				featuresAdded = false;
			
			/* PRIVATE METHODS */
			function Script(name, params, body) {
				this.Name = $.trim(name);
				this.Params = params;
				this.Body = body;
			}
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			function getFunctions(str) {
				try {
					iLog("getFunctions", "Called");
					
					str = "\n" + str.substring(str.indexOf("function "), str.length);
					var arr = [];
					
					var fns = str.split(/[\n\r]function /);
					if (!fns)
						return arr;
					
					for (var i = 0; i < fns.length; i++) {
						var fn = fns[i];
							
						var _name = fn.substring(0, fn.indexOf("{"));
						var params = _name.match(/\([^\)]+\)/g);
						if (params == null || params.length == 0)
							params = "";
						else
							params = params[0];
						params = params.replace("(", "").replace(")", "");
						if (_name.indexOf("(") > -1)
							_name = _name.substring(0, _name.indexOf("("));
						if (!_name)
							continue;
						var body = fn.substring(fn.indexOf("{") + 1);
						body = body.substring(0, body.lastIndexOf("}"));
						var funct = new Script(_name, params, body);
						arr.push(funct);
					}
					return arr;
				} catch (err) {
					iLog("getFunctions", err, Log.Type.Error);
				}
			}
			function attachScript(strScript) {
				try {
					iLog("attachScript", "Called");
					
					var s = $.trim(strScript);
					if (s.beginsWith('('))
						return parseNewCustomScripts(s, true);
					else
						return parseOldCustomScripts(s, true);
				} catch (err) {
					iLog("attachScript", err, Log.Type.Error, true);
					return err.message;
				}
			}
			function resetScripts() {
				window.CustomScript = null;
				window.CustomScript = {};
			}
			function parseNewCustomScripts(script, clearScripts) {
				try {
					eval(script);
				} catch (err) {
					iLog("parseNewCustomScripts", err.message, Log.Type.Error, true);
					return err.message;
				}
			}
			function parseOldCustomScripts(script, clearScripts) {
				var fns = getFunctions(script);
				if (!fns.length)
					return;

				if (clearScripts)
					resetScripts();
				
				var e = '',
					fn = null;
				for (var i = 0; i < fns.length; i++) {
					try {
						fn = fns[i];
						window.CustomScript[fn.Name] = new Function(fn.Params, fn.Body);
					} catch (err) {
						if (fn)
							e = e + fn.Name + " : " + err.message + ", ";
						else
							e = e + err.message + ", ";
					}
				};
				if (e) {
					iLog("parseOldCustomScripts", e, Log.Type.Error, true);
					return e;
				};
			}

			/* PUBLIC METHODS */
			this.Create = function (name) {
				try {
					iLog("Create", "Called");
					
					var s =
						'(function() {\n' +
						'  var cs = {}; // Private custom script\n' +
						'  cs.OnLoad = function() {\n' +
						'  	scroll(0,0);\n' +
						'  };\n\n' +
						'  // Publish it\n' +
						'  CustomScript = cs; // Overwrite (default)\n' +
						'  //$.extend(CustomScript, cs); // Append\n' +
						'  //CustomAnything = cs; // Create new\n' +
						'})();\n\n' +
						'//function OnLoad(){scroll(0,0);} // Or delete everything above and use plain functions\n';
					control = $("<div><pre>" + s + "</pre></div>");
					control.attr('ref', self.refClassName);

					input = control.find('pre');

					this.BaseLoad(control);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					input = control.find('pre');
					
					this.BaseLoad(control);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					if (!featuresAdded)
						return;
					iLog("DefaultMode", "Called");
					
					control
						.removeClass('bs-rowBox');
					
					featuresAdded = false;
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function (forceNewNames) {
				try {
					if (featuresAdded)
						return;
					iLog("EditMode", "Called");
					
					control
						.addClass('bs-rowBox')
						.addClass('js-component');

					featuresAdded = true;
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					this.BaseSearch(str, options);
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.ShowEditor = function () {
				var code = input.text(),
					msg = "Errors due to #S variables may be OK within the editor.";
				Editor.ShowAceEditorForm(code, "Javascript Editor", msg, update, null, {language:"javascript"});
				function update(code) {
					input.text(code);

					// Validate the new code
					var err = attachScript(code);
					if (err)
						jAlert("There are errors:\n\n" + err + "\n\n" + msg);
					resetScripts();
				};
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return Js;
});



/*
 BEGIN of HTML Control Objects
*/
define('page/TemplateBase', ['PropertyFields', 'Utilities', 'PageHelper', 'Editor'], function (PropertyFields, Utilities, PageHelper, Editor) {
	
	function TemplateBase(undefined) {
		/* PUBLIC PROPERTIES */
		
		/* PRIVATE PROPERTIES */
		var logClassName = "TmpBase.",
			self = this,
			_control = null,
			_input = null,
			resizeCB,
			CurrentPositionX,
			CurrentPositionY;
		
		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			var id = (!_control) ? "" : _control.attr("mp-id");
			var s = logClassName + Place;
			s += (!_input) ? "" : "." + _input.attr("id") || _input.attr("name");
			s = (!id) ? s : s + "." + id;
			Log.Add(s, Message, Type, Silent);
		}
		// attaches the valueless attributes to the input
		function attachValuelessAttrs() {
			try {
				iLog("attachValuelessAttrs", "Called");
				
				if (!_input)
					return;
				var str = _input.attr("valuelessAttrs");
				if (!str)
					return;
				var arr = str.match(/[a-zA-Z0-9#_]+/g);
				if (arr == null)
					return;
				for (var i = 0; i < arr.length; i++) {
					try {
						if (arr[i].indexOf("#") > -1)
							_input.attr(arr[i], "");
						else
							_input.attr(arr[i], " ");
					} catch (err) {
						// Bad attribute; ignore
					}
				}
			} catch (err) {
				iLog("attachValuelessAttrs", err, Log.Type.Error);
			}
		}
		// detaches the valueless attributes from the input
		function detachValuelessAttrs() {
			try {
				iLog("detachValuelessAttrs", "Called");

				if (!_input)
					return;
				var str = _input.attr("valuelessAttrs");
				if (!str)
					return;
				var arr = str.match(/[a-zA-Z0-9#_]+/g);
				if (arr == null)
					return;
				for (var i = 0; i < arr.length; i++) {
					try {
						_input.removeAttr(arr[i]);
					} catch (err) {
						// Bad attribute; ignore
					}
				}
			} catch (err) {
				iLog("detachValuelessAttrs", err, Log.Type.Error);
			}
		}
		function UserFunction(name, body) {
			this.Name = name;
			this.Body = body;
		}
		
		/* PUBLIC METHODS */

		this.Log = function (Place, Message, Type, Silent) {
			var id = (!_control) ? "" : _control.attr("mp-id");
			var s = Place;
			s += (!_input) ? "" : "." + _input.attr("id") || _input.attr("name");
			s = (!id) ? s : s + "." + id;
			Log.Add(s, Message, Type, Silent);
		};
		this.BaseLoad = function (ControlElement, InputElement, ResizeCB) {
			try {
				iLog("BaseLoad", "Called");
				
				_control = $(ControlElement);
				resizeCB = ResizeCB || $.noop;
				if (InputElement) {
					_input = $(InputElement);
					_input.unbind("change.clearerror").bind("change.clearerror", function () {
						try {
							var ctrl = PageHelper.GetEditorComponent($(this).parent());
							ctrl.HighlightAsError(false);
						} catch (err) {};
					});
				};
				attachValuelessAttrs();
			} catch (err) {
				iLog("BaseLoad", err, Log.Type.Error);
			}
		};
		this.BaseLoad2 = function (ControlElement) {
			try {
				iLog("BaseLoad2", "Called");
				
				_control = $(ControlElement);
			} catch (err) {
				iLog("BaseLoad2", err, Log.Type.Error);
			}
		};
		this.AttachFunctions = function () {
			try {
				if (Editor.Enabled) {
					self.UpdateComment(true);
					return;
				}
				if (!_control.attr("function"))
					return;
				iLog("AttachFunctions", "Called");
				
				var functions = _control.attr("function").split("|");
				var definitions = _control.attr("definition").split("|");
				var f, d, name;
				for (var i = 0; i < functions.length; i++) {
					f = Utilities.Trim(functions[i]);
					d = Utilities.Trim(definitions[i]);
					if (!d.beginsWith("#S") && f != "" && d != "") {
						name = f.toLowerCase() + ".templatebase";
						try {
							var fn = new Function(d);
							_input.unbind(name).bind(name, fn);
						} catch (err) {
							// We don't want to loose the err object!
							iLog("BindScriptFunction", err + " on " + f + " in " + d, Log.Type.Error, true);
							throw err;
						}
					}
				}

			} catch (err) {
				iLog("AttachFunctions", err, Log.Type.Error);
			}
		};
		this.DetachFunctions = function () {
			try {
				iLog("DetachFunctions", "Called");
				
				// hack: this should be called in its own
				detachValuelessAttrs();
				if (_control.attr("function")) {
					var functions = _control.attr("function").split("|");
					for (var i = 0; i < functions.length; i++) {
						var name = functions[i].toLowerCase() + ".templatebase";
						_input.unbind(name);
					}
				}

				// Since this is editor entry point update UI here
				self.UpdateComment();
			} catch (err) {
				iLog("DetachFunctions", err, Log.Type.Error);
			}
		};
		this.AddFunction = function () {
			try {
				iLog("AddFunction", "Called");
				
				if ((_control.attr("function") == null) || (_control.attr("function").length == 0)) {
					_control.attr("function", "");
					_control.attr("definition", "");
				} else {
					_control.attr("function", _control.attr("function") + "|");
					_control.attr("definition", _control.attr("definition") + "|");
				}
			} catch (err) {
				iLog("AddFunction", err, Log.Type.Error);
			}
		};
		this.DeleteFunction = function (FunctionIndex) {
			try {
				iLog("DeleteFunction", "Called");
				
				if (!_control.attr("function"))
					return;
				var functions;
				if (!_control.attr("function").match(/|/)) {
					functions = _control.attr("function").split("|");
				} else {
					functions = [$.trim(_control.attr("function"))];
				}
				var definitions = _control.attr("definition").split("|");
				functions.splice(FunctionIndex, 1);
				definitions.splice(FunctionIndex, 1);
				_control.attr("function", functions.toPipeString());
				_control.attr("definition", definitions.toPipeString());
				if (_control.attr("function").length == 0) {
					_control.removeAttr("function");
					_control.removeAttr("definition");
				}
			} catch (err) {
				iLog("DeleteFunction", err, Log.Type.Error);
			}
		};
		this.GetBaseProperties = function () {
			try {
				iLog("GetBaseProperties", "Called");
				
				var ref = _control.attr("ref"),
					par = PageHelper.GetParentRef(_control),
					p = [];

				p.push(new PropertyEd.Property(PropertyFields["Comment"], this.GetComment, this.SetComment));
				
				if (par == "StaticContainer") {
					p.push(new PropertyEd.Property(PropertyFields["Left"], this.GetLeft, this.SetLeft));
					p.push(new PropertyEd.Property(PropertyFields["Top"], this.GetTop, this.SetTop));
				}
				
				p.push(new PropertyEd.Property(PropertyFields["SvrCondition"], this.GetSvrCondition, this.SetSvrCondition));
				if ($.inArray(ref, ['ScriptingContainer', 'ValidationContainer']) == -1)
					p.push(new PropertyEd.Property(PropertyFields["CliCondition"], this.GetCliCondition, this.SetCliCondition));
				
				if (_input) {
					if (ref != 'EditorLabel')
						p.push(new PropertyEd.Property(PropertyFields["TabIndex"], this.GetTabIndex, this.SetTabIndex));
					else
						_input.attr("tabindex", "-1");
					p.push(new PropertyEd.Property(PropertyFields["Tooltip"], this.GetTooltip, this.SetTooltip));
					p.push(new PropertyEd.Property(PropertyFields["HelpLink"], this.GetHelpLink, this.SetHelpLink));
					p.push(new PropertyEd.Property(PropertyFields["ValueLessAttrs"], this.GetValueLessAttrs, this.SetValueLessAttrs));
				}
				
				if (ref != 'ScriptingContainer') {
					var ca = new RulesMaker.ComplexArgs(this.GetBaseProperties, this.AddFunction, this.DeleteFunction);
					p.push(new PropertyEd.Property(PropertyFields["ScriptFunctions"], this.GetFunctions, this.SetFunctions, ca));
				}

				if (_input) {
					p.push(new PropertyEd.Property(PropertyFields["Style"], this.GetStyle, this.SetStyle));
					if ($.inArray(ref, ['EditorLabel', 'EditorLink']) != -1)
						p.push(new PropertyEd.Property(PropertyFields["ClassSelect"], this.GetClass, this.SetClass));
					else
						p.push(new PropertyEd.Property(PropertyFields["ClassText"], this.GetClass, this.SetClass));
				}

				return p;
			} catch (err) {
				iLog("GetBaseProperties", err, Log.Type.Error);
			}
		};
		this.GetFunctions = function () {
			try {
				iLog("GetFunctions", "Called");
				
				var functions = _control.attr("function");
				var definitions = _control.attr("definition");
				if ((functions == null) || (definitions == null))
					return [];
				var ret = [];
				if (functions.indexOf("|") > -1) { // multiple functions
					functions = _control.attr("function").split("|");
					definitions = _control.attr("definition").split("|");
					for (var i = 0; i < functions.length; i++) {
						var f = new UserFunction(functions[i], definitions[i]);
						ret[ret.length] = f;
					}
				} else { // only one function
					ret[0] = new UserFunction(functions, definitions);
				}
				return ret;
			} catch (err) {
				iLog("GetFunctions", err, Log.Type.Error);
			}
		};
		this.SetFunctions = function (arr) {
			try {
				iLog("SetFunctions", "Called");
				
				var functions = "";
				var definitions = "";
				var hasfunctions = true;
				if (arr.length == 0)
					hasfunctions = false;
				if (arr.length == 1) {
					var f = Utilities.ReplaceAll(arr[0].Name, " ", "");
					if (f == "")
						hasfunctions = false;
				}
				if (!hasfunctions) {
					_control.removeAttr("function");
					_control.removeAttr("definition");
					return;
				}
				for (var i = 0; i < arr.length; i++) {
					var f = Utilities.ReplaceAll(arr[i].Name, " ", "");
					if (f.length > 0) {
						functions += arr[i].Name + "|";
						definitions += arr[i].Body + "|";
					}
				}
				if (arr.length > 0) {
					functions = functions.removeLastChar();
					definitions = definitions.removeLastChar();
				}
				_control.attr("function", functions);
				_control.attr("definition", definitions);
			} catch (err) {
				iLog("SetFunctions", err, Log.Type.Error);
			}
		};
		this.GetComment = function () {
			try {
				var str = _control.attr("mp-comment");
				return str || "";
			} catch (err) {
				iLog("GetComment", err, Log.Type.Error);
			}
		};
		this.SetComment = function (text) {
			try {
				_control.attr("mp-comment", text);
				self.UpdateComment();
			} catch (err) {
				iLog("SetComment", err, Log.Type.Error);
			}
		};
		this.GetSvrCondition = function () {
			try {
				var str = _control.attr("condition");
				return str || "";
			} catch (err) {
				iLog("GetSvrCondition", err, Log.Type.Error);
			}
		};
		this.SetSvrCondition = function (Condition) {
			try {
				_control.attr("condition", Condition);
			} catch (err) {
				iLog("SetSvrCondition", err, Log.Type.Error);
			}
		};
		this.GetCliCondition = function () {
			try {
				var s = _control.attr("cli-cond");
				return s || "";
			} catch (err) {
				iLog("GetCliCondition", err, Log.Type.Error);
			}
		};
		this.SetCliCondition = function (value) {
			try {
				_control.attr("cli-cond", value);
			} catch (err) {
				iLog("SetCliCondition", err, Log.Type.Error);
			}
		};
		this.GetTabIndex = function () {
			try {
				if (!_input)
					return 0;
				return _input.attr("tabindex");
			} catch (err) {
				iLog("GetTabIndex", err, Log.Type.Error);
			}
		};
		this.SetTabIndex = function (value) {
			try {
				if (!_input)
					return;
				var idx = parseInt(value, 0);
				if (idx < 0)
					idx = 0;
				_input.attr("tabindex", idx);
			} catch (err) {
				iLog("SetTabIndex", err, Log.Type.Error);
			}
		};
		this.GetValueLessAttrs = function () {
			try {
				if (!_input)
					return "";
				var str = _input.attr("valuelessAttrs");
				if (!str)
					return "";
				var attrs = str.match(/[a-zA-Z0-9#_]+/g);
				if (attrs == null)
					return "";
				var ret = attrs.toString();
				return ret.replace(/,/g, " ");
			} catch (err) {
				iLog("GetValueLessAttrs", err, Log.Type.Error);
			}
		};
		this.SetValueLessAttrs = function (newValue) {
			try {
				if (!_input)
					return;
				_input.removeAttr("valuelessAttrs");
				if (newValue == null)
					return;
				var attrs = newValue.match(/[a-zA-Z0-9#_]+/g);
				if (attrs == null)
					return;
				attrs = attrs.toString();
				_input.attr("valuelessAttrs", attrs.replace(/,/g, " "));
			} catch (err) {
				iLog("SetValueLessAttrs", err, Log.Type.Error);
			}
		};
		this.GetTooltip = function () {
			try {
				if (!_input)
					return "";
				var ret = _input.attr("title");
				if (!ret)
					return "";
				return ret;
			} catch (err) {
				iLog("GetTooltip", err, Log.Type.Error);
			}
		};
		this.SetTooltip = function (newValue) {
			try {
				if (_input)
					_input.attr('title', newValue);
			} catch (err) {
				iLog("SetTooltip", err, Log.Type.Error);
			}
		};
		this.GetHelpLink = function () {
			try {
				var ret = _control.attr("mp-help");
				if (!ret)
					return "";
				return ret;
			} catch (err) {
				iLog("GetHelpLink", err, Log.Type.Error);
			}
		};
		this.SetHelpLink = function (newValue) {
			try {
				_control.attr('mp-help', newValue);
			} catch (err) {
				iLog("SetHelpLink", err, Log.Type.Error);
			}
		};
		this.GetLeft = function () {
			try {
				return Utilities.ToNumber(_control.css("left"));
			} catch (err) {
				iLog("GetLeft", err, Log.Type.Error);
			}
		};
		this.SetLeft = function (newValue) {
			try {
				_control.css("left", Utilities.ToNumber(newValue) + 'px');
			} catch (err) {
				iLog("SetLeft", err, Log.Type.Error);
			}
		};
		this.GetTop = function () {
			try {
				return Utilities.ToNumber(_control.css("top"));
			} catch (err) {
				iLog("GetTop", err, Log.Type.Error);
			}
		};
		this.SetTop = function (newValue) {
			try {
				_control.css("top", Utilities.ToNumber(newValue) + 'px');
			} catch (err) {
				iLog("SetTop", err, Log.Type.Error);
			}
		};
		this.HighlightAsError = function (value) {
			try {
				var ref = PageHelper.GetComponentRef(_control),
					cls = "ui-validation";
					//elm = _input || _control;
				
				var elm = _input;
				if (!elm || !elm.length)
					elm = _control;

				// Find all related radios
				if (ref == 'EditorRadio')
					elm = $("div[Ref='EditorRadio']").find("input[name='" + _input.attr("name") + "']");
				
				// Older IEs do not support shadows! IE11 is not MSIE
				if (Browser.IsMSIE()) {
					cls = "error";
					elm = elm.parent();
				};
				
				// Safari does not render shadow around some inputs!
				if (Browser.IsSafari() && $.inArray(ref, ['EditorRadio', 'EditorCheckBox', 'EditorDropDown']) > -1)
					elm = elm.parent();
				
				elm.toggleClass(cls, value);
			} catch (err) {
				iLog("HighlightAsError", err, Log.Type.Error);
			}
		};
		this.HighlightAsSelected = function (value) {
			_control.find(".moving").toggleClass("ui-selected", value);
		};
		this.HighlightAsFound = function (value) {
			var elm = _input || _control;
			elm.toggleClass("ui-search", value);
		};
		this.BaseSearch = function (str, options) {
			try {
				this.HighlightAsFound(false);
				
				if (!str)
					return;

				var re = Utilities.MakeRegExp(str, options),
					found = false;
				
				if (!found && this.GetID)
					found = this.GetID().search(re) > -1;

				if (!found && this.GetName)
					found = this.GetName().search(re) > -1;
					
				if (!found && this.GetTooltip)
					found = this.GetTooltip().search(re) > -1;

				if (!found && this.GetComment)
					found = this.GetComment().search(re) > -1;

				if (!found && this.GetSvrCondition)
					found = this.GetSvrCondition().search(re) > -1;

				if (!found && this.GetCliCondition)
					found = this.GetCliCondition().search(re) > -1;

				if (!found && this.GetValueLessAttrs)
					found = this.GetValueLessAttrs().search(re) > -1;

				if (!found && this.GetCaption)
					found = this.GetCaption().search(re) > -1;

				if (!found && this.GetStyle)
					found = this.GetStyle().search(re) > -1;
				
				if (!found && this.GetClass)
					found = this.GetClass().search(re) > -1;
				
				if (!found && this.GetFunctions) {
					var arr = $.grep(this.GetFunctions(), function(e){
						return e.Body.search(re) > -1;
					});
					found = arr.length > 0;
				}
				if (found) {
					iLog("Search", this, Log.Type.Search);
					return;
				} else {
					// Continue search in inherited objects!
					return re;
				}
			} catch (err) {
				iLog("BaseSearch", err, Log.Type.Error);
			}
		};
		this.DisableHighlighting = function () {
			Global.DisableHighlightingInChrome(true);
		};
		this.EnableHighlighting = function () {
			Global.DisableHighlightingInChrome(false);
		};
		this.onDragStart = function () {
			Global.DisableHighlightingInChrome(true);
			CurrentPositionX = self.GetLeft();
			CurrentPositionY = self.GetTop();
		};
		this.onDragStop = function() {
			Global.DisableHighlightingInChrome(false);
		};
		this.onDragProgress = function () {
			var x = self.GetLeft();
			var y = self.GetTop();
			var id = PageHelper.GetComponentID(_control);
			if (!PageHelper.IsSelected(id)) {
				PageHelper.ClearSelected();
				PageHelper.AddSelected(id);
			};
			if ((CurrentPositionX == x) && (CurrentPositionY == y))
				return;
			
			var offsetX = x - CurrentPositionX;
			var offsetY = y - CurrentPositionY;
			var selected = PageHelper.GetSelected();
			CurrentPositionX = x;
			CurrentPositionY = y;

			for (var i = 0; i < selected.length; i++) {
				id = selected[i];
				var ctrl = PageHelper.GetStoredComponent(id);
				if (ctrl) {
					x = ctrl.GetLeft();
					y = ctrl.GetTop();
					ctrl.SetLeft(x + offsetX);
					ctrl.SetTop(y + offsetY);
				} else
					iLog("Dragging", "Cannot locate component ID: " + id, Log.Type.Warning);
			};
		};
		this.UpdateComment = function (remove) {
			try {
				var s = $.trim(self.GetComment());
				var jQctrl = jQ(_control[0]);
				if (!remove && s) {
					s = s.replace(/[\n\r]/g, '<br/>');
					jQctrl.jqxTooltip({ content: s, showDelay: 1000, autoHideDelay: 50000, theme: 'editor' });
				} else {
					jQctrl.jqxTooltip('destroy');
					if (_control.attr('id').beginsWith('jqxWidget'))
						_control.removeAttr('id');
				}
			} catch (err) {
				iLog("UpdateComment", err, Log.Type.Error);
			}
		};
		this.GetStyle = function () {
			try {
				if (_input)
					return _input.attr("style") || '';
				else
					return '';
			} catch (err) {
				iLog("GetStyle", err, Log.Type.Error);
			}
		};
		this.SetStyle = function (value) {
			try {
				//LK: IE bug!
				_input.attr("style", value || ' ');
				resizeCB(_input);
			} catch (err) {
				iLog("SetStyle", err, Log.Type.Error);
			}
		};
		this.GetClass = function () {
			try {
				if (_input) {
					_input.removeClass("moving");
					_input.removeClass("ui-selected");
					_input.removeClass("ui-selectee");
					return _input.attr("class") || '';
				} else
					return '';
			} catch (err) {
				iLog("GetClass", err, Log.Type.Error);
			}
		};
		this.SetClass = function (value) {
			try {
				_input.attr("class", value);
				_input.addClass("moving");
			} catch (err) {
				iLog("SetClass", err, Log.Type.Error);
			}
		};
	}
	
	return TemplateBase;
});

define('page/comp/TransferList', ['page/TemplateBase', 'Utilities', 'PageHelper', 'Editor'], function (TemplateBase, Utilities, PageHelper, Editor) {
	function TransferList() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();
		
			/* PUBLIC PROPERTIES */
			this.NameRequired = true;
			this.refClassName = "TrfList";

			/* PRIVATE PROPERTIES */
			var self = this;
			var control = $("<div ref='TransferList' />"); // this is just a reference element used by storage, not shown on form anywhere
			var _container = null;
			var _list1 = null;
			var _list2 = null;
			var _selLeft = null;
			var _selRight = null;
			var _allLeft = null;
			var _allRight = null;
			var featuresAdded = false;
			
			/* PRIVATE METHODS */
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");

					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}			
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}			
			
			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					_container.AppendTo(ContainerElement);
					_container.SetHeight("270");
					
					var ctrl = _container.GetControl();
					var AreaWidth = $(ctrl).parent().css('width');
					if (AreaWidth)
						ctrl.css('width', (parseInt(AreaWidth) - 10) + 'px');
					else
						ctrl.css('width', "840px");
					
					ctrl.attr("transferlist", "");
					// dropdowns
					_list1.AppendTo(ctrl);
					_list2.AppendTo(ctrl);
					var elems = [_list1, _list2];
					for (var i = 0; i < elems.length; i++) {
						switch (i) {
							case 0:	elems[i].SetLeft("5"); break;
							case 1:	elems[i].SetLeft("490"); break;
						}
						elems[i].SetTop("5");
						elems[i].SetWidth("336");
						elems[i].SetMultiSelect(true);
						elems[i].SetSize("12");
						elems[i].SetCaption("List " + (i + 1));
					}
					// buttons
					_selRight.AppendTo(ctrl);
					_selRight.SetLeft("347");
					_selRight.SetTop("15");
					_selRight.SetWidth("126");
					_selRight.SetCaption("Move Selected -->");
					var obj = new Object();
					obj.Name = "click";
					obj.Body = "TransferListHelper.MoveSelectedRight(this)";
					_selRight.SetFunctions([obj]);
					_selLeft.AppendTo(ctrl);
					_selLeft.SetLeft("347");
					_selLeft.SetTop("43");
					_selLeft.SetWidth("126");
					_selLeft.SetCaption("<-- Move Selected");
					obj.Body = "TransferListHelper.MoveSelectedLeft(this)";
					_selLeft.SetFunctions([obj]);
					_allLeft.AppendTo(ctrl);
					_allLeft.SetLeft("347");
					_allLeft.SetTop("81");
					_allLeft.SetWidth("126");
					_allLeft.SetCaption("<-- Move All");
					obj.Body = "TransferListHelper.MoveAllLeft(this)";
					_allLeft.SetFunctions([obj]);
					_allRight.AppendTo(ctrl);
					_allRight.SetLeft("347");
					_allRight.SetTop("109");
					_allRight.SetWidth("126");
					_allRight.SetCaption("Move All -->");
					obj.Body = "TransferListHelper.MoveAllRight(this)";
					_allRight.SetFunctions([obj]);
					
					this.BaseLoad2(ctrl);
					if (Editor.Enabled)
						this.EditMode();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function (ctrlName) {
				try {
					iLog("Create", "Called");
					
					_container = PageHelper.CreateEditorComponent("StaticContainer");
					_list1 = PageHelper.CreateEditorComponent("EditorDropDown", ctrlName + "_ListLeft");
					_list2 = PageHelper.CreateEditorComponent("EditorDropDown", ctrlName + "_ListRight");
					_selLeft = PageHelper.CreateEditorComponent("EditorSubmitButton", ctrlName + "_MoveSelectedLeft");
					_selRight = PageHelper.CreateEditorComponent("EditorSubmitButton", ctrlName + "_MoveSelectedRight");
					_allLeft = PageHelper.CreateEditorComponent("EditorSubmitButton", ctrlName + "_MoveAllLeft");
					_allRight = PageHelper.CreateEditorComponent("EditorSubmitButton", ctrlName + "_MoveAllRight");
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};

		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return TransferList;
});

define('page/comp/EditorSubmitButton', ['page/TemplateBase', 'PropertyFields', 'Utilities', 'PageHelper', 'Editor'], function (TemplateBase, PropertyFields, Utilities, PageHelper, Editor) {
	function EditorSubmitButton() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.NameRequired = true;
			this.refClassName = "EdSubmitBtn";
			
			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var featuresAdded = false;
			var input = null;
			
			/* PRIVATE METHODS */			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// sizes the control around the input element			
			function ResizeControl(obj) {
				try {
					iLog("ResizeControl", "Called");
					
					obj = obj || input;
					var w = obj.outerWidth(),
						h = obj.outerHeight();

					obj.width(w);
					obj.height(h);
					control.css("width", w + 5);
					control.css("height", h);
				} catch (err) {
					iLog("ResizeControl", err, Log.Type.Error);
				}
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");
					
					var pref = PageHelper.GetParentRef(control);
					if (pref == "StaticContainer") {
						input.addClass("moving");
						control.draggable({
							containment: "parent",
							cancel: "",
							grid  : MP.Tools.Config.Editor.html.snap,
							start : self.onDragStart,
							stop  : self.onDragStop,
							drag  : self.onDragProgress
						});
						control.resizable({
							autoHide : true,
							resize : function (e, ui) {
								input.width(ui.size.width);
								input.height(ui.size.height);
								ResizeControl();
							}
						});
					}
					control.addClass("editing");
					
					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					control.draggable("destroy")
						.resizable("destroy")
						.removeClass("editing");
					input.removeClass("moving");
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			
			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control, input, ResizeControl);
					if (Editor.Enabled)
						this.EditMode();
					this.Refresh();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function (ctrlName) {
				try {
					iLog("Create", "Called");
					
					control = $("<div condition='' function='CLICK' definition='Communication.SerialRequest($(\"#rightColumn\"),false,this)' />");
					control.html("<input type='button' value='" + ctrlName + "' id='" + ctrlName + "' name='" + ctrlName + "'></input>");
					control.addClass("component EditorSubmitButton");
					control.attr("ref", "EditorSubmitButton");
					
					input = control.find("input");
					input.width(100);
					input.height(22);
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
					this.AttachFunctions();
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
					this.DetachFunctions();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					input = $(control.find("input"));
					this.BaseLoad(control, input, ResizeControl);
					
					// the following code is used to remove the hard coded onclick
					var ret = input.attr("onclick");
					if (Utilities.IsFunction(ret)) {
						ret = ret.toString();
						if (ret.indexOf("Communication.") > -1)
							input.removeAttr("onclick");
					}
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
					
					ResizeControl();
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					var re = this.BaseSearch(str, options);
					if (re) {
						//if (this.GetProperty().search(re) > -1)
						//	iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["Name"], this.GetName, this.SetName));
					p.push(new PropertyEd.Property(PropertyFields["Caption"], this.GetCaption, this.SetCaption));
					p.push(new PropertyEd.Property(PropertyFields["Validate"], this.GetCauseValidation, this.SetCauseValidation));
					
					var pref = PageHelper.GetParentRef(control);
					if (pref == "StaticContainer")
						p.push(new PropertyEd.Property(PropertyFields["DefaultButton"], this.GetDefaultButton, this.SetDefaultButton));
					
					return p;
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.GetCauseValidation = function () {
				try {
					var cv = input.attr("CauseValidation");
					return (cv != null);
				} catch (err) {
					iLog("GetCauseValidation", err, Log.Type.Error);
				}
			};
			this.GetDefaultButton = function () {
				try {
					return input.attr("DefaultButton") == "true";
				} catch (err) {
					iLog("GetDefaultButton", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.GetCaption = function () {
				try {
					return input.val();
				} catch (err) {
					iLog("GetCaption", err, Log.Type.Error);
				}
			};
			this.GetHeight = function () {
				try {
					return Utilities.ToNumber(input.outerHeight());
				} catch (err) {
					iLog("GetHeight", err, Log.Type.Error);
				}
			};
			this.SetHeight = function (value) {
				try {
					input.height(Utilities.ToNumber(value));
					ResizeControl();
				} catch (err) {
					iLog("SetHeight", err, Log.Type.Error);
				}
			};
			this.GetWidth = function () {
				try {
					return Utilities.ToNumber(input.outerWidth());
				} catch (err) {
					iLog("GetWidth", err, Log.Type.Error);
				}
			};
			this.SetWidth = function (value) {
				try {
					input.width(Utilities.ToNumber(value));
					ResizeControl();
				} catch (err) {
					iLog("SetWidth", err, Log.Type.Error);
				}
			};
			this.GetName = function () {
				try {
					return input.attr("name");
				} catch (err) {
					iLog("GetName", err, Log.Type.Error);
				}
			};
			this.SetName = function (newName) {
				try {
					if (newName != input.attr('id'))
						input.attr('id', newName);
					if (newName != input.attr('name'))
						input.attr('name', newName);
				} catch (err) {
					iLog("SetName", err, Log.Type.Error);
				}
			};
			this.SetCaption = function (newCaption) {
				try {
					input.val(newCaption);
				} catch (err) {
					iLog("SetCaption", err, Log.Type.Error);
				}
			};
			this.SetDefaultButton = function (value) {
				try {
					input.attr("DefaultButton", value);
				} catch (err) {
					iLog("SetDefaultButton", err, Log.Type.Error);
				}
			};
			this.SetCauseValidation = function (boolVal) {
				try {
					if (boolVal)
						input.attr("CauseValidation", "true");
					else
						input.removeAttr("CauseValidation");
				} catch (err) {
					iLog("SetCauseValidation", err, Log.Type.Error);
				}
			};

		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return EditorSubmitButton;
});

define('page/comp/EditorDropDown', ['page/TemplateBase', 'PropertyFields', 'Utilities', 'PageHelper', 'Editor'], function (TemplateBase, PropertyFields, Utilities, PageHelper, Editor) {
	function EditorDropDown() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.NameRequired = true;
			this.refClassName = "EdDropdown";
			
			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var featuresAdded = false;
			var input = null;
			var span = null;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// sizes the control elements
			function ResizeControl(obj) {
				try {
					iLog("ResizeControl", "Called");
					
					//LK: Must read outer but write the other!
					obj = obj || input;
					var w = obj.outerWidth(),
						h = obj.outerHeight();

					obj.width(w);
					control.css("width", w);
					control.css("height", h + 15);
				} catch (err) {
					iLog("ResizeControl", err, Log.Type.Error);
				}
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");
					
					var pref = PageHelper.GetParentRef(control);
					if (pref == "StaticContainer") {
						input.addClass("moving");
						span.addClass("moving");
						control.draggable({
							containment: "parent",
							cancel: "",
							grid  : MP.Tools.Config.Editor.html.snap,
							start : self.onDragStart,
							stop  : self.onDragStop,
							drag  : self.onDragProgress
						});
						control.resizable({
							autoHide : true,
							maxHeight : control.height(),
							minHeight : control.height(),
							resize : function (e, ui) {
								input.width(ui.size.width);
								ResizeControl();
							}
						});
					}
					control.addClass("editing");
					
					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added			
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					control.draggable("destroy")
						.resizable("destroy")
						.removeClass("editing");
					input.removeClass("moving");
					span.removeClass("moving");
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			
			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			// Appends the control to a container element
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control, input, ResizeControl);
					if (Editor.Enabled)
						this.EditMode();
					this.Refresh();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function (ctrlName) {
				try {
					iLog("Create", "Called");
					
					control = $("<div condition=''/>");
					control.html("<span>" + ctrlName + "</span><br/><select id='" + ctrlName + "' name='" + ctrlName + "' size='1'>");
					control.addClass("component EditorDropDown");
					control.attr("ref", "EditorDropDown");
					
					input = control.find("select");
					span = control.find("span");
					span.addClass("notRequired");
					span.click(function () {
						input.focus();
					});
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
					this.AttachFunctions();
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
					this.DetachFunctions();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					span = $(control.find("span"));
					span.css("cursor", "default");
					input = $(control).find("select");
					span.click(function () {
						input.focus();
					});
					this.BaseLoad(control, input, ResizeControl);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
					
					ResizeControl();
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					var re = this.BaseSearch(str, options);
					if (re) {
						if (this.GetOptions().search(re) > -1)
							iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.GetErrorMessage = function () {
				try {
					if (this.GetRequired()) {
						if (input.val() == "-1") {
							return "You must select from the dropdown '" + span.text() + "'";
						}
						return null;
					}
				} catch (err) {
					iLog("GetErrorMessage", err, Log.Type.Error);
				}
			};
			this.SetFocus = function () {
				try {
					input.focus();
				} catch (err) {
					iLog("SetFocus", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["Name"], this.GetName, this.SetName));
					p.push(new PropertyEd.Property(PropertyFields["Caption"], this.GetCaption, this.SetCaption));
					p.push(new PropertyEd.Property(PropertyFields["Options"], this.GetOptions, this.SetOptions));
					p.push(new PropertyEd.Property(PropertyFields["Size"], this.GetSize, this.SetSize));
					p.push(new PropertyEd.Property(PropertyFields["MultiSelect"], this.GetMultiSelect, this.SetMultiSelect));
					p.push(new PropertyEd.Property(PropertyFields["Required"], this.GetRequired, this.SetRequired));
					
					return p;
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.GetCaption = function () {
				try {
					return span.text();
				} catch (err) {
					iLog("GetCaption", err, Log.Type.Error);
				}
			};
			this.GetName = function () {
				try {
					return input.attr("name");
				} catch (err) {
					iLog("GetName", err, Log.Type.Error);
				}
			};
			this.GetOptions = function () {
				try {
					return input.html();
				} catch (err) {
					iLog("GetOptions", err, Log.Type.Error);
				}
			};
			this.GetMultiSelect = function () {
				try {
					return input.attr("multiple");
				} catch (err) {
					iLog("GetMultiSelect", err, Log.Type.Error);
				}
			};
			this.GetRequired = function () {
				try {
					return span.hasClass("required");
				} catch (err) {
					iLog("GetRequired", err, Log.Type.Error);
				}
			};
			this.GetSize = function () {
				try {
					return input.attr("size");
				} catch (err) {
					iLog("GetSize", err, Log.Type.Error);
				}
			};
			this.GetWidth = function () {
				try {
					//LK: Must read outerWidth!
					return Utilities.ToNumber(input.outerWidth());
				} catch (err) {
					iLog("GetWidth", err, Log.Type.Error);
				}
			};
			this.SetWidth = function (newWidth) {
				try {
					input.width(Utilities.ToNumber(newWidth));
					ResizeControl();
				} catch (err) {
					iLog("SetWidth", err, Log.Type.Error);
				}
			};
			this.SetCaption = function (newCaption) {
				try {
					span.text(newCaption);
				} catch (err) {
					iLog("SetCaption", err, Log.Type.Error);
				}
			};
			this.SetName = function (newName) {
				try {
					if (newName != input.attr('id'))
						input.attr('id', newName);
					if (newName != input.attr('name'))
						input.attr('name', newName);
				} catch (err) {
					iLog("SetName", err, Log.Type.Error);
				}
			};
			this.SetMultiSelect = function (value) {
				try {
					if (value == true || value == 'true')
						input.attr("multiple", "multiple");
					else
						input.attr("multiple", "");
				} catch (err) {
					iLog("SetMultiSelect", err, Log.Type.Error);
				}
			};
			this.SetOptions = function (newValue) {
				try {
					input.html(newValue);
				} catch (err) {
					iLog("SetOptions", err, Log.Type.Error);
				}
			};			
			this.SetRequired = function (required) {
				try {
					if (required == true || required == 'true')
						span.removeClass("notRequired").addClass("required");
					else
						span.removeClass("required").addClass("notRequired");
				} catch (err) {
					iLog("SetRequired", err, Log.Type.Error);
				}
			};			
			this.SetSize = function (newValue) {
				try {
					input.attr("size", newValue);
					ResizeControl();
				} catch (err) {
					iLog("SetSize", err, Log.Type.Error);
				}
			};

		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return EditorDropDown;
});

define('page/comp/EditorLabel', ['page/TemplateBase', 'PropertyFields', 'PageHelper', 'Editor'], function (TemplateBase, PropertyFields, PageHelper, Editor) {
	function EditorLabel() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();
			
			/* PUBLIC PROPERTIES */
			this.NameRequired = false;
			this.refClassName = "EdLabel";

			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var featuresAdded = false;
			var label = null;

			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");
					
					var pref = PageHelper.GetParentRef(control);
					if (pref == "StaticContainer") {
						control.draggable({
							containment: "parent",
							cancel: "",
							grid  : MP.Tools.Config.Editor.html.snap,
							start : self.onDragStart,
							stop  : self.onDragStop,
							drag  : self.onDragProgress
						});
						control.resizable({
							autoHide : true,
							maxHeight : control.height(),
							minHeight : control.height(),
							grid : MP.Tools.Config.Editor.html.snap
						});
					}
					label.addClass("moving");
					control
						.addClass("editing")
						.addClass("moving");
					
					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					label.removeClass("moving");
					control
						.draggable("destroy")
						.resizable("destroy")
						.removeClass("editing")
						.removeClass("moving");
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			
			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			// Appends the control to a container element
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control, label);
					if (Editor.Enabled)
						this.EditMode();
					this.Refresh();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function () {
				try {
					iLog("Create", "Called");
					
					control = $("<div condition=''/>");
					control.html("<label class='handle Default'>LABEL</label>");
					control.addClass("component EditorLabel");
					control.attr("ref", "EditorLabel");
					
					label = control.find("label");
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
					this.AttachFunctions();
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
					this.DetachFunctions();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					label = $(control.find("label"));
					this.BaseLoad(control, label);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					var re = this.BaseSearch(str, options);
					if (re) {
						//if (this.GetProperty().search(re) > -1)
						//	iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["ID"], this.GetID, this.SetID));
					p.push(new PropertyEd.Property(PropertyFields["Caption"], this.GetCaption, this.SetCaption));
					
					return p;
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.GetID = function () {
				try {
					return label.attr("id");
				} catch (err) {
					iLog("GetID", err, Log.Type.Error);
				}
			};
			this.SetID = function (newID) {
				try {
					if (newID != label.attr('id'))
						label.attr("id", newID);
				} catch (err) {
					iLog("SetID", err, Log.Type.Error);
				}
			};
			this.GetCaption = function () {
				try {
					return label.html();
				} catch (err) {
					iLog("GetCaption", err, Log.Type.Error);
				}
			};
			this.SetCaption = function (newCaption) {
				try {
					label.html(newCaption);
				} catch (err) {
					iLog("SetCaption", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return EditorLabel;
});

define('page/comp/EditorLink', ['page/TemplateBase', 'PropertyFields', 'PageHelper', 'Editor'], function (TemplateBase, PropertyFields, PageHelper, Editor) {
	function EditorLink() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();
			
			/* PUBLIC PROPERTIES */
			this.NameRequired = false;
			this.refClassName = "EdLink";
			
			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var featuresAdded = false;
			var link = null;

			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");
					
					var evt = link.attr("onclick");
					var s = '';
					if (Utilities.IsFunction(evt)) {
						s = String(evt);
						var start = s.indexOf('{') + 1;
						var stop = s.lastIndexOf('}');
						s = s.substring(start, stop);
						s = Utilities.Trim(s);
						
						link.removeAttr("onclick");
					} else {
						s = self.GetTarget();
					}
					self.SetTarget(s);
					
					var pref = PageHelper.GetParentRef(control);
					if (pref == "StaticContainer") {
						control.draggable({
							containment: "parent",
							cancel: "",
							grid  : MP.Tools.Config.Editor.html.snap,
							start : self.onDragStart,
							stop  : self.onDragStop,
							drag  : self.onDragProgress
						});
					};
					link.addClass("moving");
					control
						.addClass("editing")
						.addClass("moving");
					
					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					//LK: due problems changing Target back to onclick here on live object, it is done later in PageHelper.CleanHtmlAfterEditor!
					link.removeClass("moving");
					control
						.draggable("destroy")
						.removeClass("editing")
						.removeClass("moving");
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			
			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			// Appends the control to a container element
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control, link);
					if (Editor.Enabled)
						this.EditMode();
					this.Refresh();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function () {
				try {
					iLog("Create", "Called");
					
					control = $("<div condition=''/>");
					control.html("<a class='handle Default' style='cursor: pointer;' onclick='Communication.LinkRequest();'>LINK</a>");
					control.addClass("component EditorLink");
					control.attr("ref", "EditorLink");
					
					link = control.find("a");
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
					this.AttachFunctions();
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
					this.DetachFunctions();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					link = $(control.find("a"));
					this.BaseLoad(control, link);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					var re = this.BaseSearch(str, options);
					if (re) {
						if (this.GetTarget().search(re) > -1)
							iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["ID"], this.GetID, this.SetID));
					p.push(new PropertyEd.Property(PropertyFields["Caption"], this.GetCaption, this.SetCaption));
					p.push(new PropertyEd.Property(PropertyFields["Target"], this.GetTarget, this.SetTarget));
					
					return p;
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.GetID = function () {
				try {
					return link.attr("id");
				} catch (err) {
					iLog("GetID", err, Log.Type.Error);
				}
			};
			this.SetID = function (newID) {
				try {
					if (newID != link.attr('id'))
						link.attr("id", newID);
				} catch (err) {
					iLog("SetID", err, Log.Type.Error);
				}
			};
			this.GetCaption = function () {
				try {
					return link.text();
				} catch (err) {
					iLog("GetCaption", err, Log.Type.Error);
				}
			};
			this.SetCaption = function (newCaption) {
				try {
					link.text(newCaption);
				} catch (err) {
					iLog("SetCaption", err, Log.Type.Error);
				}
			};
			this.GetTarget = function () {
				try {
					return String(link.attr("mp-target"));
				} catch (err) {
					iLog("GetTarget", err, Log.Type.Error);
				}
			};
			this.SetTarget = function (newTarget) {
				try {
					link.attr("mp-target", String(newTarget));
				} catch (err) {
					iLog("SetTarget", err, Log.Type.Error);
				}
			};
		
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return EditorLink;
});

define('page/comp/EditorDiv', ['page/TemplateBase', 'PropertyFields', 'PageHelper', 'Editor'], function (TemplateBase, PropertyFields, PageHelper, Editor) {
	function EditorDiv() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();
			
			/* PUBLIC PROPERTIES */
			this.NameRequired = false;
			this.refClassName = "EdDiv";

			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var featuresAdded = false;
			var div = null;

			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");
					
					var pref = PageHelper.GetParentRef(control);
					if (pref == "StaticContainer") {
						control.draggable({
							containment: "parent",
							cancel: "",
							grid  : MP.Tools.Config.Editor.html.snap,
							start : self.onDragStart,
							stop  : self.onDragStop,
							drag  : self.onDragProgress
						});
						control.resizable({
							autoHide : true,
							grid : MP.Tools.Config.Editor.html.snap,
							resize : ResizeControl,
							stop : ResizeControl
						});
					}
					
					div.addClass("moving");
					control
						.addClass("editing")
						.addClass("moving");
					
					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					div.removeClass("moving");
					control
						.draggable("destroy")
						.resizable("destroy")
						.removeClass("editing")
						.removeClass("moving");
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			function ResizeControl(obj) {
				try {
					iLog("ResizeControl", "Called");

					if (obj && obj.length && obj.get(0) == div.get(0)) {
						// Resize by input's styles
						var style = obj.attr('style'),
							w = (/width:/i.test(style) ? div.css('width') : ''),
							h = (/height:/i.test(style) ? div.css('height') : '');

						control.css('width', w);
						control.css('height', h);
					} else {
						// Resize by control's dragging
						var w = Utilities.ToNumber(control.css("width")),
							h = Utilities.ToNumber(control.css("height"));

						div.width(w);
						div.height(h);
					}
				} catch (err) {
					iLog("ResizeControl", err, Log.Type.Error);
				}
			}
			
			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			// Appends the control to a container element
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control, div, ResizeControl);
					if (Editor.Enabled)
						this.EditMode();
					this.Refresh();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function () {
				try {
					iLog("Create", "Called");
					
					control = $("<div condition='' />");
					control.html("<div>DIV</div>");
					control.addClass("component EditorDiv");
					control.attr("ref", "EditorDiv");
					
					div = control.find("div");
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
					this.AttachFunctions();
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
					this.DetachFunctions();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					div = control.find("div");
					this.BaseLoad(control, div, ResizeControl);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");

					ResizeControl();
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					var re = this.BaseSearch(str, options);
					if (re) {
						if (this.GetHTML().search(re) > -1)
							iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["ID"], this.GetID, this.SetID));
					p.push(new PropertyEd.Property(PropertyFields["HtmlBody"], this.GetHTML, this.SetHTML));
					
					return p;
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.GetID = function () {
				try {
					return div.attr("id");
				} catch (err) {
					iLog("GetID", err, Log.Type.Error);
				}
			};
			this.SetID = function (newID) {
				try {
					if (newID != div.attr('id'))
						div.attr("id", newID);
				} catch (err) {
					iLog("SetID", err, Log.Type.Error);
				}
			};
			this.GetHTML = function () {
				try {
					return div.html();
				} catch (err) {
					iLog("GetHTML", err, Log.Type.Error);
				}
			};
			this.SetHTML = function (newHtml) {
				try {
					div.html(newHtml);
				} catch (err) {
					iLog("SetHTML", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return EditorDiv;
});

define('page/comp/EditorText', ['page/TemplateBase', 'page/ValidationBase', 'PropertyFields', 'Utilities', 'PageHelper', 'Editor'], function (TemplateBase, ValidationBase, PropertyFields, Utilities, PageHelper, Editor) {
	function EditorText() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();
			this.inheritFrom = ValidationBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.NameRequired = true;
			this.refClassName = "EdText";
			this.UserUpdate = false;
			this.Corrected = false;
			this.DatepickerShown = false;

			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var featuresAdded = false;
			var input = null;
			var span = null;

			/* PRIVATE METHODS */

			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// sizes the control around the input element
			function ResizeControl(obj) {
				try {
					iLog("ResizeControl", "Called");
					
					obj = obj || input;
					var w = Utilities.ToNumber(obj.width()),
						h = Utilities.ToNumber(obj.height());
					
					// Do not update elements which have no or wrong size! (hidden)
					if (w < 1 || h < 1)
						return;

					obj.width(w);
					
					var pl = Utilities.ToNumber(control.css("padding-left")) + Utilities.ToNumber(control.css("border-left-width")),
						pr = Utilities.ToNumber(control.css("padding-right")) + Utilities.ToNumber(control.css("border-right-width")),
						pt = Utilities.ToNumber(obj.css("margin-top")) + Utilities.ToNumber(obj.css("border-top-width")),
						inputWidth = w;
					
					if (Browser.IsMSIE()) {
						w -= pl;
					} else {
						w -= (pl + pr);
						pl += 1;
						if (Browser.IsFirefox())
							pt += 1;
					};
					span.width(w).height(h);

					// Do not add Left/Top to DIVs which are not StaticContainers!
					var pref = PageHelper.GetParentRef(control);
					if (pref == "StaticContainer")
						span.css('left', pl + 'px').css('top', pt + 'px');
					else
						span.css('left', '').css('top', '');
					
					control.css("width", inputWidth + 'px');
				} catch (err) {
					iLog("ResizeControl", err, Log.Type.Error);
				}
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");
					
					var pref = PageHelper.GetParentRef(control);
					if (pref == "StaticContainer") {
						input.addClass("moving");
						control.draggable({
							containment: "parent",
							cancel: "",
							grid  : MP.Tools.Config.Editor.html.snap,
							start : self.onDragStart,
							stop  : self.onDragStop,
							drag  : self.onDragProgress
						});
						control.resizable({
							autoHide : true,
							maxHeight : control.height(),
							minHeight : control.height(),
							resize : function (e, ui) {
								input.width(ui.size.width);
								ResizeControl();
							}
						});
					}
					input.bind("click.EditorText", function (e) {
						e.stopPropagation();
						this.focus();
					});
					control.addClass("editing");
					
					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					control.draggable("destroy")
						.resizable("destroy")
						.removeClass("editing");
					input.removeClass("moving")
						.unbind("click.EditorText");
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			
			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			// Appends the control to a container element
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control, input, ResizeControl);
					this.ValidationBaseLoad(control, input);
					if (Editor.Enabled)
						this.EditMode();
					this.Refresh();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function (ctrlName) {
				try {
					iLog("Create", "Called");
					
					control = $("<div condition=''/>");
					control.html("<span>" + ctrlName + "</span><input id='" + ctrlName + "' name='" + ctrlName + "' maxlength='30'>");
					control.addClass("component EditorText");
					control.attr("ref", "EditorText");
					
					input = control.find("input");
					span = control.find("span");
					span.addClass("notRequired");
					span.click(function () {
						input.focus();
					});
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
					this.AttachFilter();
					this.AttachFunctions();
					input.css("margin-left", "");
					
					var v = Utilities.Trim(input.val());
					input.val(v);

					// Date fields should automatically show a date selector on focus
					if (this.GetFilters && !input.attr("disabled") && !input.attr("readonly")) {
						var _setDate = false;
						var _minDate = null;
						var _maxDate = null;
						var _format = 'mm/dd/yy';
						var filters = this.GetFilters();
						for (var i = 0; i < filters.length; i++) {
							var filter = filters[i];
							if (filter.Filter == "DATE" && filter.DType == "DATE" && filter.Param) {
								_setDate = true;
								
								// jQ Date Picker and Date JS object has formating differences!
								_format = filter.Param.toLowerCase().replace('yyyy', 'yy');
								break;
							}
							if (filter.Filter == "DATE")
								_setDate = true;
							if (filter.DType == "DATE") {
								var s = filter.Param.split("/");
								var y = parseInt(s[2], 10);
								var m = parseInt(s[0], 10) - 1;
								var d = parseInt(s[1], 10);
								if (filter.Filter == "GREATERTHANEQUALS")
									_minDate = new Date(y, m, d);
								if (filter.Filter == "GREATERTHAN")
									_minDate = new Date(y, m, d + 1);
								if (filter.Filter == "LESSTHANEQUALS")
									_maxDate = new Date(y, m, d);
								if (filter.Filter == "LESSTHAN")
									_maxDate = new Date(y, m, d - 1);
							}
						}
						if (_setDate) {

							// If this class is present, the date picker won't be created!
							input.removeClass('hasDatepicker');
							input.datepicker({
								minDate : _minDate,
								maxDate : _maxDate,
								showOn : '',
								dateFormat : _format,
								changeMonth : true,
								changeYear : true,
								showAnim : 'fadeIn',
								onClose : function (val, inst) {
									self.DatepickerShown = false;
									$(inst.input).focus();
								},
								beforeShow : function (input, inst) {
									self.DatepickerShown = true;
									var v = $(input).val();
									if (v) {
										if (Utilities.IsDate(v, filter.Param)) {
											var dt = new Date.parse(v);
											var y = dt.getFullYear();
											var m = dt.getMonth();
											var d = dt.getDate();
											
											$(this).datepicker('option', 'defaultDate', new Date(y, m, d));
										}
									} else {
										$(this).datepicker('option', 'defaultDate', new Date());
									}
								}
							});
							input.bind('dblclick.datepicker-custom', function () {
								input.datepicker('show');
							});
						}
					};
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					var v = Utilities.Trim(input.val());
					input.val(v);
					
					AddFeatures();
					input.css("margin-left", ""); // added for a fix after adding doctype
					this.DetachFilter();
					this.DetachFunctions();
					
					input.unbind('.datepicker-custom');
					input.datepicker("destroy");
					input.removeClass("hasDatepicker");
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					span = $(control.find("span"));
					span.css("cursor", "text");
					input = $(control.find("input"));
					this.BaseLoad(control, input, ResizeControl);

					
					span.click(function () {
						input.focus();
					});
					
					if (!Editor.Enabled) {
						if (input.attr("sMask"))
							input.data('submit-type', 'MASK');

						//Now that the value is in place we can size the span properly
						if (Utilities.Trim(input.val()).length == 0) {
							span.css("font-size", "1em");
						} else {
							span.css("font-size", ".6em");
						}
						
						input.keyup(function () {
							if (this.value.length == 0) {
								span.css("font-size", "1em");
							} else {
								span.css("font-size", ".6em");
							}
						});
						input.hover(function () {
							span.css("font-size", "1em");
						}, function () {
							if (Utilities.Trim(input.val()).length == 0) {
								span.css("font-size", "1em");
							} else {
								span.css("font-size", ".6em");
							}
						});
						span.hover(function () {
							span.css("font-size", "1em");
						}, function () {
							if (Utilities.Trim(input.val()).length == 0) {
								span.css("font-size", "1em");
							} else {
								span.css("font-size", ".6em");
							}
						});
					}
					this.ValidationBaseLoad(control, input);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
					
					ResizeControl();
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.CorrectUI = function () {
				try {
					if (this.Corrected)
						return;
					iLog("CorrectUI", "Called");
					
					//LK: to fix incorrect display if the structure is missaligned from past
					ResizeControl();
					
					this.Corrected = true;
				} catch (err) {
					iLog("CorrectUI", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);
					
					var re = this.BaseSearch(str, options);
					if (re) {
						var arr = $.grep(this.GetFilters(), function(itm){
							return itm.Param.search(re) > -1;
						});
						if (arr.length > 0)
							iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.SetFocus = function () {
				try {
					input.focus();
				} catch (err) {
					iLog("SetFocus", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.GetErrorMessage = function () {
				try {
					if (this.GetRequired()) {
						if (Utilities.Trim(input.val()).length == 0) {
							return "You must enter the field marked '" + span.text() + "'";
						}
						return null;
					}
				} catch (err) {
					iLog("GetErrorMessage", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["Type"], this.GetType, this.SetType));
					p.push(new PropertyEd.Property(PropertyFields["Name"], this.GetName, this.SetName));
					p.push(new PropertyEd.Property(PropertyFields["Caption"], this.GetCaption, this.SetCaption));
					p.push(new PropertyEd.Property(PropertyFields["MaxLength"], this.GetMaxLength, this.SetMaxLength));
					p.push(new PropertyEd.Property(PropertyFields["Required"], this.GetRequired, this.SetRequired));
					p.push(new PropertyEd.Property(PropertyFields["Secure"], this.GetSecure, this.SetSecure));
					
					return this.GetValidationProperties(p);
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.GetType = function () {
				try {
					return input.attr("mp-type") || input.attr("type");
				} catch (err) {
					iLog("GetType", err, Log.Type.Error);
				}
			};
			this.SetType = function (newType) {
				try {
					input.attr('mp-type', newType || 'text');
				} catch (err) {
					iLog("SetType", err, Log.Type.Error);
				}
			};			
			this.GetCaption = function () {
				try {
					return span.text();
				} catch (err) {
					iLog("GetCaption", err, Log.Type.Error);
				}
			};
			this.SetCaption = function (newCaption) {
				try {
					span.text(newCaption);
				} catch (err) {
					iLog("SetCaption", err, Log.Type.Error);
				}
			};
			this.GetMaxLength = function () {
				try {
					return input.attr("maxlength");
				} catch (err) {
					iLog("GetMaxLength", err, Log.Type.Error);
				}
			};
			this.SetMaxLength = function (newValue) {
				try {
					input.attr("maxlength", newValue);
				} catch (err) {
					iLog("SetMaxLength", err, Log.Type.Error);
				}
			};			
			this.GetName = function () {
				try {
					return input.attr("name");
				} catch (err) {
					iLog("GetName", err, Log.Type.Error);
				}
			};
			this.SetName = function (newName) {
				try {
					if (newName != input.attr('id'))
						input.attr('id', newName);
					if (newName != input.attr('name'))
						input.attr('name', newName);
				} catch (err) {
					iLog("SetName", err, Log.Type.Error);
				}
			};			
			this.GetRequired = function () {
				try {
					return span.hasClass("required");
				} catch (err) {
					iLog("GetRequired", err, Log.Type.Error);
				}
			};
			this.SetRequired = function (required) {
				try {
					if (required == true || required == 'true')
						span.removeClass("notRequired").addClass("required");
					else
						span.removeClass("required").addClass("notRequired");
				} catch (err) {
					iLog("SetRequired", err, Log.Type.Error);
				}
			};
			this.GetSecure = function () {
				try {
					return input.attr("sValue") && input.attr("sMask");
				} catch (err) {
					iLog("GetSecure", err, Log.Type.Error);
				}
			};
			this.SetSecure = function (value) {
				try {
					if (value) {
						input.attr("sValue", "#S" + input.attr("name") + "-sValue#");
						input.attr("sMask", "#S" + input.attr("name") + "-sMask#");
					} else {
						input.removeAttr("sValue");
						input.removeAttr("sMask");
					}
				} catch (err) {
					iLog("SetSecure", err, Log.Type.Error);
				}
			};
			this.GetWidth = function () {
				try {
					return Utilities.ToNumber(input.width());
				} catch (err) {
					iLog("GetWidth", err, Log.Type.Error);
				}
			};
			this.SetWidth = function (value) {
				try {
					input.width(Utilities.ToNumber(value));
					ResizeControl();
				} catch (err) {
					iLog("SetWidth", err, Log.Type.Error);
				}
			};

		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return EditorText;
});

define('page/comp/EditorMemo', ['page/TemplateBase', 'PropertyFields', 'Utilities', 'PageHelper', 'Editor'], function (TemplateBase, PropertyFields, Utilities, PageHelper, Editor) {
	function EditorMemo() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.NameRequired = true;
			this.refClassName = "EdMemo";
			this.Corrected = false;

			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var featuresAdded = false;
			var input = null;
			var span = null;

			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// sizes the control around the textarea element
			function ResizeControl(obj) {
				try {
					iLog("ResizeControl", "Called");

					var w, h;
					if (obj && obj.width && obj.height) {
						w = obj.width();
						h = obj.height();
					} else {
						w = self.GetWidth();
						h = self.GetHeight();
					}

					// Do not update elements which have no or wrong size! (hidden)
					if (w < 1 || h < 1)
						return;
						
					input.width(w).height(h);
					span.width(w).height(h);
					control.css("width", w).css("height", h);
				} catch (err) {
					iLog("ResizeControl", err, Log.Type.Error);
				}
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");
					
					var pref = PageHelper.GetParentRef(control);
					if (pref == "StaticContainer") {
						input.addClass("moving");
						control.draggable({
							containment: "parent",
							cancel: "",
							grid  : MP.Tools.Config.Editor.html.snap,
							start : self.onDragStart,
							stop  : self.onDragStop,
							drag  : self.onDragProgress
						});
						control.resizable({
							autoHide : true,
							grid : MP.Tools.Config.Editor.html.snap,
							resize : ResizeControl,
							stop : ResizeControl
						});
					}
					control.addClass("editing");
					
					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					control.draggable("destroy")
						.resizable("destroy")
						.removeClass("editing");
					input.removeClass("moving");
					
					CleanUp(true);
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			function CleanUp(inEditor) {
				try {
					if (inEditor) {
						var div = control.find('div.ckEditorDiv');
						if (self.GetEditHTML()) {
							if (!div.length) {
								div = $("<div class='ckEditorDiv'/>");
								div.appendTo(control);
							}
							div.html(input.val());
						} else {
							if (div.length)
								div.remove();
						}
					}
					if (!span.hasClass("EditorMemoSpan")) {
						iLog("", "Incompatible element! This page must be resaved by the editor.", Log.Type.Warning);
						span.addClass("EditorMemoSpan");					

						// LK: We should not be removing styles! This is just a temporary correction of old memos!
						span.removeAttr("style");
						input.removeAttr("style");
					}
				} catch (err) {
					iLog("CleanUp", err, Log.Type.Error);
				}
			}
				
			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			// Appends the control to a container element
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control, input, ResizeControl);
					if (Editor.Enabled)
						this.EditMode();
					this.Refresh();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function (ctrlName) {
				try {
					iLog("Create", "Called");
					
					control = $("<div ref='EditorMemo' style='width: 100px; height: 80px;' condition=''/>");
					control.html("<span>" + ctrlName + "</span><textarea id='" + ctrlName + "' name='" + ctrlName + "'></textarea><div class='ckEditorDiv'/></div>");
					control.addClass("component EditorMemo");

					input = control.find("textarea");
					span = control.find("span");
					span.addClass("EditorMemoSpan notRequired");
					span.click(function () {
						input.focus();
					});
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
					this.AttachFunctions();
					
					if (Editor.Enabled)
						return;
						
					var div = control.find('div.ckEditorDiv');
					if (control.attr("EditHTML") == "true") {
						var id = input.attr('id'),
							tt = input.attr('title'),
							old;

						if (div.length != 1) {
							iLog("DefaultMode", "CkEditor incompatible element! This page must be saved by the editor.", Log.Type.Warning);
						} else {
							old = input.detach();
							input = div;
							input.attr('id', id)
								 .attr('title', tt)
								 .show();
						}

						var cke = Global.ConvertToInlineCKEditor(input);
						if (cke) {
							span.remove();
							old.remove();
						} else {
							if (!old)
								return;

							// Failed to convert into CkEditor. Reverse all changes!
							input.remove();
							input = old;
							input.appendTo(control);
						}
						return cke;
					}
					if (control.attr("SpellCheck") == "true") {
						control.append("<div class='MemoSpellButton' title='Spellcheck' onclick='Global.AddSpellcheck(this)'></div>");
						return;
					}

					// It is a normal TEXTAREA, remove the useless DIV
					div.remove();
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
					this.DetachFunctions();

					control.find('div.ckEditorDiv').hide();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					//LK: Do not resize label cause IE adds a vertical scrollbar which hides it too much
					control = $(ControlElement);
					input = $(control.find("textarea"));
					span = $(control.find("span.EditorMemoSpan"));
					if (!span.length)
						span = $(control.find("span"));
					span.click(function () {
						input.focus();
					});
					this.BaseLoad(control, input, ResizeControl);
					
					CleanUp(false);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
					
					ResizeControl();
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.CorrectUI = function () {
				try {
					if (this.Corrected)
						return;
					iLog("CorrectUI", "Called");
					
					//LK: to fix incorrect display if the structure is missaligned from past
					ResizeControl();
					
					this.Corrected = true;
				} catch (err) {
					iLog("CorrectUI", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					var re = this.BaseSearch(str, options);
					if (re) {
						//if (this.GetProperty().search(re) > -1)
						//	iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.GetErrorMessage = function () {
				try {
					if (this.GetRequired()) {
						if (Utilities.Trim(input.val()).length == 0) {
							return "You must enter the field marked '" + span.text() + "'";
						}
						return null;
					}
				} catch (err) {
					iLog("GetErrorMessage", err, Log.Type.Error);
				}
			};
			this.SetFocus = function () {
				try {
					input.focus();
				} catch (err) {
					iLog("SetFocus", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["Name"], this.GetName, this.SetName));
					p.push(new PropertyEd.Property(PropertyFields["Caption"], this.GetCaption, this.SetCaption));
					p.push(new PropertyEd.Property(PropertyFields["Required"], this.GetRequired, this.SetRequired));
					p.push(new PropertyEd.Property(PropertyFields["EditHTML"], this.GetEditHTML, this.SetEditHTML));
					p.push(new PropertyEd.Property(PropertyFields["Spellcheck"], this.GetSpellcheck, this.SetSpellcheck));
					
					return p;
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.GetName = function () {
				try {
					return input.attr("name");
				} catch (err) {
					iLog("GetName", err, Log.Type.Error);
				}
			};
			this.SetName = function (newName) {
				try {
					if (newName != input.attr('id'))
						input.attr('id', newName);
					if (newName != input.attr('name'))
						input.attr('name', newName);
				} catch (err) {
					iLog("SetName", err, Log.Type.Error);
				}
			};			
			this.GetCaption = function () {
				try {
					return span.text();
				} catch (err) {
					iLog("GetCaption", err, Log.Type.Error);
				}
			};			
			this.SetCaption = function (newCaption) {
				try {
					span.text(newCaption);
				} catch (err) {
					iLog("SetCaption", err, Log.Type.Error);
				}
			};			
			this.GetRequired = function () {
				try {
					return span.hasClass("required");
				} catch (err) {
					iLog("GetRequired", err, Log.Type.Error);
				}
			};
			this.SetRequired = function (required) {
				try {
					if (required == true || required == 'true')
						span.removeClass("notRequired").addClass("required");
					else
						span.removeClass("required").addClass("notRequired");
				} catch (err) {
					iLog("SetRequired", err, Log.Type.Error);
				}
			};
			this.GetEditHTML = function () {
				try {
					return control.attr("EditHTML") == "true";
				} catch (err) {
					iLog("GetEditHTML", err, Log.Type.Error);
				}
			};			
			this.SetEditHTML = function (value) {
				try {
					control.attr("EditHTML", value);
				} catch (err) {
					iLog("SetEditHTML", err, Log.Type.Error);
				}
			};			
			this.GetSpellcheck = function () {
				try {
					return control.attr("Spellcheck") == "true";
				} catch (err) {
					iLog("GetSpellcheck", err, Log.Type.Error);
				}
			};			
			this.SetSpellcheck = function (value) {
				try {
					control.attr("Spellcheck", value);
				} catch (err) {
					iLog("SetSpellcheck", err, Log.Type.Error);
				}
			};
			this.GetWidth = function () {
				try {
					return Utilities.ToNumber(control.css("width"));
				} catch (err) {
					iLog("GetWidth", err, Log.Type.Error);
				}
			};
			this.SetWidth = function (value) {
				try {
					control.css("width", Utilities.ToNumber(value));
					ResizeControl();
				} catch (err) {
					iLog("SetWidth", err, Log.Type.Error);
				}
			};
			this.GetHeight = function () {
				try {
					return Utilities.ToNumber(control.css("height"));
				} catch (err) {
					iLog("GetHeight", err, Log.Type.Error);
				}
			};
			this.SetHeight = function (value) {
				try {
					control.css("height", Utilities.ToNumber(value));
					ResizeControl();
				} catch (err) {
					iLog("SetHeight", err, Log.Type.Error);
				}
			};

		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return EditorMemo;
});

define('page/comp/EditorCheckBox', ['page/TemplateBase', 'PropertyFields', 'PageHelper', 'Editor'], function (TemplateBase, PropertyFields, PageHelper, Editor) {
	function EditorCheckBox() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.NameRequired = true;
			this.refClassName = "EdCheckBox";

			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var featuresAdded = false;
			var input = null;
			var span = null;

			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");

					var pref = PageHelper.GetParentRef(control);
					if (pref == "StaticContainer") {
						span.addClass("moving");
						input.addClass("moving");
						control.draggable({
							containment: "parent",
							cancel: "",
							grid  : MP.Tools.Config.Editor.html.snap,
							start : self.onDragStart,
							stop  : self.onDragStop,
							drag  : self.onDragProgress
						});
					}
					control.addClass("editing");
					span.unbind("click");
					
					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");

					control.draggable("destroy")
						.removeClass("editing");
					input.removeClass("moving");
					span.removeClass("moving");
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			
			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			// Appends the control to a container element
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control, input);
					if (Editor.Enabled)
						this.EditMode();
					this.Refresh();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function (ctrlName) {
				try {
					iLog("Create", "Called");
					
					control = $("<div condition=''/>");
					control.html("<input type='checkbox' id='" + ctrlName + "' name='" + ctrlName + "' value='1'><span>" + ctrlName + "</span>");
					control.addClass("component EditorCheckBox");
					control.attr("ref", "EditorCheckBox");
					
					input = control.find("input");
					span = control.find("span");
					span.addClass("notRequired");
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
					this.AttachFunctions();
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
					this.DetachFunctions();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					input = $(control.find("input"));
					span = $(control.find("span"));
					span.css("cursor", "pointer");					
					span.bind("click", function () {
						//input[0].checked = !input[0].checked; LK: Cannot be used :( Causing various page logic problems
						self.SetFocus();
					});

					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					var re = this.BaseSearch(str, options);
					if (re) {
						if (this.GetValue().search(re) > -1)
							iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.GetErrorMessage = function () {
				try {
					if (this.GetRequired()) {
						if (!input[0].checked) {
							return "You must check the box named '" + span.text() + "'";
						}
						return null;
					}
				} catch (err) {
					iLog("GetErrorMessage", err, Log.Type.Error);
				}
			};
			this.SetFocus = function () {
				try {
					input.focus();
				} catch (err) {
					iLog("SetFocus", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["Name"], this.GetName, this.SetName));
					p.push(new PropertyEd.Property(PropertyFields["Caption"], this.GetCaption, this.SetCaption));
					p.push(new PropertyEd.Property(PropertyFields["Value"], this.GetValue, this.SetValue));
					p.push(new PropertyEd.Property(PropertyFields["Required"], this.GetRequired, this.SetRequired));
					p.push(new PropertyEd.Property(PropertyFields["Flipped"], this.GetFlipped, this.SetFlipped));
					
					return p;
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.GetCaption = function () {
				try {
					return span.text();
				} catch (err) {
					iLog("GetCaption", err, Log.Type.Error);
				}
			};
			this.SetCaption = function (newCaption) {
				try {
					span.text(newCaption);
				} catch (err) {
					iLog("SetCaption", err, Log.Type.Error);
				}
			};
			this.GetName = function () {
				try {
					return input.attr("name");
				} catch (err) {
					iLog("GetName", err, Log.Type.Error);
				}
			};
			this.SetName = function (newName) {
				try {
					if (newName != input.attr('id'))
						input.attr('id', newName);
					if (newName != input.attr('name'))
						input.attr('name', newName);
				} catch (err) {
					iLog("SetName", err, Log.Type.Error);
				}
			};
			this.GetRequired = function () {
				try {
					return span.hasClass("required");
				} catch (err) {
					iLog("GetRequired", err, Log.Type.Error);
				}
			};
			this.SetRequired = function (required) {
				try {
					if (required == true || required == 'true')
						span.removeClass("notRequired").addClass("required");
					else
						span.removeClass("required").addClass("notRequired");
				} catch (err) {
					iLog("SetRequired", err, Log.Type.Error);
				}
			};
			this.GetValue = function () {
				try {
					return input.attr("value");
				} catch (err) {
					iLog("GetValue", err, Log.Type.Error);
				}
			};
			this.SetValue = function (newValue) {
				try {
					input.attr("value", newValue);
				} catch (err) {
					iLog("SetValue", err, Log.Type.Error);
				}
			};
			this.GetFlipped = function () {
				try {
					var el = control.find(':first');
					var b = el[0] == span[0];
					return b;
				} catch (err) {
					iLog("GetFlipped", err, Log.Type.Error);
				}
			};
			this.SetFlipped = function (value) {
				try {
					var el = span.detach();
					if (value == true || value == 'true')
						control.prepend(el);
					else
						control.append(el);
				} catch (err) {
					iLog("SetFlipped", err, Log.Type.Error);
				}
			};

			// Catches every error in Editor CheckBox
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return EditorCheckBox;
});

define('page/comp/EditorRadio', ['page/TemplateBase', 'PropertyFields', 'PageHelper', 'Editor'], function (TemplateBase, PropertyFields, PageHelper, Editor) {
	function EditorRadio() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.NameRequired = true;
			this.refClassName = "EdRadio";

			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var featuresAdded = false;
			var input = null;
			var span = null;

			/* PRIVATE METHODS */

			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeature", "Called");
					
					var pref = PageHelper.GetParentRef(control);
					if (pref == "StaticContainer") {
						span.addClass("moving");
						input.addClass("moving");
						control.draggable({
							containment: "parent",
							cancel: "",
							grid  : MP.Tools.Config.Editor.html.snap,
							start : self.onDragStart,
							stop  : self.onDragStop,
							drag  : self.onDragProgress
						});
					}
					control.addClass("editing");
					
					featuresAdded = true;
				} catch (err) {
				iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					control.draggable("destroy")
						.removeClass("editing");
					input.removeClass("moving")
					span.removeClass("moving")
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			
			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			// Appends the control to a container element
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control, input);
					if (Editor.Enabled)
						this.EditMode();
					this.Refresh();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function (ctrlName) {
				try {
					iLog("Create", "Called");
					
					name = ctrlName;
					control = $("<div condition=''/>");
					control.html("<input type='radio' id='" + name + "' name='" + name + "' value='1'><span>" + ctrlName + "</span>");
					control.addClass("component EditorRadio");
					control.attr("ref", "EditorRadio");
					
					input = control.find("input");
					span = control.find("span");
					span.addClass("notRequired");
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
					this.AttachFunctions();
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
					this.DetachFunctions();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					input = $(control.find("input"));
					span = $(control.find("span"));
					span.css("cursor", "pointer");
					span.bind("click", function () {
						//input[0].checked = true; LK: Cannot be used :( Causing various page logic problems
						self.SetFocus();
					});
					this.BaseLoad(control, input);
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					var re = this.BaseSearch(str, options);
					if (re) {
						if (this.GetValue().search(re) > -1)
							iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["ID"], this.GetID, this.SetID));
					p.push(new PropertyEd.Property(PropertyFields["Name"], this.GetName, this.SetName));
					p.push(new PropertyEd.Property(PropertyFields["Caption"], this.GetCaption, this.SetCaption));
					p.push(new PropertyEd.Property(PropertyFields["Value"], this.GetValue, this.SetValue));
					p.push(new PropertyEd.Property(PropertyFields["Required"], this.GetRequired, this.SetRequired));
					p.push(new PropertyEd.Property(PropertyFields["Flipped"], this.GetFlipped, this.SetFlipped));

					return p;
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.GetErrorMessage = function (ser) {
				try {
					if (this.GetRequired()) {
						var name = input.attr("name");
						if (ser.indexOf("&" + name + "=") == -1)
							return "You must choose one of the radios '" + span.text() + "'";
						return null;
					}
				} catch (err) {
					iLog("GetErrorMessage", err, Log.Type.Error);
				}
			};
			this.SetFocus = function () {
				try {
					input.focus();
				} catch (err) {
					iLog("SetFocus", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.GetCaption = function () {
				try {
					return span.text();
				} catch (err) {
					iLog("GetCaption", err, Log.Type.Error);
				}
			};
			this.GetRequired = function () {
				try {
					return span.hasClass("required");
				} catch (err) {
					iLog("GetRequired", err, Log.Type.Error);
				}
			};
			this.GetValue = function () {
				try {
					return input.val();
				} catch (err) {
					iLog("GetValue", err, Log.Type.Error);
				}
			};
			this.SetCaption = function (newCaption) {
				try {
					span.text(newCaption);
				} catch (err) {
					iLog("SetCaption", err, Log.Type.Error);
				}
			};
			this.GetName = function () {
				try {
					return input.attr("name");
				} catch (err) {
					iLog("GetName", err, Log.Type.Error);
				}
			};
			this.SetName = function (value) {
				try {
					input.attr('name', value);
				} catch (err) {
					iLog("SetName", err, Log.Type.Error);
				}
			};			
			this.GetID = function () {
				try {
					return input.attr("id");
				} catch (err) {
					iLog("GetID", err, Log.Type.Error);
				}
			};
			this.SetID = function (value) {
				try {
					input.attr('id', value);
				} catch (err) {
					iLog("SetID", err, Log.Type.Error);
				}
			};			
			this.SetRequired = function (required) {
				try {
					if (required == true || required == 'true')
						span.removeClass("notRequired").addClass("required");
					else
						span.removeClass("required").addClass("notRequired");
				} catch (err) {
					iLog("SetRequired", err, Log.Type.Error);
				}
			};			
			this.SetValue = function (newValue) {
				try {
					input.val(newValue);
				} catch (err) {
					iLog("SetValue", err, Log.Type.Error);
				}
			};
			this.GetFlipped = function () {
				try {
					var el = control.find(':first');
					var b = el[0] == span[0];
					return b;
				} catch (err) {
					iLog("GetFlipped", err, Log.Type.Error);
				}
			};
			this.SetFlipped = function (value) {
				try {
					var el = span.detach();
					if (value == true || value == 'true')
						control.prepend(el);
					else
						control.append(el);
				} catch (err) {
					iLog("SetFlipped", err, Log.Type.Error);
				}
			};

		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return EditorRadio;
});
/*
 END of HTML Control Objects
*/


/*
 BEGIN of Container Objects
*/
define('page/ValidationBase', ['page/comp/ValidatorContainer', 'PropertyFields', 'Utilities', 'PageHelper', 'Editor'], function (Validator, PropertyFields, Utilities, PageHelper, Editor) {
	// This needs rewriting
	
	var ValidationBase = function () {
		this.refClassName = "ValidBase";
		
		var self = this;
		var _control = null;
		var _input = null;
		
		function iLog(Place, Message, Type, Silent) {
			Log.Add(self.refClassName + "." + Place, Message, Type, Silent);
		}
		var applyFilters = function (val, filters, skipValidation, callback, success, error) {
			callback = callback || function (x) {
				return x;
			};
			success = success || $.noop;
			error = error || $.noop;
			
			if (skipValidation || $.trim(val) === '') {
				return success(val);
			};
			
			try {
				$.each(filters, function (i, filter) {
					val = callback(filter, val);
				});
			} catch (err) {
				return error(err);
			}
			
			return success(val);
		}
		var getControl = function (element) {
			var p = $(element).parents(".component")[0];
			return PageHelper.GetEditorComponent(p);
		}
		
		
		this.ValidationBaseLoad = function (ControlElement, InputElement) {
			try {
				_control = ControlElement;
				_input = InputElement;
			} catch (err) {
				iLog("ValidationBaseLoad", err, Log.Type.Error);
			}
		};
		this.FilterInput = function (noDialog) {
			var noVal = this.DatepickerShown || (_input.attr("sMask") && !this.UserUpdate),
				result = null;

			applyFilters(
				_input.val(),
				this.GetFilters(),
				noVal,
				function (filter, val) {
					return filter.FilterText(val);
				},
				function (val) {
					_input.val(val);
				},
				function (err) {
					if (noDialog)
						result = err;
					else {
						var ctrl = PageHelper.GetEditorComponent(_control);
						if (ctrl)
							ctrl.HighlightAsError(true);
						jAlert(err, 'Invalid Entry', function() {
							_input.select();
							_input.focus();
						});
					};
				});
			return result;
		};		
		this.AttachFilter = function () {
			try {
				if (Editor.Enabled)
					return;
				
				$.each(this.GetFilters(), function (i, filter) {
					filter.Attach($(_input));
				});
				_input.bind("change.filter", function () {
					var ctrl = getControl(this);
					ctrl.UserUpdate = true;
				});
				_input.bind("blur.filter", function () {
					var ctrl = getControl(this);
					ctrl.FilterInput();
				});
			} catch (err) {
				iLog("AttachFilter", err, Log.Type.Error);
			}
		};		
		this.DetachFilter = function () {
			try {
				$.each(this.GetFilters(), function (i, filter) {
					filter.Detach($(_input));
				});
				
				_input.unbind(".filter");
			} catch (err) {
				iLog("DetachFilter", err, Log.Type.Error);
			}
		};		
		this.GetValidationProperties = function (properties) {
			try {
				var args = new RulesMaker.ComplexArgs(this.GetValidationProperties, this.AddFilter, this.DeleteFilter);
				switch (_control.attr("Ref")) {
				case "EditorText":
					properties.push(new PropertyEd.Property(PropertyFields["EditorTextFilters"], this.GetFilters, this.SetFilters, args));
					break;
				case "EditorDropdown":
					break;
				}
				return properties;
			} catch (err) {
				iLog("GetValidationProperties", err, Log.Type.Error);
			}
		};
		this.AddFilter = function () {
			try {
				if ((_control.attr("filter") == null) || (_control.attr("filter").length == 0)) {
					_control.attr("filter", "");
					_control.attr("param", "");
					_control.attr("dtype", "");
				} else {
					_control.attr("filter", _control.attr("filter") + "|");
					_control.attr("param", _control.attr("param") + "|");
					_control.attr("dtype", _control.attr("dtype") + "|");
				}
			} catch (err) {
				iLog("AddFilter", err, Log.Type.Error);
			}
		};
		this.DeleteFilter = function (FilterIndex) {
			try {
				if (!_control.attr("filter") || !_control.attr("param") || !_control.attr("dtype"))
					return;

				var val;
				val = _control.attr("filter");
				var filters = (val.match(/|/)) ? val.split("|") : [val];
				filters.splice(FilterIndex, 1);
				_control.attr("filter", filters.toPipeString());

				val = _control.attr("param");
				var params = (val.match(/|/)) ? val.split("|") : [val];
				params.splice(FilterIndex, 1);
				_control.attr("param", params.toPipeString());

				val = _control.attr("dtype");
				var dtypes = (val.match(/|/)) ? val.split("|") : [val];
				dtypes.splice(FilterIndex, 1);
				_control.attr("dtype", dtypes.toPipeString());

				if (_control.attr("filter").length == 0) {
					_control.removeAttr("filter");
					_control.removeAttr("param");
					_control.removeAttr("dtype");
				}
			} catch (err) {
				iLog("DeleteFilter", err, Log.Type.Error);
			}
		};		
		this.GetFilters = function () {
			var filters = _control.attr("filter");
			var dtypes = _control.attr("dtype");
			var params = _control.attr("param");
			
			if (filters == null || filters == "" || dtypes == null || params == null) {
				return [];
			}
			
			var ret = [];
			
			filters = filters.split("|");
			dtypes = dtypes.split("|");
			params = params.split("|");
			
			for (var i = 0; i < filters.length; i++) {
				ret.push(new Filter(filters[i], params[i], dtypes[i]));
			}
			
			return ret;
		};		
		this.SetFilters = function (arr) {
			try {
				var filters = "";
				var params = "";
				var dtypes = "";
				var hasFilters = true;
				var f;
				if (arr.length == 0)
					hasFilters = false;
				if (arr.length == 1) {
					f = Utilities.ReplaceAll(arr[0].Filter, " ", "");
					if (f == "")
						hasFilters = false;
				}
				if (!hasFilters) {
					_control.removeAttr("filter");
					_control.removeAttr("param");
					_control.removeAttr("dtype");
					return;
				}
				for (var i = 0; i < arr.length; i++) {
					f = Utilities.ReplaceAll(arr[i].Filter, " ", "");
					if (f.length > 0) {
						filters += arr[i].Filter + "|";
						params += arr[i].Param + "|";
						dtypes += arr[i].DType + "|";
					}
				}
				if (arr.length > 0) {
					filters = filters.removeLastChar();
					params = params.removeLastChar();
					dtypes = dtypes.removeLastChar();
				}
				_control.attr("filter", filters);
				_control.attr("param", params);
				_control.attr("dtype", dtypes);
			} catch (err) {
				iLog("SetFilters", err, Log.Type.Error);
			}
		};		
		function Filter(filter, param, dtype) {
			this.Filter = filter;
			this.DType = dtype;
			this.Param = param;
			
			this.Callbacks = Validator.Filters[this.Filter];
		}
		
		// Below are too similar for my liking.
		Filter.prototype.FilterText = function (value) {
			var func = this.Callbacks.filter;
			
			if (typeof func !== 'function') {
				return value;
			}
			
			return func(value, this.DType, this.Param);
		};
		
		Filter.prototype.Attach = function ($element) {
			if (typeof this.Callbacks.filter !== 'object' || !this.Callbacks.filter.attach) {
				return;
			}
			
			this.Callbacks.filter.attach($element, this.DType, this.Param);
		};
		
		Filter.prototype.Detach = function ($element) {
			if (typeof this.Callbacks.filter !== 'object' || !this.Callbacks.filter.detach) {
				return;
			}
			
			this.Callbacks.filter.detach($element, this.DType, this.Param);
		};
	};
	
	return ValidationBase;
});

define('page/comp/EditableContent', ['Utilities', 'PageHelper', 'Editor'], function (Utilities, PageHelper, Editor) {
	function EditableContent() {
		try {
			/* PUBLIC PROPERTIES */

			this.NameRequired = false;
			this.Accept = ["StaticContainer", "DynamicContainer", "EditorLabel", "EditorDiv", "TransferList", "ValidationContainer", "ScriptingContainer"];
			this.refClassName = "EditableContent";

			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var featuresAdded = false;

			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				Log.Add(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");
					
					control.droppable({
						accept : Editor.GetAcceptedComponents(self.Accept),
						greedy : true,
						activeClass : 'droppable-active',
						hoverClass : 'droppable-hover',
						drop : function (ev, ui) {
							var ref = $(ui.draggable).attr("ref");
							Editor.BuildComponent(ref, this);
						}
					});
					control.sortable({
						items  : ">.component",
						handle : ">.handle"
					});
					control.disableSelection();

					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					control
						.droppable("destroy")
						.sortable("destroy")
						.removeClass('droppable-active droppable-hover')
						.enableSelection();
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}

			return {
				/* PUBLIC METHODS */
				SetFeatures : function (value) {
				},
				HighlightAsSelected : function (value) {
				},
				HighlightAsFound : function (value) {
				},
				HighlightAsError : function (value) {
				},
				Search : function (str, options) {
				},
				DefaultMode : function () {
					try {
						iLog("DefaultMode", "Called");
						
						RemoveFeatures();
						control.bind("keydown", function (event) {
							if ((event.keyCode == 13) && (!$(event.target).is(':button ,textarea'))) {
								var btn = $(this).find(".EditorSubmitButton input[DefaultButton='true']");
								if (btn.length > 1) {
									iLog("DefaultMode", "There are " + btn.length + " default submit buttons on the page! Submit skipped.", Log.Type.Warning);
									return;
								}									
								var e = new jQuery.Event("click");
								btn.trigger(e);
							}
						});
					} catch (err) {
						iLog("DefaultMode", err, Log.Type.Error);
					}
				},
				EditMode : function () {
					try {
						iLog("EditMode", "Called");
					
						AddFeatures();
					} catch (err) {
						iLog("EditMode", err, Log.Type.Error);
					}
				},
				Load : function (ControlElement) {
					try {
						iLog("Load", "Called");
						
						control = $(ControlElement);
					} catch (err) {
						iLog("Load", err, Log.Type.Error);
					}
				},
				GetControl : function () {
					try {
						return control;
					} catch (err) {
						iLog("GetControl", err, Log.Type.Error);
					}
				},
				Refresh : function () {
					try {
						iLog("Refresh", "Called");
					} catch (err) {
						iLog("Refresh", err, Log.Type.Error);
					}
				}
			};
			/* PRIVATE METHODS */
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return EditableContent;
});

define('page/comp/DynamicContainer', ['page/TemplateBase', 'PropertyFields', 'Utilities', 'PageHelper', 'Editor'], function (TemplateBase, PropertyFields, Utilities, PageHelper, Editor) {
	function DynamicContainer() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.NameRequired = false;
			this.refClassName = "DynamicCont";
			this.Accept = ["DynamicContainer", "StaticContainer", "EditorLabel", "EditorDiv", "TransferList"];

			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var h3 = null;
			var featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");
					
					control.droppable({
						accept : Editor.GetAcceptedComponents(self.Accept),
						greedy : true,
						activeClass : 'droppable-active',
						hoverClass : 'droppable-hover',
						drop : function (ev, ui) {
							var ref = $(ui.draggable).attr("ref");
							Editor.BuildComponent(ref, this);
						}
					});
					control.sortable({
						items : '> .component'
					});
					h3.addClass("moving");
					
					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added
			function RemoveFeatures() {
				try {
					updateVisibility();
					
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					control
						.droppable("destroy")
						.sortable("destroy")
						.removeClass('droppable-active droppable-hover');
					h3.removeClass("moving");
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			function updateVisibility() {
				if (!$.trim(h3.text()))
					h3.css("visibility", "hidden");
				else
					h3.css("visibility", "visible");
			}
			
			var sortForms = {
				dateMDY : function ($element) {
					var mdy = /(\d+)\/(\d+)\/(\d+)/.exec($element.text());
					
					if (!mdy) {
						return $element.text();
					}
					
					// Index 0 is the fully matched text; 1, 2, 3 are the captured groups
					var m = mdy[1];
					var d = mdy[2];
					var y = mdy[3];
					
					var date = new Date(y, m, d);
					
					return date.getTime(); // Numbers order properly with TinySort
				}
			};
			
			// As of 10/26/2011 WIP #10840 stapia@maxprocessing.com
			// Due to the high volume of errors and bugs of TableMaster, the following function was completely overhauled to better
			// handle the Editor environment. Unnecessary loops and hacks have been removed in place of dynamic variables and functions.
			function FormatTableMaster() {
				try {
					var tm = control.find(".TableMaster,.TableMasterSM");
					if (!tm.length)
						return;
					
					//Find each valid TableMaster
					tm.each(function (i) {
						var table = $(this);
						table.attr('cellspacing', 0);
						
						// colspaned records fix
						var headCount = $(table).find('thead > tr > td').length,
							dataCount = $(table).find('tbody > tr > td').length,
							colSpan;
						
						if (dataCount == 1 || dataCount < headCount) {
							var td = $(table).find('tr > td[colspan]');
							td.each(function () {
								$(this).get(0).removeAttribute('colspan');
							});
							
							for (var i = dataCount; i < headCount; i++) {
								$('<td></td>').appendTo($(table).find('tbody > tr'));
							}
							$(tm).find('tbody > tr > td').css({
								'border-right' : 'none'
							});
						};
						
						if (table.attr("wrapped") != "true") {
							table.find("tr:odd").addClass("even");
							table.find("tr").hover(								
								function () {
								$(this).addClass("hover");
							}, function () {
								$(this).removeClass("hover");
							});
							var id = table.attr("id");
							if (id == null || id.length == 0) {
								//FIX for 'no records...' TableMaster with colspans. Alternative to labels. WIP item #7223
								var uID = Utilities.MakeGUID();
								table.attr("id", uID);
								id = uID;
							}
							table.wrap("<div class='TableMasterWrapper'></div>");
							table.attr("wrapped", "true");
							
							superTable(id);
							
							//check for scrollbars. fix for item #9891
							var hBar = false;
							var vBar = false;
							var tbs = control.find(".TableMaster");
							
							//Resizing for horizontal and vertical scrollbars
							var sData = $(this).parent('.sData'),
							sBase = $(this).parent().parent('.sBase'),
							sDataTable = $(this),
							TableMasterWrapper = $(this).parent().parent().parent('.TableMasterWrapper');
							
							//cute lil margins :^)
							TableMasterWrapper.css({
								'margin' : '10px'
							});
							
							sBase.width(TableMasterWrapper.width());
							sData.width(sBase.width());
							sData.height(sDataTable.height());
							TableMasterWrapper.height(sData.height());
							
							if (sData.height() > 190) {
								sData.height(190);
								TableMasterWrapper.height(190 + 20);
							}							
							if (sDataTable.outerWidth(true) > sData.outerWidth(true)) {
								hBar = true;
								TableMasterWrapper.height(TableMasterWrapper.height() + 18);
							}							
							if (sData.height() < sDataTable.height()) {
								vBar = true;
							}							
							if (sDataTable.width() < sData.width() && vBar) {
								sData.width(sDataTable.width() + 18);
							}
						}
					});
					
					//Add the sorting feature for records in TableMaster
					var headerTDs = $('.sHeaderInner').find('table > thead > tr > td');
					// set sort order to ascending by default
					$(headerTDs).attr("sortdir", "asc");
					// call sort when clicked
					if (headerTDs.length) {
						$(headerTDs).each(function () {
							
							var tables = $(this).parent().parent().parent(),
							tdlen = tables.find('thead > tr > td').length;
							$(this).unbind('click');
							$(this).bind('click', function () {
								var so = $(this).attr("sortdir");
								var id = tables.attr("id");
								var attr = $(this).attr("data-sort-attr") || ""; // Sort by data, if given
								
								// data-sort-form identifies a built-in function (e.g. dateMDY) which will
								// transform the data into a more sortable form.
								var sortForm = $(this).attr("data-sort-form");
								
								if (sortForm && Object.prototype.hasOwnProperty.call(sortForms, sortForm)) {
									sortForm = sortForms[sortForm];
									
									attr = attr || "data-sort-form-data";
									
									$(tables).parent().parent().next('.sData').find("tbody > tr > td:nth-child(" + ($(this).index() + 1) + ")").each(function () {
										var $element = $(this);
										
										if (!$element.attr(attr)) {
											$element.attr(attr, sortForm($element));
										}
									});
								}
								
								$(tables).parent().parent().next('.sData').find("tbody>tr").tsort("td:eq(" + $(this).index() + ")", {
									order : so,
									attr : attr
								});
								
								$(tables).parent().parent().next('.sData').find(".even").removeClass("even");
								$(tables).parent().parent().next('.sData').find("tr:odd").addClass("even");
								$(this).attr("sortdir", so == "asc" ? "desc" : "asc");
								$(this).parents("table").find(".asc").removeClass("asc");
								$(this).parents("table").find(".desc").removeClass("desc");
								$(this).addClass(so == "asc" ? "asc" : "desc");
							});
						}); // END TableMaster sorting feature
					}
				} catch (err) {
					iLog("FormatTableMaster", err, Log.Type.Error);
				}
			}

			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			// Appends the control to a container element
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control);
					if (Editor.Enabled)
						this.EditMode();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function () {
				try {
					iLog("Create", "Called");
					
					control = $("<div condition='' class='component DynamicContainer' ref='DynamicContainer'><h3 class='handle'>Dynamic Container</h3></div>");
					h3 = control.find(">h3");
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
					FormatTableMaster();
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					this.BaseLoad(control);
					h3 = $(control.find(">h3"));
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					var re = this.BaseSearch(str, options);
					if (re) {
						//if (this.GetProperty().search(re) > -1)
						//	iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["ID"], this.GetID, this.SetID));
					p.push(new PropertyEd.Property(PropertyFields["Caption"], this.GetCaption, this.SetCaption));
					p.push(new PropertyEd.Property(PropertyFields["Borderless"], this.GetBorderless, this.SetBorderless));
					
					return p;
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.GetID = function () {
				try {
					return control.attr("id");
				} catch (err) {
					iLog("GetID", err, Log.Type.Error);
				}
			};
			this.SetID = function (newID) {
				try {
					control.attr("id", newID);
				} catch (err) {
					iLog("SetID", err, Log.Type.Error);
				}
			};
			this.GetCaption = function () {
				try {
					return h3.text();
				} catch (err) {
					iLog("GetCaption", err, Log.Type.Error);
				}
			};
			this.SetCaption = function (newCaption) {
				try {
					h3.text(newCaption);
					updateVisibility();
				} catch (err) {
					iLog("SetCaption", err, Log.Type.Error);
				}
			};
			this.GetBorderless = function () {
				try {
					return control.hasClass("borderless");
				} catch (err) {
					iLog("GetBorderless", err, Log.Type.Error);
				}
			};
			this.SetBorderless = function (boolValue) {
				try {
					if (boolValue)
						control.addClass("borderless");
					else
						control.removeClass("borderless");
				} catch (err) {
					iLog("SetBorderless", err, Log.Type.Error);
				}
			};
			
		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return DynamicContainer;
});

define('page/comp/StaticContainer', ['page/TemplateBase', 'PropertyFields', 'PageHelper', 'Editor', 'ContextMenu'], function (TemplateBase, PropertyFields, PageHelper, Editor, ContextMenu) {
	function StaticContainer() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();

			/* PUBLIC PROPERTIES */
			this.NameRequired = false;
			this.refClassName = "StaticCont";
			this.Accept = ["StaticContainer", "EditorText", "EditorLabel", "EditorDiv", "EditorDropDown", "EditorMemo", "EditorCheckBox", "EditorSubmitButton", "EditorRadio", "EditorLink", "TransferList"];

			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var h3 = null;
			var featuresAdded = false;
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");
					
					control.droppable({
						accept : Editor.GetAcceptedComponents(self.Accept),
						greedy : true,
						activeClass : 'droppable-active',
						hoverClass : 'droppable-hover',
						drop : function (ev, ui) {
							var ref = $(ui.draggable).attr("ref");
							var pos = {
								left: ui.offset.left - $(this).offset().left,
								top : ui.offset.top - $(this).offset().top
							};
							Editor.BuildComponent(ref, this, pos);
						}
					});
					
					control.delegate(".moving", "mousedown", function () {
						Editor.DisableSelectibleInIE(control, true);
					});
					control.delegate(".moving", "mouseup", function () {
						Editor.DisableSelectibleInIE(control, false);
					});
					var pref = PageHelper.GetParentRef(control);
					if ($.inArray(pref, ["StaticContainer"]) > -1) {
						control.draggable({
							containment : "parent",
							handle: h3,
							grid  : MP.Tools.Config.Editor.html.snap,
							start : self.onDragStart,
							stop  : self.onDragStop
						});
						control.resizable({
							autoHide : true,
							grid : MP.Tools.Config.Editor.html.snap,
							stop : function () {
								var t = Utilities.ToNumber($(this).css("top"));
								$(this).css("top", t + 1);
								var l = Utilities.ToNumber($(this).css("left"));
								$(this).css("left", l + 1);
							}
						});
					};
					control.selectable({
						filter : ".moving",
						cancel: ".handle",
						selected : function (e, ui) {
							var id = PageHelper.GetParentID($(ui.selected));
							var ref = PageHelper.GetParentRef($(ui.selected));
							if (ref != 'StaticContainer')
								PageHelper.AddSelected(id);
						},
						start : function (e, ui) {
							Global.DisableHighlightingInChrome(true);
							PageHelper.ClearSelected();
							ContextMenu.Hide();
						},
						stop : function (e, ui) {
							Global.DisableHighlightingInChrome(false);
						}
					});
					h3.addClass("moving");
					
					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added			
			function RemoveFeatures() {
				try {
					updateVisibility();

					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					control
						.droppable("destroy")
						.draggable("destroy")
						.resizable("destroy")
						.selectable("destroy")
						.removeClass('droppable-active droppable-hover');
					h3.removeClass("moving");

					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			function updateVisibility() {
				if (!$.trim(h3.text()))
					h3.css("visibility", "hidden");
				else
					h3.css("visibility", "visible");
			}
			
			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			// Appends the control to a container element
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control);
					if (Editor.Enabled)
						this.EditMode();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function () {
				try {
					iLog("Create", "Called");
					
					control = $("<div condition='' class='component StaticContainer' ref='StaticContainer'><h3 class='handle'>Static Container</h3></div>");
					h3 = control.find("h3");
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					var re = this.BaseSearch(str, options);
					if (re) {
						//if (this.GetID().search(re) > -1)
						//	iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["ID"], this.GetID, this.SetID));
					p.push(new PropertyEd.Property(PropertyFields["Caption"], this.GetCaption, this.SetCaption));
					p.push(new PropertyEd.Property(PropertyFields["Height"], this.GetHeight, this.SetHeight));

					var pref = PageHelper.GetParentRef(control);
					if (pref == "StaticContainer")
						p.push(new PropertyEd.Property(PropertyFields["Width"], this.GetWidth, this.SetWidth));

					p.push(new PropertyEd.Property(PropertyFields["Borderless"], this.GetBorderless, this.SetBorderless));
					
					return p;
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					this.BaseLoad(control);
					h3 = $(control.find(">h3"));
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.GetBorderless = function () {
				try {
					return control.hasClass("borderless");
				} catch (err) {
					iLog("GetBorderless", err, Log.Type.Error);
				}
			};
			this.SetBorderless = function (boolValue) {
				try {
					if (boolValue)
						control.addClass("borderless");
					else
						control.removeClass("borderless");
				} catch (err) {
					iLog("SetBorderless", err, Log.Type.Error);
				}
			};
			this.GetCaption = function () {
				try {
					return h3.text();
				} catch (err) {
					iLog("GetCaption", err, Log.Type.Error);
				}
			};
			this.SetCaption = function (newCaption) {
				try {
					h3.text(newCaption);
					updateVisibility();
				} catch (err) {
					iLog("SetCaption", err, Log.Type.Error);
				}
			};
			this.GetHeight = function () {
				try {
					return Utilities.ToNumber(control.height());
				} catch (err) {
					iLog("GetHeight", err, Log.Type.Error);
				}
			};
			this.SetHeight = function (newHeight) {
				try {
					control.height(Utilities.ToNumber(newHeight));
				} catch (err) {
					iLog("SetHeight", err, Log.Type.Error);
				}
			};
			this.GetID = function () {
				try {
					return control.attr("id");
				} catch (err) {
					iLog("GetID", err, Log.Type.Error);
				}
			};
			this.SetID = function (newID) {
				try {
					control.attr("id", newID);
				} catch (err) {
					iLog("SetID", err, Log.Type.Error);
				}
			};
			this.GetWidth = function () {
				try {
					return Utilities.ToNumber(control.width());
				} catch (err) {
					iLog("GetWidth", err, Log.Type.Error);
				}
			};
			this.SetWidth = function (newWidth) {
				try {
					control.width(Utilities.ToNumber(newWidth));
				} catch (err) {
					iLog("SetWidth", err, Log.Type.Error);
				}
			};

		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return StaticContainer;
});

define('page/comp/ScriptingContainer', ['page/TemplateBase', 'PropertyFields', 'Utilities', 'PageHelper', 'Editor'], function (TemplateBase, PropertyFields, Utilities, PageHelper, Editor) {
	function ScriptingContainer() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();
			
			/* PUBLIC PROPERTIES */
			this.NameRequired = false;
			this.refClassName = "ScriptCont";

			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var h3 = null;
			var script = null;
			var featuresAdded = false;

			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			function GetFunctions(str) {
				try {
					iLog("GetFunctions", "Called");
					
					str = "\n" + str.substring(str.indexOf("function "), str.length);
					var arr = [];
					
					var fns = str.split(/[\n\r]function /);
					if (!fns)
						return arr;
					
					for (var i = 0; i < fns.length; i++) {
						var fn = fns[i];
							
						var _name = fn.substring(0, fn.indexOf("{"));
						var params = _name.match(/\([^\)]+\)/g);
						if (params == null || params.length == 0)
							params = "";
						else
							params = params[0];
						params = params.replace("(", "").replace(")", "");
						if (_name.indexOf("(") > -1)
							_name = _name.substring(0, _name.indexOf("("));
						if (!_name)
							continue;
						
						var body = fn.substring(fn.indexOf("{") + 1);
						//LK: Removing comments would be great if it works in all cases!
						//body = body.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '');
						body = body.substring(0, body.lastIndexOf("}"));

						var funct = new Script(_name, params, body);
						arr.push(funct);
					}
					return arr;
				} catch (err) {
					iLog("GetFunctions", err, Log.Type.Error);
				}
			}
			function AttachScript(strScript) {
				try {
					iLog("AttachScript", "Called");
					
					var s = $.trim(strScript);
					if (s.beginsWith('('))
						return parseNewCustomScripts(s, true);
					else
						return parseOldCustomScripts(s, true);
				} catch (err) {
					iLog("AttachScript", err, Log.Type.Error, true);
					return err.message;
				}
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");
					
					control
						.css("display", "block")
						.addClass('js-component');
					script
						.css("display", "block");
					h3
						.addClass("moving");
					
					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					h3.removeClass("moving");
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			function ResetScripts() {
				window.CustomScript = null;
				window.CustomScript = {};
			}
			function parseNewCustomScripts(script, clearScripts) {
				try {
					eval(script);
				} catch (err) {
					iLog("parseNewCustomScripts", err.message, Log.Type.Error, true);
					return err.message;
				}
			}
			function parseOldCustomScripts(script, clearScripts) {
				var fns = GetFunctions(script);
				if (!fns.length)
					return;

				if (clearScripts)
					ResetScripts();
				
				var e = '',
					fn = null;
				for (var i = 0; i < fns.length; i++) {
					try {
						fn = fns[i];
						window.CustomScript[fn.Name] = new Function(fn.Params, fn.Body);
					} catch (err) {
						if (fn)
							e = e + fn.Name + " : " + err.message + ", ";
						else
							e = e + err.message + ", ";
					}
				};
				if (e) {
					iLog("parseOldCustomScripts", e, Log.Type.Error, true);
					return e;
				};
			}

			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			// Appends the control to a container element
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control);
					if (Editor.Enabled)
						this.EditMode();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function () {
				try {
					iLog("Create", "Called");
					
					var s =
						'(function() {\n' +
						'  var cs = {}; // Private custom script\n' +
						'  cs.OnLoad = function() {\n' +
						'  	scroll(0,0);\n' +
						'  };\n\n' +
						'  // Publish it\n' +
						'  CustomScript = cs; // Overwrite (default)\n' +
						'  //$.extend(CustomScript, cs); // Append\n' +
						'  //CustomAnything = cs; // Create new\n' +
						'})();\n\n' +
						'//function OnLoad(){scroll(0,0);} // Or delete everything above and use plain functions\n';
					control = $("<div condition='' class='component ScriptingContainer' ref='ScriptingContainer'><h3 class='handle'>Custom Scripts/JS Container</h3><pre>" + s + "</pre></div>");
					h3 = control.find(">h3");
					script = control.find(">pre");
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function (clearScripts) {
				try {
					iLog("DefaultMode", "Called");
					
					$(control).css("display", "none");
					RemoveFeatures();
					
					var s = $.trim(control.find('pre').text());
					if (s.beginsWith('('))
						return parseNewCustomScripts(s, clearScripts);
					else
						return parseOldCustomScripts(s, clearScripts);
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					var re = this.BaseSearch(str, options);
					if (re) {
						if (this.GetScripts().search(re) > -1)
							iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["ID"], this.GetID, this.SetID));
					p.push(new PropertyEd.Property(PropertyFields["Scripts"], this.GetScripts, this.SetScripts));
					
					return p;
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					this.BaseLoad(control);
					h3 = control.find(">h3");
					
					// Find new PRE element first, fallback to an older DIV
					script = control.find(">pre");
					if (!script.length)
						script = control.find(">div");
					
					script.css("display", "none");
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.Show = function (table) {
				iLog("Show", "Called");
				
				control.css("display", "block");
				control.html(table);
			};
			this.Hide = function () {
				iLog("Hide", "Called");
				
				control.html("");
				control.css("display", "none");
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.GetID = function () {
				try {
					return control.attr("id");
				} catch (err) {
					iLog("GetID", err, Log.Type.Error);
				}
			};
			this.SetID = function (newID) {
				try {
					control.attr("id", newID);
				} catch (err) {
					iLog("SetID", err, Log.Type.Error);
				}
			};
			this.GetScripts = function () {
				try {
					//LK: bug when all HTML tags are stripped can't be resolved reading .html()
					return script.text();
				} catch (err) {
					iLog("GetScripts", err, Log.Type.Error);
				}
			};
			this.SetScripts = function (newScripts) {
				try {
					iLog("SetScripts", "Called");
					
					//LK: bug when all HTML tags are stripped can't be resolved reading .html()
					script.text(newScripts);
					
					// Validate the new code
					var err = AttachScript(newScripts);
					if (err)
						jAlert("There are errors:\n" + err + "\nErrors due to #S variables may be OK within the editor.");
					ResetScripts();
				} catch (err) {
					iLog("SetScripts", err, Log.Type.Error);
				}
			};

		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	function Script(name, params, body) {
		this.Name = $.trim(name);
		this.Params = params;
		this.Body = body;
	}
	
	return ScriptingContainer;
});

define('page/comp/ValidationContainer', ['page/TemplateBase', 'PropertyFields', 'PageHelper', 'Editor'], function (TemplateBase, PropertyFields, PageHelper, Editor) {
	function ValidationContainer() {
		try {
			this.inheritFrom = TemplateBase;
			this.inheritFrom();
			
			/* PUBLIC PROPERTIES */
			this.NameRequired = false;
			this.refClassName = "ValidCont";

			/* PRIVATE PROPERTIES */
			var self = this;
			var control = null;
			var featuresAdded = false;
			var h3 = null;
			var body = null;
			var defaultCaption = 'Errors were found, please resolve the following before re-submitting';
			
			/* PRIVATE METHODS */
			
			function iLog(Place, Message, Type, Silent) {
				self.Log(self.refClassName + "." + Place, Message, Type, Silent);
			}
			// adds features to the control based on the rules specified for this type of control
			function AddFeatures() {
				try {
					if (featuresAdded)
						return;
					iLog("AddFeatures", "Called");
					
					control.css("display", "block");
					h3.addClass("moving");
					
					featuresAdded = true;
				} catch (err) {
					iLog("AddFeatures", err, Log.Type.Error);
				}
			}
			// removes features from the control that were previously added
			function RemoveFeatures() {
				try {
					if (!featuresAdded)
						return;
					iLog("RemoveFeatures", "Called");
					
					control.css("display", "none");
					h3.removeClass("moving");
					
					featuresAdded = false;
				} catch (err) {
					iLog("RemoveFeatures", err, Log.Type.Error);
				}
			}
			
			/* PUBLIC METHODS */
			this.SetFeatures = function (value) {
				featuresAdded = value;
			};
			this.Refresh = function () {
				try {
					iLog("Refresh", "Called");
				} catch (err) {
					iLog("Refresh", err, Log.Type.Error);
				}
			};
			// Appends the control to a container element
			this.AppendTo = function (ContainerElement) {
				try {
					iLog("AppendTo", "Called");
					
					$(ContainerElement).append(control);
					this.BaseLoad(control);
					if (Editor.Enabled)
						this.EditMode();
				} catch (err) {
					iLog("AppendTo", err, Log.Type.Error);
				}
			};
			this.Create = function () {
				try {
					iLog("Create", "Called");
					
					control = $("<div condition='' class='component ValidationContainer' ref='ValidationContainer'><h3 class='handle'>" + defaultCaption + "</h3><div/></div>");
					h3 = control.find(">h3");
					body = control.find(">div");
				} catch (err) {
					iLog("Create", err, Log.Type.Error);
				}
			};
			this.DefaultMode = function () {
				try {
					iLog("DefaultMode", "Called");
					
					RemoveFeatures();
				} catch (err) {
					iLog("DefaultMode", err, Log.Type.Error);
				}
			};
			this.EditMode = function () {
				try {
					iLog("EditMode", "Called");
					
					AddFeatures();
				} catch (err) {
					iLog("EditMode", err, Log.Type.Error);
				}
			};
			this.Search = function (str, options) {
				try {
					iLog("Search", "Called", Log.Type.Info);

					var re = this.BaseSearch(str, options);
					if (re) {
						//if (this.GetProperty().search(re) > -1)
						//	iLog("Search", this, Log.Type.Search);
					}
				} catch (err) {
					iLog("Search", err, Log.Type.Error);
				}
			};
			this.GetProperties = function () {
				try {
					iLog("GetProperties", "Called");
					
					var p = this.GetBaseProperties();
					p.push(new PropertyEd.Property(PropertyFields["ID"], this.GetID, this.SetID));
					p.push(new PropertyEd.Property(PropertyFields["Caption"], this.GetCaption, this.SetCaption));
					
					return p;
				} catch (err) {
					iLog("GetProperties", err, Log.Type.Error);
				}
			};
			this.Load = function (ControlElement) {
				try {
					iLog("Load", "Called");
					
					control = $(ControlElement);
					this.BaseLoad(control);
					h3 = control.find(">h3");
					body = control.find(">div");
					if (!body.length) {
						body = $("<div/>");
						control.append(body);
					}
				} catch (err) {
					iLog("Load", err, Log.Type.Error);
				}
			};
			this.Show = function (table) {
				iLog("Show", "Called");
				
				control.css("display", "block");
				body.html(table);

				// Replace the default caption 
				var s = h3.html();
				if (s == '')
					h3.remove();
				
				if (s.match(/Validation Errors/))
					h3.html(defaultCaption);
			};
			this.Hide = function () {
				iLog("Hide", "Called");
				
				body.html("");
				control.css("display", "none");
			};
			this.GetCaption = function () {
				try {
					return h3.text();
				} catch (err) {
					iLog("GetCaption", err, Log.Type.Error);
				}
			};
			this.GetControl = function () {
				try {
					return control;
				} catch (err) {
					iLog("GetControl", err, Log.Type.Error);
				}
			};
			this.GetID = function () {
				try {
					return control.attr("id");
				} catch (err) {
					iLog("GetID", err, Log.Type.Error);
				}
			};
			this.SetCaption = function (newCaption) {
				try {
					h3.text(newCaption);
				} catch (err) {
					iLog("SetCaption", err, Log.Type.Error);
				}
			};
			this.SetID = function (newID) {
				try {
					control.attr("id", newID);
				} catch (err) {
					iLog("SetID", err, Log.Type.Error);
				}
			};

		} catch (err) {
			iLog("Main", err, Log.Type.Error);
		}
	}
	
	return ValidationContainer;
});
/*
 END of Container Objects
*/

/*
 BEGIN of Pre/Post Process Rule Objects
*/
define('rules/BaseComponent', ['PropertyFields', 'RuleXML'], function (PropertyFields, RuleXML) {
	function BaseComponent() {
		/* PUBLIC PROPERTIES */
		this.Type = null;
		this.Icon = null;
		this.OldEntry = null;
		this.OldExit = null;
		
		/* PRIVATE PROPERTIES */
		var logClassName = "BaseComp.";
		var self = this;
		var _node = null;
		var _icon = null;
		
		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(self.GetID() + "." + logClassName + Place, Message, Type, Silent);
		}

		/* PUBLIC METHODS */

		this.BaseCreate = function () {
			try {
				_node = $(RuleXML.GetNewElement('c'));
				_node.append(RuleXML.GetNewElement('n'));
				_node.append(RuleXML.GetNewElement('t'));
				_node.append(RuleXML.GetNewElement('values'));
				_node.append(RuleXML.GetNewElement('j'));
				_node.append(RuleXML.GetNewElement('j'));
				var el;
				el = $(RuleXML.GetNewElement('x'));
				el.text("0");
				_node.append(el);
				el = $(RuleXML.GetNewElement('y'));
				el.text("0");
				_node.append(el);
				_node.append(RuleXML.GetNewElement('c'));
				_node.append(RuleXML.GetNewElement('wp'));
				var s = RuleXML.FindFirstAvailableID();
				_node.find(">n").text(s);
			} catch (err) {
				iLog("BaseCreate", err, Log.Type.Error);
			}
		};
		this.BaseLoad = function (xmlNode) {
			try {
				_node = $(xmlNode);
				this.Type = _node.find(">t").text();
				
				// check for non-existing nodes
				if (_node.find(">c").length == 0)
					_node.append(RuleXML.GetNewElement("c"));
				if (_node.find(">wp").length == 0)
					_node.append(RuleXML.GetNewElement("wp"));
			} catch (err) {
				iLog("BaseLoad", err, Log.Type.Error);
			}
		};
		// performs cleanup for when the component is deleted
		this.Delete = function () {
			var icn = this.GetIcon();
			icn.Delete();
			icn = null;
		};
		this.GetIcon = function () {
			return this.Icon;
		};
		this.GetNode = function () {
			try {
				return _node;
			} catch (err) {
				iLog("GetNode", err, Log.Type.Error);
			}
		};
		this.UpdateWatchpoint = function (clear) {
			try {
				var b = clear ? false : this.GetWatchpoint();
				this.HighlightAsWatchpoint(b);
			} catch (err) {
				iLog("UpdateWatchpoint", err, Log.Type.Error);
			}
		};
		this.ToggleWatchpoint = function () {
			try {
				var b = !this.GetWatchpoint();
				this.SetWatchpoint(b);
				this.HighlightAsWatchpoint(b);
			} catch (err) {
				iLog("ToggleWatchpoint", err, Log.Type.Error);
			}
		};
		this.GetBaseProperties = function () {
			var p = [];
			p.push(new PropertyEd.Property(PropertyFields["Comment"], this.GetComment, this.SetComment));
			p.push(new PropertyEd.Property(PropertyFields["Watchpoint"], this.GetWatchpoint, this.SetWatchpoint));
			
			return p;
		};
		this.GetID = function () {
			try {
				return _node.find(">n").text();
			} catch (err) {
				iLog("GetID", err, Log.Type.Error);
			}
		};
		this.GetComment = function () {
			try {
				return _node.find(">c").text();
			} catch (err) {
				iLog("GetComment", err, Log.Type.Error);
			}
		};
		this.SetComment = function (newValue) {
			try {
				$(_node.find(">c")[0]).text(newValue);
				_icon.UpdateComment();
			} catch (err) {
				iLog("SetComment", err, Log.Type.Error);
			}
		};
		this.GetWatchpoint = function () {
			try {
				return _node.find(">wp").text() == "1";
			} catch (err) {
				iLog("GetWatchpoint", err, Log.Type.Error);
			}
		};
		this.SetWatchpoint = function (newValue) {
			try {
				$(_node.find(">wp")[0]).text(newValue ? "1" : "0");
			} catch (err) {
				iLog("SetWatchpoint", err, Log.Type.Error);
			}
		};
		this.GetJ1 = function () {
			try {
				return $(_node.find(">j")[0]).text();
			} catch (err) {
				iLog("GetJ1", err, Log.Type.Error);
			}
		};
		this.GetX = function () {
			try {
				return parseInt(_node.find(">x").text(), 10);
			} catch (err) {
				iLog("GetX", err, Log.Type.Error);
			}
		};
		this.GetY = function () {
			try {
				return parseInt(_node.find(">y").text(), 10);
			} catch (err) {
				iLog("GetY", err, Log.Type.Error);
			}
		};
		this.SetIcon = function (newIcon) {
			this.Icon = newIcon;
			_icon = newIcon;
		};
		this.SetJ1 = function (newValue) {
			try {
				$(_node.find(">j")[0]).text(newValue);
			} catch (err) {
				iLog("SetJ1", err, Log.Type.Error);
			}
		};
		this.SetType = function (newValue) {
			try {
				$(_node.find(">t")[0]).text(newValue);
			} catch (err) {
				iLog("SetType", err, Log.Type.Error);
			}
		};
		this.SetX = function (newValue) {
			try {
				$(_node.find(">x")[0]).text(Utilities.ToNumber(newValue));
			} catch (err) {
				iLog("SetX", err, Log.Type.Error);
			}
		};
		this.SetY = function (newValue) {
			try {
				$(_node.find(">y")[0]).text(Utilities.ToNumber(newValue));
			} catch (err) {
				iLog("SetY", err, Log.Type.Error);
			}
		};
		this.HighlightAsSelected = function (value) {
			var img = this.Icon.GetImage();
			var cls = "ui-selected";
			img.toggleClass(cls, value);
			this.UpdateWatchpoint(value);
		};
		this.HighlightAsFound = function (value) {
			var img = this.Icon.GetImage();
			img.toggleClass("ui-search", value);
			this.UpdateWatchpoint(value);
		};
		this.HighlightAsError = function (value) {
			var img = this.Icon.GetImage();
			img.toggleClass("ui-error", value);
			this.UpdateWatchpoint(value);
		};
		this.HighlightAsWatchpoint = function (value) {
			var img = this.Icon.GetImage();
			img.toggleClass("ui-watchpoint", value);
		};
		this.HighlightAsConnecting = function (value) {
			var img = this.Icon.GetImage();
			img.toggleClass("ui-connecting", value);
			this.UpdateWatchpoint(value);
		};
	}
	
	return BaseComponent;
});

define('rules/comp/CompiledScriptFunction', ['rules/BaseComponent', 'PropertyFields', 'Utilities', 'RuleXML', 'rules/CDATABatch'], function (BaseComponent, PropertyFields, Utilities, RuleXML, CDATABatch) {
	function CSF() {
		this.inheritFrom = BaseComponent;
		this.inheritFrom();

		this.Src = "../../images/ruleCOMPILEDSCRIPT.png";
		this.Title = "Script Function Component";
		this.ToolTip = "Executes stingray functions";

		var logClassName = "CSF.";
		var self = this;
		var _xmlNode = null;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(self.GetID() + "." + logClassName + Place, Message, Type, Silent);
		}
		function Param(Name, Value) {
			this.Name = Name;
			this.Value = Value;
		}

		/* PUBLIC METHODS */

		this.Create = function () {
			try {
				this.BaseCreate();
				this.SetType("CSF");
				_xmlNode = this.GetNode();
				var val = $(_xmlNode.find('>values')[0]);
				val.append(RuleXML.GetNewElement('n'));
				val.append(RuleXML.GetNewElement('v'));
				val.find(">n").text('GetConstant');
			} catch (err) {
				iLog("Create", err, Log.Type.Error);
			}
		};
		this.Load = function (xmlNode) {
			try {
				_xmlNode = $(xmlNode);
				this.BaseLoad(_xmlNode);
			} catch (err) {
				iLog("Load", err, Log.Type.Error);
			}
		};
		this.Search = function (str, options) {
			try {
				iLog("Search", "Called", Log.Type.Info);
				this.HighlightAsFound(false);
				if (!str)
					return;

				var re = Utilities.MakeRegExp(str, options),
					found = $.grep(this.GetFunction(), function(e){ return e.Value.search(re) > -1; });
				
				if (found.length || this.GetID().search(re) > -1 || this.GetComment().search(re) > -1) {
					iLog("Search", this, Log.Type.Search);
				}
			} catch (err) {
				iLog("Search", err, Log.Type.Error);
			}
		};
		this.AddParam = function () {
			try {
				// Not used
			} catch (err) {
				iLog("AddParam", err, Log.Type.Error);
			}
		};
		this.DeleteFunction = function () {
			try {
				// Not used
			} catch (err) {
				iLog("DeleteFunction", err, Log.Type.Error);
			}
		};
		this.GetProperties = function () {
			try {
				var p = this.GetBaseProperties();
				var args = new RulesMaker.ComplexArgs(this.GetProperties, null, null);
				
				p.push(new PropertyEd.Property(PropertyFields["CompiledScriptFunction"], this.GetFunction, this.SetFunction, args));
				
				return p;
			} catch (err) {
				iLog("GetProperties", err, Log.Type.Error);
			}
		};
		this.GetFunction = function () {
			try {
				var params = [];
				$(_xmlNode.find(">values")[0]).find(">n").each(function () {
					var n = $(this).text();
					var v = $(this).next().text();
					v = v.replace(/''/g, "'");
					params[params.length] = new Param(n, v);
				});
				return params;
			} catch (err) {
				iLog("GetFunction", err, Log.Type.Error);
			}
		};
		this.SetFunction = function (params) {
			try {
				var values = $(_xmlNode.find(">values")[0]);
				values.empty();
				
				$.each(params, function (i, itm) {
					var el, s;
					s = itm.Name;
					el = $(RuleXML.GetNewElement('n'));
					values.append(el);
					el.text(s);

					s = itm.Value || '',
					el = $(RuleXML.GetNewElement('v'));
					values.append(el);
					s = s.replace(/'/g, "''");
					RuleXML.ReplaceCDATA(el, s);
				});
			} catch (err) {
				iLog("SetFunction", err, Log.Type.Error);
			}
		};
	}
	
	return CSF;
});

define('rules/comp/Script', ['rules/BaseComponent', 'PropertyFields', 'RuleXML'], function (BaseComponent, PropertyFields, RuleXML) {
	function SCRIPT() {
		this.inheritFrom = BaseComponent;
		this.inheritFrom();

		this.Src = "../../images/RulePascal.png";
		this.Title = "Scripting Component";
		this.ToolTip = "Add scripting code";

		var logClassName = "Script.";
		var self = this;
		var _xmlNode = null;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place + "." + self.GetID(), Message, Type, Silent);
		}

		/* PUBLIC METHODS */

		this.Create = function () {
			try {
				this.BaseCreate();
				this.SetType("SCRIPT");
				_xmlNode = this.GetNode();
				var values = $(_xmlNode.find('>values')[0]);
				values.append(RuleXML.GetNewElement('v'));
				values.append(RuleXML.GetNewElement('lng'));
			} catch (err) {
				iLog("Create", err, Log.Type.Error);
			}
		};
		this.Load = function (xmlNode) {
			try {
				_xmlNode = $(xmlNode);
				this.BaseLoad(_xmlNode);

				// check for non-existing Language node
				if (_xmlNode.find(">values>lng").length == 0) {
					var v = _xmlNode.find('>values');
					v.append(RuleXML.GetNewElement('lng'));
				}
			} catch (err) {
				iLog("Load", err, Log.Type.Error);
			}
		};
		this.Search = function (str, options) {
			try {
				iLog("Search", "Called", Log.Type.Info);
				this.HighlightAsFound(false);
				if (!str)
					return;

				var re = Utilities.MakeRegExp(str, options);
				if (this.GetID().search(re) > -1 || this.GetComment().search(re) > -1 || this.GetScript().search(re) > -1) {
					iLog("Search", this, Log.Type.Search);
				}
			} catch (err) {
				iLog("Search", err, Log.Type.Error);
			}
		};
		this.GetProperties = function () {
			try {
				var p = this.GetBaseProperties();
				p.push(new PropertyEd.Property(PropertyFields["Language"], this.GetLanguage, this.SetLanguage));
				p.push(new PropertyEd.Property(PropertyFields["SCRIPT"], this.GetScript, this.SetScript));
				
				return p;
			} catch (err) {
				iLog("GetProperties", err, Log.Type.Error);
			}
		};
		this.GetScript = function () {
			try {
				return $(_xmlNode.find(">values>v")[0]).text();
			} catch (err) {
				iLog("GetScript", err, Log.Type.Error);
			}
		};
		this.SetScript = function (value) {
			try {
				RuleXML.ReplaceCDATA(_xmlNode.find(">values>v")[0], value);
			} catch (err) {
				iLog("SetScript", err, Log.Type.Error);
			}
		};
		this.GetLanguage = function () {
			try {
				var value = $(_xmlNode.find(">values>lng")[0]).text();
				if (value == 'Pascal')
					value = 'Server Script';
				return value;
			} catch (err) {
				iLog("GetLanguage", err, Log.Type.Error);
			}
		};
		this.SetLanguage = function (value) {
			try {
				if (value == 'Server Script')
					value = 'Pascal';
				$(_xmlNode.find(">values>lng")[0]).text(value);
			} catch (err) {
				iLog("SetLanguage", err, Log.Type.Error);
			}
		};
	}
	
	return SCRIPT;
});

define('rules/comp/SqlTrn', ['rules/BaseComponent', 'PropertyFields', 'RuleXML'], function (BaseComponent, PropertyFields, RuleXML) {
	function SQLTRN() {
		this.inheritFrom = BaseComponent;
		this.inheritFrom();

		this.Src = "../../images/RuleSqlTrn.png";
		this.Title = "SQL Transaction Component";
		this.ToolTip = "Add SQL Transaction";

		var logClassName = "SqlTrn.";
		var self = this;
		var _xmlNode = null;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place + "." + self.GetID(), Message, Type, Silent);
		}

		/* PUBLIC METHODS */

		this.Create = function () {
			try {
				this.BaseCreate();
				this.SetType("SQLTRN");
				_xmlNode = this.GetNode();
				var values = $(_xmlNode.find('>values')[0]);
				values.append(RuleXML.GetNewElement('n'));
				values.append(RuleXML.GetNewElement('t'));
			} catch (err) {
				iLog("Create", err, Log.Type.Error);
			}
		};
		this.Load = function (xmlNode) {
			try {
				_xmlNode = $(xmlNode);
				this.BaseLoad(_xmlNode);
			} catch (err) {
				iLog("Load", err, Log.Type.Error);
			}
		};
		this.Search = function (str, options) {
			try {
				iLog("Search", "Called", Log.Type.Info);
				this.HighlightAsFound(false);
				if (!str)
					return;

				var re = Utilities.MakeRegExp(str, options);
				if (this.GetID().search(re) > -1 || this.GetComment().search(re) > -1 || this.GetSqlTrnName().search(re) > -1 || this.GetSqlTrnType().search(re) > -1) {
					iLog("Search", this, Log.Type.Search);
				}
			} catch (err) {
				iLog("Search", err, Log.Type.Error);
			}
		};
		this.GetProperties = function () {
			try {
				var p = this.GetBaseProperties();
				p.push(new PropertyEd.Property(PropertyFields["SqlTrnName"], this.GetSqlTrnName, this.SetSqlTrnName));
				p.push(new PropertyEd.Property(PropertyFields["SqlTrnType"], this.GetSqlTrnType, this.SetSqlTrnType));
				
				return p;
			} catch (err) {
				iLog("GetProperties", err, Log.Type.Error);
			}
		};
		this.GetSqlTrnName = function () {
			try {
				return $(_xmlNode.find(">values>n")[0]).text();
			} catch (err) {
				iLog("GetSqlTrnName", err, Log.Type.Error);
			}
		};
		this.SetSqlTrnName = function (value) {
			try {
				$(_xmlNode.find(">values>n")[0]).text(value);
			} catch (err) {
				iLog("SetSqlTrnName", err, Log.Type.Error);
			}
		};
		this.GetSqlTrnType = function () {
			try {
				return $(_xmlNode.find(">values>t")[0]).text();
			} catch (err) {
				iLog("GetSqlTrnType", err, Log.Type.Error);
			}
		};
		this.SetSqlTrnType = function (value) {
			try {
				$(_xmlNode.find(">values>t")[0]).text(value);
			} catch (err) {
				iLog("SetSqlTrnType", err, Log.Type.Error);
			}
		};
	}
	
	return SQLTRN;
});

define('rules/comp/Error', ['rules/BaseComponent', 'PropertyFields', 'RuleXML'], function (BaseComponent, PropertyFields, RuleXML) {
	function ERROR() {
		this.inheritFrom = BaseComponent;
		this.inheritFrom();

		this.Src = "../../images/RuleERROR.png";
		this.Title = "ERROR Component";
		this.ToolTip = "Displays an html message to the user when an error occurs";

		var logClassName = "Error.";
		var self = this;
		var _xmlNode = null;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place + "." + self.GetID(), Message, Type, Silent);
		}

		/* PUBLIC METHODS */

		this.Create = function () {
			try {
				this.BaseCreate();
				this.SetType("ERROR");
				_xmlNode = this.GetNode();
				var values = $(_xmlNode.find('>values')[0]);
				values.append(RuleXML.GetNewElement('v'));
			} catch (err) {
				iLog("Create", err, Log.Type.Error);
			}
		};
		this.Load = function (xmlNode) {
			try {
				_xmlNode = $(xmlNode);
				this.BaseLoad(_xmlNode);
			} catch (err) {
				iLog("Load", err, Log.Type.Error);
			}
		};
		this.Search = function (str, options) {
			try {
				iLog("Search", "Called", Log.Type.Info);
				this.HighlightAsFound(false);
				if (!str)
					return;

				var re = Utilities.MakeRegExp(str, options);
				if (this.GetID().search(re) > -1 || this.GetComment().search(re) > -1 || this.GetErrorMessage().search(re) > -1) {
					iLog("Search", this, Log.Type.Search);
				}
			} catch (err) {
				iLog("Search", err, Log.Type.Error);
			}
		};
		this.GetProperties = function () {
			try {
				var p = this.GetBaseProperties();
				p.push(new PropertyEd.Property(PropertyFields["ErrorMessage"], this.GetErrorMessage, this.SetErrorMessage));

				return p;
			} catch (err) {
				iLog("GetProperties", err, Log.Type.Error);
			}
		};
		this.GetErrorMessage = function () {
			try {
				return $(_xmlNode.find(">values>v")[0]).text();
			} catch (err) {
				iLog("GetErrorMessage", err, Log.Type.Error);
			}
		};
		this.SetErrorMessage = function (newErrorMessage) {
			try {
				RuleXML.ReplaceCDATA(_xmlNode.find(">values>v")[0], newErrorMessage);
			} catch (err) {
				iLog("SetErrorMessage", err, Log.Type.Error);
			}
		};
		this.SetJ1 = null;
	}
	
	return ERROR;
});

define('rules/comp/External', ['rules/BaseComponent', 'PropertyFields', 'RuleXML'], function (BaseComponent, PropertyFields, RuleXML) {
	function EXTERNAL() {
		this.inheritFrom = BaseComponent;
		this.inheritFrom();

		this.Title = "External Component";
		this.ToolTip = "Delivers a template to the specified screen target after executing the pre-process function";
		this.Src = "../../images/RuleEXTERNAL.png";

		var logClassName = "External.";
		var self = this;
		var _xmlNode = null;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place + "." + self.GetID(), Message, Type, Silent);
		}

		/* PUBLIC METHODS */

		this.Create = function () {
			try {
				this.BaseCreate();
				this.SetType("EXTERNAL");
				_xmlNode = this.GetNode();
				var values = $(_xmlNode.find('>values')[0]);
				values.append(RuleXML.GetNewElement('n'));
			} catch (err) {
				iLog("Create", err, Log.Type.Error);
			}
		};
		this.Load = function (xmlNode) {
			try {
				_xmlNode = $(xmlNode);
				this.BaseLoad(_xmlNode);
			} catch (err) {
				iLog("Load", err, Log.Type.Error);
			}
		};
		this.Search = function (str, options) {
			try {
				iLog("Search", "Called", Log.Type.Info);
				this.HighlightAsFound(false);
				if (!str)
					return;

				var re = Utilities.MakeRegExp(str, options);
				if (this.GetID().search(re) > -1 || this.GetComment().search(re) > -1 || this.GetRuleName().search(re) > -1) {
					iLog("Search", this, Log.Type.Search);
				}
			} catch (err) {
				iLog("Search", err, Log.Type.Error);
			}
		};
		this.GetProperties = function () {
			try {
				var p = this.GetBaseProperties();
				p.push(new PropertyEd.Property(PropertyFields["RuleName"], this.GetRuleName, this.SetRuleName));
				
				return p;
			} catch (err) {
				iLog("GetProperties", err, Log.Type.Error);
			}
		};
		this.GetRuleName = function () {
			try {
				return $(_xmlNode.find(">values>n")[0]).text();
			} catch (err) {
				iLog("GetRuleName", err, Log.Type.Error);
			}
		};
		this.SetRuleName = function (newRuleName) {
			try {
				$(_xmlNode.find(">values>n")[0]).text(newRuleName);
			} catch (err) {
				iLog("SetRuleName", err, Log.Type.Error);
			}
		};
	}
	
	return EXTERNAL;
});

define('rules/comp/If', ['rules/BaseComponent', 'PropertyFields', 'RuleXML'], function (BaseComponent, PropertyFields, RuleXML) {
	function IF() {
		this.inheritFrom = BaseComponent;
		this.inheritFrom();

		this.Src = "../../images/RuleIF.png";
		this.Title = "IF Component";
		this.ToolTip = "Makes a binary decision to determine which of two components will be called next";
		
		var logClassName = "IF.";
		var self = this;
		var _xmlNode = null;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place + "." + self.GetID(), Message, Type, Silent);
		}

		/* PUBLIC METHODS */

		this.Create = function () {
			try {
				this.BaseCreate();
				this.SetType("IF");
				_xmlNode = this.GetNode();
				var values = $(_xmlNode.find('>values')[0]);
				values.append(RuleXML.GetNewElement('v'));
			} catch (err) {
				iLog("Create", err, Log.Type.Error);
			}
		};
		this.Load = function (xmlNode) {
			try {
				_xmlNode = $(xmlNode);
				this.BaseLoad(_xmlNode);
			} catch (err) {
				iLog("Load", err, Log.Type.Error);
			}
		};
		this.Search = function (str, options) {
			try {
				iLog("Search", "Called", Log.Type.Info);
				this.HighlightAsFound(false);
				if (!str)
					return;

				var re = Utilities.MakeRegExp(str, options);
				if (this.GetID().search(re) > -1 || this.GetComment().search(re) > -1 || this.GetSvrCondition().search(re) > -1) {
					iLog("Search", this, Log.Type.Search);
				}
			} catch (err) {
				iLog("Search", err, Log.Type.Error);
			}
		};
		this.GetProperties = function () {
			try {
				var p = this.GetBaseProperties();
				p.push(new PropertyEd.Property(PropertyFields["SvrCondition"], this.GetSvrCondition, this.SetSvrCondition));

				return p;
			} catch (err) {
				iLog("GetProperties", err, Log.Type.Error);
			}
		};
		this.GetSvrCondition = function () {
			try {
				var s = $(_xmlNode.find(">values>v")[0]).text();
				return s.replace(/''/g, "'");
			} catch (err) {
				iLog("GetSvrCondition", err, Log.Type.Error);
			}
		};
		this.SetSvrCondition = function (newCondition) {
			try {
				var s = newCondition.replace(/'/g, "''");
				var cdata = RuleXML.GetNewCDATA(s);
				var elem = RuleXML.GetNewElement('v');
				$(elem).append(cdata);
				_xmlNode.find('>values')[0].replaceChild(elem, _xmlNode.find(">values>v")[0]);
			} catch (err) {
				iLog("SetSvrCondition", err, Log.Type.Error);
			}
		};
		this.GetJ2 = function () {
			try {
				return $(_xmlNode.find(">j")[1]).text();
			} catch (err) {
				iLog("GetJ2", err, Log.Type.Error);
			}
		};
		this.SetJ2 = function (newValue) {
			try {
				$(_xmlNode.find(">j")[1]).text(newValue);
			} catch (err) {
				iLog("SetJ2", err, Log.Type.Error);
			}
		};
	}
	
	return IF;
});

define('rules/comp/InsertUpdateQuery', ['rules/BaseComponent', 'PropertyFields', 'Utilities', 'RuleXML'], function (BaseComponent, PropertyFields, Utilities, RuleXML) {
	function INSERTUPDATEQUERY() {
		this.inheritFrom = BaseComponent;
		this.inheritFrom();

		this.Src = "../../images/RuleINSERTUPDATEQUERY.png";
		this.Title = "Insert / Update Query Component";
		this.ToolTip = "Performs a SQL Insert or Update command";

		var logClassName = "InsertUpdateQuery.";
		var self = this;
		var _xmlNode = null;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place + "." + self.GetID(), Message, Type, Silent);
		}
		function QueryParam(Name, Type, Value) {
			this.Name = Name;
			this.Type = Type;
			this.Value = Value;
		}

		/* PUBLIC METHODS */

		this.Create = function () {
			try {
				this.BaseCreate();
				this.SetType("INSERTUPDATEQUERY");
				_xmlNode = this.GetNode();
				var values = $(_xmlNode.find('>values')[0]);
				values.append(RuleXML.GetNewElement('query'));
			} catch (err) {
				iLog("Create", err, Log.Type.Error);
			}
		};
		this.Load = function (xmlNode) {
			try {
				_xmlNode = $(xmlNode);
				this.BaseLoad(_xmlNode);
			} catch (err) {
				iLog("Load", err, Log.Type.Error);
			}
		};
		this.AddParam = function (paramObj) {
			try {
				var values = $(_xmlNode.find(">values")[0]);
				var param = $(RuleXML.GetNewElement('param'));
				var elm;
				
				elm = RuleXML.GetNewElement('n');
				param.append(elm);
				if (paramObj)
					$(elm).text(Utilities.Trim(paramObj.Name));
				
				elm = RuleXML.GetNewElement('t');
				param.append(elm);
				if (paramObj)
					$(elm).text(Utilities.Trim(paramObj.Type));

				elm = RuleXML.GetNewElement('v');
				param.append(elm);
				if (paramObj)
					$(elm).html(RuleXML.GetNewCDATA(Utilities.Trim(paramObj.Value)));
				
				values.append(param);
			} catch (err) {
				iLog("AddParam", err, Log.Type.Error);
			}
		};
		this.DeleteParam = function (ParamIndex) {
			try {
				var toRemove = _xmlNode.find(">values>param")[ParamIndex];
				toRemove.parentNode.removeChild(toRemove);
			} catch (err) {
				iLog("DeleteParam", err, Log.Type.Error);
			}
		};
		this.Search = function (str, options) {
			try {
				iLog("Search", "Called", Log.Type.Info);
				this.HighlightAsFound(false);
				if (!str)
					return;

				var re = Utilities.MakeRegExp(str, options);
				if (this.GetID().search(re) > -1 || this.GetComment().search(re) > -1 || this.GetQuery().search(re) > -1) {
					iLog("Search", this, Log.Type.Search);
					return;
				};
				var arr = this.GetQueryParams();
				for (var i = 0; i < arr.length; i++) {
					if (arr[i].Name.search(re) > -1 || arr[i].Value.search(re) > -1) {
						iLog("Search", this, Log.Type.Search);
						return;
					}
				}
			} catch (err) {
				iLog("Search", err, Log.Type.Error);
			}
		};
		this.GetProperties = function () {
			try {
				var p = this.GetBaseProperties();
				p.push(new PropertyEd.Property(PropertyFields["Query"], this.GetQuery, this.SetQuery));
				var args = new RulesMaker.ComplexArgs(this.GetProperties, null, null);
				p.push(new PropertyEd.Property(PropertyFields["QueryParams"], this.GetQueryParams, this.SetQueryParams, args));

				return p;
			} catch (err) {
				iLog("GetProperties", err, Log.Type.Error);
			}
		};
		this.GetQuery = function () {
			try {
				var s = $(_xmlNode.find(">values>query")[0]).text();
				return s.replace(/''/g, "'");
			} catch (err) {
				iLog("GetQuery", err, Log.Type.Error);
			}
		};
		this.SetQuery = function (newQuery) {
			try {
				var s = newQuery.replace(/'/g, "''");
				var cdata = RuleXML.GetNewCDATA(s);
				var elem = RuleXML.GetNewElement('query');
				$(elem).append(cdata);
				_xmlNode.find('>values')[0].replaceChild(elem, _xmlNode.find(">values>query")[0]);
			} catch (err) {
				iLog("SetQuery", err, Log.Type.Error);
			}
		};
		this.GetQueryParams = function () {
			try {
				var params = [];
				_xmlNode.find(">values>param").each(function () {
					var param = $(this);
					var n = param.find(">n").text();
					var t = param.find(">t").text().toUpperCase();
					var v = param.find(">v").text();
					params.push(new QueryParam(n, t, v));
				});
				return params;
			} catch (err) {
				iLog("GetQueryParams", err, Log.Type.Error);
			}
		};
		this.SetQueryParams = function (params) {
			try {
				var i, j, n1, n2;
				var names = [];
				
				// Clean the XML
				var old = _xmlNode.find(">values>param");
				for (i = 0; i < old.length; i++)
					self.DeleteParam(0);
				
				// Add only parameters with a name
				for (i = 0; i < params.length; i++) {
					n1 = Utilities.Trim(params[i].Name);
					if (n1) {
						self.AddParam(params[i]);
						names.push(n1);
					}
				}
				// Check they are unique
				for (i = 0; i < names.length; i++) {
					n1 = names[i].toUpperCase();
					for (j = 0; j < names.length; j++) {
						n2 = names[j].toUpperCase();
						if (j != i && n2 == n1) {
							jAlert("The parameter '" + names[i] + "' is used more than once!");
							return;
						}
					}
				}
			} catch (err) {
				iLog("SetQueryParams", err, Log.Type.Error);
			}
		};
	}
	
	return INSERTUPDATEQUERY;
});

define('rules/comp/Math', ['rules/BaseComponent', 'PropertyFields', 'RuleXML'], function (BaseComponent, PropertyFields, RuleXML) {
	function MATH() {
		this.inheritFrom = BaseComponent;
		this.inheritFrom();

		this.Src = "../../images/RuleMATH.png";
		this.Title = "Math Component";
		this.ToolTip = "Create, modify, or delete multiple variables with mathematical expressions";

		var logClassName = "Math.";
		var self = this;
		var _xmlNode = null;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place + "." + self.GetID(), Message, Type, Silent);
		}
		function Param(name, format, value) {
			this.Name = name;
			this.Format = format;
			this.Value = value;
		}

		/* PUBLIC METHODS */

		this.Create = function () {
			try {
				this.BaseCreate();
				this.SetType("MATH");
				_xmlNode = this.GetNode();
				var values = $(_xmlNode.find('>values')[0]);
				values.append(RuleXML.GetNewElement('n'));
				values.append(RuleXML.GetNewElement('f'));
				values.append(RuleXML.GetNewElement('v'));
			} catch (err) {
				iLog("Create", err, Log.Type.Error);
			}
		};
		this.Load = function (xmlNode) {
			try {
				_xmlNode = $(xmlNode);
				this.BaseLoad(_xmlNode);
			} catch (err) {
				iLog("Load", err, Log.Type.Error);
			}
		};
		this.AddParam = function (paramObj) {
			try {
				var values = $(_xmlNode.find(">values")[0]);
				var elm;
				
				elm = RuleXML.GetNewElement('n');
				values.append(elm);
				if (paramObj)
					$(elm).text(Utilities.Trim(paramObj.Name));
				
				elm = RuleXML.GetNewElement('f');
				values.append(elm);
				if (paramObj)
					$(elm).text(Utilities.Trim(paramObj.Format));
				
				elm = RuleXML.GetNewElement('v');
				values.append(elm);
				if (paramObj)
					$(elm).text(paramObj.Value);
			} catch (err) {
				iLog("AddParam", err, Log.Type.Error);
			}
		};
		this.DeleteParam = function (ParamIndex) {
			try {
				var n = _xmlNode.find(">values>n")[ParamIndex];
				var f = _xmlNode.find(">values>f")[ParamIndex];
				var v = _xmlNode.find(">values>v")[ParamIndex];
				n.parentNode.removeChild(n);
				f.parentNode.removeChild(f);
				v.parentNode.removeChild(v);
			} catch (err) {
				iLog("DeleteParam", err, Log.Type.Error);
			}
		};
		this.Search = function (str, options) {
			try {
				iLog("Search", "Called", Log.Type.Info);
				this.HighlightAsFound(false);
				if (!str)
					return;

				var re = Utilities.MakeRegExp(str, options);
				if (this.GetID().search(re) > -1 || this.GetComment().search(re) > -1) {
					iLog("Search", this, Log.Type.Search);
					return;
				};
				var arr = this.GetParams();
				for (var i = 0; i < arr.length; i++) {
					if (arr[i].Name.search(re) > -1 || arr[i].Value.search(re) > -1) {
						iLog("Search", this, Log.Type.Search);
						return;
					}
				}
			} catch (err) {
				iLog("Search", err, Log.Type.Error);
			}
		};
		this.GetProperties = function () {
			try {
				var p = this.GetBaseProperties();
				var args = new RulesMaker.ComplexArgs(this.GetProperties, null, null);
				p.push(new PropertyEd.Property(PropertyFields["MathParams"], this.GetParams, this.SetParams, args));

				return p;
			} catch (err) {
				iLog("GetProperties", err, Log.Type.Error);
			}
		};
		this.GetParams = function () {
			try {
				var params = [];
				_xmlNode.find(">values>n").each(function () {
					var n = $(this).text();
					var f = $(this).next().text();
					var v = $(this).next().next().text();
					params[params.length] = new Param(n, f, v);
				});
				return params;
			} catch (err) {
				iLog("GetParams", err, Log.Type.Error);
			}
		};
		this.SetParams = function (params) {
			try {
				var i, n1;
				
				// Clean the XML
				var old = _xmlNode.find(">values>n");
				for (i = 0; i < old.length; i++)
					self.DeleteParam(0);
				
				// Add only parameters with a name
				for (i = 0; i < params.length; i++) {
					n1 = Utilities.Trim(params[i].Name);
					if (n1)
						self.AddParam(params[i]);
				}
			} catch (err) {
				iLog("SetParams", err, Log.Type.Error);
			}
		};
	}
	
	return MATH;
});

define('rules/comp/SelectQuery', ['rules/BaseComponent', 'PropertyFields', 'Utilities', 'RuleXML'], function (BaseComponent, PropertyFields, Utilities, RuleXML) {
	function SELECTQUERY() {
		this.inheritFrom = BaseComponent;
		this.inheritFrom();

		this.Src = "../../images/RuleSELECTQUERY.png";
		this.Title = "Select Query Component";
		this.ToolTip = "Performs a SQL select with parameters";

		var logClassName = "SelectQuery.";
		var self = this;
		var _xmlNode = null;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place + "." + self.GetID(), Message, Type, Silent);
		}
		function QueryParam(Name, Type, Value) {
			this.Name = Name;
			this.Type = Type;
			this.Value = Value;
		}

		/* PUBLIC METHODS */

		this.Create = function () {
			try {
				this.BaseCreate();
				this.SetType("SELECTQUERY");
				_xmlNode = this.GetNode();
				var values = $(_xmlNode.find('>values')[0]);
				values.append(RuleXML.GetNewElement('query'));
			} catch (err) {
				iLog("Create", err, Log.Type.Error);
			}
		};
		this.Load = function (xmlNode) {
			try {
				_xmlNode = $(xmlNode);
				this.BaseLoad(_xmlNode);
			} catch (err) {
				iLog("Load", err, Log.Type.Error);
			}
		};
		this.AddParam = function (paramObj) {
			try {
				var values = $(_xmlNode.find(">values")[0]);
				var param = $(RuleXML.GetNewElement('param'));
				var elm;
				
				elm = RuleXML.GetNewElement('n');
				param.append(elm);
				if (paramObj)
					$(elm).text(Utilities.Trim(paramObj.Name));
				
				elm = RuleXML.GetNewElement('t');
				param.append(elm);
				if (paramObj)
					$(elm).text(Utilities.Trim(paramObj.Type));

				elm = RuleXML.GetNewElement('v');
				param.append(elm);
				if (paramObj)
					$(elm).html(RuleXML.GetNewCDATA(Utilities.Trim(paramObj.Value)));
				
				values.append(param);
			} catch (err) {
				iLog("AddParam", err, Log.Type.Error);
			}
		};
		this.DeleteParam = function (ParamIndex) {
			try {
				var toRemove = _xmlNode.find(">values>param")[ParamIndex];
				toRemove.parentNode.removeChild(toRemove);
			} catch (err) {
				iLog("DeleteParam", err, Log.Type.Error);
			}
		};
		this.Search = function (str, options) {
			try {
				iLog("Search", "Called", Log.Type.Info);
				this.HighlightAsFound(false);
				if (!str)
					return;

				var re = Utilities.MakeRegExp(str, options);
				if (this.GetID().search(re) > -1 || this.GetComment().search(re) > -1 || this.GetQuery().search(re) > -1) {
					iLog("Search", this, Log.Type.Search);
					return;
				};
				var arr = this.GetQueryParams();
				for (var i = 0; i < arr.length; i++) {
					if (arr[i].Name.search(re) > -1 || arr[i].Value.search(re) > -1) {
						iLog("Search", this, Log.Type.Search);
						return;
					}
				}
			} catch (err) {
				iLog("Search", err, Log.Type.Error);
			}
		};
		this.GetProperties = function () {
			try {
				var p = this.GetBaseProperties();
				p.push(new PropertyEd.Property(PropertyFields["Query"], this.GetQuery, this.SetQuery));
				var args = new RulesMaker.ComplexArgs(this.GetProperties, null, null);
				p.push(new PropertyEd.Property(PropertyFields["QueryParams"], this.GetQueryParams, this.SetQueryParams, args));

				return p;
			} catch (err) {
				iLog("GetProperties", err, Log.Type.Error);
			}
		};
		this.GetJ2 = function () {
			try {
				return $(_xmlNode.find(">j")[1]).text();
			} catch (err) {
				iLog("GetJ2", err, Log.Type.Error);
			}
		};
		this.SetJ2 = function (newValue) {
			try {
				$(_xmlNode.find(">j")[1]).text(newValue);
			} catch (err) {
				iLog("SetJ2", err, Log.Type.Error);
			}
		};
		this.GetQuery = function () {
			try {
				var s = $(_xmlNode.find(">values>query")[0]).text();
				return s.replace(/''/g, "'");
			} catch (err) {
				iLog("GetQuery", err, Log.Type.Error);
			}
		};
		this.SetQuery = function (newQuery) {
			try {
				var s = newQuery.replace(/'/g, "''");
				var cdata = RuleXML.GetNewCDATA(s);
				var elem = RuleXML.GetNewElement('query');
				$(elem).append(cdata);
				_xmlNode.find('>values')[0].replaceChild(elem, _xmlNode.find(">values>query")[0]);
			} catch (err) {
				iLog("SetQuery", err, Log.Type.Error);
			}
		};
		this.GetQueryParams = function () {
			try {
				var params = [];
				_xmlNode.find(">values>param").each(function () {
					var param = $(this);
					var n = param.find(">n").text();
					var t = param.find(">t").text().toUpperCase();
					var v = param.find(">v").text();
					params.push(new QueryParam(n, t, v));
				});
				return params;
			} catch (err) {
				iLog("GetQueryParams", err, Log.Type.Error);
			}
		};
		this.SetQueryParams = function (params) {
			try {
				var i, j, n1, n2;
				var names = [];
				
				// Clean the XML
				var old = _xmlNode.find(">values>param");
				for (i = 0; i < old.length; i++)
					self.DeleteParam(0);
				
				// Add only parameters with a name
				for (i = 0; i < params.length; i++) {
					n1 = Utilities.Trim(params[i].Name);
					if (n1) {
						self.AddParam(params[i]);
						names.push(n1);
					}
				}
				// Check they are unique
				for (i = 0; i < names.length; i++) {
					n1 = names[i].toUpperCase();
					for (j = 0; j < names.length; j++) {
						n2 = names[j].toUpperCase();
						if (j != i && n2 == n1) {
							jAlert("The parameter '" + names[i] + "' is used more than once!");
							return;
						}
					}
				}
			} catch (err) {
				iLog("SetQueryParams", err, Log.Type.Error);
			}
		};
	}
	
	return SELECTQUERY;
});

define('rules/CDATABatch', ['RuleXML'], function (RuleXML) {
	function CDATABatch() {
		var arr = [];

		function Pair(e, v) {
			this.e = e;
			this.v = v;
		}

		this.Add = function (elem, value) {
			arr[arr.length] = new Pair(elem, value);
		};
		this.Process = function () {
			for (var i = 0; i < arr.length; i++) {
				RuleXML.ReplaceCDATA(arr[i].e, arr[i].v);
			}
		};
	}
	
	return CDATABatch;
});

define('rules/comp/Set', ['rules/BaseComponent', 'PropertyFields', 'RuleXML', 'rules/CDATABatch'], function (BaseComponent, PropertyFields, RuleXML, CDATABatch) {
	function SET() {
		this.inheritFrom = BaseComponent;
		this.inheritFrom();

		this.Src = "../../images/RuleSET.png";
		this.Title = "Multi Set Component";
		this.ToolTip = "Create, modify, or delete multiple variables with string expressions";

		var logClassName = "Set.";
		var self = this;
		var _xmlNode = null;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place + "." + self.GetID(), Message, Type, Silent);
		}
		function Param(Name, Value) {
			this.Name = Name;
			this.Value = Value;
		}

		/* PUBLIC METHODS */

		this.Create = function () {
			try {
				this.BaseCreate();
				this.SetType("SET");
				_xmlNode = this.GetNode();
				var values = $(_xmlNode.find('>values')[0]);
				values.append(RuleXML.GetNewElement('n'));
				values.append(RuleXML.GetNewElement('v'));
			} catch (err) {
				iLog("Create", err, Log.Type.Error);
			}
		};
		this.Load = function (xmlNode) {
			try {
				_xmlNode = $(xmlNode);
				this.BaseLoad(_xmlNode);
			} catch (err) {
				iLog("Load", err, Log.Type.Error);
			}
		};
		this.AddParam = function (paramObj) {
			try {
				var values = $(_xmlNode.find(">values")[0]);
				var elm;
				
				elm = RuleXML.GetNewElement('n');
				values.append(elm);
				if (paramObj)
					$(elm).html(RuleXML.GetNewCDATA(Utilities.Trim(paramObj.Name)));
				
				elm = RuleXML.GetNewElement('v');
				values.append(elm);
				if (paramObj)
					$(elm).html(RuleXML.GetNewCDATA(paramObj.Value));
			} catch (err) {
				iLog("AddParam", err, Log.Type.Error);
			}
		};
		this.DeleteParam = function (ParamIndex) {
			try {
				var n = _xmlNode.find(">values>n")[ParamIndex];
				var v = _xmlNode.find(">values>v")[ParamIndex];
				n.parentNode.removeChild(n);
				v.parentNode.removeChild(v);
			} catch (err) {
				iLog("DeleteParam", err, Log.Type.Error);
			}
		};
		this.Search = function (str, options) {
			try {
				iLog("Search", "Called", Log.Type.Info);
				this.HighlightAsFound(false);
				if (!str)
					return;

				var re = Utilities.MakeRegExp(str, options);
				if (this.GetID().search(re) > -1 || this.GetComment().search(re) > -1) {
					iLog("Search", this, Log.Type.Search);
					return;
				};
				var arr = this.GetParams();
				for (var i = 0; i < arr.length; i++) {
					if (arr[i].Name.search(re) > -1 || arr[i].Value.search(re) > -1) {
						iLog("Search", this, Log.Type.Search);
						return;
					}
				}
			} catch (err) {
				iLog("Search", err, Log.Type.Error);
			}
		};
		this.GetProperties = function () {
			try {
				var p = this.GetBaseProperties();
				var args = new RulesMaker.ComplexArgs(this.GetProperties, null, null);
				p.push(new PropertyEd.Property(PropertyFields["SetParams"], this.GetParams, this.SetParams, args));

				return p;
			} catch (err) {
				iLog("GetProperties", err, Log.Type.Error);
			}
		};
		this.GetParams = function () {
			try {
				var params = [];
				_xmlNode.find(">values>n").each(function () {
					var n = $(this).text();
					var v = $(this).next().text();
					params[params.length] = new Param(n, v);
				});
				return params;
			} catch (err) {
				iLog("GetParams", err, Log.Type.Error);
			}
		};
		this.SetParams = function (params) {
			try {
				var i, n1;
				
				// Clean the XML
				var old = _xmlNode.find(">values>n");
				for (i = 0; i < old.length; i++)
					self.DeleteParam(0);
				
				// Add only variables with a name
				for (i = 0; i < params.length; i++) {
					n1 = Utilities.Trim(params[i].Name);
					if (n1)
						self.AddParam(params[i]);
				}
			} catch (err) {
				iLog("SetParams", err, Log.Type.Error);
			}
		};
	}
	
	return SET;
});

define('rules/comp/Template', ['rules/BaseComponent', 'PropertyFields', 'RuleXML'], function (BaseComponent, PropertyFields, RuleXML) {
	function TEMPLATE() {
		this.inheritFrom = BaseComponent;
		this.inheritFrom();

		this.Src = "../../images/RuleTEMPLATE.png";
		this.Title = "Template Component";
		this.ToolTip = "Delivers a template to the specified screen target WITHOUT executing the pre-process function";

		var logClassName = "Template.";
		var self = this;
		var _xmlNode = null;

		/* PRIVATE METHODS */

		function iLog(Place, Message, Type, Silent) {
			Log.Add(logClassName + Place + "." + self.GetID(), Message, Type, Silent);
		}

		/* PUBLIC METHODS */

		this.Create = function () {
			try {
				this.BaseCreate();
				this.SetType("TEMPLATE");
				_xmlNode = this.GetNode();
				var values = $(_xmlNode.find('>values')[0]);
				values.append(RuleXML.GetNewElement('n'));
				values.append(RuleXML.GetNewElement('t'));
			} catch (err) {
				iLog("Create", err, Log.Type.Error);
			}
		};
		this.Load = function (xmlNode) {
			try {
				_xmlNode = $(xmlNode);
				this.BaseLoad(_xmlNode);
			} catch (err) {
				iLog("Load", err, Log.Type.Error);
			}
		};
		this.Search = function (str, options) {
			try {
				iLog("Search", "Called", Log.Type.Info);
				this.HighlightAsFound(false);
				if (!str)
					return;

				var re = Utilities.MakeRegExp(str, options);
				if (this.GetID().search(re) > -1 || this.GetComment().search(re) > -1 || this.GetName().search(re) > -1 || this.GetTarget().search(re) > -1) {
					iLog("Search", this, Log.Type.Search);
				}
			} catch (err) {
				iLog("Search", err, Log.Type.Error);
			}
		};
		this.GetProperties = function () {
			try {
				var p = this.GetBaseProperties();
				p.push(new PropertyEd.Property(PropertyFields["Name"], this.GetName, this.SetName));
				p.push(new PropertyEd.Property(PropertyFields["Target"], this.GetTarget, this.SetTarget));

				return p;
			} catch (err) {
				iLog("GetProperties", err, Log.Type.Error);
			}
		};
		this.GetName = function () {
			try {
				return $(_xmlNode.find(">values>n")[0]).text();
			} catch (err) {
				iLog("GetName", err, Log.Type.Error);
			}
		};
		this.GetTarget = function () {
			try {
				return $(_xmlNode.find(">values>t")[0]).text();
			} catch (err) {
				iLog("GetTarget", err, Log.Type.Error);
			}
		};
		this.SetName = function (newName) {
			try {
				$(_xmlNode.find(">values>n")[0]).text(newName);
			} catch (err) {
				iLog("SetName", err, Log.Type.Error);
			}
		};
		this.SetTarget = function (newTarget) {
			try {
				$(_xmlNode.find(">values>t")[0]).text(newTarget);
			} catch (err) {
				iLog("SetTarget", err, Log.Type.Error);
			}
		};
	}
	
	return TEMPLATE;
});
