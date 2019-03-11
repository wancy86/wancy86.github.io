var root = document.getElementById('root');
m.render(root, "Hello world");
var searchTxt = '',
    cacheTxt = '',
    tmpTxt = '';

var listView = {
    view: function() {
        return m('.container', [
            m('.row',
                m('.col-md-12',
                    m('h3.title', 'State Lookup'))),
            m('.row',
                m('.col-md-12', [
                    m('.form-group',
                        m('input#searchTxt .form-control', {
                            placeholder: 'Search text',
                            oninput: m.withAttr("value", function(value) {
                                cacheTxt = value;
                                setTimeout(function() {
                                    tmpTxt = value;
                                    if (cacheTxt != '' && cacheTxt == tmpTxt) {
                                        searchTxt = value;
                                    }else{
                                        searchTxt = '';
                                    }
                                    searchTxt = searchTxt.toUpperCase();
                                    m.redraw();
                                }, 400)
                            })
                        })),
                ])),
            m('.row',
                m('.col-md-12', [
                    m('table.table .table-striped .table-bordered', [
                        m('thead', [
                            m('th', 'State'),
                            m('th', 'Desc')
                        ]),
                        m('tbody',
                            stateData.map(function(item, index, arr) {
                                // { 'State': 'RI', 'Desc': 'Adamsville'},
                                if ((searchTxt == '' && index < 15) || (searchTxt != '' && item.searchtxt.indexOf(searchTxt) >= 0)) {                                    
                                    return m('tr', [
                                        m('td', item.State),
                                        m('td', item.Desc),
                                    ])
                                }
                            }))
                    ])
                ]))
        ])

    }
}

m.mount(root, listView);