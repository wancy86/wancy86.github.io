if exists ( select  *
            from    sys.objects as o
            where   o.name = 'fn_Common_GetAge' )
    drop function fn_Common_GetAge
go

create function [dbo].[fn_Common_GetAge]
    (
     @BeginDate datetime ,
     @EndDate datetime
    )
returns int
as
    begin
        declare @result int = 0 
        set @EndDate = isnull(nullif(@EndDate, ''), getdate()) 
        declare @begin int = convert(varchar(100), @BeginDate, 112) ,
            @end int = convert(varchar(100), @EndDate, 112)
        set @result = (@end - @begin) / 10000
        return @result		 
    end

go
