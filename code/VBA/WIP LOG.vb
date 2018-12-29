
'auto input date
Private Sub Worksheet_SelectionChange(ByVal Target As Range)
    If Target.Row = 1 Then
        Exit Sub
    End If
    If Target.Column = 1 Then
        If Target.Cells(1).Value = "" And Cells(Target.Row - 1, Target.Column).Value <> "" Then
           Target.Cells(1) = Date
        End If
        
    ElseIf Target.Column = 4 And Cells(Target.Row - 1, Target.Column).Value <> "" Then
        If Target.Cells(1).Value = "" Then
           For Each D In Worksheets("ListData").Range("C2:C20")
                If D.Value = 1 Then
                    Target.Cells(1) = Worksheets("ListData").Cells(D.Row, D.Column - 2).Value
                End If
           Next
        End If
    End If
    
End Sub
'generate log script for Chrome console
Sub CopyLogScript()
    Dim UsedRows%
    Dim LogInput
    Set LogInput = Worksheets("Log Input")
    
    UsedRows = Application.CountA(LogInput.Range("A:A"))
    
    If UsedRows < 2 Then
        MsgBox ("Please Input log first.")
        Exit Sub
    End If

    Dim batchLog As String, logs As String
    
    batchLog = ""
    batchLog = batchLog & "function batchLog(loglist, userid) {"
    batchLog = batchLog & "  if (!userid || userid == '' || userid <= 0) {"
    batchLog = batchLog & "    console.log('Invalid UserID');"
    batchLog = batchLog & "    return;"
    batchLog = batchLog & "  }"
    batchLog = batchLog & "  var logPromise = new Promise(function(resolve, reject) {"
    batchLog = batchLog & "    console.log('log start');"
    batchLog = batchLog & "    resolve()"
    batchLog = batchLog & "  });"
    batchLog = batchLog & "  loglist.forEach(function(log, index) {"
    batchLog = batchLog & "    logPromise = logPromise.then(function() {"
    batchLog = batchLog & "      return saveLog(log, index)"
    batchLog = batchLog & "    });"
    batchLog = batchLog & "  });"
    batchLog = batchLog & "  function saveLog(log, index) {"
    batchLog = batchLog & "    return new Promise(function(resolve, reject) {"
    batchLog = batchLog & "      var d;"
    batchLog = batchLog & "      if (log.length == 3) {"
    batchLog = batchLog & "        d = new Date();"
    batchLog = batchLog & "        d = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();"
    batchLog = batchLog & "      } else {"
    batchLog = batchLog & "        d = log[4];"
    batchLog = batchLog & "      }"
    batchLog = batchLog & "      var data = {"
    batchLog = batchLog & "        WL_UserId: userid,"
    batchLog = batchLog & "        TaskNumber: log[0],"
    batchLog = batchLog & "        WorkLogTypeId: log[1],"
    batchLog = batchLog & "        WorkDone: log[2],"
    batchLog = batchLog & "        WL_Description: log[3],"
    batchLog = batchLog & "        WorkLogDateTime: d,"
    batchLog = batchLog & "        SubmitAct: 'WL_Save'"
    batchLog = batchLog & "      };"
    batchLog = batchLog & "      setTimeout(function(data) {"
    batchLog = batchLog & "        Communication.CustomRequest('WIP_WORKLOGENTRY.max?' + $.param(data), function(resp) {"
    batchLog = batchLog & "          console.log('log saved:', new Date(), data);"
    batchLog = batchLog & "          resolve();"
    batchLog = batchLog & "        });"
    batchLog = batchLog & "      }, Math.random() * 1000 * 60 * 3, data);"
    batchLog = batchLog & "    })"
    batchLog = batchLog & "  }"
    batchLog = batchLog & "}"

    Dim WorkDate$, SpendTime&, LogContent$
    Dim UserID As Long, BillTypeID As Long, WIP As Long
    UserID = GetUserID(Range("G2").Value) 'user id
    
    logs = batchLog & "var loglist = ["
    
    For i = 2 To LogInput.Range("A2:A36").Rows.Count
        WorkDate = Cells(i, 1).Value
        WIP = Cells(i, 2).Value
        SpendTime = Cells(i, 3).Value
        BillTypeID = GetLogTypeID(Cells(i, 4).Value) ' billable
        LogContent = Cells(i, 5).Value
        
        If WorkDate = "" Then
            Exit For
        End If

        If UserID <> 0 And WIP <> 0 And WorkDate <> "" And SpendTime <> 0 And BillTypeID <> 0 And LogContent <> "" Then
           logs = logs & "[" & WIP & "," & BillTypeID & "," & SpendTime & "," & """" & LogContent & """" & "," & """" & WorkDate & """" & "],"
        End If
    Next
    
    logs = logs & "];batchLog(loglist, " & UserID & ");"
    
    'copy to clipboard
    Dim MyData As New DataObject
    MyData.SetText logs
    MyData.PutInClipboard
    
    Range("I3") = logs
    
    MsgBox ("Log Script generated! Please paste and run in Chrome console!")

