 
 
----------------------------------------------------------------------------------------
---SplitString
---------------------------------------------------------------------------------------- 
 IF EXISTS
  (SELECT *
   FROM sys.objects
   WHERE name = 'SplitString'
     AND TYPE in('FN', 'TF'))
DROP FUNCTION dbo.SplitString
GO

CREATE FUNCTION SplitString
(    
      @Input NVARCHAR(MAX),
      @Character CHAR(1)
)
RETURNS @Output TABLE (
      Item NVARCHAR(1000)
)
AS
BEGIN
      DECLARE @StartIndex INT, @EndIndex INT
 
      SET @StartIndex = 1
      IF SUBSTRING(@Input, LEN(@Input) - 1, LEN(@Input)) <> @Character
      BEGIN
            SET @Input = @Input + @Character
      END
 
      WHILE CHARINDEX(@Character, @Input) > 0
      BEGIN
            SET @EndIndex = CHARINDEX(@Character, @Input)
           
            INSERT INTO @Output(Item)
            SELECT SUBSTRING(@Input, @StartIndex, @EndIndex - 1)
           
            SET @Input = SUBSTRING(@Input, @EndIndex + 1, LEN(@Input))
      END
 
      RETURN
end

go



----------------------------------------------------------------------------------------
---fn_SplitString
----------------------------------------------------------------------------------------
if exists ( select  *
            from    sys.objects
            where   name = 'fn_SplitString' and
                    type = 'TF' ) 
    drop function fn_SplitString
go


create function fn_SplitString
(
 @string varchar(max)
 /* level one */
,@splitA char(1)
/* level two */
,@splitB char(1)
)
returns @result table
(
 [dkey] varchar(1000)
,[dvalue] varchar(1000)
)
as 
begin
	set @string = isnull(@string,'')
    declare @item varchar(200), @position int, @id int = 1
    set @string = @string + @splitA

    while 1 = 1
        begin
            set @position = charindex(@splitA, @string, 1)
            if @position <= 1 break;
            set @item = substring(@string, 1, @position - 1)
            insert  into @result([dkey], [dvalue] ) values  ( @id, @item )
            set @id = @id + 1
            set @string = substring(@string, @position + 1, 100000)
        end
	if @splitB > ''
		update @result
		set dkey = case when  charindex(@splitB,dvalue,1) >= 1 then substring(dvalue,1,charindex(@splitB,dvalue,1)-1) else dkey end,
			dvalue = substring(dvalue,charindex(@splitB,dvalue,1)+1,100000)
					
    return    
end

go


print 'fn_SplitString has been sucessfully created.'

--select * from dbo.fn_SplitString('a,b,c',',',null)
--select * from dbo.fn_SplitString('a=1,b=2,c=3',',','=')