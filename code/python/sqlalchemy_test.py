# 导入:
from sqlalchemy import Column, String, create_engine, Integer
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# 创建对象的基类:
Base = declarative_base()

# 定义User对象:
class User(Base):
    # 表的名字:
    __tablename__ = 'user'

    # 表的结构:
    id = Column(Integer, primary_key=True)
    name = Column(String(20))
    age = Column(Integer)


# 初始化数据库连接:
engine = create_engine('mysql+pymysql://root:max123@localhost:3306/test')
# 创建DBSession类型:
DBSession = sessionmaker(bind=engine)

# 添加数据
if True:
    # 创建session对象:
    session = DBSession()
    # 创建新User对象:
    new_user1 = User(name='Bob', age=18)
    session.add(new_user1)  # 插入新数据
    
    new_user2 = User(id=16, name='Jim', age=32)
    session.merge(new_user2)  # replace into, 需要主键, 存在就更新, 否则插入新的

    session.commit()
    session.close()

# 删除数据
if True:
    session = DBSession()

    # 1. 使用query对象删除
    session.query(User).filter(User.id==1).delete()

    # 2. 使用session删除
    users = session.query(User).filter(User.id==2)
    if users.count()>0:
        session.delete(users)

    session.commit()
    session.close()

# 更新数据
if True:
    session = DBSession()

    # 1. query update
    session.query(User).filter(User.name=='Bob').update({User.name:'Bob Smith'})

    # 2. session update
    users = session.query(User).filter(User.name=='Mark')
    for user in users:
        user.name = user.name + ' Xiao'
    if users.count()>0:
        session.merge(users)

    session.commit()
    session.close()

if True:
    session = DBSession()
    sql = '''
    select * from user
    where name = '{}';
    '''
    sql.format('Mark Xiao')
    data = session.execute(sql)
    print(type(data))
    print(dir(data))