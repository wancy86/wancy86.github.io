// javascript中GetAge, 计算年龄

function getAge(DOB, end_day) {
    var start = new Date(DOB);
    var end = new Date(end_day||new Date());

    var age = end.getFullYear() - 1 - start.getFullYear();

    if ((end.getMonth() > start.getMonth()) || (end.getMonth() == start.getMonth() && end.getDate() >= start.getDate()))
        age += 1;

    return age;
}

/*
console.log(getAge('1986-11-06','2010-01-10'));//23
console.log(getAge('1986-11-06',new Date()));//28
console.log(getAge('06/11/1986'));//CN - 29
console.log(getAge('11/06/1986'));//28
console.log(getAge(new Date('1983/11/06'),'1986-11-06'));//3
*/