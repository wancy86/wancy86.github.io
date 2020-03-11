var p = new Promise(function(resolve, reject) {
    resolve()
})

function task(ind) {
    p = p.then(
        function() {
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    console.log('step 1: ', ind, parseInt(ind / 4));
                    resolve(ind)
                }, 500)
            }).then(
                function(index) {
                    return new Promise(function(resolve, reject) {
                        setTimeout(function() {
                            console.log('step 2: ', index, parseInt(index / 4));
                            resolve(index)
                        }, 500)
                    })
                }
            ).then(function(index) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        console.log('step 3: ', index, parseInt(index / 4));
                        resolve(index)
                    }, 500)
                })
            })
        })
}

for (var i = 1; i <= 6; i++) {
    task(i)
}