// Demo code
{
    var MyGridDef = {
        gridName: divid,
        loadVRMName: 'AGTCOMM_HISTORY',
        sessionID: '#SID#',
        serverSidePaging: false,
        pageable: false,
        virtualmode: false,
        persistQueryParams: '#SPolicyPersistParams#',
        jqxDataObj: {
            datafields: [
                { name: 'sCT_Code' },
                { name: 'sCT_Name' },
                { name: 'ProcessDate' },
                { name: 'CommAmtLink' }
            ]
        },
        jqxGridObj: {
            columns: [
                { text: 'Agency Code', datafield: 'sCT_Code' },
                { text: 'Agency Name', datafield: 'sCT_Name' },
                { text: 'Print Date', datafield: 'ProcessDate', width: 100 },
                { text: 'Total', datafield: 'CommAmtLink', enabletooltips: 0 }
            ]
        }
    };
    MyJQXGrid = new jqxDataPagerGrid(MyGridDef);
}

function jqxDataPagerGrid(gridDef) {
    this.gridDef = gridDef;
    with(this) {
        var clearAllState = false;
        if (gridDef.gridDIV == null) {
            gridDef.gridDIV = 'DIV_' + gridDef.gridName + '_GRID';
        }

        if (gridDef.ajaxURL == null) {
            if (gridDef.loadVRMName == null) {
                gridDef.loadVRMName = $("#middle").attr("vrmname") + '.max';
            }
            if (gridDef.loadVRMName != null) {
                if ((gridDef.loadVRMName.toLowerCase().indexOf('.max') > -1) && (gridDef.loadVRMName.toLowerCase().indexOf('.max') == (gridDef.loadVRMName.length - 4))) {
                    gridDef.ajaxURL = gridDef.loadVRMName + '?ID=' + gridDef.sessionID;
                } else {
                    gridDef.ajaxURL = gridDef.loadVRMName + '.max?ID=' + gridDef.sessionID;
                }
            }
            if ((gridDef.ajaxPreProcess != false) || (gridDef.ajaxPreProcess == null)) {
                gridDef.ajaxURL = gridDef.ajaxURL + '&PREPROCESS=true';
            }

            if (gridDef.ajaxNojqxDataPagerBranch != true) {
                gridDef.ajaxURL = gridDef.ajaxURL + '&JQXDATAPAGER=1';
            }
            if (gridDef.ajaxNojqxGridNameBranch != true) {
                gridDef.ajaxURL = gridDef.ajaxURL + '&JQXGRIDNAME=' + gridDef.gridName;
            }
        }
        if (gridDef.addAjaxURL != null) {
            gridDef.ajaxURL = gridDef.ajaxURL + gridDef.addAjaxURL;
        }

        this.gridDIVObj = jQ('#' + gridDef.gridDIV);
        var CHNode = null;
        var dSelectAllcb = null;
        var selectIDArray = [];
        var singleIDSelection = null;
        var LoadAllURLParameter = '';


        if (gridDef.serverSidePaging != true) {
            LoadAllURLParameter = '&JQXGRIDLOADALL=1';
        }

        function clearAllSelections(inclFullLoad, exceptIndex) {
            if ((inclFullLoad) || (gridDef.serverSidePaging)) {
                clearAllState = true;
                gridDIVObj.jqxGrid('clearselection');
                singleIDSelection = null;
                if (exceptIndex != null) {
                    var boundindex = gridDIVObj.jqxGrid('getrowboundindex', exceptIndex);
                    gridDIVObj.jqxGrid('selectrow', boundindex);
                }
                clearAllState = false;
            }
        }

        function selectAllUpdateArray() {
            if (gridDef.serverSidePaging) {
                //prevent page clicks during select all.
                progress('showall');
                var gridRowCount = gridDIVObj.jqxGrid('getdatainformation').rowscount;
                jQ.post(gridDef.ajaxURL + '&JQXGRIDSELECTALL=1', getFilterSortandPersistURL(), function(data) {
                    if (data.Rows.length != gridRowCount) { gridDIVObj.jqxGrid('updatebounddata', 'cells'); }
                    selectIDArray.length = 0;
                    for (var i = 0; i < data.Rows.length; i++) {
                        selectIDArray[i] = eval('data.Rows[i].' + gridDef.jqxDataObj.id);
                    }
                    gridDIVObj.jqxGrid('selectallrows');
                    progress();
                }, 'json');
            } else {
                gridDIVObj.jqxGrid('selectallrows');
            }

        }

        function checkCurrentPageSelections() {
            if (gridDef.selection == 'cbWPageSelectAll') {
                var datainfo = gridDIVObj.jqxGrid('getdatainformation');
                var pagesize = datainfo.paginginformation.pagesize;
                var pagenum = datainfo.paginginformation.pagenum;
                var selectedRows = gridDIVObj.jqxGrid('getselectedrowindexes');
                var state = false;
                var select = '';
                var count = 0;
                jQ.each(selectedRows, function() {
                    if (pagenum * pagesize <= this && this < pagenum * pagesize + pagesize) {
                        count++;
                    }
                });

                if (count != 0) {
                    state = false;
                    select = 'select';
                } //set NULL for tri check state
                if (count == pagesize) {
                    state = true;
                    select = 'unselect';
                } //set NULL for tri check state
                if (count == 0) {
                    state = false;
                    select = 'select';
                } //set NULL for tri check state

                CHNode = gridDIVObj.find('#mocb' + gridDef.gridDIV);
                //CHNode.prop('checked', state);
                if (state) {
                    CHNode.prop('pageselectall', '0');
                } else {
                    CHNode.prop('pageselectall', '1');
                }
                CHNode.prop('title', 'Click to ' + select + ' all rows on current page.');

                //$(columnCheckBox).jqxCheckBox({ checked: state });

            }
        }

        function currentPageSelection(action) {
            progress('showall');
            CHNode.prop('checked', false);

            var pageinfo = gridDIVObj.jqxGrid('getpaginginformation');
            var pagenum = pageinfo.pagenum;
            var pagesize = pageinfo.pagesize;

            // update cells values.
            var act = 'unselectrow';
            if (action == true) {
                act = 'selectrow';
                CHNode.prop('pageselectall', '0');
            } else {
                CHNode.prop('pageselectall', '1');
            }
            var startrow = pagenum * pagesize;
            for (var i = startrow; i < startrow + pagesize; i++) {
                // The bound index represents the row's unique index.
                // Ex: If you have rows A, B and C with bound indexes 0, 1 and 2, afer sorting, the Grid will display C, B, A i.e the C's bound index will be 2, but its visible index will be 0.
                // The code below gets the bound index of the displayed row and updates the value of the row's available column.
                var boundindex = gridDIVObj.jqxGrid('getrowboundindex', i);
                gridDIVObj.jqxGrid(act, boundindex);
            }
            progress();

        }

        //Function used for Select All
        function getFilterSortandPersistURL() {
            var allfilterinfo = gridDIVObj.jqxGrid('getfilterinformation');
            var filterinfostring = '';
            var filtercounter = -1;
            var groupcounter = -1;
            var persistparamsstring = '';
            var keyfieldnamestring = '';

            if ((gridDef.persistQueryParams != null) && (gridDef.persistQueryParams != '')) {
                persistparamsstring = 'JQXGRIDPERSISTPARAMS=' + gridDef.persistQueryParams;
            }

            if ((gridDef.jqxDataObj.id != null) && (gridDef.jqxDataObj.id != '')) {
                keyfieldnamestring = 'JQXGRIDSELECTKEYFIELD=' + gridDef.jqxDataObj.id + '&';
            }

            jQ.each(allfilterinfo, function(i, group) {
                groupcounter++;
                var groupdatafield = group.filtercolumn; //datafield;
                var groupoperator = group.filter.operator;
                filterinfostring = filterinfostring + '' + groupdatafield + 'operator=' + groupoperator + '&';
                var filterinfo = group.filter.getfilters();
                jQ.each(filterinfo, function(x, filter) {
                    filtercounter++;
                    jQ.each(filter, function(name, value) {
                        filterinfostring = filterinfostring + 'filter' + name + filtercounter + '=' + value + '&';
                    });
                    filterinfostring = filterinfostring + 'filterdatafield' + filtercounter + '=' + groupdatafield + '&';
                });
            });
            if (groupcounter > -1) {
                filterinfostring = filterinfostring + 'filterscount=' + (filtercounter + 1) + '&';
                filterinfostring = filterinfostring + 'groupscount=' + (groupcounter) + '&';
            }
            var allsortinfo = gridDIVObj.jqxGrid('getsortinformation');
            var sortinfostring = '';
            var sortcolumn = allsortinfo.sortcolumn;
            if (sortcolumn != null) {
                sortinfostring = 'sortdatafield=' + sortcolumn + '&';

                if (allsortinfo.sortdirection.ascending) {
                    sortinfostring = sortinfostring + 'sortorder=asc' + '&';
                } else {
                    sortinfostring = sortinfostring + 'sortorder=desc' + '&';
                }

            }
            var sortandfilterinfo = filterinfostring + sortinfostring + keyfieldnamestring + persistparamsstring;
            return encodeURI(sortandfilterinfo);
        }

        function customGridChanges() {

            if ((gridDef.selection == 'cbWPageSelectAll') || (gridDef.selection == 'cbWODataSelectAll') || (gridDef.selection == 'cbSingleRow')) {
                CHNode = gridDIVObj.find('.jqx-grid-column-header:first');
                if (gridDef.selection == 'cbWPageSelectAll') {
                    var cNode = CHNode.clone(false);
                    CHNode.replaceWith(cNode, CHNode);
                    CHNode = gridDIVObj.find('.jqx-grid-column-header:first');
                    CHNode.html('<div style="height: 100%; width: 100%;"><div style="cursor: pointer; margin-left: 5px; top: 50%; margin-top: -8px; position: relative; width: 16px; height: 16px; line-height: 16px;" id="DIVmob' + gridDef.gridDIV + '" ><input title="Click to select all rows on current page." id="mocb' + gridDef.gridDIV + '" type="checkbox" pageselectall="1"></div></div>');
                    CHNode = gridDIVObj.find('#mocb' + gridDef.gridDIV);
                    CHNode.change(function() { currentPageSelection(CHNode.prop('pageselectall') == '1'); }); //is(':checked'));} );
                    checkCurrentPageSelections();
                } else {
                    CHNode.children().hide(); //hide default Select All button
                }
            } else {
                if (gridDef.selection == 'cbWDataSelectAll') {
                    // utilize select all using selectionmode default checkbox
                    dSelectAllcb = jQ('#' + gridDef.gridDIV + ' .jqx-grid-header .jqx-checkbox-default').click(function(event) {
                        if (gridDef.serverSidePaging) {
                            if (event.toElement.getElementsByClassName('jqx-checkbox-check-checked').length > 0) //Checked																	   
                            //																	 if (event.toElement.firstChild.className == 'jqx-checkbox-check-checked') //Checked
                            {
                                selectAllUpdateArray();
                            } else //Not Checked
                            {

                                selectIDArray.length = 0;
                                //clearAllSelections(true);
                                jQ('#' + gridDef.gridDIV).jqxGrid('clearselection');
                            }
                        }
                    });
                    dSelectAllcb.prop('title', 'Click to select/unselect all data rows.');
                }
            }
        }


        //----------------------------Source
        function createSource() {
            var tempDataAdapterParamObj = {
                datafields: [
                    { name: '__RowNum', type: 'int' }
                ],
                //URL for AJAX Call.
                url: gridDef.ajaxURL + LoadAllURLParameter,
                id: gridDef.keyFieldName,
                type: 'POST',
                datatype: 'json',
                //Location of data rows within Resulting JSON
                root: 'Rows',
                formatData: function(data) {
                    $.extend(data, {
                        //Additional Parameters you can send to AJAX call in POST...Not in URL.  They load as #S vars
                        JQXGRIDPERSISTPARAMS: gridDef.persistQueryParams
                    });
                    return data;

                },
                beforeprocessing: function(data) {
                    if (data != null) {
                        //Set Source.totalrecords per jqxgrid.
                        gridDef.jqxDataObj.totalrecords = data.TotalRows;
                    }
                },
                filter: function() {
                    // update the grid and send a request to the server.
                    clearAllSelections();
                    gridDIVObj.jqxGrid('updatebounddata', 'filter');
                },
                sort: function() {
                    // update the grid and send a request to the server.
                    clearAllSelections();
                    gridDIVObj.jqxGrid('updatebounddata', 'sort');
                }

            };

            //set defaults
            if (gridDef.jqxDataObj.formatData != null) {
                var tempformatData = tempDataAdapterParamObj.formatData;
                tempDataAdapterParamObj.formatData = function() {
                    tempformatData.call();
                    gridDef.jqxDataObj.formatData.call();
                };
            }
            if (gridDef.jqxDataObj.beforeprocessing != null) {
                var tempbeforeprocessing = tempDataAdapterParamObj.beforeprocessing;
                tempDataAdapterParamObj.beforeprocessing = function() {
                    tempbeforeprocessing.call();
                    gridDef.jqxDataObj.beforeprocessing.call();
                };
            }
            if (gridDef.jqxDataObj.filter != null) {
                var tempfilter = tempDataAdapterParamObj.filter;
                tempDataAdapterParamObj.filter = function() {
                    tempfilter.call();
                    gridDef.jqxDataObj.filter.call();
                };
            }
            if (gridDef.jqxDataObj.sort != null) {
                var tempsort = tempDataAdapterParamObj.sort;
                tempDataAdapterParamObj.sort = function() {
                    tempsort.call();
                    gridDef.jqxDataObj.sort.call();
                };
            }
            if (gridDef.jqxGridObj.cache == null) {
                tempDataAdapterParamObj.cache = false;
            }
            jQ.merge(tempDataAdapterParamObj.datafields, gridDef.jqxDataObj.datafields);
            //make sure rownum still exists... set ID default if needed
            if ((tempDataAdapterParamObj.datafields[0].name == '__RowNum') && (tempDataAdapterParamObj.id == null)) {
                tempDataAdapterParamObj.id = '__RowNum';
            }
            jQ.extend(gridDef.jqxDataObj, tempDataAdapterParamObj);
            var transAdapter = new jQ.jqx.dataAdapter(gridDef.jqxDataObj);
            //------------------------------Source End
            return transAdapter;
        }


        //--------------------------------GRID
        var tempGridParamObj = {
            source: createSource(),
            virtualmode: gridDef.serverSidePaging,
            ready: function() {
                //	customGridChanges();
            },
            rendergridrows: function(params) {
                return params.data;
            },
            rendered: function(type) {

                if ((type == "rows")) {
                    customGridChanges();
                }
            }
        };

        //set defaults
        if (gridDef.jqxGridObj.ready != null) {
            var tempready = tempGridParamObj.ready;
            tempGridParamObj.ready = function() {
                tempready.call();
                gridDef.jqxGridObj.ready.call();
            };
        }
        if (gridDef.jqxGridObj.rendergridrows != null) {
            var temprendergridrows = tempGridParamObj.rendergridrows;
            tempGridParamObj.rendergridrows = function() {
                temprendergridrows.call();
                gridDef.jqxGridObj.rendergridrows.call();
            };
        }
        if (gridDef.jqxGridObj.rendered != null) {
            var temprendered = tempGridParamObj.rendered;
            tempGridParamObj.rendered = function() {
                temprendered.call();
                gridDef.jqxGridObj.rendered.call();
            };
        }
        if (gridDef.jqxGridObj.pagesize == null) {
            tempGridParamObj.pagesize = 10;
        }
        if (gridDef.jqxGridObj.pagesizeoptions == null) {
            tempGridParamObj.pagesizeoptions = ['10', '25', '50'];
        }
        if (gridDef.jqxGridObj.filterable == null) {
            tempGridParamObj.filterable = true;
        }
        if (gridDef.jqxGridObj.sortable == null) {
            tempGridParamObj.sortable = true;
        }
        if (gridDef.jqxGridObj.autoheight == null) {
            tempGridParamObj.autoheight = true;
        }
        if (gridDef.jqxGridObj.pageable == null) {
            tempGridParamObj.pageable = true;
        }
        if (gridDef.jqxGridObj.columnsresize == null) {
            tempGridParamObj.columnsresize = true;
        }
        if (gridDef.jqxGridObj.altrows == null) {
            tempGridParamObj.altrows = true;
        }
        if (gridDef.jqxGridObj.width == null) {
            tempGridParamObj.width = '100%';
        }
        if (gridDef.jqxGridObj.sortable == null) {
            tempGridParamObj.sortable = true;
        }
        if (gridDef.jqxGridObj.enabletooltips == null) {
            tempGridParamObj.enabletooltips = true;
        }

        var customSelection = false;
        if ((gridDef.selection == 'cbWODataSelectAll') || (gridDef.selection == 'cbWPageSelectAll') || (gridDef.selection == 'cbWDataSelectAll') || (gridDef.selection == 'cbSingleRow')) {
            customSelection = true;
        } else {
            customSelection = false;
            gridDef.jqxGridObj.selectionmode = gridDef.selection;
        }
        if ((customSelection == false) && (gridDef.jqxGridObj.selectionmode == 'checkbox')) {
            gridDef.selection = 'cbWODataSelectAll';
        } else {
            if (customSelection == true) {
                tempGridParamObj.selectionmode = 'checkbox';
            } else {
                if ((customSelection == false) && (gridDef.jqxGridObj.selectionmode == null)) {
                    tempGridParamObj.selectionmode = 'none';
                }
            }
        }






        var selectionmodecheckbox = false;
        if (gridDef.jqxGridObj.selectionmode == 'checkbox') {
            selectionmodecheckbox = true;
        }
        jQ.extend(gridDef.jqxGridObj, tempGridParamObj);
        gridDIVObj.jqxGrid(gridDef.jqxGridObj);
        //--------------------------Grid End


        if (gridDef.selection == 'cbWPageSelectAll') {
            gridDIVObj.on("pagechanged", function(event) {
                checkCurrentPageSelections();
            });
        }

        gridDIVObj.on('rowselect', function(event) {
            if ((gridDef.selection == 'cbSingleRow') && (clearAllState == false)) {

                clearAllSelections(true, event.args.rowindex);
            }

            if (gridDef.serverSidePaging) {
                if (event.args.row != null) //Do not run if select all
                {
                    if (gridDef.jqxGridObj.selectionmode == 'singlerow') {
                        singleIDSelection = event.args.row.uid;
                    } else {
                        //var selectedRowID = event.args.rowindex;
                        selectIDArray[event.args.rowindex] = event.args.row.uid; //gridDIVObj.jqxGrid('getrowid', selectedRowID);
                        checkCurrentPageSelections();
                    }
                }
            } else {
                if (event.args.row != null) //Do not run if select all
                {
                    checkCurrentPageSelections();
                }

            }
        });

        gridDIVObj.on('rowunselect', function(event) {
            if (gridDef.serverSidePaging) {
                if (event.args.row != null) //Do not run if select all
                {
                    var selectedRowID = event.args.rowindex;
                    selectIDArray[selectedRowID] = null;
                    if (CHNode != null) {
                        CHNode.prop('checked', false);
                        CHNode.prop('title', 'Click to select all rows on current page.');
                    }
                } else {
                    selectIDArray.length = 0;
                }
            } else {
                if (event.args.row != null) //Do not run if select all
                {
                    if (gridDef.selection == 'cbWPageSelectAll') {
                        if (CHNode != null) {
                            CHNode.prop('checked', false);
                            CHNode.prop('title', 'Click to select all rows on current page.');
                        }
                    }
                }
            }
        });
    }







    //Use to bind to extra buttons for select all and clear all selections
    this.selectAll = function() {
        selectAllUpdateArray();
    };

    this.unselectAll = function() {
        clearAllSelections(true);
    };



    this.refresh = function(type) {
        with(this) {
            if (type == 'full') {
                var gridDIVObj = jQ('#' + gridDef.gridDIV);
                gridDIVObj.jqxGrid('updatebounddata');
            }
        }
    };


    this.getSelectedIDs = function(field) { //field is only available if grid is not serverSidePaging

        with(this) {
            if (gridDef.serverSidePaging) {
                var onlySelectedIDs = [];
                var counter = 0;
                if (gridDef.jqxGridObj.selectionmode == 'singlerow') {
                    onlySelectedIDs[counter] = singleIDSelection;
                } else {

                    for (var i = 0; i < selectIDArray.length; i++) {
                        if (selectIDArray[i] != null) {
                            onlySelectedIDs[counter] = selectIDArray[i];
                            counter++;
                        }
                    }
                }
                return onlySelectedIDs;
            } else {
                selectIDArray.length = 0;
                var getselectedrowindexes = gridDIVObj.jqxGrid('getselectedrowindexes');
                if (getselectedrowindexes.length > 0) {
                    // returns the selected row's data.
                    if (field != null) {
                        var rowdata = null;
                        for (var i = 0; i < getselectedrowindexes.length; i++) {
                            rowdata = gridDIVObj.jqxGrid('getrowdata', getselectedrowindexes[i]);
                            selectIDArray[i] = eval('rowdata.' + field);
                        }

                    } else {
                        for (var i = 0; i < getselectedrowindexes.length; i++) {
                            selectIDArray[i] = gridDIVObj.jqxGrid('getrowid', getselectedrowindexes[i]);
                        }

                    }
                }
                return selectIDArray;
            }
        }
    };



    this.changeSource = function(newGridDef) {
        with(this) {
            gridDIVObj.jqxGrid({ source: createSource() });
            gridDef = newGridDef;
        }
    };


    this.progress = function(showHide) {
        with(this) {

            if (showHide == 'showgrid') {
                gridDIVObj.jqxGrid('showloadelement');
            } else {
                if (showHide == 'showall') {
                    Global.ShowProgress();
                    gridDIVObj.jqxGrid('showloadelement');
                } else {
                    if (showHide == 'hidegrid') {
                        gridDIVObj.jqxGrid('hideloadelement');
                    } else {
                        Global.HideProgress();
                        gridDIVObj.jqxGrid('hideloadelement');
                    }
                }
            }

        }
    };

}