# -*- coding: utf8 -*-
import xlrd

fname = r"C:\Users\mark1\Desktop\test.xlsx"
bk = xlrd.open_workbook(fname)
shxrange = range(bk.nsheets)

try:
    sh = bk.sheet_by_name("Sheet1")
    # sh = bk.sheets()[0]
except:
    print("no sheet in %s named Sheet1" % fname)

# 获取行数
nrows = sh.nrows
# 获取列数
ncols = sh.ncols
# print("nrows %d, ncols %d" % (nrows, ncols))
# 获取第一行第一列数据
cell_value = sh.cell_value(1, 1)
# print(cell_value)

row_list = []
# 获取各行数据
for i in range(1, nrows):
    row_data = sh.row_values(i)
    row_list.append(row_data)

# print('----------------------------')
# 生成导入数据库的SQL脚本
str1 = ',('
for x in range(nrows):
    for y in range(ncols):
        str1 += "'" + str(sh.cell_value(x, y)).replace("'", r"''") + "', "
    str1 += ')'
    str1 = str1.replace(", )", ")")
    print(str1)
    str1 = ',('

# 不必太纠结, 后期处理下int类型的后缀.0
