var root = document.getElementById('root');
m.render(root, "Hello world");
var searchTxt = '',
    cacheTxt = '',
    tmpTxt = '';

var ziplistView = {
    view: function() {
        return m('.container', [
            m('.row',
                m('.col-md-12',
                    m('h3.title', 'ZIPCode Lookup'))),
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
                    // m('button#serachBtn', {
                    //     onclick: (e) => {
                    //         console.log('xxx: ', e);
                    //         m.redraw();
                    //     }
                    // }, 'Search')
                ])),
            m('.row',
                m('.col-md-12', [
                    m('table.table .table-striped .table-bordered', [
                        m('thead', [
                            m('th', 'State'),
                            m('th', 'City'),
                            m('th', 'ZipCode'),
                            m('th', 'Territory'),
                            m('th', 'County'),
                            m('th', 'ISOCode')
                        ]),
                        m('tbody',
                            zipcodes.map(function(zip, index, arr) {
                                // { 'State': 'RI', 'City': 'Adamsville', 'ZipCode': '02801', 'Territory': '106', 'County': ', 'ISOCode': '1' },
                                if ((searchTxt == '' && index < 15) || (searchTxt != '' && zip.searchtxt.indexOf(searchTxt) >= 0)) {
                                    return m('tr', [
                                        m('td', zip.State),
                                        m('td', zip.City),
                                        m('td', zip.ZipCode),
                                        m('td', zip.Territory),
                                        m('td', zip.County),
                                        m('td', zip.ISOCode)
                                    ])
                                }
                            }))
                    ])
                ]))
        ])

    }
}

m.mount(root, ziplistView);