End Sub
 
 'save log to Archive Log sheet and clear
Sub ArchiveLog()

    Application.ScreenUpdating = False
    
    Dim UsedRows%, UsedRows2%
    
    Dim ArchivedLogs, LogInput
    Set ArchivedLogs = Worksheets("ArchivedLogs")
    Set LogInput = Worksheets("Log Input")
    
    'LogInput.Select
    UsedRows = Application.CountA(LogInput.Range("A:A"))
    If UsedRows < 2 Then
        MsgBox ("No Log")
        Exit Sub
    End If
    UsedRows2 = Application.CountA(ArchivedLogs.Range("A:A")) + Application.CountA(ArchivedLogs.Range("F:F"))
   
    Dim linestart
    Set linestart = ArchivedLogs.Range("A" & UsedRows2)
    
    
    LogInput.Range("A2:E" & UsedRows).Copy (linestart)
    
    UsedRows2 = Application.CountA(ArchivedLogs.Range("A:A")) + Application.CountA(ArchivedLogs.Range("F:F"))
    ArchivedLogs.Range("F" & UsedRows2) = LogInput.Range("G4").Value
    
    LogInput.Range("A2:E" & UsedRows).ClearContents
    MsgBox ("Log saved to ArchiveLog sheet!")
    
End Sub


Function GetUserID(UserName As String) As Integer
    Dim uid As Integer
    uid = 0
    
    For Each user In Worksheets("ListData").Range("F2:F36")
        If user.Value = UserName Then
            uid = Worksheets("ListData").Cells(user.Row, user.Column + 1).Value
            Exit For
        End If
    Next
    GetUserID = uid
End Function


Function GetLogTypeID(LogType As String) As Integer

    Dim btid As Integer
    btid = 0
    
    For Each bt In Worksheets("ListData").Range("A2:A36")
        If bt.Value = LogType Then
            btid = Worksheets("ListData").Cells(bt.Row, bt.Column + 1).Value
            Exit For
        End If
    Next
    GetLogTypeID = btid
End Function

'Copy Files to QA SVN
Sub CopyToQA()
    Dim orgStr As String
    orgStr = Range("A26").Value
    
    Dim a As Variant
    Dim b As Variant
    Dim tmp$, finalStr$, sqlStr$
    finalStr = ""
    sqlStr = ""
    
    a = Split(orgStr, Chr(10))
    b = UBound(a)
    
    For i = 0 To b
       a(i) = """" & a(i) & """"
       tmp = "echo f| xcopy " & a(i) & " " & Replace(a(i), "mtstingray_agcs", "mtstingray_agcs_qa") & " /S /E /Y"
       finalStr = finalStr & tmp & Chr(10)
       
       If InStr(1, a(i), ".sql") > 0 Then
            sqlStr = sqlStr & "copy " & a(i) & " /Y" & Chr(10)
       End If
      
    Next
    
    If Len(sqlStr) > 0 Then
            sqlStr = "cd /d C:\Users\Administrator\Desktop\SQL\" & Chr(10) & "del *.sql" & Chr(10) & sqlStr
            finalStr = finalStr & sqlStr
    End If
    
    Range("I26").Value = finalStr
    
    'set content to clipboard
    Dim MyData1 As New DataObject
    MyData1.Clear
    MyData1.SetText finalStr
    MyData1.PutInClipboard
    
    MsgBox ("Done! Please paste and run in CMD.")
    
End Sub



